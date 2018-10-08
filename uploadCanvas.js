const fs = require('fs');
const request = require('request');
const canvas = require('canvas-api-wrapper');
const FormData = require('form-data');

/**
 * uploadFileMaster
 * @param {Int} courseId  - the course id for the upload 
 * @param {String} path   - string that contains filepath
 * 
 * 
 */
async function uploadFileMaster(courseId, path, bytes) {
   try {
      const parentFolder = 'course_image';

      const respObj = await notifyCanvasFile(courseId, path, parentFolder, bytes);
      const fileUploadResponse = await uploadFileCanvas(respObj, path);


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
      'name': 'homeImage.jpg',
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
async function uploadFileCanvas(resObj) {
   let formData = resObj.upload_params;
   formData.file = fs.createReadStream('homeimage.jpg');

   request.post({
      url: resObj.upload_url,
      formData: formData
   }, function (err, httpResponse, body) {
      if (err) {
         return console.error('upload failed:', err);
      }
      console.log('Upload successful!  Server responded with:', body);
   });
}

/**
 * checkFileCanvas
 * @param {string} redirectUrl - an URL string
 * 
 * This function simply makes a GET request to the redirectURL
 * to "complete" the upload process
 */
async function checkFileCanvas(redirectUrl) {

}

//start here
(async () => {
   const courseId = 21050;
   const filename = 'homeimage.jpg';
   const bytes = fs.statSync(filename)['size'];

   await uploadFileMaster(courseId, filename, bytes);
})();