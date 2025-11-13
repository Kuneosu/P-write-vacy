# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pwritevacy** (v1.0.0-beta) is a privacy-focused text editor desktop application that implements foveal focus visualization to prevent shoulder surfing. Built with React 19 + TypeScript + Electron 39, it features real-time caret tracking with an elliptical focus area that keeps text around the cursor clear while blurring surrounding content.

### Key Features
- **Privacy Mode**: Elliptical/circular focus area with customizable blur
- **File Management**: Full-featured file explorer with multi-select, drag & drop, and CRUD operations
- **Markdown Support**: GitHub Flavored Markdown rendering with live preview
- **Auto-save**: 1-second debounced auto-save with save status indicator
- **Preset System**: Save up to 3 focus configuration presets
- **Internationalization**: Korean/English support with react-i18next
- **Onboarding**: First-run onboarding experience

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Start Electron app in development mode
npm run electron:dev

# Build for production
npm run build

# Build Electron app (DMG for macOS)
npm run electron:build

# Type checking
npx tsc --noEmit

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint
```

## Architecture

### Tech Stack
- **React 19** with TypeScript for type safety
- **Electron 39** for desktop application
- **Vite 7** for fast HMR and build tooling
- **TailwindCSS** for utility-first styling
- **react-i18next** for internationalization
- **Jest + React Testing Library** for testing (89% coverage)
- **react-markdown + remark-gfm** for markdown rendering

### Component Structure

```
src/
├── components/
│   ├── Editor.tsx              # Main contenteditable editor
│   ├── FocusOverlay.tsx        # Radial gradient blur overlay (React.memo)
│   ├── Sidebar.tsx             # Settings panel (slide-in from right)
│   ├── SettingsButton.tsx      # Floating settings button
│   ├── FileExplorer/           # File management system (modular)
│   │   ├── FileExplorer.tsx    # Main component (330 lines, refactored)
│   │   ├── hooks/              # 6 custom hooks (useFileTree, useFileOperations, etc.)
│   │   ├── components/         # 5 sub-components (FileItem, FileList, etc.)
│   │   └── utils/              # Utility functions
│   ├── MarkdownViewer.tsx      # Markdown preview component
│   ├── Onboarding.tsx          # First-run onboarding
│   ├── Toast.tsx               # Toast notification system
│   ├── SaveStatus.tsx          # Save status indicator
│   ├── ErrorBoundary.tsx       # Error boundary component
│   ├── Tooltip.tsx             # Tooltip component
│   └── ContextMenu.tsx         # Context menu component
├── contexts/
│   └── ToastContext.tsx        # Global toast state management
├── hooks/
│   └── useCaretTracking.ts     # Custom hook for real-time caret position
├── types/
│   └── index.ts                # TypeScript interfaces
└── App.tsx                     # Root component with state & localStorage
```

### State Management Pattern

**App.tsx** serves as the single source of truth:
- `privacyActive: boolean` - Toggle blur effect on/off
- `focusSettings: FocusSettings` - Radius, color, opacity, shape configuration
- `sidebarOpen: boolean` - Sidebar visibility state
- `content: string` - Editor text content
- `fileExplorerOpen: boolean` - File explorer visibility
- `currentFolder: string | null` - Currently selected folder
- `currentFile: string | null` - Currently open file
- `presets: Preset[]` - Saved focus configuration presets (max 3)

All state persists to localStorage with debounced saves (500ms for content, 1000ms for files).

### Focus Tracking System

**useCaretTracking hook** (hooks/useCaretTracking.ts):
1. Uses Selection API to get caret position
2. Inserts temporary zero-width space span at caret
3. Calculates position relative to editor bounds
4. Converts to percentage coordinates (0-100)
5. Updates on input, click, keyup, focus, scroll events

**FocusOverlay component** (components/FocusOverlay.tsx):
- Uses `radial-gradient` with CSS custom properties
- Two-layer approach: color overlay + backdrop-filter blur
- React.memo optimization to prevent unnecessary re-renders
- Supports both elliptical and circular focus shapes
- Customizable blur spread and intensity

### File Management System

**FileExplorer** (refactored in v0.3.0):
- Modular architecture: 330-line main component + 11 modules
- **Hooks**: useFileTree, useFileOperations, useFileSelection, useDragAndDrop, useKeyboardShortcuts
- **Components**: FileItem, FileList, FileContextMenu, FileToolbar, FileInputDialog
- **Features**: Multi-select (Cmd/Ctrl+Click), drag & drop, copy/paste, sorting, search
- **Test Coverage**: 89% with 106 tests

### Internationalization

**react-i18next** setup:
- Languages: Korean (ko), English (en)
- Translation files: `public/locales/{lang}/translation.json`
- Usage: `const { t, i18n } = useTranslation()`
- Language switching: `i18n.changeLanguage('ko' | 'en')`

### Electron Integration

**Main Process** (electron/main.cjs):
- Context isolation enabled for security
- IPC handlers for file operations (read, write, create, delete, rename)
- Path validation to prevent directory traversal attacks
- File size limit (100MB) to prevent memory overflow
- Custom protocol (app://) for loading resources
- Menu bar with standard macOS/Windows menus

**Preload Script** (electron/preload.cjs):
- Exposes safe APIs to renderer via `window.electron`
- File operations: readFile, writeFile, createFile, deleteFile, etc.
- Folder operations: selectFolder, readDirectory

## Key Implementation Details

### ContentEditable Editor

- Uses native `contentEditable="true"` div (not textarea)
- Preserves whitespace with `whiteSpace: 'pre-wrap'`
- Placeholder via CSS `::before` pseudo-element with `data-placeholder` attribute
- Direct DOM manipulation avoided - uses React onInput event
- Supports copy/paste with proper formatting

### Keyboard Shortcuts

**Global shortcuts**:
- `Ctrl+H`: Toggle privacy mode
- `Ctrl+S`: Toggle file explorer
- `Ctrl+9/0`: Adjust horizontal focus size
- `Ctrl+-/=`: Adjust vertical focus size
- `Escape`: Deselect current file

**File Explorer shortcuts**:
- `Cmd/Ctrl+Click`: Multi-select files
- `Cmd/Ctrl+C`: Copy selected files
- `Cmd/Ctrl+V`: Paste files

### localStorage Keys

```typescript
'p-write-vacy-content'              // Editor text (debounced 1000ms)
'p-write-vacy-privacy'              // Boolean: privacy active state
'p-write-vacy-focus-settings'       // JSON: FocusSettings object
'p-write-vacy-presets'              // JSON: Preset[] array
'p-write-vacy-onboarding-completed' // Boolean: onboarding status
```

### TypeScript Interfaces

```typescript
CaretPosition {
  x: number      // Percentage coordinates (0-100)
  y: number
}

