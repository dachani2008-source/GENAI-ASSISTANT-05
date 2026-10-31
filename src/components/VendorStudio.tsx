import React, { useState } from 'react';
import { ArrowUpDown, Check, Plus, Scale, X } from 'lucide-react';
import {
  BookingStatus,
  EventCategory,
  EventWorkspace,
  PaymentStatus,
  VendorItem,
} from '../types/event';
import { compareVendorQuotations, formatCurrency } from '../utils/planningLogic';

interface VendorStudioProps {
  event: EventWorkspace;
  onUpdateEvent: (updated: EventWorkspace) => void;
  onNotify: (msg: string) => void;
}

const VENDOR_CATEGORIES_BY_EVENT: Record<EventCategory, string[]> = {
  wedding: [
    'Venue & Architecture',
    'Catering & Sommelier',
    'Floral & Scenography',
    'Photography & Film',
    'Strings & Sound',
    'Stationery & Calligraphy',
  ],
  birthday: [
    'Loft Venue',
    'Cake & Dessert',
    'Catering & Craft Bar',
    'Vinyl DJ & Sound',
    'Botanical Decor',
    'Return Gifts',
  ],
  community: [
    'Stage & AV Equipment',
    'Community Catering',
    'Permits & Security',
    'Wayfinding & Signage',
    'Medical & Safety',
    'Photography & Press',
  ],
};

