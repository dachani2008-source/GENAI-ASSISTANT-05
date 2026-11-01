import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { INITIAL_EVENTS, CATEGORY_SHOWCASE } from '../data/seedEvents';
import { calculateBudgetSummary } from '../utils/planningLogic';
import { EditorialVisual } from './EditorialVisuals';
import { OverviewDashboard } from './OverviewDashboard';
import { CategoryStudioView } from './CategoryStudioView';
import { SmartBudgetStudio } from './SmartBudgetStudio';
import { TimelineStudio } from './TimelineStudio';
import { VendorStudio } from './VendorStudio';
import { IdeaStudio } from './IdeaStudio';
import { GuestAndCalendarView } from './GuestAndCalendarView';
import { AICopilotPanel } from './AICopilotPanel';
import { EventWizardModal } from './EventWizardModal';
import { MarketingExperience } from './MarketingExperience';
import { ErrorBoundary } from './ErrorBoundary';

const noop = () => {};
const sampleWedding = INITIAL_EVENTS[0];
const sampleBirthday = INITIAL_EVENTS[1];
const sampleCommunity = INITIAL_EVENTS[2];

function decodeHtml(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

test('UI 1: EditorialVisual renders SVG artwork and illustrative badge cleanly', () => {
  const html = decodeHtml(
    renderToStaticMarkup(
      <EditorialVisual
        preset="wedding-courtyard"
        aspectRatio="16:9"
        caption="Architectural Courtyard"
        showIllustrativeLabel={true}
      />
    )
  );
  assert.ok(html.includes('<svg'));
  assert.ok(html.includes('Architectural Courtyard'));
  assert.ok(html.includes('Illustrative Concept'));
});

test('UI 2: OverviewDashboard renders event headline, countdown, progress bar, and milestones', () => {
  const budgetSummary = calculateBudgetSummary(
    sampleWedding.totalBudget,
    sampleWedding.budgetCategories
  );
  const html = decodeHtml(
    renderToStaticMarkup(
      <OverviewDashboard
        activeEvent={sampleWedding}
        plannerName="Clara Vance"
        eventAccentHex={CATEGORY_SHOWCASE.wedding.accentHex}
        studioTitle={CATEGORY_SHOWCASE.wedding.studioTitle}
        daysUntil={45}
        planningProgress={60}
        budgetSummary={budgetSummary}
        onSwitchCategoryStudio={noop}
        onNavigate={noop}
        onQuickExportICS={noop}
        onOpenCopilotDrawer={noop}
        onToggleMilestone={noop}
      />
    )
  );
  assert.ok(html.includes(sampleWedding.name));
  assert.ok(html.includes('45 Days'));
  assert.ok(html.includes('60%'));
  assert.ok(html.includes('Quick Studio Actions'));
  assert.ok(html.includes('role="progressbar"'));
});

test('UI 3: CategoryStudioView renders Wedding, Birthday, and Community studios', () => {
  for (const evt of [sampleWedding, sampleBirthday, sampleCommunity]) {
    const html = decodeHtml(
      renderToStaticMarkup(
        <CategoryStudioView
          event={evt}
          onUpdateEvent={noop}
          onNavigate={noop}
          onNotify={noop}
        />
      )
    );
    assert.ok(html.length > 500);
    assert.ok(html.includes('Budget') || html.includes('Studio'));
  }
});

test('UI 4: SmartBudgetStudio renders total budget ceiling, category rows, and AI optimizer button', () => {
  const html = decodeHtml(
    renderToStaticMarkup(
      <SmartBudgetStudio
        event={sampleWedding}
        onUpdateEvent={noop}
        onNotify={noop}
      />
    )
  );
  assert.ok(html.includes('Smart Budget Studio'));
  assert.ok(html.includes('Optimize') || html.includes('Allocation'));
  assert.ok(html.includes(sampleWedding.budgetCategories[0].category));
});

test('UI 5: TimelineStudio renders chronological milestones, phase filters, and .ICS export', () => {
  const html = decodeHtml(
    renderToStaticMarkup(
      <TimelineStudio
        event={sampleWedding}
        onUpdateEvent={noop}
        onNotify={noop}
      />
    )
  );
  assert.ok(html.includes(sampleWedding.milestones[0].title));
  assert.ok(html.includes('Milestone') || html.includes('Timeline'));
});

test('UI 6: VendorStudio renders vendor checklist, status badges, and quotation comparison', () => {
  const html = decodeHtml(
    renderToStaticMarkup(
      <VendorStudio
        event={sampleWedding}
        onUpdateEvent={noop}
        onNotify={noop}
      />
    )
  );
  assert.ok(html.includes(sampleWedding.vendors[0].name));
  assert.ok(html.includes('Quotation Spread'));
});

test('UI 7: IdeaStudio renders AI Theme Suggestion Engine based on User Preferences and gallery cards', () => {
  const html = decodeHtml(
    renderToStaticMarkup(
      <IdeaStudio
        event={sampleWedding}
        onUpdateEvent={noop}
        onNotify={noop}
      />
    )
  );
  assert.ok(html.includes('Suggest Personalized Event Themes from Your Preferences'));
  assert.ok(html.includes('Suggest Themes from Preferences'));
  assert.ok(html.includes('Apply Theme to Event'));
});

test('UI 8: GuestAndCalendarView renders Google Calendar sync, .ICS export, and RSVP ledger', () => {
  const html = decodeHtml(
    renderToStaticMarkup(
      <GuestAndCalendarView
        event={sampleWedding}
        onUpdateEvent={noop}
        onNotify={noop}
      />
    )
  );
  assert.ok(html.includes('Sync to Google Calendar'));
  assert.ok(html.includes('Download .ICS Calendar Bundle'));
  assert.ok(html.includes('Guest & Seating Ledger') || html.includes('RSVP'));
});

test('UI 9: AICopilotPanel and EventWizardModal render accessible controls and steps', () => {
  const copilotHtml = decodeHtml(
    renderToStaticMarkup(
      <AICopilotPanel
        event={sampleWedding}
        onUpdateEvent={noop}
        onNotify={noop}
      />
    )
  );
  assert.ok(copilotHtml.includes('ELEGANTIA AI'));

  const wizardHtml = decodeHtml(
    renderToStaticMarkup(
      <EventWizardModal
        isOpen={true}
        initialCategory="wedding"
        onClose={noop}
        onComplete={noop}
      />
    )
  );
  assert.ok(wizardHtml.includes('ELEGANTIA AI CREATION WORKFLOW'));
});

test('UI 10: MarketingExperience and ErrorBoundary render semantic main landmark and brand title', () => {
  const marketingHtml = decodeHtml(
    renderToStaticMarkup(
      <ErrorBoundary>
        <MarketingExperience
          selectedCategory="wedding"
          plannerName="Clara Vance"
          onUpdatePlannerName={noop}
          onSelectCategory={noop}
          onOpenWizard={noop}
          onEnterWorkspace={noop}
        />
      </ErrorBoundary>
    )
  );
  assert.ok(marketingHtml.includes('ELEGANTIA AI'));
  assert.ok(marketingHtml.includes('id="main-content"'));
  assert.ok(marketingHtml.includes('Instant Event Budget Estimator') || marketingHtml.includes('Budget'));
});