FocusSettings {
  radiusX: number          // Horizontal blur radius (30-150px)
  radiusY: number          // Vertical blur radius (15-100px)
  blurColor: string        // Hex color
  blurOpacity: number      // 0-1 for rgba conversion
  blurSpread: number       // Blur spread (0-100)
  blurIntensity: number    // Blur intensity (0-20px)
  focusShape: 'ellipse' | 'circle'
  backgroundColor: string  // Editor background color
  textColor: string        // Editor text color
}

Preset {
  id: string
  name: string
  settings: FocusSettings
}
```

## Security

### Implemented Security Measures

1. **Path Validation**: All file paths validated to prevent directory traversal
2. **File Size Limit**: 100MB maximum to prevent memory overflow
3. **Context Isolation**: Electron context isolation enabled
4. **No Node Integration**: nodeIntegration disabled in renderer
5. **Preload Script**: Safe API exposure via preload script
6. **Content Security Policy**: CSP headers configured

### IPC Security

All IPC handlers validate:
- File paths are within selected folder
- File extensions are allowed (.txt, .md, .markdown, .json, .log)
- File sizes are within limits
- Operations are authorized

## Testing

### Test Structure

```
src/
├── components/
│   ├── __tests__/
│   │   └── FileExplorer.test.tsx
│   └── FileExplorer/
│       └── hooks/
│           └── __tests__/
│               ├── useFileTree.test.ts
│               ├── useFileOperations.test.ts
│               ├── useFileSelection.test.ts
│               └── useDragAndDrop.test.ts
└── test-utils/
    └── testUtils.tsx
```

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:verbose        # Verbose output
```

### Test Coverage Goals

- **Target**: 80% overall coverage
- **Current**: 89% coverage (106 tests)
- **Critical areas**: FileExplorer (89%), file operations, caret tracking

## Extending the Application

### Adding New Settings

1. Add property to `FocusSettings` interface (types/index.ts)
2. Update `DEFAULT_FOCUS_SETTINGS` in App.tsx
3. Add control to Sidebar.tsx
4. Update FocusOverlay.tsx to use new property
5. Update localStorage persistence logic

### Adding New File Operations

