import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetSummary,
  calculateCategoryMetrics,
  calculateInstantEstimate,
  compareVendorQuotations,
  generateDeterministicOptimization,
  generateEventICS,
  recalculateMilestoneDates,
  validateCategoryAllocation,
  validateWizardStep,
} from './planningLogic';
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

test('calculateBudgetSummary computes accurate totals, remaining, and percentages', () => {
  const summary = calculateBudgetSummary(85000, sampleCategories);
  assert.equal(summary.totalBudget, 85000);
  assert.equal(summary.allocated, 75000);
  assert.equal(summary.spent, 58000);
  assert.equal(summary.remainingToAllocate, 10000);
  assert.equal(summary.remainingToSpend, 27000);
  assert.equal(summary.isOverAllocated, false);
  assert.equal(summary.overAllocatedBy, 0);
});

test('validateCategoryAllocation prevents silent budget overflow and respects locked categories', () => {
  // Attempt to edit a locked category
  const lockedAttempt = validateCategoryAllocation(85000, sampleCategories, 'cat-1', 36000);
  assert.equal(lockedAttempt.valid, false);
  assert.ok(lockedAttempt.message?.includes('locked'));

  // Attempt to allocate more than total budget (35k + 15k + 40k = 90k > 85k)
  const overflowAttempt = validateCategoryAllocation(85000, sampleCategories, 'cat-2', 40000);
  assert.equal(overflowAttempt.valid, false);
  assert.equal(overflowAttempt.excessAmount, 5000);

  // Valid allocation within total budget (35k + 15k + 30k = 80k <= 85k)
  const validAttempt = validateCategoryAllocation(85000, sampleCategories, 'cat-2', 30000);
  assert.equal(validAttempt.valid, true);
  assert.equal(validAttempt.newTotalAllocated, 80000);
});

test('calculateCategoryMetrics computes variance and percentages accurately', () => {
  const metrics = calculateCategoryMetrics(sampleCategories[1], 100000);
  assert.equal(metrics.variance, 7000);
  assert.equal(metrics.percentageOfTotal, 25);
  assert.equal(metrics.utilizationRate, 72);
});

test('generateDeterministicOptimization preserves locked categories and saves budget', () => {
  const proposal = generateDeterministicOptimization(85000, sampleCategories, ['Culinary']);
  assert.ok(proposal.estimatedSavings > 0);
  const lockedAdjustment = proposal.adjustments.find((a) => a.categoryId === 'cat-1');
  assert.equal(lockedAdjustment?.beforeAmount, 35000);
  assert.equal(lockedAdjustment?.afterAmount, 35000);
});

test('recalculateMilestoneDates shifts due dates when event date moves and updates overdue state', () => {
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

  // Shift event from 2026-11-14 to 2026-12-20 (with referenceToday = 2026-10-31)
  const shifted = recalculateMilestoneDates(milestones, '2026-11-14', '2026-12-20', '2026-10-31');
  // 30 days before 2026-12-20 is 2026-11-20 (no longer overdue relative to 2026-10-31!)
  assert.equal(shifted[0].dueDate, '2026-11-20');
  assert.equal(shifted[0].status, 'Upcoming');
  // 7 days before 2026-12-20 is 2026-12-13
  assert.equal(shifted[1].dueDate, '2026-12-13');
});

test('compareVendorQuotations identifies lowest, highest, and spread', () => {
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

test('validateWizardStep enforces form constraints on each step', () => {
  const emptyDraft: EventWizardDraft = {
    step: 2,
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

  const step2Check = validateWizardStep(2, emptyDraft);
  assert.equal(step2Check.valid, false);
  assert.ok(step2Check.errors.name);
  assert.ok(step2Check.errors.location);

  const step3Check = validateWizardStep(3, emptyDraft);
  assert.equal(step3Check.valid, false);
  assert.ok(step3Check.errors.totalBudget);
  assert.ok(step3Check.errors.priorities);
});

test('calculateInstantEstimate computes accurate per-guest cost and category allocations', () => {
  const estimate = calculateInstantEstimate('wedding', 100000, 125);
  assert.equal(estimate.perGuestCost, 800);
  const sum = estimate.allocations.reduce((s, a) => s + a.amount, 0);
  assert.equal(sum, 100000);
});

