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

// Frame-accurate timing: 4 fps for smooth enough video with smaller frame count
const FPS = 4;
let frameNum = 0;
const sceneLog = []; // Track scene start/end for voiceover sync

async function hold(page, label, seconds) {
  const startFrame = frameNum + 1;
  const count = Math.round(seconds * FPS);
  for (let i = 0; i < count; i++) {
    frameNum++;
    const f = path.join(SCREENSHOT_DIR, `frame_${String(frameNum).padStart(5, '0')}.png`);
    await page.screenshot({ path: f, fullPage: false });
  }
  sceneLog.push({ label, startFrame, endFrame: frameNum, startSec: (startFrame - 1) / FPS, endSec: frameNum / FPS, duration: seconds });
  console.log(`  [${label}] ${seconds}s @ ${((startFrame - 1) / FPS).toFixed(1)}s-${(frameNum / FPS).toFixed(1)}s`);
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

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  // Clear session
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.removeItem('vendoreval_token');
    localStorage.removeItem('vendoreval_user');
  });

  // ===== SCENE 1: LOGIN PAGE (0s - 4s) =====
  console.log('\n--- Scene 1: Login Page ---');
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.login');
  await hold(page, 'Login page', 4);

  // ===== SCENE 2: DEMO LOGIN -> DASHBOARD (4s - 9s) =====
  console.log('\n--- Scene 2: Dashboard ---');
  await page.click('.btn--dark');
  await page.waitForSelector('.dashboard__title', { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => window.scrollTo(0, 0));
  await hold(page, 'Dashboard overview', 5);

  // ===== SCENE 3: CLICK NEW EVALUATION (9s - 12s) =====
  console.log('\n--- Scene 3: New Evaluation - Step 1 empty ---');
  await page.click('.btn--primary');
  await new Promise(r => setTimeout(r, 800));
  await hold(page, 'Step 1 empty', 3);

  // ===== SCENE 4: FILL TITLE (12s - 15s) =====
  console.log('\n--- Scene 4: Fill title ---');
  const titleInput = await page.$('.upload-form input.input');
  await titleInput.click();
  await page.type('.upload-form input.input', 'Enterprise IT Security & SOC Vendor Selection', { delay: 20 });
  await hold(page, 'Title filled', 3);

  // ===== SCENE 5: FILL REQUIREMENTS (15s - 20s) =====
  console.log('\n--- Scene 5: Fill requirements ---');
  const reqTextarea = await page.$('.upload-form .textarea');
  await setVal(page, reqTextarea, REQUIREMENTS, 'textarea');
  await new Promise(r => setTimeout(r, 300));
  await hold(page, 'Requirements filled', 5);

  // ===== SCENE 6: CLICK CONTINUE -> STEP 2 (20s - 23s) =====
  console.log('\n--- Scene 6: Step 2 - Vendor Proposals ---');
  const continueBtn1 = await page.$('.btn--primary');
  await continueBtn1.click();
  await new Promise(r => setTimeout(r, 600));
  await hold(page, 'Step 2 empty', 3);

  // ===== SCENE 7: FILL VENDOR 1 (23s - 27s) =====
  console.log('\n--- Scene 7: Fill Vendor 1 ---');
  const vInputs = await page.$$('.vendor-card input.input');
  const vTexts = await page.$$('.vendor-card .textarea');
  await setVal(page, vInputs[0], 'CyberShield India');
  await setVal(page, vTexts[0], VENDOR_A, 'textarea');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => window.scrollTo(0, 0));
  await hold(page, 'Vendor 1 filled', 4);

  // ===== SCENE 8: FILL VENDOR 2 (27s - 31s) =====
  console.log('\n--- Scene 8: Fill Vendor 2 ---');
  await setVal(page, vInputs[1], 'SecureNet Solutions');
  await setVal(page, vTexts[1], VENDOR_B, 'textarea');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => window.scrollTo(0, 400));
  await new Promise(r => setTimeout(r, 200));
  await hold(page, 'Vendor 2 filled', 4);

  // ===== SCENE 9: CLICK CONTINUE -> REVIEW (31s - 36s) =====
  console.log('\n--- Scene 9: Review ---');
  await page.evaluate(() => window.scrollTo(0, 9999));
  await new Promise(r => setTimeout(r, 200));
  const btns = await page.$$('.btn--primary');
  const continueBtn2 = btns[btns.length - 1];
  await continueBtn2.click();
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 200));
  await hold(page, 'Review step', 5);

  // ===== SCENE 10: START ANALYSIS (36s - 40s) =====
  console.log('\n--- Scene 10: Analysis in progress ---');
  await page.evaluate(() => window.scrollTo(0, 9999));
  await new Promise(r => setTimeout(r, 200));
  const analyzeBtn = await page.$('.btn--success');
  await analyzeBtn.click();
  await new Promise(r => setTimeout(r, 800));
  await hold(page, 'Analysis overlay', 4);

  // Wait for redirect
  await page.waitForFunction(() => window.location.pathname.includes('/evaluation/'), { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  // ===== SCENE 11: OVERVIEW - WINNER BANNER (40s - 46s) =====
  console.log('\n--- Scene 11: Overview - Winner ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await hold(page, 'Winner banner', 6);

  // ===== SCENE 12: OVERVIEW - SCORE CARDS (46s - 51s) =====
  console.log('\n--- Scene 12: Score cards ---');
  await page.evaluate(() => window.scrollTo(0, 280));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Score cards + dimension bars', 5);

  // ===== SCENE 13: OVERVIEW - RADAR CHART (51s - 56s) =====
  console.log('\n--- Scene 13: Radar chart ---');
  await page.evaluate(() => window.scrollTo(0, 750));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Radar chart', 5);

  // ===== SCENE 14: OVERVIEW - RECOMMENDATION (56s - 60s) =====
  console.log('\n--- Scene 14: Recommendation ---');
  await page.evaluate(() => window.scrollTo(0, 1300));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Recommendation reasoning', 4);

  // ===== SCENE 15: OVERVIEW - TIPS (60s - 64s) =====
  console.log('\n--- Scene 15: Negotiation tips ---');
  await page.evaluate(() => window.scrollTo(0, 1800));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Negotiation tips + risks', 4);

  // ===== SCENE 16: COMPARISON TAB (64s - 70s) =====
  console.log('\n--- Scene 16: Comparison ---');
  const sidebar = await page.$$('.layout__sidebar-item');
  await sidebar[1].click();
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await hold(page, 'Comparison table', 6);

  // ===== SCENE 17: COMPARISON BAR CHART (70s - 73s) =====
  console.log('\n--- Scene 17: Comparison chart ---');
  await page.evaluate(() => window.scrollTo(0, 500));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Comparison bar chart', 3);

  // ===== SCENE 18: RED FLAGS (73s - 78s) =====
  console.log('\n--- Scene 18: Red Flags ---');
  const sidebar2 = await page.$$('.layout__sidebar-item');
  await sidebar2[2].click();
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await hold(page, 'Red flags summary', 5);

  // ===== SCENE 19: EXPAND FLAGS (78s - 83s) =====
  console.log('\n--- Scene 19: Expanded flags ---');
  const flags = await page.$$('.flag-card__header');
  if (flags[0]) await flags[0].click();
  await new Promise(r => setTimeout(r, 400));
  if (flags[1]) await flags[1].click();
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Flags expanded', 5);

  // ===== SCENE 20: AI CHAT (83s - 87s) =====
  console.log('\n--- Scene 20: AI Chat ---');
  const sidebar3 = await page.$$('.layout__sidebar-item');
  await sidebar3[3].click();
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => window.scrollTo(0, 0));
  await hold(page, 'Chat initial', 4);

  // ===== SCENE 21: TYPE QUESTION (87s - 90s) =====
  console.log('\n--- Scene 21: Chat question ---');
  const chatInput = await page.$('.chat__input');
  if (chatInput) {
    await chatInput.type('Why is CyberShield recommended over SecureNet?', { delay: 30 });
    await hold(page, 'Chat question typed', 3);

    // ===== SCENE 22: CHAT RESPONSE (90s - 97s) =====
    console.log('\n--- Scene 22: Chat response ---');
    const sendBtn = await page.$('.chat__send-btn');
    if (sendBtn) {
      await sendBtn.click();
      // Wait for response properly
      await page.waitForFunction(() => {
        const msgs = document.querySelectorAll('.chat-message--assistant');
        return msgs.length >= 2; // Initial greeting + actual response
      }, { timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
      await hold(page, 'Chat response visible', 7);
    }
  }

  // ===== SCENE 23: EXPORT REPORT (97s - 102s) =====
  console.log('\n--- Scene 23: Export Report ---');
  const exportBtn = await page.$('.btn--primary.btn--sm');
  if (exportBtn) {
    await exportBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 300));
    await hold(page, 'Report header', 5);
  }

  // ===== SCENE 24: REPORT DETAILS (102s - 106s) =====
  console.log('\n--- Scene 24: Report details ---');
  await page.evaluate(() => window.scrollTo(0, 600));
  await new Promise(r => setTimeout(r, 400));
  await hold(page, 'Report vendor details', 4);

  // ===== SCENE 25: END (106s - 109s) =====
  console.log('\n--- Scene 25: End ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await hold(page, 'Final frame', 3);

  await browser.close();

  // Print scene timing log
  console.log('\n=== SCENE TIMING LOG (for voiceover sync) ===');
  sceneLog.forEach(s => {
    console.log(`  ${s.startSec.toFixed(1)}s - ${s.endSec.toFixed(1)}s : ${s.label}`);
  });

  // Compile video
  console.log('\n--- Compiling video ---');
  const cmd = `ffmpeg -y -framerate ${FPS} -i "${SCREENSHOT_DIR}/frame_%05d.png" -vf "scale=1440:900" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 "${OUTPUT_VIDEO}"`;
  execSync(cmd, { stdio: 'inherit' });

  const totalSec = frameNum / FPS;
  console.log(`\nVideo saved: ${OUTPUT_VIDEO}`);
  console.log(`Total: ${frameNum} frames, ${totalSec.toFixed(1)}s @ ${FPS}fps`);

  // Write timing file for voiceover generation
  const timingFile = path.join(__dirname, 'scene_timings.json');
  fs.writeFileSync(timingFile, JSON.stringify(sceneLog, null, 2));
  console.log(`Scene timings: ${timingFile}`);

  fs.rmSync(SCREENSHOT_DIR, { recursive: true });
})();
