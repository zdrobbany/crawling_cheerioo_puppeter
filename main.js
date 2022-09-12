const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const XLSX = require("xlsx");
const path = require("path");

var pageNumber = 1;
var crawlData = [];

// Test Sample
const sampleData = [
    {"url": "xxx", "title": "asdqwe"},
    {"url": "xyz", "title": "a"},
    {"url": "yyy", "title": "b"},
];

const workSheetColumnName = [
    "URL",
    "TITLE",
    "ITEM CODE"
]

const workSheetName = "Data";
const filePath = './data.xlsx';

(async () => {
    // Launch Browser
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });
    // Open new Browser
    const page = await browser.newPage()
    var checkerPage = true;
    do {
    // const url = 'https://www.tokopedia.com/hinopersada/product/page/' + pageNumber;
    // const url = 'https://www.tokopedia.com/hinoarmindo/product/page/' + pageNumber;
    const url = 'https://www.tokopedia.com/hinocaturkokoh/product/page/' + pageNumber;
     // go to browser wait till load
    page.goto(url, {waitUntil: "load"})
    function resolveAfter5Seconds() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(autoScroll(page));
            }, 5000)
        })
    }

    await page.setViewport({ // set view port
        width: 1200,
        height: 800
    });

    await resolveAfter5Seconds();
    // Call function to scroll

    // Start Evaluate PageData
    const pageData = await page.evaluate(() => {
        // console.log('here: ', document.readyState === 'complete');
        return {
            html: document.documentElement.innerHTML
        }
    });

    const $ = cheerio.load(pageData.html)
    var productElement = [];
    // .css-974pl -> product container display
    await $('.css-974ipl > a').each((i,obj) => {
        // const regex = /(\S){5}-(\S){5}/g // regex hinopersada
        // const regex = /\((\S){10}\)/g // regex hinoarmindo
        const regex = /(\S){10}/g // regex hinocatur kokoh
        var codeItem = obj.attribs.title.match(regex);

        productElement[i]= {
            url: obj.attribs.href,
            title: obj.attribs.title,
            codeItem: codeItem
        }
        crawlData.push(productElement[i])
    });
    // console.log(crawlData.length)
    
    if (productElement.length === 0) {
        checkerPage = false
        var jsonObject = JSON.stringify(crawlData);
        // console.log(jsonObject);
        exportxls(crawlData, workSheetColumnName, workSheetName, filePath)
        await browser.close();
    } else {
        pageNumber++
    }
    }
    while (checkerPage)
})();

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

const exportxls =(obj, workSheetColumnName, workSheetName, filePath) => {
    const data = obj.map(el => {
        return [el.url , el.title, el.codeItem]
    });
    const workBook = XLSX.utils.book_new();
    const workSheetData = [
        workSheetColumnName,
        ...data
    ]
    const workSheet = XLSX.utils.aoa_to_sheet(workSheetData);
    XLSX.utils.book_append_sheet(workBook, workSheet, workSheetName);
    XLSX.writeFile(workBook, path.resolve(filePath));
    return true;
}

// exportxls(sampleData, workSheetColumnName, workSheetName, filePath)