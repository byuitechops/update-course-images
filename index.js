const fs = require('fs');
const rest = require('restler-base')
const canvas = require('canvas-api-wrapper');

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

    console.log(respObj);
    console.log('-----------------------------');
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
function uploadFileCanvas(resObj, path) {
  fs.stat(path, (err, stats) => {
    rest.post(resObj.upload_url, {
      multipart: true,
      data: {
        'key': resObj.upload_params.key,
        'upload_params': resObj.upload_params,
        'file': rest.file(path, null, stats.size, null, 'image/jpeg')
      }
    }).on('complete', (data) => {
      console.log(data);
    });
  });
}

//start here
(async () => {
  const courseId = 21050;
  const filename = 'homeimage.jpg';
  const bytes = fs.statSync(filename)['size'];

  await uploadFileMaster(courseId, filename, bytes);
})();