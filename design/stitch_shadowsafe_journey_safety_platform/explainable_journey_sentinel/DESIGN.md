---
name: Explainable Journey Sentinel
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
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-tablet: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system targets urban commuters, solo travelers, and field engineers who require uncompromised personal safety telemetry without panic-inducing alarmism. Engineered for high-stress, variable-lighting mobile environments, the aesthetic balances high-trust technological precision with an ambient, reassuring calm. 

The aesthetic model synthesizes **Tactile Glassmorphism** with **Technical Minimalism**:
- **Tactile Depth & Glassmorphism:** Deep navy frosted backdrops, subtle specular rims, and multi-layered planar sheets establish clear situational hierarchy without occluding maps or route telemetry.
- **Explainable Telemetry:** Visual indicators prioritize causal clarity over opaque scoring. Every hazard assessment, corridor shift, and safety state exposes plain-language rationales alongside dense, compact sensor telemetry.
- **De-escalation Ergonomics:** Stress-mitigating dark canvases eliminate glare and visual clutter, reserving chromatic saturation strictly for state shifts, navigational routes, and immediate safety interventions.

## Colors

The palette employs deep atmospheric slate and indigo tones as an absorptive base, deploying luminance sparingly to communicate risk hierarchy and directional flow.

### Core Canvas & Surfaces
- **Canvas Base:** `#0B0F19` (Deep Slate Void) — Foundation canvas minimizing battery draw and night-vision disruption.
- **Surface Elevation 1 (Cards & Sheets):** `#111827` (Indigo Midnight) — Baseline containment surface.
- **Surface Elevation 2 (Elevated Badges & Overlays):** `#1F2937` (Muted Steel Slate).
- **Surface Stroke / Rim:** `rgba(255, 255, 255, 0.08)` to `rgba(6, 182, 212, 0.2)` on active components.

### Active Telemetry & Navigation
- **Primary (Telemetry Cyan):** `#06B6D4` — Active radar pulses, GPS lock, telemetry breadcrumbs, explainability anchors.
- **Secondary (Navigation Cobalt):** `#3B82F6` — Safe transit corridors, waypoint nodes, interactive primary controls.

### Triage & Safety Accents
- **Status Nominal (Emerald):** `#10B981` — Safe zone confirmed, companion synced, sensor accuracy high.
- **Status Elevated (Amber):** `#F59E0B` — Deviations detected, lighting low, telemetry degraded. Requires passive attention.
- **Status Critical (Coral Crimson):** `#EF4444` — SOS beacon triggered, high-threat zone entered, rapid emergency trigger.

### Neutral Scale (Text & Structure)
- **Text Dominant:** `#F9FAFB` (High-contrast primary legibility).
- **Text Muted:** `#9CA3AF` (Sensor metadata, time stamps, explainability subtext).
- **Text Ghost:** `#4B5563` (Grid delimiters, inactive toggles).

## Typography

The type hierarchy employs a triad strategy to differentiate structural navigation, human-readable insights, and machine-derived sensor data:

1. **Display & Structural Headings (Space Grotesk):** Provides a precise, technological edge for titles, risk gauges, and dynamic corridor markers without sacrificing rapid glanceability.
2. **Explanatory Narrative & Body (Manrope):** Delivers fluid, open-aperture legibility for dynamic safety explanations, emergency contacts, and situational guidance.
3. **Telemetry & Metadata (JetBrains Mono):** Formats coordinates, timestamps, confidence metrics, and protocol hashes, giving technical authority to explainable AI evaluations.

## Layout & Spacing

The layout is built for dynamic mobile constraints, prioritizing one-handed thumb interaction within the bottom 60% of the screen.

### Grid & Canvas Structure
- **Mobile Viewport (Primary):** Single-column fluid layout with a base `1rem` (16px) margin and a dynamic bottom safe-area offset (minimum `2rem` bottom buffer for floating trigger sheets).
- **Internal Structural Gutters:** `1rem` column gutters ensure compact telemetry displays (2-column data clusters) remain distinct under motion.
- **Adaptive Reflow:** On viewports wider than 600px (tablets/foldables), the layout transitions into a 4-column balanced grid with a persistent telemetry sidebar pinned to the right edge.

