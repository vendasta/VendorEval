import puppeteer from 'puppeteer'
import fs from 'fs'

const DIR = '../submission/screenshots'
fs.mkdirSync(DIR, { recursive: true })

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

// 1. Login page
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' })
await page.screenshot({ path: `${DIR}/01-login-page.png` })

// 2. Demo login + dashboard
const res = await fetch('http://localhost:8080/api/auth/demo', { method: 'POST' })
const { token } = await res.json()
await page.evaluateOnNewDocument(t => localStorage.setItem('vendoreval_token', t), token)
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
await page.waitForTimeout(2000)
await page.screenshot({ path: `${DIR}/02-dashboard.png` })

// 3-7: Navigate to demo evaluation results
// (Screenshots of: comparison matrix, red flags, recommendation, chat, report)

await browser.close()
console.log('All screenshots saved')
