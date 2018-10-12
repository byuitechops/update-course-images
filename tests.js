const fs = require('fs');
const expect = require('chai').expect;

describe('cleanImages.js', function () {
   describe('image folder', function () {
      it('should have no images at all in /images folder', function () {
         fs.readdir('./images', function (err, files) {
            if (err) {
               console.error(err);
               return;
            }

            expect(files).to.have.lengthOf(0);
         });
      });
   });

   describe('updatedImages folder', function () {
      it('should have 1,336 files in /updatedImages folder', function () {
         fs.readdir('./updatedImages', function (err, files) {
            if (err) {
               console.error(err);
               return;
            }

            console.log(files.length);
            expect(files.length).equals(1336);
         });
      });
   });
});