### Interaction Rhythm
- Component spacing obeys a strict 4px/8px modular rhythm. 
- High-priority touch targets (SOS, Route Deviate, Safety Confirmation) feature minimum touch boundaries of 48x48px, surrounded by `space-md` collision insulation.

## Elevation & Depth

Visual hierarchy uses translucent surface layering and subtle chromatic halos instead of standard opaque drop shadows, preserving contextual visibility of maps behind interface sheets.

### Layer Hierarchy
- **Level 0 (Map & Telemetry Layer):** Native canvas `#0B0F19` with ambient corridor vector overlays.
- **Level 1 (Base Frosted Sheets):** Background `#111827` mixed with `backdrop-filter: blur(16px)` and a fill opacity of 82%. Border: 1px solid `rgba(255, 255, 255, 0.08)`.
- **Level 2 (Telemetry Panels & Action Cards):** Background `rgba(31, 41, 55, 0.75)` with `backdrop-filter: blur(24px)`. Border: 1px solid `rgba(6, 182, 212, 0.15)`. Ambient glow: `0 8px 32px -4px rgba(0, 0, 0, 0.45)`.
- **Level 3 (Intervention Alerts & Active Triggers):** Raised modular sheets with status-tinted borders and localized back-glow:
  - Nominal: `0 0 20px -2px rgba(16, 185, 129, 0.25)`
  - Attention: `0 0 24px -2px rgba(245, 158, 11, 0.25)`
  - Emergency SOS: `0 0 32px 0px rgba(239, 68, 68, 0.4)`

## Shapes

The shape architecture relies on oversized radii to impart an approachable, defensive, and protective physical presence:

- **Primary Cards & Floating Sheets:** Styled with `rounded-2xl` (1.5rem) and `rounded-3xl` (2rem) corner treatments, removing aggressive corners and creating distinct card silhouettes.
- **Telemetry Indicators & Micro-Chips:** Pill-shaped capsules (9999px radius) for status chips, timestamp capsules, and confidence percentages.
- **Action Triggers & SOS Elements:** Continuous circular controls (`rounded-full`) engineered for press-and-hold gestures, preventing edge snags during hurried inputs.

## Components

### Buttons & Interactive Controls
- **Primary Navigation CTA:** Full-width pill-shaped control with high-saturation Cobalt `#3B82F6` to Cyan `#06B6D4` horizontal gradient. Foreground in pure white with `label-lg` tracking.
- **SOS Critical Trigger:** Concentric dual-ring button (`rounded-full`, 72x72px minimum). Core uses Coral Crimson `#EF4444`, wrapped in an ambient radar pulse animation with a 3-second hold ring SVG progress stroke.
- **Ghost Action Buttons:** Frosted semi-transparent slate surface (`rgba(255, 255, 255, 0.06)`) bounded by low-contrast borders.

### Telemetry Badges & Chips
- Compact pills utilizing `label-md` in `JetBrains Mono`.
- Prefixed with a real-time pulsing 6px status LED:
  - *Nominal:* Emerald background tint `rgba(16, 185, 129, 0.15)` with `#10B981` text and dot.
  - *Elevated:* Amber background tint `rgba(245, 158, 11, 0.15)` with `#F59E0B` text and dot.
  - *Critical:* Crimson background tint `rgba(239, 68, 68, 0.15)` with `#EF4444` text and dot.

### Explainability Cards
- Frosted sheets (`rounded-2xl`) housing a structural split:
  - **Header:** High-level status headline in `Space Grotesk` paired with an explainable trust score (0–100%).
  - **Rationale Segment:** 2–3 concise sentences in `Manrope` `body-md` identifying causal factors (e.g., *"Lighting variance: -42% relative to historical safe path"*).
  - **Sensor Strip:** Subordinate mono grid highlighting active feeds: `GPS: ±3m`, `AUDIO_ANOMALY: NONE`, `MESH: SYNCED`.

### Input Fields & Safe-Check Modals
- Input fields display an integrated inset style with deep navy background `#080C14` and high-contrast `#F9FAFB` text. Focused states switch the bounding 1px border to Electric Cyan `#06B6D4` with an ambient glow.
- Safe-check sheets employ sliding bottom-sheet anchors with ergonomic swipe dismissals and single-tap "Confirm Safe" quick-action pills.