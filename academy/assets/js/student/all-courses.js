"use strict";

/* ==========================================================================
   ISSA Academy
   All Courses (Explore Courses Catalog)
   ========================================================================== */

import {
    auth,
    db
} from "../core/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getDocs,
    getDoc,
    doc,
    collection,
    query,
    orderBy,
    where,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const allCoursesGrid = document.getElementById("allCoursesGrid");
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
        await loadAllCourses(user.uid);
        hideLoader();
    }
);

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadAllCourses(studentId) {
    try {
        allCoursesGrid.innerHTML = "";

        // Fetch all courses and user's enrollments concurrently
        const [coursesSnapshot, userEnrollmentsSnap] = await Promise.all([
            getDocs(query(collection(db, "courses"), orderBy("title"))),
            getDocs(query(collection(db, "enrollments"), where("studentId", "==", studentId)))
        ]);

        const enrolledCoursesMap = new Map();
        userEnrollmentsSnap.forEach(doc => {
            const data = doc.data();
            enrolledCoursesMap.set(data.courseId, data.approvalStatus);
        });

        if (coursesSnapshot.empty) {
            allCoursesGrid.innerHTML = `<h3 class="empty-courses-heading">No courses available at the moment.</h3>`;
            return;
        }

        coursesSnapshot.forEach(docSnap => {
            const courseId = docSnap.id;
            const course = docSnap.data();

            const enrollmentStatus = enrolledCoursesMap.get(courseId); // "Approved", "Pending", etc.
            
            let actionButtonHTML = "";
            const whatsappNumber = "+919746431460"; // Support WhatsApp number

            if (enrollmentStatus === "Approved") {
                actionButtonHTML = `<a href="course.html?id=${courseId}" class="btn btn-primary go-to-course-btn">Go to Course</a>`;
            } else if (enrollmentStatus === "Pending") {
                const supportMessage = encodeURIComponent(`Hello Admin, my enrollment for course "${course.title || courseId}" is currently Approval Pending. Please check my status.`);
                actionButtonHTML = `
                    <div class="pending-actions-wrapper">
                        <button class="btn btn-secondary" disabled>Approval Pending</button>
                        <a href="https://wa.me/${whatsappNumber}?text=${supportMessage}" target="_blank" class="btn btn-whatsapp-support">
                            <i class="fa-brands fa-whatsapp"></i> Contact Support
                        </a>
                    </div>
                `;
            } else {
    actionButtonHTML = `
        <a
            href="enroll.html?courseId=${courseId}"
            class="btn btn-primary enroll-now-btn">

            Enroll Now

        </a>
    `;
}

            const cardHTML = `
                <div class="course-card">
                    <div class="course-thumbnail-wrapper">
                        <img src="${course.thumbnail || '../assets/images/courses/excel-masterclass.jpg'}" alt="${course.title}" class="course-thumbnail">
                        <span class="course-category-badge">${course.category || 'General'}</span>
                    </div>
                    <div class="course-card-content">
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-description">${course.description ? course.description.substring(0, 90) + '...' : 'Explore this comprehensive course layout designed for mastery.'}</p>
                        <div class="course-action-container">
                            ${actionButtonHTML}
                        </div>
                    </div>
                </div>
            `;

            allCoursesGrid.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Error loading courses:", error);
        showToast("Failed to load courses.", "error");
    }
}

/* ==========================================================================
   ENROLLMENT & PAYMENT HANDLER (GPAY + WHATSAPP)
   ========================================================================== */

window.enrollInCourse = async function(courseId) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        showLoader();

        // 1. Fetch student details and course details so the admin panel has all info
        const [userDocSnap, courseDocSnap] = await Promise.all([
            getDoc(doc(db, "students", user.uid)),
            getDoc(doc(db, "courses", courseId))
        ]);

        const userData = userDocSnap.exists() ? userDocSnap.data() : {};
        const courseData = courseDocSnap.exists() ? courseDocSnap.data() : {};

        // 2. Create the Pending enrollment with all required display fields
        await addDoc(collection(db, "enrollments"), {
            studentId: user.uid,
            studentName: userData.name || user.displayName || "Student",
            studentEmail: user.email || "",
            studentMobile: userData.mobile || userData.phone || "N/A",
            courseId: courseId,
            courseName: courseData.title || "Selected Course",
            coursePrice: courseData.price || 999,
            currency: courseData.currency || "₹",
            approvalStatus: "Pending",
            createdAt: serverTimestamp(),
            enrolledAt: serverTimestamp()
        });

        hideLoader();

        // 3. Show GPay & WhatsApp Instructions Modal to the student
        showPaymentModal(courseId);

    } catch (error) {
        console.error("Enrollment error:", error);
        showToast("Failed to enroll. Try again.", "error");
        hideLoader();
    }
};

function showPaymentModal(courseId) {
    const existingModal = document.getElementById("paymentModal");
    if (existingModal) existingModal.remove();

    const gpayNumber = "+919746431460"; 
    const whatsappNumber = "+919746431460"; 
    const whatsappMessage = encodeURIComponent("Hello Admin, I have requested enrollment for Course ID: " + courseId + ". Here is my GPay payment screenshot:");

    const modalHTML = `
        <div id="paymentModal" class="modal-overlay">
            <div class="modal-card">
                <h3 class="modal-title">Complete Your Payment</h3>
                <p class="modal-text">
                    Scan or transfer the fee via GPay to: <br><strong class="modal-gpay-number">${gpayNumber}</strong>
                </p>
                <div class="modal-actions">
                    <a href="https://wa.me/${whatsappNumber}?text=${whatsappMessage}" target="_blank" class="btn btn-whatsapp-support modal-whatsapp-btn">
                        <i class="fa-brands fa-whatsapp"></i> Verify via WhatsApp
                    </a>
                    <button onclick="document.getElementById('paymentModal').remove(); location.reload();" class="btn btn-primary modal-done-btn">
                        Payment Done
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/* ==========================================================================
   LOADER & TOAST UTILITIES
   ========================================================================== */

function showLoader() {
    loader.classList.remove("hidden");
}

function hideLoader() {
    loader.classList.add("hidden");
}

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