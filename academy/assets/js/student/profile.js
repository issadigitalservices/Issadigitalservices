"use strict";

/* ==========================================================================
   ISSA Academy
   Student Profile Controller
   Version : 1.0.0
   ========================================================================== */

import {

    auth

} from "../core/firebase-config.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    getFirestore,

    doc,

    getDoc,

    updateDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore();

/* ==========================================================================
   DOM
   ========================================================================== */

const profileForm =
    document.getElementById("profileForm");

const fullName =
    document.getElementById("fullName");

const email =
    document.getElementById("email");

const phone =
    document.getElementById("phone");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader(){

    pageLoader.classList.remove("hidden");

}

function hideLoader(){

    pageLoader.classList.add("hidden");

}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(message){

    const toast=document.createElement("div");

    toast.className="toast";

    toast.textContent=message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(()=>{

        toast.classList.add("show");

    });

    setTimeout(()=>{

        toast.remove();

    },3000);

}

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(

    auth,

    async user=>{

        if(!user){

            location.replace("login.html");

            return;

        }

        showLoader();

        await loadProfile(user);

        hideLoader();

    }

);

/* ==========================================================================
   LOAD PROFILE
   ========================================================================== */

async function loadProfile(user){

    try{

        email.value=user.email;

        const snapshot=

            await getDoc(

                doc(

                    db,

                    "students",

                    user.uid

                )

            );

        if(snapshot.exists()){

            const data=snapshot.data();

            fullName.value=

                data.name || "";

            phone.value=

                data.phone || "";

        }

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to load profile."

        );

    }

}

/* ==========================================================================
   UPDATE PROFILE
   ========================================================================== */

profileForm.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        try{

            showLoader();

            await updateDoc(

                doc(

                    db,

                    "students",

                    auth.currentUser.uid

                ),

                {

                    name:

                        fullName.value.trim(),

                    phone:

                        phone.value.trim(),

                    updatedAt:

                        serverTimestamp()

                }

            );

            hideLoader();

            showToast(

                "Profile updated successfully."

            );

        }

        catch(error){

            console.error(error);

            hideLoader();

            showToast(

                "Profile update failed."

            );

        }

    }

);

/* ==========================================================================
   END
   ========================================================================== */