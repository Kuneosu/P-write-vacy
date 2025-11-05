# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

P-write-vacy React is a privacy-focused text editor application that implements foveal focus visualization to prevent shoulder surfing. Built with React + TypeScript + Vite + TailwindCSS, it features real-time caret tracking with an elliptical focus area that keeps text around the cursor clear while blurring surrounding content.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Lint (if configured)
npm run lint
```

## Architecture

### Tech Stack
- **React 18** with TypeScript for type safety
- **Vite** for fast HMR and build tooling
- **TailwindCSS** for utility-first styling
- **No state management library** - uses React Context pattern with useState/useEffect

### Component Structure

```
src/
├── components/
│   ├── Editor.tsx           # Main contenteditable editor with FocusOverlay
│   ├── FocusOverlay.tsx     # Radial gradient blur overlay (React.memo)
│   ├── Sidebar.tsx          # Settings panel (slide-in from right)
│   └── SettingsButton.tsx   # Floating settings button (top-right)
├── hooks/
│   └── useCaretTracking.ts  # Custom hook for real-time caret position
├── types/
│   └── index.ts             # TypeScript interfaces
└── App.tsx                  # Root component with state & localStorage
```

### State Management Pattern

**App.tsx** serves as the single source of truth:
- `privacyActive: boolean` - Toggle blur effect on/off
- `focusSettings: FocusSettings` - Radius, color, opacity configuration
- `sidebarOpen: boolean` - Sidebar visibility state
- `content: string` - Editor text content

All state persists to localStorage with debounced saves (500ms for content).

### Focus Tracking System

**useCaretTracking hook** (hooks/useCaretTracking.ts:4-76):
1. Uses Selection API to get caret position
2. Inserts temporary zero-width space span at caret
3. Calculates position relative to editor bounds
4. Converts to percentage coordinates (0-100)
5. Updates on input, click, keyup, focus, scroll events

**FocusOverlay component** (components/FocusOverlay.tsx):
- Uses `radial-gradient` with CSS custom properties
- Two-layer approach: color overlay + backdrop-filter blur
- React.memo optimization to prevent unnecessary re-renders
- Elliptical gradient centered at caret percentage position

### CSS Architecture

- **TailwindCSS utilities** for layout, spacing, colors
- **Inline styles** for dynamic focus position (radial-gradient with runtime values)
- **CSS-in-JS** only where necessary (placeholder pseudo-element)

## Key Implementation Details

### ContentEditable Editor

- Uses native `contentEditable="true"` div (not textarea)
- Preserves whitespace with `whiteSpace: 'pre-wrap'`
- Placeholder via CSS `::before` pseudo-element with `data-placeholder` attribute
- Direct DOM manipulation avoided - uses React onInput event

### Keyboard Shortcuts

**Ctrl+H**: Toggle privacy mode (App.tsx:72-83)
- Global keydown listener on document
- Prevents default browser behavior

### localStorage Keys

```typescript
'p-write-vacy-content'        // Editor text (debounced 500ms)
'p-write-vacy-privacy'        // Boolean: privacy active state
'p-write-vacy-focus-settings' // JSON: FocusSettings object
```

### TypeScript Interfaces

```typescript
CaretPosition { x: number, y: number }  // Percentage coordinates
FocusSettings {
  radiusX: number      // Horizontal blur radius (30-150px)
  radiusY: number      // Vertical blur radius (15-100px)
  blurColor: string    // Hex color
  blurOpacity: number  // 0-1 for rgba conversion
}
```

## Extending the Application

### Adding New Settings

1. Add property to `FocusSettings` interface (types/index.ts)
2. Update `DEFAULT_FOCUS_SETTINGS` in App.tsx
3. Add control to Sidebar.tsx
4. Update FocusOverlay.tsx to use new property

### Optimizing Performance

- **FocusOverlay** already uses React.memo
- Consider throttling caret updates if performance issues (currently raw events)
- Use `useCallback` for event handlers if needed
- Consider virtualizing for very long documents

### Future Electron Integration

The current architecture is Electron-ready:
- No browser-specific APIs beyond standard DOM
- localStorage can be swapped for electron-store
- Add IPC handlers in main process for file operations
- Keyboard shortcuts compatible with Electron globalShortcut

## Browser Compatibility

- **Selection API**: All modern browsers
- **backdrop-filter**: Webkit prefix included for Safari
- **radial-gradient**: All modern browsers
- **contenteditable**: Universal support

Minimum: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
