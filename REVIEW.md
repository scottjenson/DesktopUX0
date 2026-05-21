# Code Review — Significant Findings

Prototype/demo-scoped review. Skipping low-level style nits, focusing on issues that could bite during the actual demo or that point to a meaningful design simplification.

## High Priority — Could Affect the Demo

### 1. Three near-identical drag implementations
`attachDrag`, `attachShiftDrag`, and `attachClipDrag` all duplicate the same pattern: mousedown captures offset, mousemove updates `left`/`top`, mouseup cleans up listeners. The window shift-drag and the content shift-drag also each have their own direction-detection block.

**Why it matters:** If a bug appears in one path (e.g. mouseup stuck because a listener didn't clean up), you'll fix it in one place and forget the others. This already happened once — the "dragging" class fix was applied to the titlebar drag but not the clip drag until separately requested.

**Suggested fix:** Extract one `startDrag({ onMove, onUp, onCancel })` helper that handles listener wiring and `shiftcancelled`. Each call site supplies just the body of `onMove`. About 40 lines saved and one place to fix bugs.

### 2. `stage` is referenced before it's defined
`stage` is declared at line 458 via `getElementById`, but it's used inside `attachContentDrag` (line 201) and `attachShiftDrag` (line 296), which are defined earlier. This works only because those handlers don't fire until after the script has finished parsing — but it's an implicit ordering dependency that's easy to break with any refactor.

**Suggested fix:** Move the `stage` and `cursorRing` constants to the top of the file with the other constants. Same for `scene`.

### 3. The `_freed` flag is dead code
In `attachClipDrag`, the click handler re-stacks "non-freed" cards using `if (!c._freed)` — but `_freed` is never set anywhere. This looks like a leftover from an earlier design iteration. Since `clipItems.splice(idx, 1)` already removes dragged cards from the array... wait, actually it doesn't. Dragged cards stay in `clipItems` but their `top` style is overwritten by the re-stack loop.

**Bug consequence:** If you drag a clip card out of the dock to a window, then click-dismiss a different clip card that's still in the dock, the re-stack loop will reset the freed card's `top` and snap it back into the dock column.

**Suggested fix:** When a clip card is dragged out, remove it from `clipItems` (or set `_freed = true` so the existing check works). Both are one-line fixes.

### 4. Re-entrancy on rapid Shift presses
The `shiftcancelled` event fires on every Shift keyup, but Shift keydown doesn't check whether shift was already held. Repeatedly pressing Shift mid-drag (e.g. nervous demo presenter) could fire `shiftcancelled` multiple times and put state in a weird place. Also: pressing Shift, starting a drag, releasing Shift (cancels), then re-pressing Shift mid-mousedown will leave `shift-drag-mode` re-added without any active drag.

**Why it matters for a stage demo:** Live demos are exactly when nervous, twitchy keypresses happen.

**Suggested fix:** Track a `shiftHeld` boolean and ignore repeat keydowns, OR just rely on `e.repeat` to dedupe.

## Medium Priority — Worth Knowing About

### 5. No window stacking order (z-index)
Windows always render in DOM order. Clicking a partially-hidden window doesn't bring it forward. For a demo where you'll be dragging windows around, this means windows can get visually trapped behind others with no way to recover except minimizing.

**Suggested fix:** On mousedown, move the clicked window to the end of `#scene`'s children (or just increment a z-index counter and assign).

### 6. The blue-highlight content drag has a UX gotcha
The `.highlight` span is a child of a paragraph, which is a child of `.window-body`. Shift-mousedown on the span calls `e.stopPropagation()` so the window doesn't drag — good. But shift-mousedown on the *paragraph text around* the highlight will trigger the window drag instead. Audience members watching the demo may not realize only the blue text is grabbable.

**Suggested fix:** Either visually emphasize the highlight as the only grabbable region (slightly raised border on shift-down, maybe), or make all content drag-extractable. Probably out of scope but worth noting.

### 7. `clipTop` uses `offsetHeight` before the element is in the DOM
`clipTop(clipItems.length)` is called in `addClipCard` *before* `stage.appendChild(cardEl)`. For the new card, `offsetHeight` would be 0 — but `clipTop` only sums *existing* clipItems, so this works by accident. Worth a comment, or restructure so the order isn't load-bearing.

### 8. Hardcoded magic numbers in CSS that mirror JS constants
`#dock-highlight` and `#clipboard-dock` use `width: 148px; top: 34px;` etc. — these mirror the JS constants `DOCK_BORDER_W`, `MENUBAR_H + 10`, etc. Changing the dock size means changing both files in sync. Not worth a CSS-vars refactor for a demo, but be aware.

## Low Priority / Cosmetic

### 9. SVG strings inline in JS
The Finder thumbnails are ~60 lines of inline SVG inside the `images` array. Fine for a demo, but consider extracting to a separate `thumbnails.js` if you keep iterating on them. Skipping for now is reasonable.

### 10. No keyboard accessibility, no touch support
Mouse-only. Reasonable for a stage demo on a laptop, but worth knowing if you ever want to show it on a tablet.

### 11. `wasDragged` flag tracks state across all drags on the same card
Once `wasDragged = false` resets on next mousedown, but the click handler fires after mouseup — the order of execution makes this work. It's fragile but functional.

## What I'd Actually Do

If I had one hour before the demo:

1. **Fix #3 (`_freed` dead code)** — this could cause a visible glitch during a demo.
2. **Fix #2 (forward references)** — quick, prevents future refactoring pain.
3. **Add #5 (z-index on click)** — windows getting stuck behind others would be embarrassing on stage.

Everything else is fine as-is for a throwaway prototype.
