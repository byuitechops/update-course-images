const fs = require('fs-extra');
const prompt = require('prompt');
const canvas = require('canvas-api-wrapper');
const asyncLib = require('async');
const puppeteer = require('puppeteer');
const {
   promisify
} = require('util');
const asyncEach = promisify(asyncLib.each);

const CANVAS_URL = 'https://byui.instructure.com';

//TODO: Export results to CSV

/**
 * promptUser
 * @param {callback} promptUserCallback
 * 
 * This function prompts the user for the username and password to use
 * for the program.
 **/
function promptUser(promptUserCallback) {
   let schema = {
      properties: {
         user: {
            pattern: /[a-zA-Z\d]+/,
            default: 'cct_allstars67',
            message: 'user must be only letters, and numbers.',
            required: true
         },
         password: {
            pattern: /[a-zA-Z\d]+/,
            message: 'password must be only letters, and numbers.',
            replace: '*',
            hidden: true,
            required: true
         },
         searchTerm: {
            pattern: /[a-zA-Z\d]+/,
            message: 'searchTerm must be only letters, and numbers',
            required: true
         },
         semester: {
            pattern: /^\s*(spring|fall|winter|none)\s*$/,
            message: 'semester must only be spring, fall, winter, or none - all lowercases',
            required: true
         },
         year: {
            pattern: /\s*(20\d{2}|none)\s*/,
            message: 'year must only be digits (or type "none" if you don\'t want year) i.e. 2018',
            required: true
         }
      }
   };

   prompt.start();

   prompt.get(schema, (err, results) => {
      if (err) promptUserCallback(err);

      promptUserCallback(null, results);
   });
}

/**
 * createAuthedPuppeteer
 * @param {Array} data
 * @param {Puppeteer} browser
 * 
 * This function simply creates a new page and then does
 * the authentication on that page. It returns the browser
 * because we don't want anything else to use the authentication
 * tab so the browser stays authenticated with Canvas. This leads
 * the program having to authenticate only once.
 */
async function createAuthedPuppeteer(data, browser) {
   const page = await browser.newPage();

   await authenticate(page, data);

   return browser;
}

/**
 * authenticate
 * @param {Page} page
 * @param {object} data
 * 
 * This function goes through the authentication phase.
 **/
async function authenticate(page, data) {
   console.log('Authenticating...');

   await page.goto('https://byui.instructure.com/login/canvas');
   await page.waitForSelector('.ic-Login');

   //insert information submitted by user
   await page.evaluate(data => {
      document.querySelector('#login_form input[type=text]').value = data.user;
      document.querySelector('#login_form input[type=password]').value = data.password;
      document.querySelector('#login_form button[type=submit]').click();
   }, data);

   await page.waitForSelector('#content');

   console.log('Authenticated.\n\n');
}

/**
 * scrapePage
 * @param {Pptr} page 
 * 
 * This function scrapes the current table and gets all of the links, sis id and term
 */
async function scrapePage(page) {
   let tds = chunkify(await page.evaluate(async () => {
      const tds = Array.from(document.querySelectorAll('table tr td')).map(td => td.innerHTML);

      return tds;
   }));

   tds.forEach((td, i, arr) => {
      let ele = td[0];

      arr[i][0] = `${CANVAS_URL}${ele.slice(ele.indexOf('/'), ele.indexOf('">'))}`;

   });

   return tds.map(tdRow => tdRow.splice(0, 3));
}

/**
 * chunkify
 * @param {Array} tds 
 * 
 * Split the array into chunks of array inside an array
 */
function chunkify(tds) {
   const size = 7;

   return tds.reduce((chunks, ele, i) => {
      (i % size) ? chunks[chunks.length - 1].push(ele): chunks.push([ele]);

      return chunks;
   }, []);
}

/**
 * navigatePages
 * @param {Obj} data 
 * @param {Pptr} browser 
 * 
 * This function navigates through the website and calls scrapePage to grab information from the website
 */
async function navigatePages(data, browser) {
   const page = await browser.newPage();
   const type = ['none'];
   let searchTerm = `${data.searchTerm}`;

   if (!type.includes(data.year) && !type.includes(data.semester)) {
      searchTerm += `.${data.year}.${data.semester}`;
   }
   let url = `https://byui.instructure.com/accounts/1?search_term=${searchTerm}&page=1`;

   await page.goto(url);
   await page.waitForSelector('#content table tr td');

   let allData = [];
   let oldVal = -1;
   let newVal = -1;

   while (true) {
      allData.push(await scrapePage(page));

      await page.evaluate(async () => {
         Array.from(document.querySelectorAll('#content nav > span button')).splice(-1)[0].click();
      });

      newVal = oldVal;
      oldVal = await page.$$eval('#content nav > span', l => l.length);

      if (newVal !== oldVal) {
         await page.waitForSelector('#content table tr td');
      } else {
         console.log('Completed scraping');
         break;
      }
   }
   return {
      searchTerm: searchTerm,
      results: allData
   };
}

/**
 * createCanvas
 * @param {String} filePath 
 * 
 * This function goes through the JSON file (given by filePath) that contains an array of results
 * gathered by Puppeteer and makes all of the API calls to Canvas to retrieve the course object. 
 * The end results is an array of all course objects.
 */
async function createCanvas(filePath) {
   const savePath = './courses.json';

   try {
      if (!fs.existsSync(filePath)) {
         throw new Error('Something bad happened here...');
      }

      const courses = JSON.parse(await fs.readFile(filePath));

      let eachData = [];
      await asyncEach(courses.results, async course => {
         courseId = course[0][0].split('/').splice(-1);

         const courseResponse = await canvas.get(`/api/v1/courses/${courseId}`);

         eachData.push(courseResponse);
      });

      await fs.writeFile(savePath, JSON.stringify(eachData), 'utf8');
      console.log(`Successfully saved all courses objects to ${savePath}`)
   } catch (err) {
      throw err;
   }
}

(async () => {
   promptUser(async (err, data) => {
      if (err) {
         console.log(err);
         return;
      }

      try {
         const filePath = './scrapeResults.json';
         const browser = await puppeteer.launch({
            headless: false
         });
         const authedBrowser = await createAuthedPuppeteer(data, browser);
         const navigatorResponse = await navigatePages(data, authedBrowser);

         const createFileResponse = await fs.writeFile(filePath, JSON.stringify(navigatorResponse), 'utf8');
         console.log(`Saved results of scrape to ${filePath}`);

         authedBrowser.close();

         const createCanvasResponse = await createCanvas(filePath);

      } catch (err) {
         console.log(err);
         return;
      }
   });
})();