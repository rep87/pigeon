import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const before = await page.evaluate(()=>({start: !!document.getElementById('startBtn').onclick, titleHidden: document.getElementById('titleOv').hidden}));
  await page.click('#startBtn');
  await page.waitForTimeout(300);
  const after = await page.evaluate(()=>({start: !!document.getElementById('startBtn').onclick, titleHidden: document.getElementById('titleOv').hidden, mode: window.gameModeDebug?.(), hud: document.getElementById('hudCenter').textContent}));
  console.log(before, after);
  await browser.close();
})();
