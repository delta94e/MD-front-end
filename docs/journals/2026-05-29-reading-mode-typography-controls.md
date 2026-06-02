# Reading Mode with Typography Controls

**Date**: 2026-05-29 15:37
**Severity**: Medium
**Component**: content-viewer, reading-settings-popover, store, globals.css
**Status**: Resolved

## What Happened

Implemented a reading mode feature with typography controls (font size, line height, font family, reading width) and line focus dimming across 3 phases. All phases complete, build passing. The feature lets users customize their reading experience via a side panel and optionally dim non-focused lines for concentration.

## The Brutal Truth

This should have been straightforward — CSS variables, a settings panel, a Zustand store extension. Instead, I hit three distinct problems that each cost 20-30 minutes of debugging: Tailwind's prose classes stomping CSS variables, SSR hydration mismatches from localStorage reads in the store, and WCAG contrast failures on the dimming opacity. The CSS specificity fight with Tailwind prose was the most maddening because the fix (`!important`) feels dirty but is genuinely the only sane option when fighting framework-generated utility classes.

## Technical Details

**CSS specificity conflict**: Tailwind's `@tailwindcss/typography` prose classes apply font-size, line-height, and font-family directly as inline-level styles. CSS custom properties set on a parent container get overridden. Error wasn't visible in dev tools because the variables were *set* but not *consumed* — prose classes ignored them entirely. Fix: apply variables with `!important` on the prose container selectors.

**SSR hydration mismatch**: `zustand` store initialized with `localStorage.getItem()` during module evaluation, which runs on the server where `localStorage` doesn't exist. Console warning: `Text content does not match server-rendered HTML`. Fix: initialize store with defaults, load from localStorage in a `useEffect` after mount.

**WCAG contrast**: Line focus dimming at `opacity: 0.4` brought body text contrast ratio below 4.5:1 against the background. Bumped to `opacity: 0.5` to maintain compliance.

## What We Tried

1. **Popover for settings** — Not available in the project's shadcn/ui setup. Switched to Sheet (side panel), which worked better anyway for the amount of controls.
2. **Slider component** — Not installed. Used native `<input type="range">` with custom styling. Functional, though less polished.
3. **JS-based scroll tracking for line focus** — Overcomplicated. Pure CSS `:hover` approach was simpler and performed better.

## Root Cause Analysis

The core issue was underestimating Tailwind prose class specificity. I assumed CSS variables on a parent would cascade into prose-styled children. They don't — prose applies its own values that override custom properties. Should have tested this assumption before writing the implementation.

The SSR bug was a classic Zustand footgun: store initialization code that touches browser APIs runs during Next.js server rendering if you're not careful about lazy initialization.

## Lessons Learned

1. **Always test CSS variable cascade against Tailwind prose** before building features that rely on it. Prose is opinionated and will fight you.
2. **Zustand + Next.js + localStorage** requires a specific pattern: default values in store, load from storage in useEffect. Never read localStorage during store creation.
3. **WCAG contrast checks should happen during design, not after implementation.** Would have saved a rework cycle on the dimming opacity.
4. **Sheet > Popover** for settings panels with multiple controls. More space, better mobile support, clearer mental model.

## Next Steps

- Monitor user feedback on the 6 font family choices — may need to add/remove based on actual usage
- Consider adding a "reset to defaults" button in the settings panel
- The `!important` CSS fix is a tech debt item — if Tailwind config is ever customized, revisit
