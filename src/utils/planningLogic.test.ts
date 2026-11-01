import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetSummary,
  calculateCategoryMetrics,
  calculateInstantEstimate,
  compareVendorQuotations,
  formatCurrency,
  generateDeterministicOptimization,
  generateEventICS,
  generateGoogleCalendarUrl,
  getDaysUntilEvent,
  recalculateMilestoneDates,
  sanitizeTextInput,
  suggestThemesFromPreferences,
  validateCategoryAllocation,
  validateWizardStep,
} from './planningLogic';
import { INITIAL_EVENTS } from '../data/seedEvents';
import { BudgetAllocation, EventWizardDraft, TimelineMilestone, VendorItem } from '../types/event';

const sampleCategories: BudgetAllocation[] = [
  {
    id: 'cat-1',
    category: 'Venue & Architecture',
    plannedAmount: 35000,
    actualAmount: 32000,
    locked: true,
    expenses: [],
  },
  {
    id: 'cat-2',
    category: 'Culinary & Beverage',
    plannedAmount: 25000,
    actualAmount: 18000,
    locked: false,
    expenses: [],
  },
  {
    id: 'cat-3',
    category: 'Floral & Scenography',
    plannedAmount: 15000,
    actualAmount: 8000,
    locked: false,
    expenses: [],
  },
];

test('1. calculateBudgetSummary computes accurate totals, remaining, and percentages', () => {
  const summary = calculateBudgetSummary(85000, sampleCategories);
  assert.equal(summary.totalBudget, 85000);
  assert.equal(summary.allocated, 75000);
  assert.equal(summary.spent, 58000);
  assert.equal(summary.remainingToAllocate, 10000);
  assert.equal(summary.remainingToSpend, 27000);
  assert.equal(summary.isOverAllocated, false);
  assert.equal(summary.overAllocatedBy, 0);
});

test('2. calculateBudgetSummary detects over-allocation and handles zero budget safely', () => {
  const overSummary = calculateBudgetSummary(60000, sampleCategories);
  assert.equal(overSummary.isOverAllocated, true);
  assert.equal(overSummary.overAllocatedBy, 15000);

  const zeroSummary = calculateBudgetSummary(0, []);
  assert.equal(zeroSummary.allocatedPercentage, 0);
  assert.equal(zeroSummary.spentPercentage, 0);
});

test('3. validateCategoryAllocation prevents silent budget overflow and respects locked categories', () => {
  const lockedAttempt = validateCategoryAllocation(85000, sampleCategories, 'cat-1', 36000);
  assert.equal(lockedAttempt.valid, false);
  assert.ok(lockedAttempt.message?.includes('locked'));

  const overflowAttempt = validateCategoryAllocation(85000, sampleCategories, 'cat-2', 40000);
  assert.equal(overflowAttempt.valid, false);
  assert.equal(overflowAttempt.excessAmount, 5000);

  const validAttempt = validateCategoryAllocation(85000, sampleCategories, 'cat-2', 30000);
  assert.equal(validAttempt.valid, true);
  assert.equal(validAttempt.newTotalAllocated, 80000);
});

test('4. validateCategoryAllocation rejects negative, NaN, and unknown category IDs', () => {
  const negAttempt = validateCategoryAllocation(85000, sampleCategories, 'cat-2', -500);
  assert.equal(negAttempt.valid, false);

  const nanAttempt = validateCategoryAllocation(85000, sampleCategories, 'cat-2', Number.NaN);
  assert.equal(nanAttempt.valid, false);

  const missingAttempt = validateCategoryAllocation(85000, sampleCategories, 'unknown-id', 5000);
  assert.equal(missingAttempt.valid, false);
  assert.ok(missingAttempt.message?.includes('not found'));
});

test('5. calculateCategoryMetrics computes variance and percentages accurately', () => {
  const metrics = calculateCategoryMetrics(sampleCategories[1], 100000);
  assert.equal(metrics.variance, 7000);
  assert.equal(metrics.percentageOfTotal, 25);
  assert.equal(metrics.utilizationRate, 72);
});

