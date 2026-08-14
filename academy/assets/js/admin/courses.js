"use strict";

/* ==========================================================================
   ISSA Academy
   Courses Controller (Optimized & Error-Safe)
   ========================================================================== */

import {
    db
} from "../core/firebase-config.js";

import {
    requireAdmin
} from "../core/auth-guard.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    deleteDoc,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const grid = document.getElementById("coursesGrid");
const template = document.getElementById("courseCardTemplate");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const loader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

const state = {
    courses: [],
    filtered: []
};

// Run initialization safely without triggering any page loader
(async () => {
    try {
        await requireAdmin();
        await loadCourses();
    } catch (error) {
        console.error("Initialization error:", error);
        showToast(error.message || "Failed to load admin panel.", "error");
    }
})();

async function loadCourses() {
    state.courses = [];

    // 1. Fetch modules, lessons, enrollments, and courses in parallel
    const [coursesSnap, modulesSnap, lessonsSnap, enrollmentsSnap] = await Promise.all([
        getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "modules")),
        getDocs(collection(db, "lessons")),
        getDocs(collection(db, "enrollments"))
    ]);

    // 2. Count modules per course
    const moduleCounts = {};
    modulesSnap.forEach(doc => {
        const courseId = doc.data().courseId;
        moduleCounts[courseId] = (moduleCounts[courseId] || 0) + 1;
    });

    // 3. Count lessons per course
    const lessonCounts = {};
    lessonsSnap.forEach(doc => {
        const courseId = doc.data().courseId;
        lessonCounts[courseId] = (lessonCounts[courseId] || 0) + 1;
    });

    // 4. Count students per course
    const studentCounts = {};
    enrollmentsSnap.forEach(doc => {
        const courseId = doc.data().courseId;
        studentCounts[courseId] = (studentCounts[courseId] || 0) + 1;
    });

    // 5. Construct course objects with accurate dynamic counts
    coursesSnap.forEach(docSnap => {
        const courseId = docSnap.id;
        const courseData = docSnap.data();

        state.courses.push({
            id: courseId,
            ...courseData,
            totalModules: moduleCounts[courseId] || 0, // <-- Added module count mapping
            totalLessons: lessonCounts[courseId] || 0,
            totalStudents: studentCounts[courseId] || 0
        });
    });

    state.filtered = [...state.courses];
    renderCourses();
}

function renderCourses() {
    if (!grid) return;
    grid.innerHTML = "";

    if (!state.filtered.length) {
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    state.filtered.forEach(course => {
        const card = template.content.cloneNode(true);

        const thumbnailImg = card.querySelector(".thumbnail");
        if (thumbnailImg) {
            thumbnailImg.src = course.thumbnail || "../assets/images/course-placeholder.jpg";
            thumbnailImg.onerror = function() {
                this.src = "../assets/images/course-placeholder.jpg";
            };
        }

        card.querySelector(".course-title").textContent =
    course.title || "Untitled Course";

const categoryNames = {
    excel: "Microsoft Excel",
    word: "Microsoft Word",
    powerpoint: "PowerPoint",
    tally: "Tally",
    accounting: "Accounting"
};

card.querySelector(".course-category").textContent =
    categoryNames[course.categoryId] || course.categoryId;

    card.querySelector(".modules").textContent =
    course.totalModules || 0;

    card.querySelector(".old-price").textContent =
    `₹${course.price}`;

card.querySelector(".offer-price").textContent =
    `₹${course.offerPrice}`;

card.querySelector(".course-description").textContent =
    course.shortDescription || "-";

card.querySelector(".lessons").textContent =
    course.totalLessons || 0;

card.querySelector(".students").textContent =
    course.totalStudents || 0;

        card.querySelector(".btn-edit").addEventListener("click", () => {
            location.href = `edit-course.html?id=${course.id}`;
        });

        card.querySelector(".btn-delete").addEventListener("click", () => {
            deleteCourse(course.id);
        });

        grid.appendChild(card);
    });
}

if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
}

function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();
    state.filtered = state.courses.filter(course => {
        return (course.title || "").toLowerCase().includes(keyword);
    });
    renderCourses();
}

async function deleteCourse(courseId) {
    const confirmed = confirm("Delete this course?\n\nModules and lessons related to this course will also be deleted.");
    if (!confirmed) return;

    try {
        const lessonSnapshot = await getDocs(query(collection(db, "lessons"), where("courseId", "==", courseId)));
        for (const lessonDoc of lessonSnapshot.docs) {
            await deleteDoc(lessonDoc.ref);
        }

        const moduleSnapshot = await getDocs(query(collection(db, "modules"), where("courseId", "==", courseId)));
        for (const moduleDoc of moduleSnapshot.docs) {
            await deleteDoc(moduleDoc.ref);
        }

        await deleteDoc(doc(db, "courses", courseId));

        showToast("Course deleted successfully.");
        await loadCourses();
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    }
}

function showLoader() {
    // Disabled intentionally
}

function hideLoader() {
    // Disabled intentionally
}

function showToast(message, type = "success") {
    if (!toastContainer) {
        alert(message);
        return;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function refreshCourses() {
    try {
        await loadCourses();
    } catch (error) {
        console.error(error);
    }
}

export {
    refreshCourses,
    loadCourses
};