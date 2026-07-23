"use strict";

/* ==========================================================================
   ISSA Academy
   Certificate View
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
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   URL
   ========================================================================== */

const params = new URLSearchParams(location.search);
const courseId = params.get("courseId");

/* ==========================================================================
   DOM
   ========================================================================== */

const certificateWrapper = document.getElementById("certificateWrapper");
const academyLogo = document.getElementById("academyLogo");
const academyName = document.getElementById("academyName");
const studentName = document.getElementById("studentName");
const courseName = document.getElementById("courseName");
const certificateNumber = document.getElementById("certificateNumber");
const issueDate = document.getElementById("issueDate");
const signatureImage = document.getElementById("signatureImage");
const instructorName = document.getElementById("instructorName");
const designation = document.getElementById("designation");
const pageLoader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");
const backBtn = document.getElementById("backBtn");
const printBtn = document.getElementById("printBtn");
const qrCode = document.getElementById("qrCode");

/* ==========================================================================
   GLOBAL
   ========================================================================== */

let currentUser = null;

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(auth, async user => {
    if (!user) {
        location.replace("login.html");
        return;
    }

    currentUser = user;

    if (!courseId) {
        location.href = "dashboard.html";
        return;
    }

    showLoader();
    const hasCertificate = await loadCertificate();

    if (hasCertificate) {
        await loadAcademySettings();
        // Reveal certificate wrapper only after dynamic data load finishes
        if (certificateWrapper) {
            certificateWrapper.classList.remove("hidden");
        }
    }

    hideLoader();
});

/* ==========================================================================
   LOAD CERTIFICATE
   ========================================================================== */

async function loadCertificate() {
    try {
        const snapshot = await getDocs(
            query(
                collection(db, "certificates"),
                where("studentId", "==", currentUser.uid),
                where("courseId", "==", courseId)
            )
        );

        if (snapshot.empty) {
            showToast("No certificate found for this course.", "error");
            setTimeout(() => {
                location.href = "dashboard.html";
            }, 1800);
            return false;
        }

        const data = snapshot.docs[0].data();

        // Convert student name to UPPERCASE dynamically
        const rawName = data.studentName || "-";
        studentName.textContent = rawName !== "-" ? rawName.toUpperCase() : "-";

        courseName.textContent = data.courseName || "-";
        certificateNumber.textContent = data.certificateNumber || "-";

        if (data.issueDate || data.issuedAt) {
            let date;
            const rawDate = data.issueDate || data.issuedAt;

            if (typeof rawDate.toDate === "function") {
                date = rawDate.toDate();
            } else {
                date = new Date(rawDate);
            }

            issueDate.textContent = date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            });
        } else {
            issueDate.textContent = "-";
        }

        /* ======================================================================
           QR CODE
           ====================================================================== */

        const verifyUrl = `${location.origin}/academy/student/certificate-verify.html?certificate=${encodeURIComponent(data.certificateNumber || "")}`;

        qrCode.innerHTML = "";

        new QRCode(qrCode, {
            text: verifyUrl,
            width: 65,
            height: 65,
            correctLevel: QRCode.CorrectLevel.H
        });

        return true;

    } catch (error) {
        console.error("Error loading certificate:", error);
        showToast("Error loading certificate.", "error");
        setTimeout(() => {
            location.href = "dashboard.html";
        }, 1800);
        return false;
    }
}

/* ==========================================================================
   LOAD SETTINGS
   ========================================================================== */

async function loadAcademySettings() {
    try {
        const snapshot = await getDoc(
            doc(db, "settings", "academy")
        );

        if (!snapshot.exists()) {
            return;
        }

        const settings = snapshot.data();

        academyName.textContent = settings.academyName || "ISSA Academy";

        if (settings.certificateLogo) {
            academyLogo.src = settings.certificateLogo;
        }

        if (settings.signatureImage) {
            signatureImage.src = settings.signatureImage;
            signatureImage.classList.remove("hidden");
            instructorName.classList.add("hidden");
        }

        if (settings.instructorName) {
            instructorName.textContent = settings.instructorName;
        }

        if (settings.instructorDesignation) {
            designation.textContent = settings.instructorDesignation;
        }

    } catch (error) {
        console.error("Error loading academy settings:", error);
    }
}

/* ==========================================================================
   BUTTONS
   ========================================================================== */

backBtn.addEventListener("click", () => {
    history.back();
});

printBtn.addEventListener("click", async () => {
    try {
        showLoader();

        // Wait for all custom fonts to be fully loaded & rendered
        if (document.fonts) {
            await document.fonts.ready;
        }

        const certificate = document.querySelector(".certificate-border");

        const canvas = await html2canvas(certificate, {
            scale: 4,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false
        });

        const image = canvas.toDataURL("image/png");

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
            compress: true
        });

        pdf.addImage(image, "PNG", 0, 0, 297, 210);

        pdf.save(`${certificateNumber.textContent.trim() || "Certificate"}.pdf`);

    } catch (error) {
        console.error("PDF generation failed:", error);
        showToast("Failed to generate PDF. Please try again.", "error");
    } finally {
        hideLoader();
    }
});

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