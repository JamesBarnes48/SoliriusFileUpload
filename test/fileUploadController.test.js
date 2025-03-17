const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app.js');

chai.use(chaiHttp);

describe('POST /upload', function () {
  this.timeout(8000);

  describe('Success Cases', function() {
    it('Should return a JSON response when supplied a valid csv file', function (done) {
      chai.request(app)
      .post('/upload')
      .attach('csvFile', './test/fixtures/testFile.csv')
      .end((err, res) => {
          chai.expect(res).to.have.status(200);
          chai.expect(res.body).to.be.an('object');
          chai.expect(res.body).to.have.all.keys('totalRecords', 'failedRecords', 'processedRecords', 'details');
          chai.expect(res.body.details).to.be.an('array');
          done();
      });
    });
  
    it('Should return a JSON response when supplied with a larger valid csv file, identifying the correct number of valid emails', function (done) {
      chai.request(app)
      .post('/upload')
      .attach('csvFile', './test/fixtures/largeTestFile.csv')
      .end((err, res) => {
          chai.expect(res).to.have.status(200);
          chai.expect(res.body).to.be.an('object');
          chai.expect(res.body).to.have.all.keys('totalRecords', 'failedRecords', 'processedRecords', 'details');
          chai.expect(res.body.details).to.be.an('array');
          
          chai.expect(res.body.processedRecords).to.equal(3);
          chai.expect(res.body.failedRecords).to.equal(4);
          done();
      });
    });

    it('Should return a JSON response showing zero records processed when supplied with an empty csv file', function (done) {
      chai.request(app)
      .post('/upload')
      .attach('csvFile', './test/fixtures/emptyFile.csv')
      .end((err, res) => {
          chai.expect(res).to.have.status(200);
          chai.expect(res.body).to.be.an('object');
          chai.expect(res.body).to.have.all.keys('totalRecords', 'failedRecords', 'processedRecords', 'details');
          chai.expect(res.body.details).to.be.an('array');
          
          chai.expect(res.body.totalRecords).to.equal(0);
          chai.expect(res.body.processedRecords).to.equal(0);
          chai.expect(res.body.failedRecords).to.equal(0);
          done();
      });
    });
  });

  describe('Error Cases', function() {
    it('Should respond with bad request if no file provided', function (done) {
      chai.request(app)
      .post('/upload')
      .end((err, res) => {
          chai.expect(res).to.have.status(400);
          chai.expect(res.text).to.equal('No valid file received');
          done();
      });
    });

    it('Should respond with bad request if non-csv file provided', function (done) {
      chai.request(app)
      .post('/upload')
      .attach('csvFile', './test/fixtures/wrongFormat.txt')
      .end((err, res) => {
          chai.expect(res).to.have.status(400);
          chai.expect(res.text).to.equal('No valid file received');
          done();
      });
    });
  })
});