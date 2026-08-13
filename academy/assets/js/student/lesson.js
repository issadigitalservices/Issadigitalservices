"use strict";

/* ==========================================================================
   ISSA Academy
   Student Lesson
   ========================================================================== */

import {
    auth,
    db
} from "../core/firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    getDocs,
    updateDoc,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const lessonTitle =
    document.getElementById("lessonTitle");

const headerModuleTitle =
    document.getElementById("moduleTitle");

const lessonVideo =
    document.getElementById("lessonVideo");

const lessonDescription =
    document.getElementById("lessonDescription");

const downloadBtn =
    document.getElementById("downloadBtn");

const previousLesson =
    document.getElementById("previousLesson");

const nextLesson =
    document.getElementById("nextLesson");

const logoutBtn =
    document.getElementById("logoutBtn");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

const progressPercent =
    document.getElementById("progressPercent");

const progressBar =
    document.getElementById("progressBar");

const lessonNumber =
    document.getElementById("lessonNumber");

const lessonStatus =
    document.getElementById("lessonStatus");

const lessonStatusText =
    document.getElementById("lessonStatusText");


/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const lessonId =
    params.get("id");

/* ==========================================================================
   GLOBALS
   ========================================================================== */

let studentId = null;

let lessonData = null;

let enrollmentId = null;

let enrollmentData = null;

let lessons = [];

let currentIndex = -1;

let isCompleted = false;

let watchMarked = false;

let lastSavedTime = 0;

let player = null;

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(
    auth,
    async user => {
        if (!user) {
            location.replace("login.html");
            return;
        }

        studentId = user.uid;
        showLoader();
        await loadLesson();
        hideLoader();
    }
);

/* ==========================================================================
   LOAD LESSON (OPTIMIZED PARALLEL FETCHING)
   ========================================================================== */

