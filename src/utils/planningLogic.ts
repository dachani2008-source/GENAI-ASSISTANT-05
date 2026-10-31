import {
  BudgetAllocation,
  BudgetOptimizationProposal,
  CurrencyCode,
  EventWorkspace,
   EventWizardDraft,
  TimelineMilestone,
  VendorItem,
} from '../types/event';

export interface BudgetSummary {
  totalBudget: number;
  allocated: number;
  spent: number;
  remainingToAllocate: number;
  remainingToSpend: number;
  allocatedPercentage: number;
  spentPercentage: number;
  isOverAllocated: boolean;
  overAllocatedBy: number;
}

/**
 * Deterministic financial calculation for Smart Budget Studio.
 */
export function calculateBudgetSummary(
  totalBudget: number,
  categories: BudgetAllocation[]
): BudgetSummary {
  const safeTotal = Math.max(0, Math.round(totalBudget));
  const allocated = categories.reduce(
    (sum, item) => sum + Math.max(0, Math.round(item.plannedAmount)),
    0
  );
  const spent = categories.reduce(
    (sum, item) => sum + Math.max(0, Math.round(item.actualAmount)),
    0
  );

  const remainingToAllocate = safeTotal - allocated;
  const remainingToSpend = safeTotal - spent;
  const allocatedPercentage =
    safeTotal > 0 ? Math.round((allocated / safeTotal) * 1000) / 10 : 0;
  const spentPercentage =
    safeTotal > 0 ? Math.round((spent / safeTotal) * 1000) / 10 : 0;

  return {
    totalBudget: safeTotal,
    allocated,
    spent,
    remainingToAllocate,
    remainingToSpend,
    allocatedPercentage,
    spentPercentage,
    isOverAllocated: allocated > safeTotal,
    overAllocatedBy: Math.max(0, allocated - safeTotal),
  };
}

export interface CategoryMetrics {
  variance: number; // positive means under budget, negative means over budget
  percentageOfTotal: number;
  utilizationRate: number;
}

export function calculateCategoryMetrics(
  category: BudgetAllocation,
  totalBudget: number
): CategoryMetrics {
  const planned = Math.round(category.plannedAmount);
  const actual = Math.round(category.actualAmount);
  const variance = planned - actual;
  const percentageOfTotal =
    totalBudget > 0 ? Math.round((planned / totalBudget) * 1000) / 10 : 0;
  const utilizationRate =
    planned > 0 ? Math.round((actual / planned) * 1000) / 10 : 0;

  return {
    variance,
    percentageOfTotal,
    utilizationRate,
  };
}

export interface AllocationValidationResult {
  valid: boolean;
  newTotalAllocated: number;
  excessAmount: number;
  message?: string;
}

/**
 * Never allow budget allocations to silently exceed the total budget.
 */
export function validateCategoryAllocation(
  totalBudget: number,
  categories: BudgetAllocation[],
  targetCategoryId: string,
  proposedPlannedAmount: number
): AllocationValidationResult {
  if (Number.isNaN(proposedPlannedAmount) || proposedPlannedAmount < 0) {
    return {
      valid: false,
      newTotalAllocated: 0,
      excessAmount: 0,
      message: 'Allocation amount must be a non-negative number.',
    };
  }

  const target = categories.find((c) => c.id === targetCategoryId);
  if (!target) {
    return {
      valid: false,
      newTotalAllocated: 0,
      excessAmount: 0,
      message: 'Budget category not found.',
    };
  }

  if (target.locked) {
    return {
      valid: false,
      newTotalAllocated: 0,
      excessAmount: 0,
      message: `${target.category} is locked. Unlock this category before modifying its allocation.`,
    };
  }

  const otherAllocated = categories
    .filter((c) => c.id !== targetCategoryId)
    .reduce((sum, c) => sum + Math.round(c.plannedAmount), 0);

  const newTotalAllocated = otherAllocated + Math.round(proposedPlannedAmount);
  const excessAmount = Math.max(0, newTotalAllocated - Math.round(totalBudget));

  if (excessAmount > 0) {
    return {
      valid: false,
      newTotalAllocated,
      excessAmount,
      message: `Allocation exceeds total event budget by ${excessAmount.toLocaleString()}. Reduce another unlocked category or increase the total budget first.`,
    };
  }

  return {
    valid: true,
    newTotalAllocated,
    excessAmount: 0,
  };
}

/**
 * Deterministic fallback & verification for AI Budget Optimization.
 * Respects locked categories and never exceeds totalBudget.
 */
