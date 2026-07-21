# ISSA Academy

Coding Standards

Version 1.0

---

# Purpose

This document defines the coding standards used throughout ISSA Academy.

Every HTML, CSS and JavaScript file must follow these rules.

---

# General Principles

Write clean code.

Write readable code.

Write reusable code.

Write modular code.

Write scalable code.

Optimize for performance.

Never duplicate logic.

Always think about future expansion.

---

# Folder Naming

Use lowercase only.

Example

assets

images

css

js

student

admin

---

# File Naming

Use kebab-case.

Good

login.html

dashboard.html

course-details.html

firebase-config.js

buttons.css

Bad

Login.html

Dashboard.HTML

firebaseConfig.js

Buttons.css

---

# HTML Rules

Use semantic HTML.

Use proper indentation.

Maximum nesting should be reasonable.

Every image requires alt text.

Use loading="lazy" for non-critical images.

Avoid inline CSS.

Avoid inline JavaScript.

IDs must be unique.

Use classes for styling.

---

# CSS Rules

Never use !important unless absolutely necessary.

Always use CSS Variables.

Do not repeat styles.

Create reusable components.

Keep responsive design mobile-first.

Avoid deep selector nesting.

Use Flexbox or CSS Grid.

Do not hardcode colors if a variable exists.

Good

background: var(--primary);

Bad

background: #2563EB;

---

# JavaScript Rules

Use ES Modules.

Use const by default.

Use let only when reassignment is required.

Never use var.

Use async/await instead of promise chains where practical.

Keep functions small and focused.

Prefer early returns to reduce nesting.

Handle errors with try/catch for async operations.

---

# Naming Conventions

Variables

camelCase

Example

studentName

coursePrice

Functions

camelCase

Example

loadCourses()

saveProfile()

Classes

PascalCase

Example

CourseManager

PaymentService

Constants

UPPER_SNAKE_CASE

Example

MAX_UPLOAD_SIZE

DEFAULT_LANGUAGE

---

# Comments

Use section comments.

Example

==================================================================
Authentication
==================================================================

Do not comment obvious code.

Comment business logic.

---

# Firebase Rules

One firebase-config.js only.

Never initialize Firebase twice.

Use Firebase UID as document ID.

Store timestamps using server timestamps where appropriate.

Validate data before saving.

---

# Performance Rules

Load only required CSS.

Load only required JavaScript.

Lazy load images.

Compress images before upload.

Reuse DOM references.

Avoid repeated Firestore reads.

Cache data when appropriate.

---

# Security Rules

Never expose secrets.

Validate all user input.

Escape user-generated content before rendering.

Use Firebase Security Rules.

Check authentication before protected pages.

Restrict admin pages to admin users only.

---

# Responsive Rules

Desktop

Tablet

Mobile

Every page must work on all three.

No horizontal scrolling.

Touch-friendly buttons.

Minimum touch target 44px.

---

# Accessibility

Use labels for form controls.

Use meaningful button text.

Use keyboard navigation where appropriate.

Maintain sufficient color contrast.

---

# Git Rules

Commit small changes.

Use meaningful commit messages.

Example

Add student profile page

Fix lesson progress calculation

Update dashboard statistics

Avoid vague messages such as

Update

Fix

Changes

---

# Testing Checklist

HTML validated

CSS responsive

JavaScript error free

Firebase working

Mobile tested

Desktop tested

Performance checked

Accessibility reviewed

---

# Final Rule

Every new feature must improve the project without breaking existing functionality.

If architecture changes, update PROJECT_GUIDE.md, DATABASE_GUIDE.md, and this document.

---

End of Document
