"use strict";

/* ==========================================================================
   ISSA Academy
   Student Login
   ========================================================================== */

import {
    auth
} from "../core/firebase-config.js";

import {
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const togglePassword = document.getElementById("togglePassword");
const loader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");
const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

// Auto focus email input on page load
if (email) {
    email.focus();
}

/* ==========================================================================
   PASSWORD
   ========================================================================== */

if (togglePassword && password) {
    togglePassword.addEventListener("click", () => {
        const isPassword = password.type === "password";
        password.type = isPassword ? "text" : "password";

        togglePassword.innerHTML = isPassword
            ? '<i class="fa-solid fa-eye-slash"></i>'
            : '<i class="fa-solid fa-eye"></i>';
    });
}

/* ==========================================================================
   LOGIN HANDLER
   ========================================================================== */

form.addEventListener("submit", async event => {
    event.preventDefault();

    showLoader();
    if (submitBtn) submitBtn.disabled = true;

    try {
        // Set persistence based on "Remember Me" checkbox
        await setPersistence(
            auth,
            rememberMe && rememberMe.checked
                ? browserLocalPersistence
                : browserSessionPersistence
        );

        // Authenticate User
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email.value.trim().toLowerCase(),
            password.value
        );

        const user = userCredential.user;

        // CHECK EMAIL VERIFICATION
        if (!user.emailVerified) {
            // Automatically send a fresh verification email link
            await sendEmailVerification(user);

            // Log out unverified session
            await signOut(auth);

            showToast(
                "Your email is not verified. A new verification link has been sent to your inbox.",
                "error"
            );

            if (submitBtn) submitBtn.disabled = false;
            hideLoader();
            return;
        }

        // Email Verified -> Proceed to Dashboard
        showToast("Login successful. Redirecting...");

        setTimeout(() => {
            location.href = "dashboard.html";
        }, 1000);

    } catch (error) {
        console.error("Login Error:", error);

        showToast(
            getErrorMessage(error.code),
            "error"
        );

        if (submitBtn) submitBtn.disabled = false;
        hideLoader();
    }
});

/* ==========================================================================
   FIREBASE ERRORS
   ========================================================================== */

function getErrorMessage(code) {
    switch (code) {
        case "auth/invalid-email":
            return "Invalid email address.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";

        default:
            return "Unable to login. Please try again.";
    }
}

/* ==========================================================================
   LOADER UI
   ========================================================================== */

function showLoader() {
    if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
    if (loader) loader.classList.add("hidden");
}

/* ==========================================================================
   TOAST NOTIFICATION SYSTEM
   ========================================================================== */

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
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}