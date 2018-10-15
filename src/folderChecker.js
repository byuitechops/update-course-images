const _ = require('underscore');
const fs = require('fs');
const walk = require('walk');

/**
 * groupFolders
 * @param {Array} - array of objects to group by 
 * 
 */
function groupFolders(arr) {
   return _.groupBy(arr, 'parent');
}

/**
 * This function simply "walks" through each directory inside
 * updatedImages folder and lists all of the folders that are not
 * meeting the rules. This is to ensure that each folder is done 
 * correctly and that we are catching all discrepancies. 
 */
(async () => {
   const filepath = '../updatedImages';
   let walker = walk.walk(filepath);
   let arrayDirectories = [];

   walker.on('file', (root, stats, next) => {
      arrayDirectories.push({
         'parent': root,
         'file': stats.name
      });

      next();
   });

   walker.on('error', (root, stats, next) => {
      next();
   });

   walker.on('end', () => {
      arrayDirectories = groupFolders(arrayDirectories);
      let entries = [];

      Object.keys(arrayDirectories).forEach(ele => {
         if (arrayDirectories[ele].length !== 2) entries.push(arrayDirectories[ele]);
      });

      console.log('Directory Folders with discrepancies:')
      console.log(entries);
   });
})();