test('6. generateDeterministicOptimization preserves locked categories and saves budget', () => {
  const proposal = generateDeterministicOptimization(85000, sampleCategories, ['Culinary']);
  assert.ok(proposal.estimatedSavings > 0);
  const lockedAdjustment = proposal.adjustments.find((a) => a.categoryId === 'cat-1');
  assert.equal(lockedAdjustment?.beforeAmount, 35000);
  assert.equal(lockedAdjustment?.afterAmount, 35000);
});

test('7. generateDeterministicOptimization reconciles categories where actual spend exceeds planned', () => {
  const overSpentCategories: BudgetAllocation[] = [
    ...sampleCategories,
    {
      id: 'cat-4',
      category: 'Audio & Stage',
      plannedAmount: 4000,
      actualAmount: 5200,
      locked: false,
      expenses: [],
    },
  ];
  const proposal = generateDeterministicOptimization(95000, overSpentCategories, []);
  const reconciled = proposal.adjustments.find((a) => a.categoryId === 'cat-4');
  assert.equal(reconciled?.afterAmount, 5200);
});

test('8. recalculateMilestoneDates shifts due dates when event date moves and updates overdue state', () => {
  const milestones: TimelineMilestone[] = [
    {
      id: 'm-1',
      title: 'Confirm Venue Deposit',
      dueDate: '2026-10-15',
      daysBeforeEvent: 30,
      priority: 'High',
      status: 'Overdue',
      assignee: 'Clara Vance',
      phase: 'Foundation',
    },
    {
      id: 'm-2',
      title: 'Final Seating Chart',
      dueDate: '2026-11-07',
      daysBeforeEvent: 7,
      priority: 'Medium',
      status: 'Upcoming',
      assignee: 'Julian Sterling',
      phase: 'Final Week',
    },
  ];

  const shifted = recalculateMilestoneDates(milestones, '2026-11-14', '2026-12-20', '2026-10-31');
  assert.equal(shifted[0].dueDate, '2026-11-20');
  assert.equal(shifted[0].status, 'Upcoming');
  assert.equal(shifted[1].dueDate, '2026-12-13');
});

test('9. getDaysUntilEvent and formatCurrency handle multiple currencies and negative amounts', () => {
  assert.equal(getDaysUntilEvent('2026-11-10', '2026-10-31'), 10);
  assert.equal(getDaysUntilEvent('invalid-date', '2026-10-31'), 0);
  assert.equal(formatCurrency(12500, 'USD'), '$12,500');
  assert.equal(formatCurrency(8400, 'EUR'), '€8,400');
  assert.equal(formatCurrency(-1500, 'GBP'), '-£1,500');
});

test('10. compareVendorQuotations identifies lowest, highest, and spread including empty state', () => {
  const emptyComparison = compareVendorQuotations([]);
  assert.equal(emptyComparison.lowestQuoteId, null);
  assert.equal(emptyComparison.spreadAmount, 0);

  const vendors: VendorItem[] = [
    {
      id: 'v-1',
      name: 'Atelier Botanica',
      category: 'Floral',
      contactName: 'Elena Rostova',
      contactEmail: 'elena@botanica.example',
      contactPhone: '+1 212-555-0142',
      quotation: 12000,
      bookingStatus: 'Quoted',
      paymentStatus: 'Unpaid',
      inclusions: ['Ceremony Arch', '14 Tablescapes'],
      notes: '',
    },
    {
      id: 'v-2',
      name: 'Maison Flora',
      category: 'Floral',
      contactName: 'Henri Laurent',
      contactEmail: 'henri@flora.example',
      contactPhone: '+1 212-555-0188',
      quotation: 16000,
      bookingStatus: 'Quoted',
      paymentStatus: 'Unpaid',
      inclusions: ['Ceremony Arch', '14 Tablescapes', 'Afterparty Lounge'],
      notes: '',
    },
  ];

  const comparison = compareVendorQuotations(vendors);
  assert.equal(comparison.lowestQuoteId, 'v-1');
  assert.equal(comparison.highestQuoteId, 'v-2');
  assert.equal(comparison.averageQuote, 14000);
  assert.equal(comparison.spreadAmount, 4000);
});

