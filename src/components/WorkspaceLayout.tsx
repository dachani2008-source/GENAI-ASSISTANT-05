import React from 'react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  EventCategory,
  EventWorkspace,
  WorkspaceSection,
} from '../types/event';
import { CATEGORY_SHOWCASE } from '../data/seedEvents';
import {
  formatCurrency,
  recalculateMilestoneDates,
  sanitizeTextInput,
} from '../utils/planningLogic';
import { EditorialVisual } from './EditorialVisuals';
import { SearchResultItem } from '../hooks/useEventWorkspace';

export interface NavItemConfig {
  id: WorkspaceSection;
  label: string;
  icon: React.ReactNode;
}

interface WorkspaceSidebarProps {
  navItems: NavItemConfig[];
  activeSection: WorkspaceSection;
  sidebarCollapsed: boolean;
  activeCategory: EventCategory;
  onSelectSection: (section: WorkspaceSection) => void;
  onToggleCollapse: () => void;
  onOpenWizard: (cat: EventCategory) => void;
  onReturnMarketing: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = React.memo(
  ({
    navItems,
    activeSection,
    sidebarCollapsed,
    activeCategory,
    onSelectSection,
    onToggleCollapse,
    onOpenWizard,
    onReturnMarketing,
  }) => (
    <aside
      aria-label="Workspace Sidebar Navigation"
      className={`hidden lg:flex flex-col justify-between bg-[#182C28] text-[#F5F0E8] border-r border-[#315B50] shrink-0 transition-all duration-150 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between px-2 pt-1">
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={onReturnMarketing}
              className="font-editorial text-2xl font-semibold tracking-tight text-[#F5F0E8] cursor-pointer"
            >
              ELEGANTIA AI
            </button>
          )}
          <button
            type="button"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            onClick={onToggleCollapse}
            className="p-1.5 rounded text-[#D8C9B8] hover:text-white hover:bg-[#315B50]/40 cursor-pointer"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav aria-label="Studio Sections" className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => onSelectSection(item.id)}
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

      <div className="p-4 border-t border-[#315B50] space-y-3">
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => onOpenWizard(activeCategory)}
            className="w-full py-2.5 px-3 bg-[#315B50] hover:bg-[#3c6e61] text-[#F5F0E8] text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        )}
        <button
          type="button"
          onClick={onReturnMarketing}
          className="w-full py-2 text-xs text-[#D8C9B8] hover:text-white text-center cursor-pointer"
        >
          {sidebarCollapsed ? '←' : '← Marketing Site'}
        </button>
      </div>
    </aside>
  )
);

WorkspaceSidebar.displayName = 'WorkspaceSidebar';

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  navItems: NavItemConfig[];
  activeSection: WorkspaceSection;
  activeCategory: EventCategory;
  onClose: () => void;
  onSelectSection: (section: WorkspaceSection) => void;
  onOpenWizard: (cat: EventCategory) => void;
  onReturnMarketing: () => void;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = React.memo(
  ({
    isOpen,
    navItems,
    activeSection,
    activeCategory,
    onClose,
    onSelectSection,
    onOpenWizard,
    onReturnMarketing,
  }) => {
    if (!isOpen) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Drawer"
        className="fixed inset-0 z-50 lg:hidden flex"
      >
        <div className="fixed inset-0 bg-black/60" onClick={onClose} />
        <aside className="relative w-72 max-w-[85vw] bg-[#182C28] text-[#F5F0E8] h-full flex flex-col justify-between p-5 z-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-editorial text-2xl font-semibold">ELEGANTIA AI</span>
              <button
                type="button"
                aria-label="Close mobile menu"
                onClick={onClose}
                className="p-1.5 text-[#D8C9B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="Mobile Studio Sections" className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={activeSection === item.id ? 'page' : undefined}
                  onClick={() => {
                    onSelectSection(item.id);
                    onClose();
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
                onClose();
                onOpenWizard(activeCategory);
              }}
              className="w-full py-2.5 bg-[#C59A52] text-[#182C28] text-xs font-semibold rounded-md"
            >
              + Create New Event
            </button>
            <button
              type="button"
              onClick={onReturnMarketing}
              className="w-full py-2 text-xs text-[#D8C9B8]"
            >
              Return to Marketing Site
            </button>
          </div>
        </aside>
      </div>
    );
  }
);

MobileNavigationDrawer.displayName = 'MobileNavigationDrawer';

interface WorkspaceHeaderProps {
  events: EventWorkspace[];
  activeEvent: EventWorkspace;
  activeSectionLabel: string;
  plannerName: string;
  searchQuery: string;
  searchResults: SearchResultItem[];
  notificationsOpen: boolean;
  profileMenuOpen: boolean;
  onOpenMobileMenu: () => void;
  onSelectEvent: (eventId: string) => void;
  onSearchChange: (q: string) => void;
  onSelectSearchResult: (section: WorkspaceSection) => void;
  onOpenCopilot: () => void;
  onToggleNotifications: () => void;
  onCloseNotifications: () => void;
  onToggleProfileMenu: () => void;
  onCloseProfileMenu: () => void;
  onNavigateSection: (section: WorkspaceSection) => void;
  onOpenWizard: (cat: EventCategory) => void;
  onReturnMarketing: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = React.memo(
  ({
    events,
    activeEvent,
    activeSectionLabel,
    plannerName,
    searchQuery,
    searchResults,
    notificationsOpen,
    profileMenuOpen,
    onOpenMobileMenu,
    onSelectEvent,
    onSearchChange,
    onSelectSearchResult,
    onOpenCopilot,
    onToggleNotifications,
    onCloseNotifications,
    onToggleProfileMenu,
    onCloseProfileMenu,
    onNavigateSection,
    onOpenWizard,
    onReturnMarketing,
  }) => (
    <header className="sticky top-0 z-30 bg-[#F5F0E8]/95 backdrop-blur border-b border-[#D8C9B8] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label="Open navigation drawer"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-md text-[#182C28] hover:bg-[#EAE2D6]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
          <select
            aria-label="Select active event"
            value={activeEvent.id}
            onChange={(e) => onSelectEvent(e.target.value)}
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
            {activeSectionLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative hidden md:block w-52 lg:w-64">
          <Search className="w-3.5 h-3.5 text-[#292A27]/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search milestones, vendors, budget, or ideas"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search milestones, vendors..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D8C9B8] rounded-md text-xs focus:outline-none focus:border-[#182C28]"
          />
          {searchResults.length > 0 && (
            <div
              role="listbox"
              aria-label="Search suggestions"
              className="absolute right-0 mt-1 w-72 bg-white border border-[#D8C9B8] rounded-md shadow-lg py-1.5 z-50"
            >
              {searchResults.map((res, i) => (
                <button
                  key={`${res.label}-${i}`}
                  type="button"
                  onClick={() => onSelectSearchResult(res.section)}
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

        <button
          type="button"
          onClick={onOpenCopilot}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#C59A52] hover:bg-[#d3a962] text-[#182C28] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Copilot</span>
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Open notifications"
            aria-expanded={notificationsOpen}
            aria-haspopup="menu"
            onClick={onToggleNotifications}
            className="p-2 rounded-md bg-white border border-[#D8C9B8] hover:border-[#182C28] text-[#182C28] cursor-pointer"
          >
            <Bell className="w-4 h-4" />
          </button>

          {notificationsOpen && (
            <div
              role="menu"
              aria-label="Studio notifications"
              className="absolute right-0 mt-2 w-80 bg-white border border-[#D8C9B8] rounded-lg shadow-lg p-4 z-50 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#F5F0E8] pb-2">
                <span className="text-xs font-semibold text-[#182C28]">
                  ELEGANTIA AI Studio Alerts
                </span>
                <button
                  type="button"
                  onClick={onCloseNotifications}
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
                        onCloseNotifications();
                        onNavigateSection('timeline');
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
                    onCloseNotifications();
                    onNavigateSection('budget');
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

        <div className="relative">
          <button
            type="button"
            aria-label="Open planner profile menu"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            onClick={onToggleProfileMenu}
            className="px-3 py-1.5 rounded-md bg-[#182C28] text-[#F5F0E8] text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{plannerName}</span>
          </button>

          {profileMenuOpen && (
            <div
              role="menu"
              aria-label="Planner profile options"
              className="absolute right-0 mt-2 w-56 bg-white border border-[#D8C9B8] rounded-lg shadow-lg p-3 z-50 space-y-2 text-xs"
            >
              <div className="border-b border-[#F5F0E8] pb-2">
                <p className="font-semibold text-[#182C28]">{plannerName}</p>
                <p className="text-[#292A27]/65">Principal Event Architect</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCloseProfileMenu();
                  onNavigateSection('settings');
                }}
                className="w-full text-left py-1.5 hover:text-[#A34E50] cursor-pointer"
              >
                Event & Profile Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseProfileMenu();
                  onOpenWizard(activeEvent.category);
                }}
                className="w-full text-left py-1.5 hover:text-[#A34E50] cursor-pointer"
              >
                + Create New Event
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseProfileMenu();
                  onReturnMarketing();
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
  )
);

WorkspaceHeader.displayName = 'WorkspaceHeader';

interface EventsPortfolioViewProps {
  events: EventWorkspace[];
  activeEvent: EventWorkspace;
  onOpenWizard: (cat: EventCategory) => void;
  onSelectEventStudio: (evt: EventWorkspace) => void;
}

export const EventsPortfolioView: React.FC<EventsPortfolioViewProps> = React.memo(
  ({ events, activeEvent, onOpenWizard, onSelectEventStudio }) => (
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
          onClick={() => onOpenWizard(activeEvent.category)}
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
                isCurrent ? 'border-2 border-[#182C28]' : 'border-[#D8C9B8]'
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
                    <span className="font-semibold" style={{ color: info.accentHex }}>
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
                  onClick={() => onSelectEventStudio(evt)}
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
  )
);

EventsPortfolioView.displayName = 'EventsPortfolioView';

interface WorkspaceSettingsViewProps {
  plannerName: string;
  activeEvent: EventWorkspace;
  onUpdatePlannerName: (name: string) => void;
  onUpdateActiveEvent: (evt: EventWorkspace) => void;
  onNotify: (msg: string) => void;
}

export const WorkspaceSettingsView: React.FC<WorkspaceSettingsViewProps> = React.memo(
  ({
    plannerName,
    activeEvent,
    onUpdatePlannerName,
    onUpdateActiveEvent,
    onNotify,
  }) => (
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
            onChange={(e) => onUpdatePlannerName(e.target.value)}
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
              onUpdateActiveEvent({
                ...activeEvent,
                name: sanitizeTextInput(e.target.value, 140),
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
              onUpdateActiveEvent({
                ...activeEvent,
                location: sanitizeTextInput(e.target.value, 140),
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
              onUpdateActiveEvent({
                ...activeEvent,
                date: nextDate,
                milestones: recalc,
              });
              onNotify(
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
              onUpdateActiveEvent({
                ...activeEvent,
                theme: sanitizeTextInput(e.target.value, 140),
              })
            }
            className="w-full px-3.5 py-2 bg-[#F5F0E8] border border-[#D8C9B8] rounded"
          />
        </div>
      </div>
    </div>
  )
);

WorkspaceSettingsView.displayName = 'WorkspaceSettingsView';
