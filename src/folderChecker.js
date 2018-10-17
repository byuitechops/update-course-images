const _ = require('underscore');
const fs = require('fs-extra');
const path = require('path');

/**
 * getNewPath
 * @param {String} filename 
 * @param {String} filePath
 * 
 * This function returns the updated path name for the folder
 */
function getNewPath(filename, filePath) {
   let base = path.basename(filename);

   return `${__dirname}/${filename.replace(base, '')}/../${filePath}/${base}`;
}

/**
 * diveInFolders
 * @param {Array} files 
 * 
 * This function goes through and analyzes the specific folder and if it doesn't
 * have two files inside the folder, it'll push the course name to the 
 * discrepanciesArray that will be returned.
 */
async function diveInFolders(files, filePath) {
   let discrepanciesArray = [];

   for (const file of files) {
      try {
         let results = await fs.readdir(getNewPath(file, filePath));

         if (results.length !== 2) discrepanciesArray.push(file);
      } catch (ex) {
         if (ex) {
            console.log(ex);
            return;
         }
      }
   }

   return discrepanciesArray;
}

/** 
 * This function goes through updatedImages and retrieves the array of folders to pass into 
 * diveFolders to analyze the folders to ensure that only two files exist in each folder - 
 * dashboard and home images.
 */
async function initiateChecker(testBadFolder = false) {
   try {
      let filePath = (!testBadFolder) ? './updatedImages' : './updatedImages-test';
      let results = await fs.readdir(filePath);
      let discrepanciesArray = await diveInFolders(results, filePath);

      return discrepanciesArray;
   } catch (ex) {
      if (ex) {
         console.log(ex);
         return;
      }
   }
};

initiateChecker();

module.exports = {
   initiateChecker,
   diveInFolders
}