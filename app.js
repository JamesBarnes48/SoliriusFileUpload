//npm packages
const express = require('express');
const multer = require('multer');

//scripts
const fileUpload = require('./fileUploadController.js');

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
        cb(new Error('Invalid file type. Only CSV files are allowed.'));
    },
});
//'name' attribute of the html input field which the csv file was uploaded into - found in req.body
const fieldName = 'csvFile';

//routes
app.post('/upload', upload.single(fieldName), fileUpload.uploadFile);