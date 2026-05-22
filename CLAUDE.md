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
- `content.js` — window definitions (`windowTypes`), content renderers, clip card factories; loaded first
- `main.js` — all interaction logic: dock system, drag helpers, window creation, layout, shift-drag, hover highlight

## Architecture

**DOM hierarchy:**
- `#stage` — full-viewport background (starfield gradient); receives state classes (`shift-drag-mode`, `dock-targeted`, `clipboard-targeted`)
  - `#menubar` — simulated macOS menu bar
  - `#scene` — window container; gets `.no-transition` during initial layout
  - `#dock-highlight` — left dock drop zone visual (invisible until drag)
  - `#clipboard-dock` — right dock drop zone visual (invisible until drag)
  - `.window` and `.clip-card` elements — appended directly to `#stage` when docked, float freely

**Window system:**
- `windowTypes` array (in `content.js`) — `{ title, tint, type, corner }`; first entry is center window (no `corner`)
- `type`: `'blank'` | `'text'` | `'finder'` — dispatched by `renderContent(type, body)`
- `createWindow(def)` — builds `.window > .window-titlebar + .window-body`, attaches all handlers

**Content types (in `content.js`):**
- `renderText(body)` — prose with a `.highlight` span; `attachShiftDrag` wired to the span
- `renderFinder(body)` — 3×2 SVG thumbnail grid; `attachShiftDrag` wired to each `.finder-icon`
- SVGs are fully inline — no external assets
- `makeTextClip(text)` / `makeImageClip(svgHTML)` — factories that produce `.clip-card` elements

**Unified dock system:**
- `dockItems = { left: [], right: [] }` — both docks share one data structure
- `addToDock(card, side)` — positions card in the named dock, calls `attachDockCardBehavior`
- `removeFromDock(card)` — removes from its dock array and calls `restack(side)`
- `minimizeWindow(win, side)` — saves restore position, scales window to `ICON_W` (100px) via `transform: scale()` with `transformOrigin: 0 0`, pushes into `dockItems[side]`
- `restoreWindow(win)` — clears transform, restores position, removes from dock array, restacks
- `attachDockCardBehavior(card)` — wires drag-out and click-to-restore/dismiss; guarded by `_dockBehaviorAttached` flag to prevent duplicate listeners

**Unified shift-drag:**
- `attachShiftDrag(el, { makeCard, dragsElement })` — single handler for all three draggable types
- `dragsElement: true` for windows (el moves during drag), `false` for content (el stays put)
- Continuously tracks left/right displacement (20px threshold), toggles both `dock-targeted` and `clipboard-targeted` live — direction is reversible mid-drag
- On release: left → `minimizeWindow(win, 'left')` or `addToDock(makeCard(), 'left')`; right → same but `'right'`; no movement on a window → minimizes to left dock (shift-click)
- Releasing Shift mid-drag dispatches `shiftcancelled` event, cleans up all state

**Shift hover highlight:**
- `updateShiftHighlight(x, y)` — runs on every `mousemove` in shift mode; picks the innermost draggable target (`.finder-icon` > `.highlight` > `.window`) via `elementFromPoint`
- `.shift-highlighted` CSS class: `scale(1.06) translateY(2px)` + red outline + drop-shadow
- `.highlight` span gets a positioned clone on `#stage` instead (escapes `overflow: hidden` clipping); clone is removed on un-hover

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
