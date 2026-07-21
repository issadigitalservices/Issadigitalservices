"use strict";

/* ==========================================================================
   ISSA Academy
   Student Registration
   ========================================================================== */

import {

    auth,
    db

} from "../core/firebase-config.js";

import {

    createUserWithEmailAndPassword

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    doc,
    setDoc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const form =
    document.getElementById("registerForm");

const fullName =
    document.getElementById("fullName");

const email =
    document.getElementById("email");

const mobile =
    document.getElementById("mobile");

const password =
    document.getElementById("password");

const confirmPassword =
    document.getElementById("confirmPassword");

const togglePassword =
    document.getElementById("togglePassword");

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   PASSWORD TOGGLE
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

    }

);

toggleConfirmPassword.addEventListener(

    "click",

    ()=>{

        confirmPassword.type =

            confirmPassword.type==="password"

            ?

            "text"

            :

            "password";

    }

);

/* ==========================================================================
   REGISTER
   ========================================================================== */

form.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        if(

            password.value !==

            confirmPassword.value

        ){

            showToast(

                "Passwords do not match.",

                "error"

            );

            return;

        }

        showLoader();

        try{

            const credential =

                await createUserWithEmailAndPassword(

                    auth,

                    email.value.trim(),

                    password.value

                );

            const user =

                credential.user;

            await setDoc(

                doc(

                    db,

                    "students",

                    user.uid

                ),

                {

                    uid:user.uid,

                    name:

                        fullName.value.trim(),

                    email:

                        email.value.trim(),

                    mobile:

                        mobile.value.trim(),

                    status:

                        "registered",

                    role:

                        "student",

                    createdAt:

                        serverTimestamp()

                }

            );

            showToast(

                "Registration successful."

            );

            setTimeout(()=>{

                location.href=

                    "login.html";

            },1500);

        }

        catch(error){

            console.error(error);

            showToast(

                error.message,

                "error"

            );

        }

        hideLoader();

    }

);

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