import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Menu,
  Wallet,
  X,
} from 'lucide-react';
import { EventCategory, WorkspaceSection } from '../types/event';
import { CATEGORY_SHOWCASE } from '../data/seedEvents';
import { calculateInstantEstimate, formatCurrency } from '../utils/planningLogic';
import { EditorialVisual } from './EditorialVisuals';

interface MarketingExperienceProps {
  selectedCategory: EventCategory;
  plannerName: string;
  onUpdatePlannerName: (name: string) => void;
  onSelectCategory: (cat: EventCategory) => void;
  onOpenWizard: (
    cat?: EventCategory,
    preset?: { budget?: number; guestCount?: number }
  ) => void;
  onEnterWorkspace: (cat?: EventCategory, section?: WorkspaceSection) => void;
}

export const MarketingExperience: React.FC<MarketingExperienceProps> = ({
  selectedCategory,
  plannerName,
  onUpdatePlannerName,
  onSelectCategory,
  onOpenWizard,
  onEnterWorkspace,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<
    'estimator' | 'budget' | 'timeline' | 'vendors'
  >('estimator');

  // Interactive Budget & Guest Estimator state
  const [estBudget, setEstBudget] = useState<number>(65000);
  const [estGuests, setEstGuests] = useState<number>(120);

  // Sign-In / Quick Studio Switcher modal state
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState(plannerName);

  const activeShowcase = CATEGORY_SHOWCASE[selectedCategory];
  const instantEstimate = calculateInstantEstimate(
    selectedCategory,
    estBudget,
    estGuests
  );

  const handleCategoryChange = (cat: EventCategory) => {
    onSelectCategory(cat);
    if (cat === 'wedding') {
      setEstBudget(85000);
      setEstGuests(140);
    } else if (cat === 'birthday') {
      setEstBudget(18500);
      setEstGuests(65);
    } else {
      setEstBudget(42000);
      setEstGuests(450);
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdatePlannerName(nameInput.trim());
    }
    setSignInModalOpen(false);
    onEnterWorkspace(selectedCategory, 'overview');
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#292A27]">
      {/* 1. HEADER — Strict 3-Zone Top Bar Contract + Mobile Drawer */}
      <header className="sticky top-0 z-40 bg-[#182C28] text-[#F5F0E8] border-b border-[#315B50]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="font-editorial text-2xl font-semibold tracking-tight text-[#F5F0E8] whitespace-nowrap shrink-0"
          >
            ELEGANTIA AI
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Marketing Navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-[#D8C9B8]"
          >
            <a
              href="#discover"
              className="hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0"
            >
              Discover
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0"
            >
              How it works
            </a>
            <a
              href="#features"
              className="hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <button
              type="button"
              onClick={() => {
                setNameInput(plannerName);
                setSignInModalOpen(true);
              }}
              className="hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign in
            </button>
          </nav>

          {/* Zone 3: Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenWizard(selectedCategory)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d3a962] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Create an event
            </button>
            <button
              type="button"
              aria-label={
                mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
              }
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-md text-[#F5F0E8] hover:bg-[#315B50]/40"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#182C28] border-t border-[#315B50]/50 px-4 pt-3 pb-5 space-y-3">
            <a
              href="#discover"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#D8C9B8] hover:text-white"
            >
              Discover
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#D8C9B8] hover:text-white"
            >
              How it works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#D8C9B8] hover:text-white"
            >
              Features
            </a>
            <div className="pt-2 border-t border-[#315B50]/50 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setNameInput(plannerName);
                  setSignInModalOpen(true);
                }}
                className="w-full py-2.5 text-center text-sm font-medium text-[#F5F0E8] border border-[#D8C9B8]/40 rounded-md"
              >
                Sign in to Studio
              </button>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
      {/* 2. EDITORIAL HERO — Split Layout on Deep Evergreen Canvas */}
      <section
        id="top"
        className="bg-[#182C28] text-[#F5F0E8] border-b border-[#315B50]/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Column: Editorial Narrative */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#C59A52]">
                  THE INTELLIGENT EVENT PLANNING STUDIO
                </p>
                <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.08] tracking-tight text-[#F5F0E8]">
                  Bring your celebration to life. We&apos;ll help orchestrate
                  every detail.
                </h1>
                <p className="text-base sm:text-lg text-[#D8C9B8] leading-relaxed max-w-xl">
                  From the first idea to the final celebration, plan beautifully
                  with one intelligent workspace.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onOpenWizard(selectedCategory)}
                    className="px-6 py-3.5 text-sm font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d4aa63] rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Start planning</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace(selectedCategory, 'overview')}
                    className="px-6 py-3.5 text-sm font-semibold text-[#F5F0E8] border border-[#D8C9B8]/40 hover:border-[#F5F0E8] hover:bg-white/5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Explore the experience
                  </button>
                </div>

                {/* Quick 1-Click Studio Launch Bar */}
                <div className="pt-6 border-t border-[#315B50]/60 space-y-2">
                  <p className="text-xs text-[#D8C9B8]">
                    Every detail, thoughtfully planned. Every moment,
                    unforgettable. Jump directly into a live studio:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {(['wedding', 'birthday', 'community'] as EventCategory[]).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => onEnterWorkspace(cat, 'studio')}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-[#12221F] hover:bg-[#315B50]/60 text-[#F5F0E8] border border-[#315B50] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Launch {CATEGORY_SHOWCASE[cat].studioTitle} →
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Art-Directed Visual (Dynamic per Selected Category) */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="relative flex-1 rounded-lg overflow-hidden border border-[#315B50] bg-[#12221F] flex flex-col justify-between">
                <EditorialVisual
                  preset={activeShowcase.visualPreset}
                  aspectRatio="4:3"
                  className="w-full h-full flex-1"
                />
                <div className="p-5 bg-[#12221F] border-t border-[#315B50]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#C59A52] font-medium">
                      {activeShowcase.studioTitle} Direction
                    </p>
                    <p className="font-editorial text-lg text-[#F5F0E8]">
                      {activeShowcase.heroTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace(selectedCategory, 'studio')}
                    className="text-xs font-semibold text-[#C59A52] hover:underline tabular-nums shrink-0 cursor-pointer text-left sm:text-right"
                  >
                    Inspect {activeShowcase.metricsPreview.typicalBudget} Blueprint →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BELOW THE HERO — 1. Interactive Event Category Selector */}
      <section id="discover" className="py-16 lg:py-24 border-b border-[#D8C9B8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#315B50]">
                01. Specialized Planning Modes
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#182C28]">
                Three dedicated studios. One cohesive operating system.
              </h2>
              <p className="text-sm sm:text-base text-[#292A27]/80">
                Select an event category below to inspect how ELEGANTIA AI adapts
                its visual accent, planning questions, suggested milestones, and
                Gemini recommendations.
              </p>
            </div>

            {/* Interactive Segmented Category Control */}
            <div
              role="tablist"
              aria-label="Event Category Studio Selector"
              className="inline-flex p-1.5 bg-[#E6DDD0] rounded-lg border border-[#D8C9B8] self-start overflow-x-auto max-w-full"
            >
              {(['wedding', 'birthday', 'community'] as EventCategory[]).map(
                (cat) => {
                  const info = CATEGORY_SHOWCASE[cat];
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      role="tab"
                      aria-selected={isSelected}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      style={
                        isSelected
                          ? { backgroundColor: info.accentHex, color: '#FFFFFF' }
                          : undefined
                      }
                      className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? 'shadow-sm'
                          : 'text-[#292A27] hover:text-[#182C28] hover:bg-[#F5F0E8]/60'
                      }`}
                    >
                      {info.studioTitle}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Dynamic Category Studio Deep-Dive Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-lg border border-[#D8C9B8] p-6 sm:p-8 lg:p-10">
            {/* Left 5 Cols: Studio Identity, Visual & Entry */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span style={{ color: activeShowcase.accentHex }}>
                    {activeShowcase.studioTitle}
                  </span>
                  <span aria-hidden="true" className="text-[#D8C9B8]">
                    ·
                  </span>
                  <span className="text-[#292A27]/70 tabular-nums">
                    Lead window: {activeShowcase.metricsPreview.averageLeadTime}
                  </span>
                </div>

                <h3 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#182C28]">
                  {activeShowcase.heroTitle}
                </h3>

                <p className="text-sm text-[#292A27]/80 leading-relaxed">
                  {activeShowcase.heroSubtitle}
                </p>

                <EditorialVisual
                  preset={activeShowcase.visualPreset}
                  aspectRatio="16:9"
                  caption={activeShowcase.visualCaption}
                  className="rounded-md border border-[#D8C9B8]"
                />
              </div>

              <div className="pt-4 border-t border-[#F5F0E8] flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onEnterWorkspace(selectedCategory, 'studio')}
                  style={{ backgroundColor: activeShowcase.accentHex }}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white rounded-md hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open {activeShowcase.studioTitle} Workspace
                </button>
                <button
                  type="button"
                  onClick={() => onOpenWizard(selectedCategory)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#182C28] border border-[#D8C9B8] hover:border-[#182C28] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Configure custom {selectedCategory} plan
                </button>
              </div>
            </div>

            {/* Right 7 Cols: Dynamic Questions, Tasks & AI Recommendations */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Column A: Key Planning Questions & Suggested Tasks */}
              <div className="space-y-6">
                <div className="p-5 bg-[#F5F0E8]/70 rounded-md border border-[#D8C9B8]/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#182C28]">
                      Architectural Planning Questions
                    </h4>
                    <button
                      type="button"
                      onClick={() => onEnterWorkspace(selectedCategory, 'copilot')}
                      className="text-[11px] font-semibold text-[#315B50] hover:underline cursor-pointer"
                    >
                      Ask AI Copilot →
                    </button>
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#292A27]">
                    {activeShowcase.planningQuestions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span
                          className="font-mono text-xs font-semibold mt-0.5"
                          style={{ color: activeShowcase.accentHex }}
                        >
                          0{idx + 1}.
                        </span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 bg-[#F5F0E8]/70 rounded-md border border-[#D8C9B8]/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#182C28]">
                      Suggested Studio Milestones
                    </h4>
                    <button
                      type="button"
                      onClick={() => onEnterWorkspace(selectedCategory, 'timeline')}
                      className="text-[11px] font-semibold text-[#315B50] hover:underline cursor-pointer"
                    >
                      Open Timeline →
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {activeShowcase.suggestedTasks.map((task, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onEnterWorkspace(selectedCategory, 'timeline')}
                        className="w-full text-left p-3 bg-white hover:bg-[#FAF6F0] rounded border border-[#D8C9B8]/80 flex items-start justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <p className="text-xs font-medium text-[#292A27] leading-snug">
                          {task.title}
                        </p>
                        <span className="text-[11px] font-mono text-[#315B50] whitespace-nowrap shrink-0">
                          {task.phase}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column B: Live AI Recommendations & Studio Context */}
              <div className="flex flex-col justify-between p-5 bg-[#182C28] text-[#F5F0E8] rounded-md space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#315B50] pb-3">
                    <span className="text-xs font-semibold tracking-wider uppercase text-[#C59A52]">
                      ELEGANTIA AI Intelligence
                    </span>
                    <span className="text-xs text-[#D8C9B8] font-mono tabular-nums">
                      {activeShowcase.accentName}
                    </span>
                  </div>
                  <p className="text-xs text-[#D8C9B8] leading-relaxed">
                    Contextual recommendations generated from real budget ratios,
                    guest counts, and seasonal lead times:
                  </p>
                  <div className="space-y-3">
                    {activeShowcase.aiRecommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded bg-[#12221F] border border-[#315B50]/70 text-xs text-[#F5F0E8] leading-relaxed"
                      >
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#315B50] grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[11px] text-[#D8C9B8]">Target Budget</p>
                    <p className="text-sm font-mono font-semibold text-[#F5F0E8] tabular-nums">
                      {activeShowcase.metricsPreview.typicalBudget}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#D8C9B8]">Lead Window</p>
                    <p className="text-sm font-mono font-semibold text-[#F5F0E8] tabular-nums">
                      {activeShowcase.metricsPreview.averageLeadTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#D8C9B8]">Vendor Categories</p>
                    <p className="text-sm font-mono font-semibold text-[#C59A52] tabular-nums">
                      {activeShowcase.metricsPreview.coreVendors} Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS — Numbered Editorial Architecture */}
      <section
        id="how-it-works"
        className="py-16 lg:py-24 bg-[#EFE8DC] border-b border-[#D8C9B8]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#315B50]">
              02. Operational Workflow
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#182C28]">
              From blank canvas to run-of-show in four deliberate phases.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '01.',
                title: 'Define Parameters & Priorities',
                desc: 'Capture guest count, venue architecture, currency, total budget, and aesthetic direction in our structured 5-step studio intake.',
                metric: '90-second structured setup',
                actionLabel: 'Launch Wizard →',
                onClick: () => onOpenWizard(selectedCategory),
              },
              {
                num: '02.',
                title: 'Generate Deterministic Plan',
                desc: 'Gemini synthesizes category allocations, backward-scheduled milestones, and vendor briefs without exceeding your ceiling.',
                metric: 'Zero silent budget overflow',
                actionLabel: 'Try Budget Studio →',
                onClick: () => onEnterWorkspace(selectedCategory, 'budget'),
              },
              {
                num: '03.',
                title: 'Coordinate Vendors & Dates',
                desc: 'Compare vendor quotations side by side, lock contracted categories, and shift event dates with automatic milestone recalculation.',
                metric: 'Automatic date propagation',
                actionLabel: 'Compare Vendors →',
                onClick: () => onEnterWorkspace(selectedCategory, 'vendors'),
              },
              {
                num: '04.',
                title: 'Sync Calendars & Execute',
                desc: 'Export RFC-5545 .ics schedules for your team, track RSVPs and dietary notes, and run day-of cues from any device.',
                metric: '1-click .ics & Google Calendar sync',
                actionLabel: 'Open Calendar Sync →',
                onClick: () => onEnterWorkspace(selectedCategory, 'guests'),
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-[#F5F0E8] border border-[#D8C9B8] rounded-lg p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <span className="font-mono text-sm font-semibold text-[#A34E50]">
                    {step.num}
                  </span>
                  <h3 className="font-editorial text-xl font-semibold text-[#182C28]">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#292A27]/80 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#D8C9B8] flex items-center justify-between text-xs">
                  <span className="font-medium text-[#315B50]">{step.metric}</span>
                  <button
                    type="button"
                    onClick={step.onClick}
                    className="font-semibold text-[#182C28] hover:text-[#A34E50] cursor-pointer"
                  >
                    {step.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AI PLANNING CAPABILITIES & INTERACTIVE LIVE WORKSPACE SANDBOX */}
      <section id="features" className="py-16 lg:py-24 border-b border-[#D8C9B8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#315B50]">
              03. Core Capabilities & Interactive Sandbox
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#182C28]">
              Engineered for financial precision and creative clarity.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-[#D8C9B8] rounded-lg p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#A34E50]">
                  <Wallet className="w-4 h-4" />
                  <span>Smart Budget Studio</span>
                </div>
                <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
                  Deterministic ledger with locked-category guardrails and AI
                  before/after rebalancing.
                </h3>
                <p className="text-sm text-[#292A27]/80 max-w-2xl leading-relaxed">
                  Lock signed venue or photography contracts so their allocations
                  never drift. When you trigger AI Optimization, ELEGANTIA AI
                  proposes line-by-line adjustments with a transparent
                  before-and-after variance table before you commit a single
                  dollar.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#F5F0E8] font-mono text-xs tabular-nums">
                <div>
                  <span className="text-[#292A27]/60 block">Planned Ceiling</span>
                  <span className="text-base font-semibold text-[#182C28]">
                    $85,000
                  </span>
                </div>
                <div>
                  <span className="text-[#292A27]/60 block">Locked Contracts</span>
                  <span className="text-base font-semibold text-[#315B50]">
                    $37,500
                  </span>
                </div>
                <div>
                  <span className="text-[#292A27]/60 block">AI Reclaimed Buffer</span>
                  <span className="text-base font-semibold text-[#A34E50]">
                    +$3,450
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#182C28] text-[#F5F0E8] rounded-lg p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#C59A52]">
                  <Calendar className="w-4 h-4" />
                  <span>Dynamic Timeline Engine</span>
                </div>
                <h3 className="font-editorial text-2xl font-semibold text-[#F5F0E8]">
                  Change your event date once. Every milestone recalculates
                  immediately.
                </h3>
                <p className="text-sm text-[#D8C9B8] leading-relaxed">
                  Milestones are anchored by lead-time offsets. Moving a wedding
                  or community summit date automatically updates every vendor
                  deadline and overdue status.
                </p>
              </div>
              <div className="pt-4 border-t border-[#315B50] text-xs text-[#D8C9B8] flex items-center justify-between">
                <span>Calendar Export</span>
                <span className="font-mono text-[#C59A52]">
                  RFC 5545 .ICS + Google
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Application Sandbox & Live Calculator */}
          <div className="bg-white border border-[#D8C9B8] rounded-lg overflow-hidden">
            <div className="bg-[#182C28] text-[#F5F0E8] px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#C59A52] font-semibold uppercase tracking-wider">
                  Interactive Studio Sandbox
                </p>
                <p className="text-sm text-[#D8C9B8]">
                  Test the live budget calculator or inspect operational workspace tables directly.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1 bg-[#12221F] p-1 rounded-md border border-[#315B50]">
                {(
                  [
                    { id: 'estimator', label: 'Interactive Budget Calculator' },
                    { id: 'budget', label: 'Smart Budget Ledger' },
                    { id: 'timeline', label: 'Chronological Timeline' },
                    { id: 'vendors', label: 'Vendor Quotations' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPreviewTab(t.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      previewTab === t.id
                        ? 'bg-[#C59A52] text-[#182C28] font-semibold'
                        : 'text-[#D8C9B8] hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {previewTab === 'estimator' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-6 bg-[#F5F0E8] p-6 rounded-lg border border-[#D8C9B8]">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
                        {activeShowcase.studioTitle} Estimator
                      </span>
                      <h4 className="font-editorial text-2xl font-semibold text-[#182C28]">
                        Simulate Your Allocation
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1.5 tabular-nums">
                          <label htmlFor="calc-budget">Total Event Budget</label>
                          <span className="font-mono text-[#182C28]">
                            {formatCurrency(estBudget, 'USD')}
                          </span>
                        </div>
                        <input
                          id="calc-budget"
                          type="range"
                          min={5000}
                          max={200000}
                          step={2500}
                          value={estBudget}
                          onChange={(e) => setEstBudget(Number(e.target.value))}
                          className="w-full accent-[#182C28] cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1.5 tabular-nums">
                          <label htmlFor="calc-guests">Estimated Guest Count</label>
                          <span className="font-mono text-[#182C28]">
                            {estGuests} Guests
                          </span>
                        </div>
                        <input
                          id="calc-guests"
                          type="range"
                          min={20}
                          max={500}
                          step={5}
                          value={estGuests}
                          onChange={(e) => setEstGuests(Number(e.target.value))}
                          className="w-full accent-[#182C28] cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#D8C9B8] flex items-center justify-between text-xs tabular-nums">
                      <span className="text-[#292A27]/75">Estimated Investment per Guest:</span>
                      <span className="font-mono text-base font-semibold text-[#A34E50]">
                        {formatCurrency(instantEstimate.perGuestCost, 'USD')} / guest
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenWizard(selectedCategory, {
                          budget: estBudget,
                          guestCount: estGuests,
                        })
                      }
                      className="w-full py-3 bg-[#182C28] hover:bg-[#243f39] text-[#F5F0E8] text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      Build Custom Plan with {formatCurrency(estBudget, 'USD')} & {estGuests} Guests →
                    </button>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-editorial text-xl font-semibold text-[#182C28]">
                        Recommended Category Breakdown ({activeShowcase.studioTitle})
                      </h4>
                      <span className="text-xs font-mono text-[#315B50] tabular-nums">
                        100% Allocated
                      </span>
                    </div>

                    <div className="space-y-3 tabular-nums">
                      {instantEstimate.allocations.map((alloc) => (
                        <div
                          key={alloc.label}
                          className="p-3.5 rounded-md border border-[#D8C9B8] bg-[#F5F0E8]/40 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-semibold text-[#182C28]">
                              {alloc.label}
                            </span>
                            <div className="font-mono">
                              <span className="text-[#292A27]/60 mr-2">
                                ({alloc.sharePercent}%)
                              </span>
                              <span className="font-semibold text-[#182C28]">
                                {formatCurrency(alloc.amount, 'USD')}
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-[#EAE2D6] rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${alloc.sharePercent}%`,
                                backgroundColor: activeShowcase.accentHex,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {previewTab === 'budget' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-[#D8C9B8] text-[#292A27]/70">
                          <th className="py-2.5 pr-4 font-semibold">Category</th>
                          <th className="py-2.5 px-4 font-semibold text-right">
                            Planned
                          </th>
                          <th className="py-2.5 px-4 font-semibold text-right">
                            Actual
                          </th>
                          <th className="py-2.5 px-4 font-semibold text-right">
                            Variance
                          </th>
                          <th className="py-2.5 pl-4 font-semibold">State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F0E8] tabular-nums">
                        <tr>
                          <td className="py-3 pr-4 font-medium text-[#182C28]">
                            Venue & Orangerie Exclusivity
                          </td>
                          <td className="py-3 px-4 text-right font-mono">$28,000</td>
                          <td className="py-3 px-4 text-right font-mono">$28,000</td>
                          <td className="py-3 px-4 text-right font-mono text-[#315B50]">
                            $0
                          </td>
                          <td className="py-3 pl-4 text-xs text-[#292A27]/70">
                            Locked Contract
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-[#182C28]">
                            Culinary, Wine & Aperitivo
                          </td>
                          <td className="py-3 px-4 text-right font-mono">$24,500</td>
                          <td className="py-3 px-4 text-right font-mono">$19,200</td>
                          <td className="py-3 px-4 text-right font-mono text-[#315B50]">
                            +$5,300
                          </td>
                          <td className="py-3 pl-4 text-xs text-[#315B50]">
                            Retainer Paid
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-[#182C28]">
                            Floral Scenography & Candlelight
                          </td>
                          <td className="py-3 px-4 text-right font-mono">$12,500</td>
                          <td className="py-3 px-4 text-right font-mono">$8,400</td>
                          <td className="py-3 px-4 text-right font-mono text-[#315B50]">
                            +$4,100
                          </td>
                          <td className="py-3 pl-4 text-xs text-[#A34E50]">
                            AI Optimizable
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onEnterWorkspace(selectedCategory, 'budget')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#182C28] rounded cursor-pointer"
                    >
                      Open Interactive Budget Studio →
                    </button>
                  </div>
                </div>
              )}

              {previewTab === 'timeline' && (
                <div className="space-y-3">
                  {[
                    {
                      title:
                        'Lock final Orangerie floorplan & rain-plan heating layout',
                      due: '2026-10-25',
                      status: 'Overdue · High Priority',
                      assignee: 'Clara Vance',
                    },
                    {
                      title:
                        'Submit guest dietary & allergen matrix to Osteria Valenti',
                      due: '2026-11-14',
                      status: 'In Progress · High Priority',
                      assignee: 'Aurelia Laurent',
                    },
                    {
                      title:
                        'Conduct twilight lighting & acoustic walkthrough on site',
                      due: '2026-11-28',
                      status: 'Upcoming · 14 Days Out',
                      assignee: 'Clara Vance',
                    },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded border border-[#D8C9B8] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#182C28]">
                          {m.title}
                        </p>
                        <p className="text-xs text-[#292A27]/70">
                          {m.status} · Assigned to {m.assignee}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-[#315B50] tabular-nums">
                        {m.due}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => onEnterWorkspace(selectedCategory, 'timeline')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#182C28] rounded cursor-pointer"
                    >
                      Manage Full Timeline →
                    </button>
                  </div>
                </div>
              )}

              {previewTab === 'vendors' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded border border-[#D8C9B8] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#182C28]">
                          Atelier Botanica Floral Studio
                        </span>
                        <span className="font-mono text-sm font-semibold text-[#315B50] tabular-nums">
                          $12,500
                        </span>
                      </div>
                      <p className="text-xs text-[#292A27]/70">
                        Contracted · Deposit Paid · Includes post-ceremony table flip
                      </p>
                    </div>
                    <div className="p-4 rounded border border-[#D8C9B8] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#182C28]">
                          Maison Flora Scenography
                        </span>
                        <span className="font-mono text-sm font-semibold text-[#A34E50] tabular-nums">
                          $15,800
                        </span>
                      </div>
                      <p className="text-xs text-[#292A27]/70">
                        Comparison Quote (+$3,300 spread) · Unpaid
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onEnterWorkspace(selectedCategory, 'vendors')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#182C28] rounded cursor-pointer"
                    >
                      Compare Vendor Quotes in Studio →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-16 lg:py-24 bg-[#182C28] text-[#F5F0E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#C59A52] uppercase">
            ELEGANTIA AI STUDIO
          </p>
          <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#F5F0E8]">
            Every detail, thoughtfully planned. Every moment, unforgettable.
          </h2>
          <p className="text-sm sm:text-base text-[#D8C9B8] max-w-xl mx-auto">
            Launch the 5-step creation wizard to generate a custom Gemini-backed
            event workspace, or step directly into our live studios.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onOpenWizard(selectedCategory)}
              className="px-6 py-3.5 text-sm font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d3a962] rounded-md transition-colors cursor-pointer"
            >
              Start planning now
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace(selectedCategory, 'overview')}
              className="px-6 py-3.5 text-sm font-semibold text-[#F5F0E8] border border-[#D8C9B8]/40 hover:border-[#F5F0E8] rounded-md transition-colors cursor-pointer"
            >
              Open Live Workspace
            </button>
          </div>
        </div>
      </section>
      </main>

      {/* 7. QUIET FOOTER */}
      <footer className="bg-[#12221F] text-[#D8C9B8] py-10 border-t border-[#315B50]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-editorial text-lg font-semibold text-[#F5F0E8]">
              ELEGANTIA AI
            </span>
            <span aria-hidden="true">·</span>
            <span>Intelligent Event Planning & Operations Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onEnterWorkspace('wedding', 'studio')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Wedding Studio
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('birthday', 'studio')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Birthday Studio
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('community', 'studio')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Community Studio
            </button>
          </div>
        </div>
      </footer>

      {/* Sign In & Studio Access Modal */}
      {signInModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
        >
          <div className="w-full max-w-md bg-[#F5F0E8] border border-[#D8C9B8] rounded-lg overflow-hidden">
            <div className="bg-[#182C28] text-[#F5F0E8] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C59A52]">
                  ELEGANTIA AI ACCESS
                </p>
                <h3 id="signin-modal-title" className="font-editorial text-2xl font-semibold">
                  Enter Your Planning Studio
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close sign in modal"
                onClick={() => setSignInModalOpen(false)}
                className="text-[#D8C9B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSignInSubmit} className="p-6 space-y-5">
              <div>
                <label
                  htmlFor="planner-name-input"
                  className="block text-xs font-semibold text-[#182C28] mb-1.5"
                >
                  Your Name / Planner Profile
                </label>
                <input
                  id="planner-name-input"
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Clara Vance"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm focus:outline-none focus:border-[#182C28]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#182C28]">
                  Or jump directly into a pre-loaded studio:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['wedding', 'birthday', 'community'] as EventCategory[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (nameInput.trim()) onUpdatePlannerName(nameInput.trim());
                          setSignInModalOpen(false);
                          onEnterWorkspace(cat, 'studio');
                        }}
                        className="p-2.5 text-xs font-semibold bg-white hover:bg-[#EAE2D6] border border-[#D8C9B8] rounded text-center text-[#182C28] cursor-pointer"
                      >
                        {CATEGORY_SHOWCASE[cat].studioTitle}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSignInModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#292A27] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d3a962] rounded-md cursor-pointer"
                >
                  Continue to Dashboard →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