export const VendorStudio: React.FC<VendorStudioProps> = ({
  event,
  onUpdateEvent,
  onNotify,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);

  const defaultCategories = VENDOR_CATEGORIES_BY_EVENT[event.category];

  const [formState, setFormState] = useState<{
    name: string;
    category: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    quotation: string;
    bookingStatus: BookingStatus;
    paymentStatus: PaymentStatus;
    inclusions: string;
    notes: string;
  }>({
    name: '',
    category: defaultCategories[0],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    quotation: '4500',
    bookingStatus: 'Quoted',
    paymentStatus: 'Unpaid',
    inclusions: 'Full day service, On-site lead',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormState({
      name: '',
      category: defaultCategories[0],
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      quotation: '4500',
      bookingStatus: 'Quoted',
      paymentStatus: 'Unpaid',
      inclusions: 'Primary package, Delivery & setup',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v: VendorItem) => {
    setEditingVendor(v);
    setFormState({
      name: v.name,
      category: v.category,
      contactName: v.contactName,
      contactEmail: v.contactEmail,
      contactPhone: v.contactPhone,
      quotation: String(v.quotation),
      bookingStatus: v.bookingStatus,
      paymentStatus: v.paymentStatus,
      inclusions: v.inclusions.join(', '),
      notes: v.notes,
    });
    setShowModal(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const payload: VendorItem = {
      id: editingVendor ? editingVendor.id : `v-${Date.now()}`,
      name: formState.name.trim(),
      category: formState.category,
      contactName: formState.contactName.trim() || 'Primary Coordinator',
      contactEmail: formState.contactEmail.trim() || 'contact@vendor.example',
      contactPhone: formState.contactPhone.trim() || '+1 (555) 010-9900',
      quotation: Math.max(0, Math.round(Number(formState.quotation) || 0)),
      bookingStatus: formState.bookingStatus,
      paymentStatus: formState.paymentStatus,
      inclusions: formState.inclusions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      notes: formState.notes.trim(),
    };

    const nextVendors = editingVendor
      ? event.vendors.map((v) => (v.id === editingVendor.id ? payload : v))
      : [...event.vendors, payload];

    onUpdateEvent({ ...event, vendors: nextVendors });
    setShowModal(false);
    onNotify(
      editingVendor
        ? `Updated vendor record for "${payload.name}".`
        : `Added vendor "${payload.name}" to your roster.`
    );
  };

  const handleUpdateBookingStatus = (vendorId: string, status: BookingStatus) => {
    const next = event.vendors.map((v) =>
      v.id === vendorId ? { ...v, bookingStatus: status } : v
    );
    onUpdateEvent({ ...event, vendors: next });
    onNotify(`Updated booking status to ${status}.`);
  };

  const handleUpdatePaymentStatus = (vendorId: string, status: PaymentStatus) => {
    const next = event.vendors.map((v) =>
      v.id === vendorId ? { ...v, paymentStatus: status } : v
    );
    onUpdateEvent({ ...event, vendors: next });
    onNotify(`Updated payment status to ${status}.`);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allCategories = Array.from(
    new Set([...defaultCategories, ...event.vendors.map((v) => v.category)])
  );

  const visibleVendors =
    categoryFilter === 'All'
      ? event.vendors
      : event.vendors.filter((v) => v.category === categoryFilter);

  const comparedVendors = event.vendors.filter((v) => compareIds.includes(v.id));
  const comparisonStats = compareVendorQuotations(
    comparedVendors.length >= 2 ? comparedVendors : visibleVendors
  );

  return (
    <div className="space-y-8">
      {/* Header & Category Controls */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5F0E8] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
              Vendor Studio ({event.category.toUpperCase()} MODE)
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#182C28]">
              Vendor Roster, Quotations & Contract Tracking
            </h2>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#182C28] hover:bg-[#243f39] rounded-md flex items-center gap-1.5 self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', ...allCategories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#182C28] text-[#F5F0E8]'
                  : 'bg-[#F5F0E8] text-[#292A27] hover:bg-[#EAE2D6]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quotation Benchmark Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs tabular-nums">
          <div className="p-3.5 bg-[#F5F0E8] rounded border border-[#D8C9B8]">
            <span className="text-[#292A27]/65 block">Contracted Commitments</span>
            <span className="font-mono text-lg font-semibold text-[#182C28]">
              {formatCurrency(
                event.vendors
                  .filter((v) => v.bookingStatus === 'Contracted')
                  .reduce((s, v) => s + v.quotation, 0),
                event.currency
              )}
            </span>
          </div>
          <div className="p-3.5 bg-[#F5F0E8] rounded border border-[#D8C9B8]">
            <span className="text-[#292A27]/65 block">Average Quotation in View</span>
            <span className="font-mono text-lg font-semibold text-[#315B50]">
              {formatCurrency(comparisonStats.averageQuote, event.currency)}
            </span>
          </div>
          <div className="p-3.5 bg-[#F5F0E8] rounded border border-[#D8C9B8]">
            <span className="text-[#292A27]/65 block">Quotation Spread (High vs Low)</span>
            <span className="font-mono text-lg font-semibold text-[#A34E50]">
              {formatCurrency(comparisonStats.spreadAmount, event.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Quotation Comparison Panel (when 2+ vendors selected) */}
      {comparedVendors.length >= 2 && (
        <div className="bg-[#182C28] text-[#F5F0E8] rounded-lg border border-[#315B50] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#315B50] pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#C59A52]" />
              <h3 className="font-editorial text-xl font-semibold">
                Side-by-Side Quotation Comparison ({comparedVendors.length} Selected)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="text-xs text-[#D8C9B8] hover:text-white underline cursor-pointer"
            >
              Clear Comparison
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 tabular-nums">
            {comparedVendors.map((v) => {
              const isLowest = v.id === comparisonStats.lowestQuoteId;
              return (
                <div
                  key={v.id}
                  className="p-4 rounded bg-[#12221F] border border-[#315B50] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-[#F5F0E8]">{v.name}</p>
                      <p className="text-xs text-[#D8C9B8]">{v.category}</p>
                    </div>
                    <span className="font-mono text-base font-semibold text-[#C59A52]">
                      {formatCurrency(v.quotation, event.currency)}
                    </span>
                  </div>
                  {isLowest && (
                    <p className="text-[11px] text-[#C59A52] font-semibold">
                      Lowest Quotation in Selection
                    </p>
                  )}
                  <p className="text-xs text-[#D8C9B8]">
                    Inclusions: {v.inclusions.join(' · ') || 'Standard package'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Structured Desktop Table & Mobile List */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#D8C9B8] bg-[#EAE2D6]/60 text-[#292A27]/80">
                <th className="py-3 px-4 font-semibold">Compare</th>
                <th className="py-3 px-4 font-semibold">Vendor Name & Notes</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Contact</th>
                <th className="py-3 px-4 font-semibold text-right">Quotation</th>
                <th className="py-3 px-4 font-semibold">Booking Status</th>
                <th className="py-3 px-4 font-semibold">Payment Status</th>
                <th className="py-3 px-4 font-semibold text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0E8] tabular-nums">
              {visibleVendors.map((v) => {
                const isCompared = compareIds.includes(v.id);
                return (
                  <tr key={v.id} className="hover:bg-[#F5F0E8]/40">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        aria-label={`Compare quotation for ${v.name}`}
                        checked={isCompared}
                        onChange={() => toggleCompare(v.id)}
                        className="w-4 h-4 accent-[#182C28] cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#182C28]">{v.name}</p>
                      <p className="text-xs text-[#292A27]/65">
                        {v.inclusions.slice(0, 3).join(' · ')}
                        {v.notes ? ` — ${v.notes}` : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#315B50] whitespace-nowrap">
                      {v.category}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#292A27]">
                      <p className="font-medium">{v.contactName}</p>
                      <p className="text-[#292A27]/65">{v.contactPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#182C28]">
                      {formatCurrency(v.quotation, event.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Booking status for ${v.name}`}
                        value={v.bookingStatus}
                        onChange={(e) =>
                          handleUpdateBookingStatus(v.id, e.target.value as BookingStatus)
                        }
                        className="px-2 py-1 bg-[#F5F0E8] border border-[#D8C9B8] rounded text-xs font-medium text-[#182C28]"
                      >
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Quoted">Quoted</option>
                        <option value="Contracted">Contracted</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Payment status for ${v.name}`}
                        value={v.paymentStatus}
                        onChange={(e) =>
                          handleUpdatePaymentStatus(v.id, e.target.value as PaymentStatus)
                        }
                        className="px-2 py-1 bg-[#F5F0E8] border border-[#D8C9B8] rounded text-xs font-medium text-[#182C28]"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Deposit Paid">Deposit Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid in Full">Paid in Full</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(v)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#182C28] border border-[#D8C9B8] hover:border-[#182C28] rounded cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-[#D8C9B8]">
          {visibleVendors.map((v) => (
            <div key={v.id} className="p-4 space-y-3 tabular-nums">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#182C28]">{v.name}</p>
                  <p className="text-xs text-[#315B50]">{v.category}</p>
                </div>
                <span className="font-mono text-sm font-semibold text-[#182C28]">
                  {formatCurrency(v.quotation, event.currency)}
                </span>
              </div>
              <p className="text-xs text-[#292A27]/75">
                {v.contactName} · {v.contactPhone}
              </p>
              {v.notes && <p className="text-xs text-[#292A27]/65">{v.notes}</p>}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <select
                  aria-label={`Mobile booking status for ${v.name}`}
                  value={v.bookingStatus}
                  onChange={(e) =>
                    handleUpdateBookingStatus(v.id, e.target.value as BookingStatus)
                  }
                  className="px-2.5 py-1.5 bg-[#F5F0E8] border border-[#D8C9B8] rounded text-xs"
                >
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Quoted">Quoted</option>
                  <option value="Contracted">Contracted</option>
                  <option value="Declined">Declined</option>
                </select>
                <select
                  aria-label={`Mobile payment status for ${v.name}`}
                  value={v.paymentStatus}
                  onChange={(e) =>
                    handleUpdatePaymentStatus(v.id, e.target.value as PaymentStatus)
                  }
                  className="px-2.5 py-1.5 bg-[#F5F0E8] border border-[#D8C9B8] rounded text-xs"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Deposit Paid">Deposit Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid in Full">Paid in Full</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-[#292A27]">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(v.id)}
                    onChange={() => toggleCompare(v.id)}
                  />
                  <span>Compare quotation</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(v)}
                  className="text-xs font-semibold text-[#182C28] underline"
                >
                  Edit vendor
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Vendor Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-[#F5F0E8] border border-[#D8C9B8] rounded-lg overflow-hidden my-8">
            <div className="bg-[#182C28] text-[#F5F0E8] px-5 py-4 flex items-center justify-between">
              <h3 id="vendor-modal-title" className="font-editorial text-xl font-semibold">
                {editingVendor ? `Edit ${editingVendor.name}` : 'Add Vendor to Roster'}
              </h3>
              <button
                type="button"
                aria-label="Close vendor modal"
                onClick={() => setShowModal(false)}
                className="text-[#D8C9B8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveVendor} className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="v-name" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Vendor Name *
                  </label>
                  <input
                    id="v-name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded"
                  />
                </div>
                <div>
                  <label htmlFor="v-cat" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Category
                  </label>
                  <select
                    id="v-cat"
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="v-quote" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Quotation ({event.currency}) *
                  </label>
                  <input
                    id="v-quote"
                    type="number"
                    min={0}
                    required
                    value={formState.quotation}
                    onChange={(e) => setFormState({ ...formState, quotation: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="v-cname" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Contact Person
                  </label>
                  <input
                    id="v-cname"
                    type="text"
                    value={formState.contactName}
                    onChange={(e) =>
                      setFormState({ ...formState, contactName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded"
                  />
                </div>
                <div>
                  <label htmlFor="v-phone" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Phone / Email
                  </label>
                  <input
                    id="v-phone"
                    type="text"
                    value={formState.contactPhone}
                    onChange={(e) =>
                      setFormState({ ...formState, contactPhone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="v-inc" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Package Inclusions (comma-separated)
                  </label>
                  <input
                    id="v-inc"
                    type="text"
                    value={formState.inclusions}
                    onChange={(e) =>
                      setFormState({ ...formState, inclusions: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="v-notes" className="block text-xs font-semibold text-[#182C28] mb-1">
                    Operational Notes
                  </label>
                  <input
                    id="v-notes"
                    type="text"
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D8C9B8] rounded"
                  />
                </div>
              </div>
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#292A27] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#182C28] rounded cursor-pointer"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
