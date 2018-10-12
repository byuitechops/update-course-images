const fs = require('fs');
const request = require('request');
const canvas = require('canvas-api-wrapper');
const asyncLib = require('async');

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
      const parentFolder = 'course_image';

      functions.unshift(asyncLib.constant(await notifyCanvasFile(courseId, path, parentFolder, bytes)));

      asyncLib.waterfall(functions, (err) => {
         if (err) {
            console.error(err);
            return;
         }

         console.log(`Upload to course ${courseId} was successful!`);
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
      'name': path,
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
function uploadFileCanvas(resObj, uploadFileCanvasCallback) {
   let formData = resObj.upload_params;
   formData.file = fs.createReadStream('../homeimage.jpg');

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
         console.log(err);
         checkFileCanvasCallback(err);
         return;
      }

      checkFileCanvasCallback(null);
   });
}

//start here
(async () => {
   const courseId = 21050;
   const filename = '../homeimage.jpg';
   const bytes = fs.statSync(filename)['size'];

   await uploadFileMaster(courseId, filename, bytes);
})();