import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, X } from 'lucide-react';
import {
  CurrencyCode,
  EventCategory,
  EventWizardDraft,
  EventWorkspace,
} from '../types/event';
import { recalculateMilestoneDates, validateWizardStep } from '../utils/planningLogic';

interface EventWizardModalProps {
  isOpen: boolean;
  initialCategory: EventCategory;
  initialPreset?: { budget?: number; guestCount?: number } | null;
  onClose: () => void;
  onComplete: (newEvent: EventWorkspace) => void;
}

const DRAFT_STORAGE_KEY = 'festiva_ai_wizard_draft_v1';

const PRIORITY_OPTIONS: Record<EventCategory, string[]> = {
  wedding: [
    'Venue & Architecture',
    'Culinary & Wine Pairing',
    'Floral Scenography',
    'Editorial Photography & Film',
    'Live Strings & Sound',
    'Guest Hospitality & Stationery',
  ],
  birthday: [
    'Party Theme & Scenography',
    'Artisanal Cake & Dining',
    'Signature Cocktail Bar',
    'Vinyl DJ & Entertainment',
    'Photography & Keepsakes',
    'Custom Return Gifts',
  ],
  community: [
    'Stage & AV Production',
    'Municipal Permits & Safety',
    'Volunteer Operations',
    'Zero-Waste Catering',
    'Wayfinding & Accessibility',
    'Sponsor Deliverables',
  ],
};

