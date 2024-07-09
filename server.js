const cron = require("node-cron");
const puppeteer = require("puppeteer");

// cron.schedule('0 18 * * *', function() {
console.log("running a task every day at 18:00");

function readOffersAndReduce() {
  const keywords = [
    "kitchen",
    "chef",
    "cook",
    "fruit",
    "pruning",
    "people",
    "wood",
    "chopping",
    "lumberjack",
    "tree",
    "firewood",
    "forest",
    "axe",
    "chainsaw",
    "saw",
    "woodcutting",
    "woodcutter",
    "woodworker",
    "woodworking",
    "woodwork",
    "arborist",
    "felling",
  ];

  const rows = document.querySelectorAll(".jobtabletitle a");
  let filteredData = [];

  rows.forEach((row) => {
    const link = row.href;
    const text = link ? row.innerText : "";
    if (
      keywords.some((keyword) =>
        text.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      const url =
        "https://www.backpackerboard.co.nz/work_jobs/" +
        link
      filteredData.push({
        href: url,
        text: text,
      });
    }
    return filteredData;
  });
  return JSON.stringify(filteredData);
}

async function initializeScraper() {
  return await puppeteer.launch({
    headless: false, // TODO: change to true when you're ready to deploy
    defaultViewport: null,
  });
}

async function openPage(browser, endpoint) {
  const page = await browser.newPage();
  const host = "https://www.backpackerboard.co.nz/work_jobs/";

  await page.goto(host + endpoint, {
    waitUntil: "domcontentloaded",
  });
  return page;
}

async function findMaxPageNumber(browser) {
  const page = await openPage(browser, "job_listings.php");

  const numberOfPages = await page.evaluate(async () => {
    // TODO async?
    const pageRegex = /Page \d+ of (\d+)/;

    const stringWithPages = document.querySelector("#paging p").innerText;
    const match = stringWithPages.match(pageRegex);

    const maxPages = match ? parseInt(match[1]) : null;

    return maxPages ? maxPages : 1;
  });

  return numberOfPages;
}

function sendResultsAsDiscordMessage(found) {
  const webhookUrl =
    "https://discord.com/api/webhooks/1190150171309396099/rxeAbs_UNxKZ1dx5r9hJw4tGVFkqa-ysNYnXX39enq9b7I00qGN4hnq1CJgtnKRuGtOC";
  for (const row of found) {
    const payload = {
      content: /*row.text + " " + */ row.href,
      username: "MyBot",
    };

    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => console.log(response))
      .catch((error) => console.error(error));
  }
}

// const getQuotes = async (maxPageNumber) => {
async function getQuotes(browser, maxPageNumber, readOffersAndReduce) {
  let page;

  for (let i = 1; i <= maxPageNumber; i++) {
    page = await openPage(browser, "job_listings.php?page=" + i);
    const evaluation = await page.evaluate(readOffersAndReduce);
    console.log(evaluation);

    const found = JSON.parse(evaluation);

    // Display the selected offers
    console.log(found);
    return found;
  }
}
(async () => {
  const browser = await initializeScraper();
  const maxPageNumber = await findMaxPageNumber(browser);
  console.log(maxPageNumber);

  const found = await getQuotes(browser, maxPageNumber, readOffersAndReduce);
  //sendResultsAsDiscordMessage(found);

  await browser.close();
})();

//   });
