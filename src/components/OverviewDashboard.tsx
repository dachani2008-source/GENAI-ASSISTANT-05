import React from 'react';
import { Check, Download, Sparkles } from 'lucide-react';
import {
  EventCategory,
  EventWorkspace,
  WorkspaceSection,
} from '../types/event';
import { CATEGORY_SHOWCASE } from '../data/seedEvents';
import { BudgetSummary, formatCurrency } from '../utils/planningLogic';
import { EditorialVisual } from './EditorialVisuals';

interface OverviewDashboardProps {
  activeEvent: EventWorkspace;
  plannerName: string;
  eventAccentHex: string;
  studioTitle: string;
  daysUntil: number;
  planningProgress: number;
  budgetSummary: BudgetSummary;
  onSwitchCategoryStudio: (cat: EventCategory) => void;
  onNavigate: (section: WorkspaceSection) => void;
  onQuickExportICS: () => void;
  onOpenCopilotDrawer: () => void;
  onToggleMilestone: (milestoneId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = React.memo(
  ({
    activeEvent,
    plannerName,
    eventAccentHex,
    studioTitle,
    daysUntil,
    planningProgress,
    budgetSummary,
    onSwitchCategoryStudio,
    onNavigate,
    onQuickExportICS,
    onOpenCopilotDrawer,
    onToggleMilestone,
  }) => {
    return (
      <div className="space-y-8">
        {/* Section 1: Personalized Greeting & Event Identity + Category Mode Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span style={{ color: eventAccentHex }}>
                {studioTitle.toUpperCase()}
              </span>
              <span aria-hidden="true" className="text-[#292A27]/40">
                ·
              </span>
              <span className="text-[#292A27]/70">
                Welcome back, {plannerName} — Every detail is on schedule
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#182C28]">
              {activeEvent.name}
            </h1>
          </div>

          {/* Quick Studio Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            <div
              role="group"
              aria-label="Switch active studio mode"
              className="inline-flex p-1 bg-[#EAE2D6] rounded-md border border-[#D8C9B8] overflow-x-auto max-w-full"
            >
              {(['wedding', 'birthday', 'community'] as EventCategory[]).map(
                (cat) => {
                  const active = activeEvent.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSwitchCategoryStudio(cat)}
                      style={
                        active
                          ? {
                              backgroundColor: CATEGORY_SHOWCASE[cat].accentHex,
                              color: '#FFFFFF',
                            }
                          : undefined
                      }
                      className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active ? '' : 'text-[#292A27] hover:text-[#182C28]'
                      }`}
                    >
                      {CATEGORY_SHOWCASE[cat].studioTitle}
                    </button>
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#182C28] hover:bg-[#243f39] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open {studioTitle} →
            </button>
          </div>
        </div>

        {/* 1-Click Quick Operational Actions Bar */}
        <div className="bg-white rounded-lg border border-[#D8C9B8] p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
            Quick Studio Actions
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('budget')}
              className="px-3 py-1.5 text-xs font-semibold text-[#182C28] bg-[#F5F0E8] hover:bg-[#EAE2D6] border border-[#D8C9B8] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              + Log Expense / Optimize Budget
            </button>
            <button
              type="button"
              onClick={() => onNavigate('timeline')}
              className="px-3 py-1.5 text-xs font-semibold text-[#182C28] bg-[#F5F0E8] hover:bg-[#EAE2D6] border border-[#D8C9B8] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              + Add Milestone
            </button>
            <button
              type="button"
              onClick={() => onNavigate('vendors')}
              className="px-3 py-1.5 text-xs font-semibold text-[#182C28] bg-[#F5F0E8] hover:bg-[#EAE2D6] border border-[#D8C9B8] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              + Compare Vendors
            </button>
            <button
              type="button"
              onClick={onQuickExportICS}
              className="px-3 py-1.5 text-xs font-semibold text-[#315B50] bg-[#F5F0E8] hover:bg-[#EAE2D6] border border-[#D8C9B8] rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .ICS Calendar</span>
            </button>
            <button
              type="button"
              onClick={onOpenCopilotDrawer}
              className="px-3 py-1.5 text-xs font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d3a962] rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask ELEGANTIA AI</span>
            </button>
          </div>
        </div>

        {/* Section 2: Prominent Event Overview (Cover, Title, Location, Date, Countdown, Progress) */}
        <div className="bg-white rounded-lg border border-[#D8C9B8] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5">
              <EditorialVisual
                preset={activeEvent.coverVisualPreset}
                aspectRatio="4:3"
                caption={activeEvent.venueType}
                className="w-full h-full"
              />
            </div>

            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#292A27]/75">
                  <span className="font-semibold text-[#182C28]">
                    {activeEvent.location}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {activeEvent.date}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {activeEvent.guestCount} Guests
                  </span>
                </div>

                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#182C28]">
                  {activeEvent.theme}
                </h2>

                <p className="text-xs sm:text-sm text-[#292A27]/80 leading-relaxed">
                  {activeEvent.style} — {activeEvent.foodPreference}.
                </p>
              </div>

              {/* Countdown & Planning Progress Bar */}
              <div className="space-y-4 pt-4 border-t border-[#F5F0E8] tabular-nums">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-[#292A27]/65 block">
                      Countdown
                    </span>
                    <span
                      className="font-mono text-xl sm:text-2xl font-semibold"
                      style={{ color: eventAccentHex }}
                    >
                      {daysUntil} Days
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#292A27]/65 block">
                      Planning Progress
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-semibold text-[#182C28]">
                      {planningProgress}%
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#292A27]/65 block">
                      Remaining Budget
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-semibold text-[#315B50]">
                      {formatCurrency(
                        budgetSummary.remainingToSpend,
                        activeEvent.currency
                      )}
                    </span>
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={planningProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall planning completion progress"
                  className="w-full h-2 bg-[#EAE2D6] rounded-full overflow-hidden"
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.max(15, planningProgress)}%`,
                      backgroundColor: eventAccentHex,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Balanced Operational Workspace (Budget, Tasks, Vendors, Guests, AI Recommendations) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns: Budget Summary & Interactive Upcoming Tasks */}
          <div className="lg:col-span-7 space-y-6">
            {/* Budget Summary */}
            <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F5F0E8] pb-3">
                <div>
                  <h3 className="font-editorial text-xl font-semibold text-[#182C28]">
                    Budget Summary
                  </h3>
                  <p className="text-xs text-[#292A27]/65">
                    Total Ceiling:{' '}
                    {formatCurrency(
                      budgetSummary.totalBudget,
                      activeEvent.currency
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('budget')}
                  className="text-xs font-semibold text-[#315B50] hover:underline cursor-pointer"
                >
                  Open Budget Studio →
                </button>
              </div>

              <div className="divide-y divide-[#F5F0E8] text-xs sm:text-sm tabular-nums">
                {activeEvent.budgetCategories.slice(0, 4).map((cat) => (
                  <div
                    key={cat.id}
                    className="py-2.5 flex items-center justify-between gap-4"
                  >
                    <span className="font-medium text-[#182C28] truncate">
                      {cat.category}
                    </span>
                    <div className="font-mono text-xs shrink-0">
                      <span className="text-[#292A27]/65">
                        {formatCurrency(cat.actualAmount, activeEvent.currency)}{' '}
                        /{' '}
                      </span>
                      <span className="font-semibold text-[#182C28]">
                        {formatCurrency(
                          cat.plannedAmount,
                          activeEvent.currency
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Upcoming Tasks */}
            <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F5F0E8] pb-3">
                <div>
                  <h3 className="font-editorial text-xl font-semibold text-[#182C28]">
                    Upcoming & Priority Milestones
                  </h3>
                  <p className="text-xs text-[#292A27]/65">
                    Click any milestone checkbox to mark complete and update
                    progress
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('timeline')}
                  className="text-xs font-semibold text-[#315B50] hover:underline cursor-pointer"
                >
                  Open Timeline →
                </button>
              </div>

              <div className="space-y-2.5">
                {activeEvent.milestones.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded bg-[#F5F0E8]/70 border border-[#D8C9B8]/70 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        aria-label={
                          m.status === 'Completed'
                            ? `Mark "${m.title}" incomplete`
                            : `Complete "${m.title}"`
                        }
                        onClick={() => onToggleMilestone(m.id)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                          m.status === 'Completed'
                            ? 'bg-[#315B50] border-[#315B50] text-white'
                            : 'bg-white border-[#D8C9B8] hover:border-[#182C28]'
                        }`}
                      >
                        {m.status === 'Completed' && (
                          <Check className="w-3 h-3" />
                        )}
                      </button>
                      <div>
                        <p
                          className={`text-xs sm:text-sm font-medium ${
                            m.status === 'Completed'
                              ? 'line-through text-[#292A27]/50'
                              : 'text-[#182C28]'
                          }`}
                        >
                          {m.title}
                        </p>
                        <p className="text-xs text-[#292A27]/65">
                          {m.status} · {m.priority} Priority · {m.assignee}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#315B50] tabular-nums shrink-0">
                      {m.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: AI Recommendations, Vendor Progress & Guest Statistics */}
          <div className="lg:col-span-5 space-y-6">
            {/* AI Recommendations */}
            <div className="bg-[#182C28] text-[#F5F0E8] rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#315B50] pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#C59A52]">
                  ELEGANTIA AI Recommendations
                </span>
                <button
                  type="button"
                  onClick={onOpenCopilotDrawer}
                  className="text-xs text-[#D8C9B8] hover:text-white underline cursor-pointer"
                >
                  Ask Copilot →
                </button>
              </div>
              <div className="space-y-3">
                {activeEvent.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded bg-[#12221F] border border-[#315B50] text-xs text-[#F5F0E8] leading-relaxed"
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor Progress & Guest Statistics */}
            <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-5 tabular-nums">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-editorial text-xl font-semibold text-[#182C28]">
                    Vendor Progress
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigate('vendors')}
                    className="text-xs font-semibold text-[#315B50] hover:underline cursor-pointer"
                  >
                    Manage Vendors →
                  </button>
                </div>
                <p className="text-xs text-[#292A27]/75">
                  <strong className="text-[#182C28]">
                    {
                      activeEvent.vendors.filter(
                        (v) => v.bookingStatus === 'Contracted'
                      ).length
                    }
                  </strong>{' '}
                  contracted out of {activeEvent.vendors.length} shortlisted
                  vendors.
                </p>
              </div>

              <div className="pt-4 border-t border-[#F5F0E8] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-editorial text-xl font-semibold text-[#182C28]">
                    Guest & Calendar Sync
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigate('guests')}
                    className="text-xs font-semibold text-[#315B50] hover:underline cursor-pointer"
                  >
                    RSVPs & .ICS →
                  </button>
                </div>
                <p className="text-xs text-[#292A27]/75">
                  Target capacity:{' '}
                  <strong className="text-[#182C28]">
                    {activeEvent.guestCount}
                  </strong>{' '}
                  guests · Calendar feed{' '}
                  <strong className="text-[#315B50]">
                    {activeEvent.calendarSynced
                      ? 'Synchronized'
                      : 'Ready to Export'}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
