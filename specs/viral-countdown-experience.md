# Viral Countdown User Experience Spec

## Overview
Design a viral flow that lets anyone create and share a countdown in seconds. The spec outlines user jobs, the funnel from discovery to sharing, and UI requirements so development, interaction design, and visual design can move in parallel.

## User Jobs
- **Curious Visitor** – browse trending countdowns and understand the product value.
- **Countdown Creator** – craft a countdown with title, date/time, description, image, link, and theme.
- **Recipient** – view a shared countdown and optionally create their own.
- **Returning User** – manage existing countdowns and check engagement stats.

## Funnel & Flows
### 1. Discovery
Visitors land on the home page or a shared countdown.
- Prominent CTA: "Start a countdown".
- Scrollable feeds: new, expiring soon, finished.

### 2. Creation
```
Landing → "Start a countdown" → Form
```
Form fields and validation:
1. Title (required, max 100 chars)
2. Expiration (date picker or "in X days")
3. Description & image URL (optional)
4. Call‑to‑action link (optional)
5. Theme selection (gallery of presets)

Preview updates in real time. "Create" persists and navigates to share screen.

### 3. Share
After create:
- Show countdown preview with copyable link and social share buttons (X, Facebook, WhatsApp).
- Suggest logging in to track stats.

### 4. Recipient Flow
Recipients see countdown with time remaining and creator info. Primary CTA: "Make your own" leading back to creation form.

### 5. Retention
Email reminder 24h before expiry and weekly digest of views for logged‑in creators.

## UI Requirements
- Responsive layout (mobile first, works at 320px and up).
- Vue components:
  - `CountdownForm.vue` for creation.
  - `CountdownShare.vue` for post‑creation actions.
  - `CountdownView.vue` for public viewing.
- Form uses service layer `createCountdown()`.
- Share buttons use native `navigator.share` when available.

## Interaction Design
- Inline validation with red borders and helper text.
- Smooth transitions between steps (`vue-router` slide left/right).
- Countdown timer animates every second.
- Toast on successful copy of share link.

## Visual Design
- Five CSS-based themes using CSS variables:
  - **Glamorous** – rich blacks and golds, serif headings, shimmer animation.
  - **Mainframe** – neon on dark grid, monospace type, subtle scanline effect.
  - **Serious** – muted grayscale palette, crisp sans-serif, no animation.
  - **Playful** – bright candy colors, rounded fonts, bounce-in digits.
  - **Zen** – soft pastels, clean sans, fade transitions.
- Themes implemented via CSS variables for quick loading and easy swapping.
- Use 8px spacing grid; border radius 4px; body text 16px.
- Countdown digits use monospace font for alignment.

## Account Model Tradeoffs
- **Anonymous creation with expiring edit links**
  - Pros: zero-friction onboarding, maximizes viral spread.
  - Cons: limited analytics, edit links can leak; expire links after 30 days to reduce risk.
- **Required login or social connect (X/Instagram)**
  - Pros: persistent identity enables stats, abuse control, and seamless cross-posting.
  - Cons: higher friction and dependency on third-party APIs; may reduce conversions.
- **Hybrid approach (default anonymous, optional login) – chosen**
  - Start anonymous with expiring edit links; prompt login to save and track countdowns, marrying low friction with analytics.

## Metrics
Track events:
- `countdown_created`
- `countdown_shared` with channel
- `countdown_viewed`
Conversion goal: at least 20% of viewers create a countdown.

## Open Questions
- Nail down exact color values, font pairings, and animation timings for each theme.
