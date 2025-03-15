const winston = require('winston');

//import this file to easily replicate this config
exports.logger = new winston.Logger({
    level: 'info',
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            name: 'combined-logs',
            filename: 'combined.log',
            level: 'info'
        }),
        new (winston.transports.File)({
            name: 'error-logs',
            filename: 'error.log',
            level: 'error'
        })
    ],
  });