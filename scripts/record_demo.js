const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'demo_frames');
const OUTPUT_VIDEO = path.join(__dirname, '..', 'VendorEval_AI_Demo.mp4');

const REQUIREMENTS = fs.readFileSync(path.join(__dirname, '..', 'data', 'demo_security', 'requirements.txt'), 'utf8');
const VENDOR_A = fs.readFileSync(path.join(__dirname, '..', 'data', 'demo_security', 'CyberShield_India_Proposal.txt'), 'utf8');
const VENDOR_B = fs.readFileSync(path.join(__dirname, '..', 'data', 'demo_security', 'SecureNet_Solutions_Proposal.txt'), 'utf8');

let frameNum = 0;

async function screenshot(page, label, duration = 2) {
  // Take multiple frames for the duration (at 2 fps for smooth video)
  const framesForDuration = Math.max(1, Math.round(duration * 2));
  for (let i = 0; i < framesForDuration; i++) {
    frameNum++;
    const filename = path.join(SCREENSHOT_DIR, `frame_${String(frameNum).padStart(5, '0')}.png`);
    await page.screenshot({ path: filename, fullPage: false });
  }
  console.log(`  [${label}] — ${duration}s (${framesForDuration} frames)`);
}

async function typeSlowly(page, selector, text, delay = 8) {
  await page.focus(selector);
  // Clear existing content
  await page.evaluate((sel) => { document.querySelector(sel).value = ''; }, selector);
  // Type first 120 chars slowly for visual effect, then set the rest instantly
  const visiblePart = text.slice(0, 120);
  const rest = text.slice(120);
  await page.type(selector, visiblePart, { delay });
  if (rest) {
    await page.evaluate((sel, val) => {
      const el = document.querySelector(sel);
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(el, el.value + val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, selector, rest);
  }
}

async function setInputValue(page, selector, text) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement : window.HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto.prototype, 'value').set;
    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, text);
}

