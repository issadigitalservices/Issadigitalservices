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
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const form =
    document.getElementById("loginForm");

const email =
    document.getElementById("email");

const password =
    document.getElementById("password");

const rememberMe =
    document.getElementById("rememberMe");

const togglePassword =
    document.getElementById("togglePassword");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   PASSWORD
   ========================================================================== */

togglePassword.addEventListener(

    "click",

    ()=>{

        password.type =

            password.type==="password"

            ?

            "text"

            :

            "password";

        togglePassword.innerHTML =

            password.type==="password"

            ?

            '<i class="fa-solid fa-eye"></i>'

            :

            '<i class="fa-solid fa-eye-slash"></i>';

    }

);

/* ==========================================================================
   LOGIN
   ========================================================================== */

form.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        showLoader();

        try{

            await setPersistence(

                auth,

                rememberMe.checked

                ?

                browserLocalPersistence

                :

                browserSessionPersistence

            );

            await signInWithEmailAndPassword(

                auth,

                email.value.trim(),

                password.value

            );

            showToast(

                "Login successful."

            );

            setTimeout(()=>{

                location.href =

                    "dashboard.html";

            },1000);

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

            return "Account not found.";

        case "auth/wrong-password":

            return "Incorrect password.";

        case "auth/invalid-credential":

            return "Incorrect email or password.";

        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";

        default:

            return "Unable to login.";

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