test('11. validateWizardStep enforces form constraints across all steps', () => {
  const draft: EventWizardDraft = {
    step: 1,
    category: 'wedding',
    name: '',
    location: '',
    date: '',
    guestCount: 0,
    venueType: '',
    currency: 'USD',
    totalBudget: 100,
    priorities: [],
    flexibility: 'Strict',
    style: '',
    theme: '',
    food: '',
    culturalPreferences: '',
    specialRequirements: '',
  };

  assert.equal(validateWizardStep(1, draft).valid, true);
  assert.equal(validateWizardStep(2, draft).valid, false);
  assert.equal(validateWizardStep(3, draft).valid, false);
  assert.equal(validateWizardStep(4, draft).valid, false);

  const validDraft: EventWizardDraft = {
    ...draft,
    name: 'Autumn Botanical Gala',
    location: 'New York, NY',
    date: '2026-12-15',
    guestCount: 140,
    venueType: 'Glass Conservatory',
    totalBudget: 65000,
    priorities: ['Venue', 'Culinary'],
    style: 'Contemporary Editorial',
    theme: 'Candlelit Stone & Taper Scenography',
  };
  assert.equal(validateWizardStep(2, validDraft).valid, true);
  assert.equal(validateWizardStep(3, validDraft).valid, true);
  assert.equal(validateWizardStep(4, validDraft).valid, true);
});

test('12. calculateInstantEstimate computes accurate per-guest cost and allocations across all 3 categories', () => {
  for (const cat of ['wedding', 'birthday', 'community'] as const) {
    const estimate = calculateInstantEstimate(cat, 100000, 125);
    assert.equal(estimate.perGuestCost, 800);
    const sumPercent = estimate.allocations.reduce((s, a) => s + a.sharePercent, 0);
    assert.equal(sumPercent, 100);
  }
});

test('13. generateEventICS and generateGoogleCalendarUrl produce valid calendar sync payloads', () => {
  const evt = INITIAL_EVENTS[0];
  const ics = generateEventICS(evt);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('PRODID:-//ELEGANTIA AI//Intelligent Event Planning Studio//EN'));
  assert.ok(ics.includes(`SUMMARY:${evt.name}`));
  assert.ok(ics.includes('END:VCALENDAR'));

  const gcalUrl = generateGoogleCalendarUrl(evt);
  assert.ok(gcalUrl.startsWith('https://calendar.google.com/calendar/render?'));
  assert.ok(gcalUrl.includes('action=TEMPLATE'));
});

test('14. sanitizeTextInput strips script tags, HTML elements, and enforces maxLength', () => {
  const dirty = '<script>alert("xss")</script><b>Grand Ballroom</b> & Courtyard';
  const cleaned = sanitizeTextInput(dirty, 50);
  assert.equal(cleaned, 'Grand Ballroom & Courtyard');
  assert.equal(sanitizeTextInput(null), '');
});

test('15. suggestThemesFromPreferences generates 3 tailored themes with hex palettes and lighting cues', () => {
  const themes = suggestThemesFromPreferences({
    eventCategory: 'wedding',
    season: 'Autumn',
    setting: 'Glass Conservatory',
    colorMood: 'Evergreen, Burgundy & Antique Gold',
    culturalNotes: 'Mediterranean Olive Harvest',
    vibe: 'Contemporary Editorial',
  });
  assert.equal(themes.length, 3);
  assert.ok(themes[0].title.includes('Autumn'));
  assert.equal(themes[0].palette.length, 4);
  assert.equal(themes[0].decorHighlights.length, 3);
});
