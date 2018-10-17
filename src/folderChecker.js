const _ = require('underscore');
const fs = require('fs-extra');
const path = require('path');

/**
 * getNewPath
 * @param {String} filename 
 * 
 * This function returns the updated path name for the folder
 */
function getNewPath(filename) {
   let base = path.basename(filename);

   return `${__dirname}/${filename.replace(base, '')}/../updatedImages/${base}`;
}

/**
 * diveInFolders
 * @param {Array} files 
 * 
 * This function goes through and analyzes the specific folder and if it doesn't
 * have two files inside the folder, it'll push the course name to the 
 * discrepanciesArray that will be returned.
 */
async function diveInFolders(files) {
   let discrepanciesArray = [];

   for (const file of files) {
      try {
         let results = await fs.readdir(getNewPath(file));

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
(async () => {
   const filepath = './updatedImages';

   try {
      let results = await fs.readdir(filepath);
      let discrepanciesArray = await diveInFolders(results);

      if (discrepanciesArray.length) {
         console.log('Discrepancies found: ', discrepanciesArray);
      } else {
         console.log('No discrepancies found...');
      }
   } catch (ex) {
      if (ex) {
         console.log(ex);
         return;
      }
   }
})();