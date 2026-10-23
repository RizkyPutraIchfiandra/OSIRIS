# UI / UX Guidelines

## Visual direction

Product name: NusaWatch (working name).

Visual direction:
- Dark, restrained, information-dense interface.
- Deep navy/charcoal surfaces with cyan or teal accent.
- Neutral text with clear contrast.
- Thin borders and restrained shadows.
- Map is a primary work surface, not a decorative background.
- Avoid excessive glow, gradients, animations, and fake terminal effects.
- Do not copy another product's branding or exact screen design.

## Layout

Desktop:
- Persistent navigation/sidebar where consistent with existing app.
- Top bar with product identity, current view, and global controls.
- Main map/list workspace.
- Context panel for selected event.
- Optional compact source/freshness indicators.

Mobile:
- Collapsible navigation.
- Map and list remain usable with touch.
- Filters appear in a drawer or compact panel.
- Event details should not permanently obscure the map.
- Avoid tiny tap targets and horizontal overflow.

## Required states for every data-driven component

1. Loading.
2. Loaded with results.
3. Empty result.
4. Error.
5. Stale/partial data.
6. Unsupported or unavailable source, where applicable.

## Interaction standards

- Every visible control must do something meaningful.
- Provide labels or tooltips for icon-only controls.
- Preserve filter state when opening/closing details when feasible.
- Keyboard focus must be visible.
- Color must not be the only signal for event category or status.
- Avoid surprise auto-refreshes that reset the user's view.
- Make refresh timing clear.
- Use confirmation for destructive actions.

## Accessibility

- Semantic headings and buttons.
- Proper form labels.
- Keyboard operation for navigation and filters.
- Sufficient contrast.
- Respect reduced-motion preferences.
- Accessible alternatives to map-only information, such as a synchronized event list.

## Copy style

Use concise, neutral language. Avoid sensational terms like “threat confirmed” unless the source supports that exact claim. Explain technical errors in plain language and keep stack traces in developer logs only.
