const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');

const FRONTEND = 'http://localhost:5173';
const EVAL_ID = 'da1221e4-cabf-4b02-bc5e-357199a2c39b';
const DIR = path.join(__dirname, '..', 'submission', 'video_frames');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function clickBtn(page, text) {
  const btns = await page.$$('button');
  for (const b of btns) {
    const t = await page.evaluate(el => el.textContent || '', b);
    if (t.toLowerCase().includes(text.toLowerCase())) { await b.click(); return true; }
  }
  return false;
}

async function main() {
  // Get token via API
  const token = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 8080, path: '/api/auth/demo', method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d).token));
    });
    req.end();
  });
  console.log('Token obtained');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  // First go to login and click Try Demo to set up auth properly
  await page.goto(FRONTEND + '/login', { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(1000);
  await clickBtn(page, 'demo');
  await delay(3000);
  console.log('Logged in, URL:', page.url());

  // Now navigate to the completed evaluation
  console.log('Navigating to evaluation:', EVAL_ID);
  await page.goto(FRONTEND + '/evaluation/' + EVAL_ID, { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(3000);
  console.log('URL:', page.url());
  await page.screenshot({ path: path.join(DIR, 'frame_08_results.png') });

  // Check if we're on the analysis page
  const title = await page.title();
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
  console.log('Page content:', bodyText.substring(0, 100));

  // Comparison
  console.log('Comparison tab...');
  if (await clickBtn(page, 'compar')) {
    await delay(2000);
    await page.screenshot({ path: path.join(DIR, 'frame_09_comparison.png') });
    console.log('  Captured comparison');
  }

  // Red Flags
  console.log('Red Flags tab...');
  let rf = await clickBtn(page, 'red flag');
  if (!rf) rf = await clickBtn(page, 'flag');
  if (!rf) rf = await clickBtn(page, 'risk');
  await delay(2000);
  await page.screenshot({ path: path.join(DIR, 'frame_10_redflags.png') });

  // Recommendation
  console.log('Recommendation tab...');
  await clickBtn(page, 'recommend');
  await delay(2000);
  await page.screenshot({ path: path.join(DIR, 'frame_11_recommendation.png') });

  // Chat
  console.log('Chat tab...');
  if (await clickBtn(page, 'chat')) {
    await delay(1500);
    const chatInputs = await page.$$('input[type="text"]');
    if (chatInputs.length > 0) {
      const ci = chatInputs[chatInputs.length - 1];
      await ci.type('Compare both vendors and tell me which is better');
      await ci.press('Enter');
      await delay(3000);
    }
    await page.screenshot({ path: path.join(DIR, 'frame_12_chat.png') });
  }

  await browser.close();

  console.log('\nFrames:');
  fs.readdirSync(DIR).filter(f => f.endsWith('.png')).sort().forEach(f => {
    const kb = Math.round(fs.statSync(path.join(DIR, f)).size / 1024);
    console.log(`  ${f} (${kb} KB)`);
  });
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
