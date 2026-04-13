# Architecture

This document provides a technical overview of the Issue Tracker project.

## Overview

The Issue Tracker is built as a highly modular Vanilla JavaScript Single Page Application (SPA). The application enforces separation of concerns without relying on external libraries or frameworks like React, Vue, or Angular.

## Core Structure

- `index.html`: The structural foundation containing semantic markup for the board and templates for the modal.
- `styles.css`: The styling rules ensuring a responsive layout and smooth interactive states.
- `app.js`: The central logic controller containing state management, view updates, and event bus mechanisms.

## State Management

Data flows predictably within the application:
1. **Source of Truth**: The `State` object (encapsulated in `app.js`) acts as the single source of truth for all issue data.
2. **Persistence**: The state interacts with the browser's `window.localStorage` API to load and save tasks seamlessly.
3. **Reactivity**: Although pure vanilla, the application mimics reactivity. Whenever the state changes (an issue is added, moved, or deleted), a central rendering function is invoked to update exclusively the affected portions of the DOM.

## Data Model

Issues are stored as an array of objects. An individual issue adheres to the following interface:

```typescript
interface Issue {
  id: string;          // A unique identifier (e.g., generated timestamp or UUID)
  title: string;       // A concise summary of the task
  description: string; // Detailed information about the issue
  status: string;      // Enum-like string: 'todo' | 'in-progress' | 'completed'
  createdAt: number;   // Epoch timestamp for sorting functionality
}
```

## Drag and Drop API

The native HTML5 `draggable="true"` attribute and associated events are preferred over third-party libraries for performance and standard adherence.
- `dragstart`: Triggered when an issue card is dragged. Sets the data payload (the issue's `id`).
- `dragover`: Prevented by default on the columns to allow dropping.
- `dragenter` / `dragleave`: Used to toggle visual cues (CSS classes) indicating a valid drop target.
- `drop`: Reads the dragged `id`, updates the state's `status` to match the drop zone, and triggers a re-render.
