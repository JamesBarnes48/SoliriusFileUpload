const express = require('express');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

const port = 3000;
app.listen(port, () => {console.log('app is listening on port ' + port)})