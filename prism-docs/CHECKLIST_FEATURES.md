# Prism Platform — Checklist & Assessment Features Guide

> Comprehensive reference for all UI patterns, question types, and features available in checklists, audits, assessments, surveys, and competitions.

---

## Table of Contents

1. [Programs Overview](#1-programs-overview)
2. [Question Types](#2-question-types)
3. [Image Upload Pattern (Standard)](#3-image-upload-pattern-standard)
4. [Section-Level Features](#4-section-level-features)
5. [Audit Header — Store & Employee Selection](#5-audit-header--store--employee-selection)
6. [Checklist Layout & Navigation](#6-checklist-layout--navigation)
7. [Progress Tracking](#7-progress-tracking)
8. [Scoring System](#8-scoring-system)
9. [Draft & Autosave](#9-draft--autosave)
10. [Offline Support](#10-offline-support)
11. [Validation & Submission](#11-validation--submission)
12. [Conditional Logic](#12-conditional-logic)
13. [Geo-Location Capture](#13-geo-location-capture)
14. [Program Types & Feature Matrix](#14-program-types--feature-matrix)
15. [Active Programs](#15-active-programs)

---

## 1. Programs Overview

Programs are the top-level entities representing structured operational processes. Each program contains **sections**, and each section contains **questions**. Users fill responses per question, and submissions are tracked per program instance.

### Hierarchy

```
Program
  └─ Section 1
  │    ├─ Question 1.1
  │    ├─ Question 1.2
  │    └─ Question 1.3
  └─ Section 2
       ├─ Question 2.1
       └─ Question 2.2
```

### Program Types

| Type                    | Slug                     | Description                                      |
| ----------------------- | ------------------------ | ------------------------------------------------ |
| Training Assessment     | `TRAINING_ASSESSMENT`    | Evaluate employee training readiness              |
| QA Audit                | `QA_AUDIT`               | Quality assurance with zero-tolerance checks      |
| Compliance Inspection   | `COMPLIANCE_INSPECTION`  | Regulatory and financial compliance audits        |
| Operational Survey      | `OPERATIONAL_SURVEY`     | Manager/AM visit checklists and operational data  |
| Campus Hiring           | `CAMPUS_HIRING`          | Candidate evaluation and interview assessment     |
| Competition Scoring     | `COMPETITION_SCORING`    | Inter-store or inter-region competition judging   |
| Custom                  | `CUSTOM`                 | Flexible programs (surveys, feedback, HR connect) |

---

## 2. Question Types

### 2.1 Text Input (`TEXT`)

Free-text input field. Not scored by default.

- **Use case:** Remarks, observations, open-ended feedback.
- **Weight:** Typically 0 (non-scoring).
- **UI:** Single-line or multi-line input with character count.

---

### 2.2 Number Input (`NUMBER`)

Numeric value input with optional min/max range.

- **Use case:** Counts, measurements, scores entered manually.
- **UI:** Number field with increment/decrement controls.

---

### 2.3 Yes / No (`YES_NO`)

Binary choice question.

- **Use case:** Simple compliance checks, boolean confirmations.
- **Scoring:** Yes = full weight, No = 0 (or negative weight if configured).
- **UI:** Two radio-style buttons — **Yes** (green) and **No** (red).

---

### 2.4 Dropdown — Radio Buttons (`DROPDOWN`)

Single-select from a list of options, rendered as **horizontal radio-style buttons** (not a `<select>` dropdown).

- **Use case:** Yes / No / N/A compliance checks, Compliant / Non-Compliant / Partially Compliant.
- **Options stored as:** Plain strings in database (e.g., `["Yes", "No", "N/A"]`).
- **UI behaviour:**
  - Each option is a button in a horizontal row.
  - Selected option is highlighted with a colored background.
  - Color coding:
    - **Yes / Compliant** → Green (`bg-green-500/20`, `border-green-500/60`)
    - **No / Non-Compliant** → Red (`bg-red-500/20`, `border-red-500/60`)
    - **N/A / Partially Compliant** → Gray/Amber (`bg-obsidian-500/20`)
  - Click to select; click again to deselect.
- **Helper functions:** `yna(text, weight)` for Yes/No/N/A, `yna1(text)` for unweighted.

---

### 2.5 Multiple Choice (`MULTIPLE_CHOICE`)

Multi-select from a list of options.

- **Use case:** Scored evaluations with predefined options (e.g., Excellent / Good / Average / Below Average / Poor).
- **Options stored as:** Plain strings in database.
- **UI:** Pills or checkboxes, multiple selectable.
- **Scoring:** Each option can map to a score value.

---

### 2.6 Rating Scale (`RATING_SCALE`)

Numeric scale rating (e.g., 1–5 or 1–10).

- **Use case:** Subjective quality assessments, interview scoring.
- **Configuration:** `minValue`, `maxValue` (defaults: 1–5).
- **UI:** Star rating or numbered scale buttons.

---

### 2.7 Image Upload (`IMAGE_UPLOAD`)

Photo capture or file upload for visual evidence. **Uses the standard image upload pattern** (see Section 3).

- **Use case:** Store photos, equipment evidence, before/after shots.
- **Features:**
  - Camera capture on mobile (`capture="environment"`)
  - Drag & drop on desktop
  - Full preview with expand/collapse
  - Change Image (edit) and Remove actions
  - Optional annotation notes

---

### 2.8 File Upload (`FILE_UPLOAD`)

General file attachment.

- **Use case:** PDF reports, spreadsheets, documentation proof.
- **UI:** Drop zone with file type indicator and remove option.

---

### 2.9 Digital Signature (`SIGNATURE`)

Canvas-based signature capture.

- **Use case:** Audit signoff, acknowledgement of findings.
- **UI:** Touch/mouse drawing canvas with Clear and Confirm actions.

---

## 3. Image Upload Pattern (Standard)

> **This is the standard pattern for ALL image uploads in the platform — both question-level and section-level.**

### Multi-Image Support

All image upload components support **multiple images**. Users can:

- Select multiple files at once via the native file picker (the `<input>` has `multiple` attribute).
- Drag & drop multiple files.
- Upload one at a time and keep adding more via the "Add more photos" button.
- Each image can be individually **replaced**, **annotated** (Edit), or **removed**.

### Data Model

| Field         | Type       | Purpose                                            |
| ------------- | ---------- | -------------------------------------------------- |
| `imageUrl`    | `string`   | Backward-compat: first image URL                   |
| `imageUrls`   | `string[]` | Full array of all uploaded image URLs               |

Both fields are emitted on every change. `imageUrl` always equals `imageUrls[0]` or `''`.

### UI States

#### State 1 — Empty / Upload Prompt

```
┌──────────────────────────────────┐
│  ＋  Click to upload or take     │
│      photos                      │
│                                  │
│  Drag & drop · Multiple photos   │
│  PNG, JPG up to 10 MB each       │
└──────────────────────────────────┘
```

- Dashed border container with plus icon.
- Click triggers file picker (with `multiple` + `capture="environment"` for mobile camera).
- Supports drag & drop with visual feedback.
- Label says "photos" (plural) to indicate multi-upload.

#### State 2 — Uploading

```
┌──────────────────────────────────┐
│  ⟳  Uploading...                 │
└──────────────────────────────────┘
```

- Spinner animation.
- Shown while any file batch is processing.

#### State 3 — Image Grid (with per-image actions)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ✅ Uploaded  │  │ ✅ Uploaded  │  │ ✅ Uploaded  │
│             │  │             │  │             │
│  [Photo 1]  │  │  [Photo 2]  │  │  [Photo 3]  │
│             │  │             │  │             │
│ Replace|Edit│  │ Replace|Edit│  │ Replace|Edit│
│ |Remove     │  │ |Remove     │  │ |Remove     │
└─────────────┘  └─────────────┘  └─────────────┘

┌──────────────────────────────────────────────┐
│  ＋  Add more photos                         │
└──────────────────────────────────────────────┘

  3 photos uploaded
```

- **Grid layout:** 2 columns (mobile) / 3 columns (desktop).
- Each image is a clickable thumbnail card:
  - **"Uploaded" badge:** Green badge with checkmark.
  - **Click to expand:** Expands to full-width, collapses on second click.
  - **Hover actions overlay:** Gradient overlay at the bottom with:
    - **Replace:** Opens file picker to replace just this image.
    - **Edit:** Opens annotation editor for this image.
    - **Remove:** Deletes this image from the list.
- **"Add more photos" button** below the grid — click opens file picker again.
- **Photo count badge:** Shows `"N photos uploaded"` below grid.

### Per-Image Actions

| Action   | Behaviour                                                                |
| -------- | ------------------------------------------------------------------------ |
| Replace  | Opens file picker, replaces only this specific image in the array        |
| Edit     | Opens ImageAnnotationEditor modal for this image (circles, lines, text)  |
| Remove   | Removes this image from the array, updates parent                        |
| Expand   | Click on image toggles between thumbnail (`max-h-40`) and full size     |

### Implementation Notes

- Local preview via `URL.createObjectURL(file)` shown immediately while upload completes.
- On successful upload, preview URL is replaced with the server URL.
- On failure, local blob URL is kept (image still visible).
- Each image tracks both a display `url` and an `originalUrl` (pre-annotation) for re-editing.
- Hidden `<input type="file" accept="image/*" multiple>` triggered programmatically.
- Per-image replace uses separate hidden file inputs stored in a `Map<string, HTMLInputElement>`.
- Uses unique internal IDs (`img_{timestamp}_{counter}`) for React keys and state tracking.

### Optional: Annotation Notes

When `allowAnnotation` is enabled (question-level only):

- Textarea below the image grid for free-text annotation notes.
- Collapsed by default; opens on demand.

---

## 4. Section-Level Features

Certain program types enable additional per-section inputs beyond the questions.

### 4.1 Section Remarks

- **UI:** Textarea below all questions in a section.
- **Label:** "Section Remarks"
- **Placeholder:** "Add observations, notes, or follow-up actions for this section..."
- **Data key:** `_section_remarks_{sectionId}` (synthetic response).
- **Character limit:** No hard limit; resizable textarea.

### 4.2 Section Photo Evidence

- **UI:** Multi-image upload component (using standard pattern from Section 3) below remarks.
- **Label:** "Photo Evidence"
- **Data key:** `_section_image_{sectionId}` (synthetic response, stores `imageUrl` + `imageUrls`).
- **Behaviour:** Identical to standard multi-image upload pattern — grid of thumbnails, add more, per-image replace/edit/remove.

### 4.3 Enabled Programs

Section-level remarks and photo evidence are enabled for:

| Program Type            | Section Remarks | Section Photo |
| ----------------------- | :-------------: | :-----------: |
| Training Assessment     |       ✅        |      ✅       |
| QA Audit                |       ✅        |      ✅       |
| Compliance Inspection   |       ✅        |      ✅       |
| Operational Survey      |       ❌        |      ❌       |
| Campus Hiring           |       ❌        |      ❌       |
| Competition Scoring     |       ❌        |      ❌       |
| Custom                  |       ❌        |      ❌       |

---

## 5. Audit Header — Store & Employee Selection

Before filling any checklist, auditors must select the **store** and **employee** being assessed.

### Bidirectional Auto-Fill

The AuditHeader provides two searchable dropdowns:

1. **Store Selector** — Searchable dropdown of all company stores.
2. **Employee Selector** — Searchable dropdown of all company employees.

**Bidirectional behaviour:**

- **Select Store first →** Employee list filters to that store. Auto-fills store details.
- **Select Employee first →** Store auto-fills to the employee's assigned store. Store details populate.

### Auto-Filled Details

| Field          | Source          |
| -------------- | --------------- |
| Region         | Store → Region  |
| Area Manager   | Store → AM      |
| HR Manager     | Store → HR      |
| Trainer        | Store → Trainer |
| Store Format   | Store metadata  |
| Menu Type      | Store metadata  |
| Price Group    | Store metadata  |
| Employee ID    | Employee record |
| Department     | Employee record |
| Designation    | Employee record |

### UI Layout

- Two-column layout: Store selector (left), Employee selector (right).
- Auto-filled details displayed in a grid of small info cards below.
- Non-editable auto-filled fields — derived from master data.
- Search icon in dropdown with filter-as-you-type.

### Z-Index / Stacking Rules

The AuditHeader dropdowns **must always render on top** of all other page content (checklist sections, placeholder cards, etc.).

| Element                 | Z-Index | Notes                                              |
| ----------------------- | ------- | -------------------------------------------------- |
| AuditHeader wrapper     | `z-40`  | `relative z-40` on the outer page-level container  |
| AuditHeader glass card  | `z-40`  | `relative z-40 overflow-visible` on the card       |
| Selector grid           | `z-20`  | `relative z-20` on the grid container              |
| Active selector column  | `z-50`  | Dynamic — only when its dropdown is open           |
| Inactive selector col   | `z-10`  | Drops back down when closed                        |
| Dropdown panel          | `z-50`  | Absolute-positioned options list                   |
| Content below header    | —       | No explicit z-index — naturally sits behind header |

**Key rules:**
- The parent glass card must have `overflow-visible` so dropdown panels are not clipped.
- The page-level wrapper around AuditHeader must carry `relative z-40` to create a stacking context above sibling content.
- When a dropdown opens, its parent `<div>` switches to `z-50`; when it closes it returns to `z-10` — this ensures store and employee dropdowns don't conflict with each other.

---

## 6. Checklist Layout & Navigation

### All-at-Once Layout

All sections are rendered on a **single scrollable page** — no pagination, no section tabs, no Previous/Next navigation.

- Each section appears as a distinct card with a header (section title + description).
- Sections stack vertically.
- The user scrolls through the entire checklist naturally.
- Sections have visual separators and clear headers.

### Sticky Bottom Bar

A sticky bar at the bottom of the screen provides:

- **Progress indicator:** "X / Y answered" with progress bar.
- **Save Draft** button — saves current state without validation.
- **Submit** button — validates all required fields and submits.

---

## 7. Progress Tracking

### Progress Bar

- Displays at the bottom of the page in the sticky bar.
- Shows: `answeredCount / totalQuestions answered`.
- Visual fill bar with percentage.
- **Excludes** synthetic section-level keys (`_section_remarks_*`, `_section_image_*`) from the total count.
- Only counts question-level responses.

### Question Numbering

Questions are numbered sequentially within each section: Q1, Q2, Q3...

---

## 8. Scoring System

### Weighted Scoring

Each question can have a `weight` (positive integer) and optional `negativeWeight`.

- **Yes / Compliant →** awards full `weight` points.
- **No / Non-Compliant →** awards 0 points (or `negativeWeight` if configured).
- **N/A →** question excluded from scoring (neither adds nor subtracts).

### Section Scoring

Section scores = sum of question scores within the section.

### Program Total Score

Total = sum of all section scores. Can be displayed as:

- Raw score (e.g., 142 / 180)
- Percentage (e.g., 78.9%)
- Grade (e.g., A / B / C / D)

### Zero-Tolerance

Some programs (e.g., QA Audit) have **zero-tolerance sections** where any failure results in an automatic score of 0 for the entire audit.

### Scoring Configuration

- `scoringEnabled` — per-question toggle.
- `weight` — points for correct/positive answer.
- `negativeWeight` — penalty for negative answer.
- `options` + scoring map — for MULTIPLE_CHOICE with variable scores per option.

---

## 9. Draft & Autosave

### Autosave

- Automatic save every **15 seconds** if there are unsaved changes.
- Visual "Saving..." indicator during autosave.
- "Saved" confirmation on success.
- Autosave only fires when `dirty` flag is true.

### Manual Save Draft

- "Save Draft" button in the sticky bottom bar.
- Saves all current responses, section remarks, and section images.
- Draft can be resumed later.
- No validation required for draft saves.

### Draft Submission States

| State      | Description                            |
| ---------- | -------------------------------------- |
| `draft`    | In progress, not yet submitted         |
| `submitted`| Completed and submitted for processing |
| `synced`   | Confirmed synced to server             |
| `archived` | Historical record                      |

---

## 10. Offline Support

### Architecture

- Responses are stored locally (IndexedDB / localStorage).
- Online/offline status is detected automatically.
- Pending changes are queued for sync.

### Behaviour

| Status  | Behaviour                                        |
| ------- | ------------------------------------------------ |
| Online  | Autosave syncs directly to server every 15 sec   |
| Offline | Responses stored locally, queued for sync         |
| Reconnect | Queued responses automatically bulk-synced      |

### Visual Indicators

- Online: Green dot or no indicator (default state).
- Offline: Orange banner — "You're offline. Responses will sync when connected."
- Syncing: Spinner with "Syncing..." message.

---

## 11. Validation & Submission

### Required Field Validation

On Submit, all required questions must have a response.

- Missing required fields are highlighted in red.
- Error count shown: "X required questions unanswered".
- **Scroll-to-error:** Page auto-scrolls to the first unanswered required question using `id={`q-${question.id}`}` anchors.

### Validation Rules

- `required` questions must have a non-empty response.
- `NUMBER` fields validate min/max range.
- `IMAGE_UPLOAD` validates that a file is uploaded (if required).
- Conditional questions: only validated if their trigger condition is met.

### Submission Flow

1. User clicks **Submit**.
2. Validation runs across all sections.
3. If errors → scroll to first error, show error indicators.
4. If valid → submission sent to server, state changes to `submitted`.
5. Confirmation screen on success.

---

## 12. Conditional Logic

### Trigger Configuration

Questions can be shown/hidden based on previous answers.

```
trigger_question: Q1
trigger_value: "No"
→ Show Q1a (follow-up question)
```

### Follow-Up Detection

The checklist engine detects follow-up questions from the program configuration and only renders them when the trigger condition is met.

### UI Behaviour

- Hidden questions are not rendered in the DOM.
- When a trigger value matches, the follow-up question appears with a slide-in animation.
- Changing the trigger answer re-evaluates visibility.
- Hidden question responses are cleared if the trigger no longer matches.

---

## 13. Geo-Location Capture

### Captured Data

| Field     | Type    |
| --------- | ------- |
| latitude  | Float   |
| longitude | Float   |
| accuracy  | Float   |
| timestamp | ISO8601 |

### Behaviour

- Captured automatically on submission (if program has `geoEnabled`).
- Uses browser Geolocation API.
- Permission prompt shown to user.
- Stored with the submission record.

---

## 14. Program Types & Feature Matrix

| Feature                     | Training | QA Audit | Compliance | Operations | Campus Hiring | Competition | Custom |
| --------------------------- | :------: | :------: | :--------: | :--------: | :-----------: | :---------: | :----: |
| Scoring                     |    ✅    |    ✅    |     ✅     |     ✅     |      ✅       |     ✅      |   ⚙️   |
| Section Remarks             |    ✅    |    ✅    |     ✅     |     ❌     |      ❌       |     ❌      |   ❌   |
| Section Photo Evidence      |    ✅    |    ✅    |     ✅     |     ❌     |      ❌       |     ❌      |   ❌   |
| Zero-Tolerance              |    ❌    |    ✅    |     ❌     |     ❌     |      ❌       |     ❌      |   ❌   |
| Negative Weights            |    ❌    |    ✅    |     ✅     |     ✅     |      ❌       |     ❌      |   ⚙️   |
| Bidirectional Store/Emp     |    ✅    |    ✅    |     ✅     |     ✅     |      ✅       |     ✅      |   ✅   |
| Image Upload Questions      |    ✅    |    ✅    |     ✅     |     ✅     |      ✅       |     ✅      |   ✅   |
| Signature Capture           |    ⚙️    |    ✅    |     ✅     |     ❌     |      ❌       |     ❌      |   ⚙️   |
| Geo-Location                |    ⚙️    |    ✅    |     ✅     |     ✅     |      ❌       |     ❌      |   ⚙️   |
| Offline Support             |    ✅    |    ✅    |     ✅     |     ✅     |      ✅       |     ✅      |   ✅   |
| Autosave                    |    ✅    |    ✅    |     ✅     |     ✅     |      ✅       |     ✅      |   ✅   |
| Conditional Questions       |    ⚙️    |    ⚙️    |     ⚙️     |     ⚙️     |      ⚙️       |     ⚙️      |   ⚙️   |

> ✅ = Enabled | ❌ = Not applicable | ⚙️ = Configurable per program

---

## 15. Active Programs

The following 12 programs are currently configured in the HBPL tenant:

| #  | Program Name                      | Type                    | Sections | Questions |
| -- | --------------------------------- | ----------------------- | :------: | :-------: |
| 1  | Operations Audit                  | Operational Survey      |    5     |    ~60    |
| 2  | QA Audit                          | QA Audit                |    7     |    ~90    |
| 3  | Finance Audit                     | Compliance Inspection   |    6     |    ~55    |
| 4  | Training Assessment               | Training Assessment     |   10     |   ~130    |
| 5  | HR Connect Survey                 | Custom                  |    4     |    ~35    |
| 6  | SHLP Assessment                   | Custom *(assessment)*   |    5     |    ~50    |
| 7  | Brew League — AM Round            | Competition Scoring     |    3     |    ~30    |
| 8  | Brew League — Region Round        | Competition Scoring     |    5     |    ~45    |
| 9  | Bench Planning — BT Level         | Custom *(planning)*     |    4     |    ~40    |
| 10 | Bench Planning — SM to ASM Level  | Custom *(planning)*     |    4     |    ~40    |
| 11 | Campus Hiring Assessment          | Campus Hiring           |    6     |    ~80    |
| 12 | Management Trainee Feedback Form  | Custom *(feedback)*     |    4     |    ~40    |

### Program Grouping (Folders)

Programs are grouped into folders on the checklist listing page:

| Folder                | Programs                                            |
| --------------------- | --------------------------------------------------- |
| Audits                | Operations Audit, QA Audit, Finance Audit           |
| Assessments           | Training Assessment, SHLP Assessment                |
| Competitions          | Brew League — AM Round, Brew League — Region Round  |
| Hiring & Onboarding   | Campus Hiring Assessment, MT Feedback Form          |
| Bench Planning        | BT Level, SM to ASM Level                           |
| Surveys               | HR Connect Survey                                   |

---

## Appendix: UI Design Tokens

The platform uses a dark obsidian theme with orange accent.

| Token                    | Value                        | Usage                        |
| ------------------------ | ---------------------------- | ---------------------------- |
| Primary accent           | `#EA580C` (orange-600)       | Buttons, highlights, focus   |
| Background               | Obsidian dark tones          | Cards, containers            |
| Success / Positive       | Green-500 tones              | Yes, Compliant, Uploaded     |
| Danger / Negative        | Red-500 tones                | No, Non-Compliant, Remove    |
| Neutral / N/A            | Obsidian-500 / Gray tones    | N/A, Partially Compliant     |
| Warning / Amber          | Amber-500 tones              | Partial, in-progress         |
| Border style             | `border-obsidian-600/20`     | Subtle card borders          |
| Glass effect             | `backdrop-blur-sm`           | Badges, overlays             |

---

*Last updated: January 2025*
