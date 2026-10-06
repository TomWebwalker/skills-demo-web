#!/usr/bin/env node
// App-verify harness for the sprint board. Run by the verify-web skill:
//   node e2e/verify-web.mjs --base http://localhost:4200 --out <dir>
//   node e2e/verify-web.mjs --self-test      # every check must FAIL on its bad fixture
// Every /api call is stubbed with page.route, so no backend is needed.
// One function per check, returning { pass, detail }. Add a check here for every new flow.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const selfTest = args.includes('--self-test');
const base = flag('--base') ?? 'http://localhost:4200';
const out = flag('--out') ?? join(tmpdir(), `verify-web-${Date.now()}`);
mkdirSync(out, { recursive: true });

const VIEWPORT = { width: 1280, height: 800 };
const TIMEOUT = 10_000;

// ---------- fixtures ----------

const users = [
  { id: 'u1', name: 'Ada' },
  { id: 'u2', name: 'Linus' },
];
const task = (id, title, status = 'todo', assigneeId = 'u1') => ({ id, title, status, assigneeId });
const seedTasks = [
  task('t1', 'Fix login', 'todo', 'u1'),
  task('t2', 'Add dark mode', 'in-progress', 'u2'),
  task('t3', 'Write docs', 'done', null),
];

/** Stubs every /api route. `api` overrides: { tasks, users, activity, tasksStatus }. */
async function stubApi(page, api = {}) {
  let tasks = structuredClone(api.tasks ?? seedTasks);
  const json = (route, body, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path === '/api/tasks' && req.method() === 'GET') {
      return api.tasksStatus ? json(route, { error: 'boom' }, api.tasksStatus) : json(route, tasks);
    }
    if (path === '/api/users') return json(route, api.users ?? users);
    if (path.startsWith('/api/activity')) return json(route, api.activity ?? []);
    const patch = path.match(/^\/api\/tasks\/([^/]+)$/);
    if (patch && req.method() === 'PATCH') {
      const body = req.postDataJSON();
      tasks = tasks.map((t) => (t.id === patch[1] ? { ...t, status: body.status } : t));
      return json(route, tasks.find((t) => t.id === patch[1]));
    }
    return json(route, { error: `unstubbed ${req.method()} ${path}` }, 404);
  });
}

