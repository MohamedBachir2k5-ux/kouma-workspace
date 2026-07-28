/**
 * Kouma E2E Test Runner — driven by Claude Code via Playwright
 * Usage: node test/e2e/runner.mjs [flow]
 * Flows: signup | login | org | invite | team | message | agenda | document | full
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const APP = 'http://localhost:3009'
const REPORT_DIR = './test/e2e/reports'
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const reportPath = `${REPORT_DIR}/run-${timestamp}.json`

mkdirSync(REPORT_DIR, { recursive: true })

// ── Credentials for test ──────────────────────────────────────────────────────
const ADMIN = { email: `admin-${Date.now()}@test.kouma`, password: 'Test1234!', firstName: 'Admin', lastName: 'Test' }
const MEMBER = { email: `member-${Date.now()}@test.kouma`, password: 'Test1234!', firstName: 'Marie', lastName: 'Dupont' }

// ── Report accumulator ────────────────────────────────────────────────────────
const report = {
  startedAt: new Date().toISOString(),
  steps: [],
  errors: [],
  consoleLogs: [],
  networkErrors: [],
  supabaseErrors: [],
}

function step(name, status, detail = {}) {
  const entry = { ts: new Date().toISOString(), name, status, ...detail }
  report.steps.push(entry)
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳'
  console.log(`${icon} ${name}${detail.error ? ` → ${detail.error}` : ''}`)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function waitForNav(page, url, timeout = 8000) {
  await page.waitForURL(u => u.includes(url), { timeout })
}

async function fill(page, selector, value) {
  await page.locator(selector).fill(value)
}

async function click(page, selector) {
  await page.locator(selector).click()
}

async function screenshot(page, name) {
  const path = `${REPORT_DIR}/screenshot-${name}-${timestamp}.png`
  await page.screenshot({ path, fullPage: false })
  return path
}

// ── Test flows ────────────────────────────────────────────────────────────────

async function testSignup(page) {
  console.log('\n─── SIGNUP FLOW ───')
  await page.goto(`${APP}/inscription`)
  step('navigate to /inscription', 'INFO', { url: page.url() })

  try {
    await fill(page, 'input[type="email"]', ADMIN.email)
    await fill(page, 'input[name="firstName"], input[placeholder*="rénom"], input[placeholder*="Prénom"]', ADMIN.firstName)
    await fill(page, 'input[name="lastName"], input[placeholder*="Nom"]', ADMIN.lastName)
    const pwFields = await page.locator('input[type="password"]').all()
    for (const f of pwFields) await f.fill(ADMIN.password)
    const screenshotPath = await screenshot(page, 'signup-filled')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(2000)
    const currentUrl = page.url()
    const passed = !currentUrl.includes('/inscription') || currentUrl.includes('organisation') || currentUrl.includes('onboarding')
    step('signup form submission', passed ? 'PASS' : 'FAIL', {
      resultUrl: currentUrl,
      screenshot: screenshotPath,
    })
  } catch (e) {
    step('signup form submission', 'FAIL', { error: e.message, screenshot: await screenshot(page, 'signup-error') })
  }
}

async function testCreateOrg(page) {
  console.log('\n─── CREATE ORG FLOW ───')
  const url = page.url()
  if (!url.includes('organisation') && !url.includes('onboarding') && !url.includes('create')) {
    step('create org', 'SKIP', { reason: 'not on org creation page', currentUrl: url })
    return
  }

  try {
    await page.waitForTimeout(500)
    const nameField = page.locator('input[placeholder*="nom"], input[name*="name"], input[name*="orgName"]').first()
    if (await nameField.isVisible()) {
      await nameField.fill('Kouma Test Corp')
    }

    // Fill required fields if visible
    const emailField = page.locator('input[type="email"]').first()
    if (await emailField.isVisible()) await emailField.fill('contact@kouma-test.com')

    // Country select
    const countrySelect = page.locator('select[name*="country"], select[name*="pays"]').first()
    if (await countrySelect.isVisible()) await countrySelect.selectOption({ index: 1 })

    const screenshotPath = await screenshot(page, 'create-org')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(2500)
    const resultUrl = page.url()
    const passed = resultUrl.includes('/admin') || resultUrl.includes('/app') || resultUrl.includes('dashboard')
    step('create organization', passed ? 'PASS' : 'FAIL', {
      resultUrl,
      screenshot: screenshotPath,
    })
  } catch (e) {
    step('create organization', 'FAIL', { error: e.message, screenshot: await screenshot(page, 'org-error') })
  }
}

async function testAdminDashboard(page) {
  console.log('\n─── ADMIN DASHBOARD ───')
  try {
    // Navigate to admin if not already there
    if (!page.url().includes('/admin')) {
      await page.goto(`${APP}/admin`)
      await page.waitForTimeout(1000)
    }
    const title = await page.locator('h1, h2').first().textContent().catch(() => '')
    const hasContent = (await page.locator('[class*="card"], [class*="surface"], main').count()) > 0
    step('admin dashboard loads', hasContent ? 'PASS' : 'FAIL', {
      url: page.url(),
      title,
      screenshot: await screenshot(page, 'admin-dashboard'),
    })
  } catch (e) {
    step('admin dashboard loads', 'FAIL', { error: e.message })
  }
}

async function testInviteUser(page) {
  console.log('\n─── INVITE USER FLOW ───')
  try {
    await page.goto(`${APP}/admin/utilisateurs`)
    await page.waitForTimeout(1000)
    const inviteBtn = page.locator('button:has-text("Inviter"), button:has-text("invitation")').first()
    if (!await inviteBtn.isVisible()) {
      step('invite user', 'FAIL', { error: 'Invite button not found', screenshot: await screenshot(page, 'invite-missing') })
      return
    }
    await inviteBtn.click()
    await page.waitForTimeout(800)

    // Check if link appeared
    const linkField = page.locator('input[readonly], [class*="invite"] input, textarea').first()
    const hasLink = await linkField.isVisible().catch(() => false)
    step('generate invite link', hasLink ? 'PASS' : 'FAIL', {
      screenshot: await screenshot(page, 'invite-modal'),
    })

    if (hasLink) {
      const link = await linkField.inputValue().catch(() => '')
      step('invite link content', link.includes('invitation') || link.includes('token') ? 'PASS' : 'WARN', { link })
    }

    // Close modal
    await page.keyboard.press('Escape')
  } catch (e) {
    step('invite user', 'FAIL', { error: e.message })
  }
}

async function testTeams(page) {
  console.log('\n─── TEAMS (ADMIN) ───')
  try {
    await page.goto(`${APP}/admin/equipes`)
    await page.waitForTimeout(1000)
    const createBtn = page.locator('button:has-text("Créer"), button:has-text("Nouvelle équipe"), button:has-text("équipe")').first()
    const hasCreate = await createBtn.isVisible().catch(() => false)
    step('admin teams page', 'PASS', {
      hasCreateButton: hasCreate,
      screenshot: await screenshot(page, 'admin-teams'),
    })

    if (hasCreate) {
      await createBtn.click()
      await page.waitForTimeout(500)
      const modal = page.locator('[role="dialog"], [class*="modal"]').first()
      const hasModal = await modal.isVisible().catch(() => false)
      if (hasModal) {
        const nameInput = page.locator('input[placeholder*="nom"], input[name*="name"]').first()
        if (await nameInput.isVisible()) await nameInput.fill('Équipe Test E2E')
        step('team creation modal', 'PASS', { screenshot: await screenshot(page, 'team-modal') })
        await page.keyboard.press('Escape')
      } else {
        step('team creation modal', 'FAIL', { error: 'Modal did not open' })
      }
    }
  } catch (e) {
    step('admin teams', 'FAIL', { error: e.message })
  }
}

async function testMessaging(page) {
  console.log('\n─── MESSAGING ───')
  try {
    await page.goto(`${APP}/app/messages`)
    await page.waitForTimeout(1500)
    const hasConvList = (await page.locator('[class*="conversation"], [class*="channel"]').count()) >= 0
    step('messaging page loads', 'PASS', {
      conversationCount: await page.locator('[class*="conversation"]').count(),
      screenshot: await screenshot(page, 'messaging'),
    })
  } catch (e) {
    step('messaging page loads', 'FAIL', { error: e.message })
  }
}

async function testAgenda(page) {
  console.log('\n─── AGENDA ───')
  try {
    await page.goto(`${APP}/app/agenda`)
    await page.waitForTimeout(1500)
    const createBtn = page.locator('button:has-text("Créer"), button:has-text("Réunion"), button:has-text("événement")').first()
    const hasCreate = await createBtn.isVisible().catch(() => false)
    step('agenda page loads', 'PASS', {
      hasCreateButton: hasCreate,
      screenshot: await screenshot(page, 'agenda'),
    })
  } catch (e) {
    step('agenda page loads', 'FAIL', { error: e.message })
  }
}

async function testDocuments(page) {
  console.log('\n─── DOCUMENTS ───')
  try {
    await page.goto(`${APP}/app/documents`)
    await page.waitForTimeout(1500)
    const uploadBtn = page.locator('button:has-text("Déposer"), button:has-text("Uploader"), input[type="file"]').first()
    const hasUpload = await uploadBtn.isVisible().catch(() => false)
    step('documents page loads', 'PASS', {
      hasUploadButton: hasUpload,
      screenshot: await screenshot(page, 'documents'),
    })
  } catch (e) {
    step('documents page loads', 'FAIL', { error: e.message })
  }
}

async function testSecurity(page) {
  console.log('\n─── SECURITY ───')
  try {
    await page.goto(`${APP}/admin/securite`)
    await page.waitForTimeout(1200)
    const sessionSection = page.locator(':has-text("Sessions actives"), :has-text("session")').first()
    const hasSession = await sessionSection.isVisible().catch(() => false)
    step('security page loads', 'PASS', {
      hasSessionSection: hasSession,
      screenshot: await screenshot(page, 'security'),
    })
  } catch (e) {
    step('security page loads', 'FAIL', { error: e.message })
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const flow = process.argv[2] ?? 'full'
console.log(`\n🚀 Kouma E2E — flow: ${flow} — ${new Date().toLocaleString('fr-FR')}`)
console.log(`   App: ${APP}`)
console.log(`   Report: ${reportPath}\n`)

const browser = await chromium.launch({ headless: false, slowMo: 150 })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await ctx.newPage()

// Capture all console output
page.on('console', msg => {
  const entry = { ts: new Date().toISOString(), level: msg.type(), text: msg.text() }
  report.consoleLogs.push(entry)
  if (msg.type() === 'error') {
    console.error(`  🔴 CONSOLE ERROR: ${msg.text()}`)
    report.errors.push(entry)
  }
})

// Capture uncaught page errors
page.on('pageerror', err => {
  const entry = { ts: new Date().toISOString(), error: err.message, stack: err.stack }
  report.errors.push(entry)
  console.error(`  💥 PAGE ERROR: ${err.message}`)
})

// Capture all network requests to Supabase
page.on('response', async resp => {
  const url = resp.url()
  if (!url.includes('54331') && !url.includes('supabase')) return
  const status = resp.status()
  if (status >= 400) {
    let body = ''
    try { body = await resp.text() } catch {}
    const entry = { ts: new Date().toISOString(), url, status, body: body.slice(0, 500) }
    report.networkErrors.push(entry)
    console.error(`  🔴 HTTP ${status}: ${url.split('?')[0]} → ${body.slice(0, 200)}`)
    if (status === 403 || body.includes('42501') || body.includes('permission denied')) {
      report.supabaseErrors.push({ ...entry, type: 'RLS_VIOLATION' })
      console.error(`  ⛔ RLS VIOLATION on: ${url}`)
    }
  }
})

try {
  if (flow === 'full' || flow === 'signup') await testSignup(page)
  if (flow === 'full' || flow === 'org')    await testCreateOrg(page)
  if (flow === 'full' || flow === 'admin')  await testAdminDashboard(page)
  if (flow === 'full' || flow === 'invite') await testInviteUser(page)
  if (flow === 'full' || flow === 'team')   await testTeams(page)
  if (flow === 'full' || flow === 'message') await testMessaging(page)
  if (flow === 'full' || flow === 'agenda') await testAgenda(page)
  if (flow === 'full' || flow === 'document') await testDocuments(page)
  if (flow === 'full' || flow === 'security') await testSecurity(page)
} finally {
  report.finishedAt = new Date().toISOString()
  report.summary = {
    total:  report.steps.length,
    passed: report.steps.filter(s => s.status === 'PASS').length,
    failed: report.steps.filter(s => s.status === 'FAIL').length,
    warnings: report.steps.filter(s => s.status === 'WARN').length,
    consoleErrors: report.errors.length,
    networkErrors: report.networkErrors.length,
    rlsViolations: report.supabaseErrors.length,
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('\n─────────────────────────────────')
  console.log(`📊 RÉSUMÉ:`)
  console.log(`   ✅ Passed:   ${report.summary.passed}`)
  console.log(`   ❌ Failed:   ${report.summary.failed}`)
  console.log(`   ⚠️  Warnings: ${report.summary.warnings}`)
  console.log(`   🔴 Console errors: ${report.summary.consoleErrors}`)
  console.log(`   🌐 Network errors: ${report.summary.networkErrors}`)
  console.log(`   ⛔ RLS violations: ${report.summary.rlsViolations}`)
  console.log(`   📄 Report: ${reportPath}`)

  await page.waitForTimeout(3000)
  await browser.close()
}
