const _ = require('underscore');
const fs = require('fs-extra');
const canvas = require('canvas-api-wrapper');
const request = require('request');
const asyncLib = require('async');

//change this when you are wanting to run it on McGrath Test # courses
const TESTING = false;
canvas.subdomain = 'byui.test';

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
 *       'courseName': updatedPath
 *       'id': courseId,
 *       'path': ['dashboard.jpg', 'homeimage.jpg']
 *    },
 *    ...
 * ]
 */
async function createCourseArray(folders, courses) {
   const path = './updatedImages';
   let neededFiles = [];

   let updatedCourses = await Promise.all(courses.map(async course => {
      let folderIndex = folders.findIndex(folder => folder === fixClassString(course.course_code));
      let newPath = folders[folderIndex];

      if (!newPath) {
         if (neededFiles.indexOf(course.course_code) === -1) {
            neededFiles.push(course.course_code);
         }
         return undefined;
      } else {
         let files = await fs.readdir(`${path}/${newPath}`);
         files = files.map(file => `${path}/${newPath}/${file}`);

         return {
            'courseName': newPath,
            'id': course.id,
            'path': files
         }
      }
   }));

   console.log(JSON.stringify(neededFiles));

   return updatedCourses;
};

// --------------------------------- URL FILE UPLOAD ----------------------------

async function notifyCanvasFileURL(courseId, fileUrl, fileName, bytes, parentFolder) {
   try {
      const responseObj = canvas.post(`/api/v1/courses/${courseId}/files`, {
         'url': fileUrl,
         'name': fileName,
         'size': bytes,
         'content-type': 'image/jpeg',
         'parent_folder_path': parentFolder
      });

      return responseObj;
   } catch (err) {
      console.log(err);
      return;
   }
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
 * uploadFileMaster
 * @param {Int} courseId  - the course id for the upload 
 * @param {String} path   - string that contains filepath
 * 
 * This function acts as a driver to upload the local files to their respective courses
 */
async function uploadFileMaster(courseId, path, bytes) {
   try {
      const parentFolder = 'template';

      //We have to get the authentication and url to "upload" the picture to. this gets stored inside
      //notifyCanvasFileResponse object.
      const notifyCanvasFileResponse = await notifyCanvasFile(courseId, path, parentFolder, bytes);

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
async function notifyCanvasFile(courseId, path, parentFolder, bytes) {
   const resObj = await canvas.post(`/api/v1/courses/${courseId}/files`, {
      'name': getFilename(path),
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
 * beginUpload
 * @param {Array of Course objects} courses 
 * 
 * This function goes through each course object in the array and calls the functions
 * needed to do the job.
 */
async function beginUpload(courses) {
   if (!courses) {
      console.log('No courses object passed in. Please ensure that you are passing in a Canvas course object.');
      return;
   }

   let updatedCourses = await createObjects(courses);

   for (let course of updatedCourses) {
      let courseId = course.id;

      //have to make sure that the images are uploaded at first
      for (let image of course.path) {
         const bytes = fs.statSync(image)['size'];

         await uploadFileMaster(courseId, image, bytes);
      }

      //since files are uploaded, we are able to go through and change the files.
      for (let image of course.path) {
         if (getFilename(image) === 'dashboard.jpg') {
            const img = filterFiles(await retrieveListOfFiles(courseId), getFilename(image));
            const updateCourseImageResponse = await updateCourseImage(courseId, img.id);
            console.log(`Updated dashboard image for ${course.courseName}`);
         } else {
            console.log(`Updated banner image for ${course.courseName}`);
         }
      }
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

/**
 * testing()
 * 
 * This will only execute when the global variable, TESTING, is true. Simply set it
 * to false at the top of the program.
 */
async function testing() {
   try {
      let courses = await getAllCourses(112);
      const beginUploadResponse = await beginUpload(courses);
   } catch (err) {
      if (err) {
         console.log(err);
         return;
      }
   }
}

//automatically start the program
(async () => {
   if (TESTING) {
      testing();
   } else {
      //can pass in JSON file in command line
      let fileName = process.argv[2];

      if (!fileName) {
         console.log('Error with file. Please ensure that you are including it in the command line');
         return;
      }

      try {
         if (process.argv[2] === 'all') {
            let courses = await getAllCourses(42);
            const beginUploadResponse = await beginUpload(courses);
         } else {
            let fileContents = JSON.parse(await fs.readFile(fileName, 'utf-8'));
            const beginUploadResponse = await beginUpload(_(fileContents).toArray());
         }
      } catch (err) {
         if (err) {
            console.log(err);
            return;
         }
      }
   }
})();

//we are exporting beginUpload with the requirement that an array of Canvas course objects are being passed in.
module.exports = {
   beginUpload
};