const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    path: 'output.csv',
    header: [
        {id: 'title', title: 'TITLE'},
        {id: 'price', title: 'PRICE'},
    ]
});

async function scrapeData(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', handleRequestInterception);

    await page.goto(url);
    await page.waitForSelector('.__inner', { timeout: 10000 });

    const products = await page.evaluate(() => {
        const productCards = document.querySelectorAll('.__inner');

        return Array.from(productCards).map(card => {
            const title = card.querySelector('.__name')?.innerText;
            const priceElement = card.querySelector('.__price-value');
            const price = priceElement ? priceElement.innerText.replace(/\s+/g, '') : '';

            console.log('Название:', title, 'Цена:', price);
            return { title, price };
        });
    });

    await browser.close();
    return products;
}

function handleRequestInterception(req) {
    if (['image', 'stylesheet', 'font', 'script'].includes(req.resourceType())) {
        req.abort();
    } else {
        req.continue();
    }
}

const url = 'https://usmall.ru/products/men/clothes/bombers-jackets';

scrapeData(url).then((products) => {
    csvWriter.writeRecords(products)
        .then(() => console.log('Data has been written into CSV file.'));
});