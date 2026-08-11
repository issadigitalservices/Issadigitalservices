"use strict";

/* ==========================================================================
   ISSA Academy
   Student Dashboard
   Version : 2.1
   ========================================================================== */

import { db } from "../core/firebase-config.js";

import {
    showLoader,
    hideLoader
} from "../core/loader.js";

import {
    requireStudent,
    logoutUser
} from "../core/auth-manager.js";

import {
    createCourseCard
} from "../core/course-card.js";

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

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarClose = document.getElementById("sidebarClose");
const menuToggle = document.getElementById("menu-toggle");

/* ==========================================================================
   GLOBAL VARIABLES
   ========================================================================== */

let currentStudent = null;
let enrollments = [];

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", initializeDashboard);

async function initializeDashboard() {

    try {

        showLoader();

        const user = await requireStudent();

        if (!user) {
            return;
        }

        currentStudent = user;

        await Promise.all([
            loadStudent(user.uid),
            loadEnrollments(user.uid)
        ]);

    } catch (error) {

        console.error("Dashboard initialization failed:", error);

        showToast(
            "Unable to load dashboard.",
            "error"
        );

    } finally {

        hideLoader();

    }

}

/* ==========================================================================
   STUDENT PROFILE
   ========================================================================== */

async function loadStudent(uid) {

    try {

        const snap = await getDoc(doc(db, "students", uid));

        if (!snap.exists()) {
            studentName.textContent = "Student";
            return;
        }

        const student = snap.data();

        studentName.textContent = student.name || "Student";

    } catch (error) {

        console.error("Unable to load student profile:", error);

    }

}

/* ==========================================================================
   ENROLLMENTS & COURSES
   ========================================================================== */

async function loadEnrollments(uid) {

    try {

        const enrollmentSnapshot = await getDocs(
            query(
                collection(db, "enrollments"),
                where("studentId", "==", uid),
                where("approvalStatus", "==", "Approved")
            )
        );

        enrollments = enrollmentSnapshot.docs;

        coursesGrid.innerHTML = "";

        let totalProgress = 0;

        /* ---------------------------------------------------------------
           NO ENROLLED COURSES
        ---------------------------------------------------------------- */

        if (enrollmentSnapshot.empty) {

            totalCourses.textContent = "0";
            totalCertificates.textContent = "0";
            courseProgress.textContent = "0%";

            emptyCourses?.classList.add("hidden");
            viewAllCoursesWrapper?.classList.remove("hidden");

            await loadCourseCatalog();

            return;

        }

        /* ---------------------------------------------------------------
           ENROLLED COURSES
        ---------------------------------------------------------------- */

        emptyCourses?.classList.add("hidden");
        viewAllCoursesWrapper?.classList.remove("hidden");

        totalCourses.textContent = enrollmentSnapshot.size;

        const coursePromises = enrollmentSnapshot.docs.map(
            async (enrollmentDoc) => {

                const enrollment = enrollmentDoc.data();
                const enrollmentProgress = Number(enrollment.progress) || 0;

                /* -------------------------------------------------------
                   FETCH COURSE DETAILS & SUBCOLLECTION COUNTS IN PARALLEL
                ------------------------------------------------------- */
                const [courseSnap, moduleSnapshot, lessonSnapshot, completedLessonsSnapshot] = await Promise.all([
                    getDoc(doc(db, "courses", enrollment.courseId)),
                    getDocs(query(collection(db, "modules"), where("courseId", "==", enrollment.courseId))),
                    getDocs(query(collection(db, "lessons"), where("courseId", "==", enrollment.courseId))),
                    getDocs(
                        query(
                            collection(db, "lessonProgress"),
                            where("studentId", "==", uid),
                            where("courseId", "==", enrollment.courseId),
                            where("completed", "==", true)
                        )
                    )
                ]);

                if (!courseSnap.exists()) {
                    return "";
                }

                totalProgress += enrollmentProgress;

                /* -------------------------------------------------------
                   CONSTRUCT COURSE OBJECT WITH DYNAMIC COUNTS
                ------------------------------------------------------- */
                const course = {
                    id: enrollment.courseId,
                    ...courseSnap.data(),
                    totalModules: moduleSnapshot.size,
                    totalLessons: lessonSnapshot.size
                };

                /* -------------------------------------------------------
                   CREATE COURSE CARD
                ------------------------------------------------------- */
                return createCourseCard(
                    course,
                    {
                        mode: "dashboard",
                        progress: enrollmentProgress,
                        completedLessons: completedLessonsSnapshot.size
                    }
                );

            }
        );

        const cards = await Promise.all(coursePromises);

        coursesGrid.innerHTML = cards.join("");

        /* ---------------------------------------------------------------
           CERTIFICATES
        ---------------------------------------------------------------- */

        const certificateSnapshot = await getDocs(
            query(
                collection(db, "certificates"),
                where("studentId", "==", uid)
            )
        );

        totalCertificates.textContent = certificateSnapshot.size;

        /* ---------------------------------------------------------------
           OVERALL PROGRESS
        ---------------------------------------------------------------- */

        courseProgress.textContent = `${Math.round(
            totalProgress / enrollmentSnapshot.size
        )}%`;

    } catch (error) {

        console.error("Unable to load enrollments:", error);

        showToast(
            "Unable to load your courses.",
            "error"
        );

    }

}

