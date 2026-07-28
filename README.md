# ISSA Academy

A modern Learning Management System (LMS) developed using HTML5, CSS3, JavaScript (ES Modules), Firebase Authentication, Cloud Firestore, and Cloudflare R2 Storage.

ISSA Academy provides a complete online learning experience including course management, lessons, exams, final examinations, certificates, progress tracking, secure file attachments, and certificate verification.

---

# Features

## Admin

- Dashboard
- Course Management
- Module Management
- Lesson Management
- Exam & Assessment Management
- Module Exams
- Final Exams
- Question Attachments (Excel, PDF, Word, PowerPoint, Images, ZIP)
- Student Management
- Payment Management
- Certificate Management
- Academy Settings
- Progress Monitoring

## Student

- Secure Login
- Student Dashboard
- My Courses
- Lesson Player
- Module Assessments
- Final Examinations
- Exam Results
- Certificate Download (PDF)
- Certificate Verification
- Student Profile
- Progress Tracking

---

# Technology

- HTML5
- CSS3
- JavaScript (ES6 Modules)
- Firebase Authentication
- Cloud Firestore
- Cloudflare R2 Storage
- Cloudflare Workers
- GitHub Pages
- GitHub Actions

---

# Current Features

- Responsive Design
- Secure Authentication
- Firestore Database
- Cloudflare File Upload
- Lesson Video Streaming
- Question File Attachments
- Exam Timer
- Question Palette
- Progress Tracking
- Toast Notifications
- Loading Screens
- Certificate Generator
- QR Code Certificate Verification
- PDF Certificate Download
- Mobile Friendly Interface

---

# Folder Structure

```
academy/
│
├── admin/
├── student/
├── assets/
│   ├── css/
│   ├── js/
│   │   ├── admin/
│   │   ├── student/
│   │   ├── core/
│   │   ├── services/
│   │   └── shared/
│   ├── images/
│   └── icons/
│
├── .github/
│   └── workflows/
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── README.md
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/yourusername/issa-academy.git
```

Open the project

```bash
cd issa-academy
```

Open with Visual Studio Code.

---

# Firebase Setup

Create a Firebase Project.

Enable:

- Firebase Authentication
- Cloud Firestore

Replace the Firebase configuration inside

```
assets/js/core/firebase-config.js
```

Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

# Cloudflare Setup

Configure:

- Cloudflare R2 Bucket
- Cloudflare Worker
- Custom Domain (Optional)

Used for:

- Lesson Videos
- Exam Attachments
- PDF Files
- Images
- Documents

---

# Admin Modules

- Dashboard
- Courses
- Modules
- Lessons
- Exams
- Question Management
- Students
- Payments
- Certificates
- Settings

---

# Student Modules

- Login
- Dashboard
- My Courses
- Lesson Viewer
- Assessments
- Final Exams
- Exam Results
- Certificates
- Certificate Verification
- Profile

---

# Security

- Firebase Authentication
- Firestore Security Rules
- Authentication Guard
- Protected Admin Pages
- Protected Student Pages
- Cloudflare Secure Upload Service

---

# Browser Support

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

---

# Version

```
Version 1.4.0
```

---

# Developed By

**ISSA Academy**

© 2026 ISSA Academy. All Rights Reserved.
