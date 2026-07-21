"use strict";

/* ==========================================================================
   ISSA Academy
   Certificate View
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
    collection,
    query,
    where,
    getDocs

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const courseId =
    params.get("courseId");

/* ==========================================================================
   DOM
   ========================================================================== */

const academyLogo =
    document.getElementById("academyLogo");

const academyName =
    document.getElementById("academyName");

const studentName =
    document.getElementById("studentName");

const courseName =
    document.getElementById("courseName");

const certificateNumber =
    document.getElementById("certificateNumber");

const issueDate =
    document.getElementById("issueDate");

const signatureImage =
    document.getElementById("signatureImage");

const instructorName =
    document.getElementById("instructorName");

const designation =
    document.getElementById("designation");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

const backBtn =
    document.getElementById("backBtn");

const printBtn =
    document.getElementById("printBtn");

    const qrCode =

    document.getElementById(

        "qrCode"

    );

/* ==========================================================================
   GLOBAL
   ========================================================================== */

let currentUser = null;

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

        currentUser = user;

        if(!courseId){

            location.href = "certificates.html";

            return;

        }

        showLoader();

        await loadCertificate();

        await loadAcademySettings();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD CERTIFICATE
   ========================================================================== */

async function loadCertificate(){

    try{

        const snapshot = await getDocs(

            query(

                collection(db,"certificates"),

                where("studentId","==",currentUser.uid),

                where("courseId","==",courseId)

            )

        );

        if(snapshot.empty){

            showToast(

                "Certificate not found.",

                "error"

            );

            return;

        }

        const data =

            snapshot.docs[0].data();

        studentName.textContent =

            data.studentName || "-";

        courseName.textContent =

            data.courseName || "-";

        certificateNumber.textContent =

            data.certificateNumber || "-";



        if (data.issueDate) {

    let date;

    if (typeof data.issueDate.toDate === "function") {

        date = data.issueDate.toDate();

    }

    else {

        date = new Date(data.issueDate);

    }

    issueDate.textContent =

        date.toLocaleDateString(

            "en-GB",

            {

                day: "2-digit",

                month: "long",

                year: "numeric"

            }

        );

}

else {

    issueDate.textContent = "-";

}

/* ======================================================================
   QR CODE
   ====================================================================== */

const verifyUrl =

    `${location.origin}/academy/student/certificate-verify.html?certificate=${encodeURIComponent(data.certificateNumber)}`;

qrCode.innerHTML = "";

new QRCode(

    qrCode,

    {

        text: verifyUrl,

        width:100,

        height:100,

        correctLevel: QRCode.CorrectLevel.H

    }

);

    }

    catch(error){

        console.error(error);

        showToast(

            error.message,

            "error"

        );

    }

}


/* ==========================================================================
   LOAD SETTINGS
   ========================================================================== */

async function loadAcademySettings(){

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

        const settings =
            snapshot.data();

        academyName.textContent =
            settings.academyName || "ISSA Academy";

        if(settings.certificateLogo){

            academyLogo.src =
                settings.certificateLogo;

        }

        if(settings.signatureImage){

            signatureImage.src =
                settings.signatureImage;

        }

        instructorName.textContent =
            settings.instructorName || "";

        designation.textContent =
            settings.instructorDesignation || "";

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================================================================
   BUTTONS
   ========================================================================== */

backBtn.addEventListener(

    "click",

    ()=>{

        history.back();

    }

);

printBtn.addEventListener(

    "click",

    async ()=>{

        const certificate =

            document.querySelector(

                ".certificate-border"

            );

        const canvas =

            await html2canvas(

                certificate,

                {

                    scale:4,

                    useCORS:true,

                    backgroundColor:"#ffffff"

                }

            );

        const image =

            canvas.toDataURL(

                "image/png"

            );

        const {

            jsPDF

        } = window.jspdf;

        const pdf =

    new jsPDF({

        orientation:"landscape",

        unit:"mm",

        format:"a4",

        compress:true

    });

        const pageWidth =

            297;

        const pageHeight =

            210;

        pdf.addImage(

    image,

    "PNG",

    0,

    0,

    297,

    210

);

        pdf.save(

    `${certificateNumber.textContent.trim()}.pdf`

);

    }

);

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