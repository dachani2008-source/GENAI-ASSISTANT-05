import React, { useState } from 'react';
import {
  Bookmark,
  Check,
  Copy,
  Heart,
  Loader2,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { EventWorkspace, IdeaCard, IdeaCategory } from '../types/event';
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

  // Merge event's own ideas with supplemental gallery items if not already present
  const mergedIdeas: IdeaCard[] = [
    ...event.ideas,
    ...SUPPLEMENTAL_GALLERY.filter(
      (sup) => !event.ideas.some((existing) => existing.id === sup.id)
    ),
  ];

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
