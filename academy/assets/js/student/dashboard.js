"use strict";

/* ==========================================================================
   ISSA Academy
   Student Dashboard
   Version : 2.0.1
   ========================================================================== */

import {
    db
} from "../core/firebase-config.js";

import {
    showLoader,
    hideLoader
} from "../core/loader.js";

import {
    requireStudent,
    logoutUser
} from "../core/auth-manager.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */

const studentName = document.getElementById("studentName");
const totalCourses = document.getElementById("totalCourses");
const totalCertificates = document.getElementById("totalCertificates");
const courseProgress = document.getElementById("courseProgress");
const coursesGrid = document.getElementById("coursesGrid");
const emptyCourses = document.getElementById("emptyCourses");
const viewAllCoursesWrapper = document.getElementById("viewAllCoursesWrapper");
const logoutBtn = document.getElementById("logoutBtn");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   GLOBALS
   ========================================================================== */

let currentStudent = null;
let enrollments = [];

/* ==========================================================================
   AUTH INITIALIZATION
   ========================================================================== */

async function initializeDashboard() {
    try {
        const user = await requireStudent();

        if (!user) {
            return;
        }

        currentStudent = user;

        loadStudent(user.uid);
        loadEnrollments(user.uid);
    } catch (error) {
        console.error(error);
        showToast("Unable to load dashboard.", "error");
    }
}

initializeDashboard();

/* ==========================================================================
   STUDENT PROFILE
   ========================================================================== */

async function loadStudent(uid) {
    const snap = await getDoc(
        doc(db, "students", uid)
    );

    if (!snap.exists()) {
        return;
    }

    const student = snap.data();
    studentName.textContent = student.name || "Student";
}

/* ==========================================================================
   ENROLLMENTS & COURSES
   ========================================================================== */

async function loadEnrollments(uid) {
    const snapshot = await getDocs(
        query(
            collection(db, "enrollments"),
            where("studentId", "==", uid),
            where("approvalStatus", "==", "Approved")
        )
    );

    enrollments = snapshot.docs;
    coursesGrid.innerHTML = "";

    let totalProgress = 0;

    // IF NO ENROLLED COURSES YET: SHOW ALL AVAILABLE COURSES CATALOG
    if (snapshot.empty) {
        if (emptyCourses) emptyCourses.classList.add("hidden");
        if (viewAllCoursesWrapper) viewAllCoursesWrapper.classList.remove("hidden");

        totalCourses.textContent = "0";
        totalCertificates.textContent = "0";
        courseProgress.textContent = "0%";

        try {
            const allCoursesSnap = await getDocs(collection(db, "courses"));
            const catalogCards = [];

            allCoursesSnap.forEach((courseDoc) => {
                const course = courseDoc.data();
                const courseId = courseDoc.id;

                catalogCards.push(`
                    <article class="course-card">
                        <img src="../${course.dashboardImage || course.thumbnail || 'assets/images/course-placeholder.jpg'}" alt="${course.title || 'Course'}">
                        <div class="course-content">
                            <h3>${course.title || 'Untitled Course'}</h3>
                            <p>${course.description || ""}</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width:0%"></div>
                            </div>
                            <div class="course-footer">
                                <span>Not Enrolled</span>
                                <a class="btn btn-primary" href="../student/enroll.html?id=${courseId}">
                                    Enroll Now
                                </a>
                            </div>
                        </div>
                    </article>
                `);
            });

            if (catalogCards.length > 0) {
                coursesGrid.innerHTML = catalogCards.join("");
            } else {
                if (emptyCourses) emptyCourses.classList.remove("hidden");
            }
        } catch (err) {
            console.error("Error loading course catalog:", err);
            if (emptyCourses) emptyCourses.classList.remove("hidden");
        }

        return;
    }

    // IF STUDENT IS ENROLLED IN AT LEAST 1 COURSE
    if (emptyCourses) emptyCourses.classList.add("hidden");

    // Show "View All Courses" wrapper
    if (viewAllCoursesWrapper) {
        viewAllCoursesWrapper.classList.remove("hidden");
    }

    totalCourses.textContent = snapshot.size;

    const cards = [];

    for (const enrollment of snapshot.docs) {
        const data = enrollment.data();
        totalProgress += data.progress || 0;

        const courseSnap = await getDoc(
            doc(db, "courses", data.courseId)
        );

        if (!courseSnap.exists()) {
            continue;
        }

        const course = courseSnap.data();

        cards.push(`
            <article class="course-card">
                <img src="../${course.dashboardImage || course.thumbnail || 'assets/images/course-placeholder.jpg'}" alt="${course.title}">
                <div class="course-content">
                    <h3>${course.title}</h3>
                    <p>${course.description || ""}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${data.progress || 0}%"></div>
                    </div>
                    <div class="course-footer">
                        <span>${data.progress || 0}%</span>
                        ${
                            data.progress === 100
                            ? `<a class="btn btn-success" href="certificate-view.html?courseId=${data.courseId}">
                                <i class="fa-solid fa-award"></i> View Certificate
                               </a>`
                            : `<a class="btn btn-primary" href="course.html?id=${data.courseId}">
                                Continue
                               </a>`
                        }
                    </div>
                </div>
            </article>
        `);
    }

    const certificateSnapshot = await getDocs(
        query(
            collection(db, "certificates"),
            where("studentId", "==", uid)
        )
    );

    totalCertificates.textContent = certificateSnapshot.size;
    coursesGrid.innerHTML = cards.join("");
    courseProgress.textContent = `${Math.round(totalProgress / snapshot.size)}%`;
}

/* ==========================================================================
   LOGOUT HANDLER
   ========================================================================== */

if (logoutBtn) {
    logoutBtn.addEventListener("click", async event => {
        event.preventDefault();

        try {
            showLoader();
            await logoutUser();
        } catch (error) {
            console.error(error);
            showToast("Unable to logout.", "error");
        } finally {
            hideLoader();
        }
    });
}

/* ==========================================================================
   TOAST SYSTEM
   ========================================================================== */

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

/* ==========================================================================
   MOBILE SIDEBAR MENU CONTROLS
   ========================================================================== */

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarClose = document.getElementById("sidebarClose");
const menuToggle = document.getElementById("menu-toggle");

if (menuToggle) {
    menuToggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (sidebar) sidebar.classList.add("open");
        if (sidebarOverlay) sidebarOverlay.classList.add("show");
    });
}

if (sidebarClose) {
    sidebarClose.addEventListener("click", (e) => {
        e.preventDefault();
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarOverlay) sidebarOverlay.classList.remove("show");
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", (e) => {
        e.preventDefault();
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarOverlay) sidebarOverlay.classList.remove("show");
    });
}

/* ==========================================================================
   END OF SCRIPT
   ========================================================================== */