"use strict";

/* ==========================================================================
   ISSA Academy
   Certificate Verification
   ========================================================================== */

import {

    db

} from "../core/firebase-config.js";

import {

    collection,
    query,
    where,
    getDocs

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const certificateNumber =
    document.getElementById("certificateNumber");

const verifyBtn =
    document.getElementById("verifyBtn");

const resultContainer =
    document.getElementById("resultContainer");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const certificate =
    params.get("certificate");

if(certificate){

    certificateNumber.value =
        certificate;

    verifyCertificate();

}

/* ==========================================================================
   BUTTON
   ========================================================================== */

verifyBtn.addEventListener(

    "click",

    verifyCertificate

);

certificateNumber.addEventListener(

    "keypress",

    event=>{

        if(event.key==="Enter"){

            verifyCertificate();

        }

    }

);

/* ==========================================================================
   VERIFY
   ========================================================================== */

async function verifyCertificate(){

    const number =

        certificateNumber.value.trim();

    if(!number){

        showToast(

            "Enter Certificate Number.",

            "error"

        );

        return;

    }

    showLoader();

    resultContainer.innerHTML = "";

    try{

        const snapshot =

            await getDocs(

                query(

                    collection(

                        db,

                        "certificates"

                    ),

                    where(

                        "certificateNumber",

                        "==",

                        number

                    )

                )

            );

        hideLoader();

        if(snapshot.empty){

            resultContainer.innerHTML = `

<div class="result-card invalid">

<i class="fa-solid fa-circle-xmark"></i>

<h2>

Certificate Not Found

</h2>

<p>

The certificate number you entered is invalid.

</p>

</div>

`;

            return;

        }

        const data =

            snapshot.docs[0].data();

        let completedDate = "-";

        if(data.issueDate){

            const date =

                typeof data.issueDate.toDate==="function"

                ?

                data.issueDate.toDate()

                :

                new Date(data.issueDate);

            completedDate =

                date.toLocaleDateString(

                    "en-GB",

                    {

                        day:"2-digit",

                        month:"long",

                        year:"numeric"

                    }

                );

        }

        resultContainer.innerHTML = `

<div class="result-card">

<div class="result-header">

<i class="fa-solid fa-circle-check"></i>

<h2>

Certificate Verified

</h2>

</div>

<div class="result-grid">

<div class="result-label">

Student Name

</div>

<div class="result-value">

${data.studentName}

</div>

<div class="result-label">

Course

</div>

<div class="result-value">

${data.courseName}

</div>

<div class="result-label">

Certificate No.

</div>

<div class="result-value">

${data.certificateNumber}

</div>

<div class="result-label">

Completion Date

</div>

<div class="result-value">

${completedDate}

</div>

<div class="result-label">

Issued By

</div>

<div class="result-value">

ISSA Academy

</div>

<div class="result-label">

Status

</div>

<div class="result-value">

<span style="color:#16a34a;font-weight:700;">

Verified ✓

</span>

</div>

</div>

</div>

`;

    }

    catch(error){

        hideLoader();

        console.error(error);

        showToast(

            "Unable to verify certificate.",

            "error"

        );

    }

}

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader(){

    pageLoader.classList.remove(

        "hidden"

    );

}

function hideLoader(){

    pageLoader.classList.add(

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