# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design Intent

This prototype demonstrates three connected ideas:

1. **A unified file + clipboard model.** Traditional desktops treat file management and clipboard as separate systems. This demo argues they should be one — files and text snippets are the same kind of thing, live in the same place, and move the same way.

2. **A single new interaction primitive: the grab event.** Triggered by Shift+drag, it does different things depending on context — drag a window to dock it, drag a content item to extract it — but it's always the same gesture. The goal is to show that one simple event, layered by context, can replace several distinct UI mechanisms.

3. **Content is separable from its container.** A highlight or an image isn't locked inside its window. The grab event reaches into a window and pulls content out into a shared clipboard space where it can be repositioned freely alongside other items.

The demo is intentionally minimal — the point is the interaction model, not the content.

## Project Overview

An interactive macOS-style desktop prototype built for **stage demo purposes**. It explores a multi-window UI paradigm where content items can be dragged between windows and docks. This is a throwaway demo — prioritize visual clarity and simplicity over correctness or robustness.

## File Structure

- `index.html` — shell only: menubar, `#scene`, dock overlays, cursor ring
- `styles.css` — all visual styling
- `main.js` — window definitions, creation, all interaction logic

## Architecture

**DOM hierarchy:**
- `#stage` — full-viewport background (starfield gradient); receives state classes (`shift-drag-mode`, `dock-targeted`, `clipboard-targeted`)
  - `#menubar` — simulated macOS menu bar
  - `#scene` — window container; gets `.no-transition` during initial layout
  - `#dock-highlight` — left dock drop zone visual (invisible until drag)
  - `#clipboard-dock` — right dock drop zone visual (invisible until drag)
  - `.clip-card` elements — appended directly to `#stage`, float freely

**Window system:**
- `windowTypes` array — `{ title, tint, type, corner }`; first entry is center window (no `corner`)
- `type`: `'blank'` | `'text'` | `'finder'` — dispatched by `renderContent(type, body)`
- `createWindow(def)` — builds `.window > .window-titlebar + .window-body`, attaches all handlers

**Content types:**
- `renderText(body)` — prose with a `.highlight` span; `attachContentDrag` wired to the span
- `renderFinder(body)` — 3×2 SVG thumbnail grid; `attachContentDrag` wired to each `.finder-icon`
- SVGs are fully inline — no external assets

**Minimize/restore (window dock — left side):**
- `minimizeWindow(win)` — saves `_restoreLeft`/`_restoreTop`, scales window to `ICON_W × ICON_H` (100×76px) via `transform: scale()` with `transformOrigin: 0 0`, stacks on left edge
- `restoreWindow(win)` — clears transform, restores position, re-stacks remaining icons
- `minimizedWindows[]` — ordered array; index → `top` via `iconTop(i)`

**Clipboard dock (right side):**
- `clipItems[]` — ordered array of `.clip-card` els appended to `#stage`
- `addClipCard(el)` — stacks card in the right dock region, wires drag and dismiss
- Cards are always children of `#stage` (never re-parented into windows) — positional overlap fakes "dropped into window"
- Click without dragging dismisses a card; remaining stacked cards re-stack

**Shift-drag mode:**
- Shift key → `shift-drag-mode` on `#stage` → grab cursor + blue cursor ring (96px)
- Dragging a **window** leftward 20px → `dock-targeted` → release minimizes to left dock
- Dragging a **content item** rightward 20px → `clipboard-targeted` → release adds clip card to right dock
- Content item `mousedown` calls `e.stopPropagation()` to prevent window drag from firing
- Releasing Shift mid-drag dispatches `shiftcancelled` event, cleans up all state

**Positioning:**
- `positionCenter(el)` — centers in viewport below menubar
- `positionCorner(el, corner)` — places at named corner with `MARGIN` clearance; left corners offset by `DOCK_W`; right corners offset by `DOCK_R_W` to reserve both dock zones

**Transitions:**
- CSS transitions on `transform`, `left`, `top` for animate/restore
- `.dragging` and `.no-transition .window` disable transitions during drag and initial load
- Must remove `.dragging` before calling `minimizeWindow` — use `requestAnimationFrame` — otherwise transition won't fire

## Demo Simplifications

These are intentional shortcuts made because this is a stage demo, not production code:

- **Clip cards are never re-parented.** Dragging a clip card "into" a window is purely visual — the card stays a child of `#stage`. DOM re-parenting would require coordinate system conversion and window hit-detection, too complex for a demo.
- **No real images.** All Finder thumbnails are inline SVGs. No asset pipeline needed.
- **Content doesn't shrink in dock icons.** Window icons show a scaled-down version of the full window including content, which looks fine at small scale. No special icon-mode rendering.
- **No state persistence.** Everything resets on page reload. Clip cards, window positions, and minimized state are all in-memory only.
- **Highlight text is hardcoded.** The blue-highlighted phrase in the Notes window is a static `<span>` — not a real text selection mechanism.
