//npm packages
const express = require('express');
const multer = require('multer');
const { rateLimit } = require("express-rate-limit");

//scripts
const fileUpload = require('./fileUploadController.js');
const {logger} = require('./utils/logger.js');

//setup express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

const port = 3000;
app.listen(port, () => {console.log('app is listening on port ' + port)})

//setup multer - using memoryStorage means we dont have to save all the csvs we receive
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /csv/;
        const extname = fileTypes.test(file.originalname.toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) return cb(null, true);
        cb(null, false);
    },
});

//setup rate limiter
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 10, // each IP can make up to 10 requests per minute
    standardHeaders: 'draft-8', 
    legacyHeaders: false,
});

//'name' attribute of the html input field which the csv file was uploaded into - found in req.body
const fieldName = 'csvFile';

//logging middleware
app.use((req, res, next) => {
    logger.log('info', 'Request made to: ' + req.method + ' ' + req.url);
    next();
})

//routes
app.post('/upload', limiter, upload.single(fieldName), fileUpload.uploadFile);
app.get('/status/:uploadID', fileUpload.checkStatus);
app.get('/validate', (req, res) => {
    setTimeout(() => {
        if((req.query.email || '').includes('@')) return res.json({valid: true});
        return res.json({valid: false});
    }, 1500)
});

app.all('*', (req, res) => {
    res.status(404).send('Not Found');
});

module.exports = app;