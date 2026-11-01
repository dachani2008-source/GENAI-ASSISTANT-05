import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { INITIAL_EVENTS } from './data/seedEvents';
import {
  getCachedAiResponse,
  sanitizePayloadObject,
  setCachedAiResponse,
} from './services/serverSecurity';
import { aiPlanningService } from './services/aiPlanningService';
import {
  EventsPortfolioView,
  MobileNavigationDrawer,
  WorkspaceHeader,
  WorkspaceSettingsView,
  WorkspaceSidebar,
} from './components/WorkspaceLayout';
import {
  calculateInstantEstimate,
  compareVendorQuotations,
  generateDeterministicOptimization,
  generateEventICS,
  generateGoogleCalendarUrl,
  recalculateMilestoneDates,
  validateCategoryAllocation,
  validateWizardStep,
} from './utils/planningLogic';

const noop = () => {};
const sampleWedding = INITIAL_EVENTS[0];

test('Arch 1: sanitizePayloadObject strips prototype pollution keys and nested XSS scripts', () => {
  const maliciousPayload = JSON.parse(
    '{"name":"<script>evil()</script>Clara","nested":{"note":"<b>Safe</b><img onerror=alert(1)>"},"__proto__":{"polluted":true},"constructor":{"prototype":{"hacked":true}}}'
  );
  const cleaned = sanitizePayloadObject(maliciousPayload);
  assert.equal(cleaned.name, 'Clara');
  assert.equal(cleaned.nested.note, 'Safe');
  assert.equal(Object.prototype.hasOwnProperty.call(cleaned, '__proto__'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(cleaned, 'constructor'), false);
});

test('Arch 2: Bounded LRU AI response cache stores and retrieves entries accurately', () => {
  setCachedAiResponse('test:key:1', { status: 'cached-ok', count: 42 });
  const hit = getCachedAiResponse<{ status: string; count: number }>('test:key:1');
  assert.ok(hit);
  assert.equal(hit.status, 'cached-ok');
  assert.equal(hit.count, 42);
  assert.equal(getCachedAiResponse('test:key:nonexistent'), null);
});

test('Arch 3: WorkspaceLayout modular components render ARIA landmarks and controls', () => {
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: null },
    { id: 'budget' as const, label: 'Budget Studio', icon: null },
  ];

  const sidebarHtml = renderToStaticMarkup(
    <WorkspaceSidebar
      navItems={navItems}
      activeSection="overview"
      sidebarCollapsed={false}
      activeCategory="wedding"
      onSelectSection={noop}
      onToggleCollapse={noop}
      onOpenWizard={noop}
      onReturnMarketing={noop}
    />
  );
  assert.ok(sidebarHtml.includes('aria-current="page"'));
  assert.ok(sidebarHtml.includes('Workspace Sidebar Navigation'));

  const mobileDrawerHtml = renderToStaticMarkup(
    <MobileNavigationDrawer
      isOpen={true}
      navItems={navItems}
      activeSection="budget"
      activeCategory="wedding"
      onClose={noop}
      onSelectSection={noop}
      onOpenWizard={noop}
      onReturnMarketing={noop}
    />
  );
  assert.ok(mobileDrawerHtml.includes('role="dialog"'));
  assert.ok(mobileDrawerHtml.includes('Mobile Navigation Drawer'));

  const headerHtml = renderToStaticMarkup(
    <WorkspaceHeader
      events={INITIAL_EVENTS}
      activeEvent={sampleWedding}
      activeSectionLabel="Overview"
      plannerName="Clara Vance"
      searchQuery="floral"
      searchResults={[{ label: 'Floral & Scenography', type: 'Budget Category', section: 'budget' }]}
      notificationsOpen={true}
      profileMenuOpen={true}
      onOpenMobileMenu={noop}
      onSelectEvent={noop}
      onSearchChange={noop}
      onSelectSearchResult={noop}
      onOpenCopilot={noop}
      onToggleNotifications={noop}
      onCloseNotifications={noop}
      onToggleProfileMenu={noop}
      onCloseProfileMenu={noop}
      onNavigateSection={noop}
      onOpenWizard={noop}
      onReturnMarketing={noop}
    />
  );
  assert.ok(headerHtml.includes('role="listbox"'));
  assert.ok(headerHtml.includes('role="menu"'));
  assert.ok(headerHtml.includes('aria-expanded="true"'));
});

