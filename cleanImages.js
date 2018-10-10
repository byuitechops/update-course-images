const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const asyncLib = require('async');

const tempArr = [
   'acctg100_dashboard (1).jpg',
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
   'acctg499_homeimage.jpg'
];

function prepFiles(files) {
   //strip all (1), (2) or anything of like that and then removes all '.jpg'
   return tempArr.map(ele => ({
      'file': removeDuplicateTag(path.basename(ele, '.jpg')), //get name without duplicate tag and file extension
      'path': ele //preserve file path
   }));
}

function removeDuplicateTag(file) {
   return (file.match(/(\(|\))/gmi)) ? file.slice(0, file.indexOf('(')).trim() : file;
}

function retrieveFiles(retrieveFilesCallback) {
   const path = './images';

   fs.readdir(path, (err, files) => {
      if (err) {
         retrieveFilesCallback(err);
         return;
      }

      let newFiles = prepFiles(files);
      let practiceFiles = breakFiles(newFiles.map(newFile => splitName(newFile)));
      console.log(JSON.stringify(practiceFiles));

      retrieveFilesCallback(null, newFiles);
   });
}

function splitName(name) {
   let nameSplit = name.file.toLowerCase().split('_');
   let course = nameSplit[0];
   let type = nameSplit[1];
   let path = name.path;

   return {
      course,
      type,
      path
   };
}

function createDirectory(createDirectoryCallback) {
   let path = './updatedImages';

   fs.mkdir(path, (err) => {
      if (err) {
         createDirectoryCallback(err);
         return;
      }

      let something = createListOfDirectories();
      createDirectoryCallback(null);
   });
}

function createListOfDirectories() {
   let files = prepFiles([]);
   let newFiles = breakFiles(files.map(file => splitName(file)));
   let path = './updatedImages';

   //fs.mkdirSync(`${path}/${file}`)
   newFiles.forEach(file => fs.mkdirSync(`${path}/${file[0]}`));
}

function breakFiles(files) {
   return _.pairs(_.groupBy(files, 'course'));
}

(() => {
   const functions = [
      // retrieveFiles
      createDirectory
   ];

   asyncLib.waterfall(functions, (err, results) => {
      if (err) {
         console.log(err);
         return;
      }

      // console.log(results);
      console.log('Renamed each file successfully.');
      return;
   });
})();