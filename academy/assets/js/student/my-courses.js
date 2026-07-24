"use strict";

/* ==========================================================================
   ISSA Academy
   My Courses
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
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const coursesGrid = document.getElementById("coursesGrid");
const emptyState = document.getElementById("emptyState");
const logoutBtn = document.getElementById("logoutBtn");
const loader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

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

        showLoader();
        await loadCourses(user.uid);
        hideLoader();
    }
);

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadCourses(studentId) {
    coursesGrid.innerHTML = "";

    const snapshot = await getDocs(
        query(
            collection(db, "enrollments"),
            where("studentId", "==", studentId),
            where("approvalStatus", "==", "Approved")
        )
    );

    if (snapshot.empty) {
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    for (const enrollment of snapshot.docs) {
        const data = enrollment.data();

        const courseSnap = await getDoc(
            doc(db, "courses", data.courseId)
        );

        if (!courseSnap.exists()) {
            continue;
        }

        const course = courseSnap.data();
        const progress = data.progress || 0;
        
        // Dynamically change button text if the course is completed
        const buttonText = progress === 100 ? "Review" : "Continue";

        // Format Expiry Date from Firestore Timestamp
        let expiryText = "Lifetime Access";
        if (data.expiresAt) {
            const expiryDateObj = data.expiresAt.toDate();
            const formattedDate = expiryDateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            expiryText = `Expires: ${formattedDate}`;
        }

        coursesGrid.innerHTML += `
            <article class="course-card">
                <img
                    src="${course.thumbnail ? "../" + course.thumbnail.replace(/^[\.\/]+/, '') : "../assets/images/excel-course.jpg"}"
                    alt="${course.title}"
                    onerror="this.src='../assets/images/course-placeholder.jpg'">

                <div class="course-content">
                    <h3>${course.title}</h3>

                    <p>${course.description || ""}</p>

                    <!-- Course Expiry Notice -->
                    <div class="course-expiry" style="font-size: 0.85rem; color: #6b7280; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-regular fa-clock"></i>
                        <span>${expiryText}</span>
                    </div>

                    <div class="progress">
                        <div
                            class="progress-bar"
                            style="width:${progress}%">
                        </div>
                  </div>

                    <div class="course-footer">
                        <span class="progress-text">${progress}% Complete</span>

                        <a
                            href="course.html?id=${data.courseId}"
                            class="primary-btn btn-sm">
                            ${buttonText}
                        </a>
                    </div>
                </div>
            </article>
        `;
    }
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

logoutBtn.addEventListener(
    "click",
    async event => {
        event.preventDefault();
        await signOut(auth);
        location.href = "login.html";
    }
);

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

/* ==========================================================================
   END OF FILE
   ========================================================================== */