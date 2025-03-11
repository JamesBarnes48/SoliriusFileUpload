exports.test = (req, res) => {
    res.send('peee')
}

exports.uploadFile = (req, res) => {
    if(!req.file) return res.status(400).send('No file received');

    console.info('yer file');
    console.info(req.file);
    res.send('lol');
}