const csv = require('csv-parser');
const axios = require('axios');
const stream = require('stream');
const pLimit = require('p-limit');

exports.uploadFile = async (req, res) => {
    if(!req.file) return res.status(400).send('No file received');

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
            const validationResults = await Promise.all(linePromises);

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
    try{
        const isValid = await axios.get(`http://localhost:3000/validate`, {params: {email: line.email}});
        return {line: line, valid: !!isValid.data?.valid, error: !isValid.data?.valid? 'Invalid Email Format': null}
    }catch(err){
        //little different to spec - think this handles odd errors without disrupting the whole thing and outputs them in the details fields (seems to be that field's whole purpose)
        //for ui app would prob console.log the error and return a generic message in the response for security but api users want more detail
        return {line: line, valid: false, error: err.message};
    }
    
    
}