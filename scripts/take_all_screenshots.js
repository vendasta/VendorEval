const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FRONTEND = 'http://localhost:5173';
const BACKEND = 'http://localhost:8080';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'submission', 'screenshots');

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function clickButtonContaining(page, text) {
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const btnText = await page.evaluate(el => el.textContent, btn);
    if (btnText && btnText.toLowerCase().includes(text.toLowerCase())) {
      await btn.click();
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

  // 1. Login Page
  console.log('1. Login Page...');
  await page.goto(FRONTEND + '/login', { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-page.png') });
  console.log('   OK');

  // 2. Click "Try Demo" to login
  console.log('2. Clicking Try Demo...');
  await clickButtonContaining(page, 'demo');
  await delay(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-dashboard.png') });
  console.log('   Dashboard: ' + page.url());

  // 3. Click "New Evaluation" or "Create"
  console.log('3. Creating new evaluation...');
  let clicked = await clickButtonContaining(page, 'new');
  if (!clicked) clicked = await clickButtonContaining(page, 'create');
  if (!clicked) clicked = await clickButtonContaining(page, 'start');
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-new-evaluation.png') });
  console.log('   URL: ' + page.url());

  // 4. Fill the evaluation form
  console.log('4. Filling form...');
  const allInputs = await page.$$('input, textarea');
  for (const input of allInputs) {
    const type = await page.evaluate(el => el.type, input);
    const tag = await page.evaluate(el => el.tagName, input);
    const placeholder = await page.evaluate(el => el.placeholder || '', input);

    if (type === 'text' || (tag === 'INPUT' && !type)) {
      await input.click({ clickCount: 3 });
      await input.type('Cloud Infrastructure Vendor Selection Q2 2026');
    } else if (tag === 'TEXTAREA') {
      await input.click({ clickCount: 3 });
      await input.type('Need 99.9% uptime, 24x7 support, budget under INR 20,00,000 for Year 1. Must include data migration, dedicated team, no auto-renewal clauses. 2-hour P1 response time mandatory.');
    }
  }
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-form-filled.png') });

  // Submit/Next
  let submitted = await clickButtonContaining(page, 'next');
  if (!submitted) submitted = await clickButtonContaining(page, 'continue');
  if (!submitted) submitted = await clickButtonContaining(page, 'create');
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-upload-step.png') });
  console.log('   Upload step: ' + page.url());

  // 5. Upload vendor proposals - find text area or upload area
  console.log('5. Uploading vendor proposals...');
  const vendorA = fs.readFileSync(path.join(__dirname, '..', 'data', 'sample_proposals', 'vendor_a_proposal.txt'), 'utf8');
  const vendorB = fs.readFileSync(path.join(__dirname, '..', 'data', 'sample_proposals', 'vendor_b_proposal.txt'), 'utf8');

  // Fill vendor name and content
  const vendorInputs = await page.$$('input[type="text"], textarea');
  if (vendorInputs.length >= 2) {
    await vendorInputs[0].click({ clickCount: 3 });
    await vendorInputs[0].type('TechSolutions India');
    await vendorInputs[1].click({ clickCount: 3 });
    await vendorInputs[1].type(vendorA.substring(0, 2000));
  } else if (vendorInputs.length === 1) {
    await vendorInputs[0].click({ clickCount: 3 });
    await vendorInputs[0].type('TechSolutions India');
  }
  await delay(500);

  // Click add/upload vendor
  let addedVendor = await clickButtonContaining(page, 'add');
  if (!addedVendor) addedVendor = await clickButtonContaining(page, 'upload');
  await delay(2000);

  // Second vendor
  const vendorInputs2 = await page.$$('input[type="text"], textarea');
  if (vendorInputs2.length >= 2) {
    await vendorInputs2[0].click({ clickCount: 3 });
    await vendorInputs2[0].type('CloudForce Systems');
    await vendorInputs2[1].click({ clickCount: 3 });
    await vendorInputs2[1].type(vendorB.substring(0, 2000));
  }
  await delay(500);
  addedVendor = await clickButtonContaining(page, 'add');
  if (!addedVendor) addedVendor = await clickButtonContaining(page, 'upload');
  await delay(2000);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-vendors-added.png') });
  console.log('   Vendors added');

  // 6. Click Analyze / Confirm / Next
  console.log('6. Running analysis...');
  let analyzed = await clickButtonContaining(page, 'analy');
  if (!analyzed) analyzed = await clickButtonContaining(page, 'confirm');
  if (!analyzed) analyzed = await clickButtonContaining(page, 'next');
  if (!analyzed) analyzed = await clickButtonContaining(page, 'evaluate');
  await delay(5000); // wait for analysis
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-analysis-results.png') });
  console.log('   Analysis: ' + page.url());

  // 7. Now we should be on the analysis page — capture tabs
  // Wait a bit more for any redirects
  await delay(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-overview.png') });

  // Comparison tab
  console.log('7. Comparison tab...');
  await clickButtonContaining(page, 'compar');
  await delay(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-comparison.png') });

  // Red Flags tab
  console.log('8. Red Flags tab...');
  let clickedFlags = await clickButtonContaining(page, 'red flag');
  if (!clickedFlags) clickedFlags = await clickButtonContaining(page, 'flag');
  if (!clickedFlags) clickedFlags = await clickButtonContaining(page, 'risk');
  await delay(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-red-flags.png') });

  // Recommendation tab
  console.log('9. Recommendation tab...');
  await clickButtonContaining(page, 'recommend');
  await delay(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-recommendation.png') });

  // Chat tab
  console.log('10. Chat tab...');
  let chatClicked = await clickButtonContaining(page, 'chat');
  if (!chatClicked) chatClicked = await clickButtonContaining(page, 'ask');
  await delay(1500);

  // Type a question in chat
  const chatInputs = await page.$$('input[type="text"]');
  if (chatInputs.length > 0) {
    const lastInput = chatInputs[chatInputs.length - 1];
    await lastInput.type('Compare both vendors and tell me which is better');
    await delay(300);
    // Click send or press enter
    await lastInput.press('Enter');
    await delay(3000);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-chat.png') });

  // Full page screenshot
  console.log('11. Full page...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-full-page.png'), fullPage: true });

  await browser.close();

  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
  console.log('\nDone! ' + files.length + ' screenshots saved.');
  files.forEach(f => {
    const size = fs.statSync(path.join(SCREENSHOT_DIR, f)).size;
    console.log('  ' + f + ' (' + Math.round(size/1024) + ' KB)');
  });
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
