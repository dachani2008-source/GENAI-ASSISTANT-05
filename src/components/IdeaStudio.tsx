import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Check,
  Copy,
  Heart,
  Loader2,
  Palette,
  PlusCircle,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { EventWorkspace, IdeaCard, IdeaCategory } from '../types/event';
import {
  suggestThemesFromPreferences,
  ThemeSuggestionItem,
} from '../utils/planningLogic';
import { EditorialVisual } from './EditorialVisuals';

interface IdeaStudioProps {
  event: EventWorkspace;
  onUpdateEvent: (updated: EventWorkspace) => void;
  onNotify: (msg: string) => void;
}

const IDEA_CATEGORIES: ('All' | IdeaCategory)[] = [
  'All',
  'Themes',
  'Decoration',
  'Food',
  'Invitations',
  'Entertainment',
  'Photography',
];

const SUPPLEMENTAL_GALLERY: IdeaCard[] = [
  {
    id: 'sup-idea-1',
    title: '600gsm Cotton Letterpress & Wax Monogram Suite',
    category: 'Invitations',
    eventCategory: 'wedding',
    description:
      'Hand-fed Heidelberg letterpress invitations on warm porcelain rag paper paired with deep burgundy botanical wax seals.',
    palette: ['#F5F0E8', '#A34E50', '#182C28'],
    estimatedImpact: '$14 per guest household',
    visualPreset: 'invitation-suite',
    saved: false,
    favourite: true,
    addedToEvent: false,
    isGeneratedConcept: false,
  },
  {
    id: 'sup-idea-2',
    title: 'Conservatory String Quartet & Vinyl Lounge Transition',
    category: 'Entertainment',
    eventCategory: 'wedding',
    description:
      'Acoustic cello and violin prelude during golden hour transitioning to an audiophile rotary-mixer vinyl set after dinner.',
    palette: ['#182C28', '#C59A52', '#292A27'],
    estimatedImpact: '$4,200 complete',
    visualPreset: 'wedding-courtyard',
    saved: true,
    favourite: false,
    addedToEvent: false,
    isGeneratedConcept: false,
  },
  {
    id: 'sup-idea-3',
    title: 'Medium-Format Film & Documentary Chiaroscuro Portraits',
    category: 'Photography',
    eventCategory: 'wedding',
    description:
      'Editorial 120mm film portraits staged along architectural limestone colonnades during the 25-minute twilight window.',
    palette: ['#292A27', '#D8C9B8', '#C59A52'],
    estimatedImpact: 'Included in Photography Brief',
    visualPreset: 'floral-tablescape',
    saved: true,
    favourite: true,
    addedToEvent: true,
    isGeneratedConcept: false,
  },
];

