const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');

const app = express();
const port = 5000;

function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
 }

async function openSite() {
    const browser = await puppeteer.launch({
        headless: true, 
        args: [
            '--start-maximized', 
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas', 
            '--no-first-run',
            '--no-zygote',
            '--single-process', 
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36');

    await page.setViewport({ width: 1280, height: 800 });

    await page.goto('https://demo.aviatrix.bet/');
    
    await page.reload();
    await delay(10000); 
    await page.waitForSelector('.bottom-odds-history');

    let previousContent = [];

    async function checkForChanges() {
        const currentContentRaw = await page.$$eval('.bottom-odds-history .px-1', elements => elements.map(element => element.innerText.trim()));
        const currentContent = currentContentRaw.filter(value => value !== '-');

        if (JSON.stringify(previousContent) !== JSON.stringify(currentContent)) {
            console.log("Mudança detectada:", currentContent);
            fs.writeFileSync('aviatrix-results.json', JSON.stringify(currentContent.slice(0,10).map(String)), {flag: 'w'});
            previousContent = currentContent; 
        } 

        setTimeout(checkForChanges, 2000); 
    }

    checkForChanges();
}

openSite().catch(err => console.error(err));

app.get('/', (req, res) => {
    fs.readFile('aviatrix-results.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Erro ao ler o arquivo:', err);
        res.send('Erro ao ler o arquivo.');
        return;
      }
      res.send(data);
    });
  });
  
  app.listen(port, () => {
    console.log(`Servidor web iniciado em http://localhost:${port}`);
  });