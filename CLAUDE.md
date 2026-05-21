# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file HTML prototype (`insight_demo.html`) demonstrating a "3D UI Paradigm Shift" concept — a macOS-style desktop scene where a TextEdit window containing e-bike research data "explodes" into 3D space when the spacebar is held.

## Architecture

Everything lives in one file: HTML structure, CSS (inline `<style>`), and JavaScript (inline `<script>`).

**Key DOM hierarchy:**
- `#stage` — full-viewport container with CSS `perspective` for 3D
  - `#menubar` — simulated macOS menu bar (translateZ, transitions out during pop)
  - `#scene` — 3D-preserved inner scene
    - `#window-wrapper` — positions/rotates the window; pivot is right-edge hinge
      - `#window-chrome` — visual backdrop plane (fades on pop)
      - `#titlebar` — macOS traffic lights + title
      - `#editor-inner` — contenteditable text area; `.listing` rows float out on pop
        - `.listing[data-ghost]` — each row references a ghost panel by ID
          - `.phone[data-app]` — inline spans referencing an app-tray ghost by ID
      - `.ghost` panels — slide in from the right edge on hover (web previews + app trays)
  - `#trash`, `#dock` — decorative desktop elements

**State machine (JS):**
- `isPopped` boolean — controlled by spacebar keydown/keyup
- `enterPopped()` adds `.popped` class to `#stage` and `.popped` to each `.phone`
- `exitPopped()` removes them
- CSS does all the 3D transitions via `#stage.popped` selectors

**Ghost panel system:**
- `.ghost` elements are positioned `right: 100%` (off left edge of window) and slide in via `translateX`
- `showGhost(id)` / `hideAllGhosts()` toggle `.visible` class
- Listing `mouseenter` shows the listing's web ghost; phone `mouseenter` overrides with the app-tray ghost; phone `mouseleave` restores the listing ghost

**3D coordinate model:**
- `--depth-z: 70px` CSS variable controls how far listings and phone spans pop forward
- Mouse parallax (when not popped): gentle `rotateY`/`rotateX` on `#window-wrapper` based on cursor offset from viewport center
- Pop state: `#window-wrapper` rotates `rotateY(24deg)` around the right-edge hinge (`transform-origin: calc(50% + 202px) center`)
