# HBPL Business Context — Knowledge Base Guide

> This document defines the **5 knowledge categories** that power the AI Intelligence Hub.  
> Each section describes what to enter in the Knowledge Base so the AI can deliver accurate, actionable insights.

---

## 1. Business Structure

**Category:** `General`  
**Purpose:** AI understands who reports to whom, what roles exist, and how stores are organized.

### Entry: "HBPL Business Hierarchy"

```
Company: HBPL (Hashtag Beverages Pvt Ltd)
Structure: Company → Regions → Areas → Stores

Roles (top to bottom):
- Global Admin: Full platform oversight, all data access
- Regional Manager (RM): Owns a region containing multiple areas
- Area Manager (AM): Manages 8–15 stores in an area, conducts operational audits
- Store Manager (SM): Runs one store, owns store P&L, manages daily team
- Assistant Store Manager (ASM): Supports SM, acts as backup during absences
- Barista Trainer (BT): Senior barista, responsible for on-floor training of new hires
- Barista: Frontline team member, executes SOPs

Key Designations:
- H541 (Amritanshu) = Editor-level platform access
- HRBP = HR Business Partner (regional HR support)
- Trainer = Conducts structured training programs across stores
- QA Auditor = Conducts quality & food safety audits

Typical store team size: 4–8 employees
Each Area Manager oversees ~10 stores
Each Region has 3–5 Area Managers
```

**Tags:** `hierarchy, roles, structure, organization`

---

## 2. Audit Objective

**Category:** `SOPs & Procedures`  
**Purpose:** AI understands *why* audits exist, what they measure, and who conducts them.

### Entry: "Audit Program Philosophy & Objectives"

```
Why HBPL Audits Stores:
- Ensure brand consistency across all outlets
- Protect customer safety (food safety, hygiene)
- Identify operational gaps before they become customer complaints
- Drive continuous improvement through measurable standards

Audit Programs & Ownership:
- Operations Audit → Conducted by Area Managers (monthly)
- QA / Food Safety Audit → Conducted by QA team (monthly/quarterly)
- HR Compliance Audit → Conducted by HRBP team
- Training Readiness Audit → Conducted by Training team
- SHLP (Safety, Health, Legal, Pest) → Conducted by dedicated auditors
- Finance Audit → Conducted by Finance team

Frequency Expectations:
- Each store should be audited at least once per month per program
- 100% completion by month-end is the target
- Missed audits are flagged as compliance gaps

Audit Flow:
1. Auditor visits store
2. Fills checklist on Prism (mobile-first)
3. Scores auto-calculated per section
4. Follow-ups generated for failed items
5. Store manager addresses follow-ups within SLA
6. Regional oversight via dashboards
```

**Tags:** `audit, objective, compliance, programs`

---

## 3. Operational Benchmarks

**Category:** `Scoring & Grading`  
**Purpose:** AI knows what "good" vs "bad" looks like — the numeric standards to compare against.

### Entry: "Store Performance Benchmarks"

```
Score Thresholds (Universal):
- < 55%  → Needs Attention (Red)
- 56–85% → Brewing (Amber) — Improving but not yet at standard
- > 85%  → Perfect Shot (Green) — Meeting/exceeding expectations

Key Performance Targets:
- Audit completion rate: 100% per store per month
- Overall store score: >85% target
- Follow-up closure rate: >85% within SLA period
- Training completion: All new hires certified within 14 days of joining
- Critical non-compliance items: 0 tolerance (immediate re-audit required)

Trend Analysis:
- 3 consecutive months of improvement = Positive trend (↑)
- Flat scores within ±3% = Stable (→)
- Any decline >5% from previous month = Declining (↓)
- 3 consecutive declining months = Escalation trigger
```

**Tags:** `benchmarks, scoring, thresholds, KPI, performance`

### Entry: "Program-Specific Scoring Standards"

```
Operations:
- Hygiene & Cleanliness: Highest weight section
- Scores below 70% in any single section → auto-flag
- Stores with <60% overall → AM must revisit within 48 hours

QA / Food Safety:
- Zero tolerance for critical food safety violations
- Equipment calibration checks are mandatory
- Score <50% → immediate regional escalation

Training:
- New hire readiness assessed within first 2 weeks
- Trainer effectiveness measured by trainee scores
- Stores with no active trainer → flagged

HR:
- Documentation compliance (contracts, ID proofs)
- Attendance and leave policy adherence
- Employee welfare checks

(Fill in actual weights and thresholds per your program setup)
```

