UX Design & UI Specifications - ScribeLoop

Version: 1.0
Status: Ready for Development
Designer: Sally (UX Agent)
Reference: prd.md, architecture.md

1. Design Principles & Atmosphere

1.1. Core Philosophy: "The Invisible Interface"

The UI must recede to let the content shine. The reading experience is paramount.

Distraction-Free: No sticky headers, no permanent sidebars during reading.

Focus: The only persistent elements are the text and the navigation back to the dashboard.

Cognitive Load: Minimal. Actions should be contextual (appear only when needed).

1.2. Typography System

Body Text (The Manuscript): High-quality Serif font (e.g., Merriweather, Lora, or EB Garamond).

Optimal line-length: 60-75 characters (approx. 600-700px max-width).

Line-height: 1.6 to 1.8 for comfortable long-form reading.

Font-size: Base 18px (adjustable ideally, but hardcoded 18px is fine for MVP).

UI Elements (Menus, Buttons, Metadata): Clean Sans-Serif (e.g., Inter, Roboto, or System UI).

Used for the Dashboard, Author Console, and Annotation Threads.

1.3. Color Palette (Minimalist)

Background: Off-white / Cream (#FDFBF7) to reduce eye strain (simulating paper).

Text: Dark Grey (#2D2D2D) - never pure black.

Primary Action: Muted Blue or Teal (for buttons).

Highlights (Annotations):

Default Highlight: Pale Yellow (#FFF9C4) with a subtle underline.

Active/Selected Highlight: Darker Yellow or Orange (#FFE082).

Feedback/Error: Soft Red.

2. Sitemap & Navigation Structure

The application structure is intentionally flat to ensure quick access.

Landing Page (/)

Welcome Message

Pseudo Input Form

Reader Dashboard (/dashboard)

Project Title & Progress

List of Chapters (Grouped by Status)

Reading View (/read/:chapterId)

The Manuscript Content

Overlay: Annotation Sidebar (Hidden by default)

Author Console (/admin - Secret/Protected)

Chapter Management (Upload/Edit/Reorder)

Feedback Moderation Dashboard

3. User Flows

3.1. The Reader's Journey (Critical Path)

Entry: User lands on /.

Identification: User types "Néné" (Pseudo) -> Clicks "Enter".

System stores pseudo in LocalStorage.

Selection: User sees Chapter 1: The Beginning (Status: Awaiting Feedback). Clicks it.

Reading: User reads the text. No distractions.

Reaction: User finds a typo or an interesting plot point.

Annotation:

Desktop: Selects text -> Right Clicks -> Custom Menu appears -> Clicks "Annotate".

Mobile: Long presses text -> Adjusts handles -> Tap "Annotate" tooltip.

Discussion: Side panel slides in. User types comment. Hits "Post".

Feedback: Text is now permanently highlighted.

3.2. The Author's Journey

Setup: Author logs into /admin.

Drafting: Pastes Markdown content into "Chapter 3". Sets status to Planned.

Publishing: Changes status to Awaiting Feedback.

Reviewing: Opens Chapter 3. Sees 5 yellow highlights.

Interaction: Clicks a highlight. Reads user comments. Replies as "Author".

Validation: Decides feedback is sufficient. Sets status to Validated.

System locks the chapter. No new annotations allowed.

4. UI Screen Specifications

4.1. Landing Page

Layout: Centered card on a blank canvas.

Elements:

Logo/Title: "ScribeLoop" (Elegant typography).

Input Field: "Enter your pseudo..." (Large, distinct).

CTA: "Start Reading" (Primary Button).

Behavior: Button disabled until input length > 2 chars.

4.2. Reader Dashboard

Header: Book Title + "Hello, {Pseudo}".

Chapter List:

Card/Row Style: Clean rows.

Status Indicators:

🔴 Planned (Greyed out/Non-clickable).

🟢 Awaiting Feedback (Bright, clickable, "Open" badge).

🔒 Validated (Lock icon, clickable for read-only).

Metadata: Show annotation count per chapter (e.g., "💬 12 comments").

4.3. Reading View (The Core)

Layout: Single column, centered text. Wide margins on desktop. Full width minus padding on mobile.

Navigation: Minimal "← Back" arrow (Top Left, sticky or fades in on scroll up).

Annotation Sidebar (Drawer):

Position: Fixed Right (Desktop) / Bottom Sheet (Mobile).

Trigger: Opens when clicking an existing highlight OR creating a new one.

Content:

Context: "Selected text quote..." (Italic, grey).

Thread: List of comments (Pseudo + Timestamp + Text).

Reply Box: Textarea + "Reply" button.

5. Interaction Model: The Annotation Engine

This is the most complex technical interaction. It must distinguish between native browser behaviors and our custom app logic.

5.1. Desktop Interaction

Trigger: mouseup event detection.

Logic:

User selects text.

Browser native selection highlight appears (usually blue).

User Right Clicks (ContextMenu).

App Interception: Prevent default browser context menu.

Custom Menu: Show small popover at cursor position:

Option 1: "💬 Annotate"

Option 2: "❌ Cancel"

Action: Clicking "Annotate" calculates offsets, saves temp highlight, and opens Sidebar.

5.2. Mobile Interaction

Trigger: selectionchange + Touch events.

Logic:

User Long Presses to trigger native selection handles.

User adjusts handles.

Mobile OS Behavior: Usually shows a black toolbar (Copy/Paste/Share).

App Strategy:

Preferred: Detect valid selection -> Show a floating "Floating Action Button" (FAB) with a Pen icon 🖋️ at the bottom right of the screen.

Why? Fighting the native OS toolbar is buggy. Providing a distinct, separate button is safer.

Action: Tapping the FAB opens the Bottom Sheet for comment entry.

5.3. Visual Feedback States

Hovering a Highlight:

Highlight color deepens.

Cursor changes to pointer.

Active Highlight (Sidebar Open):

Highlight turns Orange.

Other highlights fade slightly (opacity 0.6) to focus attention.

6. Accessibility (A11y) Requirements

Keyboard Nav: Users must be able to tab through existing highlights.

Contrast: Ensure text/background contrast ratio is at least 4.5:1.

Screen Readers: Annotations must be announced. Use <mark> tags or aria-details to link text to comments.