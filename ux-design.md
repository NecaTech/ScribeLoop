UX Design & UI Specifications - ScribeLoop

Version: 2.0 (Firebase Edition)
Status: Production
Reference: prd.md, architecture.md

## 1. Design Principles & Atmosphere

### 1.1. Core Philosophy: "The Invisible Interface"
The UI must recede to let the content shine. The reading experience is paramount.
- **Distraction-Free**: No sticky headers, no permanent sidebars during reading.
- **Focus**: The only persistent elements are the text and the navigation.
- **Cognitive Load**: Minimal. Actions should be contextual (appear only when needed).

### 1.2. Typography System
- **Body Text**: High-quality Serif font (Merriweather/Lora/Garamond).
- **UI Elements**: Clean Sans-Serif (Inter/Roboto) for dashboards and modals.
- **Line-height**: 1.6 to 1.8 for comfortable long-form reading.

### 1.3. Color Palette
- **Background**: Off-white / Cream (#FDFBF7) - simulating paper.
- **Text**: Dark Grey (#2D2D2D) - never pure black.
- **Highlight**: Pale Yellow (#FFF9C4) for annotations.
- **Active Highlight**: Orange (#FFE082) when sidebar is open.

## 2. Sitemap & Navigation Structure

**Flat Structure** (Served via Firebase Hosting):

1. **Landing Page (/)**: Pseudo input.
2. **Reader Dashboard (/dashboard)**: List of chapters.
3. **Reading View (/read/:chapterId)**: content + annotations.
4. **Author Console (/#admin)**: Protected management area.

## 3. User Flows

### 3.1. The Reader's Journey
1. **Entry**: User lands on `/`.
2. **Identification**: Types Pseudo "Néné". Stored in LocalStorage.
3. **Selection**: Clicks a chapter (e.g., "Awaiting Feedback").
4. **Reading**: Reads text.
5. **Annotation**:
   - **Desktop**: Selects text -> Right Click -> "Annotate".
   - **Mobile**: Long press -> Tap "Pen" button.
6. **Submission**: Side panel opens. Types comment. Saved to Firestore.
7. **Feedback**: Text becomes highlighted for all users.

### 3.2. The Author's Journey
1. **Access**: Navigates to `/#admin`. Enters secret (verified client-side).
2. **Drafting**: Pastes Markdown into chapter form.
3. **Publishing**: Sets status to "Awaiting Feedback".
4. **Reviewing**: Sees highlights in chapter view.
5. **Validation**: Sets status to "Validated" to lock the chapter.

## 4. UI Screen Specifications

### 4.1. Landing Page
- **Elements**: Logo, Pseudo Input, "Start Reading" button.
- **Behavior**: Minimalist, centered card.

### 4.2. Reader Dashboard
- **Header**: Book Title + Hello {Pseudo}.
- **List**: Chapters grouped by status (Planned, Open, Validated).
- **Indicators**: Status icons (Lock for validated, Open badge for active).

### 4.3. Reading View
- **Layout**: Single central column.
- **Interaction**:
  - Click highlight -> Open sidebar.
  - New selection -> Trigger annotation tool.

### 4.4. Annotation Sidebar
- **Context**: Quoted text.
- **Thread**: Stream of comments.
- **Reply**: Input area at bottom.

## 5. Interaction Model

### 5.1. Desktop
- **Trigger**: `mouseup` + Right Click interception.
- **Menu**: Custom "Annotate" / "Cancel" popover.

### 5.2. Mobile
- **Trigger**: `selectionchange` + Timer.
- **UI**: Floating Action Button (FAB) or Tooltip near selection to avoid fighting native OS menus.

## 6. Accessibility (A11y)
- **Contrast**: 4.5:1 minimum.
- **Keyboard**: Tab navigation support for highlights.
- **ARIA**: Proper labeling for interactive elements.