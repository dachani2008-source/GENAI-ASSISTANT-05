import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  EventCategory,
  EventWorkspace,
  MilestoneStatus,
  WorkspaceSection,
} from './types/event';
import { CATEGORY_SHOWCASE, INITIAL_EVENTS } from './data/seedEvents';
import {
  calculateBudgetSummary,
  formatCurrency,
  generateEventICS,
  getDaysUntilEvent,
  recalculateMilestoneDates,
} from './utils/planningLogic';
import { EditorialVisual } from './components/EditorialVisuals';
import { MarketingExperience } from './components/MarketingExperience';
import { OverviewDashboard } from './components/OverviewDashboard';

// Lazy-loaded workspace studios & modals for optimal bundle splitting and fast initial load
const EventWizardModal = lazy(() =>
  import('./components/EventWizardModal').then((m) => ({ default: m.EventWizardModal }))
);
const CategoryStudioView = lazy(() =>
  import('./components/CategoryStudioView').then((m) => ({ default: m.CategoryStudioView }))
);
const SmartBudgetStudio = lazy(() =>
  import('./components/SmartBudgetStudio').then((m) => ({ default: m.SmartBudgetStudio }))
);
const TimelineStudio = lazy(() =>
  import('./components/TimelineStudio').then((m) => ({ default: m.TimelineStudio }))
);
const VendorStudio = lazy(() =>
  import('./components/VendorStudio').then((m) => ({ default: m.VendorStudio }))
);
const IdeaStudio = lazy(() =>
  import('./components/IdeaStudio').then((m) => ({ default: m.IdeaStudio }))
);
const GuestAndCalendarView = lazy(() =>
  import('./components/GuestAndCalendarView').then((m) => ({ default: m.GuestAndCalendarView }))
);
const AICopilotPanel = lazy(() =>
  import('./components/AICopilotPanel').then((m) => ({ default: m.AICopilotPanel }))
);

const EVENTS_STORAGE_KEY = 'elegantia_ai_events_v1';
const PLANNER_NAME_KEY = 'elegantia_ai_planner_name_v1';

const StudioLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="bg-white rounded-lg border border-[#D8C9B8] p-8 text-center text-xs text-[#315B50] font-medium"
  >
    Loading ELEGANTIA AI studio module...
  </div>
);

