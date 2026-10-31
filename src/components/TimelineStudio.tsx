import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Edit3,
  Plus,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  EventWorkspace,
  MilestonePriority,
  MilestoneStatus,
  TimelineMilestone,
} from '../types/event';
import { recalculateMilestoneDates } from '../utils/planningLogic';

interface TimelineStudioProps {
  event: EventWorkspace;
  onUpdateEvent: (updated: EventWorkspace) => void;
  onNotify: (msg: string) => void;
}

export const TimelineStudio: React.FC<TimelineStudioProps> = ({
  event,
  onUpdateEvent,
  onNotify,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | MilestoneStatus>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState(event.date);
  const [newPriority, setNewPriority] = useState<MilestonePriority>('High');
  const [newAssignee, setNewAssignee] = useState('Clara Vance');
  const [newPhase, setNewPhase] = useState('Production');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Changing the event date recalculates relevant milestone dates
  const handleEventDateChange = (nextEventDate: string) => {
    if (!nextEventDate || Number.isNaN(Date.parse(nextEventDate))) return;
    const recalculated = recalculateMilestoneDates(
      event.milestones,
      event.date,
      nextEventDate
    );
    onUpdateEvent({
      ...event,
      date: nextEventDate,
      milestones: recalculated,
    });
    onNotify(
      `Event date updated to ${nextEventDate}. Recalculated ${recalculated.length} chronological milestone dates.`
    );
  };

  const handleToggleComplete = (milestoneId: string) => {
    const next = event.milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      const nextStatus: MilestoneStatus =
        m.status === 'Completed' ? 'Upcoming' : 'Completed';
      return { ...m, status: nextStatus };
    });
    onUpdateEvent({ ...event, milestones: next });
    onNotify('Updated milestone completion state.');
  };

  const handleDelete = (milestoneId: string) => {
    const target = event.milestones.find((m) => m.id === milestoneId);
    const next = event.milestones.filter((m) => m.id !== milestoneId);
    onUpdateEvent({ ...event, milestones: next });
    if (target) onNotify(`Removed milestone "${target.title}".`);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const eventMs = Date.parse(`${event.date}T00:00:00Z`);
    const dueMs = Date.parse(`${newDueDate}T00:00:00Z`);
    const daysBeforeEvent =
      !Number.isNaN(eventMs) && !Number.isNaN(dueMs)
        ? Math.max(0, Math.round((eventMs - dueMs) / 86400000))
        : 14;

    const item: TimelineMilestone = {
      id: `ms-${Date.now()}`,
      title: newTitle.trim(),
      dueDate: newDueDate,
      daysBeforeEvent,
      priority: newPriority,
      status: 'Upcoming',
      assignee: newAssignee.trim() || 'Lead Planner',
      phase: newPhase.trim() || 'Operations',
    };

    const sorted = [...event.milestones, item].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    );
    onUpdateEvent({ ...event, milestones: sorted });
    setNewTitle('');
    setShowAddForm(false);
    onNotify(`Added milestone "${item.title}" due ${item.dueDate}.`);
  };

  const handleStartEdit = (m: TimelineMilestone) => {
    setEditingId(m.id);
    setEditAssignee(m.assignee);
    setEditDueDate(m.dueDate);
  };

  const handleSaveEdit = (mId: string) => {
    const eventMs = Date.parse(`${event.date}T00:00:00Z`);
    const dueMs = Date.parse(`${editDueDate}T00:00:00Z`);
    const daysBefore =
      !Number.isNaN(eventMs) && !Number.isNaN(dueMs)
        ? Math.max(0, Math.round((eventMs - dueMs) / 86400000))
        : 7;

    const next = event.milestones.map((m) =>
      m.id === mId
        ? {
            ...m,
            assignee: editAssignee.trim() || m.assignee,
            dueDate: editDueDate || m.dueDate,
            daysBeforeEvent: daysBefore,
          }
        : m
    );
    onUpdateEvent({ ...event, milestones: next });
    setEditingId(null);
    onNotify('Saved milestone reassignment and schedule update.');
  };

  const sortedMilestones = [...event.milestones].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  );
  const filtered =
    statusFilter === 'All'
      ? sortedMilestones
      : sortedMilestones.filter((m) => m.status === statusFilter);

  const overdueCount = event.milestones.filter((m) => m.status === 'Overdue').length;
  const completedCount = event.milestones.filter((m) => m.status === 'Completed').length;

  return (
    <div className="space-y-8">
      {/* Header & Dynamic Event Date Recalculation Control */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#F5F0E8] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
              Timeline Studio
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#182C28]">
              Chronological Milestones & Date Propagation
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#F5F0E8] px-3 py-1.5 rounded-md border border-[#D8C9B8]">
              <label
                htmlFor="master-event-date"
                className="text-xs font-semibold text-[#182C28] whitespace-nowrap"
              >
                Event Date (Auto-Shifts Milestones):
              </label>
              <input
                id="master-event-date"
                type="date"
                value={event.date}
                onChange={(e) => handleEventDateChange(e.target.value)}
                className="bg-white px-2.5 py-1 border border-[#D8C9B8] rounded text-xs font-mono tabular-nums text-[#182C28]"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#182C28] hover:bg-[#243f39] rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Milestone</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Status Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-[#EAE2D6] p-1 rounded-md">
            {(['All', 'Overdue', 'In Progress', 'Upcoming', 'Completed'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#182C28] text-[#F5F0E8]'
                      : 'text-[#292A27] hover:text-[#182C28]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <div className="text-xs text-[#292A27]/75 tabular-nums flex items-center gap-3">
            <span>
              Completed: <strong className="text-[#315B50]">{completedCount}</strong> /{' '}
              {event.milestones.length}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Overdue:{' '}
              <strong className={overdueCount > 0 ? 'text-[#A34E50]' : 'text-[#315B50]'}>
                {overdueCount}
              </strong>
            </span>
          </div>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddMilestone}
            className="p-4 bg-[#F5F0E8] rounded-md border border-[#D8C9B8] grid grid-cols-1 sm:grid-cols-6 gap-3"
          >
            <input
              type="text"
              required
              aria-label="Milestone Title"
              placeholder="Milestone description..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="sm:col-span-2 px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs"
            />
            <input
              type="date"
              required
              aria-label="Milestone Due Date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs font-mono"
            />
            <select
              aria-label="Milestone Priority"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as MilestonePriority)}
              className="px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <input
              type="text"
              aria-label="Milestone Assignee"
              placeholder="Assignee"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="px-3 py-2 bg-white border border-[#D8C9B8] rounded text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#182C28] text-white text-xs font-semibold rounded cursor-pointer"
            >
              Save Milestone
            </button>
          </form>
        )}
      </div>

      {/* Chronological Milestone List */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] divide-y divide-[#F5F0E8]">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="font-editorial text-xl text-[#182C28]">
              No milestones match the selected filter.
            </p>
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className="px-4 py-2 text-xs font-semibold text-[#182C28] border border-[#D8C9B8] rounded cursor-pointer"
            >
              Show All Milestones
            </button>
          </div>
        ) : (
          filtered.map((m) => {
            const isEditing = editingId === m.id;
            return (
              <div
                key={m.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F5F0E8]/35"
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    aria-label={
                      m.status === 'Completed'
                        ? `Mark "${m.title}" incomplete`
                        : `Complete "${m.title}"`
                    }
                    onClick={() => handleToggleComplete(m.id)}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                      m.status === 'Completed'
                        ? 'bg-[#315B50] border-[#315B50] text-white'
                        : 'bg-white border-[#D8C9B8] hover:border-[#182C28]'
                    }`}
                  >
                    {m.status === 'Completed' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <p
                      className={`text-sm font-semibold ${
                        m.status === 'Completed'
                          ? 'line-through text-[#292A27]/50'
                          : 'text-[#182C28]'
                      }`}
                    >
                      {m.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#292A27]/70">
                      <span
                        className={`font-semibold ${
                          m.status === 'Overdue'
                            ? 'text-[#A34E50]'
                            : m.status === 'Completed'
                            ? 'text-[#315B50]'
                            : 'text-[#182C28]'
                        }`}
                      >
                        {m.status}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Priority: {m.priority}</span>
                      <span aria-hidden="true">·</span>
                      <span>Phase: {m.phase}</span>
                      <span aria-hidden="true">·</span>
                      <span>Assignee: {m.assignee}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Due Date & Reassign/Reschedule Controls */}
                <div className="flex flex-wrap items-center gap-3 pl-8 lg:pl-0">
                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        aria-label="Edit Assignee"
                        value={editAssignee}
                        onChange={(e) => setEditAssignee(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-[#182C28] rounded text-xs"
                      />
                      <input
                        type="date"
                        aria-label="Reschedule Due Date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-[#182C28] rounded text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(m.id)}
                        className="px-3 py-1 bg-[#182C28] text-white text-xs font-semibold rounded cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs text-[#292A27]/70 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-right font-mono text-xs tabular-nums mr-2">
                        <span className="block font-semibold text-[#182C28]">{m.dueDate}</span>
                        <span className="text-[11px] text-[#292A27]/60">
                          {m.daysBeforeEvent}d before event
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(m)}
                        className="px-2.5 py-1 text-xs font-medium text-[#182C28] border border-[#D8C9B8] hover:border-[#182C28] rounded cursor-pointer"
                      >
                        Reassign / Reschedule
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete milestone "${m.title}"`}
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-[#292A27]/60 hover:text-[#A34E50] rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
