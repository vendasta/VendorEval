const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FRONTEND = 'http://localhost:5173';
const DIR = path.join(__dirname, '..', 'submission', 'video_frames');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const delay = ms => new Promise(r => setTimeout(r, ms));

async function clickBtn(page, text) {
  const btns = await page.$$('button');
  for (const b of btns) {
    const t = await page.evaluate(el => el.textContent || '', b);
    if (t.toLowerCase().includes(text.toLowerCase())) {
      await b.click();
      return true;
    }
  }
  return false;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  const vA = fs.readFileSync(path.join(__dirname, '..', 'data', 'sample_proposals', 'vendor_a_proposal.txt'), 'utf8');
  const vB = fs.readFileSync(path.join(__dirname, '..', 'data', 'sample_proposals', 'vendor_b_proposal.txt'), 'utf8');

  // FRAME 1: Login page
  console.log('F1: Login');
  await page.goto(FRONTEND + '/login', { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(1000);
  await page.screenshot({ path: path.join(DIR, 'frame_01_login.png') });

  // FRAME 2: Click Try Demo -> Dashboard
  console.log('F2: Demo login -> Dashboard');
  await clickBtn(page, 'demo');
  await delay(3000);
  await page.screenshot({ path: path.join(DIR, 'frame_02_dashboard.png') });
  console.log('   URL:', page.url());

  // FRAME 3: Click New Evaluation
  console.log('F3: New Evaluation');
  await clickBtn(page, 'new evaluation');
  await delay(2000);
  await page.screenshot({ path: path.join(DIR, 'frame_03_setup.png') });

  // FRAME 4: Fill form
  console.log('F4: Fill form');
  const inputs = await page.$$('input[type="text"], textarea');
  for (const inp of inputs) {
    const tag = await page.evaluate(el => el.tagName, inp);
    if (tag === 'INPUT') {
      await inp.click({ clickCount: 3 });
      await inp.type('Cloud Infrastructure Vendor Selection Q2 2026');
    } else {
      await inp.click({ clickCount: 3 });
      await inp.type('Need 99.9% uptime, 24x7 support, budget under INR 20,00,000 for Year 1. Must include data migration, dedicated team, no auto-renewal clauses. 2-hour P1 response time mandatory.');
    }
  }
  await delay(500);
  await page.screenshot({ path: path.join(DIR, 'frame_04_form_filled.png') });

  // FRAME 5: Click Continue -> Upload step
  console.log('F5: Upload step');
  await clickBtn(page, 'continue');
  await delay(2000);
  await page.screenshot({ path: path.join(DIR, 'frame_05_vendor_upload.png') });

  // FRAME 6: Fill vendor 1
  console.log('F6: Fill vendors');
  let vinputs = await page.$$('input[type="text"], textarea');
  if (vinputs.length >= 2) {
    await vinputs[0].click({ clickCount: 3 });
    await vinputs[0].type('TechSolutions India');
    await vinputs[1].click({ clickCount: 3 });
    await vinputs[1].type(vA.substring(0, 1500));
  }
  await delay(300);
  // Add vendor
  await clickBtn(page, 'add vendor');
  await delay(2000);

  // Fill vendor 2
  vinputs = await page.$$('input[type="text"], textarea');
  // Find empty inputs
  for (const inp of vinputs) {
    const val = await page.evaluate(el => el.value, inp);
    const tag = await page.evaluate(el => el.tagName, inp);
    if (!val || val.trim() === '') {
      if (tag === 'INPUT') {
        await inp.type('CloudForce Systems');
      } else {
        await inp.type(vB.substring(0, 1500));
      }
    }
  }
  await delay(500);
  await page.screenshot({ path: path.join(DIR, 'frame_06_vendors_filled.png') });

  // FRAME 7: Click Next/Continue to go to step 3, then Analyze
  console.log('F7: Analyze');
  let clicked = await clickBtn(page, 'next');
  if (!clicked) clicked = await clickBtn(page, 'continue');
  await delay(1000);
  // Click analyze/confirm
  await clickBtn(page, 'analy');
  if (!clicked) await clickBtn(page, 'confirm');
  await delay(5000);
  await page.screenshot({ path: path.join(DIR, 'frame_07_analyzing.png') });
  console.log('   URL:', page.url());

  // Wait for redirect to analysis page
  await delay(5000);
  await page.screenshot({ path: path.join(DIR, 'frame_08_results.png') });
  console.log('   URL after wait:', page.url());

  // If we're on the analysis page, capture tabs
  // Try clicking Comparison
  console.log('F9: Comparison');
  if (await clickBtn(page, 'compar')) {
    await delay(1500);
    await page.screenshot({ path: path.join(DIR, 'frame_09_comparison.png') });
  } else {
    await page.screenshot({ path: path.join(DIR, 'frame_09_comparison.png') });
  }

  // Red Flags
  console.log('F10: Red Flags');
  let rfClicked = await clickBtn(page, 'red flag');
  if (!rfClicked) rfClicked = await clickBtn(page, 'flag');
  await delay(1500);
  await page.screenshot({ path: path.join(DIR, 'frame_10_redflags.png') });

  // Recommendation
  console.log('F11: Recommendation');
  await clickBtn(page, 'recommend');
  await delay(1500);
  await page.screenshot({ path: path.join(DIR, 'frame_11_recommendation.png') });

  // Chat
  console.log('F12: Chat');
  await clickBtn(page, 'chat');
  await delay(1500);
  // Type message
  const chatInputs = await page.$$('input[type="text"]');
  if (chatInputs.length > 0) {
    const ci = chatInputs[chatInputs.length - 1];
    await ci.type('Compare both vendors');
    await ci.press('Enter');
    await delay(3000);
  }
  await page.screenshot({ path: path.join(DIR, 'frame_12_chat.png') });

  await browser.close();

  console.log('\nDone! Frames:');
  fs.readdirSync(DIR).filter(f => f.endsWith('.png')).sort().forEach(f => {
    const kb = Math.round(fs.statSync(path.join(DIR, f)).size / 1024);
    console.log(`  ${f} (${kb} KB)`);
  });
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
