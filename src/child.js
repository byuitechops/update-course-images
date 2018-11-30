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
 *    3) none - The teacher may already have a banner and dashboard images. This just skips the child module.
 * 
 * All work is handled inside uploadCanvas.js. Documentation can be found 
 * in github.com/byuitechops/upload-course-images.
 */

const fs = require('fs');
const canvas = require('canvas-wrapper');
const uploader = require('./uploadCanvas');

const TESTING = true;

module.exports = async (course, stepCallback) => {
   /**
    * retrieveCourse
    * @param {Int} courseId 
    * @param {Callback} callback 
    * 
    * This function uses Daniel's Canvas wrapper to get the Canvas Course Object as an array.
    */
   function retrieveCourse(courseId, callback) {
      canvas.get(`/api/v1/courses/${courseId}`, (err, data) => {
         if (err) {
            callback(err);
            return;
         }

         callback(null, data);
      });
   }

   /**
    * handleDefault
    * @param {Callback} callback 
    * 
    * 
    */
   function handleDefault(callback) {
      retrieveCourse(course.info.canvasOU, async (err, data) => {
         if (err) {
            callback(err);
            return;
         }

         if (TESTING) data[0].course_code = 'McGrath 101';

         let results = await uploader.beginUpload(data, true, true);

         course.log('Dashboard and homeImage Banner Child Module', {
            type: 'default',
            course_name: course.info.courseName,
            success: (results.badCourses.length < 1 ? true : false)
         });

         callback(null);
      });

      return;
   }

   /**
    * handleLocalFile
    * @param {Callback} callback 
    * 
    * 
    */
   function handleLocalFile(callback) {
      //insert checking file here
      let fileLocation = course.info.bannerDashboardImages.fileLocation;

      if (!fileLocation) {
         course.error('fileLocation property of bannerDashboardImages is not valid.');
         return;
      }

      retrieveCourse(course.info.canvasOU, async (err, data) => {
         if (err) {
            callback(err);
            return;
         }

         if (TESTING) data[0].course_code = 'McGrath 101';

         let results = await uploader.beginUpload(data, false, true, fileLocation);

         course.log('Dashboard and homeImage Banner Child Module', {
            type: 'local',
            course_name: course.settings.courseName,
            success: (results.badCourses.length < 1 ? true : false)
         });

         callback(null);
      });

      return;
   }

   /*********************************************************
    *********************** START HERE **********************
    *********************************************************/
   try {
      course.info.bannerDashboardImages = {
         type: 'local',
         fileLocation: '../test'
      }

      //checking the course object for what we need
      if (!course.info.bannerDashboardImages) {
         course.error(`Course object does not have bannerDashboardImages property.`);
         stepCallback(null, course);
      }

      switch (course.info.bannerDashboardImages.type) {
         case 'none':
            stepCallback(null, course);
            break;
         case 'local':
            handleLocalFile(err => {
               if (err) {
                  course.error(err);
                  stepCallback(null, course);
                  return;
               }

               stepCallback(null, course);
            });
            break;
         case 'default':
            await handleDefault(err => {
               if (err) {
                  course.error(err);
                  stepCallback(null, course);
                  return;
               }

               stepCallback(null, course);
            });
            break;
         default:
            course.error('Invalid string for bannerDashboardImages property');
            stepCallback(null, course);
            return;
      }
   } catch (err) {
      course.error(err);
      stepCallback(null, course);
      return;
   }
};