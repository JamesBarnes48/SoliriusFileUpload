const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app.js');
const nock = require('nock');

chai.use(chaiHttp);

describe('General Testing', function () {
  it('Invalid routes should respond with 404', function (done) {
    chai.request(app)
    .post('/tester')
    .end((err, res) => {
        chai.expect(res).to.have.status(404);
        chai.expect(res.text).to.equal('Not Found');
        done();
    });
  })
})

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

    it('Should be able to accept an uploadID', function (done) {
      chai.request(app)
      .post('/upload')
      .attach('csvFile', './test/fixtures/testFile.csv')
      .field('uploadID', 'testID')
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

    it('Should respond with server error if validation server errors', function(done) {
      const validationServer = nock('http://localhost:3000')
        .get('/validate')
        .query({ email: 'john@example.com' })
        .replyWithError('test message');

      //single row file prevent nock-related errors
      chai.request(app)
      .post('/upload')
      .attach('csvFile', './test/fixtures/singleRowFile.csv')
      .end((err, res) => {
        chai.expect(res).to.have.status(500);
        chai.expect(res.text).to.match(/.*Validation server error.*/);

        validationServer.done();
        nock.cleanAll();
        done();
      });
    })
  })
});

describe('GET /status/:uploadID', function() {
  this.timeout(6000);

  describe('Success Cases', function() {
    it('Should return a JSON response of the current status of the POST /upload query', function (done) {
      chai.request(app)
      .post('/upload')
      .attach('csvFile', './test/fixtures/largeTestFile.csv')
      .field('uploadID', 'testID')
      .end((err, res) => {});

      //ensure /upload has started before checking status
      setTimeout(() => {
        chai.request(app)
        .get('/status/testID')
        .end((err, res) => {
          chai.expect(res).to.have.status(200);
          chai.expect(res.body).to.be.an('object');
          chai.expect(res.body).to.have.all.keys('totalRecords', 'failedRecords', 'processedRecords', 'details');
          chai.expect(res.body.details).to.be.an('array');
  
          done();
        })
      }, 2000)
    });

    describe('Error Cases', function() {
      it('Should return an error when fetching an uploadID that doesnt exist', function (done) {
        chai.request(app)
        .get('/status/testID')
        .end((err, res) => {
          chai.expect(res).to.have.status(400);
          chai.expect(res.text).to.equal('No upload found for uploadID')
  
          done();
        });
      });

      it('Should return an error when no uploadID provided', function (done) {
        chai.request(app)
        .get('/status')
        .end((err, res) => {
          chai.expect(res).to.have.status(404);
          chai.expect(res.text).to.equal('Not Found');
  
          done();
        });
      });
    });
  });
});