async function loadLesson() {
    // 1. Fetch main lesson data first
    const lessonSnap = await getDoc(
        doc(db, "lessons", lessonId)
    );

    if (!lessonSnap.exists()) {
        showToast("Lesson not found", "error");
        return;
    }

    lessonData = lessonSnap.data();
    const lesson = lessonData;

    // Default State
    isCompleted = false;
    watchMarked = false;

    lessonStatusText.textContent = "In Progress";
    lessonStatus.classList.remove("status-success");
    lessonStatus.classList.add("status-warning");

    nextLesson.disabled = true;

    lessonTitle.textContent = lesson.title;
    lessonDescription.textContent = lesson.description || "";

    /* ================= PROTECTED VIDEO SETUP ================= */

if (lesson.videoUrl) {

    try {

        const currentUser = auth.currentUser;

        if (!currentUser) {
            throw new Error(
                "Your login session has expired."
            );
        }


        /*
         * Existing lessons already have videoUrl.
         *
         * Extract the R2 object key from the old public URL
         * so we do not need to modify all existing lessons.
         */

        let videoKey = lesson.videoKey || "";

        if (!videoKey) {

            try {

                const videoUrl =
                    new URL(lesson.videoUrl);

                videoKey =
                    decodeURIComponent(
                        videoUrl.pathname.replace(/^\/+/, "")
                    );

            }

            catch (error) {

                console.error(
                    "Unable to determine video key:",
                    error
                );

            }

        }


        if (!videoKey) {

            throw new Error(
                "Video file information is missing."
            );

        }


        /*
         * Get the current Firebase ID token.
         */

        const idToken =
            await currentUser.getIdToken();


        /*
         * Ask Cloudflare Worker for a temporary
         * protected video session.
         */

        const sessionResponse =
            await fetch(
                "https://video.issadigitalservices.com/video-session",
                {
                    method: "POST",

                    credentials: "omit",

                    headers: {
                        "Authorization":
                            `Bearer ${idToken}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        courseId:
                            lesson.courseId,

                        videoKey:
                            videoKey

                    })
                }
            );


        const sessionData =
            await sessionResponse.json();


        if (
            !sessionResponse.ok ||
            !sessionData.success ||
            !sessionData.token
        ) {

            throw new Error(
                sessionData.message ||
                "Unable to secure this video."
            );

        }


        /*
         * Temporary protected video URL.
         */

        const protectedVideoUrl =
    `https://video.issadigitalservices.com/video?token=${encodeURIComponent(sessionData.token)}`;


        /*
 * Allow the video element to send the
 * protected session cookie to Cloudflare Worker.
 */

lessonVideo.crossOrigin = "anonymous";

/*
 * Initialize Plyr once.
 */

if (!player) {

    player = new Plyr(
        lessonVideo,
                {
                    blankVideo: "",
                    controls: [
                        "play-large",
                        "play",
                        "progress",
                        "current-time",
                        "duration",
                        "mute",
                        "volume",
                        "settings",
                        "fullscreen"
                    ],

                    settings: [
                        "speed"
                    ],

                    speed: {
                        selected: 1.25,
                        options: [
                            0.5,
                            0.75,
                            1,
                            1.25,
                            1.5,
                            2
                        ]
                    }
                }
            );

        }

        

        /*
         * Give Plyr the protected video URL.
         */

        player.source = {

            type: "video",

            sources: [
                {
                    src:
                        protectedVideoUrl,

                    type:
                        "video/mp4"
                }
            ]

        };


        /* ========================================================
           DURATION & TIMEUPDATE LISTENERS (PLYR FIX)
        ======================================================== */

        const updateDurationUI = () => {
            const durationElement = document.getElementById("lessonDuration");
            if (!durationElement) return;

            const durationVal = player.duration || lessonVideo.duration;

            if (durationVal && !isNaN(durationVal) && durationVal > 0) {
                const totalSeconds = Math.floor(durationVal);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                durationElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
            } else if (lesson.duration) {
                durationElement.textContent = lesson.duration;
            }
        };

        /* ================= AUTO-INJECT ISSA ACADEMY WATERMARK ================= */
            player.off("ready"); // Clear prior ready listeners if re-initializing
            player.on("ready", () => {
                const container = player.elements.container;

                if (!container.querySelector(".plyr-watermark")) {
                    const watermark = document.createElement("div");
                    watermark.className = "plyr-watermark";
                    watermark.innerHTML = `
                        <img src="../assets/images/Issa-Logo.png" alt="ISSA Logo">
                        <span>ISSA Academy</span>
                    `;
                    container.appendChild(watermark);
                }

                updateDurationUI();
            });


        // Remove existing listeners
        player.off("loadedmetadata");
        player.off("timeupdate");

        // Attach Plyr event listeners
        player.on("loadedmetadata", updateDurationUI);
        player.on("ready", updateDurationUI);

        player.on("timeupdate", async () => {
            const durationVal = player.duration || lessonVideo.duration;
            const currentVal = player.currentTime || lessonVideo.currentTime;

            if (!durationVal || durationVal <= 0) return;

            const percent = (currentVal / durationVal) * 100;

            // Mark complete when student reaches 90%
            if (percent >= 90 && !watchMarked && !isCompleted) {
                watchMarked = true;
                console.log("90% threshold reached! Completing lesson...");
                await completeLesson();
            }
        });

        if (lessonVideo.readyState >= 1) {
            updateDurationUI();
        }


    }

    catch (error) {

        console.error(
            "Protected video error:",
            error
        );

        lessonVideo.removeAttribute(
            "src"
        );

        showToast(
            error.message ||
            "Unable to load video.",
            "error"
        );

    }

}

else {

    lessonVideo.removeAttribute(
        "src"
    );

}

    if (lesson.practiceFileUrl) {

    downloadBtn.href = lesson.practiceFileUrl;

    downloadBtn.style.display = "inline-flex";

    downloadBtn.setAttribute(
        "download",
        ""
    );

} else {

    downloadBtn.style.display = "none";

}

    lessonVideo.addEventListener("contextmenu", event => {
        event.preventDefault();
    });

    /* ================= VIDEO EVENTS ================= */
    

    /* ================= PARALLEL DATA FETCHING ================= */
    // Fetch Module, Lesson List, Enrollment, and Lesson Progress simultaneously
    const [
        moduleSnap,
        lessonsSnapshot,
        enrollmentSnapshot,
        completedSnapshot
    ] = await Promise.all([
        getDoc(doc(db, "modules", lesson.moduleId)),
        getDocs(query(
            collection(db, "lessons"),
            where("moduleId", "==", lesson.moduleId),
            orderBy("order")
        )),
        getDocs(query(
            collection(db, "enrollments"),
            where("studentId", "==", studentId),
            where("courseId", "==", lesson.courseId)
        )),
        getDocs(query(
            collection(db, "lessonProgress"),
            where("studentId", "==", studentId),
            where("lessonId", "==", lessonId)
        ))
    ]);

    /* ================= APPLY MODULE DATA ================= */
    if (moduleSnap.exists()) {
        headerModuleTitle.textContent = moduleSnap.data().title;
    }

    /* ================= APPLY LESSON LIST ================= */
    lessons = [];
    lessonsSnapshot.forEach(docSnap => {
        lessons.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    currentIndex = lessons.findIndex(item => item.id === lessonId);

    /* ================= LESSON LOCK CHECK ================= */
    if (currentIndex > 0) {
        const previousLessonId = lessons[currentIndex - 1].id;
        const previousCompleted = await getDocs(
            query(
                collection(db, "lessonProgress"),
                where("studentId", "==", studentId),
                where("lessonId", "==", previousLessonId)
            )
        );

        if (previousCompleted.empty) {
            showToast(
                "Please complete the previous lesson first.",
                "warning"
            );
            location.href = `lesson.html?id=${previousLessonId}`;
            return;
        }
    }

    lessonNumber.textContent = `${currentIndex + 1} of ${lessons.length}`;

    if (currentIndex === 0) {
        previousLesson.disabled = true;
    }

    /* ================= LAST LESSON & NEXT BUTTON ================= */
    if (currentIndex === lessons.length - 1) {
        const examSnapshot = await getDocs(
            query(
                collection(db, "exams"),
                where("moduleId", "==", lesson.moduleId),
                limit(1)
            )
        );

        nextLesson.innerHTML = `
            <div>
                <small>Next Step</small>
                <strong>Take Module Exam</strong>
            </div>
            <i class="fa-solid fa-file-circle-check"></i>
        `;

        nextLesson.onclick = () => {
            if (examSnapshot.empty) {
                showToast("Module Exam not found.", "error");
                return;
            }
            const examId = examSnapshot.docs[0].id;
            location.href = `start-assessment.html?id=${examId}&courseId=${lesson.courseId}`;
        };
    } else {
        nextLesson.innerHTML = `
            <div>
                <small>Next Lesson</small>
                <strong>Continue</strong>
            </div>
            <i class="fa-solid fa-arrow-right"></i>
        `;

        nextLesson.onclick = () => {
            if (!isCompleted) {
                showToast(
                    "Please complete this lesson before continuing.",
                    "warning"
                );
                return;
            }
            location.href = `lesson.html?id=${lessons[currentIndex + 1].id}`;
        };
    }

    /* ================= APPLY ENROLLMENT DATA ================= */
    if (!enrollmentSnapshot.empty) {
        enrollmentId = enrollmentSnapshot.docs[0].id;
        enrollmentData = enrollmentSnapshot.docs[0].data();

        const progress = enrollmentData.progress || 0;
        progressPercent.textContent = `${progress}%`;
        progressBar.style.width = `${progress}%`;
    }

    /* ================= APPLY LESSON COMPLETION STATUS ================= */
    if (!completedSnapshot.empty) {
        isCompleted = true;

        lessonStatus.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            <div>
                <small>Lesson Status</small>
                <strong>Completed</strong>
            </div>
        `;

        lessonStatus.classList.remove("status-warning");
        lessonStatus.classList.add("status-success");
        lessonStatusText.textContent = "Completed";

        nextLesson.disabled = false;

        if (currentIndex < lessons.length - 1) {
            nextLesson.innerHTML = `
                <div>
                    <small>Next Lesson</small>
                    <strong>Continue</strong>
                </div>
                <i class="fa-solid fa-arrow-right"></i>
            `;
        } else {
            nextLesson.innerHTML = `
                <div>
                    <small>Next Step</small>
                    <strong>Take Module Exam</strong>
                </div>
                <i class="fa-solid fa-file-circle-check"></i>
            `;
        }
    }
}

/* ==========================================================================
   PREVIOUS
   ========================================================================== */

previousLesson.addEventListener("click", () => {
    if (currentIndex <= 0) {
        showToast("This is the first lesson.", "warning");
        return;
    }
    location.href = `lesson.html?id=${lessons[currentIndex - 1].id}`;
});

/* ==========================================================================
   NEXT
   ========================================================================== */

nextLesson.addEventListener("click", async () => {
    if (!isCompleted) {
        showToast(
            "Please complete this lesson before continuing.",
            "warning"
        );
        return;
    }

    if (currentIndex === lessons.length - 1) {
        const examSnapshot = await getDocs(
            query(
                collection(db, "exams"),
                where("moduleId", "==", lessonData.moduleId),
                limit(1)
            )
        );

        if (examSnapshot.empty) {
            showToast("Module Exam not found.", "error");
            return;
        }

        location.href = `start-assessment.html?id=${examSnapshot.docs[0].id}&courseId=${lessonData.courseId}`;
        return;
    }

    location.href = `lesson.html?id=${lessons[currentIndex + 1].id}`;
});

/* ==========================================================================
   COMPLETE
   ========================================================================== */

async function completeLesson() {
    if (!enrollmentId || isCompleted) {
        return;
    }

    try {
        await addDoc(
            collection(db, "lessonProgress"),
            {
                studentId: studentId,
                courseId: lessonData.courseId,
                moduleId: lessonData.moduleId,
                lessonId: lessonId,
                completed: true,
                completedAt: serverTimestamp()
            }
        );

        isCompleted = true;
        lessonStatusText.textContent = "Completed";

        // Fetch total and completed lessons in parallel
        const [totalLessons, completedLessons] = await Promise.all([
            getDocs(query(
                collection(db, "lessons"),
                where("courseId", "==", lessonData.courseId)
            )),
            getDocs(query(
                collection(db, "lessonProgress"),
                where("studentId", "==", studentId),
                where("courseId", "==", lessonData.courseId)
            ))
        ]);

        const progress = Math.round(
            (completedLessons.size / totalLessons.size) * 100
        );

        await updateDoc(
            doc(db, "enrollments", enrollmentId),
            { progress: progress }
        );

        console.log("Progress =", progress);

        progressPercent.textContent = `${progress}%`;
        progressBar.style.width = `${progress}%`;

        lessonStatus.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            <div>
                <small>Lesson Status</small>
                <strong>Completed</strong>
            </div>
        `;

        lessonStatus.classList.remove("status-warning");
        lessonStatus.classList.add("status-success");
        lessonStatusText.textContent = "Completed";

        nextLesson.disabled = false;

        if (currentIndex < lessons.length - 1) {
            nextLesson.innerHTML = `
                <div>
                    <small>Next Lesson</small>
                    <strong>Continue</strong>
                </div>
                <i class="fa-solid fa-arrow-right"></i>
            `;
        } else {
            nextLesson.innerHTML = `
                <div>
                    <small>Next Step</small>
                    <strong>Take Module Exam</strong>
                </div>
                <i class="fa-solid fa-file-circle-check"></i>
            `;
        }

        showToast("Lesson automatically marked as completed.");

    } catch (error) {
        console.error(error);
        showToast("Unable to complete lesson.", "error");
    }
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

logoutBtn.addEventListener("click", async event => {
    event.preventDefault();
    await signOut(auth);
    location.href = "login.html";
});

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader() {
    loader.classList.remove("hidden");
}

function hideLoader() {
    loader.classList.add("hidden");
}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(message, type = "success") {
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