1. Add IPC handler in electron/main.cjs
2. Expose API in electron/preload.cjs
3. Add hook function in useFileOperations.ts
4. Update FileContextMenu.tsx or FileToolbar.tsx
5. Add tests in useFileOperations.test.ts

### Adding New Languages

1. Create translation file: `public/locales/{lang}/translation.json`
2. Add language option to Sidebar.tsx
3. Update i18n configuration in main.tsx
4. Test all UI strings

## Documentation Maintenance

### **IMPORTANT: When modifying the project, always update relevant documentation**

#### Required Updates for Code Changes

1. **For Feature Changes**:
   - Update `STATUS.md` (주요 기능 섹션)
   - Add entry to `CHANGELOG.md` (해당 버전)
   - Update `docs/USER_GUIDE.md` if user-facing
   - Update this `CLAUDE.md` if architecture changed

2. **For Component Changes**:
   - Update component structure in this file
   - Update `STATUS.md` if major refactoring
   - Add CHANGELOG entry for breaking changes

3. **For New Features**:
   - Add to "주요 기능" in `STATUS.md`
   - Create CHANGELOG entry with [Added] tag
   - Update `docs/USER_GUIDE.md` with usage instructions
   - Update `docs/KEYBOARD_SHORTCUTS.md` if shortcuts added
   - Add to this file's "Key Features" section

4. **For Bug Fixes**:
   - Add CHANGELOG entry with [Fixed] tag
   - Update `STATUS.md` "알려진 이슈" if resolved
   - Update tests

5. **For Security Updates**:
   - Update CHANGELOG with [Security] tag
   - Update "Security" section in this file
   - Update `STATUS.md` security metrics

6. **For Version Bumps**:
   - Update `package.json` version
   - Update all version references in `STATUS.md`
   - Add new version section to `CHANGELOG.md`
   - Tag git commit with version

#### Documentation Files Overview

- `STATUS.md`: Current project status, features, quality metrics
- `CHANGELOG.md`: Version history and change log (Keep a Changelog format)
- `CLAUDE.md`: This file - architecture and development guide
- `docs/USER_GUIDE.md`: End-user documentation
- `docs/KEYBOARD_SHORTCUTS.md`: Keyboard shortcut reference
- `docs/archive/`: Historical analysis and refactoring documents

#### Checklist Before Committing

- [ ] Code changes tested and working
- [ ] Tests updated/added if needed
- [ ] STATUS.md updated if feature/major change
- [ ] CHANGELOG.md entry added
- [ ] User documentation updated if user-facing
- [ ] Version bumped if needed (package.json)
- [ ] CLAUDE.md updated if architecture changed

## Performance Optimization

### Current Optimizations

- **FocusOverlay**: Uses React.memo to prevent unnecessary re-renders
- **FileExplorer**: Modular architecture reduces bundle size
- **Debounced Saves**: 1-second delay prevents excessive writes
- **Lazy Loading**: React.lazy for markdown viewer (future)

### Known Performance Issues

- Large folders (1000+ files) may have slow rendering
- Caret tracking not throttled (60fps updates)
- No virtual scrolling for file lists

### Optimization Opportunities

1. Throttle caret updates to 16ms (60fps)
2. Implement virtual scrolling for large file lists
3. Use useMemo for expensive calculations
4. Implement code splitting for optional features

## Build and Deployment

### macOS Build

```bash
npm run electron:build
```

Output: `dist/Pwritevacy-1.0.0-beta-arm64.dmg`

### Build Configuration

- **Code Signing**: Developer ID Application certificate
- **Notarization**: Apple notarization completed
- **DMG**: Includes app icon and drag-to-Applications
- **Target**: macOS ARM64 (Apple Silicon)

### Environment Variables

Required for notarization (in `.env`):
```
APPLE_ID=your-apple-id@email.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX
```

## Browser Compatibility

- **Selection API**: All modern browsers
- **backdrop-filter**: Webkit prefix included for Safari
- **radial-gradient**: All modern browsers
- **contenteditable**: Universal support

Electron minimum: Electron 39+ (Chromium 122+)

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version (v18+ required)
2. **Tests fail**: Run `npm install` to ensure dependencies are current
3. **File operations fail**: Check Electron IPC handlers are registered
4. **Notarization fails**: Verify Apple ID credentials in .env
5. **DMG won't open**: Re-run `npm run electron:build` with clean dist/

### Debug Mode

Enable Electron DevTools in development:
```javascript
// electron/main.cjs
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

---

**Last Updated**: 2025-11-13
**Version**: v1.0.0-beta
**Maintainer**: KWONSU KIM
