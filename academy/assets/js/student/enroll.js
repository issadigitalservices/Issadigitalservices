"use strict";

/* ==========================================================================
   ISSA Academy
   Student Enrollment
   ========================================================================== */

import {
    auth,
    db
} from "../core/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const WHATSAPP_NUMBER = "919746431460";

/* ==========================================================================
   DOM
   ========================================================================== */

const courseThumbnail = document.getElementById("courseThumbnail");
const courseTitle = document.getElementById("courseTitle");
const courseCategory = document.getElementById("courseCategory");
const courseDescription = document.getElementById("courseDescription");
const coursePrice = document.getElementById("coursePrice");

const enrollmentStatus = document.getElementById("enrollmentStatus");
const statusMessage = document.getElementById("statusMessage");
const instructionText = document.getElementById("instructionText");

const enrollBtn = document.getElementById("enrollBtn");
const dashboardBtn = document.getElementById("dashboardBtn");
const supportBtn = document.getElementById("supportBtn");

const loader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   URL
   ========================================================================== */

const params = new URLSearchParams(location.search);
const courseId = params.get("id");

/* ==========================================================================
   STATE
   ========================================================================== */

let currentUser = null;
let student = null;
let course = null;
let enrollment = null;

/* ==========================================================================
   INITIAL CHECK
   ========================================================================== */

if (!courseId) {
    alert("Invalid Course Link.");
    location.href = "../excel.html";
}

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        location.replace(
            "login.html?id=" + encodeURIComponent(courseId)
        );
        return;
    }

    currentUser = user;

    showLoader();

    try {
        await loadStudent();
        await loadCourse();
        await checkEnrollment();
    } catch (error) {
        console.error(error);
        showToast(
            error.message,
            "error"
        );
    }

    hideLoader();
});

/* ==========================================================================
   STUDENT
   ========================================================================== */

async function loadStudent() {
    const studentRef = doc(
        db,
        "students",
        currentUser.uid
    );

    const snap = await getDoc(studentRef);

    if (!snap.exists()) {
        const newStudent = {
            uid: currentUser.uid,
            name: currentUser.displayName || "",
            email: currentUser.email || "",
            mobile: currentUser.phoneNumber || "",
            status: "Active",
            createdAt: serverTimestamp()
        };

        await setDoc(
            studentRef,
            newStudent
        );

        student = newStudent;
        return;
    }

    student = snap.data();
}

/* ==========================================================================
   COURSE
   ========================================================================== */

async function loadCourse() {
    const snap = await getDoc(
        doc(
            db,
            "courses",
            courseId
        )
    );

    if (!snap.exists()) {
        throw new Error("Course not found.");
    }

    course = snap.data();

    if (courseThumbnail) {
        courseThumbnail.src = "../assets/images/courses/excel-masterclass.jpg";
    }

    if (courseTitle) {
        courseTitle.textContent = course.title;
    }

    if (courseCategory) {
        courseCategory.textContent = course.categoryId || "";
    }

    if (courseDescription) {
        courseDescription.textContent = course.description || "";
    }

    if (coursePrice) {
        coursePrice.textContent = `${course.currency || "INR"} ${course.offerPrice || course.price || 0}`;
    }
}

/* ==========================================================================
   CHECK ENROLLMENT (UPDATED WITH EXPIRATION LOGIC)
   ========================================================================== */

