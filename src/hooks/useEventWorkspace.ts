import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EventCategory,
  EventWorkspace,
  MilestoneStatus,
  WorkspaceSection,
} from '../types/event';
import { CATEGORY_SHOWCASE, INITIAL_EVENTS } from '../data/seedEvents';
import {
  calculateBudgetSummary,
  generateEventICS,
  getDaysUntilEvent,
  sanitizeTextInput,
} from '../utils/planningLogic';

const EVENTS_STORAGE_KEY = 'elegantia_ai_events_v1';
const PLANNER_NAME_KEY = 'elegantia_ai_planner_name_v1';

function readStoredPlannerName(): string {
  if (typeof window === 'undefined') return 'Clara Vance';
  try {
    const saved = window.localStorage.getItem(PLANNER_NAME_KEY);
    return saved && saved.trim().length > 0 ? saved : 'Clara Vance';
  } catch (error) {
    return error instanceof Error ? 'Clara Vance' : 'Clara Vance';
  }
}

function readStoredEvents(): EventWorkspace[] {
  if (typeof window === 'undefined') return INITIAL_EVENTS;
  try {
    const saved = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as EventWorkspace[];
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return INITIAL_EVENTS;
    }
  }
  return INITIAL_EVENTS;
}

export interface SearchResultItem {
  label: string;
  type: string;
  section: WorkspaceSection;
}

/**
 * Custom hook encapsulating ELEGANTIA AI workspace state, debounced persistence,
 * cross-studio search, and milestone/calendar actions.
 */
export function useEventWorkspace() {
  const [environment, setEnvironment] = useState<'marketing' | 'workspace'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' || params.get('view') === 'workspace') {
        return 'workspace';
      }
    }
    return 'marketing';
  });

  const [plannerName, setPlannerNameState] = useState<string>(readStoredPlannerName);
  const [events, setEvents] = useState<EventWorkspace[]>(readStoredEvents);
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

  const toastTimerRef = useRef<number | null>(null);

  const setPlannerName = useCallback((nextName: string) => {
    setPlannerNameState(sanitizeTextInput(nextName, 80) || 'Clara Vance');
  }, []);

  // Debounced localStorage persistence to prevent main-thread blocking
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      } catch (error) {
        if (error instanceof Error) {
          // Storage quota exceeded; keep in-memory state intact
        }
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [events]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PLANNER_NAME_KEY, plannerName);
    } catch (error) {
      if (error instanceof Error) {
        // Storage quota exceeded; keep in-memory state intact
      }
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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const activeEvent = useMemo(
    () => events.find((e) => e.id === activeEventId) || events[0],
    [events, activeEventId]
  );

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
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

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: SearchResultItem[] = [];

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

  return {
    environment,
    setEnvironment,
    plannerName,
    setPlannerName,
    events,
    setEvents,
    activeEvent,
    activeEventId,
    setActiveEventId,
    marketingCategory,
    setMarketingCategory,
    activeSection,
    setActiveSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    wizardOpen,
    setWizardOpen,
    wizardCategory,
    wizardPreset,
    copilotDrawerOpen,
    setCopilotDrawerOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    notificationsOpen,
    setNotificationsOpen,
    profileMenuOpen,
    setProfileMenuOpen,
    toastMessage,
    setToastMessage,
    triggerToast,
    handleUpdateActiveEvent,
    handleOpenWizard,
    handleEnterWorkspace,
    handleSwitchCategoryStudio,
    handleToggleMilestoneFromOverview,
    handleQuickExportICS,
    budgetSummary,
    daysUntil,
    planningProgress,
  };
}
