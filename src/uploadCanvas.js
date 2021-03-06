const _ = require('underscore');
const fs = require('fs-extra');
const util = require('util');
const chalk = require('chalk');
const canvas = require('canvas-api-wrapper');
const request = require('request');
const asyncLib = require('async');

//change this when you are wanting to run it on McGrath Test # courses
const TESTING = true;
// canvas.subdomain = 'byui.test';

const PARENT_FOLDER = 'template';
const EQUELLA_URL = `https://content.byui.edu/integ/gen/ee553731-00c7-44ff-839e-7c32ccc059d0/0/`;

const requestAsync = util.promisify(request);
const asyncEach = util.promisify(asyncLib.each);

// -------------------------------- HELPER FUNCTIONS ---------------------------

/**
 * fixClassString
 * @param {String} str 
 * 
 * This function simply makes a class name (FDREL 324 - R-- etc) into just fdrel324
 */
function fixClassString(str) {
   return str.replace(/\(+|\)+/g, '').replace(/\./g, ' ').split(' ').splice(0, 2).join(' ').replace(/\s+|\:+/g, '').toLowerCase();
}

/**
 * getFilename
 * @param {String} str 
 * 
 * This function returns the name of the file and ignores the rest of the filepath
 */
function getFilename(str) {
   return str.split('/').splice(-1).join('');
}

/**
 * retrieveListOfFiles
 * @param {Int} courseId 
 * 
 * This function goes through and gets all of the files in the course.
 */
async function retrieveListOfFiles(courseId) {
   try {
      let files = [
         ...await canvas.get(`/api/v1/courses/${courseId}/files?search_term=dashboard`),
         ...await canvas.get(`/api/v1/courses/${courseId}/files?search_term=homeImage`)
      ];

      return files;
   } catch (err) {
      console.log(err);
      return;
   }
}

/**
 * filterFiles
 * @param {Array of Strings} files 
 * @param {String} name 
 * 
 * This function gets the file property for the dashboard image in the course files.
 */
function filterFiles(files, name) {
   return files.filter(file => file.filename === name)[0];
}

/**
 * createObjects
 * @param {Obj} courses
 * @param {Bool} isUrl
 * 
 * This function gets the list of courses and passes it into createCourseArray. It'll
 * get the object array and simply return it.
 */
async function createObjects(courses, isUrl = false, userProvidedPath = '') {
   if (!isUrl) {
      const filepath = (userProvidedPath === '') ? './updatedImages' : userProvidedPath;

      let tempCourses = courses.map(course => fixClassString(course.course_code));
      let files = await fs.readdir(filepath);
      let newFiles = files.filter(file => tempCourses.includes(file));

      return await createCourseArray(newFiles, courses, userProvidedPath);
   }

   return await createCourseArrayURL(courses);
}

/**
 * createCourseArray
 * @param {Array of Course objects} courses 
 * 
 * This function reads through and creates the object array to prep the system
 * to upload files to Canvas in mass. This is only for local files portion.
 * 
 * Course Array should be like this after it finishes: 
 * [
 *    {
 *       'courseName': updatedPath
 *       'id': courseId,
 *       'path': ['dashboard.jpg', 'homeImage.jpg']
 *    },
 *    ...
 * ]
 */
async function createCourseArray(folders, courses, userProvidedPath = '') {
   const path = (userProvidedPath === '') ? './updatedImages' : userProvidedPath;

   let updatedCourses = await Promise.all(courses.map(async course => {
      let folderIndex = folders.findIndex(folder => folder === fixClassString(course.course_code));
      let newPath = folders[folderIndex];

      if (!newPath) {
         return {
            'success': false,
            'courseName': fixClassString(course.course_code)
         }
      } else {
         let files = await fs.readdir(`${path}/${newPath}`);
         files = files.map(file => `${path}/${newPath}/${file}`);

         //either dashboard or homeimage doesn't exist so warn the user and move on.
         if (files.length < 2) {
            return {
               'success': false,
               'courseName': fixClassString(course.course_code)
            }
         }

         return {
            'success': true,
            'courseName': newPath,
            'id': course.id,
            'path': files
         }
      }
   }));

   return updatedCourses;
};

/**
 * createCourseArrayURL
 * @param {Array of Course objects} courses 
 * 
 * This function reads through and creates the object array to prep the system
 * to upload files to Canvas in mass. This is only for the URL portion.
 * 
 * Course Array should be like this after it finishes: 
 * [
 *    {
 *       'courseName': updatedPath
 *       'id': courseId,
 *       'path': ['dashboard.jpg', 'homeImage.jpg']
 *    },
 *    ...
 * ]
 */
