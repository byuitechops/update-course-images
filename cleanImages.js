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
   const path = `./images`;

   fs.readdir(path, (err, files) => {
      if (err) {
         retrieveFilesCallback(err);
         return;
      }

      let filesArray = breakFiles(prepFiles(files).map(file => splitName(file)));

      console.log(`Successfully formatted files`);
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
   let newPath = `./updatedImages`;

   fs.mkdir(newPath, (err) => {
      if (err) {
         createDirectoryCallback(err);
         return;
      }

      console.log(`Successfully created a directory to hold all files`);
      createDirectoryCallback(null, newPath, filesArray);
   });
}

function createListOfDirectories(path, filesArray, createListOfDirectoriesCallback) {
   asyncLib.each(filesArray, (file, eachCallback) => {
      fs.mkdir(`${path}/${file[0]}`, (err) => {
         if (err) {
            eachCallback(err);
            return;
         }

         eachCallback(null);
      });
   }, (err) => {
      if (err) {
         createListOfDirectoriesCallback(err);
         return;
      }

      console.log(`Successfully created directories for all courses.`);
      createListOfDirectoriesCallback(null, path, filesArray);
   });
}

function moveFiles(path, filesArray, moveFilesCallback) {
   let oldPath = './images';

   asyncLib.each(filesArray, (files, eachCallback) => {
      let errorThrew = null;
      Object.keys(files[0]).forEach(key => {
         if (files[1][key]) {
            fs.rename(`${oldPath}/${files[1][key].path}`, `${path}/${files[0]}/${files[1][key].path}`, (err) => {
               if (err) {
                  errorThrew = err;
                  return;
               }

               console.log(`Success: moved ${oldPath}/${files[1][key].path} to ${path}/${files[0]}/${files[1][key].path}`);
            });
         }
      });

      if (errorThrew) eachCallback(errorThrew);

      eachCallback(null);
   }, (eachErr) => {
      if (eachErr) {
         moveFilesCallback(eachErr);
         return;
      }

      moveFilesCallback(null);
   });
}

function breakFiles(files) {
   return _.pairs(_.groupBy(files, 'course'));
}

(() => {
   const functions = [
      retrieveFiles,
      createDirectory,
      createListOfDirectories,
      moveFiles
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