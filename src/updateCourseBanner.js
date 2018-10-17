/************ NOT USED ***********************/

const fs = require('fs');
const canvas = require('canvas-api-wrapper');
const cheerio = require('cheerio');

async function updateFrontPage(courseId, updatedBody) {
   try {
      const response = await canvas.put(`/api/v1/courses/${courseId}/front_page`, {
         wiki_page: {
            body: updatedBody
         }
      });
   } catch (err) {
      console.log(err);
      return;
   }
}

function modifyBodyContent(page, filename) {
   const $ = cheerio.load(page.body);
   const updatedBody = $('div.byui').html();

   console.log(updatedBody);
}

async function retrieveFrontPage(courseId) {
   try {
      const response = await canvas.get(`/api/v1/courses/${courseId}/front_page`);

      return response;
   } catch (err) {
      console.log(err);
      return;
   }
}

(async () => {
   let courseId = 26934;
   let filename = 'homeimage.jpg';

   modifyBodyContent(await retrieveFrontPage(courseId), filename);
})();