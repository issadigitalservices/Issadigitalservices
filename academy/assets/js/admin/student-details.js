"use strict";

/* ==========================================================================
   ISSA Academy - Student Details
   ========================================================================== */

import { auth, db } from "../core/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */

const studentPhoto = document.getElementById("studentPhoto");
const studentName = document.getElementById("studentName");
const studentEmail = document.getElementById("studentEmail");
const studentMobile = document.getElementById("studentMobile");
const studentStatus = document.getElementById("studentStatus");
const registeredDate = document.getElementById("registeredDate");
const courseCount = document.getElementById("courseCount");
const completedCount = document.getElementById("completedCount");
const certificateCount = document.getElementById("certificateCount");
const courseList = document.getElementById("courseList");
const paymentList = document.getElementById("paymentList");
const certificateList = document.getElementById("certificateList");
const whatsappBtn = document.getElementById("whatsappBtn");
const emailBtn = document.getElementById("emailBtn");
const disableBtn = document.getElementById("disableBtn");
const loader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   URL PARAMETERS & STATE
   ========================================================================== */

const params = new URLSearchParams(location.search);
const studentId = params.get("id");
let student = null;

/* ==========================================================================
   AUTH CHECK & INIT
   ========================================================================== */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        location.replace("../student/login.html");
        return;
    }

    if (!studentId) {
        showToast("Missing student ID in URL.", "error");
        if (studentName) studentName.textContent = "ID Missing";
        return;
    }

    showLoader();
    await loadStudent();

    if (student) {
        await Promise.allSettled([
            loadCourses(),
            loadPayments(),
            loadCertificates()
        ]);
    }
    hideLoader();
});

/* ==========================================================================
   LOAD STUDENT DATA
   ========================================================================== */

async function loadStudent() {
    try {
        const studentRef = doc(db, "students", studentId);
        const snapshot = await getDoc(studentRef);

        if (!snapshot.exists()) {
            showToast("Student not found in database.", "error");
            if (studentName) studentName.textContent = "Student Not Found";
            return;
        }

        student = snapshot.data();

        if (studentPhoto) studentPhoto.src = student.photo || "../assets/images/default-avatar.png";
        if (studentName) studentName.textContent = student.name || "Unnamed Student";
        if (studentEmail) studentEmail.textContent = student.email || "-";
        if (studentMobile) studentMobile.textContent = student.mobile || "-";
        if (studentStatus) studentStatus.textContent = student.status || "registered";

        if (registeredDate && student.createdAt) {
            registeredDate.textContent = student.createdAt.toDate
                ? student.createdAt.toDate().toLocaleDateString()
                : new Date(student.createdAt).toLocaleDateString();
        }
    } catch (error) {
        console.error("Error loading student:", error);
        if (error.code === "permission-denied") {
            showToast("Access denied: Your account UID is missing from 'admins' collection.", "error");
        } else {
            showToast("Unable to load student profile.", "error");
        }
    }
}

/* ==========================================================================
   LOAD ENROLLED COURSES & DETAILED PROGRESS
   ========================================================================== */

async function loadCourses() {
    try {
        const snapshot = await getDocs(
            query(
                collection(db, "enrollments"),
                where("studentId", "==", studentId),
                where("approvalStatus", "==", "Approved")
            )
        );

        let totalCourses = 0;
        let completedCourses = 0;
        if (courseList) courseList.innerHTML = "";

        for (const docSnap of snapshot.docs) {
            const course = docSnap.data();
            totalCourses++;

            const progress = Number(course.progress || 0);
            if (progress >= 100) completedCourses++;

            let completedLessons = 0;
            let totalLessons = 0;
            let examDetailsHTML = "";

            // Safely fetch lesson counts
            try {
                const lessonProgressSnap = await getDocs(
                    query(
                        collection(db, "lessonProgress"),
                        where("studentId", "==", studentId),
                        where("courseId", "==", course.courseId),
                        where("completed", "==", true)
                    )
                );
                completedLessons = lessonProgressSnap.size;

                const totalLessonsSnap = await getDocs(
                    query(collection(db, "lessons"), where("courseId", "==", course.courseId))
                );
                totalLessons = totalLessonsSnap.size;
            } catch (err) {
                console.warn("Lesson progress load error:", err.message);
            }

            // Safely fetch exam attempt details
            try {
                const examAttemptsSnap = await getDocs(
                    query(collection(db, "examAttempts"), where("studentId", "==", studentId))
                );

                for (const attemptDoc of examAttemptsSnap.docs) {
                    const attempt = attemptDoc.data();
                    if (attempt.submittedAt) {
                        const examDoc = await getDoc(doc(db, "exams", attempt.examId));
                        if (examDoc.exists() && examDoc.data().courseId === course.courseId) {
                            const examData = examDoc.data();
                            const statusColor = attempt.passed ? "#2e7d32" : "#c62828";
                            const statusBg = attempt.passed ? "#e8f5e9" : "#ffebee";

                            examDetailsHTML += `
                                <div style="display:flex; justify-between; align-items:center; padding: 6px 0; border-bottom: 1px dashed #eee; font-size: 13px;">
                                    <div>
                                        <strong>${examData.title || "Module Exam"}</strong>
                                        <span style="color: #666; font-size: 12px; margin-left: 8px;">
                                            Score: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage || 0}%)
                                        </span>
                                    </div>
                                    <span style="padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; color: ${statusColor}; background: ${statusBg};">
                                        ${attempt.passed ? "PASSED" : "FAILED"}
                                    </span>
                                </div>
                            `;
                        }
                    }
                }
            } catch (err) {
                console.warn("Exam attempts load error:", err.message);
            }

            if (!examDetailsHTML) {
                examDetailsHTML = `<div style="font-size: 12px; color: #888; margin-top: 4px;">No exam attempts recorded yet.</div>`;
            }

            if (courseList) {
                courseList.innerHTML += `
                <div class="list-item" style="flex-direction: column; align-items: stretch; gap: 10px; margin-bottom: 15px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>${course.courseName}</strong>
                        <span style="font-weight: bold; color: #2563eb;">${progress}% Complete</span>
                    </div>
                    <div class="progress" style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${progress}%; background: #2563eb; height: 100%;"></div>
                    </div>
                    <div style="font-size: 13px; color: #475569; display: flex; gap: 15px; margin-top: 5px;">
                        <span>📖 <strong>Lessons Completed:</strong> ${completedLessons} / ${totalLessons}</span>
                    </div>
                    <div style="margin-top: 8px; background: #f8fafc; padding: 10px; border-radius: 6px;">
                        <div style="font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
                            Module Exams & Scores
                        </div>
                        ${examDetailsHTML}
                    </div>
                </div>
                `;
            }
        }

        if (totalCourses === 0 && courseList) {
            courseList.innerHTML = `<div class="empty-state">No purchased courses.</div>`;
        }

        if (courseCount) courseCount.textContent = totalCourses;
        if (completedCount) completedCount.textContent = completedCourses;

    } catch (error) {
        console.error("Error loading courses:", error);
    }
}

