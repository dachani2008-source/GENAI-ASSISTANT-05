export type EventCategory = 'wedding' | 'birthday' | 'community';

export type WorkspaceSection =
  | 'overview'
  | 'studio'
  | 'events'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'guests'
  | 'ideas'
  | 'copilot'
  | 'settings';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export interface BudgetExpense {
  id: string;
  title: string;
  amount: number;
  date: string;
  vendorName?: string;
}

export interface BudgetAllocation {
  id: string;
  category: string;
  plannedAmount: number;
  actualAmount: number;
  locked: boolean;
  notes?: string;
  expenses: BudgetExpense[];
}

export type MilestonePriority = 'High' | 'Medium' | 'Low';
export type MilestoneStatus = 'Completed' | 'In Progress' | 'Upcoming' | 'Overdue';

export interface TimelineMilestone {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  daysBeforeEvent: number; // Used to recalculate when event date shifts
  priority: MilestonePriority;
  status: MilestoneStatus;
  assignee: string;
  phase: string;
  notes?: string;
}

export type BookingStatus = 'Shortlisted' | 'Contacted' | 'Quoted' | 'Contracted' | 'Declined';
export type PaymentStatus = 'Unpaid' | 'Deposit Paid' | 'Partially Paid' | 'Paid in Full';

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  quotation: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  rating?: number;
  inclusions: string[];
  notes: string;
}

export type RsvpStatus = 'Confirmed' | 'Pending' | 'Declined';

export interface GuestItem {
  id: string;
  name: string;
  email: string;
  partySize: number;
  rsvpStatus: RsvpStatus;
  dietaryNotes: string;
  tableAssignment: string;
  roleOrGroup: string;
}

export type IdeaCategory =
  | 'Themes'
  | 'Decoration'
  | 'Food'
  | 'Invitations'
  | 'Entertainment'
  | 'Photography';

export interface IdeaCard {
  id: string;
  title: string;
  category: IdeaCategory;
  eventCategory: EventCategory;
  description: string;
  palette: string[];
  estimatedImpact: string;
  visualPreset: string;
  saved: boolean;
  favourite: boolean;
  addedToEvent: boolean;
  isGeneratedConcept: boolean;
}

export interface CeremonySlot {
  id: string;
  time: string;
  title: string;
  location: string;
  lead: string;
  notes: string;
}

export interface BirthdayThemeOption {
  id: string;
  name: string;
  tagline: string;
  palette: string[];
  cakeStyle: string;
  decorFocus: string;
  entertainment: string;
  returnGiftIdea: string;
}

export interface CommunityOperationItem {
  id: string;
  domain: 'Permits & Venue' | 'Volunteer Shifts' | 'Stage & AV' | 'Safety & Medical' | 'Sponsorship';
  item: string;
  owner: string;
  status: 'Cleared' | 'In Review' | 'Action Needed';
  scheduleWindow: string;
  details: string;
}

export interface EventWorkspace {
  id: string;
  name: string;
  category: EventCategory;
  location: string;
  date: string; // YYYY-MM-DD
  guestCount: number;
  venueType: string;
  currency: CurrencyCode;
  totalBudget: number;
  budgetFlexibility: 'Strict' | 'Moderate (+10%)' | 'Flexible (+20%)';
  priorities: string[];
  style: string;
  theme: string;
  foodPreference: string;
  culturalPreferences: string;
  specialRequirements: string;
  coverVisualPreset: string;
  budgetCategories: BudgetAllocation[];
  milestones: TimelineMilestone[];
  vendors: VendorItem[];
  guests: GuestItem[];
  ideas: IdeaCard[];
  recommendations: string[];
  // Studio-specific operational records
  scheduleSlots: CeremonySlot[];
  selectedBirthdayThemeId?: string;
  communityOperations?: CommunityOperationItem[];
  calendarSynced?: boolean;
  lastSyncedAt?: string;
}

export interface EventWizardDraft {
  step: number;
  category: EventCategory;
  name: string;
  location: string;
  date: string;
  guestCount: number;
  venueType: string;
  currency: CurrencyCode;
  totalBudget: number;
  priorities: string[];
  flexibility: 'Strict' | 'Moderate (+10%)' | 'Flexible (+20%)';
  style: string;
  theme: string;
  food: string;
  culturalPreferences: string;
  specialRequirements: string;
}

export interface BudgetOptimizationProposal {
  rationale: string;
  estimatedSavings: number;
  adjustments: {
    categoryId: string;
    categoryName: string;
    beforeAmount: number;
    afterAmount: number;
    reason: string;
  }[];
}

export interface CopilotActionProposal {
  id: string;
  type: 'budget_rebalance' | 'add_milestone' | 'update_theme' | 'vendor_alert';
  title: string;
  summary: string;
  impactDetail: string;
  payload: Record<string, unknown>;
}
