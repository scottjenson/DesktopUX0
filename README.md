# Desktop0

An interactive macOS-style desktop prototype exploring a new interaction model for files and content.

## Concept

Three connected ideas:

1. **Unified file + clipboard model** — files and text snippets live in the same place and move the same way
2. **A single grab primitive** — Shift+drag does different things by context (dock a window, extract content) but it's always the same gesture
3. **Content is separable from its container** — drag a highlight or image out of a window into a shared clipboard space

## Usage

Open `index.html` in a browser. No build step required.

- **Drag** window titlebars to move windows
- **Shift+click** anywhere in a window docks it (primitive command)
- **Shift+drag** a window to dock it left or right (extended command)
- **Shift+drag content** this highlighted text or a Finder thumbnail into a visual clipboard
- **Click** any docked window to restore it
- **drag** any clipboard item out as a paste command

## Files

- `index.html` — page shell
- `styles.css` — all styling
- `content.js` — window definitions and content renderers
- `main.js` — all interaction logic
