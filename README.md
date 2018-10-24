# update-course-images

## Purpose
Update the image that is on the home page and the course image (the one that gets displayed for the course in Dashboard).

The entire process is purely automated. This will only require the images folder that consists of only images inside of the folder
titled `coursename_dashboard.imgextension` or `coursename_homeImage.imgextension` with coursename being a course name like FDREL 324, etc. This
also requires an array of course objects from the Canvas API, just like: 
```sh
[
   {  
      "id":OMITTED,
      "name":"OMITTED",
      "account_id":OMITTED,
      "uuid":"OMITTED",
      "start_at":null,
      "grading_standard_id":1,
      "is_public":false,
      "created_at":"2018-02-26T17:22:25Z",
      "course_code":"OMITTED",
      "default_view":"modules",
      "root_account_id":OMITTED,
      "enrollment_term_id":OMITTED,
      "end_at":null,
      "public_syllabus":false,
      "public_syllabus_to_auth":true,
      "storage_quota_mb":OMITTED,
      "is_public_to_auth_users":false,
      "hide_final_grades":false,
      "apply_assignment_group_weights":false,
      "locale":"en",
      "calendar":{  
         "ics":"https://byui.instructure.com/feeds/calendars/course_OMITTED"
      },
      "time_zone":"America/Denver",
      "blueprint":false,
      "sis_course_id":null,
      "integration_id":null,
      "enrollments":[  

      ],
      "workflow_state":"unpublished",
      "restrict_enrollments_to_course_dates":false
   }, 
   ...
];
```

## Installation

```sh
$ git clone https://github.com/byuitechops/update-course-images.git
$ cd update-course-image
$ npm i
$ set CANVAS_API_TOKEN=${INSERT YOUR CANVAS API TOKEN HERE}
```

Note: The last line in above terminal snippet varies between OS - above is for Windows. Change `set` to whatever the OS uses for setting an environment variable.

## Commands

All commands below require CANVAS_API_TOKEN environment variable to be set

#### `npm test`
Executes test cases through MochaJS

Requirements: none

#### `npm run coverage`
See the coverage of the test cases through IstanbulJS

Requirements: none

#### `npm run upload`
Executes the uploadCanvas file, which will upload the image to a specific course with the course id.

Requirements: `npm run clean` must have been executed. This function relies on the results of the clean file execution.

#### `npm run clean`
Executes the cleanImages file, which will clean the images folder and create a new folder named updatedImages, which will
contain folders of courses and their respective images.

Requirements: no folder named updatedImages and a folder titled images that contains all of the folders 

#### `npm run checker`
Executes the folderChecker file, which will check every folder inside updatedImages folder and ensure that it follows the rules.

Requirements: folder named updatedImages created through `npm run clean`.

