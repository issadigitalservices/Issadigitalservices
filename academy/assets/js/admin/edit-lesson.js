"use strict";

/* ==========================================================================
   ISSA Academy
   Edit Lesson Controller
   Version : 2.1.0
   ========================================================================== */

import { uploadFile } from "../services/r2-upload.js";
import { auth } from "../core/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    query,
    where,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore();

/* ==========================================================================
   URL PARAMS
   ========================================================================== */

const params = new URLSearchParams(location.search);
const lessonId = params.get("id");

/* ==========================================================================
   DOM
   ========================================================================== */

const lessonForm = document.getElementById("lessonForm");
const courseId = document.getElementById("courseId");
const moduleId = document.getElementById("moduleId");
const lessonTitle = document.getElementById("lessonTitle");
const lessonDescription = document.getElementById("lessonDescription");
const lessonOrder = document.getElementById("lessonOrder");
const lessonStatus = document.getElementById("lessonStatus");

const videoFile = document.getElementById("videoFile");
const videoUrl = document.getElementById("videoUrl");
const currentVideo = document.getElementById("currentVideo");

const practiceFile = document.getElementById("practiceFile") || document.getElementById("attachmentUrl");
const currentPracticeFile = document.getElementById("currentPracticeFile");

const uploadProgress = document.getElementById("uploadProgress");
const uploadPercent = document.getElementById("uploadPercent");
const pageLoader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   GLOBALS
   ========================================================================== */

let existingVideoUrl = "";
let existingPracticeFileUrl = "";

/* ==========================================================================
   LOADER & TOAST
   ========================================================================== */

function showLoader() {
    if (pageLoader) pageLoader.classList.remove("hidden");
}

function hideLoader() {
    if (pageLoader) pageLoader.classList.add("hidden");
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    if (toastContainer) toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => toast.remove(), 3000);
}

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(auth, async user => {
    if (!user) {
        location.replace("../student/login.html");
        return;
    }

    if (!lessonId) {
        location.href = "lessons.html";
        return;
    }

    showLoader();
    await loadCourses();
    await loadLesson();
    hideLoader();
});

/* ==========================================================================
   LOAD COURSES & MODULES
   ========================================================================== */

async function loadCourses() {
    const snapshot = await getDocs(collection(db, "courses"));
    courseId.innerHTML = `<option value="">Select Course</option>`;

    snapshot.forEach(docSnap => {
        const course = docSnap.data();
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = course.title;
        option.dataset.title = course.title;
        courseId.appendChild(option);
    });
}

courseId.addEventListener("change", loadModules);

async function loadModules() {
    moduleId.innerHTML = `<option value="">Select Module</option>`;
    if (!courseId.value) return;

    const snapshot = await getDocs(
        query(collection(db, "modules"), where("courseId", "==", courseId.value))
    );

    snapshot.forEach(docSnap => {
        const module = docSnap.data();
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = module.title;
        option.dataset.title = module.title;
        moduleId.appendChild(option);
    });
}

/* ==========================================================================
   LOAD LESSON
   ========================================================================== */

async function loadLesson() {
    const lessonRef = doc(db, "lessons", lessonId);
    const lessonSnap = await getDoc(lessonRef);

    if (!lessonSnap.exists()) {
        showToast("Lesson not found.", "error");
        location.href = "lessons.html";
        return;
    }

    const lesson = lessonSnap.data();

    courseId.value = lesson.courseId;
    await loadModules();
    moduleId.value = lesson.moduleId;

    lessonTitle.value = lesson.title || "";
    lessonDescription.value = lesson.description || "";
    lessonOrder.value = lesson.order || 1;
    if (lessonStatus) lessonStatus.value = lesson.status || "published";

    // Handles video
    existingVideoUrl = lesson.videoUrl || "";
    if (videoUrl) videoUrl.value = existingVideoUrl;
    if (currentVideo) {
        currentVideo.textContent = existingVideoUrl
            ? existingVideoUrl.split("/").pop()
            : "No video uploaded.";
    }

    // Handles practice attachment file
    existingPracticeFileUrl = lesson.practiceFileUrl || lesson.attachmentUrl || "";
    if (currentPracticeFile) {
        currentPracticeFile.textContent = existingPracticeFileUrl
            ? existingPracticeFileUrl.split("/").pop()
            : "No practice file uploaded.";
    }
}

/* ==========================================================================
   UPDATE LESSON
   ========================================================================== */

lessonForm.addEventListener("submit", async event => {
    event.preventDefault();

    try {
        showLoader();

        let uploadedVideoUrl = existingVideoUrl;

        // Video file update
        if (videoFile && videoFile.files.length > 0) {
            const response = await uploadFile(
                videoFile.files[0],
                "lessons",
                percent => {
                    if (uploadProgress) uploadProgress.value = percent;
                    if (uploadPercent) uploadPercent.textContent = percent + "%";
                }
            );
            uploadedVideoUrl = response.url;
        }

        // Practice file update
        let uploadedPracticeUrl = existingPracticeFileUrl;
        if (practiceFile && practiceFile.files && practiceFile.files.length > 0) {
            const practiceResponse = await uploadFile(
                practiceFile.files[0],
                "Lesson Practice Files"
            );
            uploadedPracticeUrl = practiceResponse.url;
        }

        const selectedCourse = courseId.options[courseId.selectedIndex];
        const selectedModule = moduleId.options[moduleId.selectedIndex];

        await updateDoc(doc(db, "lessons", lessonId), {
            courseId: courseId.value,
            courseTitle: selectedCourse.dataset.title,
            moduleId: moduleId.value,
            moduleTitle: selectedModule.dataset.title,
            title: lessonTitle.value.trim(),
            description: lessonDescription.value.trim(),
            order: Number(lessonOrder.value),
            status: lessonStatus ? lessonStatus.value : "published",
            videoUrl: uploadedVideoUrl,
            practiceFileUrl: uploadedPracticeUrl,
            updatedAt: serverTimestamp()
        });

        hideLoader();
        showToast("Lesson updated successfully.");

        setTimeout(() => {
            location.href = "lessons.html";
        }, 1000);
    } catch (error) {
        console.error(error);
        hideLoader();
        showToast("Failed to update lesson.", "error");
    }
});