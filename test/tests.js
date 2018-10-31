const fs = require('fs');
const chai = require('chai');
const expect = require('chai').expect;
const canvas = require('canvas-api-wrapper');
const uploadCanvas = require('../src/uploadCanvas');
const folderChecker = require('../src/folderChecker');

chai.use(require('chai-like'));
chai.use(require('chai-things'));

const paths = ['dashboard.jpg', 'homeimage.jpg'];
const COURSES = [{
      'id': 26932,
      'path': paths
   },
   {
      'id': 26934,
      'path': paths
   },
   {
      'id': 26972,
      'path': paths
   },
   {
      'id': 26974,
      'path': paths
   },
   {
      'id': 26976,
      'path': paths
   },
   {
      'id': 26978,
      'path': paths
   },
   {
      'id': 26980,
      'path': paths
   }
];

describe('update-course-images', function () {
   describe('cleanImages.js test cases', function (done) {
      describe('image folder', function () {
         it('should have no images at all in /images folder', function (done) {
            fs.readdir('./images', function (err, files) {
               expect(files).to.have.lengthOf(0);
               done();
            });
         });
      });

      describe('updatedImages folder', function () {
         it('should have 1,334 (real courses) + 7 (test courses) files in /updatedImages folder', function (done) {
            fs.readdir('./updatedImages', function (err, files) {
               expect(files).to.have.lengthOf(1341);
               done();
            });
         });
      });
   });

   describe('uploadCanvas.js test cases', function () {
      expect(true).to.be.true;
   });

   describe('folderChecker.js test cases', function () {
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