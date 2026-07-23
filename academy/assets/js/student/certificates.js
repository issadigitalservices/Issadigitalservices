"use strict";

/* ==========================================================================
   ISSA Academy
   Student Certificates Controller
   Version : 1.0.2
   ========================================================================== */

import { auth } from "../core/firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore();

/* ==========================================================================
   DOM
   ========================================================================== */

const certificatesGrid = document.getElementById("certificatesGrid");
const pageLoader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader() {
  pageLoader.classList.remove("hidden");
}

function hideLoader() {
  pageLoader.classList.add("hidden");
}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
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
   AUTH
   ========================================================================== */

onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("login.html");
    return;
  }

  showLoader();
  await loadCertificates(user.uid);
  hideLoader();
});

/* ==========================================================================
   LOAD CERTIFICATES
   ========================================================================== */

async function loadCertificates(studentId) {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "certificates"),
        where("studentId", "==", studentId)
      )
    );

    certificatesGrid.innerHTML = "";

    if (snapshot.empty) {
      certificatesGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-award"></i>
          <h2>No Certificates Yet</h2>
          <p>Complete your courses to unlock certificates.</p>
        </div>
      `;
      return;
    }

    // Format options for: 01 January 2026
    const dateOptions = { day: "2-digit", month: "long", year: "numeric" };

    snapshot.forEach(docSnap => {
      const certificate = docSnap.data();

      // Extract date from Firestore Timestamp or JS Date object
      const rawDate = certificate.issuedAt?.toDate
        ? certificate.issuedAt.toDate()
        : certificate.issueDate?.toDate
        ? certificate.issueDate.toDate()
        : certificate.issuedAt || certificate.issueDate;

      // Format date to "01 January 2026"
      const formattedDate =
        rawDate instanceof Date
          ? rawDate.toLocaleDateString("en-GB", dateOptions)
          : typeof rawDate === "string"
          ? new Date(rawDate).toLocaleDateString("en-GB", dateOptions)
          : "N/A";

      certificatesGrid.innerHTML += `
        <div class="certificate-card">
          <div class="certificate-icon">
            <i class="fa-solid fa-award"></i>
          </div>
          <div class="certificate-title">
            ${certificate.courseName || "Course Certificate"}
          </div>
          <div class="certificate-id">
            Certificate No : ${certificate.certificateNumber || "N/A"}
          </div>
          <div class="certificate-date">
            Issued Date : ${formattedDate}
          </div>
          <button 
            class="btn-download" 
            onclick="location.href='certificate-view.html?courseId=${certificate.courseId}'">
            <i class="fa-solid fa-award"></i> View Certificate
          </button>
        </div>
      `;
    });
  } catch (error) {
    console.error(error);
    showToast("Unable to load certificates.");
  }
}