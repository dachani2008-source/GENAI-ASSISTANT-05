import React, { Suspense, lazy, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Compass,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Settings as SettingsIcon,
  Sparkles,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { CATEGORY_SHOWCASE } from './data/seedEvents';
import { useEventWorkspace } from './hooks/useEventWorkspace';
import { MarketingExperience } from './components/MarketingExperience';
import { OverviewDashboard } from './components/OverviewDashboard';
import {
  EventsPortfolioView,
  MobileNavigationDrawer,
  NavItemConfig,
  WorkspaceHeader,
  WorkspaceSettingsView,
  WorkspaceSidebar,
} from './components/WorkspaceLayout';

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

const StudioLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className="bg-white rounded-lg border border-[#D8C9B8] p-8 text-center text-xs text-[#315B50] font-medium"
  >
    Loading ELEGANTIA AI studio module...
  </div>
);

export default function App() {
  const {
    environment,
    setEnvironment,
    plannerName,
    setPlannerName,
    events,
    setEvents,
    activeEvent,
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
  } = useEventWorkspace();

  const eventAccentHex = CATEGORY_SHOWCASE[activeEvent.category].accentHex;
  const studioTitle = CATEGORY_SHOWCASE[activeEvent.category].studioTitle;

  const navItems = useMemo<NavItemConfig[]>(
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

  const activeSectionLabel =
    navItems.find((n) => n.id === activeSection)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#292A27] flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C59A52] focus:text-[#182C28] focus:font-semibold focus:rounded"
      >
        Skip to main content
      </a>

      <WorkspaceSidebar
        navItems={navItems}
        activeSection={activeSection}
        sidebarCollapsed={sidebarCollapsed}
        activeCategory={activeEvent.category}
        onSelectSection={setActiveSection}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        onOpenWizard={handleOpenWizard}
        onReturnMarketing={() => setEnvironment('marketing')}
      />

      <MobileNavigationDrawer
        isOpen={mobileSidebarOpen}
        navItems={navItems}
        activeSection={activeSection}
        activeCategory={activeEvent.category}
        onClose={() => setMobileSidebarOpen(false)}
        onSelectSection={setActiveSection}
        onOpenWizard={handleOpenWizard}
        onReturnMarketing={() => setEnvironment('marketing')}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <WorkspaceHeader
          events={events}
          activeEvent={activeEvent}
          activeSectionLabel={activeSectionLabel}
          plannerName={plannerName}
          searchQuery={searchQuery}
          searchResults={searchResults}
          notificationsOpen={notificationsOpen}
          profileMenuOpen={profileMenuOpen}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onSelectEvent={setActiveEventId}
          onSearchChange={setSearchQuery}
          onSelectSearchResult={(sec) => {
            setActiveSection(sec);
            setSearchQuery('');
          }}
          onOpenCopilot={() => setCopilotDrawerOpen(true)}
          onToggleNotifications={() => {
            setNotificationsOpen((v) => !v);
            setProfileMenuOpen(false);
          }}
          onCloseNotifications={() => setNotificationsOpen(false)}
          onToggleProfileMenu={() => {
            setProfileMenuOpen((v) => !v);
            setNotificationsOpen(false);
          }}
          onCloseProfileMenu={() => setProfileMenuOpen(false)}
          onNavigateSection={setActiveSection}
          onOpenWizard={handleOpenWizard}
          onReturnMarketing={() => setEnvironment('marketing')}
        />

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

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 focus:outline-none"
        >
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

          {activeSection === 'events' && (
            <EventsPortfolioView
              events={events}
              activeEvent={activeEvent}
              onOpenWizard={handleOpenWizard}
              onSelectEventStudio={(evt) => {
                setActiveEventId(evt.id);
                setActiveSection('studio');
                triggerToast(
                  `Opened ${evt.name} in ${CATEGORY_SHOWCASE[evt.category].studioTitle}.`
                );
              }}
            />
          )}

          {activeSection === 'budget' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <SmartBudgetStudio
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {activeSection === 'timeline' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <TimelineStudio
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {activeSection === 'vendors' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <VendorStudio
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {activeSection === 'guests' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <GuestAndCalendarView
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {activeSection === 'ideas' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <IdeaStudio
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {activeSection === 'copilot' && (
            <Suspense fallback={<StudioLoadingFallback />}>
              <AICopilotPanel
                event={activeEvent}
                onUpdateEvent={handleUpdateActiveEvent}
                onNotify={triggerToast}
              />
            </Suspense>
          )}

          {activeSection === 'settings' && (
            <WorkspaceSettingsView
              plannerName={plannerName}
              activeEvent={activeEvent}
              onUpdatePlannerName={setPlannerName}
              onUpdateActiveEvent={handleUpdateActiveEvent}
              onNotify={triggerToast}
            />
          )}
        </main>
      </div>

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
