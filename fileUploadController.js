exports.test = (req, res) => {
    res.send('peee')
}

exports.uploadFile = (req, res) => {
    console.info('yer file');
    console.info(req.file);
    res.send('lol');
}