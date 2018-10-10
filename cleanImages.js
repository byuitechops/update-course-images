const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const asyncLib = require('async');

function prepFiles(files) {
   //strip all (1), (2) or anything of like that and then removes all '.jpg'
   return files.map(ele => ({
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

      let filesArray = breakFiles(prepFiles(files).map(file => splitName(file)));

      retrieveFilesCallback(null, filesArray);
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

function createDirectory(filesArray, createDirectoryCallback) {
   let path = './updatedImages';

   fs.mkdir(path, (err) => {
      if (err) {
         createDirectoryCallback(err);
         return;
      }

      createListOfDirectories(path, filesArray);
      moveFiles(path, filesArray, (err) => {
         if (err) {
            console.error(err);
            return;
         }

         createDirectoryCallback(null);
      });
   });
}

function createListOfDirectories(path, filesArray) {
   filesArray.map(file => fs.mkdirSync(`${path}/${file[0]}`));
}

function moveFiles(path, filesArray, moveFilesCallback) {
   asyncLib.each(filesArray, (files, eachCallback) => {
      console.log(files);
      callback(null);
   }, (eachErr) => {
      if (eachErr) {
         moveFilesCallback(eachErr);
         return;
      }

      moveFilesCallback(null);
   });

   // let oldPath = './images';
   // filesArray.map(files => Object.keys(files[1]).forEach(key => {
   //    fs.rename(`${oldPath}/${files[1][key].path}`, `${path}/${files[1][key].path}`, (err) => {
   //       if (err) {
   //          console.log(err);
   //          return;
   //       }

   //       console.log(`Success: moved ${oldPath}/${files[1][key].path} to ${path}/${files[1][key].path}`);
   //    })
   // }));
}

function breakFiles(files) {
   return _.pairs(_.groupBy(files, 'course'));
}

(() => {
   const functions = [
      retrieveFiles,
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