async function createCourseArrayURL(courses) {
   return await Promise.all(courses.map(async course => {
      let url = EQUELLA_URL + `/${fixClassString(course.course_code)}`;
      let files = ['dashboard.jpg', 'homeImage.jpg'];


      let results = await Promise.all(files.map(async file => {
         let {
            statusCode
         } = await requestAsync(`${url}/${file}`);

         return statusCode;
      }));

      if (results.every(result => result === 200)) {
         return {
            'success': true,
            'courseName': fixClassString(course.course_code),
            'id': course.id,
            'path': files
         }
      } else {
         return {
            'success': false,
            'courseName': fixClassString(course.course_code)
         }
      }
   }));
}

// --------------------------------- URL FILE UPLOAD ----------------------------
/**
 * findPhotoUrl
 * @param {String} url 
 * 
 * This function makes a request to the URL to get the size since Canvas requires the size of an image
 */
async function findPhotoUrl(url) {
   request(url, (err, res) => {
      if (err) throw err;

      return res.headers['content-length'];
   });
}

/**
 * notifyCanvasFileURL
 * @param {Int} courseId 
 * @param {String} url 
 * @param {Int} bytes 
 * 
 * This function notifies Canvas that a file is ready to be uploaded and this will return
 * the response object that it gets from Canvas. This includes all of the auth, url and other 
 * parameters to make a POST to.
 */
async function notifyCanvasFileURL(courseId, url, bytes) {
   try {
      const responseObj = await canvas.post(`/api/v1/courses/${courseId}/files`, {
         'url': url,
         'name': getFilename(url),
         'size': bytes,
         'content-type': 'image/jpeg',
         'parent_folder_path': PARENT_FOLDER
      });

      return responseObj;
   } catch (err) {
      if (err) throw err;
   }
}

/**
 * uploadCanvasURL
 * @param {Obj} resObj 
 * @param {fileUrl} fileUrl 
 * 
 * This function makes a POST request and passes the URL of the photo.
 */
async function uploadCanvasUrl(resObj, fileUrl) {
   let url = resObj.upload_url;
   let formData = resObj.upload_params;
   formData.target_url = fileUrl;

   //we have created the formdata needed and are now uploading it to the url that Canvas has given us
   request.post({
      url: url,
      formData: formData
   }, (err) => {
      if (err) {
         console.log(err);
         return;
      }
   });
}

/**
 * checkProgress
 * @param {Int} progressId 
 * 
 * This makes sure that the image has finished uploading to Canvas since the response object
 * returns a Progress class. It usually uploads pretty fast since the files are small in size
 * but this is good practice.
 */
async function checkProgress(progressId) {
   let results = '';

   do {
      results = await canvas.get(`/api/v1/progress/${progressId}`)
   } while (results.workflow_state !== 'completed');
}

// --------------------------------- LOCAL FILE UPLOAD --------------------------

/**
 * updateCourseImage
 * @param {Int} courseId 
 * @param {Int} imageId 
 * 
 * This function makes the dashboard image the updated dashboard image for the course.
 */
async function updateCourseImage(courseId, imageId) {
   try {
      const addImageResponse = await canvas.put(`/api/v1/courses/${courseId}`, {
         course: {
            'image_id': imageId
         }
      });

   } catch (err) {
      console.log(err);
      return;
   }
}

/**
 * uploadLocalFileMaster
 * @param {Int} courseId  - the course id for the upload 
 * @param {String} path   - string that contains filepath
 * 
 * This function acts as a driver to upload the local files to their respective courses
 */
