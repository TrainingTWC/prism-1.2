# Prism Platform — API Specification

## Authentication

POST /auth/login

Login using EMPID and password.

---

POST /auth/google

Google authentication.

---

## Programs

GET /programs

Fetch all programs.

---

POST /programs

Create a new program.

---

GET /programs/{id}

Fetch program details.

---

## Submissions

POST /submissions

Submit program responses.

---

GET /submissions

Fetch submissions.

---

GET /submissions/{id}

Fetch submission detail.

---

## Entities

GET /stores

Fetch store list.

---

GET /stores/{id}

Fetch store intelligence page.

---

GET /managers/{id}

Fetch manager intelligence page.

---

GET /regions/{id}

Fetch region intelligence page.

---

## Tasks

POST /tasks

Create task.

---

GET /tasks

Fetch tasks.

---

PATCH /tasks/{id}

Update task status.

---

## Reports

GET /reports/store/{id}

Generate store report.

---

GET /reports/program/{id}

Generate program report.

---
