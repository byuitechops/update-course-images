const _ = require('underscore');
const fs = require('fs-extra');
const path = require('path');

/**
 * groupFolders
 * @param {Array} - array of objects to group by 
 * 
 */
function groupFolders(arr) {
   return _.groupBy(arr, 'parent');
}

function getNewPath(filename) {
   let base = path.basename(filename);

   return `${__dirname}/${filename.replace(base, '')}/../updatedImages/${base}`;
}

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
 * This function simply "walks" through each directory inside
 * updatedImages folder and lists all of the folders that are not
 * meeting the rules. This is to ensure that each folder is done 
 * correctly and that we are catching all discrepancies. 
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