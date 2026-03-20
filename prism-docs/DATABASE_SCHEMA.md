# Prism Platform — Database Schema

## Core Entities

### Company

id
name
logo
created_at

---

### Store

id
company_id
store_name
region
city

---

### Employee

id
company_id
emp_id
name
email
department
designation
store_id
manager_id
trainer_id
role_id

---

### Role

id
name
description

---

### Permission

id
permission_name

---

### RolePermission

role_id
permission_id

---

## Program System

### Program

id
company_id
name
type
department
status
created_at

---

### ProgramSection

id
program_id
title
order

---

### ProgramQuestion

id
section_id
question_type
text
weight
required
conditional_logic

---

## Submission System

### ProgramSubmission

id
program_id
employee_id
store_id
submitted_at
score
status

---

### ProgramResponse

id
submission_id
question_id
answer
image_url
geo_lat
geo_lng

---

## Task System

### Task

id
title
description
assigned_to
audit_id
status
priority
due_date
created_at

---

## Notification System

### Notification

id
user_id
type
message
channel
status
created_at

---
