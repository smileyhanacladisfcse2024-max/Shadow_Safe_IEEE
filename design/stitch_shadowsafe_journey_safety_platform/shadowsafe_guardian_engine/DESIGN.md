---
name: ShadowSafe Guardian Engine
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#4fdbc8'
  on-secondary: '#003731'
  secondary-container: '#04b4a2'
  on-secondary-container: '#003f38'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e79400'
  on-tertiary-container: '#563400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system is engineered for explainable civic safety, personal security, and transit telemetry. Designed for high-stress, variable-lighting environments (night transit, poorly lit walkways, fast-paced commutes), the visual tone balances rigorous algorithmic credibility with immediate emotional reassurance. It rejects alarmist patterns in favor of calm, predictive clarity: providing users with transparent risk factors, safe routing options, and rapid single-touch interventions without inducing panic.

The aesthetic fuses **Modern Civic Glassmorphism** with **Technical High-Trust Telemetry**:
- **Layered Obsidian Architecture:** A deep midnight canvas minimizes ocular fatigue during night commutes while highlighting map overlays and navigation vectors.
- **Explainable Telemetry Accents:** Clear, high-contrast luminescent cues (cyan/teal for verified safety, amber for cautionary metrics, crimson for immediate escalation) distinguish safety metrics at a glance.
- **Precision Floating Surfaces:** Translucent, frosted backdrop cards overlay live vector maps, mirroring the tactile spatial control of modern mobile navigation sheets with sharp informational density.

## Colors

The palette is tuned specifically for deep dark mode, ensuring map visibility, low battery consumption under high-frequency GPS usage, and rapid visual parsing during nighttime travel.

### Palette Breakdown
- **Base Canvas (`#0B0F19`):** Deep Obsidian Navy. Serves as the primary canvas underlay, anchoring vector cartography and background states.
- **Card Tier 1 (`#131B2E`):** Dark Surface Navy. Used for bottom sheets, navigation summary drawers, and stationary panels.
- **Card Tier 2 (`#1E293B`):** Elevated Slate. Used for nested sub-cards, active list items, interactive micro-panels, and control headers.
- **Safety Primary (`#06B6D4`):** Luminescent Cyan. Signifies active protection, verified safe corridors, optimal routing lines, and active location beacons.
- **Safety Secondary (`#14B8A6`):** Vibrant Teal. Indicates high foot-traffic certainty, working streetlights, verified community guardians, and completed checkpoints.
- **Caution / Warning (`#F59E0B`):** Amber Orange. Used for explainable risk conditions (low lighting, isolated stops, reduced visibility, battery depletion).
- **Critical / Emergency (`#EF4444`):** High-Visibility Crimson. Reserved exclusively for direct SOS triggers, critical deviation alerts, active incidents, and emergency contacts.
- **Text & High Contrast Tokens:** 
  - Primary text: `#F8FAFC` (pure readability against midnight grounds)
  - Secondary text: `#94A3B8` (metadata, telemetry units, timestamps)
  - Ghost borders: `rgba(255, 255, 255, 0.08)` to maintain boundary containment without cognitive noise.

## Typography

The type system prioritizes micro-legibility at variable viewing distances—such as an arm's-length mobile mount or a moving hand during a fast walk.

- **Primary Interface (Inter):** Applied across all structural headlines, route instructions, alerts, and interaction points. It provides tall x-heights and open apertures to prevent character ambiguity in transit contexts.
- **Telemetry & Factor Metrics (JetBrains Mono):** Monospaced numeric alignment is vital for commute durations, arrival distance meters, ETA confidence intervals, lighting score indices (e.g., `87/100`), and timestamp records. It prevents layout jitter during real-time streaming data updates.
- **Hierarchy Rules:**
  - Route milestones, primary turns, and critical hazard calls rely on `headline-lg` and `headline-md` with semi-bold weights (`600`).
  - Explainable parameters (e.g., "Well-lit corridor +92%", "Crowd density: Moderate") pair `body-sm` with `label-md` badges.

## Layout & Spacing

The layout is built around mobile-first touch ergonomics and rapid thumb-reach zones. The map viewport is treated as a continuous physical canvas, with floating dynamic controls and modal sliding sheets anchored to the lower half of the viewport.

