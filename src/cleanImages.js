const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const asyncLib = require('async');

//constants
const PATH = `../images`;
const NEWPATH = `../updatedImages`;

/**
 * prepFiles
 * @param {Array} files 
 * 
 * This function goes through and cleans all paths inside files array to make the cleaning up easier.
 */
function prepFiles(files) {
   //strip all (1), (2) or anything of like that and then removes all '.jpg'
   return files.map(ele => ({
      'file': removeDuplicateTag(path.basename(ele, '.jpg')), //get name without duplicate tag and file extension
      'path': ele //preserve file path
   }));
}

/**
 * removeDuplicateTag
 * @param {String} file 
 * 
 * This function goes through the string and if there is a (1) or something similar (Windows uses this to rename files
 * if one already exists with the same name), this function will remove the (1).
 */
function removeDuplicateTag(file) {
   return (file.match(/(\(|\))/gmi)) ? file.slice(0, file.indexOf('(')).trim() : file;
}

/**
 * retrieveFiles
 * @param {Callback} retrieveFilesCallback 
 * 
 * This function retrieves all of the files and calls the appropriate operations on the array.
 */
function retrieveFiles(retrieveFilesCallback) {
   fs.readdir(PATH, (err, files) => {
      if (err) {
         retrieveFilesCallback(err);
         return;
      }

      let filesArray = breakFiles(prepFiles(files).map(file => splitName(file)));

      console.log(`Successfully formatted files`);
      retrieveFilesCallback(null, filesArray);
   });
}

/**
 * splitName
 * @param {String} name 
 * 
 * This function returns an object of course, type and image path to help putting everything into 
 * a folder easier.
 */
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

/**
 * createDirectory
 * @param {Array} filesArray 
 * @param {Callback} createDirectoryCallback 
 */
function createDirectory(filesArray, createDirectoryCallback) {
   fs.mkdir(NEWPATH, (err) => {
      if (err) {
         createDirectoryCallback(err);
         return;
      }

      console.log(`Successfully created a directory to hold all files`);
      createDirectoryCallback(null, NEWPATH, filesArray);
   });
}

/**
 * createListOfDirectories
 * @param {String} path 
 * @param {Array} filesArray 
 * @param {Callback} createListOfDirectoriesCallback 
 * 
 * This function goes through the array and creates a subdirectory for each course inside updatedImages
 * folder. 
 */
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

/**
 * moveFiles
 * @param {String} path 
 * @param {Array} filesArray 
 * @param {Callback} moveFilesCallback 
 * 
 * This function uses the rename function of fs to "move" the files to their appropriate
 * class directory.
 */
function moveFiles(path, filesArray, moveFilesCallback) {
   asyncLib.each(filesArray, (files, eachCallback) => {
      let errorThrew = null;
      Object.keys(files[0]).forEach(key => {
         if (files[1][key]) {
            let name = files[1][key].path.toLowerCase().split('_');
            let course = name[0];
            let type = name[1];
            let newPath = '';

            //ensuring that homeimage is always homeImage since there is a bunch
            //with either name
            if (/(homeimage)+/.test(name[1])) {
               let temp = name[1].split('i');
               type = temp[0] + 'I' + temp[1];
            }

            newPath = `${course}_${type}`;

            //move the file
            fs.rename(`${PATH}/${files[1][key].path}`, `${path}/${files[0]}/${newPath}`, (err) => {
               if (err) {
                  errorThrew = err;
                  return;
               }

               console.log(`Success: moved ${PATH}/${files[1][key].path} to ${path}/${files[0]}/${newPath}`);
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

/**
 * breakFiles
 * @param {Array} files 
 * 
 * This function simply uses underscore to group the files up by course 
 * to make life easier.
 */
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