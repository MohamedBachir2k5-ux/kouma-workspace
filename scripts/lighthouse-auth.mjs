/**
 * Lighthouse on authenticated Kouma screens
 * 1. Starts production preview server
 * 2. Logs in as demo@kouma.local via Puppeteer
 * 3. Runs Lighthouse on /app/messages with 6x CPU + 3G
 */
import puppeteer from 'puppeteer'
import { default as lighthouse } from 'lighthouse'
import { execSync, spawn } from 'child_process'
import { setTimeout as sleep } from 'timers/promises'

const BASE = 'http://localhost:4173'
const EMAIL = 'demo@kouma.local'
const PIN = '123456'

// ── 1. Start preview server ──────────────────────────────────────────────────
let server
try {
  execSync('lsof -i :4173 -t', { stdio: 'pipe' })
  console.log('✓ Preview server already running on :4173')
} catch {
  console.log('Starting vite preview...')
  server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  })
  await sleep(2500)
  console.log('✓ Preview server started')
}

// ── 2. Browser login ─────────────────────────────────────────────────────────
console.log('\nLaunching browser...')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--remote-debugging-port=9222',
  ],
})

const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844 })

console.log('Navigating to login...')
await page.goto(`${BASE}/connexion/utilisateur`, { waitUntil: 'networkidle0', timeout: 30000 })
await sleep(800)

// Step 1: email input
const emailSel = 'input[type="email"], input[inputMode="email"], input[name="email"], input[type="text"]'
await page.waitForSelector(emailSel, { timeout: 10000 })
const emailInput = await page.$(emailSel)
await emailInput.click({ clickCount: 3 })
await emailInput.type(EMAIL, { delay: 40 })
console.log('Email entered, pressing Enter...')
await page.keyboard.press('Enter')
await sleep(1000)

// Step 2: PIN (6-digit, also used as password)
const pinSel = 'input[inputMode="numeric"], input[maxlength="6"], input[type="password"]'
await page.waitForSelector(pinSel, { timeout: 10000 })
const pinInput = await page.$(pinSel)
await pinInput.click({ clickCount: 3 })
await pinInput.type(PIN, { delay: 60 })
console.log('PIN entered, submitting...')
await page.keyboard.press('Enter')

// Wait for /app redirect
console.log('Waiting for app redirect...')
try {
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
} catch {
  // might already be there
}
await sleep(4000) // crypto session + React mount

const afterLogin = page.url()
console.log(`Current URL after login: ${afterLogin}`)

// Handle PinUnlockModal if it appears (crypto session not loaded)
try {
  const unlockPin = await page.$('input[inputMode="numeric"]')
  if (unlockPin) {
    console.log('PinUnlockModal detected, entering PIN...')
    await unlockPin.click({ clickCount: 3 })
    await unlockPin.type(PIN, { delay: 60 })
    // click submit button
    const btn = await page.$('button[type="submit"]')
    if (btn) await btn.click()
    await sleep(3000)
  }
} catch {}

// Navigate to messages if needed
if (!page.url().includes('/app/messages')) {
  await page.goto(`${BASE}/app/messages`, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(3000)
}

console.log(`✓ On: ${page.url()}`)
await page.screenshot({ path: '/tmp/kouma-messages.png' })
console.log('✓ Screenshot: /tmp/kouma-messages.png')

// ── 3. Lighthouse with 6x CPU + 3G ──────────────────────────────────────────
console.log('\nRunning Lighthouse (6x CPU + 3G)...')

const flags = {
  port: 9222,
  output: 'json',
  logLevel: 'error',
  throttlingMethod: 'simulate',
  throttling: {
    rttMs: 150,
    throughputKbps: 750,
    uploadThroughputKbps: 750,
    cpuSlowdownMultiplier: 6,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
  },
  formFactor: 'mobile',
  screenEmulation: {
    mobile: true,
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    disabled: false,
  },
  onlyCategories: ['performance'],
  skipAudits: ['uses-http2'],
  // Preserve auth: disable clearing storage on start
  disableStorageReset: true,
}

const lhResult = await lighthouse(`${BASE}/app/messages`, flags, undefined, page)

const cats   = lhResult.lhr.categories
const audits = lhResult.lhr.audits

const score = Math.round(cats.performance.score * 100)
const fcp   = audits['first-contentful-paint'].displayValue
const lcp   = audits['largest-contentful-paint'].displayValue
const tbt   = audits['total-blocking-time'].displayValue
const cls   = audits['cumulative-layout-shift'].displayValue
const si    = audits['speed-index']?.displayValue ?? 'n/a'
const tti   = audits['interactive']?.displayValue ?? 'n/a'

console.log('\n╔══════════════════════════════════════════════════════╗')
console.log('║  Lighthouse — /app/messages  (6x CPU + 3G mobile)   ║')
console.log('╠══════════════════════════════════════════════════════╣')
console.log(`║  Performance score : ${String(score).padEnd(31)}║`)
console.log(`║  FCP               : ${String(fcp).padEnd(31)}║`)
console.log(`║  LCP               : ${String(lcp).padEnd(31)}║`)
console.log(`║  TBT               : ${String(tbt).padEnd(31)}║`)
console.log(`║  CLS               : ${String(cls).padEnd(31)}║`)
console.log(`║  Speed Index       : ${String(si).padEnd(31)}║`)
console.log(`║  TTI               : ${String(tti).padEnd(31)}║`)
console.log('╚══════════════════════════════════════════════════════╝')

const opps = Object.values(audits)
  .filter(a => a.details?.type === 'opportunity' && (a.details.overallSavingsMs ?? 0) > 100)
  .sort((a, b) => (b.details.overallSavingsMs ?? 0) - (a.details.overallSavingsMs ?? 0))
  .slice(0, 5)

if (opps.length) {
  console.log('\nTop opportunities:')
  for (const o of opps) {
    console.log(`  - ${o.title}: ~${Math.round(o.details.overallSavingsMs ?? 0)}ms savings`)
  }
}

await browser.close()
if (server) server.kill()
console.log('\nDone.')
