// const puppeteer = require("puppeteer");
// module.exports={

//   htmltoimage:async (html = "") => {
//         // let width=1024;
//         // let height=1600;
//         const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     await page.setContent(html);

//     const content = await page.$("body");
//     const imageBuffer = await content.screenshot({ omitBackground: true });

//     await page.close();
//     await browser.close();

//     return imageBuffer;
// }
// }