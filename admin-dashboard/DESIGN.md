# Design

## Theme
Academic, Administrative, Functional.

## Color Strategy
Restrained. One primary academic blue/teal, one soft yellow accent, and a foundation of tinted neutrals.

### Palette (OKLCH)
- **Primary (Teal-Blue):** `oklch(0.55 0.12 210)` - Calming, professional academic base.
- **Accent (Soft Yellow):** `oklch(0.92 0.08 95)` - Subtle highlights, non-overpowering.
- **Background (Light):** `oklch(0.99 0.005 210)` - True off-white, tinted toward teal.
- **Background (Dark):** `oklch(0.22 0.02 210)` - Deep slate-teal.
- **Ink (Light):** `oklch(0.25 0.02 210)` - Professional dark teal-gray.
- **Ink (Dark):** `oklch(0.95 0.01 210)` - Off-white.

## Typography
Dual-font system for academic rigor and functional clarity.

- **Headings (H1-H3):** `font-family: "Amiri", serif;` - Traditional, formal Arabic serif for authority.
- **Body & Data (Default):** `font-family: "Tajawal", sans-serif;` - Modern, clean, and legible for high-density information.

## Layout & Density
- **Density:** Compact. Tighter spacing (e.g., `gap-2` to `gap-4` for sections) to maximize visibility of administrative data.
- **Grid:** 12-column grid for complex forms and dashboards.
- **RTL:** Full Right-to-Left alignment for Arabic content readability.

## Components
Simple, practical, and understated.

- **Radii:** Subtle curves only. `--radius: 0.375rem;` (6px).
- **Borders:** Thin, solid borders (`1px`) using `oklch(0.9 0.01 210)` for separation.
- **Shadows:** Minimal. Use `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` for slight elevation on active cards or buttons. No large blurs.
- **Buttons:** Solid primary for main actions, ghost/outline for secondary. No flashy gradients or bounce animations.

## Motion
Unobtrusive and functional.
- **Transitions:** Short durations (`150ms - 200ms`) with `ease-out`.
- **Reveal:** Simple crossfades or subtle vertical translations. No bouncy or elastic motion.
