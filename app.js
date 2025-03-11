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

//routes
app.get('/', (req, res) => {
    res.send('hello');
})