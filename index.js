const express = require('express');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/post-to-linkedin', async (req, res) => {
    const { content, l_userName, l_password } = req.body;
    const URL = 'https://www.linkedin.com/feed/';

    try {
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: false,
        });
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(30000);
        await page.goto(URL, { waitUntil: 'load' });
        await page.type('#username', l_userName);
        await page.type('#password', l_password);
        await page.click(`[aria-label="Sign in"]`);
        await page.waitForNavigation();
        await page.waitForSelector('button[class="artdeco-button artdeco-button--muted artdeco-button--4 artdeco-button--tertiary ember-view share-box-feed-entry__trigger"]');
        await page.click('button[class="artdeco-button artdeco-button--muted artdeco-button--4 artdeco-button--tertiary ember-view share-box-feed-entry__trigger"]');
        await page.waitForSelector('.share-unified-settings-entry-button');
        await page.click('.share-unified-settings-entry-button');
        await page.waitForSelector('#CONTAINER');
        await page.click('#CONTAINER');
        await page.waitForSelector('.sharing-shared-generic-list__item-button');
        const groups = await page.$$('.sharing-shared-generic-list__item-button');

        function delay(time) {
            return new Promise(function (resolve) {
                setTimeout(resolve, time)
            });
        }

        for (let i = 0; i < groups.length; i++) {
            // Re-query the groups inside the loop to ensure they are still in the DOM [ERROR: Node detached from document]
            const groups = await page.$$('.sharing-shared-generic-list__item-button');

            const group = groups[i];
            await group.click();
            await page.click('.share-box-footer__primary-btn');
            await delay(1000); // 3000
            await page.evaluate(() => {
                const primaryBtn = document.querySelector('.share-box-footer__primary-btn.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view');
                if (primaryBtn) {
                    primaryBtn.click();
                }
            });
            await page.evaluate((content) => {
                const textField = document.querySelector('div[aria-label="Text editor for creating content"] > p');
                if (textField) {
                    textField.textContent = content;
                }
            }, content);
            await delay(2000); // 7000 -> 3000

            //! <-- Add Images to post
            const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click('[aria-label="Add media"]'),
            ]);
            await delay(2000); // 3000
            await fileChooser.accept(['post.jpg']);
            await delay(2000); // 3000
            await page.waitForSelector('button[class="share-box-footer__primary-btn artdeco-button artdeco-button--2 artdeco-button--primary ember-view"]');
            await page.click('button[class="share-box-footer__primary-btn artdeco-button artdeco-button--2 artdeco-button--primary ember-view"]');
            //! Add Images to post -->

            await delay(2000);
            await page.waitForSelector('button[class="share-actions__primary-action artdeco-button artdeco-button--2 artdeco-button--primary ember-view"]');
            await page.click('button[class="share-actions__primary-action artdeco-button artdeco-button--2 artdeco-button--primary ember-view"]');
            await delay(8000);

            if (i === groups.length - 1) {
                // Last group
                await page.waitForSelector('button[class="artdeco-button artdeco-button--muted artdeco-button--4 artdeco-button--tertiary ember-view share-box-feed-entry__trigger"]');
                await page.click('button[class="artdeco-button artdeco-button--muted artdeco-button--4 artdeco-button--tertiary ember-view share-box-feed-entry__trigger"]');
                await page.waitForSelector('.share-unified-settings-entry-button');
                await page.click('.share-unified-settings-entry-button');
                await page.waitForSelector('button[id="ANYONE"]');
                await page.click('button[id="ANYONE"]');
                await page.evaluate(() => {
                    const primaryBtn = document.querySelector('.share-box-footer__primary-btn.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view');
                    if (primaryBtn) {
                        primaryBtn.click();
                    }
                });
                console.log('Posting Completed !!!!');
                await browser.close();
                res.send('Posting Completed !!!!');
            } else {
                // Not the last group
                await page.waitForSelector('button[class="artdeco-button artdeco-button--muted artdeco-button--4 artdeco-button--tertiary ember-view share-box-feed-entry__trigger"]');
                await page.click('button[class="artdeco-button artdeco-button--muted artdeco-button--4 artdeco-button--tertiary ember-view share-box-feed-entry__trigger"]');
                await page.waitForSelector('.share-unified-settings-entry-button');
                await page.click('.share-unified-settings-entry-button');
                await page.waitForSelector('#CONTAINER');
                await page.click('#CONTAINER');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error posting to LinkedIn');
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});