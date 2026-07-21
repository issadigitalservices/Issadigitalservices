// ============================================
// ISSA Academy - Excel Lesson
// Version 1.0
// ============================================

// ------------------------------
// Sample Lessons
// (Later this will come from Firestore)
// ------------------------------

import { lessons } from "./course-data.js";
import { markLessonComplete } from "./progress.js";

// ------------------------------
// Get Lesson Number
// ------------------------------

const params = new URLSearchParams(window.location.search);

const lessonId = parseInt(params.get("lesson")) || 1;

// ------------------------------
// Find Lesson
// ------------------------------

const lesson = lessons.find(item => item.id === lessonId);

if (!lesson) {

    alert("Lesson not found.");

    window.location.href = "excel-course.html";

}

// ------------------------------
// Update Page
// ------------------------------

document.getElementById("module-name").textContent = lesson.module;

document.getElementById("lesson-title").textContent = lesson.title;

document.getElementById("lesson-duration").textContent = lesson.duration;

document.getElementById("lesson-description").textContent = lesson.description;

document.getElementById("lesson-video").src = lesson.video;

document.getElementById("notes-link").href = lesson.notes;

document.getElementById("practice-link").href = lesson.practice;

// ------------------------------
// Progress
// ------------------------------

const progress = Math.round((lesson.id / lessons.length) * 100);

document.getElementById("progress-fill").style.width = progress + "%";

document.getElementById("progress-percentage").textContent = progress + "%";

// ------------------------------
// Previous Button
// ------------------------------

document.getElementById("previous-btn").addEventListener("click", () => {

    if (lesson.id > 1) {

        window.location.href =
            `excel-lesson.html?lesson=${lesson.id - 1}`;

    }

});

// ------------------------------
// Next Button
// ------------------------------

document.getElementById("next-btn").addEventListener("click", () => {

    if (lesson.id < lessons.length) {

        window.location.href =
            `excel-lesson.html?lesson=${lesson.id + 1}`;

    }

});

// ------------------------------
// Mark Complete
// ------------------------------

document.getElementById("complete-btn").addEventListener("click", async () => {

    await markLessonComplete(lesson.slug);

    alert("Lesson completed successfully.");

});

// ------------------------------
// Loading Screen
// ------------------------------

window.addEventListener("load", () => {

    setTimeout(() => {

        document.getElementById("loading-screen").style.display = "none";

    }, 500);

});