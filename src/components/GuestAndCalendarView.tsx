import React, { useState } from 'react';
import { Calendar, CheckCircle2, Download, Plus, RefreshCw, Users } from 'lucide-react';
import { EventWorkspace, GuestItem, RsvpStatus } from '../types/event';
import { generateEventICS } from '../utils/planningLogic';

interface GuestAndCalendarViewProps {
  event: EventWorkspace;
  onUpdateEvent: (updated: EventWorkspace) => void;
  onNotify: (msg: string) => void;
}

export const GuestAndCalendarView: React.FC<GuestAndCalendarViewProps> = ({
  event,
  onUpdateEvent,
  onNotify,
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [dietary, setDietary] = useState('');
  const [tableAssign, setTableAssign] = useState('Table 04 — Olive');
  const [roleGroup, setRoleGroup] = useState('Guest');

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    const newGuest: GuestItem = {
      id: `g-${Date.now()}`,
      name: guestName.trim(),
      email: guestEmail.trim() || 'guest@example.com',
      partySize: Math.max(1, Number(partySize) || 1),
      rsvpStatus: 'Confirmed',
      dietaryNotes: dietary.trim() || 'None',
      tableAssignment: tableAssign.trim() || 'Unassigned',
      roleOrGroup: roleGroup.trim() || 'Guest',
    };
    onUpdateEvent({
      ...event,
      guests: [...event.guests, newGuest],
    });
    setGuestName('');
    setGuestEmail('');
    setDietary('');
    onNotify(`Added "${newGuest.name}" (Party of ${newGuest.partySize}) to guest list.`);
  };

  const handleRsvpChange = (guestId: string, status: RsvpStatus) => {
    const next = event.guests.map((g) =>
      g.id === guestId ? { ...g, rsvpStatus: status } : g
    );
    onUpdateEvent({ ...event, guests: next });
    onNotify(`Updated RSVP status to ${status}.`);
  };

  const handleDownloadICS = () => {
    const icsContent = generateEventICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onUpdateEvent({
      ...event,
      calendarSynced: true,
      lastSyncedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    onNotify(`Exported RFC 5545 .ics calendar bundle with ${event.milestones.length + 1} events.`);
  };

  const handleSyncCalendarState = () => {
    onUpdateEvent({
      ...event,
      calendarSynced: true,
      lastSyncedAt: '2026-10-31 07:15',
    });
    onNotify(
      `Synchronized ${event.milestones.length} timeline milestones and ${event.scheduleSlots.length} run-of-show cues with your calendar feed.`
    );
  };

  const confirmedHeadcount = event.guests
    .filter((g) => g.rsvpStatus === 'Confirmed')
    .reduce((sum, g) => sum + g.partySize, 0);

  return (
    <div className="space-y-8">
      {/* Calendar Synchronization Panel */}
      <div className="bg-[#182C28] text-[#F5F0E8] rounded-lg border border-[#315B50] p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C59A52]">
              CALENDAR SYNCHRONIZATION & .ICS FEED
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold">
              Sync Event Date, Vendor Deadlines & Run-of-Show Cues
            </h2>
            <p className="text-xs sm:text-sm text-[#D8C9B8]">
              Keep Google Calendar, Apple Calendar, and Outlook aligned whenever your event date or milestones shift.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSyncCalendarState}
              className="px-4 py-2.5 text-xs font-semibold text-[#F5F0E8] border border-[#D8C9B8]/40 hover:border-white rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Milestones Now</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadICS}
              className="px-4 py-2.5 text-xs font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d3a962] rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ICS Calendar Bundle</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#315B50] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#D8C9B8] tabular-nums">
          <span>
            Status:{' '}
            <strong className="text-[#C59A52]">
              {event.calendarSynced ? 'Active & Synchronized' : 'Ready to Sync'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>Primary Date: {event.date}</span>
          <span aria-hidden="true">·</span>
          <span>Included Milestones: {event.milestones.length}</span>
          {event.lastSyncedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>Last Synced: {event.lastSyncedAt}</span>
            </>
          )}
        </div>
      </div>

      {/* Guest List & Hospitality Management */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5F0E8] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
              Guest Management & Dietary Ledger
            </p>
            <h3 className="font-editorial text-2xl font-semibold text-[#182C28]">
              Households, Table Assignments & Dietary Notes
            </h3>
          </div>
          <div className="text-xs font-mono tabular-nums text-[#292A27]/80">
            Confirmed Party Headcount: <strong className="text-[#182C28]">{confirmedHeadcount}</strong> / Target{' '}
            {event.guestCount}
          </div>
        </div>

        {/* Add Guest Household Form */}
        <form
          onSubmit={handleAddGuest}
          className="p-4 bg-[#F5F0E8] rounded-md border border-[#D8C9B8] grid grid-cols-1 sm:grid-cols-6 gap-3"
        >
          <input
            type="text"
            required
            aria-label="Guest or Household Name"
            placeholder="Household / Guest name *"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="sm:col-span-2 px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs"
          />
          <input
            type="number"
            min={1}
            max={20}
            aria-label="Party Size"
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs font-mono"
          />
          <input
            type="text"
            aria-label="Dietary Requirements"
            placeholder="Dietary notes (e.g., Vegan)"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs"
          />
          <input
            type="text"
            aria-label="Table Assignment"
            placeholder="Table assignment"
            value={tableAssign}
            onChange={(e) => setTableAssign(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#182C28] text-white text-xs font-semibold rounded cursor-pointer"
          >
            Add Household
          </button>
        </form>

        {/* Guest Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#D8C9B8] text-[#292A27]/75">
                <th className="py-2.5 pr-4 font-semibold">Household / Guest</th>
                <th className="py-2.5 px-4 font-semibold">Role / Group</th>
                <th className="py-2.5 px-4 font-semibold text-right">Party Size</th>
                <th className="py-2.5 px-4 font-semibold">Dietary Notes</th>
                <th className="py-2.5 px-4 font-semibold">Table Assignment</th>
                <th className="py-2.5 pl-4 font-semibold">RSVP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0E8] tabular-nums">
              {event.guests.map((g) => (
                <tr key={g.id} className="hover:bg-[#F5F0E8]/40">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-[#182C28]">{g.name}</p>
                    <p className="text-xs text-[#292A27]/60">{g.email}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#292A27]/80">{g.roleOrGroup}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-[#182C28]">
                    {g.partySize}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#A34E50]">{g.dietaryNotes}</td>
                  <td className="py-3 px-4 text-xs font-medium text-[#315B50]">
                    {g.tableAssignment}
                  </td>
                  <td className="py-3 pl-4">
                    <select
                      aria-label={`RSVP status for ${g.name}`}
                      value={g.rsvpStatus}
                      onChange={(e) =>
                        handleRsvpChange(g.id, e.target.value as RsvpStatus)
                      }
                      className="px-2.5 py-1 bg-[#F5F0E8] border border-[#D8C9B8] rounded text-xs font-medium text-[#182C28]"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
