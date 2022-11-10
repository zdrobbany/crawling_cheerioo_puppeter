const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const XLSX = require("xlsx");
const path = require("path");

var pageNumber = 1;


// Test Sample
const sampleData = [
    { "url": "xxx", "title": "asdqwe" },
    { "url": "xyz", "title": "a" },
    { "url": "yyy", "title": "b" },
];

const workSheetColumnName = [
    "URL",
    "TITLE",
    "ITEM CODE"
]

const workSheetName = "Data";
const filePath = './data.xlsx';

const urlToCrawl = [
    "https://www.tokopedia.com/hinoarmindo/etalase/sparepart",
    "https://www.tokopedia.com/hinoarista/etalase/sparepart-hino-truck",
    "https://www.tokopedia.com/hinohibaindo/etalase/spare-part",
    "https://www.tokopedia.com/hinodayaguna/etalase/sparepart",
    "https://www.tokopedia.com/hinoindosentosa/etalase/sparepart-dutro",
    "https://www.tokopedia.com/mayagrahai/etalase/spare-part",
    "https://www.tokopedia.com/dutahino/etalase/sparepart-fast-moving",
    "https://www.tokopedia.com/hinompm/etalase/sparepart",
    "https://www.tokopedia.com/hinocaturkokoh/etalase/suku-cadang-spareparts",
    "https://www.tokopedia.com/hinocsbi/etalase/sparepart",
    "https://www.tokopedia.com/hinovima/etalase/spareparts",
    "https://www.tokopedia.com/hinopalembang/etalase/spare-parts",
    "https://www.tokopedia.com/hinopersada/etalase/spare-part-hino",
    "https://www.tokopedia.com/hino-lampung/etalase/sparepart",
    "https://www.tokopedia.com/hinojayaindah/etalase/sparepart-fast-moving-hino",
    "https://www.tokopedia.com/hinobengkulu/etalase/spare-part-hino",
    "https://www.tokopedia.com/hinoriau/etalase/sparepart",
    "https://www.tokopedia.com/hinotrans/etalase/sparepart",
    "https://www.tokopedia.com/hinomanado/etalase/spareparts",
    "https://www.tokopedia.com/hinopatrako/etalase/sparepart",
    "https://www.tokopedia.com/hinokumala/etalase/spare-part",
    "https://www.tokopedia.com/hinomitra/etalase/sparepart-hino",
    "https://www.tokopedia.com/hinoprima/etalase/spparepart-hino",
    "https://www.tokopedia.com/antasenaagu/etalase/spare-part",
    "https://www.tokopedia.com/ampsampit/product",
];

const data = async () => {
    var allData = [];
    for (let i = 0; i < urlToCrawl.length; i++) {
        var dataFromCrawl = await getData(urlToCrawl[i]);
        // console.log(i, " - ", urlToCrawl[i], " before concate", allData.length, dataFromCrawl.length, allData.length+dataFromCrawl.length)
        allData = allData.concat(dataFromCrawl);
        // console.log("after concate", allData.length)
        if (i === urlToCrawl.length-1) {
            exportxls(allData, workSheetColumnName, workSheetName, filePath)
        }
    }
}

data()

async function getData(url) {
    // Launch Browser
    var crawlData = [];
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });


    // Open new Browser
    const page = await browser.newPage()
    // var checkerPage = true;
    // do {

    // go to browser wait till load
    page.goto(url, { waitUntil: "load" })
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
        return {
            html: document.documentElement.innerHTML
        }
    });

    const $ = cheerio.load(pageData.html)
    var productElement = [];
    // .css-974pl -> product container display
    await $('.css-974ipl > a').each((i, obj) => {
        // const regex = /(\S){5}-(\S){5}/g // regex 
        // const regex = /\((\S){10}\)/g // regex 
        const regex = /\(([^)]+)\)|\[([^)]+)\]/g // regex global
        var codeItem = obj.attribs.title.match(regex);
        if (typeof(codeItem) === "object" && codeItem !== null) {
            codeItem = codeItem[0]
        }
        productElement[i] = {
            url: obj.attribs.href,
            title: obj.attribs.title,
            codeItem: codeItem
        }
        crawlData.push(productElement[i])
    });
    await resolveAfter5Seconds();
    await browser.close();
    return crawlData

    /** Use if using many page **/
    // if (productElement.length === 0) {
    //     checkerPage = false
    //     var jsonObject = JSON.stringify(crawlData);
    //     // console.log(jsonObject);
    //     exportxls(crawlData, workSheetColumnName, workSheetName, filePath)
    // } else {
    //     pageNumber++
    // }
    // }
    // while (checkerPage)
};

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

const exportxls = (obj, workSheetColumnName, workSheetName, filePath) => {
    // console.log('on export excel: ', obj)
    const data = obj.map(el => {
        console.log([el.url, el.title, el.codeItem])
        return [el.url, el.title, el.codeItem]
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