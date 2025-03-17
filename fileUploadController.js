const csv = require('csv-parser');
const axios = require('axios');
const stream = require('stream');
const pLimit = require('p-limit');
const crypto = require('crypto');
const {logger} = require('./utils/logger.js');

const currentlyUploading = new Map();

exports.uploadFile = async (req, res) => {    
    //req.file is undefined when either not supplied or the file supplied is not csv
    if(!req.file){
        logger.log('error', 'POST /upload error: No valid file received');
        return res.status(400).send('No valid file received');
    }

    //generate upload id and allocate space for blank upload stats
    const uploadID = req.body.uploadID || crypto.randomUUID();
    currentlyUploading.set(uploadID, {totalRecords: 0, processedRecords: 0, failedRecords: 0, details: []});

    //configure readable stream
    const readableStream = new stream.Readable();
    readableStream._read = () => {}; // _read is required but we can leave it empty
    readableStream.push(req.file.buffer); 
    readableStream.push(null); 

    const linePromises = [], limit = pLimit(5);
    readableStream.pipe(csv())
        .on('data', (row) => {linePromises.push(limit(() => processLine(row, uploadID)))})
        .on('end', async () => {
            try{
                await Promise.all(linePromises);
            }catch(err){
                //could either handle errors line-by-line inside processLine or break out of Promise.all by handling them here
                //figure that if an axios error occurs for one line then its likely to occur for all, therefore break out
                currentlyUploading.delete(uploadID);
                logger.log('error', 'POST /upload error:' + err.message);
                return res.status(500).send('Validation server error: ' + err.message);
            }
            //finalise upload stats and wipe from variable
            const final = currentlyUploading.get(uploadID);
            currentlyUploading.delete(uploadID);
            res.json(final);
        });
}

const processLine = async (line, uploadID) => {
    const uploadStats = currentlyUploading.get(uploadID);
    uploadStats.totalRecords++;
    if(!line.email){
        uploadStats.failedRecords++;
        uploadStats.details.push({...line, error: 'No email provided'});
        return;
    }
    const isValid = await axios.get(`http://localhost:3000/validate`, {params: {email: line.email}, timeout: 5000});
    if(!!isValid.data?.valid) uploadStats.processedRecords++;
    else{
        uploadStats.failedRecords++;
        uploadStats.details.push({...line, error: 'Invalid email format'});
    }
}

//NOTE: likely need to reduce p-limit to be able to grab status in time!
exports.checkStatus = (req, res) => {
    if(!req.params.uploadID) return res.status(400).send('No uploadID provided');
    const { uploadID } = req.params;
    const foundUpload = currentlyUploading.get(uploadID);
    if(foundUpload) return res.json(foundUpload)
    res.status(400).send('No upload found for uploadID')
}