/* ==========================================================================
   COURSE CATALOG
   ========================================================================== */

async function loadCourseCatalog() {

    try {

        const snapshot = await getDocs(collection(db, "courses"));

        if (snapshot.empty) {

            emptyCourses?.classList.remove("hidden");
            return;

        }

        const cardsPromises = snapshot.docs.map(async (courseDoc) => {

            const courseId = courseDoc.id;

            /* Query modules & lessons for this specific course */
            const [modulesSnap, lessonsSnap] = await Promise.all([
                getDocs(query(collection(db, "modules"), where("courseId", "==", courseId))),
                getDocs(query(collection(db, "lessons"), where("courseId", "==", courseId)))
            ]);

            const course = {
                id: courseId,
                ...courseDoc.data(),
                totalModules: modulesSnap.size,
                totalLessons: lessonsSnap.size
            };

            return createCourseCard(course, {
                mode: "student"
            });

        });

        const cards = await Promise.all(cardsPromises);

        // Inject HTML
        coursesGrid.innerHTML = cards.join("");

        // ATTACH CLICK LISTENERS DIRECTLY TO ENROLL BUTTONS
        const enrollButtons = coursesGrid.querySelectorAll(".enroll-btn");
        
        enrollButtons.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const courseId = btn.getAttribute("data-course-id") || btn.dataset.courseId;
                
                if (courseId) {
                    window.location.href = `enroll.html?id=${courseId}`;
                } else {
                    alert("Course ID missing on button!");
                }
            });
        });

    } catch (error) {

        console.error("Unable to load course catalog:", error);

        emptyCourses?.classList.remove("hidden");

    }

}

/* ==========================================================================
   COURSE CARD CLICK HANDLERS (ENROLL NOW)
   ========================================================================== */

if (coursesGrid) {

    coursesGrid.addEventListener("click", (event) => {

        const enrollBtn = event.target.closest(".enroll-btn");

        if (enrollBtn) {

            const courseId = enrollBtn.dataset.courseId;
            console.log("Enroll button clicked! Course ID:", courseId);

            if (courseId) {
                // Navigates directly to enroll.html in the same student/ directory
                window.location.href = `./enroll.html?id=${courseId}`;
            } else {
                console.error("No dataset.courseId found on enroll button!");
            }

        }

    });

}

/* ==========================================================================
   LOGOUT HANDLER
   ========================================================================== */

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (event) => {

        event.preventDefault();

        try {

            showLoader();

            await logoutUser();

        } catch (error) {

            console.error("Logout failed:", error);

            showToast(
                "Unable to logout.",
                "error"
            );

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

        toast.classList.remove("show");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);

}

/* ==========================================================================
   MOBILE SIDEBAR
   ========================================================================== */

function openSidebar() {

    sidebar?.classList.add("open");
    sidebarOverlay?.classList.add("show");

}

function closeSidebar() {

    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("show");

}

menuToggle?.addEventListener("click", (event) => {

    event.preventDefault();
    event.stopPropagation();

    openSidebar();

});

sidebarClose?.addEventListener("click", (event) => {

    event.preventDefault();

    closeSidebar();

});

sidebarOverlay?.addEventListener("click", (event) => {

    event.preventDefault();

    closeSidebar();

});

/* ==========================================================================
   END OF FILE
   ========================================================================== */