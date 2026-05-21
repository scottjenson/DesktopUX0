# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive macOS-style desktop prototype exploring a multi-window UI paradigm. Windows can be dragged, minimized to left-edge icons, and restored. The project is structured for future expansion with additional window types and content.

## File Structure

- `index.html` — shell only: menubar, `#scene` container, external CSS/JS references
- `styles.css` — all visual styling
- `main.js` — window definitions, creation, drag, minimize/restore logic

## Architecture

**DOM hierarchy:**
- `#stage` — full-viewport background (starfield gradient)
  - `#menubar` — simulated macOS menu bar
  - `#scene` — window container; gets `.no-transition` class during initial layout

**Window system:**
- `windowTypes` array — defines all windows as `{ title, tint, corner }`; the first entry (no `corner`) is the center window
- `createWindow(def)` — builds `.window > .window-titlebar + .window-body` DOM, attaches drag and minimize handlers
- Windows are absolutely positioned via inline `left`/`top` styles

**Minimize/restore:**
- `minimizeWindow(win)` — saves `_restoreLeft`/`_restoreTop`, scales the window down to `ICON_W × ICON_H` (120×92px) via `transform: scale()` with `transformOrigin: 0 0`, moves it to a stacked left-edge position
- `restoreWindow(win)` — clears transform, restores saved position, re-stacks remaining icons
- `minimizedWindows[]` — ordered array tracking stacked icons; index determines `top` via `iconTop(i)`
- Clicking a `.tl` button or the minimized window itself triggers toggle

**Positioning:**
- `positionCenter(el)` — centers in viewport accounting for `MENUBAR_H`
- `positionCorner(el, corner)` — places at named corner (`top-left`, `top-right`, `bottom-left`, `bottom-right`) with `MARGIN` clearance; left-side corners offset by `ICON_LEFT + ICON_W` to avoid overlapping the icon strip

**Transitions:**
- CSS transitions on `transform`, `left`, `top` for smooth minimize/restore animation
- `.dragging` class disables transitions during titlebar drag
- `.no-transition` on `#scene` suppresses all transitions during initial load (removed after first double-`requestAnimationFrame`)