test('Arch 4: EventsPortfolioView and WorkspaceSettingsView render accessible forms and cards', () => {
  const portfolioHtml = renderToStaticMarkup(
    <EventsPortfolioView
      events={INITIAL_EVENTS}
      activeEvent={sampleWedding}
      onOpenWizard={noop}
      onSelectEventStudio={noop}
    />
  );
  assert.ok(portfolioHtml.includes('All Active Celebration &amp; Operations Workspaces'));
  assert.ok(portfolioHtml.includes('Active Workspace'));

  const settingsHtml = renderToStaticMarkup(
    <WorkspaceSettingsView
      plannerName="Clara Vance"
      activeEvent={sampleWedding}
      onUpdatePlannerName={noop}
      onUpdateActiveEvent={noop}
      onNotify={noop}
    />
  );
  assert.ok(settingsHtml.includes('Planner Profile, Event Parameters &amp; Date Recalculation'));
  assert.ok(settingsHtml.includes('for="set-date"'));
});

test('Arch 5: aiPlanningService provides resilient fallback for budget optimization and theme suggestions', async () => {
  const proposal = await aiPlanningService.optimizeBudget({
    totalBudget: sampleWedding.totalBudget,
    currency: sampleWedding.currency,
    categories: sampleWedding.budgetCategories,
    priorities: sampleWedding.priorities,
  });
  assert.ok(proposal.estimatedSavings >= 0);
  assert.equal(proposal.adjustments.length, sampleWedding.budgetCategories.length);

  const themes = await aiPlanningService.suggestPersonalizedThemes({
    eventCategory: 'wedding',
    season: 'Autumn',
    setting: 'Architectural Courtyard',
    colorMood: 'Evergreen, Burgundy & Antique Gold',
    culturalNotes: 'Tuscan olive harvest',
    vibe: 'Contemporary Editorial',
  });
  assert.equal(themes.length, 3);
  assert.ok(themes[0].palette.length >= 4);
});

test('Arch 6: End-to-End Planner Lifecycle (Estimator -> Wizard -> Budget -> Vendors -> Timeline -> Calendar)', () => {
  // 1. Instant Estimator
  const estimate = calculateInstantEstimate('wedding', 65000, 140);
  assert.ok(estimate.perGuestCost > 400);

  // 2. Wizard Validation
  const step1Valid = validateWizardStep(1, {
    step: 1,
    category: 'wedding',
    name: 'Elena & Marco Villa Wedding',
    location: 'Lake Como',
    date: '2027-06-20',
    guestCount: 140,
    venueType: 'Historic Villa',
    currency: 'EUR',
    totalBudget: 65000,
    priorities: ['Venue', 'Food & Drink'],
    flexibility: 'Strict',
    style: 'Editorial',
    theme: 'Cypress & Candlelight',
    food: 'Italian Tasting Menu',
    culturalPreferences: '',
    specialRequirements: '',
  });
  assert.equal(step1Valid.valid, true);

  // 3. Budget Allocation Guard
  const allocCheck = validateCategoryAllocation(
    sampleWedding.totalBudget,
    sampleWedding.budgetCategories,
    sampleWedding.budgetCategories[1].id,
    sampleWedding.budgetCategories[1].plannedAmount + 500
  );
  assert.equal(allocCheck.valid, true);

  // 4. Deterministic Budget Optimization
  const opt = generateDeterministicOptimization(
    sampleWedding.totalBudget,
    sampleWedding.budgetCategories,
    sampleWedding.priorities
  );
  assert.ok(opt.estimatedSavings > 0);

  // 5. Vendor Spread Comparison
  const spread = compareVendorQuotations(sampleWedding.vendors);
  assert.ok(spread.spreadAmount >= 0);

  // 6. Milestone Date Shift & Calendar Sync
  const shifted = recalculateMilestoneDates(
    sampleWedding.milestones,
    sampleWedding.date,
    '2027-10-15'
  );
  assert.equal(shifted.length, sampleWedding.milestones.length);

  const gcalUrl = generateGoogleCalendarUrl(sampleWedding);
  const icsPayload = generateEventICS(sampleWedding);
  assert.ok(gcalUrl.startsWith('https://calendar.google.com/calendar/render?'));
  assert.ok(icsPayload.includes('BEGIN:VCALENDAR'));
});
