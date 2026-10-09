---
name: Nexus Dark Precision
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2eb'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e1e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#10131a'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a focused, high-density communication environment tailored for power users, distributed engineering squads, and modern teams. The visual direction blends technical minimalism with subtle glassmorphic precision. Surfaces rely on deep obsidian and cool slate substrates rather than absolute pitch black, preserving contrast while eliminating eye strain during prolonged sessions. 

Micro-interactions are snappy and understated: instant 100ms spring state shifts, 1px luminous edge dividers, and restrained glowing accents that signal intelligence and active presence. The interface recedes into the background to prioritize rapid content scannability, message density, and context preservation.

## Colors

The palette leverages high-contrast functional color assignments tuned for pure dark environments:

- **Canvas Background (`#0B0E14`)**: Base canvas for full-frame viewport layouts and primary column backdrops.
- **Card & List Surface (`#151922`)**: Structural cards, active channel containers, sidebar panels, and message reply threads.
- **Elevated Interactive Surface (`#1E2330`)**: Hover states, popovers, context menus, and elevated input wrappers.
- **Electric Indigo (`#6366F1`)**: Primary action indicators, user message bubbles, active navigation pills, and focused tab bars.
- **AI Violet (`#8B5CF6`)**: Dedicated copilot threads, generative summarization chips, and synthetic intelligence states.
- **Presence Emerald (`#10B981`)**: Real-time presence badges, active audio states, and system health status.
- **Subtle Glass Border (`rgba(255, 255, 255, 0.08)`)**: Uniform stroke applied across structural card divisions, separators, and popouts to maintain crisp edge definition without heavy visual weight.
- **Text Primary (`#F8FAFC`)**: Message content, high-priority labels, and titles.
- **Text Secondary (`#94A3B8`)**: Metadata, timestamps, user handles, and unread count labels.
- **Text Muted (`#475569`)**: Input placeholders, inactive icons, and structural divider labels.

## Typography

The type scale relies entirely on Inter for UI text and message streams, complemented by JetBrains Mono for inline code snippets, syntax blocks, and command palette parameters. 

- **Vertical Rhythm**: Chat messages utilize `body-md` (14px/22px) for optimal scan rates across wide monitors and mobile viewports.
- **Headings & Hierarchy**: Channel headers, direct message names, and popover titles use `headline-md` or `headline-lg` with tight negative tracking (`-0.015em` to `-0.025em`) to emphasize modern digital precision.
- **Micro-labels**: Timestamps, reaction counts, and system status indicators use `label-sm` (11px) with uppercase letter-spacing (`0.04em`) to establish visual anchor points without consuming horizontal space.

## Layout & Spacing

The platform implements a modular fluid multi-pane layout:

- **Desktop (1024px+)**: A three-pane configuration featuring an ultra-compact navigation rail (64px fixed), a collapsible channel/DM directory panel (240px to 300px), and an elastic primary conversation viewport with an optional contextual right-sidebar thread drawer (340px fixed).
- **Tablet (768px - 1023px)**: Two-column layout with a collapsible sheet drawer for directories and full-width focus on the active conversation.
- **Mobile (< 768px)**: Single-column view with flat screen-to-screen transitions and bottom navigation bars. Chat messages adjust horizontal margins to `0.75rem` (`12px`) to maximize horizontal line capacity.
- **Component Padding Scale**: Internal message grouping utilizes tight vertical spacing (`space-xs` = 4px between sequential messages from the same sender; `space-md` = 12px between different authors). Chat container wrappers follow `space-lg` padding models.

## Elevation & Depth

Visual hierarchy is constructed via tonal layering and crisp glassmorphic edges rather than heavy drop shadows:

- **Level 0 (Base Canvas)**: Deep slate background (`#0B0E14`), flat, unbordered.
- **Level 1 (Panels & Sidebar)**: Surface `#151922` paired with a right or left 1px border stroke using `rgba(255, 255, 255, 0.08)`.
- **Level 2 (In-Feed Cards & Hovered Messages)**: Surface `#1E2330` with a full 1px border `rgba(255, 255, 255, 0.08)` and subtle blur (`backdrop-filter: blur(8px)`).
- **Level 3 (Modals, Command K, Dropdowns)**: Elevated slate surface (`#151922` at 95% opacity), accompanied by a diffused dark ambient shadow (`box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.6)`) and a vibrant 1px border perimeter `rgba(255, 255, 255, 0.12)`.

## Shapes

The interface utilizes a disciplined rounded-rect aesthetic (radius level 2):

- **Default UI Containers & Input Boxes**: `0.5rem` (`8px`) corners providing clean, technical discipline.
- **Modals & Thread Panels**: `rounded-lg` (`1rem` / `16px`) corners with subtle interior inset highlights.
- **Avatars**: Soft-cornered squares (`rounded-md` / `6px`) for bots and workgroups; circular (`rounded-full`) for human users to establish an immediate distinction between automated entities and team members.
- **Pills & Badges**: Fully rounded (`9999px`) geometries for presence dots, status tags, unread bubbles, and reaction chips.

## Components

### Buttons
- **Primary**: Background `#6366F1`, label `#FFFFFF`, border `1px solid rgba(255, 255, 255, 0.2)`, `rounded-md`, 36px standard height (`space-sm` vertical, `space-md` horizontal). Hover transitions to `#4F46E5`.
- **Secondary / Ghost**: Background transparent, border `1px solid rgba(255, 255, 255, 0.08)`, color `#F8FAFC`. On hover, background shifts to `#1E2330`.
- **AI Action**: Gradient border using `#8B5CF6` to `#6366F1`, soft background fill `rgba(139, 92, 246, 0.12)`, text `#C4B5FD`.

### Inputs & Message Composer
- **Message Input Area**: Surface `#151922`, 1px border `rgba(255, 255, 255, 0.08)`, radius `8px`. Active focus shifts border to `#6366F1` with an outer glow of `0 0 0 2px rgba(99, 102, 241, 0.2)`. Integrated action buttons (attachments, emojis, voice notes) are styled in muted tones and illuminate on hover.

### Reaction Chips & Pill Badges
- **Unread & Presence Badges**: Pill-shaped (`rounded-full`), 18px minimum height. Unread counters use `#6366F1` with bold 11px numbers. Presence dots use `#10B981` with an outer ring matching the parent card background.
- **Reaction Badges**: Pill format (`rounded-full`), surface `#1E2330`, border `1px solid rgba(255, 255, 255, 0.08)`, height 24px, containing emoji and counter. Active user reaction switches border to `#6366F1` and background to `rgba(99, 102, 241, 0.15)`.

### Message Items & Feed Cards
- **Incoming Messages**: Background transparent; hover reveals `#151922` surface with quick-action hover bar (reply, react, bookmark) anchored top-right.
- **Outgoing Messages**: Surface `#1E2330` with subtle `#6366F1` 1px border tint, or solid accent background for compact direct messages.
- **AI Copilot Responses**: Elevated container `#151922` with a 2px left border accent in `#8B5CF6` and an embedded copilot badge pill labeled with `label-sm`.

### Channel & Navigation Lists
- Items feature height 32px, `rounded-md`, horizontal padding `space-sm`. Inactive items render `#94A3B8`; active items take surface `#1E2330` with `#F8FAFC` text and an indigo vertical indicator line anchored to the left border.