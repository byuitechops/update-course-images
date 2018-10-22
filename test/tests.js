const fs = require('fs');
const chai = require('chai');
const expect = require('chai').expect;
const canvas = require('canvas-api-wrapper');
const uploadCanvas = require('../src/uploadCanvas');
const folderChecker = require('../src/folderChecker');

chai.use(require('chai-like'));
chai.use(require('chai-things'));

const COURSES = [{
      'id': 21050,
      'path': 'homeimage.jpg'
   },
   {
      'id': 26934,
      'path': 'homeimage.jpg'
   },
   {
      'id': 26972,
      'path': 'homeimage.jpg'
   },
   {
      'id': 26974,
      'path': 'homeimage.jpg'
   }
];

describe('update-course-images', function () {
   describe('cleanImages.js', function (done) {
      describe('image folder', function () {
         it('should have no images at all in /images folder', function (done) {
            fs.readdir('./images', function (err, files) {
               expect(files).to.have.lengthOf(0);
               done();
            });
         });
      });

      describe('updatedImages folder', function () {
         it('should have 1,337 files in /updatedImages folder', function (done) {
            fs.readdir('./updatedImages', function (err, files) {
               expect(files).to.have.lengthOf(1334);
               done();
            });
         });
      });
   });

   describe('uploadCanvas.js', function () {
      describe('uploading', function () {
         const goodFilename = 'homeimage.jpg';
         const badFilename = 'badtestingimage.jpg';

         it('should upload the file directly to Canvas course - must have CANVAS_API_TOKEN set', function () {
            return new Promise((resolve) => {
               uploadCanvas.beginUpload(COURSES)
                  .then(results => {
                     resolve();
                  });
            });
         }).timeout(20000);

         it(`should find the updated file in response array in course: ${COURSES[0].id}`, function () {
            return new Promise((resolve) => {
               canvas.get(`/api/v1/courses/${COURSES[0].id}/files`)
                  .then(results => {
                     expect(results).to.be.an('array').that.contains.something.like({
                        filename: goodFilename
                     });
                     resolve();
                  });
            });
         }).timeout(20000);

         it(`should find the updated file in response array in course: ${COURSES[1].id}`, function () {
            return new Promise((resolve) => {
               canvas.get(`/api/v1/courses/${COURSES[1].id}/files`)
                  .then(results => {
                     expect(results).to.be.an('array').that.contains.something.like({
                        filename: goodFilename
                     });
                     resolve();
                  });
            });
         }).timeout(20000);

         it(`should find the updated file in response array in course: ${COURSES[2].id}`, function () {
            return new Promise((resolve) => {
               canvas.get(`/api/v1/courses/${COURSES[2].id}/files`)
                  .then(results => {
                     expect(results).to.be.an('array').that.contains.something.like({
                        filename: goodFilename
                     });
                     resolve();
                  });
            });
         }).timeout(20000);

         it(`should find the updated file in response array in course: ${COURSES[3].id}`, function () {
            return new Promise((resolve) => {
               canvas.get(`/api/v1/courses/${COURSES[3].id}/files`)
                  .then(results => {
                     expect(results).to.be.an('array').that.contains.something.like({
                        filename: goodFilename
                     });
                     resolve();
                  });
            });
         }).timeout(20000);
      });
   });

   describe('folderChecker.js', function () {
      it('should be empty', function () {
         return new Promise(resolve => {
            folderChecker.initiateChecker()
               .then(results => {
                  expect(results).to.be.empty;
                  resolve();
               });
         });
      }).timeout(20000);

      it('should have 16 entries in discrepancies array upon making updatedImages with less than two files in a folder', function () {
         //A special updatedImages folder exist to test if it actually
         //returns an array of all "invalid" course folders
         return new Promise(resolve => {
            folderChecker.initiateChecker(true)
               .then(results => {
                  expect(results).to.have.lengthOf(16);
                  resolve();
               });
         });
      }).timeout(20000);
   });
});