"use strict";

/* ==========================================================================
   ISSA Academy
   Admin Login
   ========================================================================== */

import {

    auth,
    db

} from "../core/firebase-config.js";

import {

    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signOut

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    doc,
    getDoc

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

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

            const credential =

                await signInWithEmailAndPassword(

                    auth,

                    email.value.trim(),

                    password.value

                );

            const adminRef = doc(

                db,

                "admins",

                credential.user.uid

            );

            const adminSnap =

                await getDoc(

                    adminRef

                );

            if(!adminSnap.exists()){

                await signOut(auth);

                throw new Error(

                    "Access denied. Administrator account required."

                );

            }

            showToast(

                "Administrator login successful."

            );

            setTimeout(()=>{

                location.href =

                    "dashboard.html";

            },1000);

        }

        catch(error){

            console.error(error);

            showToast(

                error.message ||

                "Unable to login.",

                "error"

            );

        }

        finally{

            hideLoader();

        }

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