export const EventWizardModal: React.FC<EventWizardModalProps> = ({
  isOpen,
  initialCategory,
  initialPreset,
  onClose,
  onComplete,
}) => {
  const [draft, setDraft] = useState<EventWizardDraft>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, category: initialCategory || parsed.category || 'wedding' };
      }
    } catch {
      // ignore storage errors
    }
    return {
      step: 1,
      category: initialCategory,
      name: '',
      location: '',
      date: '2027-02-14',
      guestCount: 120,
      venueType: 'Historic Limestone Estate',
      currency: 'USD',
      totalBudget: 45000,
      priorities: ['Venue & Architecture', 'Culinary & Wine Pairing'],
      flexibility: 'Moderate (+10%)',
      style: 'Contemporary Editorial & Warm Candlelight',
      theme: 'Twilight Cypress, Burgundy Botanicals & Travertine',
      food: 'Seasonal four-course tasting menu & sommelier pairings',
      culturalPreferences: '',
      specialRequirements: '',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setDraft((prev) => ({
        ...prev,
        category: initialCategory,
        totalBudget: initialPreset?.budget ?? prev.totalBudget,
        guestCount: initialPreset?.guestCount ?? prev.guestCount,
      }));
    }
  }, [isOpen, initialCategory, initialPreset]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // ignore storage errors
    }
  }, [draft]);

  if (!isOpen) return null;

  const updateDraft = (patch: Partial<EventWizardDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setErrors({});
  };

  const handleNext = () => {
    const check = validateWizardStep(draft.step, draft);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    updateDraft({ step: Math.min(5, draft.step + 1) });
  };

  const handleBack = () => {
    setErrors({});
    updateDraft({ step: Math.max(1, draft.step - 1) });
  };

  const togglePriority = (item: string) => {
    const exists = draft.priorities.includes(item);
    const next = exists
      ? draft.priorities.filter((p) => p !== item)
      : [...draft.priorities, item];
    updateDraft({ priorities: next });
  };

  const handleGeneratePlan = async () => {
    for (let s = 1; s <= 4; s++) {
      const check = validateWizardStep(s, draft);
      if (!check.valid) {
        setErrors(check.errors);
        updateDraft({ step: s });
        return;
      }
    }

    setIsGenerating(true);
    setGenerationStatus('Connecting to ELEGANTIA AI Gemini planning engine...');

    try {
      const response = await fetch('/api/gemini/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft }),
      });

      const data = await response.json();
      const plan = data?.plan || {};

      const visualPreset =
        draft.category === 'wedding'
          ? 'wedding-courtyard'
          : draft.category === 'birthday'
          ? 'birthday-loft'
          : 'community-pavilion';

      const rawCategories = Array.isArray(plan.budgetCategories) ? plan.budgetCategories : [];
      const budgetCategories = rawCategories.map(
        (c: { category?: string; plannedAmount?: number; notes?: string }, idx: number) => ({
          id: `gen-cat-${Date.now()}-${idx}`,
          category: c.category || `Category ${idx + 1}`,
          plannedAmount: Math.max(0, Math.round(Number(c.plannedAmount) || 2000)),
          actualAmount: 0,
          locked: idx === 0,
          notes: c.notes || '',
          expenses: [],
        })
      );

      // Ensure generated allocations never exceed totalBudget
      const totalAllocated = budgetCategories.reduce((s: number, c: { plannedAmount: number }) => s + c.plannedAmount, 0);
      if (totalAllocated > draft.totalBudget && budgetCategories.length > 0) {
        const scale = draft.totalBudget / totalAllocated;
        budgetCategories.forEach((c: { plannedAmount: number }) => {
          c.plannedAmount = Math.floor(c.plannedAmount * scale);
        });
      }

      const rawMilestones = Array.isArray(plan.milestones) ? plan.milestones : [];
      const initialMilestones = rawMilestones.map(
        (
          m: { title?: string; daysBeforeEvent?: number; priority?: string; phase?: string },
          idx: number
        ) => ({
          id: `gen-ms-${Date.now()}-${idx}`,
          title: m.title || `Planning Milestone ${idx + 1}`,
          dueDate: draft.date,
          daysBeforeEvent: Number(m.daysBeforeEvent) || (5 - idx) * 14,
          priority: (['High', 'Medium', 'Low'].includes(String(m.priority))
            ? m.priority
            : 'High') as 'High' | 'Medium' | 'Low',
          status: 'Upcoming' as const,
          assignee: 'Lead Planner',
          phase: m.phase || 'Core Planning',
        })
      );

      const calculatedMilestones = recalculateMilestoneDates(
        initialMilestones,
        draft.date,
        draft.date
      );

      const newEvent: EventWorkspace = {
        id: `evt-${Date.now()}`,
        name: draft.name.trim(),
        category: draft.category,
        location: draft.location.trim(),
        date: draft.date,
        guestCount: Number(draft.guestCount),
        venueType: draft.venueType,
        currency: draft.currency,
        totalBudget: Number(draft.totalBudget),
        budgetFlexibility: draft.flexibility,
        priorities: draft.priorities,
        style: draft.style,
        theme: draft.theme,
        foodPreference: draft.food,
        culturalPreferences: draft.culturalPreferences,
        specialRequirements: draft.specialRequirements,
        coverVisualPreset: visualPreset,
        budgetCategories,
        milestones: calculatedMilestones,
        vendors: [
          {
            id: `gen-v-${Date.now()}-1`,
            name: `${draft.location} ${draft.venueType}`,
            category: 'Venue & Architecture',
            contactName: 'Venue Director',
            contactEmail: 'concierge@venue.example',
            contactPhone: '+1 (555) 019-2831',
            quotation: budgetCategories[0]?.plannedAmount || Math.round(draft.totalBudget * 0.32),
            bookingStatus: 'Shortlisted',
            paymentStatus: 'Unpaid',
            inclusions: ['Primary Event Space', 'Load-in Access', 'On-site Coordinator'],
            notes: `Generated from wizard for ${draft.guestCount} guests.`,
          },
          {
            id: `gen-v-${Date.now()}-2`,
            name: `Atelier Culinary & Hospitality`,
            category: 'Culinary & Beverage',
            contactName: 'Executive Chef',
            contactEmail: 'events@culinary.example',
            contactPhone: '+1 (555) 014-8820',
            quotation: budgetCategories[1]?.plannedAmount || Math.round(draft.totalBudget * 0.28),
            bookingStatus: 'Contacted',
            paymentStatus: 'Unpaid',
            inclusions: [draft.food || 'Seasonal Menu', 'Service Staff', 'Glassware'],
            notes: draft.culturalPreferences || 'Awaiting tasting schedule.',
          },
        ],
        guests: [
          {
            id: `gen-g-${Date.now()}-1`,
            name: 'Host Party & Key Stakeholders',
            email: 'hosts@festiva.example',
            partySize: 4,
            rsvpStatus: 'Confirmed',
            dietaryNotes: 'None',
            tableAssignment: 'Table 01',
            roleOrGroup: 'Event Hosts',
          },
        ],
        ideas: [
          {
            id: `gen-idea-${Date.now()}-1`,
            title: `${draft.theme} — Signature Focal Installation`,
            category: 'Themes',
            eventCategory: draft.category,
            description: `Custom ${draft.style} concept tailored for ${draft.venueType} in ${draft.location}.`,
            palette: ['#182C28', '#A34E50', '#C59A52', '#F5F0E8'],
            estimatedImpact: 'Included in Decor allocation',
            visualPreset,
            saved: true,
            favourite: true,
            addedToEvent: true,
            isGeneratedConcept: true,
          },
        ],
        recommendations: Array.isArray(plan.recommendations)
          ? plan.recommendations
          : [
              `Prioritize ${draft.priorities.join(' and ')} when locking initial retainers.`,
            ],
        scheduleSlots: Array.isArray(plan.scheduleSlots)
          ? plan.scheduleSlots.map(
              (
                s: { time?: string; title?: string; location?: string; lead?: string; notes?: string },
                i: number
              ) => ({
                id: `gen-slot-${i}`,
                time: s.time || '17:00',
                title: s.title || 'Program Segment',
                location: s.location || draft.venueType,
                lead: s.lead || 'Lead Planner',
                notes: s.notes || '',
              })
            )
          : [],
        selectedBirthdayThemeId:
          draft.category === 'birthday' ? 'theme-terracotta-loft' : undefined,
        communityOperations:
          draft.category === 'community'
            ? [
                {
                  id: `cop-gen-1`,
                  domain: 'Permits & Venue',
                  item: `Municipal Venue & Sound Permit (${draft.location})`,
                  owner: 'Operations Lead',
                  status: 'In Review',
                  scheduleWindow: '30 Days Pre-Event',
                  details: `Required for ${draft.guestCount} attendees at ${draft.venueType}.`,
                },
              ]
            : undefined,
      };

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      onComplete(newEvent);
    } catch (err) {
      setErrors({
        submit: `Unable to generate plan: ${(err as Error).message}`,
      });
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const stepTitles = [
    '1. Event Category',
    '2. Event Details',
    '3. Budget Studio',
    '4. Preferences',
    '5. Review & Generate',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-[#F5F0E8] border border-[#D8C9B8] rounded-lg overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-[#182C28] text-[#F5F0E8] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C59A52]">
              ELEGANTIA AI CREATION WORKFLOW
            </p>
            <h2 id="wizard-modal-title" className="font-editorial text-2xl font-semibold">
              Design a New Event Workspace
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close event creation wizard"
            onClick={onClose}
            className="p-1.5 rounded text-[#D8C9B8] hover:text-white hover:bg-[#315B50]/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visible Progress Bar */}
        <div className="bg-[#EAE2D6] px-6 py-3 border-b border-[#D8C9B8]">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {stepTitles.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = draft.step === stepNum;
              const isDone = draft.step > stepNum;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (stepNum < draft.step) updateDraft({ step: stepNum });
                  }}
                  className={`text-xs font-medium whitespace-nowrap py-1 px-2 rounded transition-colors ${
                    isActive
                      ? 'bg-[#182C28] text-[#F5F0E8] font-semibold'
                      : isDone
                      ? 'text-[#315B50] font-semibold cursor-pointer'
                      : 'text-[#292A27]/50 cursor-default'
                  }`}
                >
                  {isDone ? `✓ ${label}` : label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Choose Category */}
          {draft.step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
                  Choose your event studio mode
                </h3>
                <p className="text-xs sm:text-sm text-[#292A27]/75">
                  Each mode configures domain-specific budget ratios, vendor checklists, and operational tools.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(
                  [
                    {
                      id: 'wedding',
                      title: 'Wedding Studio',
                      accent: '#A34E50',
                      desc: 'Ceremony schedule, floral scenography, tasting menus & hospitality.',
                      defaultVenue: 'Historic Limestone Estate',
                      defaultBudget: 85000,
                    },
                    {
                      id: 'birthday',
                      title: 'Birthday Studio',
                      accent: '#D77C50',
                      desc: 'Creative celebration themes, artisanal cake, entertainment & return gifts.',
                      defaultVenue: 'Sunlit Penthouse Loft',
                      defaultBudget: 18500,
                    },
                    {
                      id: 'community',
                      title: 'Community Studio',
                      accent: '#397D85',
                      desc: 'Municipal permits, volunteer shifts, stage run-sheets & safety.',
                      defaultVenue: 'Civic Timber Pavilion & Plaza',
                      defaultBudget: 42000,
                    },
                  ] as const
                ).map((item) => {
                  const selected = draft.category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        updateDraft({
                          category: item.id,
                          venueType: item.defaultVenue,
                          totalBudget: item.defaultBudget,
                          priorities: PRIORITY_OPTIONS[item.id].slice(0, 2),
                        })
                      }
                      className={`text-left p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        selected
                          ? 'bg-white border-2 border-[#182C28] shadow-sm'
                          : 'bg-white/60 border-[#D8C9B8] hover:bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.accent }}
                        />
                        <p className="font-editorial text-xl font-semibold text-[#182C28]">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#292A27]/75 leading-relaxed">{item.desc}</p>
                      </div>
                      <span className="mt-4 text-xs font-semibold text-[#315B50]">
                        {selected ? 'Selected Mode' : 'Select mode →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Event Details */}
          {draft.step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
                  Enter event details
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (draft.category === 'wedding') {
                      updateDraft({
                        name: 'Camille & Henrik — Orangerie Wedding',
                        location: 'Napa Valley, CA',
                        date: '2027-04-18',
                        guestCount: 130,
                        venueType: 'Glass Orangerie & Botanical Garden',
                      });
                    } else if (draft.category === 'birthday') {
                      updateDraft({
                        name: 'Julian’s 35th Rooftop Supper & Vinyl Salon',
                        location: 'Tribeca, New York',
                        date: '2027-01-24',
                        guestCount: 55,
                        venueType: 'Sunlit Penthouse Loft',
                      });
                    } else {
                      updateDraft({
                        name: 'Pacific Northwest Architecture & Craft Forum',
                        location: 'Seattle Waterfront Pavilion',
                        date: '2027-03-12',
                        guestCount: 380,
                        venueType: 'Civic Timber Pavilion & Plaza',
                      });
                    }
                  }}
                  className="text-xs font-semibold text-[#315B50] hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Quick-fill sample {draft.category} details →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="wiz-name" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Event Name *
                  </label>
                  <input
                    id="wiz-name"
                    type="text"
                    value={draft.name}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    placeholder="e.g., Clara & Marcus — Conservatory Wedding"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm focus:outline-none focus:border-[#182C28]"
                  />
                  {errors.name && <p className="text-xs text-[#A34E50] mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="wiz-location" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Location / City *
                  </label>
                  <input
                    id="wiz-location"
                    type="text"
                    value={draft.location}
                    onChange={(e) => updateDraft({ location: e.target.value })}
                    placeholder="e.g., Napa Valley, CA"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm focus:outline-none focus:border-[#182C28]"
                  />
                  {errors.location && <p className="text-xs text-[#A34E50] mt-1">{errors.location}</p>}
                </div>

                <div>
                  <label htmlFor="wiz-date" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Event Date *
                  </label>
                  <input
                    id="wiz-date"
                    type="date"
                    value={draft.date}
                    onChange={(e) => updateDraft({ date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm font-mono focus:outline-none focus:border-[#182C28]"
                  />
                  {errors.date && <p className="text-xs text-[#A34E50] mt-1">{errors.date}</p>}
                </div>

                <div>
                  <label htmlFor="wiz-guests" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Estimated Guest Count *
                  </label>
                  <input
                    id="wiz-guests"
                    type="number"
                    min={2}
                    max={25000}
                    value={draft.guestCount}
                    onChange={(e) => updateDraft({ guestCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm font-mono tabular-nums focus:outline-none focus:border-[#182C28]"
                  />
                  {errors.guestCount && (
                    <p className="text-xs text-[#A34E50] mt-1">{errors.guestCount}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="wiz-venue" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Venue Setting *
                  </label>
                  <select
                    id="wiz-venue"
                    value={draft.venueType}
                    onChange={(e) => updateDraft({ venueType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm focus:outline-none focus:border-[#182C28]"
                  >
                    <option value="Historic Limestone Estate">Historic Limestone Estate</option>
                    <option value="Glass Orangerie & Botanical Garden">Glass Orangerie & Botanical Garden</option>
                    <option value="Sunlit Penthouse Loft">Sunlit Penthouse Loft</option>
                    <option value="Architectural Art Gallery">Architectural Art Gallery</option>
                    <option value="Civic Timber Pavilion & Plaza">Civic Timber Pavilion & Plaza</option>
                    <option value="Coastal Cliffside Terrace">Coastal Cliffside Terrace</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Budget */}
          {draft.step === 3 && (
            <div className="space-y-4">
              <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
                Configure budget parameters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="wiz-currency" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Currency
                  </label>
                  <select
                    id="wiz-currency"
                    value={draft.currency}
                    onChange={(e) => updateDraft({ currency: e.target.value as CurrencyCode })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (CA$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="wiz-budget" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Total Budget Ceiling *
                  </label>
                  <input
                    id="wiz-budget"
                    type="number"
                    min={200}
                    step={500}
                    value={draft.totalBudget}
                    onChange={(e) => updateDraft({ totalBudget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm font-mono tabular-nums"
                  />
                  {errors.totalBudget && (
                    <p className="text-xs text-[#A34E50] mt-1">{errors.totalBudget}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="wiz-flex" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Flexibility
                  </label>
                  <select
                    id="wiz-flex"
                    value={draft.flexibility}
                    onChange={(e) =>
                      updateDraft({
                        flexibility: e.target.value as EventWizardDraft['flexibility'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm"
                  >
                    <option value="Strict">Strict Ceiling</option>
                    <option value="Moderate (+10%)">Moderate (+10%)</option>
                    <option value="Flexible (+20%)">Flexible (+20%)</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#182C28] mb-2">
                  Top Investment Priorities (Select at least 1) *
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRIORITY_OPTIONS[draft.category].map((p) => {
                    const active = draft.priorities.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePriority(p)}
                        className={`px-3.5 py-2.5 rounded-md border text-xs font-medium text-left flex items-center justify-between cursor-pointer ${
                          active
                            ? 'bg-[#182C28] text-[#F5F0E8] border-[#182C28]'
                            : 'bg-white text-[#292A27] border-[#D8C9B8] hover:border-[#182C28]'
                        }`}
                      >
                        <span>{p}</span>
                        {active && <Check className="w-3.5 h-3.5 text-[#C59A52]" />}
                      </button>
                    );
                  })}
                </div>
                {errors.priorities && (
                  <p className="text-xs text-[#A34E50] mt-1">{errors.priorities}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Preferences */}
          {draft.step === 4 && (
            <div className="space-y-4">
              <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
                Aesthetic, culinary & cultural direction
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wiz-style" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Visual Style *
                  </label>
                  <input
                    id="wiz-style"
                    type="text"
                    value={draft.style}
                    onChange={(e) => updateDraft({ style: e.target.value })}
                    placeholder="e.g., Architectural Editorial & Candlelight"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm"
                  />
                  {errors.style && <p className="text-xs text-[#A34E50] mt-1">{errors.style}</p>}
                </div>

                <div>
                  <label htmlFor="wiz-theme" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Theme & Palette Direction *
                  </label>
                  <input
                    id="wiz-theme"
                    type="text"
                    value={draft.theme}
                    onChange={(e) => updateDraft({ theme: e.target.value })}
                    placeholder="e.g., Burgundy Roses, Cypress & Antique Brass"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm"
                  />
                  {errors.theme && <p className="text-xs text-[#A34E50] mt-1">{errors.theme}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="wiz-food" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Food & Beverage Format
                  </label>
                  <input
                    id="wiz-food"
                    type="text"
                    value={draft.food}
                    onChange={(e) => updateDraft({ food: e.target.value })}
                    placeholder="e.g., Four-course seasonal harvest dinner & natural wine pairings"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="wiz-cultural" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Cultural Traditions or Honors
                  </label>
                  <input
                    id="wiz-cultural"
                    type="text"
                    value={draft.culturalPreferences}
                    onChange={(e) => updateDraft({ culturalPreferences: e.target.value })}
                    placeholder="e.g., Bilingual vows, tea ceremony, ASL interpretation"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="wiz-special" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Special Requirements
                  </label>
                  <input
                    id="wiz-special"
                    type="text"
                    value={draft.specialRequirements}
                    onChange={(e) => updateDraft({ specialRequirements: e.target.value })}
                    placeholder="e.g., Outdoor courtyard heating, step-free stage access"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8C9B8] rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review and Generate */}
          {draft.step === 5 && (
            <div className="space-y-4">
              <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
                Review blueprint & generate with Gemini
              </h3>
              <div className="bg-white border border-[#D8C9B8] rounded-lg p-5 space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between border-b border-[#F5F0E8] pb-2">
                  <span className="text-[#292A27]/70">Event Title & Studio</span>
                  <span className="font-semibold text-[#182C28]">
                    {draft.name} ({draft.category.toUpperCase()})
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#F5F0E8] pb-2">
                  <span className="text-[#292A27]/70">Location & Date</span>
                  <span className="font-mono text-[#182C28] tabular-nums">
                    {draft.location} · {draft.date}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#F5F0E8] pb-2">
                  <span className="text-[#292A27]/70">Scale & Venue</span>
                  <span className="text-[#182C28] tabular-nums">
                    {draft.guestCount} Guests · {draft.venueType}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#F5F0E8] pb-2">
                  <span className="text-[#292A27]/70">Total Budget Ceiling</span>
                  <span className="font-mono font-semibold text-[#315B50] tabular-nums">
                    {draft.currency} {Number(draft.totalBudget).toLocaleString()} ({draft.flexibility})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#292A27]/70">Creative Theme</span>
                  <span className="text-[#182C28]">{draft.theme}</span>
                </div>
              </div>

              {errors.submit && (
                <div className="p-3 bg-[#A34E50]/10 border border-[#A34E50] rounded text-xs text-[#A34E50]">
                  {errors.submit}
                </div>
              )}

              {isGenerating && (
                <div className="p-4 bg-[#182C28] text-[#F5F0E8] rounded-md flex items-center gap-3 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C59A52] shrink-0" />
                  <span>{generationStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#EAE2D6] px-6 py-4 border-t border-[#D8C9B8] flex items-center justify-between">
          {draft.step > 1 ? (
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleBack}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#182C28] border border-[#D8C9B8] bg-white rounded-md hover:border-[#182C28] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <span className="text-xs text-[#292A27]/60">Draft saved automatically</span>
          )}

          {draft.step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#F5F0E8] bg-[#182C28] hover:bg-[#243f39] rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGeneratePlan}
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d3a962] rounded-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Orchestrating Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Event Workspace</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