export default function App() {
  const [environment, setEnvironment] = useState<'marketing' | 'workspace'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' || params.get('view') === 'workspace') {
        return 'workspace';
      }
    }
    return 'marketing';
  });

  const [plannerName, setPlannerName] = useState<string>(() => {
    try {
      return localStorage.getItem(PLANNER_NAME_KEY) || 'Clara Vance';
    } catch {
      return 'Clara Vance';
    }
  });

  const [events, setEvents] = useState<EventWorkspace[]>(() => {
    try {
      const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_EVENTS;
  });

  const [activeEventId, setActiveEventId] = useState<string>(() => INITIAL_EVENTS[0].id);
  const [marketingCategory, setMarketingCategory] = useState<EventCategory>('wedding');
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  const [wizardCategory, setWizardCategory] = useState<EventCategory>('wedding');
  const [wizardPreset, setWizardPreset] = useState<{
    budget?: number;
    guestCount?: number;
  } | null>(null);

  const [copilotDrawerOpen, setCopilotDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounced localStorage persistence to prevent main-thread blocking on rapid edits
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      } catch {
        // ignore storage errors
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(PLANNER_NAME_KEY, plannerName);
    } catch {
      // ignore storage errors
    }
  }, [plannerName]);

  // Global Escape key listener for accessible modal/drawer dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWizardOpen(false);
        setCopilotDrawerOpen(false);
        setMobileSidebarOpen(false);
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeEvent = useMemo(
    () => events.find((e) => e.id === activeEventId) || events[0],
    [events, activeEventId]
  );

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.clearTimeout((window as unknown as { __toastTimer?: number }).__toastTimer);
    (window as unknown as { __toastTimer?: number }).__toastTimer = window.setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const handleUpdateActiveEvent = useCallback((updated: EventWorkspace) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }, []);

  const handleOpenWizard = useCallback(
    (cat?: EventCategory, preset?: { budget?: number; guestCount?: number }) => {
      setWizardCategory(cat || activeEvent.category || marketingCategory);
      setWizardPreset(preset || null);
      setWizardOpen(true);
    },
    [activeEvent.category, marketingCategory]
  );

  const handleEnterWorkspace = useCallback(
    (cat?: EventCategory, section?: WorkspaceSection) => {
      if (cat) {
        const matchingEvent = events.find((e) => e.category === cat);
        if (matchingEvent) {
          setActiveEventId(matchingEvent.id);
        }
      }
      if (section) {
        setActiveSection(section);
      }
      setEnvironment('workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [events]
  );

  const handleSwitchCategoryStudio = useCallback(
    (cat: EventCategory) => {
      const match = events.find((e) => e.category === cat);
      if (match) {
        setActiveEventId(match.id);
        triggerToast(`Switched workspace to ${CATEGORY_SHOWCASE[cat].studioTitle}: ${match.name}`);
      }
    },
    [events, triggerToast]
  );

  const handleToggleMilestoneFromOverview = useCallback(
    (milestoneId: string) => {
      const nextMilestones = activeEvent.milestones.map((m) => {
        if (m.id !== milestoneId) return m;
        const nextStatus: MilestoneStatus =
          m.status === 'Completed' ? 'Upcoming' : 'Completed';
        return { ...m, status: nextStatus };
      });
      handleUpdateActiveEvent({ ...activeEvent, milestones: nextMilestones });
      triggerToast('Updated milestone completion status.');
    },
    [activeEvent, handleUpdateActiveEvent, triggerToast]
  );

  const handleQuickExportICS = useCallback(() => {
    const icsContent = generateEventICS(activeEvent);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeEvent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleUpdateActiveEvent({
      ...activeEvent,
      calendarSynced: true,
      lastSyncedAt: 'Just now',
    });
    triggerToast(`Downloaded .ICS calendar bundle for "${activeEvent.name}".`);
  }, [activeEvent, handleUpdateActiveEvent, triggerToast]);

  // Search matches across active event
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { label: string; type: string; section: WorkspaceSection }[] = [];

    activeEvent.milestones.forEach((m) => {
      if (m.title.toLowerCase().includes(q) || m.assignee.toLowerCase().includes(q)) {
        results.push({ label: m.title, type: 'Timeline Milestone', section: 'timeline' });
      }
    });
    activeEvent.vendors.forEach((v) => {
      if (v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)) {
        results.push({ label: v.name, type: 'Vendor', section: 'vendors' });
      }
    });
    activeEvent.budgetCategories.forEach((b) => {
      if (b.category.toLowerCase().includes(q)) {
        results.push({ label: b.category, type: 'Budget Category', section: 'budget' });
      }
    });
    activeEvent.ideas.forEach((i) => {
      if (i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) {
        results.push({ label: i.title, type: 'Idea Studio', section: 'ideas' });
      }
    });
    return results.slice(0, 6);
  }, [searchQuery, activeEvent]);

  // Memoized Overview metrics
  const budgetSummary = useMemo(
    () => calculateBudgetSummary(activeEvent.totalBudget, activeEvent.budgetCategories),
    [activeEvent.totalBudget, activeEvent.budgetCategories]
  );
  const daysUntil = useMemo(() => getDaysUntilEvent(activeEvent.date), [activeEvent.date]);
  const completedMilestones = useMemo(
    () => activeEvent.milestones.filter((m) => m.status === 'Completed').length,
    [activeEvent.milestones]
  );
  const planningProgress = useMemo(
    () =>
      activeEvent.milestones.length > 0
        ? Math.round((completedMilestones / activeEvent.milestones.length) * 100)
        : 45,
    [activeEvent.milestones.length, completedMilestones]
  );

  const eventAccentHex = CATEGORY_SHOWCASE[activeEvent.category].accentHex;
  const studioTitle = CATEGORY_SHOWCASE[activeEvent.category].studioTitle;

  const navItems: { id: WorkspaceSection; label: string; icon: React.ReactNode }[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'studio', label: studioTitle, icon: <Compass className="w-4 h-4" /> },
      { id: 'events', label: 'My Events', icon: <FolderKanban className="w-4 h-4" /> },
      { id: 'budget', label: 'Budget Studio', icon: <Wallet className="w-4 h-4" /> },
      { id: 'timeline', label: 'Timeline', icon: <Calendar className="w-4 h-4" /> },
      { id: 'vendors', label: 'Vendors', icon: <Store className="w-4 h-4" /> },
      { id: 'guests', label: 'Guest Management', icon: <Users className="w-4 h-4" /> },
      { id: 'ideas', label: 'Idea Studio', icon: <Lightbulb className="w-4 h-4" /> },
      { id: 'copilot', label: 'AI Copilot', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
    ],
    [studioTitle]
  );

  if (environment === 'marketing') {
    return (
      <>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C59A52] focus:text-[#182C28] focus:font-semibold focus:rounded"
        >
          Skip to main content
        </a>
        <MarketingExperience
          selectedCategory={marketingCategory}
          plannerName={plannerName}
          onUpdatePlannerName={setPlannerName}
          onSelectCategory={setMarketingCategory}
          onOpenWizard={handleOpenWizard}
          onEnterWorkspace={handleEnterWorkspace}
        />
        {wizardOpen && (
          <Suspense fallback={null}>
            <EventWizardModal
              isOpen={wizardOpen}
              initialCategory={wizardCategory}
              initialPreset={wizardPreset}
              onClose={() => setWizardOpen(false)}
              onComplete={(newEvt) => {
                setEvents((prev) => [newEvt, ...prev]);
                setActiveEventId(newEvt.id);
                setWizardOpen(false);
                setEnvironment('workspace');
                setActiveSection('overview');
                triggerToast(`Created "${newEvt.name}" workspace with ELEGANTIA AI.`);
              }}
            />
          </Suspense>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#292A27] flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C59A52] focus:text-[#182C28] focus:font-semibold focus:rounded"
      >
        Skip to main content
      </a>
      {/* DESKTOP SIDEBAR (Collapsible) */}
      <aside
        aria-label="Workspace Sidebar Navigation"
        className={`hidden lg:flex flex-col justify-between bg-[#182C28] text-[#F5F0E8] border-r border-[#315B50] shrink-0 transition-all duration-150 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Sidebar Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setEnvironment('marketing')}
                className="font-editorial text-2xl font-semibold tracking-tight text-[#F5F0E8] cursor-pointer"
              >
                ELEGANTIA AI
              </button>
            )}
            <button
              type="button"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="p-1.5 rounded text-[#D8C9B8] hover:text-white hover:bg-[#315B50]/40 cursor-pointer"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Primary Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#C59A52] text-[#182C28] font-semibold'
                      : 'text-[#D8C9B8] hover:text-white hover:bg-[#315B50]/40'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Studio Switcher & New Event CTA */}
        <div className="p-4 border-t border-[#315B50] space-y-3">
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => handleOpenWizard(activeEvent.category)}
              className="w-full py-2.5 px-3 bg-[#315B50] hover:bg-[#3c6e61] text-[#F5F0E8] text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setEnvironment('marketing')}
            className="w-full py-2 text-xs text-[#D8C9B8] hover:text-white text-center cursor-pointer"
          >
            {sidebarCollapsed ? '←' : '← Marketing Site'}
          </button>
        </div>
      </aside>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#182C28] text-[#F5F0E8] h-full flex flex-col justify-between p-5 z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-editorial text-2xl font-semibold">ELEGANTIA AI</span>
                <button
                  type="button"
                  aria-label="Close mobile menu"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 text-[#D8C9B8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                      activeSection === item.id
                        ? 'bg-[#C59A52] text-[#182C28] font-semibold'
                        : 'text-[#D8C9B8] hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="pt-4 border-t border-[#315B50] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleOpenWizard(activeEvent.category);
                }}
                className="w-full py-2.5 bg-[#C59A52] text-[#182C28] text-xs font-semibold rounded-md"
              >
                + Create New Event
              </button>
              <button
                type="button"
                onClick={() => setEnvironment('marketing')}
                className="w-full py-2 text-xs text-[#D8C9B8]"
              >
                Return to Marketing Site
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN WORKSPACE CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Workspace Header: Current Event, Breadcrumb, Search, Quick Copilot, Notifications, Profile */}
        <header className="sticky top-0 z-30 bg-[#F5F0E8]/95 backdrop-blur border-b border-[#D8C9B8] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Drawer Button + Breadcrumb + Event Switcher */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation drawer"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-[#182C28] hover:bg-[#EAE2D6]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <select
                aria-label="Select active event"
                value={activeEvent.id}
                onChange={(e) => setActiveEventId(e.target.value)}
                className="bg-white border border-[#D8C9B8] rounded-md px-2 sm:px-2.5 py-1.5 font-semibold text-[#182C28] max-w-[140px] sm:max-w-[260px] truncate cursor-pointer"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className="hidden sm:inline text-[#292A27]/40">
                /
              </span>
              <span className="hidden sm:inline font-medium text-[#315B50] whitespace-nowrap">
                {navItems.find((n) => n.id === activeSection)?.label}
              </span>
            </div>
          </div>

          {/* Right: Search, Quick Copilot Drawer, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Input + Live Dropdown */}
            <div className="relative hidden md:block w-52 lg:w-64">
              <Search className="w-3.5 h-3.5 text-[#292A27]/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Search milestones, vendors, budget, or ideas"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search milestones, vendors..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D8C9B8] rounded-md text-xs focus:outline-none focus:border-[#182C28]"
              />
              {searchResults.length > 0 && (
                <div className="absolute right-0 mt-1 w-72 bg-white border border-[#D8C9B8] rounded-md shadow-lg py-1.5 z-50">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setActiveSection(res.section);
                        setSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#F5F0E8] flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="font-medium text-[#182C28] truncate">
                        {res.label}
                      </span>
                      <span className="text-[10px] text-[#315B50] shrink-0 ml-2">
                        {res.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Copilot Drawer Trigger */}
            <button
              type="button"
              onClick={() => setCopilotDrawerOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#C59A52] hover:bg-[#d3a962] text-[#182C28] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </button>

            {/* Notifications Button & Popover */}
            <div className="relative">
              <button
                type="button"
                aria-label="Open notifications"
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileMenuOpen(false);
                }}
                className="p-2 rounded-md bg-white border border-[#D8C9B8] hover:border-[#182C28] text-[#182C28] cursor-pointer"
              >
                <Bell className="w-4 h-4" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#D8C9B8] rounded-lg shadow-lg p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F5F0E8] pb-2">
                    <span className="text-xs font-semibold text-[#182C28]">
                      ELEGANTIA AI Studio Alerts
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-[#292A27]/60 hover:text-[#182C28]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {activeEvent.milestones
                      .filter((m) => m.status === 'Overdue')
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setNotificationsOpen(false);
                            setActiveSection('timeline');
                          }}
                          className="w-full text-left p-2.5 bg-[#F5F0E8] hover:bg-[#EAE2D6] rounded border border-[#D8C9B8] cursor-pointer"
                        >
                          <p className="font-semibold text-[#A34E50]">
                            Overdue Milestone →
                          </p>
                          <p className="text-[#182C28]">{m.title}</p>
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        setActiveSection('budget');
                      }}
                      className="w-full text-left p-2.5 bg-[#F5F0E8] hover:bg-[#EAE2D6] rounded border border-[#D8C9B8] cursor-pointer"
                    >
                      <p className="font-semibold text-[#315B50]">
                        AI Budget Opportunity →
                      </p>
                      <p className="text-[#292A27]">
                        Inspect unlocked contingency in Smart Budget Studio.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Control */}
            <div className="relative">
              <button
                type="button"
                aria-label="Open planner profile menu"
                onClick={() => {
                  setProfileMenuOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
                className="px-3 py-1.5 rounded-md bg-[#182C28] text-[#F5F0E8] text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{plannerName}</span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D8C9B8] rounded-lg shadow-lg p-3 z-50 space-y-2 text-xs">
                  <div className="border-b border-[#F5F0E8] pb-2">
                    <p className="font-semibold text-[#182C28]">{plannerName}</p>
                    <p className="text-[#292A27]/65">Principal Event Architect</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setActiveSection('settings');
                    }}
                    className="w-full text-left py-1.5 hover:text-[#A34E50] cursor-pointer"
                  >
                    Event & Profile Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleOpenWizard(activeEvent.category);
                    }}
                    className="w-full text-left py-1.5 hover:text-[#A34E50] cursor-pointer"
                  >
                    + Create New Event
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setEnvironment('marketing');
                    }}
                    className="w-full text-left py-1.5 hover:text-[#A34E50] cursor-pointer"
                  >
                    Switch to Marketing Website
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="bg-[#182C28] text-[#F5F0E8] px-4 sm:px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b border-[#315B50]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C59A52] shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-[#D8C9B8] hover:text-white ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* MAIN VIEWPORT */}
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 focus:outline-none">
          {/* ================================================================
              OVERVIEW SECTION
             ================================================================ */}
          {activeSection === 'overview' && (
            <OverviewDashboard
              activeEvent={activeEvent}
              plannerName={plannerName}
              eventAccentHex={eventAccentHex}
              studioTitle={studioTitle}
              daysUntil={daysUntil}
              planningProgress={planningProgress}
              budgetSummary={budgetSummary}
              onSwitchCategoryStudio={handleSwitchCategoryStudio}
              onNavigate={setActiveSection}
              onQuickExportICS={handleQuickExportICS}
              onOpenCopilotDrawer={() => setCopilotDrawerOpen(true)}
              onToggleMilestone={handleToggleMilestoneFromOverview}
            />
          )}

          {/* ================================================================
              CATEGORY-SPECIFIC STUDIO (Wedding / Birthday / Community)
             ================================================================ */}
          {activeSection === 'studio' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <CategoryStudioView
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNavigate={setActiveSection}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {/* ================================================================
              MY EVENTS PORTFOLIO
             ================================================================ */}
          {activeSection === 'events' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
                    Event Portfolio
                  </p>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#182C28]">
                    All Active Celebration & Operations Workspaces
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenWizard(activeEvent.category)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d3a962] rounded-md flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Event</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {events.map((evt) => {
                  const isCurrent = evt.id === activeEvent.id;
                  const info = CATEGORY_SHOWCASE[evt.category];
                  return (
                    <div
                      key={evt.id}
                      className={`bg-white rounded-lg border overflow-hidden flex flex-col justify-between ${
                        isCurrent
                          ? 'border-2 border-[#182C28]'
                          : 'border-[#D8C9B8]'
                      }`}
                    >
                      <div>
                        <EditorialVisual
                          preset={evt.coverVisualPreset}
                          aspectRatio="16:9"
                          caption={info.studioTitle}
                        />
                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className="font-semibold"
                              style={{ color: info.accentHex }}
                            >
                              {info.studioTitle}
                            </span>
                            <span className="font-mono text-[#292A27]/70 tabular-nums">
                              {evt.date}
                            </span>
                          </div>
                          <h3 className="font-editorial text-xl font-semibold text-[#182C28]">
                            {evt.name}
                          </h3>
                          <p className="text-xs text-[#292A27]/75">
                            {evt.location} · {evt.guestCount} Guests ·{' '}
                            {formatCurrency(evt.totalBudget, evt.currency)}
                          </p>
                        </div>
                      </div>
                      <div className="px-5 py-3.5 bg-[#F5F0E8] border-t border-[#D8C9B8] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveEventId(evt.id);
                            setActiveSection('studio');
                            triggerToast(
                              `Opened ${evt.name} in ${info.studioTitle}.`
                            );
                          }}
                          className="text-xs font-semibold text-[#182C28] hover:underline cursor-pointer"
                        >
                          Open Studio View →
                        </button>
                        {isCurrent && (
                          <span className="text-[11px] font-semibold text-[#315B50]">
                            Active Workspace
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================
              SMART BUDGET STUDIO
             ================================================================ */}
          {activeSection === 'budget' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <SmartBudgetStudio
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {/* ================================================================
              TIMELINE STUDIO
             ================================================================ */}
          {activeSection === 'timeline' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <TimelineStudio
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {/* ================================================================
              VENDOR STUDIO
             ================================================================ */}
          {activeSection === 'vendors' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <VendorStudio
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {/* ================================================================
              GUEST MANAGEMENT & CALENDAR SYNC
             ================================================================ */}
          {activeSection === 'guests' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <GuestAndCalendarView
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {/* ================================================================
              IDEA STUDIO
             ================================================================ */}
          {activeSection === 'ideas' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <IdeaStudio
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {/* ================================================================
              AI COPILOT
             ================================================================ */}
          {activeSection === 'copilot' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <AICopilotPanel
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {/* ================================================================
              SETTINGS
             ================================================================ */}
          {activeSection === 'settings' && (
            <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-6 max-w-3xl">
              <div className="border-b border-[#F5F0E8] pb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
                  ELEGANTIA AI Workspace Configuration
                </p>
                <h2 className="font-editorial text-2xl font-semibold text-[#182C28]">
                  Planner Profile, Event Parameters & Date Recalculation
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="set-planner"
                    className="block text-xs font-semibold text-[#182C28] mb-1"
                  >
                    Planner Profile Name
                  </label>
                  <input
                    id="set-planner"
                    type="text"
                    value={plannerName}
                    onChange={(e) => setPlannerName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F5F0E8] border border-[#D8C9B8] rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="set-name"
                    className="block text-xs font-semibold text-[#182C28] mb-1"
                  >
                    Event Title
                  </label>
                  <input
                    id="set-name"
                    type="text"
                    value={activeEvent.name}
                    onChange={(e) =>
                      handleUpdateActiveEvent({
                        ...activeEvent,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-[#F5F0E8] border border-[#D8C9B8] rounded"
                  />
                </div>
                <div>
                  <label
                    htmlFor="set-loc"
                    className="block text-xs font-semibold text-[#182C28] mb-1"
                  >
                    Location
                  </label>
                  <input
                    id="set-loc"
                    type="text"
                    value={activeEvent.location}
                    onChange={(e) =>
                      handleUpdateActiveEvent({
                        ...activeEvent,
                        location: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-[#F5F0E8] border border-[#D8C9B8] rounded"
                  />
                </div>
                <div>
                  <label
                    htmlFor="set-date"
                    className="block text-xs font-semibold text-[#182C28] mb-1"
                  >
                    Event Date (Auto-Recalculates Milestones)
                  </label>
                  <input
                    id="set-date"
                    type="date"
                    value={activeEvent.date}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      const recalc = recalculateMilestoneDates(
                        activeEvent.milestones,
                        activeEvent.date,
                        nextDate
                      );
                      handleUpdateActiveEvent({
                        ...activeEvent,
                        date: nextDate,
                        milestones: recalc,
                      });
                      triggerToast(
                        `Updated event date to ${nextDate} and recalculated milestones.`
                      );
                    }}
                    className="w-full px-3.5 py-2 bg-[#F5F0E8] border border-[#D8C9B8] rounded font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="set-theme"
                    className="block text-xs font-semibold text-[#182C28] mb-1"
                  >
                    Creative Theme Direction
                  </label>
                  <input
                    id="set-theme"
                    type="text"
                    value={activeEvent.theme}
                    onChange={(e) =>
                      handleUpdateActiveEvent({
                        ...activeEvent,
                        theme: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-[#F5F0E8] border border-[#D8C9B8] rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Contextual Slide-Over AI Copilot Drawer */}
      {copilotDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ELEGANTIA AI Copilot Drawer"
          className="fixed inset-0 z-50 flex justify-end"
        >
          <div
            className="fixed inset-0 bg-black/55"
            onClick={() => setCopilotDrawerOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl bg-[#F5F0E8] h-full overflow-y-auto border-l border-[#D8C9B8] flex flex-col">
            <div className="bg-[#182C28] text-[#F5F0E8] px-6 py-4 flex items-center justify-between sticky top-0 z-20">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C59A52]">
                  ELEGANTIA AI ASSISTANT
                </p>
                <h3 className="font-editorial text-xl font-semibold">
                  Contextual Copilot — {activeEvent.name}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close AI Copilot drawer"
                onClick={() => setCopilotDrawerOpen(false)}
                className="p-1.5 text-[#D8C9B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1">
              <Suspense fallback={<StudioLoadingFallback />}>
                <AICopilotPanel
                  event={activeEvent}
                  onUpdateEvent={handleUpdateActiveEvent}
                  onNotify={triggerToast}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Event Creation Wizard Modal */}
      {wizardOpen && (
        <Suspense fallback={null}>
          <EventWizardModal
            isOpen={wizardOpen}
            initialCategory={wizardCategory}
            initialPreset={wizardPreset}
            onClose={() => setWizardOpen(false)}
            onComplete={(newEvt) => {
              setEvents((prev) => [newEvt, ...prev]);
              setActiveEventId(newEvt.id);
              setWizardOpen(false);
              setActiveSection('overview');
              triggerToast(`Generated "${newEvt.name}" workspace with ELEGANTIA AI.`);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

