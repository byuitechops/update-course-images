/**
 * Child Module
 * 
 * This child module is required to have the user's input to the 
 * dashboard and banner images and those have to be a part of course
 * (part of info property).
 * 
 * The bannerDashboardImages property is expecting to have these three options:
 *    1) default - This will just use Equella that houses all default banners and dashboard images.
 *    2) local - The user can enter the filepath to the folder that contains the images (required to be homeImage.jpg and dashboard.jpg)
 *    3) url - The user can enter in an URL that points to a JPG image
 *    4) none - The teacher may already have a banner and dashboard images. This just skips the child module.
 * 
 * All work is handled inside uploadCanvas.js. Documentation can be found 
 * in github.com/byuitechops/upload-course-images.
 */

const canvas = require('canvas-api-wrapper');
const uploader = require('./uploadCanvas');

//course.info.canvasOU -- course.id - maybe get this as an API call

module.exports = async (course, stepCallback) => {
   async function handleDefault(stepCallback) {
      let courseObj = [];

      courseObj.push(await canvas.get(`/api/v1/courses/${course.info.canvasOU}`));

      let results = uploader.beginUpload(courseObj, false, true);

      course.log('Banner and Dashboard Image', {
         type: 'default',
         course: course.info.canvasOU
      });

      console.log(results);

      stepCallback(null, course);
   }

   function handleURL() {

   }

   function handleLocalFile() {

   }

   try {
      course.info.bannerDashboardImages = 'default';

      //checking the course object for what we need
      if (!course.info.bannerDashboardImages) {
         course.error(`Course object does not have bannerDashboardImages property.`);
         stepCallback(null, course);
      }

      switch (course.info.bannerDashboardImages) {
         case 'none':
            stepCallback(null, course);
            break;
         case 'url':
            handleURL();
            break;
         case 'local':
            handleLocalFile();
            break;
         default:
            await handleDefault(stepCallback);
            break;
      }
   } catch (err) {
      // catch all uncaught errors. Don't pass errors here on purpose
      course.error(err);
      stepCallback(null, course);
      return;
   }
};