/** Opens the app with stubbed API (or, in self-test, a bad fixture page). */
async function open(ctx, api) {
  const page = await ctx.browser.newPage({ viewport: VIEWPORT });
  await stubApi(page, api);
  if (ctx.fixture) {
    await page.route(`${ctx.base}/**`, (route) =>
      route.request().resourceType() === 'document'
        ? route.fulfill({ contentType: 'text/html', body: ctx.fixture })
        : route.abort(),
    );
  }
  await page.goto(ctx.base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.column', { timeout: TIMEOUT }).catch(() => {});
  return page;
}

/** Waits until fn(page) is truthy, or the timeout passes. Returns the last value. */
async function settle(page, fn, timeout = TIMEOUT) {
  const until = Date.now() + timeout;
  let value;
  while (Date.now() < until) {
    value = await fn(page);
    if (value) return value;
    await page.waitForTimeout(100);
  }
  return value;
}

const cardsIn = (page, status) => page.locator(`.column[data-status="${status}"] [data-testid="task-card"]`);
const allCards = (page) => page.locator('[data-testid="task-card"]');
const overflowsX = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

async function shot(page, ctx, name) {
  const file = join(ctx.out, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
}

// ---------- checks ----------

const checks = {
  async 'board-columns'(ctx) {
    const page = await open(ctx);
    await settle(page, async () => (await allCards(page).count()) === seedTasks.length);
    const labels = await page.locator('.column-header h2').allTextContents();
    const counts = {};
    for (const s of ['todo', 'in-progress', 'done']) counts[s] = await cardsIn(page, s).count();
    const evidence = await shot(page, ctx, 'board-columns');
    const pass =
      JSON.stringify(labels.map((l) => l.trim())) === JSON.stringify(['To do', 'In progress', 'Done']) &&
      counts.todo === 1 && counts['in-progress'] === 1 && counts.done === 1;
    return { pass, detail: `columns ${JSON.stringify(labels)}, cards ${JSON.stringify(counts)}`, evidence };
  },

  async 'move-task'(ctx) {
    const page = await open(ctx);
    await settle(page, async () => (await cardsIn(page, 'todo').count()) === 1);
    const doneBefore = await cardsIn(page, 'done').count();
    await page
      .locator('.column[data-status="todo"] [data-testid="task-card"] button', { hasText: 'Done' })
      .first()
      .click({ timeout: TIMEOUT })
      .catch(() => {});
    const moved = await settle(page, async () =>
      (await cardsIn(page, 'done').filter({ hasText: 'Fix login' }).count()) === 1 &&
      (await cardsIn(page, 'todo').count()) === 0,
    );
    const doneAfter = await cardsIn(page, 'done').count();
    const evidence = await shot(page, ctx, 'move-task');
    return {
      pass: Boolean(moved) && doneAfter === doneBefore + 1,
      detail: `done column ${doneBefore} -> ${doneAfter}; "Fix login" in done: ${Boolean(moved)}`,
      evidence,
    };
  },

  async 'activity-panel'(ctx) {
    const page = await open(ctx);
    const panel = page.locator('aside[aria-label="Activity"]');
    const visible = await panel.isVisible().catch(() => false);
    const heading = visible ? (await panel.locator('h2').first().textContent())?.trim() : null;
    const body = visible ? (await panel.innerText()).replace(heading ?? '', '').trim() : '';
    const evidence = await shot(page, ctx, 'activity-panel');
    return {
      pass: visible && heading === 'Activity' && body.length > 0,
      detail: `visible=${visible}, heading=${JSON.stringify(heading)}, body=${JSON.stringify(body.slice(0, 80))}`,
      evidence,
    };
  },

  // ----- hostile pass -----

  async 'hostile-empty'(ctx) {
    const page = await open(ctx, { tasks: [] });
    const empties = await settle(page, async () => {
      const t = await page.locator('.column .empty').allTextContents();
      return t.length === 3 && t.every((x) => x.trim() === 'No tasks') ? t : null;
    });
    const evidence = await shot(page, ctx, 'hostile-empty');
    const texts = empties ?? (await page.locator('.column .empty').allTextContents());
    return { pass: Boolean(empties), detail: `empty states ${JSON.stringify(texts)}`, evidence };
  },

  async 'hostile-one'(ctx) {
    const page = await open(ctx, { tasks: [task('t1', 'Only task')] });
    await settle(page, async () => (await allCards(page).count()) >= 1);
    await page.waitForTimeout(300);
    const n = await allCards(page).count();
    const evidence = await shot(page, ctx, 'hostile-one');
    return { pass: n === 1, detail: `${n} cards rendered for 1 task`, evidence };
  },

  async 'hostile-1000'(ctx) {
    const many = Array.from({ length: 1000 }, (_, i) =>
      task(`t${i}`, `Task ${i}`, ['todo', 'in-progress', 'done'][i % 3], i % 2 ? 'u1' : 'u2'),
    );
    const page = await open(ctx, { tasks: many });
    await settle(page, async () => (await allCards(page).count()) === 1000, 20_000);
    const n = await allCards(page).count();
    const overflow = await overflowsX(page);
    const evidence = await shot(page, ctx, 'hostile-1000');
    return { pass: n === 1000 && !overflow, detail: `${n} cards, horizontal overflow=${overflow}`, evidence };
  },

  async 'hostile-long-title'(ctx) {
    const long = 'x'.repeat(300);
    const page = await open(ctx, { tasks: [task('t1', long)] });
    await settle(page, async () => (await allCards(page).count()) === 1);
    const card = allCards(page).first();
    const rendered = (await card.locator('.title').textContent().catch(() => ''))?.trim();
    const cardOverflow = await card
      .evaluate((el) => el.scrollWidth > el.clientWidth + 1)
      .catch(() => true);
    const overflow = await overflowsX(page);
    const evidence = await shot(page, ctx, 'hostile-long-title');
    return {
      pass: rendered === long && !cardOverflow && !overflow,
      detail: `title length ${rendered?.length ?? 0}, card overflow=${cardOverflow}, page overflow=${overflow}`,
      evidence,
    };
  },

  async 'hostile-emoji-rtl'(ctx) {
    const names = [
      { id: 'u1', name: '🦄 Zoë' },
      { id: 'u2', name: 'مريم' },
    ];
    const page = await open(ctx, {
      users: names,
      tasks: [task('t1', '🚀 Ship it', 'todo', 'u1'), task('t2', 'مهمة', 'done', 'u2')],
    });
    await settle(page, async () => (await allCards(page).count()) === 2);
    const shown = (await page.locator('.assignee-name').allTextContents()).map((s) => s.trim());
    const titles = (await page.locator('[data-testid="task-card"] .title').allTextContents()).map((s) => s.trim());
    const evidence = await shot(page, ctx, 'hostile-emoji-rtl');
    const pass =
      shown.includes('🦄 Zoë') && shown.includes('مريم') && titles.includes('🚀 Ship it') && titles.includes('مهمة');
    return { pass, detail: `names ${JSON.stringify(shown)}, titles ${JSON.stringify(titles)}`, evidence };
  },

  async 'hostile-500'(ctx) {
    const page = await open(ctx, { tasksStatus: 500 });
    await page.waitForTimeout(1500);
    const board = page.locator('.board');
    const text = (await board.innerText().catch(() => '')).trim();
    const empties = (await page.locator('.column .empty').allTextContents()).map((s) => s.trim());
    const evidence = await shot(page, ctx, 'hostile-500');
    const blank = text.length === 0;
    const pretendsEmpty = empties.includes('No tasks');
    const stuckLoading = empties.includes('Loading…');
    return {
      pass: !blank && !pretendsEmpty && !stuckLoading,
      detail: blank
        ? 'board is blank after a 500'
        : pretendsEmpty
          ? 'a 500 from /api/tasks renders as "No tasks" (failure shown as empty data)'
          : stuckLoading
            ? 'a 500 from /api/tasks leaves the board on "Loading…"'
            : `error state shown: ${JSON.stringify(text.slice(0, 80))}`,
      evidence,
    };
  },
};

// ---------- bad fixtures for --self-test (each must make its check fail) ----------

const col = (status, label, inner) =>
  `<div class="column" data-status="${status}"><header class="column-header"><h2>${label}</h2></header><ul class="cards">${inner}</ul></div>`;
const card = (title, name = 'Ada', buttons = '') =>
  `<li class="card" data-testid="task-card"><p class="title">${title}</p><p class="assignee"><span class="assignee-name">${name}</span></p><div class="actions">${buttons}</div></li>`;
const page = (board, aside = '<aside aria-label="Activity"><h2>Activity</h2><p>x</p></aside>') =>
  `<!doctype html><html><body><section class="board">${board}</section>${aside}</body></html>`;

const badFixtures = {
  'board-columns': page(col('todo', 'To do', card('Fix login')) + col('done', 'Done', '')),
  'move-task': page(
    col('todo', 'To do', card('Fix login', 'Ada', '<button>→ Done</button>')) +
      col('in-progress', 'In progress', '') +
      col('done', 'Done', ''),
  ),
  'activity-panel': page(col('todo', 'To do', ''), ''),
  'hostile-empty': page(
    ['todo', 'in-progress', 'done'].map((s) => col(s, s, '<li class="empty">Loading…</li>')).join(''),
  ),
  'hostile-one': page(col('todo', 'To do', card('Only task') + card('Only task'))),
  'hostile-1000': page(col('todo', 'To do', card('Task 0')) + '<div style="width:5000px">wide</div>'),
  'hostile-long-title': page(
    col('todo', 'To do', `<li class="card" data-testid="task-card" style="width:200px;overflow:auto"><p class="title" style="white-space:nowrap">${'x'.repeat(300)}</p></li>`),
  ),
  'hostile-emoji-rtl': page(col('todo', 'To do', card('?? Ship it', '?? Zo?') + card('????', '????'))),
  'hostile-500': page(
    ['todo', 'in-progress', 'done'].map((s) => col(s, s, '<li class="empty">No tasks</li>')).join(''),
  ),
};

// ---------- runner ----------

const browser = await chromium.launch();
const results = [];
try {
  for (const [name, check] of Object.entries(checks)) {
    const ctx = selfTest
      ? { browser, out, base: 'http://selftest.invalid', fixture: badFixtures[name] }
      : { browser, out, base };
    if (selfTest && !ctx.fixture) {
      results.push({ name, pass: true, detail: 'no bad fixture defined' });
      continue;
    }
    let result;
    try {
      result = await check(ctx);
    } catch (err) {
      result = { pass: false, detail: `threw: ${err.message.split('\n')[0]}` };
    }
    results.push({ name, ...result });
  }
} finally {
  await browser.close();
}

let failed = 0;
const lines = [];
for (const r of results) {
  if (selfTest) {
    // In self-test a check is healthy when it FAILS its bad fixture.
    const ok = !r.pass;
    if (!ok) failed++;
    lines.push(`${ok ? 'OK  ' : 'BAD '} ${r.name} - ${ok ? 'fails its bad fixture' : `cannot fail (${r.detail})`}`);
  } else {
    if (!r.pass) failed++;
    lines.push(`${r.pass ? 'PASS' : 'FAIL'} ${r.name} - ${r.detail}`);
  }
}

const header = selfTest ? `# verify-web self-test` : `# verify-web against ${base}`;
const index = [header, '', ...lines.map((l) => `- ${l}`), '', `evidence: ${out}`].join('\n');
writeFileSync(join(out, 'index.md'), index + '\n');
console.log(lines.join('\n'));
console.log(`evidence: ${out}`);
process.exit(failed ? 1 : 0);
