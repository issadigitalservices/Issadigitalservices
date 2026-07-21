# ISSA Academy

Database Guide

Version 1.0

---

# Database

Firebase Firestore

Authentication

Firebase Auth

Storage

Firebase Storage

---

# Collections

admins

students

courses

modules

lessons

enrollments

progress

certificates

payments

announcements

reviews

settings

notifications

activityLogs

---

# 1. admins

Document ID

Firebase UID

Fields

name

email

role

phone

status

photo

createdAt

updatedAt

lastLogin

permissions

---

# 2. students

Document ID

Firebase UID

Fields

studentId

fullName

email

mobile

country

city

profession

photo

status

createdAt

updatedAt

lastLogin

emailVerified

notificationSettings

---

# 3. courses

Fields

courseId

title

slug

description

shortDescription

thumbnail

banner

introVideo

price

discountPrice

currency

level

language

category

duration

totalLessons

totalModules

status

certificateEnabled

featured

createdBy

createdAt

updatedAt

---

# 4. modules

Fields

courseId

title

description

order

status

createdAt

updatedAt

---

# 5. lessons

Fields

courseId

moduleId

title

description

videoType

videoUrl

duration

resources

isPreview

order

status

createdAt

updatedAt

---

# 6. enrollments

Fields

studentId

courseId

paymentId

enrolledAt

status

progress

completedLessons

lastLesson

lastAccessed

certificateUnlocked

---

# 7. progress

Fields

studentId

courseId

moduleId

lessonId

completed

completedAt

watchTime

lastPosition

---

# 8. certificates

Fields

certificateId

studentId

courseId

certificateUrl

issueDate

downloadCount

verificationCode

status

---

# 9. payments

Fields

paymentId

studentId

courseId

amount

currency

paymentMethod

transactionId

paymentStatus

paidAt

invoiceUrl

---

# 10. announcements

Fields

title

description

targetAudience

published

createdAt

---

# 11. reviews

Fields

studentId

courseId

rating

review

approved

createdAt

---

# 12. settings

Fields

academyName

academyEmail

academyPhone

academyAddress

currency

certificateTemplate

logo

favicon

maintenanceMode

---

# 13. notifications

Fields

studentId

title

message

type

read

createdAt

---

# 14. activityLogs

Fields

userId

userType

action

page

ip

device

createdAt

---

# Relationships

Course

↓

Modules

↓

Lessons

↓

Progress

↓

Certificate

Student

↓

Enrollment

↓

Progress

↓

Certificate

Payment

↓

Enrollment

---

# Storage

course-thumbnails/

course-banners/

lesson-resources/

lesson-videos/

student-photos/

certificates/

academy-logo/

---

# Indexes

studentId + courseId

courseId + order

moduleId + order

status + createdAt

featured + status

paymentStatus + createdAt

---

End of Document
