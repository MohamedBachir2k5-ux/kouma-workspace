/**
 * Lighthouse on /app/documents — authenticated screen test
 */
import puppeteer from 'puppeteer'
import { default as lighthouse } from 'lighthouse'
import { execSync } from 'child_process'
import { setTimeout as sleep } from 'timers/promises'

const BASE = 'http://localhost:4173'
const EMAIL = 'demo@kouma.local'
const PIN = '123456'

try {
  execSync('lsof -i :4173 -t', { stdio: 'pipe' })
} catch {
  console.error('Preview server not running. Run `npx vite preview --port 4173` first.')
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
await sleep(4000)

await page.goto(`${BASE}/app/documents`, { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(2000)

console.log(`On: ${page.url()}`)
await page.screenshot({ path: '/tmp/kouma-documents.png' })

console.log('Running Lighthouse on /app/documents...')
const lhResult = await lighthouse(`${BASE}/app/documents`, {
  port: 9222,
  output: 'json',
  logLevel: 'error',
  throttlingMethod: 'simulate',
  throttling: { rttMs: 150, throughputKbps: 750, uploadThroughputKbps: 750, cpuSlowdownMultiplier: 6 },
  formFactor: 'mobile',
  screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false },
  onlyCategories: ['performance'],
  disableStorageReset: true,
}, undefined, page)

const a = lhResult.lhr.audits
const score = Math.round(lhResult.lhr.categories.performance.score * 100)
console.log('\n╔══════════════════════════════════════════════════════╗')
console.log('║  Lighthouse — /app/documents  (6x CPU + 3G mobile)  ║')
console.log('╠══════════════════════════════════════════════════════╣')
console.log(`║  Performance score : ${String(score).padEnd(31)}║`)
console.log(`║  FCP               : ${String(a['first-contentful-paint'].displayValue).padEnd(31)}║`)
console.log(`║  LCP               : ${String(a['largest-contentful-paint'].displayValue).padEnd(31)}║`)
console.log(`║  TBT               : ${String(a['total-blocking-time'].displayValue).padEnd(31)}║`)
console.log(`║  CLS               : ${String(a['cumulative-layout-shift'].displayValue).padEnd(31)}║`)
console.log(`║  Speed Index       : ${String(a['speed-index']?.displayValue ?? 'n/a').padEnd(31)}║`)
console.log('╚══════════════════════════════════════════════════════╝')

await browser.close()
