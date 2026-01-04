Product Requirements Document (PRD) - ScribeLoop

Version: 2.0

Status: Production (MVP Deployed)

Project Owner: néné

Author: John (PM Agent)

## 1. Executive Summary

ScribeLoop is a private web application designed for authors to collect and manage feedback on their manuscripts. It replaces fragmented feedback channels with a centralized, iterative platform where a trusted circle of readers can leave contextual annotations directly on the text. The system prioritizes minimalism, mobile-first reading, and serverless cloud architecture using Firebase.

**Production URL**: https://scribeloop.web.app

## 2. Stakeholder Profiles

| Persona | Role | Key Needs |
|---------|------|-----------|
| The Author | Creator & Admin | Securely publish chapters, manage the "planned" vs "actual" structure, moderate nested discussions, and validate feedback to close iterations. |
| The Reader | Trusted Circle | Frictionless access (Pseudo-only), intuitive annotation tools (Web/Mobile), and the ability to discuss suggestions with other readers. |

## 3. Functional Requirements

### 3.1. Project & Chapter Management

**Book Metadata**: Store and display the Book Title and the total number of planned chapters.

**Chapter Workflow Statuses**:
- **Planned (Prévus)**: Placeholder chapters not yet written or uploaded.
- **Awaiting Feedback (En attente de feedback)**: Published chapters open for annotations and replies.
- **Validated (Validés)**: Finalized version of the chapter; locked for interaction but available for reading history.

### 3.2. Reader Interaction Model

**Identification**: No account creation. Users enter a "Pseudo" upon entry. The pseudo is saved in localStorage for attribution.

**Contextual Annotation Engine**:
- **Desktop**: Text Selection + Right-Click custom context menu to "Add Annotation."
- **Mobile**: Text Selection + Long-Press (Appui long) to trigger the annotation menu.

**Collaborative Discussion**:
- **Visibility**: Readers see all existing annotations (highlighted text segments).
- **Threading**: Readers can reply to an existing annotation to comment on a critique or suggest an alternative.

### 3.3. Author Console

**Back-office**: A private area to upload/copy-paste chapter content (Markdown supported).

**Feedback Moderation**: A centralized view of all active threads. The author can respond as "Author" and toggle the status of a chapter to move the project forward.

## 4. Business Rules & Logic

### 4.1. The "No Orphan" Integrity Rule

**Constraint**: Once a chapter is moved to "Awaiting Feedback," the source text becomes immutable.

**Reasoning**: To prevent "orphan" comments where the underlying text offsets change, breaking the link between a comment and its specific passage.

### 4.2. Public Feedback Loop

All readers see all comments. This fosters a "Beta Reader" community feel and allows the author to see if multiple people have the same issue with a specific paragraph.

## 5. Technical Requirements

### 5.1. Database Strategy (Firebase Firestore)

Cloud Firestore is the NoSQL database for all data storage.

**Collections**:
- `metadata`: Project settings (book_title, total_chapters)
- `chapters`: id, title, content_md, status, sort_order, created_at
- `annotations`: id, chapter_id, pseudo, quote, start_offset, end_offset, comment, parent_id, created_at

### 5.2. Hosting

Firebase Hosting serves the static frontend files globally via CDN.

**Benefits**:
- Zero cold start (no server to wake up)
- Automatic HTTPS
- Free tier (10 GB/month bandwidth)

### 5.3. Interaction & UI

**Selection API**: Use the native browser Selection API to calculate character offsets for anchoring annotations.

**Mobile Overrides**: Ensure the custom long-press menu does not conflict with native iOS/Android "Copy/Paste" menus where possible.

## 6. UX & UI Guidelines

**Typography**: Priority on long-form reading comfort (Serif fonts, adjustable line height).

**Visual Cues**: Subtle text highlighting for annotated parts. Clicking a highlight opens a side-panel with the discussion thread.

**Minimalism**: Zero distractions. No sidebars, headers, or footers while the reader is in "Reading Mode."

## 7. Success Metrics

- **Engagement**: High ratio of nested replies (indicates active discussion).
- **Simplicity**: Reader "Time-to-Comment" under 30 seconds from landing.
- **Cost**: $0/month for MVP usage (Firebase free tier).