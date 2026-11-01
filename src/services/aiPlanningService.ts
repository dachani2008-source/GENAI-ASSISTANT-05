import {
  BudgetAllocation,
  BudgetOptimizationProposal,
  EventCategory,
  EventWizardDraft,
  EventWorkspace,
  IdeaCard,
} from '../types/event';
import {
  generateDeterministicOptimization,
  sanitizeTextInput,
  suggestThemesFromPreferences,
  ThemePreferenceInput,
  ThemeSuggestionItem,
} from '../utils/planningLogic';

export interface CopilotServiceResponse {
  reply: string;
  bulletPoints?: string[];
  proposedAction?: {
    type: string;
    title: string;
    summary: string;
    impactDetail: string;
  };
  source?: string;
}

/**
 * Typed client-side service layer for ELEGANTIA AI endpoints with input sanitization
 * and deterministic fallback resilience.
 */
export const aiPlanningService = {
  async generateEventPlan(draft: EventWizardDraft): Promise<Record<string, unknown> | null> {
    const cleanDraft: EventWizardDraft = {
      ...draft,
      name: sanitizeTextInput(draft.name, 140),
      location: sanitizeTextInput(draft.location, 140),
      theme: sanitizeTextInput(draft.theme, 140),
      culturalPreferences: sanitizeTextInput(draft.culturalPreferences, 200),
      specialRequirements: sanitizeTextInput(draft.specialRequirements, 200),
    };
    const response = await fetch('/api/gemini/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft: cleanDraft }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { plan?: Record<string, unknown> };
    return data.plan ?? null;
  },

  async optimizeBudget(params: {
    totalBudget: number;
    currency: string;
    categories: BudgetAllocation[];
    priorities: string[];
  }): Promise<BudgetOptimizationProposal> {
    try {
      const response = await fetch('/api/gemini/optimize-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (response.ok) {
        const data = (await response.json()) as { proposal?: BudgetOptimizationProposal };
        if (data.proposal) {
          return data.proposal;
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        // Fallback to deterministic optimizer when offline
      }
    }
    return generateDeterministicOptimization(
      params.totalBudget,
      params.categories,
      params.priorities
    );
  },

  async suggestPersonalizedThemes(
    preferences: ThemePreferenceInput
  ): Promise<ThemeSuggestionItem[]> {
    const cleanPrefs: ThemePreferenceInput = {
      ...preferences,
      season: sanitizeTextInput(preferences.season, 60),
      setting: sanitizeTextInput(preferences.setting, 80),
      colorMood: sanitizeTextInput(preferences.colorMood, 80),
      culturalNotes: sanitizeTextInput(preferences.culturalNotes || '', 120),
      vibe: sanitizeTextInput(preferences.vibe || 'Contemporary Editorial', 80),
    };
    try {
      const response = await fetch('/api/gemini/suggest-themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPrefs),
      });
      if (response.ok) {
        const data = (await response.json()) as { themes?: ThemeSuggestionItem[] };
        if (Array.isArray(data.themes) && data.themes.length > 0) {
          return data.themes;
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        // Fallback to deterministic preference synthesizer when offline
      }
    }
    return suggestThemesFromPreferences(cleanPrefs);
  },

  async generateIdeas(params: {
    eventName: string;
    eventCategory: EventCategory;
    ideaCategory: string;
    theme: string;
    style: string;
  }): Promise<Partial<IdeaCard>[]> {
    const response = await fetch('/api/gemini/generate-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        eventName: sanitizeTextInput(params.eventName, 100),
        theme: sanitizeTextInput(params.theme, 100),
        style: sanitizeTextInput(params.style, 100),
      }),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { ideas?: Partial<IdeaCard>[] };
    return Array.isArray(data.ideas) ? data.ideas : [];
  },

  async askCopilot(params: {
    prompt: string;
    eventContext: Partial<EventWorkspace> & Record<string, unknown>;
  }): Promise<CopilotServiceResponse | null> {
    const response = await fetch('/api/gemini/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: sanitizeTextInput(params.prompt, 400),
        eventContext: params.eventContext,
      }),
    });
    if (!response.ok) return null;
    return (await response.json()) as CopilotServiceResponse;
  },
};
