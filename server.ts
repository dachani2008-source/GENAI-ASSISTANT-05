import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  sanitizeTextInput,
  suggestThemesFromPreferences,
  ThemePreferenceInput,
} from './src/utils/planningLogic';
import {
  getCachedAiResponse,
  sanitizePayloadObject,
  securityAndRateLimitMiddleware,
  setCachedAiResponse,
} from './src/services/serverSecurity';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BudgetCategoryInput {
  id: string;
  category: string;
  plannedAmount: number;
  actualAmount: number;
  locked: boolean;
}

function isTestEnv(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.argv.some((arg) => arg.includes('test'))
  );
}

function getAiClient(): GoogleGenAI | null {
  if (isTestEnv()) {
    return null;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export const app = express();
app.disable('x-powered-by');
app.use(securityAndRateLimitMiddleware);
app.use(express.json({ limit: '256kb' }));
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizePayloadObject(req.body);
  }
  next();
});

// Health check endpoint for Vercel & Cloud Run
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ELEGANTIA AI', timestamp: new Date().toISOString() });
});

// 1. Generate Complete Event Plan from 5-Step Wizard
app.post('/api/gemini/generate-plan', async (req, res) => {
  const rawDraft = req.body?.draft;
  const safeName = sanitizeTextInput(rawDraft?.name, 120);
  if (!rawDraft || !safeName) {
    res.status(400).json({ error: 'Missing event draft parameters.' });
    return;
  }

  const draft = {
    ...rawDraft,
    name: safeName,
    location: sanitizeTextInput(rawDraft.location || 'Metropolitan Venue', 120),
    venueType: sanitizeTextInput(rawDraft.venueType || 'Private Architectural Venue', 100),
    style: sanitizeTextInput(rawDraft.style || 'Contemporary Editorial', 100),
    theme: sanitizeTextInput(rawDraft.theme || 'Candlelit Architectural Warmth', 120),
    food: sanitizeTextInput(rawDraft.food || 'Seasonal Tasting Menu', 100),
    culturalPreferences: sanitizeTextInput(rawDraft.culturalPreferences || '', 150),
    specialRequirements: sanitizeTextInput(rawDraft.specialRequirements || '', 150),
  };

  const cacheKey = `plan:${JSON.stringify(draft)}`;
  const cached = getCachedAiResponse<Record<string, unknown>>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.json(cached);
    return;
  }
  res.setHeader('X-Cache', 'MISS');

  const ai = getAiClient();
  const totalBudget = Math.max(200, Number(draft.totalBudget) || 25000);
  const category = ['wedding', 'birthday', 'community'].includes(draft.category)
    ? draft.category
    : 'wedding';

  if (ai) {
    try {
      const prompt = `Create a structured event plan for ELEGANTIA AI.
Event Name: ${draft.name}
Category: ${category}
Location: ${draft.location}
Date: ${draft.date}
Guest Count: ${draft.guestCount}
Venue Type: ${draft.venueType}
Total Budget: ${totalBudget} ${draft.currency}
Priorities: ${(draft.priorities || []).join(', ')}
Style: ${draft.style}
Theme: ${draft.theme}
Food: ${draft.food}
Cultural Preferences: ${draft.culturalPreferences || 'None'}
Special Requirements: ${draft.specialRequirements || 'None'}

Ensure budget allocations sum to at most ${totalBudget} and reflect the category and priorities.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are ELEGANTIA AI, an executive event architect. Return a structured JSON event plan with realistic budget allocations (whose sum never exceeds Total Budget), 5 chronological milestones with daysBeforeEvent integers, 3 tailored vendor categories, 3 schedule slots, and 3 actionable AI recommendations.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                budgetCategories: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      plannedAmount: { type: Type.NUMBER },
                      notes: { type: Type.STRING },
                    },
                  },
                },
                milestones: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      daysBeforeEvent: { type: Type.INTEGER },
                      priority: { type: Type.STRING },
                      phase: { type: Type.STRING },
                    },
                  },
                },
                scheduleSlots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      title: { type: Type.STRING },
                      location: { type: Type.STRING },
                      lead: { type: Type.STRING },
                      notes: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        });

        const parsed = JSON.parse((response.text ?? '{}').trim());
        const geminiPayload = { source: 'gemini', plan: parsed };
        setCachedAiResponse(cacheKey, geminiPayload);
        res.json(geminiPayload);
        return;
      } catch (error) {
        if (error instanceof Error) {
          // Graceful fallback to synthesized plan
        }
      }
    }

    // Structured intelligent synthesis if API key is unconfigured or rate-limited
    const splits =
      category === 'wedding'
        ? [
            { category: 'Venue & Architectural Exclusivity', ratio: 0.34, notes: `Tailored for ${draft.venueType}` },
            { category: `Culinary & Beverage (${draft.food || 'Tasting Menu'})`, ratio: 0.28, notes: `For ${draft.guestCount} guests` },
            { category: `Floral & Scenography (${draft.theme})`, ratio: 0.15, notes: `Style: ${draft.style}` },
            { category: 'Editorial Photography & Film', ratio: 0.12, notes: 'Full-day documentary coverage' },
            { category: 'Sound, Strings & Guest Hospitality', ratio: 0.11, notes: draft.specialRequirements || 'Production & stationery' },
          ]
        : category === 'birthday'
        ? [
            { category: `Venue & Atmosphere (${draft.venueType})`, ratio: 0.32, notes: `In ${draft.location}` },
            { category: `Dining, Artisanal Cake & Bar`, ratio: 0.36, notes: draft.food || 'Curated menu & cake' },
            { category: `Theme Decor & Return Gifts (${draft.theme})`, ratio: 0.18, notes: draft.style },
            { category: 'Music, Entertainment & Photography', ratio: 0.14, notes: draft.specialRequirements || 'Live DJ & portraits' },
          ]
        : [
            { category: `Venue, Municipal Permits & Safety`, ratio: 0.28, notes: `${draft.venueType} in ${draft.location}` },
            { category: 'Stage Production, Audio & Lighting', ratio: 0.34, notes: draft.specialRequirements || 'Full AV rigging' },
            { category: 'Hospitality, Refreshments & Zero-Waste', ratio: 0.22, notes: `For ${draft.guestCount} attendees` },
            { category: 'Wayfinding Signage, Badges & Volunteer Ops', ratio: 0.16, notes: `Theme: ${draft.theme}` },
          ];

    const payload = {
      source: 'synthesized',
      plan: {
        recommendations: [
          `Lock ${draft.venueType} contract in ${draft.location} first to anchor the ${draft.currency} ${totalBudget.toLocaleString()} budget.`,
          `Align floral and lighting design around "${draft.theme}" (${draft.style}) so ceremony/opening pieces transition into the main reception.`,
          `Prepare a dedicated hospitality brief for ${draft.guestCount} guests incorporating ${draft.food || 'seasonal menus'}${draft.culturalPreferences ? ` and ${draft.culturalPreferences}` : ''}.`,
        ],
        budgetCategories: splits.map((s) => ({
          category: s.category,
          plannedAmount: Math.floor(totalBudget * s.ratio),
          notes: s.notes,
        })),
        milestones: [
          { title: `Finalize ${draft.venueType} floorplan & acoustic layout`, daysBeforeEvent: 60, priority: 'High', phase: 'Foundation' },
          { title: `Confirm ${draft.food || 'catering'} tasting & dietary matrix for ${draft.guestCount} guests`, daysBeforeEvent: 35, priority: 'High', phase: 'Culinary & Hospitality' },
          { title: `Approve "${draft.theme}" scenography & lighting proofs`, daysBeforeEvent: 21, priority: 'Medium', phase: 'Design & Production' },
          { title: 'Distribute run-of-show schedule & contact sheet to all vendors', daysBeforeEvent: 10, priority: 'High', phase: 'Operations' },
          { title: 'Final venue walkthrough & contingency verification', daysBeforeEvent: 3, priority: 'High', phase: 'Final Week' },
        ],
        scheduleSlots: [
          { time: '16:30', title: 'Welcome Arrival & Prelude', location: draft.venueType, lead: 'Event Lead', notes: `Setting the ${draft.style} atmosphere.` },
          { time: '17:30', title: 'Main Ceremony / Keynote Moment', location: 'Primary Hall', lead: 'Production Coordinator', notes: draft.culturalPreferences || 'Core program sequence.' },
          { time: '19:00', title: `Celebration Dining (${draft.food || 'Curated Menu'})`, location: 'Dining Salon', lead: 'Culinary Director', notes: `Seated experience for ${draft.guestCount} guests.` },
        ],
      },
    };
    setCachedAiResponse(cacheKey, payload);
    res.json(payload);
  });

  // 2. Optimize Budget with Gemini AI
  app.post('/api/gemini/optimize-budget', async (req, res) => {
    const { totalBudget, categories, priorities, currency } = req.body || {};
    if (!Array.isArray(categories)) {
      res.status(400).json({ error: 'Invalid budget categories payload.' });
      return;
    }

    const typedCategories = categories as BudgetCategoryInput[];
    const ai = getAiClient();
    if (ai) {
      try {
        const prompt = `Analyze and optimize this event budget of ${totalBudget} ${currency || 'USD'}.
Priorities: ${(priorities || []).join(', ')}.
Categories: ${JSON.stringify(
          typedCategories.map((c) => ({
            id: c.id,
            category: c.category,
            plannedAmount: c.plannedAmount,
            actualAmount: c.actualAmount,
            locked: c.locked,
          }))
        )}
Rules:
1. NEVER change plannedAmount for categories where locked is true.
2. Never set afterAmount lower than actualAmount.
3. Sum of all afterAmount values must not exceed ${totalBudget}.
4. Find meaningful savings on non-priority unlocked categories.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a precision financial planner for luxury and community events. Return JSON with rationale, estimatedSavings, and adjustments array.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                rationale: { type: Type.STRING },
                estimatedSavings: { type: Type.NUMBER },
                adjustments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      categoryId: { type: Type.STRING },
                      categoryName: { type: Type.STRING },
                      beforeAmount: { type: Type.NUMBER },
                      afterAmount: { type: Type.NUMBER },
                      reason: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        });

        const parsed = JSON.parse((response.text ?? '{}').trim());
        if (parsed && Array.isArray(parsed.adjustments) && parsed.adjustments.length > 0) {
          res.json({ source: 'gemini', proposal: parsed });
          return;
        }
      } catch (error) {
        if (error instanceof Error) {
          // Graceful fallback to deterministic optimizer
        }
      }
    }

    // Deterministic server-side calculation
    let saved = 0;
    const adjustments = typedCategories.map((c) => {
      if (c.locked) {
        return {
          categoryId: c.id,
          categoryName: c.category,
          beforeAmount: c.plannedAmount,
          afterAmount: c.plannedAmount,
          reason: 'Locked category — allocation strictly preserved.',
        };
      }
      const headroom = Math.max(0, c.plannedAmount - c.actualAmount);
      const trim = Math.round(headroom * 0.15);
      const afterAmount = Math.max(c.actualAmount, c.plannedAmount - trim);
      saved += c.plannedAmount - afterAmount;
      return {
        categoryId: c.id,
        categoryName: c.category,
        beforeAmount: c.plannedAmount,
        afterAmount,
        reason:
          trim > 0
            ? `Consolidated 15% of unspent contingency buffer (${currency || 'USD'} ${trim.toLocaleString()}) while covering committed spend.`
            : 'Aligned with committed actual spend.',
      };
    });

    res.json({
      source: 'deterministic',
      proposal: {
        rationale:
          'Preserved all locked contracts and priority guest touchpoints while reclaiming 15% of uncommitted contingency across flexible categories.',
        estimatedSavings: saved,
        adjustments,
      },
    });
  });

  // 3. Regenerate / Suggest Creative Ideas in Idea Studio
  app.post('/api/gemini/generate-ideas', async (req, res) => {
    const { eventName, eventCategory, ideaCategory, theme, style } = req.body || {};
    const safeEventName = sanitizeTextInput(eventName || 'Signature Celebration', 100);
    const safeTheme = sanitizeTextInput(theme || 'Architectural Warmth', 100);
    const safeStyle = sanitizeTextInput(style || 'Contemporary Editorial', 100);
    const ai = getAiClient();

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Suggest 2 elevated, concrete ${ideaCategory || 'Themes'} concepts for a ${eventCategory} event named "${safeEventName}" with theme "${safeTheme}" and style "${safeStyle}".`,
          config: {
            systemInstruction:
              'Return 2 editorial, design-forward event concepts in JSON format. Avoid generic clichés.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedImpact: { type: Type.STRING },
                },
              },
            },
          },
        });
        const items = JSON.parse((response.text ?? '[]').trim());
        res.json({ source: 'gemini', ideas: items });
        return;
      } catch (error) {
        if (error instanceof Error) {
          // Graceful fallback to curated ideas
        }
      }
    }

    const cat = ideaCategory && ideaCategory !== 'All' ? sanitizeTextInput(ideaCategory, 40) : 'Decoration';
    res.json({
      source: 'curated',
      ideas: [
        {
          title: `Bespoke ${cat} Vignette — ${safeTheme}`,
          category: cat,
          description: `Custom tactile installation pairing natural travertine plinths, hand-dipped beeswax tapers, and seasonal botanicals tailored to ${safeEventName}.`,
          estimatedImpact: '$680 – $1,200 estimated',
        },
        {
          title: `Interactive Guest Keepsake & Sensory Station`,
          category: cat,
          description: `Curated moment designed for ${safeStyle} flow, uniting acoustic ambiance with artisanal local craftsmanship.`,
          estimatedImpact: '$24 per guest',
        },
      ],
    });
  });

  // 4. Suggest Personalized Themes Based on User Preferences
  app.post('/api/gemini/suggest-themes', async (req, res) => {
    const rawPrefs = (req.body || {}) as Partial<ThemePreferenceInput>;
    const prefs: ThemePreferenceInput = {
      eventCategory:
        rawPrefs.eventCategory === 'birthday' || rawPrefs.eventCategory === 'community'
          ? rawPrefs.eventCategory
          : 'wedding',
      season: sanitizeTextInput(rawPrefs.season || 'Autumn', 60) || 'Autumn',
      setting: sanitizeTextInput(rawPrefs.setting || 'Architectural Courtyard', 80) || 'Architectural Courtyard',
      colorMood: sanitizeTextInput(rawPrefs.colorMood || 'Evergreen, Burgundy & Antique Gold', 80) || 'Evergreen, Burgundy & Antique Gold',
      culturalNotes: sanitizeTextInput(rawPrefs.culturalNotes || '', 120),
      vibe: sanitizeTextInput(rawPrefs.vibe || 'Contemporary Editorial', 80) || 'Contemporary Editorial',
    };

    const cacheKey = `themes:${JSON.stringify(prefs)}`;
    const cached = getCachedAiResponse<Record<string, unknown>>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const ai = getAiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Suggest 3 bespoke event themes for a ${prefs.eventCategory} event based on these preferences:
Season: ${prefs.season}
Setting: ${prefs.setting}
Color Mood: ${prefs.colorMood}
Vibe: ${prefs.vibe}
Cultural / Personal Notes: ${prefs.culturalNotes || 'None'}`,
          config: {
            systemInstruction:
              'You are ELEGANTIA AI Creative Director. Return 3 structured theme suggestions with title, tagline, style, description, 4 hex palette colors, 3 decorHighlights, and recommendedLighting.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  tagline: { type: Type.STRING },
                  style: { type: Type.STRING },
                  description: { type: Type.STRING },
                  palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                  decorHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendedLighting: { type: Type.STRING },
                },
              },
            },
          },
        });
        const themes = JSON.parse((response.text ?? '[]').trim());
        if (Array.isArray(themes) && themes.length > 0) {
          const payload = { source: 'gemini', themes };
          setCachedAiResponse(cacheKey, payload);
          res.json(payload);
          return;
        }
      } catch (error) {
        if (error instanceof Error) {
          // Graceful fallback to preference engine
        }
      }
    }

    const fallbackThemes = suggestThemesFromPreferences(prefs);
    const payload = { source: 'preference-engine', themes: fallbackThemes };
    setCachedAiResponse(cacheKey, payload);
    res.json(payload);
  });

  // 5. Contextual AI Copilot
  app.post('/api/gemini/copilot', async (req, res) => {
    const { prompt, eventContext } = req.body || {};
    const safePrompt = sanitizeTextInput(prompt, 400);
    if (!safePrompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getAiClient();
    if (ai && eventContext) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Event Context: ${JSON.stringify(eventContext)}\n\nPlanner Request: ${safePrompt}`,
          config: {
            systemInstruction:
              'You are the ELEGANTIA AI Executive Copilot. Answer concisely using the exact numbers, vendor names, and milestone dates from the provided Event Context. Also propose 1 concrete optional state modification in proposedAction if helpful.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: { type: Type.STRING },
                bulletPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                proposedAction: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    impactDetail: { type: Type.STRING },
                  },
                },
              },
            },
          },
        });
        const parsed = JSON.parse((response.text ?? '{}').trim());
        res.json({ source: 'gemini', ...parsed });
        return;
      } catch (error) {
        if (error instanceof Error) {
          // Graceful fallback to contextual engine
        }
      }
    }

    // Contextual deterministic response grounded in real eventContext
    const q = safePrompt.toLowerCase();
    const evtName = sanitizeTextInput(eventContext?.name || 'your event', 100);
    const currency = sanitizeTextInput(eventContext?.currency || 'USD', 10);
    const totalBudget = Number(eventContext?.totalBudget) || 0;
    const allocated = Number(eventContext?.allocated) || 0;
    const spent = Number(eventContext?.spent) || 0;
    const overdueCount = Number(eventContext?.overdueCount) || 0;
    const topMilestone = sanitizeTextInput(
      eventContext?.nextMilestoneTitle || 'Confirm final floorplan & catering headcount',
      140
    );
    const unbookedVendors = Array.isArray(eventContext?.pendingVendorNames)
      ? eventContext.pendingVendorNames
      : ['Floral & Scenography comparison quote'];

    if (q.includes('budget') || q.includes('reduce') || q.includes('spend')) {
      const savings = Math.max(650, Math.round((allocated - spent) * 0.14));
      res.json({
        source: 'contextual-engine',
        reply: `For ${evtName}, ${currency} ${allocated.toLocaleString()} is currently allocated out of ${currency} ${totalBudget.toLocaleString()} (${currency} ${spent.toLocaleString()} committed). You can reclaim approximately ${currency} ${savings.toLocaleString()} without touching locked contracts.`,
        bulletPoints: [
          `Repurpose ceremony/opening botanical arrangements for the main reception tablescape.`,
          `Trim 14% of uncommitted contingency across unlocked categories while protecting priority guest touchpoints.`,
          `Consolidate lighting and sound delivery under a single production call to eliminate duplicate drayage fees.`,
        ],
        proposedAction: {
          type: 'budget_rebalance',
          title: `Reclaim ${currency} ${savings.toLocaleString()} from Unlocked Contingency`,
          summary: `Applies a 12% efficiency trim to unlocked budget categories with uncommitted buffers.`,
          impactDetail: `Reduces allocated total by ${currency} ${savings.toLocaleString()} while keeping all locked categories intact.`,
        },
      });
      return;
    }

    if (q.includes('week') || q.includes('timeline') || q.includes('complete')) {
      res.json({
        source: 'contextual-engine',
        reply: `You have ${overdueCount > 0 ? `${overdueCount} overdue item(s) requiring immediate sign-off` : 'zero overdue items'} for ${evtName}. Your highest-leverage priority this week is "${topMilestone}".`,
        bulletPoints: [
          `Priority 1: Complete "${topMilestone}" and circulate updated floorplan to lead vendors.`,
          `Priority 2: Lock final dietary and allergen counts 21 days prior to event load-in.`,
          `Priority 3: Verify golden-hour / stage cue sheet with audio and photography leads.`,
        ],
        proposedAction: {
          type: 'add_milestone',
          title: 'Add 14-Day Production Cue Sheet Review Milestone',
          summary: 'Adds a High-priority production walkthrough milestone to your timeline.',
          impactDetail: 'Scheduled 14 days prior to the event date.',
        },
      });
      return;
    }

    if (q.includes('vendor') || q.includes('booking')) {
      res.json({
        source: 'contextual-engine',
        reply: `Across your vendor roster for ${evtName}, ${unbookedVendors.length} vendor record(s) require contract or deposit follow-up: ${unbookedVendors.join(', ')}.`,
        bulletPoints: [
          `Compare itemized inclusions before releasing comparison quotes.`,
          `Verify certificate of insurance (COI) and load-in window for all contracted vendors.`,
          `Align deposit payment milestones with your Smart Budget Studio ledger.`,
        ],
        proposedAction: {
          type: 'add_milestone',
          title: 'Schedule Vendor COI & Load-In Verification',
          summary: 'Adds a dedicated vendor compliance milestone 10 days before the event.',
          impactDetail: 'Assigned to Lead Coordinator.',
        },
      });
      return;
    }

    res.json({
      source: 'contextual-engine',
      reply: `Based on ${evtName}'s aesthetic direction ("${sanitizeTextInput(eventContext?.theme || 'Contemporary Editorial', 100)}"), we recommend elevating tactile guest touchpoints with warm 2400K lighting, natural stone and linen textures, and a cohesive run-of-show.`,
      bulletPoints: [
        `Anchor the arrival experience with a signature seasonal welcome pour and acoustic prelude.`,
        `Use low architectural floral vessels and tall taper candles to preserve sightlines across dining tables.`,
        `Carry the same typography and color accent from digital save-the-dates through day-of menu cards.`,
      ],
      proposedAction: {
        type: 'update_theme',
        title: 'Refine Event Theme to "Candlelit Architectural Editorial & Taper Scenography"',
        summary: 'Updates the active event theme and adds a matching inspiration card to Idea Studio.',
        impactDetail: 'Synchronizes theme metadata across Overview and Idea Studio.',
      },
    });
  });

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        immutable: true,
        index: false,
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ELEGANTIA AI server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL && !isTestEnv()) {
  startServer();
}

export default app;


