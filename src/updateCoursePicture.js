const fs = require('fs');
const canvas = require('canvas-api-wrapper');

const TESTING = false;

async function retrieveListOfFiles(courseId) {
   try {
      const files = await canvas.get(`/api/v1/courses/${courseId}/files`);

      return files;
   } catch (err) {
      console.log(err);
      return;
   }
}

function filterFiles(files, name) {
   return files.filter(file => file.display_name === name)[0];
}

async function updateCourseImage(courseId, imageId) {
   try {
      const response = await canvas.put(`/api/v1/courses/${courseId}`, {
         course: {
            image_id: imageId
         }
      });
   } catch (err) {
      console.log(err);
      return;
   }
}

async function uploader(courses) {

}

module.exports = {
   uploader
};

if (TESTING) {
   let courseId = 21050;
   let name = 'dashboard.jpg';

   const imageId = filterFiles(await retrieveListOfFiles(courseId), name);

   console.log(imageId);

   // await updateCourseImage(courseId, imageId);
}