const fs = require('fs-extra');
const canvas = require('canvas-api-wrapper');

/**
 * make
 * 
 * This function gets the list of courses and passes it into createCourseArray. It'll
 * get the object array and simply return it.
 */
async function make() {
   const filepath = './updatedImages';

   let results = await fs.readdir(filepath);
   return await createCourseArray(results);
}

/**
 * createCourseArray
 * @param {Array of Course objects} courses 
 * 
 * This function reads through and creates the object array to prep the system
 * to upload files to Canvas in mass. 
 * 
 * Course Array should be like this after it finishes: 
 * [
 *    {
 *       'id': courseId,
 *       'path': ['dashboard.jpg', 'homeimage.jpg']
 *    },
 *    ...
 * ]
 */
async function createCourseArray(courses) {
   const path = './updatedImages';

   return courses.map(async course => {
      let newPath = course.replace(/\s/g, '').split().join().toLowerCase();
      let files = await fs.readdir(`${path}/${newPath}`);

      return {
         'id': course.id,
         'path': files
      }
   });
};

module.exports = {
   make
}