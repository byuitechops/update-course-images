const fs = require('fs');
const axios = require('axios');
const canvas = require('canvas-api-wrapper');

/**
 * uploadFileMaster
 * @param {Int} courseId  - the course id for the upload 
 * @param {String} path   - string that contains filepath
 * @param {Int} folderId  - id of course_image folder
 * 
 * 
 */
async function uploadFileMaster(path, folderId) {
   try {
      const parentFolder = 'course_image';

      const respObj = await notifyCanvasFile(path, parentFolder, folderId);
      const fileUploadResponse = await uploadFileCanvas(respObj, path);

      console.log(fileUploadResponse);
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
async function notifyCanvasFile(path, parentFolder, folderId) {
   const bytes = fs.statSync(path)['size'];

   const resObj = await canvas.post(`/api/v1/folders/${folderId}/files`, {
      'name': path,
      'size': bytes,
      'parent_folder_path': parentFolder
   });

   console.log(resObj);
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
async function uploadFileCanvas(resObj, path) {
   try {
      const response = await axios.post(resObj.upload_url, {
         'key': resObj.upload_params.key,
         'upload_params': resObj.upload_params,
         'file': path
      });
      console.log(response);
      return response;
   } catch (err) {
      console.log(err);
   }
}

async function getFolders(courseId) {
   const canvasFolderName = 'course_image';
   const response = await canvas.get(`/api/v1/courses/${courseId}/folders`);

   return response.filter(ele => ele.name === canvasFolderName)[0].id;
}

//start here
(async () => {
   const courseId = 21050;
   const filename = 'homeimage.jpg';

   const folderId = await getFolders(courseId);
   await uploadFileMaster(filename, folderId);

})();