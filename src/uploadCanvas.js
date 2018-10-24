const fs = require('fs-extra');
const canvas = require('canvas-api-wrapper');
const request = require('request');
const asyncLib = require('async');

const TESTING = true;
//Master Courses - 42

/**
 * getAllCourses 
 * 
 * This function gets the courses from Canvas
 */
async function getAllCourses() {
   let accountId = 112;

   let courses = await canvas.get(`/api/v1/accounts/${accountId}/courses`, {
      sort: 'course_name',
      'include[]': 'subaccount'
   });

   // ensure that courses are exactly what we need since Canvas is a little
   // sketchy when it comes to ${userId}/courses
   return courses.filter(course => course.account_id === parseInt(accountId, '10'));
}

function fixClassString(str) {
   return str.split(' ').splice(0, 2).join(' ').replace(/\s/g, '').toLowerCase()
}

function getFileName(str) {
   return str.split('/').splice(-1);
}

/**
 * createObjects
 * 
 * This function gets the list of courses and passes it into createCourseArray. It'll
 * get the object array and simply return it.
 */
async function createObjects(courses) {
   const filepath = './updatedImages';

   let tempCourses = courses.map(course => fixClassString(course.course_code));
   let files = await fs.readdir(filepath);
   let newFiles = files.filter(file => tempCourses.includes(file));
   return await createCourseArray(newFiles, courses);
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
async function createCourseArray(folders, courses) {
   const path = './updatedImages';

   return await Promise.all(courses.map(async (course, index) => {
      let newPath = fixClassString(folders[index]);
      let files = await fs.readdir(`${path}/${newPath}`);
      files = files.map(file => `${path}/${newPath}/${file}`);

      return {
         'courseName': newPath,
         'id': course.id,
         'path': files
      }
   }));
};

/**
 * uploadFileMaster
 * @param {Int} courseId  - the course id for the upload 
 * @param {String} path   - string that contains filepath
 * 
 * 
 */
async function uploadFileMaster(courseId, path, bytes) {
   const functions = [
      uploadFileCanvas,
      checkFileCanvas
   ];

   try {
      let parentFolder = 'template';

      functions.unshift(asyncLib.constant(await notifyCanvasFile(courseId, path, parentFolder, bytes), path));

      asyncLib.waterfall(functions, (err) => {
         if (err) {
            return err;
         }
      });
   } catch (err) {
      return err;
   }
}

/**
 * notifyCanvasFile
 * @param {Int} courseId  - the course id for the upload 
 * @param {String} path   - string that contains filepath
 * 
 * 
 */
async function notifyCanvasFile(courseId, path, parentFolder, bytes) {
   const resObj = await canvas.post(`/api/v1/courses/${courseId}/files`, {
      'name': getFileName(path),
      'size': bytes,
      'content-type': 'image/jpeg',
      'parent_folder_path': parentFolder
   });

   return resObj;
}

/**
 * uploadFileCanvas
 * @param {Object} resObj - the response object from notifyCanvasFile()
 * @param {String} path   - the string that contains the path for the file in the filesystem
 * 
 * This function POSTs the image to the file name that Canvas has given us
 * in notifyCanvasFile() [found in resObj]. 
 * 
 * Requirements in request header for this call:
 *  - first parameter is specially formulated request URL found in upload_url field of resObj
 *  - last parameter is file parameter 
 *  - Any other parameters specified in the upload_params response between first and last
 */
function uploadFileCanvas(resObj, path, uploadFileCanvasCallback) {
   let formData = resObj.upload_params;
   formData.file = fs.createReadStream(path);

   request.post({
      url: resObj.upload_url,
      formData: formData
   }, (err) => {
      if (err) {
         uploadFileCanvasCallback(err);
         return;
      }
      uploadFileCanvasCallback(null, resObj.upload_params.success_action_redirect);
   });
}

/**
 * checkFileCanvas
 * @param {string} redirectUrl - an URL string
 * 
 * This function simply makes a GET request to the redirectURL
 * to "complete" the upload process
 */
function checkFileCanvas(redirectUrl, checkFileCanvasCallback) {
   request.get(redirectUrl, (err) => {
      if (err) {
         checkFileCanvasCallback(err);
         return;
      }

      checkFileCanvasCallback(null);
   });
}

async function beginUpload(courses) {
   for (let course of courses) {
      let courseId = course.id;

      await Promise.all(course.path.map(async image => {
         const bytes = fs.statSync(image)['size'];
         await uploadFileMaster(courseId, image, bytes);
      }));
   }
};

async function testing() {
   let courses = await getAllCourses();
   const beginUploadResponse = await beginUpload(await createObjects(courses));
}

if (TESTING) testing();

module.exports = {
   beginUpload
};