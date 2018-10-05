const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const asyncLib = require('async');

const tempArr = [
   'acctg100_dashboard.jpg',
   'acctg100_homeImage.jpg',
   'acctg180_dashboard.jpg',
   'acctg180_homeImage.jpg',
   'acctg201_dashboard.jpg',
   'acctg201_homeImage.jpg',
   'acctg202_dashboard.jpg',
   'acctg202_homeimage.jpg',
   'acctg301_dashboard.jpg',
   'acctg301_homeimage.jpg',
   'acctg302_dashboard.jpg',
   'acctg302_homeimage.jpg',
   'acctg312_dashboard.jpg',
   'acctg312_homeimage.jpg',
   'acctg321_dashboard.jpg',
   'acctg321_homeimage.jpg',
   'acctg322_dashboard.jpg',
   'acctg322_homeimage.jpg',
   'acctg333A_dashboard.jpg',
   'acctg333A_homeimage.jpg',
   'acctg333B_dashboard.jpg',
   'acctg333B_homeimage.jpg',
   'acctg344_dashboard.jpg',
   'acctg344_homeimage.jpg',
   'acctg403_dashboard.jpg',
   'acctg403_homeimage.jpg',
   'acctg456_dashboard.jpg',
   'acctg456_homeimage.jpg',
   'acctg499_dashboard.jpg',
   'acctg499_homeimage.jpg',
   'acctgLab_dashboard.jpg',
];

function prepFiles(files) {
   return files.map(ele => removeDuplicateTag(path.basename(ele, '.jpg')));
}

function removeDuplicateTag(file) {
   return file.splice(file.indexOf('(')).trim();
}

function retrieveFiles(retrieveFilesCallback) {
   const path = './images';

   fs.readdir(path, (err, files) => {
      if (err) {
         retrieveFilesCallback(err);
         return;
      }

      let newFiles = prepFiles(files);
      retrieveFilesCallback(null, newFiles);
   });
}

function splitName(name) {
   let nameSplit = name.toLowerCase().split('_');
   let course = nameSplit[0];
   let type = nameSplit[1];

   return {
      course,
      type
   };
}

function createDirectory(createDirectoryCallback) {
   let path = './updatedImages';

   fs.mkdir(path, (err) => {
      if (err) {
         createDirectoryCallback(err);
         return;
      }

      createDirectoryCallback(null);
   });
}

function breakFiles(files) {
   return _.groupBy(files, 'course');
}

(() => {
   const functions = [
      retrieveFiles
   ];

   asyncLib.waterfall(functions, (err, results) => {
      if (err) {
         console.log(err);
         return;
      }

      console.log(results);
      console.log('Renamed each file successfully.');
      return;
   });
})();