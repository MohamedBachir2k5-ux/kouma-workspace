/**
 * Lighthouse — warm session (PIN already unlocked)
 * Uses Lighthouse snapshot mode: no fresh navigation, measures the already-rendered page.
 * This simulates returning to the tab after navigating away (in-app navigation perf).
 */
import puppeteer from 'puppeteer'
import { default as lighthouse } from 'lighthouse'
import { execSync } from 'child_process'
import { setTimeout as sleep } from 'timers/promises'

const BASE = 'http://localhost:4173'
const EMAIL = 'demo@kouma.local'
const PIN = '123456'

try { execSync('lsof -i :4173 -t', { stdio: 'pipe' }) } catch {
  console.error('Start preview server first: npx vite preview --port 4173')
  process.exit(1)
}

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=9222'],
})

const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844 })

// 1. Login
await page.goto(`${BASE}/connexion/utilisateur`, { waitUntil: 'networkidle0', timeout: 30000 })
await sleep(800)

const emailInput = await page.$('input[type="email"], input[type="text"]')
await emailInput.click({ clickCount: 3 })
await emailInput.type(EMAIL, { delay: 40 })
await page.keyboard.press('Enter')
await sleep(1000)

await page.waitForSelector('input[inputMode="numeric"], input[maxlength="6"]', { timeout: 10000 })
const pinInput = await page.$('input[inputMode="numeric"]') || await page.$('input[maxlength="6"]')
await pinInput.click({ clickCount: 3 })
await pinInput.type(PIN, { delay: 60 })
await page.keyboard.press('Enter')

try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }) } catch {}
await sleep(3000)

// 2. Handle PinUnlockModal if present
const unlockInput = await page.$('input[inputMode="numeric"]')
if (unlockInput) {
  console.log('Entering PIN in unlock modal...')
  await unlockInput.click({ clickCount: 3 })
  await unlockInput.type(PIN, { delay: 60 })
  const btn = await page.$('button[type="submit"]')
  if (btn) await btn.click()
  await sleep(3000)
}

// 3. Wait for conversations to fully render
await page.goto(`${BASE}/app/messages`, { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(5000) // wait for 1000 convs to render

// Verify conversations loaded
const convCount = await page.evaluate(() =>
  document.querySelectorAll('button').length
)
console.log(`Buttons on page (conversations): ${convCount}`)

await page.screenshot({ path: '/tmp/kouma-warm.png' })

// 4. Lighthouse timespan — measures INP/responsiveness on the rendered page
// (does not re-navigate, captures interaction responsiveness)
console.log('\nRunning Lighthouse snapshot (warm page with 1000 convs)...')

const { lhr } = await lighthouse.snapshot(page, {
  port: 9222,
  output: 'json',
  logLevel: 'error',
  throttlingMethod: 'simulate',
  throttling: {
    rttMs: 150, throughputKbps: 750, uploadThroughputKbps: 750, cpuSlowdownMultiplier: 6,
  },
  formFactor: 'mobile',
  screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false },
  onlyCategories: ['performance'],
})

const a = lhr.audits
const score = Math.round(lhr.categories.performance.score * 100)
console.log('\n╔══════════════════════════════════════════════════════╗')
console.log('║  Lighthouse snapshot — warm /app/messages (6x CPU)  ║')
console.log('╠══════════════════════════════════════════════════════╣')
console.log(`║  Performance score : ${String(score).padEnd(31)}║`)
console.log(`║  TBT               : ${String(a['total-blocking-time']?.displayValue ?? 'n/a').padEnd(31)}║`)
console.log(`║  CLS               : ${String(a['cumulative-layout-shift']?.displayValue ?? 'n/a').padEnd(31)}║`)
console.log('╚══════════════════════════════════════════════════════╝')

await browser.close()