### Layout Philosophy
- **4-Column Mobile Grid:** Standard mobile screens employ a 4-column layout with `1rem` (16px) margins and gutters, ensuring UI components align seamlessly over map views.
- **Dynamic Bottom Anchors:** All critical controls (route initiator, explainability factors, SOS triggers) sit within the lower 40% of the display to enable effortless single-handed thumb operation.
- **Floating Overlays & Gutters:** Floating telemetry headers and search toggles maintain a strict `1rem` safe-area margin from top device hardware cutouts and lateral screen edges.
- **Vertical Metric Rhythm:** Spacing between stacked analytical rows is strictly clamped to `space-sm` (8px) or `space-md` (12px) to maximize screen real estate for live vector maps.

## Elevation & Depth

Visual hierarchy relies on translucent physical strata rather than opaque heavy drop-shadows.

1. **Base Cartography (Elevation 0):** Pure vector map rendering running in high-contrast midnight mode with customized street geometries and low-glare building footprints.
2. **Glassmorphic Overlays (Elevation 1):** Floating navigation bars, floating quick-action pills, and search pills. Built using `background: rgba(19, 27, 46, 0.78)`, combined with `backdrop-filter: blur(16px)` and a subtle `1px` inner rim border of `rgba(255, 255, 255, 0.08)`.
3. **Interactive Bottom Sheets & Drawers (Elevation 2):** Primary container sheets sit at `#131B2E` with top-edge ambient shadows (`0 -8px 32px rgba(0, 0, 0, 0.45)`) and a `1px` perimeter border (`rgba(255, 255, 255, 0.06)`).
4. **Active Hazard Alerts & SOS Overlays (Elevation 3):** Urgent modals and deviation panels use ambient backdrops with directional glows:
   - Safe confirmation: Cyan glow (`box-shadow: 0 0 24px rgba(6, 182, 212, 0.25)`).
   - Warning condition: Amber glow (`box-shadow: 0 0 24px rgba(245, 158, 11, 0.2)`).
   - Critical Emergency: Crimson pulse glow (`box-shadow: 0 0 32px rgba(239, 68, 68, 0.35)`).

## Shapes

This design system standardizes on generous modern rounding to provide an organic, non-combative feel that reduces user tension during alert states.

- **Primary Cards & Bottom Drawers:** Styled with `1rem` (16px) to `1.5rem` (24px) corners on top boundaries, echoing comfortable palm containment.
- **Floating Micro-Status Badges & Telemetry Chips:** Fully rounded pill geometry (`rounded-full` / 9999px) to communicate modular, tappable data tokens.
- **Interactive Buttons & Input Fields:** Standardized on `0.75rem` (12px) to `1rem` (16px) corner rounding to clearly denote clickability while maintaining technical precision.

## Components

### Buttons & Interactive Triggers
- **Primary Safety Action:** Filled with `#06B6D4` background, dark text (`#0B0F19`), font weight `600`. Heights clamped to minimum 48px touch targets. Active states produce an inner cyan bloom.
- **Emergency SOS Button:** Dedicated high-prominence component. Double-ring Crimson background (`#EF4444`) with pulsing micro-animation. Features an intentional 1.5-second hold-to-activate trigger to eliminate false positives while keeping activation instant.
- **Secondary Telemetry Controls:** Bordered glass style using `rgba(255, 255, 255, 0.08)` outline, transparent slate fill, and bright cyan icons.

### Micro-Status Pills & Explainability Factors
- **Architecture:** Compact horizontal pills encapsulating an icon, label, and confidence score.
- **Safe Factor Pill:** `rgba(20, 184, 166, 0.12)` background, `#14B8A6` text and icon, 1px border `rgba(20, 184, 166, 0.3)`. Text example: `✓ 94% Lighting`.
- **Cautionary Factor Pill:** `rgba(245, 158, 11, 0.12)` background, `#F59E0B` text and icon, 1px border `rgba(245, 158, 11, 0.3)`. Text example: `⚠ Isolated Station`.
- **Risk Factor Pill:** `rgba(239, 68, 68, 0.15)` background, `#EF4444` text and icon, 1px border `rgba(239, 68, 68, 0.3)`. Text example: `✕ Construction Hazard`.

### Cards & Map Sheets
- **Route Comparison Cards:** Nested within `#1E293B` containers. Displays route duration in bold Inter typography paired with total safety score badge, path preview, and explainable safety determinants (e.g., CCTV coverage, active transit frequency).
- **Guardian Sync Bar:** Real-time presence card featuring active avatars, battery telemetry of trusted circles, and GPS timestamp synchronization in `JetBrains Mono`.

### Inputs & Search Bars
- Floating pill-style search bar over maps with `#131B2E` tinted glass, containing clear voice-command and safety filter triggers with accessible active focus rings in `#06B6D4`.