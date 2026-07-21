"use strict";

/* ==========================================================================
   ISSA Academy
   Forgot Password
   ========================================================================== */

import {

    auth

} from "../core/firebase-config.js";

import {

    sendPasswordResetEmail

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const form =
    document.getElementById("forgotForm");

const email =
    document.getElementById("email");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   RESET PASSWORD
   ========================================================================== */

form.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        showLoader();

        try{

            await sendPasswordResetEmail(

                auth,

                email.value.trim()

            );

            showToast(

                "Password reset link sent successfully."

            );

            setTimeout(()=>{

                location.href=

                    "login.html";

            },2000);

        }

        catch(error){

            console.error(error);

            showToast(

                getErrorMessage(

                    error.code

                ),

                "error"

            );

        }

        hideLoader();

    }

);

/* ==========================================================================
   FIREBASE ERRORS
   ========================================================================== */

function getErrorMessage(code){

    switch(code){

        case "auth/invalid-email":

            return "Invalid email address.";

        case "auth/user-not-found":

            return "No account found with this email.";

        case "auth/missing-email":

            return "Please enter your email.";

        case "auth/too-many-requests":

            return "Too many requests. Please try again later.";

        default:

            return "Unable to send password reset email.";

    }

}

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader(){

    loader.classList.remove(

        "hidden"

    );

}

function hideLoader(){

    loader.classList.add(

        "hidden"

    );

}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(

    message,

    type="success"

){

    const toast =

        document.createElement(

            "div"

        );

    toast.className =

        `toast ${type}`;

    toast.textContent =

        message;

    toastContainer.appendChild(

            toast

    );

    requestAnimationFrame(()=>{

        toast.classList.add(

            "show"

        );

    });

    setTimeout(()=>{

        toast.remove();

    },3000);

}

/* ==========================================================================
   END OF FILE
   ========================================================================== */