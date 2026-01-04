User Stories & Epics - ScribeLoop

Version: 2.0 (Firebase)
Project: ScribeLoop
Status: Production
Reference: prd.md, architecture.md

## Epic 1: Admin & Chapter Management

**Goal**: Allow the author to set up the project and manage the manuscript flow via the Admin Console.

### Story 1.1: Project Initialization
**As an Author,**
I want to define my book title and the number of planned chapters,
**So that** my readers can see the overall scope of the project.

- **AC 1**: Metadata in Firestore stores `book_title` and `total_chapters`.
- **AC 2**: Dashboard shows progress (e.g., "3/10 chapters published").

### Story 1.2: Chapter Upload (Markdown)
**As an Author,**
I want to paste Markdown content into a chapter,
**So that** formatting (italics, bold) is preserved during reading.

- **AC 1**: Admin Console provides a text area for Markdown input.
- **AC 2**: Content is saved in the `chapters` collection in Firestore.

### Epic 2: Reader Access & Portal

**Goal**: Provide a frictionless entry point for the "Trusted Circle".

### Story 2.1: Pseudo-based Identity
**As a Reader,**
I want to enter a simple nickname upon arrival,
**So that** I don't have to create an account but my feedback is attributed to me.

- **AC 1**: Entry screen blocks access until a "Pseudo" is provided.
- **AC 2**: Pseudo is stored in `localStorage` in the browser.

### Story 2.2: Chapter Dashboard
**As a Reader,**
I want to see a list of chapters categorized by status,
**So that** I know which ones are ready for my feedback.

- **AC 1**: Chapters are grouped into "Awaiting Feedback", "In Review", and "Validated".
- **AC 2**: "Planned" chapters are visible but disabled.

## Epic 3: The Annotation Engine

**Goal**: Enable contextual feedback on web and mobile using Firebase Firestore.

### Story 3.1: Desktop Contextual Annotation (Right-Click)
**As a Reader,**
I want to select text and right-click to add a comment,
**So that** my feedback is anchored to a specific passage.

- **AC 1**: Right-clicking on a text selection opens a custom "Annotate" menu.
- **AC 2**: Selection offsets (start/end) are correctly captured and saved in `annotations` collection.

### Story 3.2: Mobile Contextual Annotation (Long-Press)
**As a Mobile Reader,**
I want to long-press a selection to add a comment,
**So that** I can provide feedback comfortably on my phone.

- **AC 1**: Touch start/end detection triggers the annotation menu/button.
- **AC 2**: Custom UI handling prevents conflict with native OS toolbars.

## Epic 4: Collaborative Loop

**Goal**: Facilitate discussion between readers and author.

### Story 4.1: Nested Discussions
**As a Reader,**
I want to reply to an existing annotation,
**So that** I can agree with or challenge a suggestion made by another reader.

- **AC 1**: Each annotation has a "Reply" button.
- **AC 2**: Replies are stored with a `parent_id` in the `annotations` collection.

### Story 4.2: Chapter Validation Workflow
**As an Author,**
I want to move a chapter to "Validated" status once the feedback is processed,
**So that** readers know the iteration is complete.

- **AC 1**: Admin can toggle status from "Awaiting Feedback" to "Validated" in the Admin Console.
- **AC 2**: Moving to "Validated" locks the chapter (no new annotations allowed).