async function uploadLocalFileMaster(courseId, path, bytes) {
   try {
      //We have to get the authentication and url to "upload" the picture to. this gets stored inside
      //notifyCanvasFileResponse object.
      const notifyCanvasFileResponse = await notifyCanvasFile(courseId, path, bytes);

      //actually upload it.
      const uploadFileCanvasResponse = await uploadFileCanvas(notifyCanvasFileResponse, path);
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
async function notifyCanvasFile(courseId, path, bytes) {
   const resObj = await canvas.post(`/api/v1/courses/${courseId}/files`, {
      'name': getFilename(path),
      'size': bytes,
      'content-type': 'image/jpeg',
      'parent_folder_path': PARENT_FOLDER
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
   let url = resObj.upload_url;
   let formData = resObj.upload_params;
   formData.file = fs.createReadStream(path);

   //we have created the formdata needed and are now uploading it to the url that Canvas has given us
   request.post({
      url: url,
      formData: formData
   }, (err) => {
      if (err) {
         console.log(err);
         return;
      }
   });
}

//--------------------------------- DRIVER ----------------------------------------
/**
 * updatePictures
 * @param {Array} courses 
 * @param {String} uploadUrl 
 * 
 * Update the images in each Canvas course object inside courses array. This will return
 * an array of courses that didn't go through or had something bad happen (just with the 
 * images - don't worry!).
 */
async function updatePictures(courses, uploadUrl) {
   let badCourses = [];
   let goodCourses = [];
   let tempCourses = [];

   await asyncEach(courses, async course => {
      if (!course.success) {
         badCourses.push(course.courseName);
      } else {
         let courseId = course.id;

         await asyncEach(course.path, async image => {
            try {
               if (uploadUrl) {
                  let url = EQUELLA_URL + `/${course.courseName}/${getFilename(image)}`;

                  let size = await findPhotoUrl(url);
                  let responseObject = await notifyCanvasFileURL(courseId, url, size);
                  let responseUploadUrl = await uploadCanvasUrl(responseObject, url);

                  await checkProgress(responseObject.progress.id);
               } else {
                  const bytes = fs.statSync(image)['size'];
                  await uploadLocalFileMaster(courseId, image, bytes);
               }
            } catch (err) {
               if (err) {
                  console.log(err);
               }
            }
         });

         //since files are uploaded, we are able to go through and change the files.
         for (let image of course.path) {
            let term = `${course.courseName}_${getFilename(image)}`;
            try {
               if (getFilename(image) === 'dashboard.jpg') {
                  const img = filterFiles(await retrieveListOfFiles(courseId), getFilename(image));
                  const updateCourseImageResponse = await updateCourseImage(courseId, img.id);

                  (tempCourses.includes(`${course.courseName}_homeImage.jpg`)) ? goodCourses.push(course.courseName): tempCourses.push(term);
               } else {
                  (tempCourses.includes(`${course.courseName}_dashboard.jpg`)) ? goodCourses.push(course.courseName): tempCourses.push(term);
               }
            } catch (err) {
               console.log(err);
            }
         }
      }
   });

   return {
      badCourses,
      goodCourses
   };
}

/**
 * beginUpload
 * @param {Array of Course objects} courses 
 * 
 * This function goes through each course object in the array and calls the functions
 * needed to do the job.
 */
async function beginUpload(courses, uploadUrl = false, isChild = false, userProvidedPath = '') {
   if (!courses) {
      console.log('No courses object passed in. Please ensure that you are passing in a Canvas course object.');
      return;
   }

   //fyi, we are catching the problems with the images inside createObjects so
   //it is safe to assume that all stuff that happens inside updatePictures will happen.
   let updatedCourses = await createObjects(courses, uploadUrl, userProvidedPath);
   let results = await updatePictures(updatedCourses, uploadUrl, userProvidedPath);

   if (isChild) {
      //results contain a list of courses that was successful and a different list of courses that failed.
      return results;
   } else {
      if (results.goodCourses.length > 0) console.log(chalk.green('\nSuccessful courses: '), results.goodCourses);
      if (results.badCourses.length > 0) console.log(chalk.red('Failed courses: '), results.badCourses);
   }
};

// --------------------------------- TESTING AND EXPORTS -------------------------------

/**
 * getAllCourses 
 * @param {Int} subaccountId
 * 
 * This function gets the courses from Canvas under a specified subaccount.
 */
async function getAllCourses(subaccountId) {
   let courses = await canvas.get(`/api/v1/accounts/${subaccountId}/courses`, {
      sort: 'course_name',
      'include[]': 'subaccount'
   });

   // ensure that courses are exactly what we need since Canvas is a little
   // sketchy when it comes to ${userId}/courses
   return courses.filter(course => course.account_id === parseInt(subaccountId, '10'));
}

async function upload() {
   //must pass in JSON file in command line
   let fileName = process.argv[2];

   if (!fileName) {
      console.log('Error with file. Please ensure that you are including it in the command line');
      return;
   }

   try {
      let fileContents = JSON.parse(await fs.readFile(fileName, 'utf-8'));

      //replace TESTING with user's input
      const beginUploadResponse = await beginUpload(_(fileContents).toArray(), TESTING);
   } catch (err) {
      if (err) {
         console.log(err);
         return;
      }
   }
};

upload();

module.exports = {
   upload,
   beginUpload
};