async function checkEnrollment() {
    const snapshot = await getDocs(
        query(
            collection(
                db,
                "enrollments"
            ),
            where(
                "studentId",
                "==",
                currentUser.uid
            ),
            where(
                "courseId",
                "==",
                courseId
            )
        )
    );

    if (snapshot.empty) {
        enrollmentStatus.textContent = "Not Enrolled";
        statusMessage.textContent = "You are not enrolled in this course.";
        instructionText.textContent = "Click Continue to WhatsApp to submit your enrollment request.";

        if (dashboardBtn) dashboardBtn.classList.add("hidden");
        if (enrollBtn) {
            enrollBtn.classList.remove("hidden");
            enrollBtn.className = "btn btn-primary enroll-btn";
            enrollBtn.disabled = false;
            enrollBtn.innerHTML = `
                <i class="fa-brands fa-whatsapp"></i>
                Continue to WhatsApp
            `;
        }

        return;
    }

    enrollment = snapshot.docs[0].data();

    // Handle Expiration logic if approved
    const now = new Date();
    const expiresAtDate = enrollment.expiresAt ? enrollment.expiresAt.toDate() : null;
    const isExpired = expiresAtDate && now > expiresAtDate;

    switch (enrollment.approvalStatus) {
        case "Pending":
            enrollmentStatus.textContent = "Pending Approval";
            statusMessage.textContent = "Your enrollment request has been received.";
            instructionText.textContent = "Please complete the payment and wait for admin approval.";

            if (dashboardBtn) dashboardBtn.classList.add("hidden");
            if (enrollBtn) {
                enrollBtn.classList.remove("hidden");
                enrollBtn.disabled = true;
                enrollBtn.innerHTML = "Enrollment Submitted";
            }
            break;

        case "Approved":
            if (isExpired) {
                // ❌ Course Access Has Expired (1 year limit reached)
                enrollmentStatus.textContent = "Access Expired";
                statusMessage.textContent = `Your 1-year course access expired on ${expiresAtDate.toLocaleDateString()}.`;
                instructionText.textContent = "Please contact support to renew your enrollment access.";

                if (dashboardBtn) dashboardBtn.classList.add("hidden");
                if (enrollBtn) {
                    enrollBtn.classList.remove("hidden");
                    enrollBtn.disabled = false;
                    enrollBtn.className = "btn btn-primary enroll-btn";
                    enrollBtn.innerHTML = `
                        <i class="fa-brands fa-whatsapp"></i>
                        Renew Access via WhatsApp
                    `;
                }
            } else {
                // ✅ Active Access
                enrollmentStatus.textContent = "Approved";
                
                const validUntilText = expiresAtDate 
                    ? ` (Access valid until ${expiresAtDate.toLocaleDateString()})` 
                    : "";
                
                statusMessage.textContent = `Your enrollment has been approved.${validUntilText}`;
                instructionText.textContent = "You can now start learning.";

                if (enrollBtn) enrollBtn.classList.add("hidden");
                if (dashboardBtn) dashboardBtn.classList.remove("hidden");
            }
            break;

        case "Rejected":
            enrollmentStatus.textContent = "Rejected";
            statusMessage.textContent = "Your enrollment was rejected.";
            instructionText.textContent = "Please contact support for assistance.";

            if (dashboardBtn) dashboardBtn.classList.add("hidden");
            if (enrollBtn) {
                enrollBtn.classList.remove("hidden");
                enrollBtn.disabled = false;
            }
            break;

        default:
            enrollmentStatus.textContent = "Unknown";
    }
}

/* ==========================================================================
   ENROLL
   ========================================================================== */

if (enrollBtn) {
    enrollBtn.addEventListener("click", async () => {
        const now = new Date();
        const expiresAtDate = enrollment?.expiresAt ? enrollment.expiresAt.toDate() : null;
        const isExpired = expiresAtDate && now > expiresAtDate;

        if (enrollment && enrollment.approvalStatus === "Approved" && !isExpired) {
            location.href = "dashboard.html";
            return;
        }

        if (enrollment && enrollment.approvalStatus === "Pending") {
            showToast(
                "Your enrollment is already pending approval."
            );
            return;
        }

        showLoader();

        try {
            const existing = await getDocs(
                query(
                    collection(db, "enrollments"),
                    where(
                        "studentId",
                        "==",
                        currentUser.uid
                    ),
                    where(
                        "courseId",
                        "==",
                        courseId
                    )
                )
            );

            // If enrollment exists, isn't approved, or isn't expired
            if (!existing.empty && !isExpired) {
                hideLoader();
                showToast(
                    "Enrollment already submitted."
                );
                return;
            }

            // Standard enrollment submission
            if (existing.empty) {
                await addDoc(
                    collection(
                        db,
                        "enrollments"
                    ),
                    {
                        studentId: currentUser.uid,
                        studentName: student.name,
                        studentEmail: student.email,
                        studentMobile: student.mobile,
                        courseId: courseId,
                        courseName: course.title,
                        coursePrice:
                            course.offerPrice ||
                            course.price ||
                            0,
                        currency:
                            course.currency ||
                            "INR",
                        paymentMethod:
                            "WhatsApp",
                        paymentStatus:
                            "Pending",
                        approvalStatus:
                            "Pending",
                        progress: 0,
                        createdAt:
                            serverTimestamp()
                    }
                );
            }

            const message = `Hello,

I would like to ${isExpired ? "renew my access for" : "enroll in"} the following course.

Course:
${course.title}

Price:
${course.currency || "INR"} ${course.offerPrice || course.price || 0}

Student Name:
${student.name}

Email:
${student.email}

Mobile:
${student.mobile}

Please share the payment details.

Thank you.`;

            const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

            enrollmentStatus.textContent = "Pending Approval";
            statusMessage.textContent = "Your request has been submitted.";
            instructionText.textContent = "Please complete the payment through WhatsApp. Your course will be activated after admin approval.";

            enrollBtn.disabled = true;
            enrollBtn.innerHTML = "Enrollment Submitted";

            showToast(
                "Request submitted successfully."
            );

            setTimeout(() => {
                window.open(
                    whatsappURL,
                    "_blank"
                );
            }, 600);

        } catch (error) {
            console.error(error);
            showToast(
                error.message,
                "error"
            );
        }

        hideLoader();
    });
}

/* ==========================================================================
   SUPPORT BUTTON
   ========================================================================== */

if (supportBtn) {
    supportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.open(
            `https://wa.me/${WHATSAPP_NUMBER}`,
            "_blank"
        );
    });
}

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader() {
    if (loader) {
        loader.classList.remove("hidden");
    }
}

function hideLoader() {
    if (loader) {
        loader.classList.add("hidden");
    }
}

/* ==========================================================================
   TOAST
   ========================================================================== */

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

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}