# Prism Platform — Checklist Engine Specification

## Overview

The Checklist Engine powers all operational programs within the platform.

Programs such as audits, assessments, competitions, inspections, and surveys are all implemented using this engine.

The engine must support configurable program structures that administrators can create without writing code.

---

## Program Structure

Each program contains the following hierarchy:

Program
→ Sections
→ Questions
→ Responses

Example:

QA Audit
→ Cleanliness Section
→ Equipment Section
→ Beverage Quality Section

---

## Question Types

The engine must support multiple question formats.

Supported types:

Text Input
Number Input
Yes / No
Dropdown
Multiple Choice
Rating Scale
Image Upload
File Upload
Digital Signature
Geo-location Capture

---

## Question Properties

Each question contains configurable attributes.

Properties:

* required
* weight
* scoring_enabled
* allow_images
* allow_annotation
* allow_comments
* conditional_logic
* default_value

Example configuration:

question_type: yes_no
weight: 10
required: true
allow_images: true

---

## Conditional Questions

Questions can appear conditionally based on previous answers.

Example logic:

Show Question B only if Question A = "No"

Example configuration:

trigger_question: Q1
trigger_value: No

---

## Scoring System

Programs may use scoring.

Score can be calculated using:

* weighted scoring
* section scoring
* total scoring

Example:

Cleanliness Section = 30%
Equipment Section = 30%
Beverage Quality Section = 40%

---

## Draft System

Users can save incomplete submissions.

Draft submissions contain:

* partial responses
* timestamps
* editing state

Drafts can later be resumed and submitted.

---

## Offline Mode

Offline functionality must allow checklists to work without internet.

Flow:

User opens program
Checklist loads locally
Responses stored locally
Internet reconnects
Data syncs automatically

Recommended technology:

IndexedDB

---

## Image Upload and Annotation

Questions can support photo evidence.

Features:

* image capture
* image upload
* annotation tools
* drawing overlays
* text labels

Admin controls which questions enable these features.

---

## Geo-location Capture

Programs may capture device location during submission.

Captured data:

latitude
longitude
timestamp

---

## Submission Lifecycle

Submission states:

draft
submitted
synced
archived

Example lifecycle:

draft → submitted → stored → analyzed

---

## Validation

The engine must validate:

* required fields
* conditional dependencies
* correct input formats
* image requirements

Submissions failing validation cannot be submitted.

---
