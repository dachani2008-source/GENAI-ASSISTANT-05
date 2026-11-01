import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Loader2,
  Lock,
  Sparkles,
  Unlock,
  X,
} from 'lucide-react';
import {
  BudgetAllocation,
  BudgetOptimizationProposal,
  EventWorkspace,
} from '../types/event';
import {
  calculateBudgetSummary,
  calculateCategoryMetrics,
  formatCurrency,
  generateDeterministicOptimization,
  validateCategoryAllocation,
} from '../utils/planningLogic';

interface SmartBudgetStudioProps {
  event: EventWorkspace;
  onUpdateEvent: (updated: EventWorkspace) => void;
  onNotify: (msg: string) => void;
}

export const SmartBudgetStudio: React.FC<SmartBudgetStudioProps> = ({
  event,
  onUpdateEvent,
  onNotify,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [proposedAmountInput, setProposedAmountInput] = useState<string>('');
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const [expenseModalCategory, setExpenseModalCategory] = useState<BudgetAllocation | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseVendor, setExpenseVendor] = useState('');

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProposal, setOptimizationProposal] =
    useState<BudgetOptimizationProposal | null>(null);

  const [editingCeiling, setEditingCeiling] = useState(false);
  const [ceilingInput, setCeilingInput] = useState(String(event.totalBudget));

  const summary = calculateBudgetSummary(event.totalBudget, event.budgetCategories);

  const handleToggleLock = (categoryId: string) => {
    const nextCategories = event.budgetCategories.map((c) =>
      c.id === categoryId ? { ...c, locked: !c.locked } : c
    );
    const target = nextCategories.find((c) => c.id === categoryId);
    onUpdateEvent({ ...event, budgetCategories: nextCategories });
    if (target) {
      onNotify(
        `${target.category} ${target.locked ? 'locked against changes' : 'unlocked for editing'}.`
      );
    }
  };

  const handleStartEditAllocation = (cat: BudgetAllocation) => {
    setAllocationError(null);
    if (cat.locked) {
      setAllocationError(
        `${cat.category} is locked. Unlock this category first before editing its planned allocation.`
      );
      return;
    }
    setEditingCategoryId(cat.id);
    setProposedAmountInput(String(cat.plannedAmount));
  };

  const handleSaveAllocation = (catId: string) => {
    const numeric = Number(proposedAmountInput);
    const validation = validateCategoryAllocation(
      event.totalBudget,
      event.budgetCategories,
      catId,
      numeric
    );

    if (!validation.valid) {
      setAllocationError(validation.message || 'Invalid allocation.');
      return;
    }

    const nextCategories = event.budgetCategories.map((c) =>
      c.id === catId ? { ...c, plannedAmount: Math.round(numeric) } : c
    );
    onUpdateEvent({ ...event, budgetCategories: nextCategories });
    setEditingCategoryId(null);
    setAllocationError(null);
    onNotify('Updated category budget allocation.');
  };

  const handleSaveTotalCeiling = (e: React.FormEvent) => {
    e.preventDefault();
    const nextCeiling = Math.round(Number(ceilingInput));
    if (Number.isNaN(nextCeiling) || nextCeiling < summary.allocated) {
      setAllocationError(
        `Total budget ceiling cannot be set lower than current allocated sum (${formatCurrency(
          summary.allocated,
          event.currency
        )}). Reduce category allocations first.`
      );
      return;
    }
    setAllocationError(null);
    onUpdateEvent({ ...event, totalBudget: nextCeiling });
    setEditingCeiling(false);
    onNotify(`Updated total budget ceiling to ${formatCurrency(nextCeiling, event.currency)}.`);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseModalCategory) return;
    const amt = Math.round(Number(expenseAmount));
    if (!expenseTitle.trim() || Number.isNaN(amt) || amt <= 0) return;

    const newExpense = {
      id: `exp-${Date.now()}`,
      title: expenseTitle.trim(),
      amount: amt,
      date: new Date().toISOString().slice(0, 10),
      vendorName: expenseVendor.trim() || undefined,
    };

    const nextCategories = event.budgetCategories.map((c) => {
      if (c.id !== expenseModalCategory.id) return c;
      return {
        ...c,
        actualAmount: c.actualAmount + amt,
        expenses: [...c.expenses, newExpense],
      };
    });

    onUpdateEvent({ ...event, budgetCategories: nextCategories });
    setExpenseModalCategory(null);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseVendor('');
    onNotify(`Logged ${formatCurrency(amt, event.currency)} expense in ${expenseModalCategory.category}.`);
  };

  const handleOptimizeWithAI = async () => {
    setIsOptimizing(true);
    setAllocationError(null);
    try {
      const response = await fetch('/api/gemini/optimize-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalBudget: event.totalBudget,
          categories: event.budgetCategories,
          priorities: event.priorities,
          currency: event.currency,
        }),
      });
      const data = await response.json();
      if (data?.proposal && Array.isArray(data.proposal.adjustments)) {
        setOptimizationProposal(data.proposal);
      } else {
        setOptimizationProposal(
          generateDeterministicOptimization(
            event.totalBudget,
            event.budgetCategories,
            event.priorities
          )
        );
      }
    } catch {
      setOptimizationProposal(
        generateDeterministicOptimization(
          event.totalBudget,
          event.budgetCategories,
          event.priorities
        )
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimization = () => {
    if (!optimizationProposal) return;
    const nextCategories = event.budgetCategories.map((cat) => {
      if (cat.locked) return cat;
      const match = optimizationProposal.adjustments.find((a) => a.categoryId === cat.id);
      if (!match) return cat;
      return {
        ...cat,
        plannedAmount: Math.max(0, Math.round(match.afterAmount)),
      };
    });
    onUpdateEvent({ ...event, budgetCategories: nextCategories });
    setOptimizationProposal(null);
    onNotify('Applied AI budget optimization across unlocked categories.');
  };

  return (
    <div className="space-y-8">
      {/* Top Financial Summary Strip */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5F0E8] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
              Smart Budget Studio
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#182C28]">
              Financial Ledger & Allocation Control
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCeilingInput(String(event.totalBudget));
                setEditingCeiling((v) => !v);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-[#182C28] border border-[#D8C9B8] hover:border-[#182C28] rounded-md cursor-pointer"
            >
              Adjust Total Budget
            </button>
            <button
              type="button"
              disabled={isOptimizing}
              onClick={handleOptimizeWithAI}
              className="px-4 py-2 text-xs font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d4aa63] rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Ledger...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Optimize with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {editingCeiling && (
          <form
            onSubmit={handleSaveTotalCeiling}
            className="p-4 bg-[#F5F0E8] rounded-md border border-[#D8C9B8] flex flex-wrap items-center gap-3"
          >
            <label htmlFor="budget-ceiling-input" className="text-xs font-semibold text-[#182C28]">
              Total Event Budget Ceiling ({event.currency}):
            </label>
            <input
              id="budget-ceiling-input"
              type="number"
              min={summary.allocated}
              step={500}
              value={ceilingInput}
              onChange={(e) => setCeilingInput(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#D8C9B8] rounded text-xs font-mono tabular-nums"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#182C28] text-[#F5F0E8] text-xs font-semibold rounded cursor-pointer"
            >
              Save Ceiling
            </button>
            <button
              type="button"
              onClick={() => setEditingCeiling(false)}
              className="px-3 py-1.5 text-xs text-[#292A27]/70 hover:text-[#182C28] cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {/* 4 Core Financial Figures */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 tabular-nums">
          <div className="space-y-1">
            <span className="text-xs text-[#292A27]/70">Total Budget Ceiling</span>
            <p className="font-mono text-2xl sm:text-3xl font-semibold text-[#182C28]">
              {formatCurrency(summary.totalBudget, event.currency)}
            </p>
            <span className="text-xs text-[#292A27]/60">
              Flexibility: {event.budgetFlexibility}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-[#292A27]/70">Allocated across Categories</span>
            <p className="font-mono text-2xl sm:text-3xl font-semibold text-[#182C28]">
              {formatCurrency(summary.allocated, event.currency)}
            </p>
            <span className="text-xs text-[#315B50]">
              {summary.allocatedPercentage}% of total budget
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-[#292A27]/70">Actual Committed Spend</span>
            <p className="font-mono text-2xl sm:text-3xl font-semibold text-[#315B50]">
              {formatCurrency(summary.spent, event.currency)}
            </p>
            <span className="text-xs text-[#292A27]/60">
              {summary.spentPercentage}% disbursed
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-[#292A27]/70">Remaining Unspent</span>
            <p className="font-mono text-2xl sm:text-3xl font-semibold text-[#A34E50]">
              {formatCurrency(summary.remainingToSpend, event.currency)}
            </p>
            <span className="text-xs text-[#292A27]/60">
              Unallocated buffer: {formatCurrency(summary.remainingToAllocate, event.currency)}
            </span>
          </div>
        </div>

        {/* Validation Alert if User Tries to Exceed Budget */}
        {allocationError && (
          <div
            role="alert"
            className="p-3.5 bg-[#A34E50]/10 border border-[#A34E50] rounded-md flex items-center justify-between gap-3 text-xs text-[#A34E50]"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{allocationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAllocationError(null)}
              className="text-xs font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Category Breakdown Table (Desktop) & Structured Cards (Mobile) */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] overflow-hidden">
        <div className="px-6 py-4 bg-[#EAE2D6] border-b border-[#D8C9B8] flex items-center justify-between">
          <h3 className="font-editorial text-xl font-semibold text-[#182C28]">
            Category Allocation & Variance Breakdown
          </h3>
          <span className="text-xs text-[#292A27]/70 tabular-nums">
            {event.budgetCategories.length} Active Categories
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#D8C9B8] bg-[#F5F0E8]/60 text-[#292A27]/75">
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Planned Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Actual Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Variance</th>
                <th className="py-3 px-4 font-semibold text-right">Share (%)</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0E8] tabular-nums">
              {event.budgetCategories.map((cat) => {
                const metrics = calculateCategoryMetrics(cat, event.totalBudget);
                const isEditing = editingCategoryId === cat.id;

                return (
                  <tr key={cat.id} className="hover:bg-[#F5F0E8]/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#182C28]">{cat.category}</span>
                        {cat.locked && (
                          <span className="text-[11px] text-[#292A27]/60">· Locked</span>
                        )}
                      </div>
                      {cat.notes && (
                        <p className="text-xs text-[#292A27]/65 mt-0.5">{cat.notes}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      {isEditing ? (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            aria-label={`Planned allocation for ${cat.category}`}
                            value={proposedAmountInput}
                            onChange={(e) => setProposedAmountInput(e.target.value)}
                            className="w-28 px-2 py-1 bg-white border border-[#182C28] rounded text-right text-xs font-mono"
                          />
                          <button
                            type="button"
                            aria-label="Save allocation"
                            onClick={() => handleSaveAllocation(cat.id)}
                            className="p-1 bg-[#182C28] text-white rounded cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Cancel allocation edit"
                            onClick={() => setEditingCategoryId(null)}
                            className="p-1 bg-[#D8C9B8] text-[#292A27] rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-[#182C28]">
                          {formatCurrency(cat.plannedAmount, event.currency)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#292A27]">
                      {formatCurrency(cat.actualAmount, event.currency)}
                    </td>

                    <td
                      className={`py-3.5 px-4 text-right font-mono font-semibold ${
                        metrics.variance >= 0 ? 'text-[#315B50]' : 'text-[#A34E50]'
                      }`}
                    >
                      {metrics.variance >= 0
                        ? `+${formatCurrency(metrics.variance, event.currency)}`
                        : formatCurrency(metrics.variance, event.currency)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#292A27]/75">
                      {metrics.percentageOfTotal}%
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEditAllocation(cat)}
                          className="px-2.5 py-1 text-xs font-medium text-[#182C28] border border-[#D8C9B8] hover:border-[#182C28] rounded cursor-pointer"
                        >
                          Edit allocation
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseModalCategory(cat)}
                          className="px-2.5 py-1 text-xs font-medium text-[#315B50] border border-[#D8C9B8] hover:border-[#315B50] rounded cursor-pointer"
                        >
                          Add expense
                        </button>
                        <button
                          type="button"
                          aria-label={
                            cat.locked ? `Unlock ${cat.category}` : `Lock ${cat.category}`
                          }
                          onClick={() => handleToggleLock(cat.id)}
                          className={`p-1.5 rounded border cursor-pointer ${
                            cat.locked
                              ? 'bg-[#182C28] text-[#C59A52] border-[#182C28]'
                              : 'bg-white text-[#292A27]/70 border-[#D8C9B8] hover:text-[#182C28]'
                          }`}
                        >
                          {cat.locked ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-[#D8C9B8]">
          {event.budgetCategories.map((cat) => {
            const metrics = calculateCategoryMetrics(cat, event.totalBudget);
            return (
              <div key={cat.id} className="p-4 space-y-3 tabular-nums">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#182C28]">{cat.category}</p>
                    <p className="text-xs text-[#292A27]/65">
                      {metrics.percentageOfTotal}% of total budget {cat.locked ? '· Locked' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleLock(cat.id)}
                    className="text-xs font-semibold text-[#315B50] underline"
                  >
                    {cat.locked ? 'Unlock' : 'Lock'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-[#F5F0E8] p-2.5 rounded">
                  <div>
                    <span className="block text-[10px] text-[#292A27]/60">Planned</span>
                    <span className="font-semibold text-[#182C28]">
                      {formatCurrency(cat.plannedAmount, event.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#292A27]/60">Actual</span>
                    <span>{formatCurrency(cat.actualAmount, event.currency)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#292A27]/60">Variance</span>
                    <span className={metrics.variance >= 0 ? 'text-[#315B50]' : 'text-[#A34E50]'}>
                      {formatCurrency(metrics.variance, event.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEditAllocation(cat)}
                    className="flex-1 py-1.5 text-xs font-semibold text-[#182C28] border border-[#D8C9B8] rounded"
                  >
                    Edit Allocation
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseModalCategory(cat)}
                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-[#182C28] rounded"
                  >
                    Add Expense
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Expense Modal */}
      {expenseModalCategory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-expense-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md bg-[#F5F0E8] border border-[#D8C9B8] rounded-lg overflow-hidden">
            <div className="bg-[#182C28] text-[#F5F0E8] px-5 py-4 flex items-center justify-between">
              <h3 id="add-expense-title" className="font-editorial text-xl font-semibold">
                Log Expense — {expenseModalCategory.category}
              </h3>
              <button
                type="button"
                aria-label="Close expense modal"
                onClick={() => setExpenseModalCategory(null)}
                className="text-[#D8C9B8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddExpenseSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="exp-title" className="block text-xs font-semibold text-[#182C28] mb-1">
                  Expense Description *
                </label>
                <input
                  id="exp-title"
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g., Floral Arch Retainer Payment"
                  className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded text-sm"
                />
              </div>
              <div>
                <label htmlFor="exp-amt" className="block text-xs font-semibold text-[#182C28] mb-1">
                  Amount ({event.currency}) *
                </label>
                <input
                  id="exp-amt"
                  type="number"
                  required
                  min={1}
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="1500"
                  className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="exp-vendor" className="block text-xs font-semibold text-[#182C28] mb-1">
                  Payee / Vendor Name
                </label>
                <input
                  id="exp-vendor"
                  type="text"
                  value={expenseVendor}
                  onChange={(e) => setExpenseVendor(e.target.value)}
                  placeholder="Optional vendor reference"
                  className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded text-sm"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExpenseModalCategory(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#292A27] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#182C28] rounded cursor-pointer"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Before-and-After AI Budget Optimization Comparison Modal */}
      {optimizationProposal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-opt-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-[#F5F0E8] border border-[#D8C9B8] rounded-lg overflow-hidden my-8">
            <div className="bg-[#182C28] text-[#F5F0E8] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C59A52]">
                  GEMINI FINANCIAL REBALANCING
                </p>
                <h3 id="ai-opt-title" className="font-editorial text-2xl font-semibold">
                  Before & After Allocation Comparison
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close optimization modal"
                onClick={() => setOptimizationProposal(null)}
                className="text-[#D8C9B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-white rounded border border-[#D8C9B8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-[#292A27] leading-relaxed">
                  {optimizationProposal.rationale}
                </p>
                <div className="shrink-0 text-right font-mono tabular-nums">
                  <span className="text-[11px] text-[#292A27]/60 block">Reclaimed Buffer</span>
                  <span className="text-lg font-semibold text-[#315B50]">
                    +{formatCurrency(optimizationProposal.estimatedSavings, event.currency)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto bg-white rounded border border-[#D8C9B8]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#D8C9B8] bg-[#EAE2D6]/60 text-[#292A27]/80">
                      <th className="py-2.5 px-3 font-semibold">Category</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Before</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Proposed After</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F0E8] tabular-nums">
                    {optimizationProposal.adjustments.map((adj) => {
                      const delta = adj.afterAmount - adj.beforeAmount;
                      return (
                        <tr key={adj.categoryId}>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-[#182C28]">{adj.categoryName}</p>
                            <p className="text-[11px] text-[#292A27]/65">{adj.reason}</p>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatCurrency(adj.beforeAmount, event.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#182C28]">
                            {formatCurrency(adj.afterAmount, event.currency)}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-semibold ${
                              delta < 0
                                ? 'text-[#315B50]'
                                : delta > 0
                                ? 'text-[#A34E50]'
                                : 'text-[#292A27]/50'
                            }`}
                          >
                            {delta === 0
                              ? 'Unchanged'
                              : formatCurrency(delta, event.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#EAE2D6] border-t border-[#D8C9B8] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOptimizationProposal(null)}
                className="px-4 py-2 text-xs font-semibold text-[#292A27] cursor-pointer"
              >
                Keep Current Allocations
              </button>
              <button
                type="button"
                onClick={handleApplyOptimization}
                className="px-5 py-2 text-xs font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d4aa63] rounded-md cursor-pointer"
              >
                Confirm & Apply Optimization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
