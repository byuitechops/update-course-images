# update-course-images

## Purpose
Update the image that is on the home page and the course image (the one that gets displayed for the course in Dashboard)

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

Requirements: None

Future idea: Pass in course id and image path as command line arguments.

#### `npm run clean`
Executes the cleanImages file, which will clean the images folder and create a new folder named updatedImages, which will
contain folders of courses and their respective images.

Requirements: no folder named updatedImages and a folder titled images that contains all of the folders 

#### `npm run checker`
Executes the folderChecker file, which will check every folder inside updatedImages folder and ensure that it follows the rules.

Requirements: folder named updatedImages created through `npm run clean`.

