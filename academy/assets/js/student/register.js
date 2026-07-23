"use strict";

/* ==========================================================================
   ISSA Academy
   Student Registration JavaScript
   ========================================================================== */

import {
    auth,
    db
} from "../core/firebase-config.js";

import {
    createUserWithEmailAndPassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */

const form = document.getElementById("registerForm");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const mobileInput = document.getElementById("mobile");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const loader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   INTL-TEL-INPUT (COUNTRY CODE PICKER)
   ========================================================================== */

let phoneInput = null;

if (mobileInput) {
    phoneInput = window.intlTelInput(mobileInput, {
        initialCountry: "auto",
        separateDialCode: true,
        nationalMode: false,
        geoIpLookup: function (success, failure) {
            fetch("https://ipapi.co/json/")
                .then(res => res.json())
                .then(data => success(data.country_code))
                .catch(() => success("sa")); // Default fallback to Saudi Arabia (SA)
        },
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js"
    });
}

/* ==========================================================================
   EMAIL VALIDATOR HELPER
   ========================================================================== */

function isValidEmail(emailStr) {
    // Basic structural email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailStr)) return false;

    const parts = emailStr.split("@");
    if (parts.length !== 2) return false;

    const localPart = parts[0];
    
    // Prevent single/double letter fake prefixes like 'a@gmail.com'
    if (localPart.length < 3) return false;

    return true;
}

/* ==========================================================================
   PASSWORD TOGGLE CONTROLS
   ========================================================================== */

function setupPasswordToggle(inputEl, toggleBtn) {
    if (!inputEl || !toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
        const isPassword = inputEl.type === "password";
        inputEl.type = isPassword ? "text" : "password";

        const icon = toggleBtn.querySelector("i");
        if (icon) {
            icon.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
        }
    });
}

setupPasswordToggle(password, togglePassword);
setupPasswordToggle(confirmPassword, toggleConfirmPassword);

/* ==========================================================================
   REGISTRATION HANDLER
   ========================================================================== */

form.addEventListener("submit", async event => {
    event.preventDefault();

    // Field Values
    const nameVal = fullName.value.trim();
    const emailVal = email.value.trim().toLowerCase();
    const passVal = password.value;
    const confirmPassVal = confirmPassword.value;

    // 1. Basic Fields Validation
    if (!nameVal || !emailVal || !passVal) {
        showToast("Please fill in all required fields.", "error");
        return;
    }

    // 2. Strict Email Validation
    if (!isValidEmail(emailVal)) {
        showToast("Please enter a valid, complete email address.", "error");
        return;
    }

    // 3. Mobile Number & Country Validation
    if (!mobileInput.value.trim()) {
        showToast("Please enter your mobile number.", "error");
        return;
    }

    if (phoneInput && !phoneInput.isValidNumber()) {
        const selectedCountry = phoneInput.getSelectedCountryData();
        const countryName = selectedCountry ? selectedCountry.name.split('(')[0] : "selected country";
        showToast(`Please enter a valid mobile number for ${countryName}.`, "error");
        return;
    }

    // Get Formatted International Phone Number (e.g., +9665XXXXXXX)
    const formattedMobile = phoneInput ? phoneInput.getNumber() : mobileInput.value.trim();
    const countryCode = phoneInput ? phoneInput.getSelectedCountryData().iso2.toUpperCase() : "";

    // 4. Password Validation
    if (passVal.length < 6) {
        showToast("Password must be at least 6 characters long.", "error");
        return;
    }

    if (passVal !== confirmPassVal) {
        showToast("Passwords do not match.", "error");
        return;
    }

    showLoader();

    try {
        // 1. Create Firebase Auth User
        const credential = await createUserWithEmailAndPassword(
            auth,
            emailVal,
            passVal
        );

        const user = credential.user;

        // 2. Send Email Verification Link
        await sendEmailVerification(user);

        // 3. Save Student Profile in Firestore
        await setDoc(
            doc(db, "students", user.uid),
            {
                uid: user.uid,
                name: nameVal,
                email: emailVal,
                mobile: formattedMobile,
                country: countryCode,
                status: "registered",
                role: "student",
                createdAt: serverTimestamp()
            }
        );

        hideLoader(); // Hide loader screen before showing popup

        // Show Custom Central Modal Popup
        showSuccessModal(() => {
            location.href = "login.html";
        });

    } catch (error) {
        console.error("Registration Error:", error);
        
        let friendlyMessage = "Failed to create account. Please try again.";
        if (error.code === "auth/email-already-in-use") {
            friendlyMessage = "This email is already registered. Try logging in.";
        } else if (error.code === "auth/invalid-email") {
            friendlyMessage = "Please enter a valid email address.";
        } else if (error.message) {
            friendlyMessage = error.message;
        }

        showToast(friendlyMessage, "error");
    } finally {
        hideLoader();
    }
});

/* ==========================================================================
   SUCCESS MODAL HANDLER
   ========================================================================== */

function showSuccessModal(onOkCallback) {
    const successModal = document.getElementById("successModal");
    const modalOkBtn = document.getElementById("modalOkBtn");

    if (!successModal || !modalOkBtn) return;

    // Reveal central popup modal
    successModal.classList.remove("hidden");

    // Handle OK button click
    modalOkBtn.onclick = () => {
        successModal.classList.add("hidden");
        if (onOkCallback) onOkCallback();
    };
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
    }, 3000);
}