**Tags:** `programs, scoring, operations, QA, training, HR`

---

## 4. Decision Rules

**Category:** `Company Policies`  
**Purpose:** Guides AI on what to prioritize, escalate, or flag — and what NOT to do.

### Entry: "Escalation & Priority Rules"

```
Immediate Escalation (Flag to Regional Manager):
- Any store scoring <50% on any program
- Critical food safety violation found
- 3 consecutive months of declining scores
- Follow-ups overdue >7 days past SLA

Area Manager Action Required:
- Store scores between 50–70% → AM must schedule re-visit within 48 hours
- New compliance gaps in previously "Perfect Shot" stores
- Unassigned follow-ups older than 3 days

Context-Aware Adjustments:
- New stores (< 3 months old): Compare against onboarding benchmarks, not mature store averages
- Recently renovated stores: Expect temporary dip, flag only if decline persists >1 month
- Seasonal periods (festivals, launches): Weight operational pressure into analysis

What AI Should NEVER Do:
- Never recommend closing a store or terminating an employee
- Never speculate on reasons without data — cite patterns only
- Never compare individual employee performance across stores
- Never share PII or salary information in insights
```

**Tags:** `escalation, priority, rules, flags, policy`

### Entry: "AI Analysis Guidelines"

```
When Analyzing Data, the AI Should:
- Always consider the time period context (monthly, weekly, date range)
- Compare stores within the same region first, then against company average
- Account for store age and team size when benchmarking
- Highlight outliers (both best and worst performers)
- Distinguish between one-time dips and sustained trends

Prioritization Order (highest to lowest):
1. Food safety & hygiene violations
2. Critical compliance gaps
3. Overdue follow-ups
4. Declining score trends
5. Missed audit completions
6. Training gaps
7. General performance optimization

When Responding to Role-Specific Users:
- Store Manager: Focus on their store only, actionable improvements
- Area Manager: Cross-store comparison within their area
- Regional Manager: Area-level aggregation, top/bottom performers
- Admin/Editor: Company-wide view, strategic insights
```

**Tags:** `AI, guidelines, analysis, prioritization, roles`

---

## 5. Output Format

**Category:** `General`  
**Purpose:** Ensures AI responses are structured, consistent, and actionable.

### Entry: "AI Response Formatting Standards"

```
Response Structure:
1. Lead with the headline insight (1-2 sentences)
2. Supporting data (tables, comparisons, trends)
3. End with "Recommended Actions" section

Formatting Rules:
- Use tables for any comparison of 3+ items
- Use status indicators: ✅ Perfect Shot | ⚠️ Brewing | 🔴 Needs Attention
- Show trends with arrows: ↑ Improving | → Stable | ↓ Declining
- When listing stores, always include: Store Name, Score, Trend
- Bold key numbers and percentages

Length Guidelines:
- Quick questions: 2-4 sentences
- Analysis requests: Structured response, max 400 words
- Deep dives: Use sections with headers, can be longer if requested

Always Include (when relevant):
- Time period of data being analyzed
- Sample size / number of stores or audits
- Comparison baseline (previous month, company average, etc.)

Never Include:
- Raw database IDs or technical identifiers
- Employee personal details beyond name and role
- Speculative causation without data backing
```

**Tags:** `format, output, response, AI, standards`

---

## How to Use This Document

1. **Open the Knowledge Base** page in Prism (`/knowledge-base`)
2. Click **"+ Add Knowledge"** for each entry above
3. Select the **Category** as noted
4. Copy the **Title** and **Content** (the text inside the code blocks)
5. Add the **Tags** listed under each entry
6. Save — embedding generates automatically
7. Repeat for all ~8 entries

Once all entries are added, the AI Intelligence Hub will use RAG to pull only the relevant context for each user question, making responses faster and more accurate.

---

## Categories Summary

| # | Category | Entries | What It Teaches the AI |
|---|----------|---------|----------------------|
| 1 | Business Structure | 1 | Who's who, hierarchy, roles |
| 2 | Audit Objective | 1 | Why audits exist, who does what |
| 3 | Operational Benchmarks | 2 | What "good" looks like in numbers |
| 4 | Decision Rules | 2 | When to flag, escalate, prioritize |
| 5 | Output Format | 1 | How to structure responses |
| | **Total** | **~7-8** | |
