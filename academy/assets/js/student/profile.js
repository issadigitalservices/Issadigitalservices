"use strict";

/* ==========================================================================
   ISSA Academy
   Student Profile Controller
   Version : 1.1.0
   ========================================================================== */

import {
    auth
} from "../core/firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore();

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */

const profileForm = document.getElementById("profileForm");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const pageLoader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");
const logoutBtn = document.getElementById("logoutBtn");

/* ==========================================================================
   LOADER & TOAST UTILITIES
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

/* ==========================================================================
   AUTHENTICATION OBSERVER
   ========================================================================== */

onAuthStateChanged(auth, async user => {
    if (!user) {
        location.replace("login.html");
        return;
    }

    showLoader();
    await loadProfile(user);
    hideLoader();
});

/* ==========================================================================
   LOAD PROFILE DATA
   ========================================================================== */

async function loadProfile(user) {
    try {
        if (email) email.value = user.email || "";

        const snapshot = await getDoc(
            doc(db, "students", user.uid)
        );

        if (snapshot.exists()) {
            const data = snapshot.data();
            if (fullName) fullName.value = data.name || user.displayName || "";
            if (phone) phone.value = data.phone || "";
        } else if (user.displayName && fullName) {
            fullName.value = user.displayName;
        }

    } catch (error) {
        console.error("Failed to load profile:", error);
        showToast("Unable to load profile data.", "error");
    }
}

/* ==========================================================================
   UPDATE PROFILE DATA
   ========================================================================== */

if (profileForm) {
    profileForm.addEventListener("submit", async event => {
        event.preventDefault();

        const nameVal = fullName.value.trim();
        const phoneVal = phone.value.trim();

        if (!nameVal) {
            showToast("Please enter your full name.", "error");
            return;
        }

        try {
            showLoader();

            await setDoc(
                doc(db, "students", auth.currentUser.uid),
                {
                    name: nameVal,
                    phone: phoneVal,
                    email: auth.currentUser.email,
                    updatedAt: serverTimestamp()
                },
                { merge: true }
            );

            hideLoader();
            showToast("Profile updated successfully.", "success");

        } catch (error) {
            console.error("Failed to update profile:", error);
            hideLoader();
            showToast("Profile update failed. Please try again.", "error");
        }
    });
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            location.replace("login.html");
        } catch (error) {
            console.error("Logout error:", error);
            showToast("Failed to logout.", "error");
        }
    });
}