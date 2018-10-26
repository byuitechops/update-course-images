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
      // describe('uploading', function () {
      //    const goodFilename = 'homeimage.jpg';
      //    const badFilename = 'badtestingimage.jpg';

      //    it('should upload the file directly to Canvas course - must have CANVAS_API_TOKEN set', function () {
      //       return new Promise(async resolve => {
      //          const response = await uploadCanvas.beginUpload(COURSES);

      //          if (response) resolve();
      //       });
      //    }).timeout(20000);

      //    Promise.all(COURSES.map(async course => {
      //       it(`should find the updated file in response array in course: ${course.id}`, function () {
      //          return new Promise((resolve) => {
      //             canvas.get(`/api/v1/courses/${course.id}/files`)
      //                .then(results => {
      //                   expect(results).to.be.an('array').that.contains.something.like({
      //                      filename: goodFilename
      //                   });
      //                   resolve();
      //                });
      //          });
      //       }).timeout(20000);
      //    }));
      // });
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