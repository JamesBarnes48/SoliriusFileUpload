const csv = require('csv-parser');
const stream = require('stream');

exports.uploadFile = (req, res) => {
    if(!req.file) return res.status(400).send('No file received');

    //configure readable stream
    const readableStream = new stream.Readable();
    readableStream._read = () => {}; // _read is required but we can leave it empty
    readableStream.push(req.file.buffer); 
    readableStream.push(null); 

    const linePromises = [];
    readableStream.pipe(csv()).on('data', (row) => {linePromises.push(processLine(row))});

    Promise.all(linePromises);
}

const processLine = async (line) => {
    console.log('processing line:');
    console.log(line);
}