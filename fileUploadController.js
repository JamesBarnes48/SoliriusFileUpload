const csv = require('csv-parser');
const axios = require('axios');
const stream = require('stream');
const pLimit = require('p-limit');

exports.uploadFile = async (req, res) => {
    //req.file is undefined when either not supplied or the file supplied is not csv
    if(!req.file) return res.status(400).send('No valid file received');

    //configure readable stream
    const readableStream = new stream.Readable();
    readableStream._read = () => {}; // _read is required but we can leave it empty
    readableStream.push(req.file.buffer); 
    readableStream.push(null); 

    const linePromises = [], limit = pLimit(5);
    readableStream.pipe(csv())
        .on('data', (row) => {linePromises.push(limit(() => processLine(row)))})
        .on('end', async () => {
            //asynchronously validate csv rows
            let validationResults = [];
            try{
                validationResults = await Promise.all(linePromises);
            }catch(err){
                //could either handle errors line-by-line inside processLine or break out of Promise.all by handling them here
                //figure that if an axios error occurs for one line then its likely to occur for all, therefore break out
                res.status(500).send('Validation server error: ' + err.message);
                return;
            }

            //initialise object to return and populate with validationResults
            const recordStatistics = {totalRecords: 0, processedRecords: 0, failedRecords: 0, details: []}
            validationResults.forEach((result) => {
                recordStatistics.totalRecords++;
                if(result.valid) recordStatistics.processedRecords++;
                else{
                    recordStatistics.failedRecords++;
                    recordStatistics.details.push({...result.line, error: result.error});
                }
            })
            res.json(recordStatistics);
        });
}

const processLine = async (line) => {
    //expect json response - {valid: boolean}
    if(!line.email) return {line: line, valid: false, error: 'No email found'};
    const isValid = await axios.get(`http://localhost:3000/validate`, {params: {email: line.email}, timeout: 5000});
    return {line: line, valid: !!isValid.data?.valid, error: !isValid.data?.valid? 'Invalid email format': null};
}

exports.checkStatus = (req, res) => {
    const { uploadID } = req.params;
    console.log('got uploadid: ' + uploadID);
}