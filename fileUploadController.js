const csv = require('csv-parser');
const stream = require('stream');

exports.uploadFile = (req, res) => {
    if(!req.file) return res.status(400).send('No file received');

    //configure readable stream
    const readableStream = new stream.Readable();
    readableStream._read = () => {}; // _read is required but we can leave it empty
    readableStream.push(req.file.buffer); // Pushing the file buffer into the stream
    readableStream.push(null); // No more data after the buffer

    const linePromises = [];

    readableStream.pipe(csv()).on('data', (chunk) => {console.log(chunk)});
}