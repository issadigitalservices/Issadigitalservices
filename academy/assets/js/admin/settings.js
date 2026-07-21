"use strict";

/* ==========================================================================
   ISSA Academy
   Admin Settings
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
    setDoc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const settingsForm =
    document.getElementById("settingsForm");

const academyName =
    document.getElementById("academyName");

const whatsapp =
    document.getElementById("whatsapp");

const email =
    document.getElementById("email");

const website =
    document.getElementById("website");

const address =
    document.getElementById("address");

const currency =
    document.getElementById("currency");

const facebook =
    document.getElementById("facebook");

const instagram =
    document.getElementById("instagram");

const youtube =
    document.getElementById("youtube");

const linkedin =
    document.getElementById("linkedin");

    const certificatePrefix =
    document.getElementById("certificatePrefix");

const instructorName =
    document.getElementById("instructorName");

const instructorDesignation =
    document.getElementById("instructorDesignation");

const certificateLogo =
    document.getElementById("certificateLogo");

const signatureImage =
    document.getElementById("signatureImage");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(

    auth,

    async user=>{

        if(!user){

            location.replace(

                "../student/login.html"

            );

            return;

        }

        showLoader();

        await loadSettings();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD SETTINGS
   ========================================================================== */

async function loadSettings(){

    try{

        const snapshot =

            await getDoc(

                doc(

                    db,

                    "settings",

                    "academy"

                )

            );

        if(!snapshot.exists()){

            return;

        }

        const data =

            snapshot.data();

        academyName.value =
            data.academyName || "";

        whatsapp.value =
            data.whatsapp || "";

        email.value =
            data.email || "";

        website.value =
            data.website || "";

        address.value =
            data.address || "";

        currency.value =
            data.currency || "SAR";

        facebook.value =
            data.facebook || "";

        instagram.value =
            data.instagram || "";

        youtube.value =
            data.youtube || "";

        linkedin.value =
            data.linkedin || "";

            certificatePrefix.value =
    data.certificatePrefix || "ISSA";

instructorName.value =
    data.instructorName || "";

instructorDesignation.value =
    data.instructorDesignation || "";

certificateLogo.value =
    data.certificateLogo || "";

signatureImage.value =
    data.signatureImage || "";

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to load settings.",

            "error"

        );

    }

}

/* ==========================================================================
   SAVE SETTINGS
   ========================================================================== */

settingsForm.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        showLoader();

        try{

            await setDoc(

                doc(

                    db,

                    "settings",

                    "academy"

                ),

                {

                    academyName:

                        academyName.value.trim(),

                    whatsapp:

                        whatsapp.value.trim(),

                    email:

                        email.value.trim(),

                    website:

                        website.value.trim(),

                    address:

                        address.value.trim(),

                    currency:

                        currency.value,

                    facebook:

                        facebook.value.trim(),

                    instagram:

                        instagram.value.trim(),

                    youtube:

                        youtube.value.trim(),

                    linkedin:

                        linkedin.value.trim(),

                        certificatePrefix:
    certificatePrefix.value.trim(),

instructorName:
    instructorName.value.trim(),

instructorDesignation:
    instructorDesignation.value.trim(),

certificateLogo:
    certificateLogo.value.trim(),

signatureImage:
    signatureImage.value.trim(),

                    updatedAt:

    serverTimestamp()

                },

                {

                    merge:true

                }

            );

            showToast(

                "Settings saved successfully."

            );

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

/* ==========================================================================
   END
   ========================================================================== */