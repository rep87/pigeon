const { chromium } = require('playwright');
(async()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg=>{ console.log('CONSOLE', msg.type(), msg.text()); });
  page.on('pageerror', err=>{ console.log('PAGEERR', err.message); });
  page.on('requestfailed', req=>{ const f=req.failure(); if(req.url().includes('/src/game.js')||req.url().includes('/config/')) console.log('REQFAIL', req.url(), f&&f.errorText);});
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.waitForTimeout(1200);
  const before = await page.$eval('#titleOv', el=>el.hidden);
  console.log('title hidden before', before);
  await page.click('#startBtn');
  await page.waitForTimeout(1200);
  const after = await page.$eval('#titleOv', el=>el.hidden);
  const mode = await page.evaluate(() => (window.game?.mode || window._gpMode || 'none'));
  console.log('title hidden after', after, 'mode', mode);
  await browser.close();
})();
