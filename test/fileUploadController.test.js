const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app.js');

chai.use(chaiHttp);

describe('POST /upload', function () {
  this.timeout(8000);

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
});