# update-course-images

## Purpose
Update the image that is on the home page and the course image (the one that gets displayed for the course in the Dashboard view in Canvas).

This is a standalone versione and is meant for mass blasting out to different courses. A child module version that will go into the d2l-to-canvas
conversion tool can be found [here](https://github.com/byuitechops/update-course-images-child).

This entire process is purely automated. There are two ways that you can upload dashboard and home banners to the courses: locally or url. 
Through local files, this will only require the images folder that consists of only images inside of the folder
titled `coursename_dashboard.imgextension` or `coursename_homeImage.imgextension` with `coursename` being a course name like CS 235, etc. This
also requires an array of course objects from the Canvas API (please look at the `upload` command inside the Commands section on usage), just like: 
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
$ ${Insert whatever your OS allows shown in below code snippet}
```

```sh
# Canvas requires an API token and we grab (will throw error if not there) it from the environment variables

# Powershell
$ $env:CANVAS_API_TOKEN="${INSERT YOUR CANVAS API TOKEN HERE}"

# cmd
$ set CANVAS_API_TOKEN=${INSERT YOUR CANVAS API TOKEN HERE}

# Linux and Mac
$ export CANVAS_API_TOKEN="${INSERT YOUR CANVAS API TOKEN HERE}"
```

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

Requirements: `npm run clean` must have been executed. Depending on additional factors, this function relies on the results of the clean file execution.

<b>Important</b> (notice given 10/31/2018): I have updated the code to only allow `npm run upload` to be run on its own while giving it the array of proper Canvas course objects. The updated way to call `npm run upload` is to ensure that a JSON file that contains the array of Canvas
course objects exists and execute `npm run upload ${insert your filepath to JSON file here}`. For example, I have a file named exampleCourses.json
inside the test folder and I would run `npm run upload ./test/exampleCourses.json` to get the files to upload. Same requirements are enforced.

#### `npm run clean`
Executes the cleanImages file, which will clean the images folder and create a new folder named updatedImages, which will
contain folders of courses and their respective images.

Requirements: no folder named updatedImages and a folder named images that contains all of the folders.

#### `npm run checker`
Executes the folderChecker file, which will check every folder inside updatedImages folder and ensure that it follows the requirements and checks it to see if it is ready to be uploaded.

Requirements: folder named updatedImages created through `npm run clean`.

#### `npm run courses`
Executes the retrieveCourses file, which utilizes the Puppeteer API created by Google and grabs information about the courses from Canvas.

This creates two files:

| Filename | Description |
|------|-------------|
| scrapeResults.json | This holds the results for the Puppeteer Canvas search. |
| courses.json | This holds an array of Canvas course objects.  |

Requirements: none

