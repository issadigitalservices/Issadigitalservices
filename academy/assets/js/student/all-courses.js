"use strict";

/* ==========================================================================
   ISSA Academy
   All Courses (Explore Courses Catalog)
   Version : 2.1
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

import {
    createCourseCard
} from "../core/course-card.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const allCoursesGrid = document.getElementById("allCoursesGrid");
const loader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.replace("login.html");
        return;
    }

    try {

        showLoader();

        await loadAllCourses(user.uid);

    } finally {

        hideLoader();

    }

});

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadAllCourses(studentId) {

    try {

        allCoursesGrid.innerHTML = "";

        const [
            coursesSnapshot,
            enrollmentsSnapshot
        ] = await Promise.all([

            getDocs(
                query(
                    collection(db, "courses"),
                    orderBy("title")
                )
            ),

            getDocs(
                query(
                    collection(db, "enrollments"),
                    where("studentId", "==", studentId)
                )
            )

        ]);

        const enrollmentMap = new Map();

        enrollmentsSnapshot.forEach((docSnap) => {
            const enrollment = docSnap.data();
            enrollmentMap.set(
                enrollment.courseId,
                enrollment.approvalStatus
            );
        });

        if (coursesSnapshot.empty) {
            allCoursesGrid.innerHTML = `
                <h3 class="empty-courses-heading">
                    No courses available at the moment.
                </h3>
            `;
            return;
        }

        /* -------------------------------------------------------
           FETCH COURSES & DYNAMIC COUNTS
        ------------------------------------------------------- */
        const cardPromises = coursesSnapshot.docs.map(async (docSnap) => {

            const courseId = docSnap.id;
            const courseData = docSnap.data();

            // Fetch actual modules & lessons counts
            const [modulesSnap, lessonsSnap] = await Promise.all([
                getDocs(query(collection(db, "modules"), where("courseId", "==", courseId))),
                getDocs(query(collection(db, "lessons"), where("courseId", "==", courseId)))
            ]);

            const course = {
                id: courseId,
                ...courseData,
                totalModules: modulesSnap.size || courseData.totalModules || 0,
                totalLessons: lessonsSnap.size || courseData.totalLessons || 0
            };

            const status = enrollmentMap.get(courseId);

            let actionButton = "";
            const whatsappNumber = "+919746431460";

            if (status === "Approved") {

                actionButton = `
                    <a
                        href="course.html?id=${courseId}"
                        class="btn btn-primary">
                        Go to Course
                    </a>
                `;

            } else if (status === "Pending") {

                const message = encodeURIComponent(
                    `Hello Admin, my enrollment for course "${course.title}" is currently Approval Pending. Please check my status.`
                );

                actionButton = `
                    <div class="pending-actions-wrapper">
                        <button
                            class="btn btn-secondary"
                            disabled>
                            Approval Pending
                        </button>
                        <a
                            href="https://wa.me/${whatsappNumber}?text=${message}"
                            target="_blank"
                            class="btn btn-whatsapp-support">
                            <i class="fa-brands fa-whatsapp"></i>
                            Contact Support
                        </a>
                    </div>
                `;

            } else {

                actionButton = `
                    <a
                        href="enroll.html?courseId=${courseId}"
                        class="btn btn-primary">
                        Enroll Now
                    </a>
                `;

            }

            let card = createCourseCard(course, {
                mode: "student"
            });

            // 1. Convert string to temporary DOM element
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = card;

            // 2. Remove default buttons from course-card.js
            const defaultBtns = tempDiv.querySelectorAll("a.btn, button.btn");
            defaultBtns.forEach(btn => {
                if (btn.parentElement && btn.parentElement !== tempDiv.firstElementChild && btn.parentElement.children.length === 1) {
                    btn.parentElement.remove();
                } else {
                    btn.remove();
                }
            });

            // 3. Append correct dynamic button
            const cardElement = tempDiv.firstElementChild;
            if (cardElement) {
                cardElement.insertAdjacentHTML("beforeend", `
                    <div class="course-action-container">
                        ${actionButton}
                    </div>
                `);
            }

            return tempDiv.innerHTML;

        });

        // Resolve all async promises and render to grid
        const cards = await Promise.all(cardPromises);
        allCoursesGrid.innerHTML = cards.join("");

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to load courses.",
            "error"
        );

    }

}

/* ==========================================================================
   ENROLLMENT & PAYMENT HANDLER (GPAY + WHATSAPP)
   ========================================================================== */

window.enrollInCourse = async function (courseId) {

    try {

        const user = auth.currentUser;

        if (!user) return;

        showLoader();

        const [
            userDocSnap,
            courseDocSnap
        ] = await Promise.all([

            getDoc(doc(db, "students", user.uid)),
            getDoc(doc(db, "courses", courseId))

        ]);

        const userData =
            userDocSnap.exists()
                ? userDocSnap.data()
                : {};

        const courseData =
            courseDocSnap.exists()
                ? courseDocSnap.data()
                : {};

        await addDoc(

            collection(db, "enrollments"),

            {

                studentId: user.uid,

                studentName:
                    userData.name ||
                    user.displayName ||
                    "Student",

                studentEmail:
                    user.email || "",

                studentMobile:
                    userData.mobile ||
                    userData.phone ||
                    "N/A",

                courseId,

                courseName:
                    courseData.title ||
                    "Selected Course",

                coursePrice:
                    courseData.price || 999,

                currency:
                    courseData.currency || "₹",

                approvalStatus: "Pending",

                createdAt: serverTimestamp(),

                enrolledAt: serverTimestamp()

            }

        );

        hideLoader();

        showPaymentModal(courseId);

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to enroll. Try again.",
            "error"
        );

        hideLoader();

    }

};

/* ==========================================================================
   PAYMENT MODAL
   ========================================================================== */

function showPaymentModal(courseId) {

    document
        .getElementById("paymentModal")
        ?.remove();

    const gpayNumber = "+919746431460";

    const whatsappNumber = "+919746431460";

    const whatsappMessage = encodeURIComponent(

        `Hello Admin, I have requested enrollment for Course ID: ${courseId}. Here is my GPay payment screenshot.`

    );

    document.body.insertAdjacentHTML(

        "beforeend",

        `
        <div id="paymentModal" class="modal-overlay">

            <div class="modal-card">

                <h3 class="modal-title">

                    Complete Your Payment

                </h3>

                <p class="modal-text">

                    Scan or transfer the fee via GPay to

                    <br>

                    <strong class="modal-gpay-number">

                        ${gpayNumber}

                    </strong>

                </p>

                <div class="modal-actions">

                    <a

                        href="https://wa.me/${whatsappNumber}?text=${whatsappMessage}"

                        target="_blank"

                        class="btn btn-whatsapp-support modal-whatsapp-btn">

                        <i class="fa-brands fa-whatsapp"></i>

                        Verify via WhatsApp

                    </a>

                    <button

                        class="btn btn-primary modal-done-btn"

                        onclick="document.getElementById('paymentModal').remove();location.reload();">

                        Payment Done

                    </button>

                </div>

            </div>

        </div>
        `

    );

}

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

        toast.classList.remove("show");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);

}

/* ==========================================================================
   END OF FILE
   ========================================================================== */