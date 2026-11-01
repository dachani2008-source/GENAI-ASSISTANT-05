import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  CeremonySlot,
  CommunityOperationItem,
  EventWorkspace,
  WorkspaceSection,
} from '../types/event';
import { BIRTHDAY_THEMES } from '../data/seedEvents';
import {
  calculateBudgetSummary,
  formatCurrency,
  getDaysUntilEvent,
} from '../utils/planningLogic';
import { EditorialVisual } from './EditorialVisuals';

interface CategoryStudioViewProps {
  event: EventWorkspace;
  onUpdateEvent: (updated: EventWorkspace) => void;
  onNavigate: (section: WorkspaceSection) => void;
  onNotify: (msg: string) => void;
}

export const CategoryStudioView: React.FC<CategoryStudioViewProps> = ({
  event,
  onUpdateEvent,
  onNavigate,
  onNotify,
}) => {
  const [newSlot, setNewSlot] = useState({
    time: '20:00',
    title: '',
    location: '',
    lead: '',
    notes: '',
  });
  const [showSlotForm, setShowSlotForm] = useState(false);

  const daysLeft = getDaysUntilEvent(event.date);
  const budgetSummary = calculateBudgetSummary(event.totalBudget, event.budgetCategories);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.title.trim()) return;
    const slot: CeremonySlot = {
      id: `slot-${Date.now()}`,
      time: newSlot.time,
      title: newSlot.title.trim(),
      location: newSlot.location.trim() || event.venueType,
      lead: newSlot.lead.trim() || 'Coordinator',
      notes: newSlot.notes.trim(),
    };
    const updatedSlots = [...event.scheduleSlots, slot].sort((a, b) =>
      a.time.localeCompare(b.time)
    );
    onUpdateEvent({ ...event, scheduleSlots: updatedSlots });
    setNewSlot({ time: '20:00', title: '', location: '', lead: '', notes: '' });
    setShowSlotForm(false);
    onNotify(`Added "${slot.title}" to the run-of-show schedule.`);
  };

  const handleSelectBirthdayTheme = (themeId: string) => {
    const chosen = BIRTHDAY_THEMES.find((t) => t.id === themeId);
    if (!chosen) return;
    onUpdateEvent({
      ...event,
      selectedBirthdayThemeId: chosen.id,
      theme: chosen.name,
      style: chosen.tagline,
    });
    onNotify(`Applied birthday theme "${chosen.name}".`);
  };

  const handleCycleCommunityStatus = (itemId: string) => {
    if (!event.communityOperations) return;
    const order: CommunityOperationItem['status'][] = ['In Review', 'Action Needed', 'Cleared'];
    const nextOps = event.communityOperations.map((item) => {
      if (item.id !== itemId) return item;
      const nextStatus = order[(order.indexOf(item.status) + 1) % order.length];
      return { ...item, status: nextStatus };
    });
    onUpdateEvent({ ...event, communityOperations: nextOps });
    onNotify('Updated operational clearance status.');
  };

  // ============================================================================
  // 8. WEDDING STUDIO
  // ============================================================================
  if (event.category === 'wedding') {
    return (
      <div className="space-y-8">
        {/* Luxurious Deep Evergreen & Burgundy Wedding Banner */}
        <div className="bg-[#182C28] text-[#F5F0E8] rounded-lg border border-[#315B50] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C59A52]">
                  <span>WEDDING STUDIO</span>
                  <span aria-hidden="true">·</span>
                  <span>BURGUNDY & CHAMPAGNE ARCHIVE</span>
                </div>
                <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#F5F0E8]">
                  {event.name}
                </h2>
                <p className="text-sm text-[#D8C9B8] leading-relaxed">
                  {event.style} — {event.theme}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#315B50] text-xs tabular-nums">
                <div>
                  <span className="text-[#D8C9B8] block">Countdown</span>
                  <span className="font-mono text-lg font-semibold text-[#C59A52]">
                    {daysLeft} Days
                  </span>
                </div>
                <div>
                  <span className="text-[#D8C9B8] block">Hospitality Scale</span>
                  <span className="font-mono text-lg font-semibold text-[#F5F0E8]">
                    {event.guestCount} Guests
                  </span>
                </div>
                <div>
                  <span className="text-[#D8C9B8] block">Wedding Budget</span>
                  <span className="font-mono text-lg font-semibold text-[#F5F0E8]">
                    {formatCurrency(event.totalBudget, event.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[#D8C9B8] block">Contracted Vendors</span>
                  <span className="font-mono text-lg font-semibold text-[#F5F0E8]">
                    {event.vendors.filter((v) => v.bookingStatus === 'Contracted').length} /{' '}
                    {event.vendors.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <EditorialVisual
                preset="wedding-courtyard"
                aspectRatio="4:3"
                caption={event.venueType}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>

        {/* Ceremony Schedule & Run of Show */}
        <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5F0E8] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A34E50]">
                Ceremony & Reception Run-of-Show
              </p>
              <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
                Chronological Wedding Day Cues
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowSlotForm((v) => !v)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#A34E50] hover:bg-[#8d4143] rounded-md flex items-center gap-1.5 self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Schedule Cue</span>
            </button>
          </div>

          {showSlotForm && (
            <form
              onSubmit={handleAddSlot}
              className="p-4 bg-[#F5F0E8] rounded-md border border-[#D8C9B8] grid grid-cols-1 sm:grid-cols-5 gap-3"
            >
              <input
                type="time"
                aria-label="Cue Time"
                value={newSlot.time}
                onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                className="px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs font-mono"
              />
              <input
                type="text"
                aria-label="Cue Title"
                placeholder="Cue title (e.g., First Dance)"
                value={newSlot.title}
                onChange={(e) => setNewSlot({ ...newSlot, title: e.target.value })}
                className="sm:col-span-2 px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs"
              />
              <input
                type="text"
                aria-label="LocationZone"
                placeholder="Zone (e.g., Orangerie)"
                value={newSlot.location}
                onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })}
                className="px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#182C28] text-[#F5F0E8] text-xs font-semibold rounded cursor-pointer"
              >
                Save Cue
              </button>
            </form>
          )}

          <div className="divide-y divide-[#F5F0E8]">
            {event.scheduleSlots.map((slot) => (
              <div
                key={slot.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-sm font-semibold text-[#A34E50] tabular-nums w-14 shrink-0">
                    {slot.time}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#182C28]">{slot.title}</p>
                    <p className="text-xs text-[#292A27]/70">
                      {slot.location} · Lead: {slot.lead}
                      {slot.notes ? ` · ${slot.notes}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dedicated Wedding Domain Grid: Venue, Photography, Catering, Floral & Guest Hospitality */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              kicker: 'Venue & Architecture',
              title: event.venueType,
              detail: `${event.location} · Exclusivity locked. Includes limestone north forecourt and heated glass orangerie.`,
              status: 'Contracted · Load-in 09:00',
              targetSection: 'vendors' as WorkspaceSection,
            },
            {
              kicker: 'Editorial Photography & 16mm',
              title: 'Documentary & Archival Film',
              detail: 'Golden-hour courtyard portrait window scheduled at 15:45 prior to candlelit vows.',
              status: '2 Photographers + Super 8',
              targetSection: 'vendors' as WorkspaceSection,
            },
            {
              kicker: 'Culinary & Sommelier',
              title: event.foodPreference,
              detail: 'Raw bar aperitivo on the West Loggia followed by four plated seasonal harvest courses.',
              status: `${event.guestCount} Covers Planned`,
              targetSection: 'budget' as WorkspaceSection,
            },
            {
              kicker: 'Decoration & Floral Planning',
              title: 'Ikebana Burgundy & Brass Tapers',
              detail: '8 ceremony cypress urns repurpose to the Orangerie dining hall during cocktail hour.',
              status: '180 Antique Brass Tapers',
              targetSection: 'ideas' as WorkspaceSection,
            },
            {
              kicker: 'Guest Arrangements',
              title: 'Seating & Dietary Matrix',
              detail: `${event.guests.filter((g) => g.rsvpStatus === 'Confirmed').length} households confirmed. Bilingual French/English ceremony booklets.`,
              status: 'Manage RSVPs & Tables',
              targetSection: 'guests' as WorkspaceSection,
            },
            {
              kicker: 'Wedding Budget & Variance',
              title: `${formatCurrency(budgetSummary.spent, event.currency)} Committed`,
              detail: `${formatCurrency(budgetSummary.remainingToSpend, event.currency)} remaining out of ${formatCurrency(event.totalBudget, event.currency)} total ceiling.`,
              status: 'Open Smart Budget Studio',
              targetSection: 'budget' as WorkspaceSection,
            },
          ].map((pillar) => (
            <div
              key={pillar.kicker}
              className="bg-white rounded-lg border border-[#D8C9B8] p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#A34E50]">{pillar.kicker}</p>
                <h4 className="font-editorial text-xl font-semibold text-[#182C28]">
                  {pillar.title}
                </h4>
                <p className="text-xs text-[#292A27]/80 leading-relaxed">{pillar.detail}</p>
              </div>
              <div className="pt-3 border-t border-[#F5F0E8] flex items-center justify-between text-xs">
                <span className="text-[#315B50] font-medium">{pillar.status}</span>
                <button
                  type="button"
                  onClick={() => onNavigate(pillar.targetSection)}
                  className="font-semibold text-[#182C28] hover:text-[#A34E50] cursor-pointer"
                >
                  Inspect →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Wedding Inspiration Board with Consistent 4:3 Image Ratios */}
        <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A34E50]">
                Curated Scenography Board
              </p>
              <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
                Wedding Visual Direction & Material Palette
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ideas')}
              className="text-xs font-semibold text-[#A34E50] hover:underline cursor-pointer"
            >
              Open Full Idea Studio →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <EditorialVisual
                preset="wedding-courtyard"
                aspectRatio="4:3"
                caption="Courtyard Lantern & Cypress Processional"
                className="rounded-md border border-[#D8C9B8]"
              />
              <p className="text-xs text-[#292A27]/75">
                Limestone architecture warmed by 2400K candlelight and evergreen cypress columns.
              </p>
            </div>
            <div className="space-y-2">
              <EditorialVisual
                preset="floral-tablescape"
                aspectRatio="4:3"
                caption="Burgundy Dahlia Ikebana & Cotton Menu"
                className="rounded-md border border-[#D8C9B8]"
              />
              <p className="text-xs text-[#292A27]/75">
                Low kenzan floral arrangements preserve effortless cross-table conversation.
              </p>
            </div>
            <div className="space-y-2">
              <EditorialVisual
                preset="invitation-suite"
                aspectRatio="4:3"
                caption="600gsm Archival Letterpress & Wax Monogram"
                className="rounded-md border border-[#D8C9B8]"
              />
              <p className="text-xs text-[#292A27]/75">
                Blind-debossed cotton paper suites with burgundy botanical wax seals.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 9. BIRTHDAY STUDIO
  // ============================================================================
  if (event.category === 'birthday') {
    const activeTheme =
      BIRTHDAY_THEMES.find((t) => t.id === event.selectedBirthdayThemeId) ||
      BIRTHDAY_THEMES[0];

    return (
      <div className="space-y-8">
        {/* Energetic & Refined Coral/Marigold Birthday Banner */}
        <div className="bg-[#182C28] text-[#F5F0E8] rounded-lg border border-[#315B50] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#D77C50]">
                  <span>BIRTHDAY STUDIO</span>
                  <span aria-hidden="true">·</span>
                  <span>CORAL & MARIGOLD EDITION</span>
                </div>
                <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#F5F0E8]">
                  {event.name}
                </h2>
                <p className="text-sm text-[#D8C9B8] leading-relaxed">
                  Active Theme: <strong className="text-white">{activeTheme.name}</strong> —{' '}
                  {activeTheme.tagline}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#315B50] text-xs tabular-nums">
                <div>
                  <span className="text-[#D8C9B8] block">Countdown</span>
                  <span className="font-mono text-lg font-semibold text-[#D77C50]">
                    {daysLeft} Days
                  </span>
                </div>
                <div>
                  <span className="text-[#D8C9B8] block">Guest List</span>
                  <span className="font-mono text-lg font-semibold text-[#F5F0E8]">
                    {event.guestCount} Guests
                  </span>
                </div>
                <div>
                  <span className="text-[#D8C9B8] block">Celebration Budget</span>
                  <span className="font-mono text-lg font-semibold text-[#F5F0E8]">
                    {formatCurrency(event.totalBudget, event.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[#D8C9B8] block">Return Gifts</span>
                  <span className="font-mono text-lg font-semibold text-[#C59A52]">
                    {event.guestCount} Units
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <EditorialVisual
                preset="birthday-loft"
                aspectRatio="4:3"
                caption={event.venueType}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>

        {/* Interactive Visual Theme-Selection Experience */}
        <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D77C50]">
              Interactive Party Theme Selector
            </p>
            <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
              Select a Curated Celebration Atmosphere
            </h3>
            <p className="text-xs sm:text-sm text-[#292A27]/75">
              Choosing a theme updates your cake architecture, table decor, entertainment brief, and return-gift curation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {BIRTHDAY_THEMES.map((theme) => {
              const isSelected = activeTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectBirthdayTheme(theme.id)}
                  className={`text-left p-5 rounded-lg border transition-all flex flex-col justify-between space-y-4 cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF6F0] border-2 border-[#D77C50]'
                      : 'bg-white border-[#D8C9B8] hover:border-[#182C28]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {theme.palette.map((hex) => (
                          <span
                            key={hex}
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[#D77C50]">
                        {isSelected ? 'Active Theme' : 'Apply Theme'}
                      </span>
                    </div>
                    <h4 className="font-editorial text-xl font-semibold text-[#182C28]">
                      {theme.name}
                    </h4>
                    <p className="text-xs text-[#292A27]/80 leading-relaxed">{theme.tagline}</p>
                  </div>

                  <div className="pt-3 border-t border-[#EAE2D6] space-y-1 text-xs text-[#292A27]/75">
                    <p>
                      <strong className="text-[#182C28]">Cake:</strong> {theme.cakeStyle}
                    </p>
                    <p>
                      <strong className="text-[#182C28]">Return Gift:</strong> {theme.returnGiftIdea}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Birthday Studio Modules: Cake, Decor, Food, Entertainment, Games & Return Gifts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              kicker: 'Cake Planning',
              title: 'Artisanal Tiered Centerpiece',
              body: activeTheme.cakeStyle,
              meta: 'Pâtisserie Serein · Tasting Confirmed',
            },
            {
              kicker: 'Decoration & Scenography',
              title: 'Loft Plinths & Botanicals',
              body: activeTheme.decorFocus,
              meta: 'Warm Coral & Marigold Palette',
            },
            {
              kicker: 'Food & Refreshments',
              title: event.foodPreference,
              body: 'Welcome Blood Orange Spritz tower followed by three waves of coastal Mediterranean shared platters.',
              meta: `${event.guestCount} Seated Places`,
            },
            {
              kicker: 'Entertainment & Sound',
              title: 'Audiophile Vinyl & Live Set',
              body: activeTheme.entertainment,
              meta: 'Klipsch Rotary Mixer Setup',
            },
            {
              kicker: 'Games & Interactive Activities',
              title: 'Analog Polaroid & Toast Salon',
              body: 'Medium-format instant portrait station with linen guestbook and curated 3-speaker tribute sequence.',
              meta: '21:00 Toast Cue',
            },
            {
              kicker: 'Return Gifts',
              title: 'Bespoke Departure Keepsakes',
              body: activeTheme.returnGiftIdea,
              meta: `${event.guestCount} Custom Numbered Bottles`,
            },
          ].map((card) => (
            <div
              key={card.kicker}
              className="bg-white rounded-lg border border-[#D8C9B8] p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#D77C50]">{card.kicker}</p>
                <h4 className="font-editorial text-xl font-semibold text-[#182C28]">
                  {card.title}
                </h4>
                <p className="text-xs text-[#292A27]/80 leading-relaxed">{card.body}</p>
              </div>
              <p className="pt-3 border-t border-[#F5F0E8] text-xs font-medium text-[#315B50]">
                {card.meta}
              </p>
            </div>
          ))}
        </div>

        {/* Party Schedule */}
        <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-4">
          <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
            Evening Party Schedule
          </h3>
          <div className="divide-y divide-[#F5F0E8]">
            {event.scheduleSlots.map((slot) => (
              <div
                key={slot.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold text-[#D77C50] tabular-nums w-14">
                    {slot.time}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#182C28]">{slot.title}</p>
                    <p className="text-xs text-[#292A27]/70">
                      {slot.location} · {slot.notes}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#315B50] font-medium">{slot.lead}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 10. COMMUNITY OPERATIONS STUDIO
  // ============================================================================
  const opsList = event.communityOperations || [];

  return (
    <div className="space-y-8">
      {/* Operational Evergreen, Teal & Copper Banner */}
      <div className="bg-[#182C28] text-[#F5F0E8] rounded-lg border border-[#315B50] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#397D85]">
                <span>COMMUNITY OPERATIONS STUDIO</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#C59A52]">CIVIC & PRODUCTION CONTROL</span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#F5F0E8]">
                {event.name}
              </h2>
              <p className="text-sm text-[#D8C9B8] leading-relaxed">
                {event.venueType} · {event.location} — {event.specialRequirements}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#315B50] text-xs tabular-nums">
              <div>
                <span className="text-[#D8C9B8] block">Days to Load-In</span>
                <span className="font-mono text-lg font-semibold text-[#C59A52]">
                  {daysLeft} Days
                </span>
              </div>
              <div>
                <span className="text-[#D8C9B8] block">Registered Capacity</span>
                <span className="font-mono text-lg font-semibold text-[#F5F0E8]">
                  {event.guestCount} Attendees
                </span>
              </div>
              <div>
                <span className="text-[#D8C9B8] block">Permits & Safety</span>
                <span className="font-mono text-lg font-semibold text-[#F5F0E8]">
                  {opsList.filter((o) => o.status === 'Cleared').length} / {opsList.length} Cleared
                </span>
              </div>
              <div>
                <span className="text-[#D8C9B8] block">Production Budget</span>
                <span className="font-mono text-lg font-semibold text-[#F5F0E8]">
                  {formatCurrency(event.totalBudget, event.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <EditorialVisual
              preset="community-pavilion"
              aspectRatio="4:3"
              caption={event.venueType}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>

      {/* Structured Operational Matrix: Permits, Volunteers, Stage, Equipment, Sponsorship & Safety */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] overflow-hidden">
        <div className="px-6 py-4 bg-[#EAE2D6] border-b border-[#D8C9B8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#397D85]">
              Command & Compliance Ledger
            </p>
            <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
              Venue Permits, Volunteer Shifts, Stage AV, Sponsorship & Safety Checklist
            </h3>
          </div>
          <span className="text-xs text-[#292A27]/70">
            Click any status cell to cycle operational sign-off
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#D8C9B8] bg-[#F5F0E8]/60 text-[#292A27]/75">
                <th className="py-3 px-4 font-semibold">Operational Domain</th>
                <th className="py-3 px-4 font-semibold">Item & Specification</th>
                <th className="py-3 px-4 font-semibold">Owner</th>
                <th className="py-3 px-4 font-semibold">Window</th>
                <th className="py-3 px-4 font-semibold">Clearance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0E8]">
              {opsList.map((op) => (
                <tr key={op.id} className="hover:bg-[#F5F0E8]/40">
                  <td className="py-3.5 px-4 font-semibold text-[#397D85] whitespace-nowrap">
                    {op.domain}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-[#182C28]">{op.item}</p>
                    <p className="text-xs text-[#292A27]/70">{op.details}</p>
                  </td>
                  <td className="py-3.5 px-4 text-[#292A27] whitespace-nowrap">{op.owner}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#292A27] whitespace-nowrap tabular-nums">
                    {op.scheduleWindow}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleCycleCommunityStatus(op.id)}
                      className={`text-xs font-semibold underline-offset-4 hover:underline cursor-pointer ${
                        op.status === 'Cleared'
                          ? 'text-[#315B50]'
                          : op.status === 'Action Needed'
                          ? 'text-[#A34E50]'
                          : 'text-[#C59A52]'
                      }`}
                    >
                      {op.status} ↻
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-[#D8C9B8]">
          {opsList.map((op) => (
            <div key={op.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#397D85]">{op.domain}</span>
                <button
                  type="button"
                  onClick={() => handleCycleCommunityStatus(op.id)}
                  className="font-semibold text-[#182C28] underline"
                >
                  {op.status} ↻
                </button>
              </div>
              <p className="text-sm font-semibold text-[#182C28]">{op.item}</p>
              <p className="text-xs text-[#292A27]/75">{op.details}</p>
              <p className="text-xs text-[#292A27]/65 font-mono">
                Owner: {op.owner} · {op.scheduleWindow}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Management & Activity Schedule */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#397D85]">
              Stage Management & Event-Day Operations
            </p>
            <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
              Master Activity & Run-Sheet Schedule
            </h3>
          </div>
        </div>
        <div className="divide-y divide-[#F5F0E8]">
          {event.scheduleSlots.map((slot) => (
            <div
              key={slot.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-start gap-4">
                <span className="font-mono text-sm font-semibold text-[#397D85] tabular-nums w-14 shrink-0">
                  {slot.time}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#182C28]">{slot.title}</p>
                  <p className="text-xs text-[#292A27]/70">
                    {slot.location} · {slot.notes}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-[#315B50] shrink-0">{slot.lead}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
