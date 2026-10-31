import React, { useState } from 'react';
import { Check, Loader2, Send, Sparkles } from 'lucide-react';
import { EventWorkspace } from '../types/event';
import { calculateBudgetSummary, recalculateMilestoneDates } from '../utils/planningLogic';

interface AICopilotPanelProps {
  event: EventWorkspace;
  onUpdateEvent: (updated: EventWorkspace) => void;
  onNotify: (msg: string) => void;
}

interface CopilotExchange {
  id: string;
  userPrompt: string;
  reply: string;
  bulletPoints: string[];
  proposedAction?: {
    type: string;
    title: string;
    summary: string;
    impactDetail: string;
    applied?: boolean;
  };
}

const CONTEXTUAL_PROMPTS = [
  {
    category: 'Budget',
    prompt: 'Find ways to reduce spending.',
  },
  {
    category: 'Timeline',
    prompt: 'What should I complete this week?',
  },
  {
    category: 'Vendors',
    prompt: 'Which bookings need attention?',
  },
  {
    category: 'Ideas',
    prompt: 'Suggest a theme for my celebration.',
  },
];

export const AICopilotPanel: React.FC<AICopilotPanelProps> = ({
  event,
  onUpdateEvent,
  onNotify,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const summary = calculateBudgetSummary(event.totalBudget, event.budgetCategories);

  const [history, setHistory] = useState<CopilotExchange[]>([
    {
      id: 'init-1',
      userPrompt: 'Executive Readiness Audit',
      reply: `Connected to ${event.name} (${event.category.toUpperCase()} STUDIO). Your total budget ceiling is ${event.currency} ${event.totalBudget.toLocaleString()} with ${event.currency} ${summary.allocated.toLocaleString()} allocated and ${event.milestones.filter((m) => m.status === 'Overdue').length} overdue milestone(s). Select any contextual action below or ask a specific planning question.`,
      bulletPoints: event.recommendations,
    },
  ]);

  const runCopilotQuery = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;
    setIsLoading(true);

    const overdueCount = event.milestones.filter((m) => m.status === 'Overdue').length;
    const nextMs = event.milestones.find((m) => m.status !== 'Completed');
    const pendingVendors = event.vendors
      .filter((v) => v.bookingStatus !== 'Contracted')
      .map((v) => v.name);

    try {
      const response = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          eventContext: {
            name: event.name,
            category: event.category,
            date: event.date,
            location: event.location,
            guestCount: event.guestCount,
            currency: event.currency,
            totalBudget: event.totalBudget,
            allocated: summary.allocated,
            spent: summary.spent,
            theme: event.theme,
            overdueCount,
            nextMilestoneTitle: nextMs?.title,
            pendingVendorNames: pendingVendors,
          },
        }),
      });
      const data = await response.json();
      const entry: CopilotExchange = {
        id: `cop-${Date.now()}`,
        userPrompt: promptText,
        reply: data.reply || 'Here is our analysis based on your active event data.',
        bulletPoints: Array.isArray(data.bulletPoints) ? data.bulletPoints : [],
        proposedAction: data.proposedAction?.title ? data.proposedAction : undefined,
      };
      setHistory((prev) => [entry, ...prev]);
      setInputPrompt('');
    } catch {
      onNotify('Unable to reach AI Copilot endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  // Require explicit confirmation before applying proposed modifications
  const handleConfirmAction = (exchangeId: string) => {
    const target = history.find((h) => h.id === exchangeId);
    if (!target || !target.proposedAction || target.proposedAction.applied) return;

    const actionType = target.proposedAction.type;
    if (actionType === 'budget_rebalance') {
      const updatedCategories = event.budgetCategories.map((c) => {
        if (c.locked) return c;
        const buffer = Math.max(0, c.plannedAmount - c.actualAmount);
        const trim = Math.round(buffer * 0.12);
        return { ...c, plannedAmount: Math.max(c.actualAmount, c.plannedAmount - trim) };
      });
      onUpdateEvent({ ...event, budgetCategories: updatedCategories });
      onNotify('Confirmed & applied Copilot budget contingency trim.');
    } else if (actionType === 'add_milestone') {
      const newMs = {
        id: `ms-cop-${Date.now()}`,
        title: target.proposedAction.title,
        dueDate: event.date,
        daysBeforeEvent: 14,
        priority: 'High' as const,
        status: 'Upcoming' as const,
        assignee: 'Lead Coordinator',
        phase: 'Copilot Action',
      };
      const recalc = recalculateMilestoneDates(
        [...event.milestones, newMs],
        event.date,
        event.date
      );
      onUpdateEvent({ ...event, milestones: recalc });
      onNotify(`Confirmed & added milestone: "${target.proposedAction.title}".`);
    } else {
      onUpdateEvent({
        ...event,
        theme: 'Candlelit Architectural Editorial & Taper Scenography',
      });
      onNotify('Confirmed & updated event theme direction.');
    }

    setHistory((prev) =>
      prev.map((h) =>
        h.id === exchangeId && h.proposedAction
          ? { ...h, proposedAction: { ...h.proposedAction, applied: true } }
          : h
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-5">
        <div className="border-b border-[#F5F0E8] pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
            Contextual AI Copilot
          </p>
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#182C28]">
            Event Intelligence Grounded in Your Live Ledger & Schedule
          </h2>
          <p className="text-xs sm:text-sm text-[#292A27]/75 mt-1">
            Select a contextual action below or ask a question. Important modifications always require your explicit confirmation before changing workspace data.
          </p>
        </div>

        {/* 4 Required Contextual AI Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CONTEXTUAL_PROMPTS.map((item) => (
            <button
              key={item.category}
              type="button"
              disabled={isLoading}
              onClick={() => runCopilotQuery(item.prompt)}
              className="p-3.5 text-left rounded-md bg-[#F5F0E8] hover:bg-[#EAE2D6] border border-[#D8C9B8] transition-colors flex flex-col justify-between space-y-2 cursor-pointer"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A34E50]">
                {item.category}
              </span>
              <span className="text-xs font-semibold text-[#182C28] leading-snug">
                &ldquo;{item.prompt}&rdquo;
              </span>
            </button>
          ))}
        </div>

        {/* Custom Prompt Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runCopilotQuery(inputPrompt);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            aria-label="Ask ELEGANTIA AI Copilot a question about your event"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={`Ask about ${event.name} budget, timeline, vendors, or theme...`}
            className="flex-1 px-4 py-2.5 bg-[#F5F0E8] border border-[#D8C9B8] rounded-md text-xs sm:text-sm focus:outline-none focus:border-[#182C28]"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-5 py-2.5 bg-[#182C28] text-[#F5F0E8] text-xs sm:text-sm font-semibold rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Ask Copilot</span>
          </button>
        </form>
      </div>

      {/* Copilot Response Stream */}
      <div className="space-y-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#F5F0E8] pb-3">
              <span className="text-xs font-semibold text-[#A34E50]">
                Query: &ldquo;{item.userPrompt}&rdquo;
              </span>
              <span className="text-[11px] text-[#292A27]/60 font-mono">
                Context: {event.name}
              </span>
            </div>

            <p className="text-sm text-[#182C28] leading-relaxed">{item.reply}</p>

            {item.bulletPoints.length > 0 && (
              <ul className="space-y-2 text-xs sm:text-sm text-[#292A27]/85 pl-4 list-disc">
                {item.bulletPoints.map((bp, idx) => (
                  <li key={idx}>{bp}</li>
                ))}
              </ul>
            )}

            {/* Confirmation Card for Proposed Modifications */}
            {item.proposedAction && (
              <div className="p-4 rounded-md bg-[#182C28] text-[#F5F0E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C59A52]">
                    Proposed Workspace Modification (Requires Confirmation)
                  </p>
                  <p className="text-sm font-semibold">{item.proposedAction.title}</p>
                  <p className="text-xs text-[#D8C9B8]">{item.proposedAction.summary}</p>
                </div>

                {item.proposedAction.applied ? (
                  <span className="px-4 py-2 bg-[#315B50] text-white text-xs font-semibold rounded flex items-center gap-1.5 shrink-0">
                    <Check className="w-4 h-4" />
                    <span>Modification Applied</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmAction(item.id)}
                    className="px-4 py-2 bg-[#C59A52] hover:bg-[#d3a962] text-[#182C28] text-xs font-semibold rounded shrink-0 cursor-pointer"
                  >
                    Confirm & Apply Change
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