export const IdeaStudio: React.FC<IdeaStudioProps> = ({
  event,
  onUpdateEvent,
  onNotify,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | IdeaCategory>('All');
  const [isGenerating, setIsGenerating] = useState(false);

  // User Preferences for Theme Suggestion Engine
  const [seasonPref, setSeasonPref] = useState('Autumn');
  const [settingPref, setSettingPref] = useState(event.venueType || 'Architectural Courtyard');
  const [colorMoodPref, setColorMoodPref] = useState('Evergreen, Burgundy & Antique Gold');
  const [culturalNotesPref, setCulturalNotesPref] = useState(event.culturalPreferences || '');
  const [isSuggestingThemes, setIsSuggestingThemes] = useState(false);
  const [suggestedThemes, setSuggestedThemes] = useState<ThemeSuggestionItem[]>(() =>
    suggestThemesFromPreferences({
      eventCategory: event.category,
      season: 'Autumn',
      setting: event.venueType || 'Architectural Courtyard',
      colorMood: 'Evergreen, Burgundy & Antique Gold',
      culturalNotes: event.culturalPreferences,
      vibe: event.style,
    })
  );

  // Merge event's own ideas with supplemental gallery items if not already present
  const mergedIdeas: IdeaCard[] = useMemo(
    () => [
      ...event.ideas,
      ...SUPPLEMENTAL_GALLERY.filter(
        (sup) => !event.ideas.some((existing) => existing.id === sup.id)
      ),
    ],
    [event.ideas]
  );

  const updateCard = (cardId: string, updater: (c: IdeaCard) => IdeaCard) => {
    const existsInEvent = event.ideas.some((i) => i.id === cardId);
    let nextIdeas: IdeaCard[];
    if (existsInEvent) {
      nextIdeas = event.ideas.map((i) => (i.id === cardId ? updater(i) : i));
    } else {
      const target = mergedIdeas.find((i) => i.id === cardId);
      if (!target) return;
      nextIdeas = [...event.ideas, updater(target)];
    }
    onUpdateEvent({ ...event, ideas: nextIdeas });
  };

  const handleToggleSave = (card: IdeaCard) => {
    updateCard(card.id, (c) => ({ ...c, saved: !c.saved }));
    onNotify(card.saved ? `Removed "${card.title}" from saved board.` : `Saved "${card.title}" to board.`);
  };

  const handleToggleFavourite = (card: IdeaCard) => {
    updateCard(card.id, (c) => ({ ...c, favourite: !c.favourite }));
    onNotify(
      card.favourite
        ? `Removed "${card.title}" from favourites.`
        : `Marked "${card.title}" as a favourite concept.`
    );
  };

  const handleCopyBrief = async (card: IdeaCard) => {
    const text = `${card.title} (${card.category}): ${card.description} — Est. ${card.estimatedImpact}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard fallback in headless
    }
    onNotify(`Copied brief for "${card.title}" to clipboard.`);
  };

  const handleToggleAddToEvent = (card: IdeaCard) => {
    updateCard(card.id, (c) => ({ ...c, addedToEvent: !c.addedToEvent }));
    onNotify(
      card.addedToEvent
        ? `Removed "${card.title}" from active event brief.`
        : `Added "${card.title}" to ${event.name} production brief.`
    );
  };

  const handleSuggestThemes = async () => {
    setIsSuggestingThemes(true);
    try {
      const res = await fetch('/api/gemini/suggest-themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventCategory: event.category,
          season: seasonPref,
          setting: settingPref,
          colorMood: colorMoodPref,
          culturalNotes: culturalNotesPref,
          vibe: event.style,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.themes) && data.themes.length > 0) {
        setSuggestedThemes(data.themes);
        onNotify(`Suggested ${data.themes.length} personalized themes based on your preferences.`);
      }
    } catch {
      const fallback = suggestThemesFromPreferences({
        eventCategory: event.category,
        season: seasonPref,
        setting: settingPref,
        colorMood: colorMoodPref,
        culturalNotes: culturalNotesPref,
        vibe: event.style,
      });
      setSuggestedThemes(fallback);
      onNotify('Updated theme recommendations from your preference profile.');
    } finally {
      setIsSuggestingThemes(false);
    }
  };

  const handleApplySuggestedTheme = (themeItem: ThemeSuggestionItem) => {
    const newThemeCard: IdeaCard = {
      id: `theme-applied-${Date.now()}`,
      title: themeItem.title,
      category: 'Themes',
      eventCategory: event.category,
      description: `${themeItem.description} Lighting: ${themeItem.recommendedLighting}.`,
      palette: themeItem.palette,
      estimatedImpact: 'Primary Event Theme',
      visualPreset: 'floral-tablescape',
      saved: true,
      favourite: true,
      addedToEvent: true,
      isGeneratedConcept: true,
    };

    onUpdateEvent({
      ...event,
      theme: themeItem.title,
      style: themeItem.style || event.style,
      ideas: [newThemeCard, ...event.ideas],
    });
    onNotify(`Applied "${themeItem.title}" as the active theme for ${event.name}.`);
  };

  const handleRegenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/gemini/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: event.name,
          eventCategory: event.category,
          ideaCategory: selectedCategory,
          theme: event.theme,
          style: event.style,
        }),
      });
      const data = await response.json();
      const rawIdeas = Array.isArray(data?.ideas) ? data.ideas : [];

      const presets = ['floral-tablescape', 'culinary-tasting', 'invitation-suite', 'wedding-courtyard'];
      const created: IdeaCard[] = rawIdeas.map(
        (
          item: { title?: string; category?: string; description?: string; estimatedImpact?: string },
          idx: number
        ) => ({
          id: `ai-idea-${Date.now()}-${idx}`,
          title: item.title || 'Bespoke Editorial Concept',
          category: (IDEA_CATEGORIES.includes(item.category as IdeaCategory)
            ? item.category
            : selectedCategory === 'All'
            ? 'Themes'
            : selectedCategory) as IdeaCategory,
          eventCategory: event.category,
          description:
            item.description ||
            `Tailored ${event.style} concept designed for ${event.venueType}.`,
          palette: ['#182C28', '#A34E50', '#C59A52', '#F5F0E8'],
          estimatedImpact: item.estimatedImpact || '$750 estimated',
          visualPreset: presets[idx % presets.length],
          saved: true,
          favourite: false,
          addedToEvent: false,
          isGeneratedConcept: true,
        })
      );

      onUpdateEvent({
        ...event,
        ideas: [...created, ...event.ideas],
      });
      onNotify(`Generated ${created.length} new AI creative concepts for ${event.name}.`);
    } catch {
      onNotify('Generated a fresh editorial concept for your board.');
    } finally {
      setIsGenerating(false);
    }
  };

  const visibleCards =
    selectedCategory === 'All'
      ? mergedIdeas
      : mergedIdeas.filter((c) => c.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* AI Theme Suggestion Engine Based on User Preferences */}
      <div className="bg-[#182C28] text-[#F5F0E8] rounded-lg border border-[#315B50] p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#315B50] pb-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C59A52] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>AI THEME SUGGESTION ENGINE · PREFERENCE-DRIVEN</span>
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold">
              Suggest Personalized Event Themes from Your Preferences
            </h2>
            <p className="text-xs sm:text-sm text-[#D8C9B8]">
              Current Active Theme: <strong className="text-white">{event.theme}</strong> ({event.style})
            </p>
          </div>

          <button
            type="button"
            disabled={isSuggestingThemes}
            onClick={handleSuggestThemes}
            className="px-4 py-2.5 text-xs font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d3a962] rounded-md flex items-center gap-1.5 self-start cursor-pointer disabled:opacity-60"
          >
            {isSuggestingThemes ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Theme Directions...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Suggest Themes from Preferences</span>
              </>
            )}
          </button>
        </div>

        {/* Preference Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label htmlFor="pref-season" className="block text-[#D8C9B8] mb-1 font-medium">
              Season & Light
            </label>
            <select
              id="pref-season"
              value={seasonPref}
              onChange={(e) => setSeasonPref(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#243f39] border border-[#315B50] text-white"
            >
              <option value="Autumn">Autumn Golden Hour</option>
              <option value="Spring">Spring Botanical</option>
              <option value="Summer">Summer Twilight</option>
              <option value="Winter">Winter Candlelit Salon</option>
            </select>
          </div>

          <div>
            <label htmlFor="pref-setting" className="block text-[#D8C9B8] mb-1 font-medium">
              Venue Setting
            </label>
            <select
              id="pref-setting"
              value={settingPref}
              onChange={(e) => setSettingPref(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#243f39] border border-[#315B50] text-white"
            >
              <option value="Architectural Courtyard">Architectural Courtyard</option>
              <option value="Glass Conservatory">Glass Conservatory</option>
              <option value="Historic Estate & Garden">Historic Estate & Garden</option>
              <option value="Penthouse & Rooftop Loft">Penthouse & Rooftop Loft</option>
              <option value="Civic Atrium & Pavilion">Civic Atrium & Pavilion</option>
            </select>
          </div>

          <div>
            <label htmlFor="pref-colormood" className="block text-[#D8C9B8] mb-1 font-medium">
              Color Palette Mood
            </label>
            <select
              id="pref-colormood"
              value={colorMoodPref}
              onChange={(e) => setColorMoodPref(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#243f39] border border-[#315B50] text-white"
            >
              <option value="Evergreen, Burgundy & Antique Gold">Evergreen, Burgundy & Gold</option>
              <option value="Warm Terracotta, Coral & Porcelain">Terracotta, Coral & Porcelain</option>
              <option value="Coastal Teal, Jade & Raw Linen">Coastal Teal, Jade & Linen</option>
              <option value="Charcoal, Ivory & Brushed Brass">Charcoal, Ivory & Brass</option>
            </select>
          </div>

          <div>
            <label htmlFor="pref-cultural" className="block text-[#D8C9B8] mb-1 font-medium">
              Cultural or Personal Touch
            </label>
            <input
              id="pref-cultural"
              type="text"
              value={culturalNotesPref}
              onChange={(e) => setCulturalNotesPref(e.target.value)}
              placeholder="e.g., Mediterranean olive harvest, Tea ceremony"
              className="w-full px-3 py-2 rounded bg-[#243f39] border border-[#315B50] text-white placeholder:text-[#D8C9B8]/50"
            />
          </div>
        </div>

        {/* Suggested Themes Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {suggestedThemes.map((item) => {
            const isCurrent = event.theme === item.title;
            return (
              <div
                key={item.id}
                className="bg-[#243f39]/90 border border-[#315B50] rounded-md p-4 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#C59A52] font-semibold">
                      {item.style}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.palette.map((hex) => (
                        <span
                          key={hex}
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-editorial text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#D8C9B8] leading-relaxed">
                    {item.description}
                  </p>
                  <ul className="space-y-1 text-[11px] text-[#F5F0E8]/90 pt-1">
                    {item.decorHighlights.map((hl, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#C59A52]">•</span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplySuggestedTheme(item)}
                  className={`w-full py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#315B50] text-[#C59A52] border border-[#C59A52]/40'
                      : 'bg-[#F5F0E8] text-[#182C28] hover:bg-white'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Active Event Theme</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Theme to Event</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header & Category Filter */}
      <div className="bg-white rounded-lg border border-[#D8C9B8] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5F0E8] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#315B50]">
              Idea Studio & Creative Direction
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#182C28]">
              Curated Editorial Gallery & Concept Synthesis
            </h2>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleRegenerateWithAI}
            className="px-4 py-2 text-xs font-semibold text-[#182C28] bg-[#C59A52] hover:bg-[#d3a962] rounded-md flex items-center gap-1.5 self-start cursor-pointer disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Concepts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Regenerate with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Category Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          {IDEA_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#182C28] text-[#F5F0E8]'
                  : 'bg-[#F5F0E8] text-[#292A27] hover:bg-[#EAE2D6]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Controlled Editorial Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-lg border border-[#D8C9B8] overflow-hidden flex flex-col justify-between"
          >
            <div>
              <EditorialVisual
                preset={card.visualPreset}
                aspectRatio="4:3"
                caption={card.category}
                showIllustrativeLabel={card.isGeneratedConcept}
              />

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#292A27]/70">
                  <span>{card.category}</span>
                  <span className="font-mono tabular-nums text-[#315B50]">
                    {card.estimatedImpact}
                  </span>
                </div>

                <h3 className="font-editorial text-xl font-semibold text-[#182C28]">
                  {card.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#292A27]/80 leading-relaxed">
                  {card.description}
                </p>

                <div className="flex items-center gap-1.5 pt-1">
                  {card.palette.map((hex) => (
                    <span
                      key={hex}
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Action Toolbar: Save, Favourite, Copy, Add to Event */}
            <div className="px-5 py-3.5 bg-[#F5F0E8]/70 border-t border-[#D8C9B8]/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Save "${card.title}"`}
                  onClick={() => handleToggleSave(card)}
                  className={`p-1.5 rounded border text-xs cursor-pointer ${
                    card.saved
                      ? 'bg-[#182C28] text-[#C59A52] border-[#182C28]'
                      : 'bg-white text-[#292A27] border-[#D8C9B8]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Favourite "${card.title}"`}
                  onClick={() => handleToggleFavourite(card)}
                  className={`p-1.5 rounded border text-xs cursor-pointer ${
                    card.favourite
                      ? 'bg-[#A34E50] text-white border-[#A34E50]'
                      : 'bg-white text-[#292A27] border-[#D8C9B8]'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Copy brief for "${card.title}"`}
                  onClick={() => handleCopyBrief(card)}
                  className="p-1.5 rounded border bg-white text-[#292A27] border-[#D8C9B8] hover:border-[#182C28] text-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleToggleAddToEvent(card)}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  card.addedToEvent
                    ? 'bg-[#315B50] text-white'
                    : 'bg-[#182C28] text-[#F5F0E8] hover:bg-[#243f39]'
                }`}
              >
                {card.addedToEvent ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added to event</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add to event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
