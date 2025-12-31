Product Requirements Document (PRD) - ScribeLoop

Version: 1.3

Status: Finalized for Development

Project Owner: néné

Author: John (PM Agent)

1. Executive Summary

ScribeLoop is a private web application designed for authors to collect and manage feedback on their manuscripts. It replaces fragmented feedback channels with a centralized, iterative platform where a trusted circle of readers can leave contextual annotations directly on the text. The system prioritizes minimalism, mobile-first reading, and lightweight server-side storage using SQLite.

2. Stakeholder Profiles

Persona

Role

Key Needs

The Author

Creator & Admin

Securely publish chapters, manage the "planned" vs "actual" structure, moderate nested discussions, and validate feedback to close iterations.

The Reader

Trusted Circle

Frictionless access (Pseudo-only), intuitive annotation tools (Web/Mobile), and the ability to discuss suggestions with other readers.

3. Functional Requirements

3.1. Project & Chapter Management

Book Metadata: Store and display the Book Title and the total number of planned chapters.

Chapter Workflow Statuses:

Planned (Prévus): Placeholder chapters not yet written or uploaded.

Awaiting Feedback (En attente de feedback): Published chapters open for annotations and replies.

Awaiting Validation (En attente de validation): Author has closed the feedback window and is reviewing/editing based on notes.

Validated (Validés): Finalized version of the chapter; locked for interaction but available for reading history.

3.2. Reader Interaction Model

Identification: No account creation. Users enter a "Pseudo" upon entry. The pseudo is saved in the session/local storage for attribution.

Contextual Annotation Engine:

Desktop: Text Selection + Right-Click custom context menu to "Add Annotation."

Mobile: Text Selection + Long-Press (Appui long) to trigger the annotation menu.

Collaborative Discussion:

Visibility: Readers see all existing annotations (highlighted text segments).

Threading: Readers can reply to an existing annotation to comment on a critique or suggest an alternative.

3.3. Author Console

Back-office: A private area to upload/copy-paste chapter content (Markdown supported).

Feedback Moderation: A centralized view of all active threads. The author can respond as "Author" and toggle the status of a chapter to move the project forward.

4. Business Rules & Logic

4.1. The "No Orphan" Integrity Rule

Constraint: Once a chapter is moved to "Awaiting Feedback," the source text becomes immutable.

Reasoning: To prevent "orphan" comments where the underlying text offsets change, breaking the link between a comment and its specific passage.

Correction Loop: Changes to the text can only be saved as a new version after the author has marked the previous annotations as "Consulted."

4.2. Public Feedback Loop

All readers see all comments. This fosters a "Beta Reader" community feel and allows the author to see if multiple people have the same issue with a specific paragraph.

5. Technical Requirements

5.1. Database Strategy (SQLite)

A server-side SQLite database will be the single source of truth.

Table: metadata (Project settings: Title, Target Chapter Count).

Table: chapters (id, title, content_md, status, sort_order, created_at).

Table: annotations (id, chapter_id, pseudo, selected_text, start_offset, end_offset, comment, parent_id (for replies), timestamp).

Table: logs (id, timestamp, pseudo, action) for basic access tracking.

5.2. Interaction & UI

Selection API: Use the native browser Selection API to calculate character offsets for anchoring annotations.

Mobile Overrides: Ensure the custom long-press menu does not conflict with native iOS/Android "Copy/Paste" menus where possible, or provides a clear "Annotate" action within the selection.

6. UX & UI Guidelines

Typography: Priority on long-form reading comfort (Serif fonts, adjustable line height).

Visual Cues: Subtle text highlighting for annotated parts. Clicking a highlight opens a side-panel or overlay with the discussion thread.

Minimalism: Zero distractions. No sidebars, headers, or footers while the reader is in "Reading Mode."

7. Success Metrics

Engagement: High ratio of nested replies (indicates active discussion).

Simplicity: Reader "Time-to-Comment" under 30 seconds from landing.

Portability: The entire project state is contained within a single .sqlite file.