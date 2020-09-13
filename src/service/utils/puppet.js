const puppeteer = require('puppeteer');

async function puppet(url, ws) {
  const browser = await puppeteer.connect({ browserWSEndpoint: ws });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  let ab = false;
  let abu = false;
  let test = false;
  page.on('request', interceptedRequest => {
    if (interceptedRequest.url().match('2/timeline') &&
      interceptedRequest.url().match('.json')) {
      // console.log(interceptedRequest.url(), Object.keys(interceptedRequest));
      abu = interceptedRequest.url();
      interceptedRequest.continue();
    } else {
      if (ab === true) {
        interceptedRequest.abort();
      } else {
        interceptedRequest.continue();
      }
    }
  });
  page.on('response', async response => {
    const url = response.url();
    console.log(url);
    try {
      if (url.match('2/timeline') && url.match('.json')) {
        const uid = url.match(/tion\/([0-9]+).json/)[1];
        // console.log(interceptedRequest.url(), Object.keys(interceptedRequest));
        const json = await response.json();
        console.log(json);
        // const varvar = json.globalObjects.tweets[uid].extended_entities.media[0].video_info.variants;
        const full_text = json.globalObjects.tweets[uid].full_text;
        test = { text: full_text };
        // test = { test: 1 };
      }
      // const req = response.request();
      // const orig = req.url();
      // const text = await response.text();
      // const status = response.status();
      // console.log({orig, status, text: text.length});
    } catch (err) {
      // console.error(`Failed getting data from: ${url}`);
      // console.error(err);
    }
  });
  await page.goto(url);
  await new Promise(resolve => setTimeout(() => resolve(), 5000));

  /*const response_body = abu ? await fetch(abu).then(
    response => response.json()).catch(error => {
    console.error(error);
  }) : {};
  console.log(response_body);*/
  await browser.close();
  return test;
}

exports.puppet = puppet;
