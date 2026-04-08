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

// Read scene durations from voiceover generator
const SCENE_DURATIONS = fs.readFileSync(path.join(__dirname, '..', 'demo_audio', 'scene_durations.txt'), 'utf8').trim().split(',').map(Number);

const FPS = 4;
let frameNum = 0;

async function hold(page, label, sceneIndex) {
  const seconds = SCENE_DURATIONS[sceneIndex];
  const count = Math.round(seconds * FPS);
  for (let i = 0; i < count; i++) {
    frameNum++;
    const f = path.join(SCREENSHOT_DIR, `frame_${String(frameNum).padStart(5, '0')}.png`);
    await page.screenshot({ path: f, fullPage: false });
  }
  const startSec = SCENE_DURATIONS.slice(0, sceneIndex).reduce((a, b) => a + b, 0);
  console.log(`  [${sceneIndex}] ${label} — ${seconds}s (${startSec}s-${startSec + seconds}s)`);
}

async function setVal(page, el, value, type = 'input') {
  const proto = type === 'textarea' ? 'HTMLTextAreaElement' : 'HTMLInputElement';
  await page.evaluate((e, v, p) => {
    const setter = Object.getOwnPropertyDescriptor(window[p].prototype, 'value').set;
    setter.call(e, v);
    e.dispatchEvent(new Event('input', { bubbles: true }));
  }, el, value, proto);
}

(async () => {
  if (fs.existsSync(SCREENSHOT_DIR)) fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const totalDuration = SCENE_DURATIONS.reduce((a, b) => a + b, 0);
  console.log(`Recording ${SCENE_DURATIONS.length} scenes, total ${totalDuration}s\n`);

  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.evaluate(() => { localStorage.removeItem('vendoreval_token'); localStorage.removeItem('vendoreval_user'); });

  // 0: Login
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.login');
  await hold(page, 'Login page', 0);

  // 1: Dashboard
  await page.click('.btn--dark');
  await page.waitForSelector('.dashboard__title', { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));
  await hold(page, 'Dashboard', 1);

  // 2: Step 1 empty
  await page.click('.btn--primary');
  await new Promise(r => setTimeout(r, 800));
  await hold(page, 'Step 1 empty', 2);

  // 3: Title filled
  await page.type('.upload-form input.input', 'Enterprise IT Security & SOC Vendor Selection', { delay: 20 });
  await hold(page, 'Title filled', 3);

  // 4: Requirements filled
  const reqTA = await page.$('.upload-form .textarea');
  await setVal(page, reqTA, REQUIREMENTS, 'textarea');
  await new Promise(r => setTimeout(r, 300));
  await hold(page, 'Requirements filled', 4);

  // 5: Step 2 empty
  const btn1 = await page.$('.btn--primary');
  await btn1.click();
  await new Promise(r => setTimeout(r, 600));
  await hold(page, 'Step 2 empty', 5);

  // 6: Vendor 1 filled
  const vInputs = await page.$$('.vendor-card input.input');
  const vTexts = await page.$$('.vendor-card .textarea');
  await setVal(page, vInputs[0], 'CyberShield India');
  await setVal(page, vTexts[0], VENDOR_A, 'textarea');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => window.scrollTo(0, 0));
  await hold(page, 'Vendor 1 filled', 6);

  // 7: Vendor 2 filled
  await setVal(page, vInputs[1], 'SecureNet Solutions');
  await setVal(page, vTexts[1], VENDOR_B, 'textarea');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => window.scrollTo(0, 400));
  await new Promise(r => setTimeout(r, 200));
  await hold(page, 'Vendor 2 filled', 7);

  // 8: Review
  await page.evaluate(() => window.scrollTo(0, 9999));
  await new Promise(r => setTimeout(r, 200));
  const btns = await page.$$('.btn--primary');
  await btns[btns.length - 1].click();
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 200));
  await hold(page, 'Review', 8);

  // 9: Analysis overlay
  await page.evaluate(() => window.scrollTo(0, 9999));
  await new Promise(r => setTimeout(r, 200));
  const analyzeBtn = await page.$('.btn--success');
  await analyzeBtn.click();
  await new Promise(r => setTimeout(r, 800));
  await hold(page, 'Analysis overlay', 9);

  // Wait for redirect
  await page.waitForFunction(() => window.location.pathname.includes('/evaluation/'), { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  // 10: Winner banner
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await hold(page, 'Winner banner', 10);

  // 11: Score cards
  await page.evaluate(() => window.scrollTo(0, 280));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Score cards', 11);

  // 12: Radar chart
  await page.evaluate(() => window.scrollTo(0, 750));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Radar chart', 12);

  // 13: Recommendation
  await page.evaluate(() => window.scrollTo(0, 1300));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Recommendation', 13);

  // 14: Negotiation tips
  await page.evaluate(() => window.scrollTo(0, 1800));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Negotiation tips', 14);

  // 15: Comparison table
  const sb1 = await page.$$('.layout__sidebar-item');
  await sb1[1].click();
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await hold(page, 'Comparison table', 15);

  // 16: Comparison chart
  await page.evaluate(() => window.scrollTo(0, 500));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Comparison chart', 16);

  // 17: Red flags summary
  const sb2 = await page.$$('.layout__sidebar-item');
  await sb2[2].click();
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await hold(page, 'Red flags summary', 17);

  // 18: Flags expanded
  const flags = await page.$$('.flag-card__header');
  if (flags[0]) await flags[0].click();
  await new Promise(r => setTimeout(r, 400));
  if (flags[1]) await flags[1].click();
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Flags expanded', 18);

  // 19: Chat + question typed
  const sb3 = await page.$$('.layout__sidebar-item');
  await sb3[3].click();
  await new Promise(r => setTimeout(r, 1200));
  const chatInput = await page.$('.chat__input');
  if (chatInput) {
    await chatInput.type('Why is CyberShield recommended over SecureNet?', { delay: 30 });
  }
  await hold(page, 'Chat + question', 19);

  // 20: Chat response
  const sendBtn = await page.$('.chat__send-btn');
  if (sendBtn) {
    await sendBtn.click();
    await page.waitForFunction(() => {
      const msgs = document.querySelectorAll('.chat-message--assistant');
      return msgs.length >= 2;
    }, { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
  }
  await hold(page, 'Chat response', 20);

  // 21: Report header
  const exportBtn = await page.$('.btn--primary.btn--sm');
  if (exportBtn) {
    await exportBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 300));
  }
  await hold(page, 'Report header', 21);

  // 22: Report details
  await page.evaluate(() => window.scrollTo(0, 600));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Report details', 22);

  // 23: End
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await hold(page, 'End frame', 23);

  await browser.close();

  // Compile video
  console.log('\nCompiling video...');
  execSync(`ffmpeg -y -framerate ${FPS} -i "${SCREENSHOT_DIR}/frame_%05d.png" -vf "scale=1440:900" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 "${OUTPUT_VIDEO}"`, { stdio: 'inherit' });

  console.log(`\nVideo: ${OUTPUT_VIDEO} (${frameNum} frames, ${totalDuration}s)`);
  fs.rmSync(SCREENSHOT_DIR, { recursive: true });
})();