/* ==========================================================================
   LOAD PAYMENTS
   ========================================================================== */

async function loadPayments() {
    try {
        const snapshot = await getDocs(
            query(collection(db, "payments"), where("studentId", "==", studentId))
        );

        if (paymentList) paymentList.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const payment = docSnap.data();
            if (paymentList) {
                paymentList.innerHTML += `
                <div class="list-item">
                    <div>
                        <strong>${payment.courseName || "Course"}</strong>
                        <span>${payment.paymentMethod || "WhatsApp"}</span>
                    </div>
                    <strong>${payment.currency || "INR"} ${payment.amount || 0}</strong>
                </div>
                `;
            }
        });

        if (snapshot.empty && paymentList) {
            paymentList.innerHTML = `<div class="empty-state">No payment history.</div>`;
        }
    } catch (error) {
        console.error("Error loading payments:", error);
    }
}

/* ==========================================================================
   LOAD CERTIFICATES
   ========================================================================== */

async function loadCertificates() {
    try {
        const snapshot = await getDocs(
            query(collection(db, "certificates"), where("studentId", "==", studentId))
        );

        let totalCertificates = 0;
        if (certificateList) certificateList.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const certificate = docSnap.data();
            totalCertificates++;

            if (certificateList) {
                certificateList.innerHTML += `
                <div class="list-item">
                    <div>
                        <strong>${certificate.courseName}</strong>
                        <span>Completed</span>
                    </div>
                    <a href="${certificate.fileUrl}" target="_blank" class="btn btn-primary">View</a>
                </div>
                `;
            }
        });

        if (snapshot.empty && certificateList) {
            certificateList.innerHTML = `<div class="empty-state">No certificates.</div>`;
        }

        if (certificateCount) certificateCount.textContent = totalCertificates;
    } catch (error) {
        console.error("Error loading certificates:", error);
    }
}

/* ==========================================================================
   ACTIONS
   ========================================================================== */

if (whatsappBtn) {
    whatsappBtn.addEventListener("click", () => {
        if (!student || !student.mobile) {
            showToast("Mobile number not available.", "error");
            return;
        }
        const number = student.mobile.replace(/\D/g, "");
        window.open(`https://wa.me/${number}`, "_blank");
    });
}

if (emailBtn) {
    emailBtn.addEventListener("click", () => {
        if (!student || !student.email) {
            showToast("Email address not available.", "error");
            return;
        }
        location.href = `mailto:${student.email}`;
    });
}

if (disableBtn) {
    disableBtn.addEventListener("click", async () => {
        if (!student) return;

        const newStatus = student.status === "Disabled" ? "registered" : "Disabled";
        const message = newStatus === "Disabled" ? "Disable this student?" : "Enable this student?";

        if (!confirm(message)) return;

        showLoader();

        try {
            await updateDoc(doc(db, "students", studentId), { status: newStatus });
            student.status = newStatus;
            if (studentStatus) studentStatus.textContent = newStatus;

            disableBtn.innerHTML = newStatus === "Disabled"
                ? `<i class="fa-solid fa-user-check"></i> Enable Student`
                : `<i class="fa-solid fa-user-slash"></i> Disable Student`;

            showToast(`Student status updated to ${newStatus}.`);
        } catch (error) {
            console.error(error);
            showToast(error.message, "error");
        } finally {
            hideLoader();
        }
    });
}

/* ==========================================================================
   LOADER & TOAST UTILITIES
   ========================================================================== */

function showLoader() {
    if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
    if (loader) loader.classList.add("hidden");
}

function showToast(message, type = "success") {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.remove();
    }, 3000);
}