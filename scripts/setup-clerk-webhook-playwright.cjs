const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const WEBHOOK_URL = 'https://whale-app-xpe4g.ondigitalocean.app/auth/clerk/webhook';
const ALT_URL = 'https://api.lefrig.com/auth/clerk/webhook';
const secret = process.env.CLERK_SECRET_KEY;

function clerk(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = https.request(
      {
        hostname: 'api.clerk.com',
        path: `/v1${path}`,
        method,
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => resolve({ status: res.statusCode, body: b }));
      },
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function getPortalUrl() {
  const r = await clerk('POST', '/webhooks/svix_url', {});
  if (r.status !== 200) throw new Error(`svix_url ${r.status} ${r.body}`);
  return JSON.parse(r.body).svix_url;
}

async function syncSecretToDo(signingSecret) {
  fs.writeFileSync('.tmp-CLERK_WEBHOOK_SECRET.txt', signingSecret, 'utf8');
  for (const appId of [
    '280fb860-39ef-44df-b721-7ca8be74f532',
    '4d6fbbd0-7390-42cb-838e-46bfc2828669',
  ]) {
    let y = execSync(`doctl apps spec get ${appId} -o yaml`, { encoding: 'utf8' }).replace(
      /^\uFEFF/,
      '',
    );
    const re =
      /(^[ \t]*- key: CLERK_WEBHOOK_SECRET\r?\n[ \t]*scope: RUN_TIME\r?\n[ \t]*type: SECRET\r?\n[ \t]*value: ).+$/m;
    if (!re.test(y)) {
      console.error('missing CLERK_WEBHOOK_SECRET in', appId);
      continue;
    }
    y = y.replace(re, `$1${signingSecret}`);
    const file = `.tmp-do-webhook-${appId}.yaml`;
    fs.writeFileSync(file, y, 'utf8');
    execSync(`doctl apps update ${appId} --spec ${file}`, { stdio: 'inherit' });
    console.log('DO updated', appId);
  }
}

async function extractSecret(page) {
  const text = await page.locator('body').innerText();
  const m = text.match(/whsec_[A-Za-z0-9+/=_-]+/);
  return m ? m[0] : null;
}

async function main() {
  const portalUrl = await getPortalUrl();
  console.log('opening portal…');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  await page.goto(portalUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  console.log('title', await page.title());
  console.log('url', page.url());
  await page.screenshot({ path: '.tmp-svix-1.png', fullPage: true });

  // Prefer editing existing endpoint if present
  const existing = page.getByText(/api\.lefrig\.com\/auth\/clerk\/webhook|whale-app.*\/auth\/clerk\/webhook/).first();
  if (await existing.count()) {
    console.log('opening existing endpoint');
    await existing.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: '.tmp-svix-existing.png', fullPage: true });

    // Enable if disabled
    const enableBtn = page.getByRole('button', { name: /Enable|Activate|Enable Endpoint/i }).first();
    if (await enableBtn.count()) {
      console.log('enabling endpoint');
      await enableBtn.click();
      await page.waitForTimeout(1500);
    }

    // Edit URL to whale if still api.lefrig.com
    const editBtn = page.getByRole('button', { name: /Edit|Settings|Configure/i }).first();
    if (await editBtn.count()) {
      await editBtn.click();
      await page.waitForTimeout(1000);
    }

    const urlInput = page.locator('input[type="url"], input[name="url"]').first();
    if (await urlInput.count()) {
      const current = await urlInput.inputValue();
      console.log('current url field', current);
      if (current !== WEBHOOK_URL) {
        await urlInput.fill(WEBHOOK_URL);
        const save = page.getByRole('button', { name: /Save|Update|Create/i }).first();
        if (await save.count()) await save.click();
        await page.waitForTimeout(2000);
        console.log('updated url to whale');
      }
    }
  } else {
    console.log('creating new endpoint');
    const add = page.getByRole('link', { name: /Add Endpoint/i }).or(page.getByRole('button', { name: /Add Endpoint/i })).first();
    await add.click();
    await page.waitForTimeout(1500);
    const urlInput = page.locator('input[type="url"], input[name="url"]').first();
    await urlInput.fill(WEBHOOK_URL);

    // Subscribe to user events if UI shows them
    for (const ev of ['user.created', 'user.updated', 'user.deleted']) {
      const row = page.getByText(ev, { exact: true }).first();
      if (await row.count()) {
        await row.click({ force: true }).catch(() => undefined);
      }
    }

    const create = page.getByRole('button', { name: /Create|Save|Add/i }).first();
    await create.click();
    await page.waitForTimeout(2500);
  }

  await page.screenshot({ path: '.tmp-svix-2.png', fullPage: true });

  // Navigate to Signing Secret section
  let signingSecret = await extractSecret(page);

  if (!signingSecret) {
    for (const name of [/Signing Secret/i, /Reveal/i, /Show Secret/i, /Secret/i]) {
      const el = page.getByRole('button', { name }).or(page.getByText(name)).first();
      if (await el.count()) {
        await el.click().catch(() => undefined);
        await page.waitForTimeout(800);
        signingSecret = await extractSecret(page);
        if (signingSecret) break;
      }
    }
  }

  // Sometimes secret is under a tab
  if (!signingSecret) {
    const tabs = ['Signing Secret', 'Advanced', 'Overview'];
    for (const t of tabs) {
      const tab = page.getByRole('tab', { name: t }).or(page.getByText(t, { exact: true })).first();
      if (await tab.count()) {
        await tab.click().catch(() => undefined);
        await page.waitForTimeout(1000);
        const reveal = page.getByRole('button', { name: /Reveal|Show|Copy/i }).first();
        if (await reveal.count()) await reveal.click().catch(() => undefined);
        await page.waitForTimeout(500);
        signingSecret = await extractSecret(page);
        if (signingSecret) break;
      }
    }
  }

  // Try clipboard copy buttons near secret
  if (!signingSecret) {
    const body = await page.locator('body').innerText();
    console.log('detail snippet', body.slice(0, 1200).replace(/\s+/g, ' '));
  }

  await page.screenshot({ path: '.tmp-svix-3.png', fullPage: true });
  await browser.close();

  if (!signingSecret) {
    console.error('Could not extract signing secret from Svix UI');
    process.exit(2);
  }

  console.log('got signing secret length', signingSecret.length);
  await syncSecretToDo(signingSecret);
  console.log('WEBHOOK_DONE', WEBHOOK_URL, 'alt', ALT_URL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