(async () => {
  // Clean up
  if (fs.existsSync(SCREENSHOT_DIR)) fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  // Clear any existing session
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.removeItem('vendoreval_token');
    localStorage.removeItem('vendoreval_user');
  });

  // ===== SCENE 1: LOGIN PAGE =====
  console.log('\n--- Scene 1: Login Page ---');
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.login');
  await screenshot(page, 'Login page visible', 4);

  // Click demo button
  console.log('  Clicking demo login...');
  await page.click('.btn--dark');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  // ===== SCENE 2: DASHBOARD =====
  console.log('\n--- Scene 2: Dashboard ---');
  await page.waitForSelector('.dashboard__title', { timeout: 10000 }).catch(() => {});
  await screenshot(page, 'Dashboard loaded', 4);

  // ===== SCENE 3: NEW EVALUATION =====
  console.log('\n--- Scene 3: New Evaluation ---');
  await page.click('.btn--primary'); // New Evaluation button
  await new Promise(r => setTimeout(r, 1000));
  await screenshot(page, 'Upload page - Step 1', 3);

  // Fill in title
  console.log('  Filling evaluation title...');
  await typeSlowly(page, '.upload-form input.input', 'Enterprise IT Security & SOC Vendor Selection', 30);
  await screenshot(page, 'Title entered', 2);

  // Fill in requirements
  console.log('  Filling requirements...');
  await setInputValue(page, '.upload-form .textarea', REQUIREMENTS);
  await new Promise(r => setTimeout(r, 500));
  await screenshot(page, 'Requirements pasted', 4);

  // Click Continue
  await page.click('.btn--primary');
  await new Promise(r => setTimeout(r, 800));

  // ===== SCENE 4: VENDOR PROPOSALS =====
  console.log('\n--- Scene 4: Vendor Proposals ---');
  await screenshot(page, 'Step 2 - Vendor proposals', 3);

  // Vendor 1
  console.log('  Filling Vendor 1 (CyberShield)...');
  const vendorInputs = await page.$$('.vendor-card input.input');
  const vendorTextareas = await page.$$('.vendor-card .textarea');

  if (vendorInputs[0]) {
    await vendorInputs[0].click();
    await page.evaluate((el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, vendorInputs[0], 'CyberShield India');
  }
  await new Promise(r => setTimeout(r, 300));
  if (vendorTextareas[0]) {
    await page.evaluate((el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, vendorTextareas[0], VENDOR_A);
  }
  await new Promise(r => setTimeout(r, 500));
  await screenshot(page, 'Vendor 1 filled', 3);

  // Vendor 2
  console.log('  Filling Vendor 2 (SecureNet)...');
  if (vendorInputs[1]) {
    await page.evaluate((el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, vendorInputs[1], 'SecureNet Solutions');
  }
  await new Promise(r => setTimeout(r, 300));
  if (vendorTextareas[1]) {
    await page.evaluate((el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, vendorTextareas[1], VENDOR_B);
  }
  await new Promise(r => setTimeout(r, 500));

  // Scroll down to show both vendors
  await page.evaluate(() => window.scrollTo(0, 300));
  await new Promise(r => setTimeout(r, 300));
  await screenshot(page, 'Vendor 2 filled', 3);

  // Click Continue to Review
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 300));
  const continueBtn = await page.$('.btn--primary');
  await continueBtn.click();
  await new Promise(r => setTimeout(r, 800));

  // ===== SCENE 5: REVIEW =====
  console.log('\n--- Scene 5: Review ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await screenshot(page, 'Review step', 4);

  // Click Start AI Analysis
  console.log('  Starting AI analysis...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 300));
  const analyzeBtn = await page.$('.btn--success');
  await analyzeBtn.click();
  await new Promise(r => setTimeout(r, 500));

  // ===== SCENE 6: ANALYSIS OVERLAY =====
  console.log('\n--- Scene 6: Analysis in progress ---');
  await screenshot(page, 'Analysis overlay', 3);

  // Wait for analysis to complete and redirect
  await page.waitForFunction(() => window.location.pathname.includes('/evaluation/'), { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // ===== SCENE 7: ANALYSIS RESULTS - OVERVIEW =====
  console.log('\n--- Scene 7: Analysis Results - Overview ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await screenshot(page, 'Overview - Winner banner', 5);

  // Scroll to score cards
  await page.evaluate(() => window.scrollTo(0, 350));
  await new Promise(r => setTimeout(r, 500));
  await screenshot(page, 'Overview - Score cards', 4);

  // Scroll to radar chart
  await page.evaluate(() => window.scrollTo(0, 800));
  await new Promise(r => setTimeout(r, 500));
  await screenshot(page, 'Overview - Radar chart', 4);

  // Scroll to recommendation
  await page.evaluate(() => window.scrollTo(0, 1400));
  await new Promise(r => setTimeout(r, 500));
  await screenshot(page, 'Overview - Recommendation', 4);

  // Scroll further for negotiation tips
  await page.evaluate(() => window.scrollTo(0, 2000));
  await new Promise(r => setTimeout(r, 500));
  await screenshot(page, 'Overview - Negotiation tips', 3);

  // ===== SCENE 8: COMPARISON TAB =====
  console.log('\n--- Scene 8: Comparison ---');
  const sidebarItems = await page.$$('.layout__sidebar-item');
  if (sidebarItems[1]) await sidebarItems[1].click();
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await screenshot(page, 'Comparison table', 5);

  // Scroll to bar chart
  await page.evaluate(() => window.scrollTo(0, 500));
  await new Promise(r => setTimeout(r, 500));
  await screenshot(page, 'Comparison bar chart', 3);

  // ===== SCENE 9: RED FLAGS TAB =====
  console.log('\n--- Scene 9: Red Flags ---');
  const sidebarItems2 = await page.$$('.layout__sidebar-item');
  if (sidebarItems2[2]) await sidebarItems2[2].click();
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await screenshot(page, 'Red flags summary', 4);

  // Click on a flag to expand it
  const flagHeaders = await page.$$('.flag-card__header');
  if (flagHeaders[0]) await flagHeaders[0].click();
  await new Promise(r => setTimeout(r, 500));
  await screenshot(page, 'Red flag expanded', 4);

  // Expand another
  if (flagHeaders[1]) await flagHeaders[1].click();
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => window.scrollTo(0, 300));
  await new Promise(r => setTimeout(r, 300));
  await screenshot(page, 'More red flags', 3);

  // ===== SCENE 10: AI CHAT =====
  console.log('\n--- Scene 10: AI Chat ---');
  const sidebarItems3 = await page.$$('.layout__sidebar-item');
  if (sidebarItems3[3]) await sidebarItems3[3].click();
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await screenshot(page, 'Chat interface', 3);

  // Type a question
  const chatInput = await page.$('.chat__input');
  if (chatInput) {
    await chatInput.type('Why is CyberShield recommended over SecureNet?', { delay: 25 });
    await screenshot(page, 'Chat question typed', 2);

    // Submit
    const sendBtn = await page.$('.chat__send-btn');
    if (sendBtn) await sendBtn.click();
    await new Promise(r => setTimeout(r, 3000));
    await screenshot(page, 'Chat response', 5);
  }

  // ===== SCENE 11: EXPORT REPORT =====
  console.log('\n--- Scene 11: Export Report ---');
  const exportBtn = await page.$('.btn--primary.btn--sm');
  if (exportBtn) {
    await exportBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 300));
    await screenshot(page, 'Report view', 4);

    await page.evaluate(() => window.scrollTo(0, 600));
    await new Promise(r => setTimeout(r, 300));
    await screenshot(page, 'Report details', 3);
  }

  // Final frame
  await screenshot(page, 'End', 2);

  await browser.close();

  // ===== COMPILE VIDEO =====
  console.log('\n--- Compiling video with ffmpeg ---');
  const ffmpegCmd = `ffmpeg -y -framerate 2 -i "${SCREENSHOT_DIR}/frame_%05d.png" -vf "scale=1440:900" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 "${OUTPUT_VIDEO}"`;
  console.log('  Running:', ffmpegCmd);
  execSync(ffmpegCmd, { stdio: 'inherit' });

  console.log(`\nDemo video saved: ${OUTPUT_VIDEO}`);
  console.log(`Total frames captured: ${frameNum}`);

  // Cleanup
  fs.rmSync(SCREENSHOT_DIR, { recursive: true });
})();