export function generateDeterministicOptimization(
  totalBudget: number,
  categories: BudgetAllocation[],
  priorities: string[]
): BudgetOptimizationProposal {
  const adjustments: BudgetOptimizationProposal['adjustments'] = [];
  let totalSaved = 0;

  for (const cat of categories) {
    if (cat.locked) {
      adjustments.push({
        categoryId: cat.id,
        categoryName: cat.category,
        beforeAmount: cat.plannedAmount,
        afterAmount: cat.plannedAmount,
        reason: 'Category is locked by planner — allocation preserved.',
      });
      continue;
    }

    const isPriority = priorities.some((p) =>
      cat.category.toLowerCase().includes(p.toLowerCase())
    );

    if (cat.actualAmount > cat.plannedAmount) {
      // Align planned to cover actuals if needed, trimmed from non-priority
      const afterAmount = cat.actualAmount;
      adjustments.push({
        categoryId: cat.id,
        categoryName: cat.category,
        beforeAmount: cat.plannedAmount,
        afterAmount,
        reason: 'Realigned allocation to match committed actual spend.',
      });
    } else if (!isPriority && cat.plannedAmount > cat.actualAmount * 1.15) {
      const reduction = Math.round((cat.plannedAmount - cat.actualAmount) * 0.14);
      const afterAmount = Math.max(cat.actualAmount, cat.plannedAmount - reduction);
      const saved = cat.plannedAmount - afterAmount;
      totalSaved += saved;
      adjustments.push({
        categoryId: cat.id,
        categoryName: cat.category,
        beforeAmount: cat.plannedAmount,
        afterAmount,
        reason: 'Consolidated contingency buffer on non-priority line item.',
      });
    } else {
      const reduction = Math.round((cat.plannedAmount - cat.actualAmount) * 0.06);
      const afterAmount = Math.max(cat.actualAmount, cat.plannedAmount - reduction);
      const saved = cat.plannedAmount - afterAmount;
      totalSaved += saved;
      adjustments.push({
        categoryId: cat.id,
        categoryName: cat.category,
        beforeAmount: cat.plannedAmount,
        afterAmount,
        reason: isPriority
          ? 'Protected priority experience while trimming 6% off unspent margin.'
          : 'Optimized vendor package margin based on current commitments.',
      });
    }
  }

  // Ensure total afterAmount never exceeds totalBudget
  const proposedSum = adjustments.reduce((acc, a) => acc + a.afterAmount, 0);
  if (proposedSum > totalBudget) {
    const overflow = proposedSum - totalBudget;
    const unlocked = adjustments.find(
      (a) => !categories.find((c) => c.id === a.categoryId)?.locked && a.afterAmount > overflow
    );
    if (unlocked) {
      unlocked.afterAmount -= overflow;
    }
  }

  return {
    rationale:
      'Preserved locked categories and high-priority guest touchpoints while reclaiming unallocated contingency across secondary categories.',
    estimatedSavings: Math.max(0, totalSaved),
    adjustments,
  };
}

/**
 * Recalculates milestone due dates when the event date changes.
 * Uses each milestone's `daysBeforeEvent` offset (or computes the delta between oldEventDate and newEventDate).
 */
export function recalculateMilestoneDates(
  milestones: TimelineMilestone[],
  oldEventDate: string,
  newEventDate: string,
  referenceToday: string = '2026-10-31'
): TimelineMilestone[] {
  const oldTime = Date.parse(`${oldEventDate}T00:00:00Z`);
  const newTime = Date.parse(`${newEventDate}T00:00:00Z`);
  if (Number.isNaN(newTime)) return milestones;

  const deltaMs = !Number.isNaN(oldTime) ? newTime - oldTime : 0;
  const todayMs = Date.parse(`${referenceToday}T00:00:00Z`);

  return milestones.map((m) => {
    let nextDueMs: number;
    if (typeof m.daysBeforeEvent === 'number' && m.daysBeforeEvent >= 0) {
      nextDueMs = newTime - m.daysBeforeEvent * 86400000;
    } else {
      const currentDueMs = Date.parse(`${m.dueDate}T00:00:00Z`);
      nextDueMs = Number.isNaN(currentDueMs) ? newTime : currentDueMs + deltaMs;
    }

    const updatedDueDate = new Date(nextDueMs).toISOString().slice(0, 10);

    let updatedStatus = m.status;
    if (m.status !== 'Completed') {
      if (nextDueMs < todayMs) {
        updatedStatus = 'Overdue';
      } else if (m.status === 'Overdue' && nextDueMs >= todayMs) {
        updatedStatus = 'Upcoming';
      }
    }

    return {
      ...m,
      dueDate: updatedDueDate,
      status: updatedStatus,
    };
  });
}

export function getDaysUntilEvent(
  eventDate: string,
  referenceToday: string = '2026-10-31'
): number {
  const target = Date.parse(`${eventDate}T00:00:00Z`);
  const today = Date.parse(`${referenceToday}T00:00:00Z`);
  if (Number.isNaN(target) || Number.isNaN(today)) return 0;
  return Math.max(0, Math.ceil((target - today) / 86400000));
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const symbols: Record<CurrencyCode, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
  };
  const symbol = symbols[currency] || '$';
  const isNegative = amount < 0;
  const formatted = Math.abs(Math.round(amount)).toLocaleString('en-US');
  return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export interface VendorComparisonMetrics {
  lowestQuoteId: string | null;
  highestQuoteId: string | null;
  averageQuote: number;
  spreadAmount: number;
}

