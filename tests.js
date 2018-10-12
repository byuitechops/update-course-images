const fs = require('fs');
const chai = require('chai');
const assert = require('chai').assert;
const expect = require('chai').expect;
const canvas = require('canvas-api-wrapper');
const uploadCanvas = require('./uploadCanvas');

chai.use(require('chai-like'));
chai.use(require('chai-things'));

describe('cleanImages.js', function () {
   describe('image folder', function () {
      it('should have no images at all in /images folder', function (done) {
         fs.readdir('./images', function (err, files) {
            expect(files).to.have.lengthOf(0);
            done();
         });
      });
   });

   describe('updatedImages folder', function () {
      it('should have 1,336 files in /updatedImages folder', function (done) {
         fs.readdir('./updatedImages', function (err, files) {
            //FIX THIS!!!!!!!!!!!!!!!!!!!!!!!!!!
            expect(files).to.have.lengthOf(1341);
            done();
         });
      });
   });
});

describe('uploadCanvas.js', function () {
   describe('uploading', function () {
      const goodFilename = 'testingimage.jpg';
      const badFilename = './testingimage.jpg';
      const courseId = 21050;

      it('should upload the file directly to Canvas course - must have CANVAS_API_TOKEN set', function () {
         return new Promise((resolve) => {
            uploadCanvas.beginUpload()
               .then(results => {
                  assert.ok(results)
                  resolve();
               });
         });
      }).timeout(20000);

      it('should find the updated file in response array when server makes GET files call to the course', function () {
         return new Promise((resolve) => {
            canvas.get(`/api/v1/courses/${courseId}/files`)
               .then(results => {
                  expect(results).to.be.an('array').that.contains.something.like({
                     filename: goodFilename
                  });

                  // expect(results).to.be.an('array').that.does.not.contain.something.like({
                  //    filename: badFilename
                  // });
               });
         });
      }).timeout(20000);
   });
});