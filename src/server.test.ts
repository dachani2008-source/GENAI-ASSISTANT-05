import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../server';
import { CATEGORY_SHOWCASE, INITIAL_EVENTS } from './data/seedEvents';

process.env.NODE_ENV = 'test';

async function withTestServer(
  fn: (baseUrl: string) => Promise<void>
): Promise<void> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('API 1: GET /api/health returns 200 OK with security and rate-limit headers', async () => {
  await withTestServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.ok(res.headers.get('permissions-policy'));
    assert.ok(res.headers.get('x-ratelimit-limit'));
    assert.equal(res.headers.get('x-powered-by'), null);

    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'ELEGANTIA AI');
  });
});

test('API 2: POST /api/gemini/generate-plan validates missing draft and synthesizes complete plan with caching', async () => {
  await withTestServer(async (baseUrl) => {
    const badRes = await fetch(`${baseUrl}/api/gemini/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(badRes.status, 400);

    const draftPayload = {
      draft: {
        name: '<script>evil()</script>Clara & Julian Conservatory Wedding',
        category: 'wedding',
        location: 'Hudson Valley, NY',
        date: '2026-12-12',
        guestCount: 150,
        venueType: 'Glasshouse Conservatory',
        currency: 'USD',
        totalBudget: 90000,
        priorities: ['Venue', 'Culinary'],
        style: 'Contemporary Editorial',
        theme: 'Candlelit Botanical Warmth',
        food: 'Seasonal Tasting Menu',
      },
    };

    const res1 = await fetch(`${baseUrl}/api/gemini/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftPayload),
    });
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.ok(Array.isArray(data1.plan.budgetCategories));
    assert.ok(Array.isArray(data1.plan.milestones));
    assert.ok(Array.isArray(data1.plan.scheduleSlots));

    // Verify LRU cache HIT on identical repeat request
    const res2 = await fetch(`${baseUrl}/api/gemini/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftPayload),
    });
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get('x-cache'), 'HIT');
  });
});

test('API 3: POST /api/gemini/optimize-budget enforces locked categories and rejects invalid payloads', async () => {
  await withTestServer(async (baseUrl) => {
    const invalidRes = await fetch(`${baseUrl}/api/gemini/optimize-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalBudget: 50000 }),
    });
    assert.equal(invalidRes.status, 400);

    const validRes = await fetch(`${baseUrl}/api/gemini/optimize-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalBudget: 80000,
        currency: 'USD',
        priorities: ['Venue'],
        categories: [
          {
            id: 'c1',
            category: 'Venue & Architecture',
            plannedAmount: 35000,
            actualAmount: 35000,
            locked: true,
          },
          {
            id: 'c2',
            category: 'Decor & Florals',
            plannedAmount: 20000,
            actualAmount: 10000,
            locked: false,
          },
        ],
      }),
    });
    assert.equal(validRes.status, 200);
    const data = await validRes.json();
    assert.ok(data.proposal);
    const lockedAdj = data.proposal.adjustments.find(
      (a: { categoryId: string }) => a.categoryId === 'c1'
    );
    assert.equal(lockedAdj.beforeAmount, 35000);
    assert.equal(lockedAdj.afterAmount, 35000);
  });
});

test('API 4: POST /api/gemini/generate-ideas and /api/gemini/suggest-themes return structured concepts', async () => {
  await withTestServer(async (baseUrl) => {
    const ideasRes = await fetch(`${baseUrl}/api/gemini/generate-ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'Terracotta Birthday Dinner',
        eventCategory: 'birthday',
        ideaCategory: 'Decoration',
        theme: 'Candlelit Supper Club',
        style: 'Warm Minimalist',
      }),
    });
    assert.equal(ideasRes.status, 200);
    const ideasData = await ideasRes.json();
    assert.ok(Array.isArray(ideasData.ideas));
    assert.ok(ideasData.ideas.length >= 2);

    const themesRes = await fetch(`${baseUrl}/api/gemini/suggest-themes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventCategory: 'community',
        season: 'Spring',
        setting: 'Civic Atrium & Pavilion',
        colorMood: 'Coastal Teal, Jade & Raw Linen',
        culturalNotes: 'Local Artisans Showcase',
        vibe: 'Civic Modern',
      }),
    });
    assert.equal(themesRes.status, 200);
    const themesData = await themesRes.json();
    assert.ok(Array.isArray(themesData.themes));
    assert.equal(themesData.themes.length, 3);
  });
});

test('API 5: POST /api/gemini/copilot handles budget, timeline, vendor, and theme prompts', async () => {
  await withTestServer(async (baseUrl) => {
    const emptyRes = await fetch(`${baseUrl}/api/gemini/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '   ' }),
    });
    assert.equal(emptyRes.status, 400);

    for (const q of [
      'How can I reduce budget spend?',
      'What timeline milestones are due this week?',
      'Which vendor bookings need follow-up?',
      'Suggest a cohesive lighting and tablescape aesthetic.',
    ]) {
      const res = await fetch(`${baseUrl}/api/gemini/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          eventContext: {
            name: 'Vance & Sterling Wedding',
            currency: 'USD',
            totalBudget: 95000,
            allocated: 82000,
            spent: 54000,
            overdueCount: 1,
            nextMilestoneTitle: 'Confirm Catering Tasting',
            pendingVendorNames: ['Maison Flora'],
            theme: 'Architectural Warmth',
          },
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(typeof body.reply === 'string' && body.reply.length > 10);
      assert.ok(Array.isArray(body.bulletPoints));
      assert.ok(body.proposedAction?.title);
    }
  });
});

test('Data 6: Seed events across Wedding, Birthday, and Community studios maintain structural integrity', () => {
  assert.equal(INITIAL_EVENTS.length, 3);
  const categories = INITIAL_EVENTS.map((e) => e.category).sort();
  assert.deepEqual(categories, ['birthday', 'community', 'wedding']);

  for (const evt of INITIAL_EVENTS) {
    assert.ok(evt.totalBudget > 0);
    assert.ok(evt.guestCount > 0);
    assert.ok(evt.budgetCategories.length >= 3);
    assert.ok(evt.milestones.length >= 2);
    assert.ok(evt.vendors.length >= 2);
    assert.ok(evt.ideas.length >= 1);
    assert.ok(CATEGORY_SHOWCASE[evt.category].accentHex.startsWith('#'));
  }
});