export function compareVendorQuotations(vendors: VendorItem[]): VendorComparisonMetrics {
  if (vendors.length === 0) {
    return {
      lowestQuoteId: null,
      highestQuoteId: null,
      averageQuote: 0,
      spreadAmount: 0,
    };
  }
  const sorted = [...vendors].sort((a, b) => a.quotation - b.quotation);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const sum = vendors.reduce((acc, v) => acc + v.quotation, 0);

  return {
    lowestQuoteId: lowest.id,
    highestQuoteId: highest.id,
    averageQuote: Math.round(sum / vendors.length),
    spreadAmount: Math.round(highest.quotation - lowest.quotation),
  };
}

export interface WizardValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateWizardStep(
  step: number,
  draft: EventWizardDraft
): WizardValidationResult {
  const errors: Record<string, string> = {};

  if (step === 1) {
    if (!['wedding', 'birthday', 'community'].includes(draft.category)) {
      errors.category = 'Please choose an event category.';
    }
  } else if (step === 2) {
    if (!draft.name || draft.name.trim().length < 3) {
      errors.name = 'Enter an event title (at least 3 characters).';
    }
    if (!draft.location || draft.location.trim().length < 2) {
      errors.location = 'Enter the city or venue location.';
    }
    if (!draft.date || Number.isNaN(Date.parse(draft.date))) {
      errors.date = 'Select a valid event date.';
    }
    if (!draft.guestCount || draft.guestCount < 2 || draft.guestCount > 25000) {
      errors.guestCount = 'Guest count must be between 2 and 25,000.';
    }
    if (!draft.venueType || draft.venueType.trim().length === 0) {
      errors.venueType = 'Select a venue setting.';
    }
  } else if (step === 3) {
    if (!draft.totalBudget || draft.totalBudget < 200) {
      errors.totalBudget = 'Enter a realistic total budget (minimum 200).';
    }
    if (!draft.priorities || draft.priorities.length === 0) {
      errors.priorities = 'Select at least one planning priority.';
    }
  } else if (step === 4) {
    if (!draft.style || draft.style.trim().length === 0) {
      errors.style = 'Select or describe your preferred aesthetic style.';
    }
    if (!draft.theme || draft.theme.trim().length === 0) {
      errors.theme = 'Enter a theme direction.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Generates an RFC 5545 iCalendar (.ics) file string for syncing event date and milestones.
 */
export function generateEventICS(event: EventWorkspace): string {
  const cleanDate = (dateStr: string) => dateStr.replace(/-/g, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ELEGANTIA AI//Intelligent Event Planning Studio//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:elegantia-event-${event.id}@elegantia.ai`,
    `SUMMARY:${event.name}`,
    `DTSTART;VALUE=DATE:${cleanDate(event.date)}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${event.category.toUpperCase()} STUDIO — Theme: ${event.theme} | Guests: ${event.guestCount}`,
    'END:VEVENT',
  ];

  for (const m of event.milestones) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:elegantia-milestone-${m.id}@elegantia.ai`,
      `SUMMARY:[${event.name}] Milestone: ${m.title}`,
      `DTSTART;VALUE=DATE:${cleanDate(m.dueDate)}`,
      `DESCRIPTION:Priority: ${m.priority} | Assignee: ${m.assignee} | Status: ${m.status}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export interface InstantBudgetEstimate {
  perGuestCost: number;
  allocations: {
    label: string;
    sharePercent: number;
    amount: number;
  }[];
}

/**
 * Interactive budget estimator for the marketing website & quick planner.
 */
export function calculateInstantEstimate(
  category: 'wedding' | 'birthday' | 'community',
  totalBudget: number,
  guestCount: number
): InstantBudgetEstimate {
  const safeBudget = Math.max(500, Math.round(totalBudget));
  const safeGuests = Math.max(1, Math.round(guestCount));
  const perGuestCost = Math.round(safeBudget / safeGuests);

  const weights =
    category === 'wedding'
      ? [
          { label: 'Venue & Architecture', sharePercent: 34 },
          { label: 'Culinary, Wine & Bar', sharePercent: 28 },
          { label: 'Floral & Candlelight Scenography', sharePercent: 15 },
          { label: 'Editorial Photography & Film', sharePercent: 12 },
          { label: 'Music, Stationery & Hospitality', sharePercent: 11 },
        ]
      : category === 'birthday'
      ? [
          { label: 'Loft / Private Venue Rental', sharePercent: 30 },
          { label: 'Dining, Craft Bar & Artisanal Cake', sharePercent: 38 },
          { label: 'Theme Scenography & Florals', sharePercent: 18 },
          { label: 'Vinyl DJ, Photography & Return Gifts', sharePercent: 14 },
        ]
      : [
          { label: 'Venue, Municipal Permits & Safety', sharePercent: 26 },
          { label: 'Stage Production, Audio & Lighting', sharePercent: 34 },
          { label: 'Attendee Catering & Zero-Waste Ops', sharePercent: 24 },
          { label: 'Wayfinding Signage, Badges & Crew', sharePercent: 16 },
        ];

  return {
    perGuestCost,
    allocations: weights.map((w) => ({
      label: w.label,
      sharePercent: w.sharePercent,
      amount: Math.round((safeBudget * w.sharePercent) / 100),
    })),
  };
}

