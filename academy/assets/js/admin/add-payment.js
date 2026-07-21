"use strict";

/* ==========================================================================
   ISSA Academy
   Add Payment
   ========================================================================== */

import {

    auth,
    db

} from "../core/firebase-config.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const paymentForm =
    document.getElementById("paymentForm");

const studentSelect =
    document.getElementById("studentSelect");

const courseSelect =
    document.getElementById("courseSelect");

const amount =
    document.getElementById("amount");

const currency =
    document.getElementById("currency");

const paymentMethod =
    document.getElementById("paymentMethod");

const transactionNumber =
    document.getElementById("transactionNumber");

const remarks =
    document.getElementById("remarks");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   STATE
   ========================================================================== */

let enrollments = [];

let selectedEnrollment = null;

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

        await loadPendingEnrollments();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD PENDING ENROLLMENTS
   ========================================================================== */

async function loadPendingEnrollments(){

    const snapshot =

        await getDocs(

            query(

                collection(

                    db,

                    "enrollments"

                ),

                where(

                    "approvalStatus",

                    "==",

                    "Pending"

                )

            )

        );

    enrollments=[];

    studentSelect.innerHTML=

        `<option value="">Select Student</option>`;

    snapshot.forEach(document=>{

        const data={

            id:document.id,

            ...document.data()

        };

        enrollments.push(data);

        studentSelect.innerHTML+=`

        <option value="${data.id}">

            ${data.studentName}

        </option>

        `;

    });

}

/* ==========================================================================
   STUDENT SELECTION
   ========================================================================== */

studentSelect.addEventListener(

    "change",

    ()=>{

        const enrollmentId =

            studentSelect.value;

        if(!enrollmentId){

            courseSelect.innerHTML =

                `<option value="">Select Course</option>`;

            amount.value = "";

            currency.value = "SAR";

            selectedEnrollment = null;

            return;

        }

        selectedEnrollment =

            enrollments.find(

                item=>item.id===enrollmentId

            );

        if(!selectedEnrollment){

            return;

        }

        /* ==========================
           Course
           ========================== */

        courseSelect.innerHTML =

        `

        <option value="${selectedEnrollment.courseId}">

            ${selectedEnrollment.courseName}

        </option>

        `;

        /* ==========================
           Amount
           ========================== */

        amount.value =

            selectedEnrollment.price || 0;

        /* ==========================
           Currency
           ========================== */

        currency.value =

            selectedEnrollment.currency || "SAR";

    }

);

/* ==========================================================================
   COURSE LOCK
   ========================================================================== */

courseSelect.addEventListener(

    "change",

    ()=>{

        if(selectedEnrollment){

            courseSelect.value =

                selectedEnrollment.courseId;

        }

    }

);

/* ==========================================================================
   AMOUNT VALIDATION
   ========================================================================== */

amount.addEventListener(

    "input",

    ()=>{

        if(

            Number(amount.value) < 0

        ){

            amount.value = 0;

        }

    }

);

/* ==========================================================================
   SAVE PAYMENT
   ========================================================================== */

paymentForm.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        if(!selectedEnrollment){

            showToast(

                "Please select a student.",

                "error"

            );

            return;

        }

        showLoader();

        try{

            /* ==========================
               Save Payment
               ========================== */

            await addDoc(

                collection(

                    db,

                    "payments"

                ),

                {

                    enrollmentId:

                        selectedEnrollment.id,

                    studentId:

                        selectedEnrollment.studentId,

                    studentName:

                        selectedEnrollment.studentName,

                    studentEmail:

                        selectedEnrollment.studentEmail,

                    studentMobile:

                        selectedEnrollment.studentMobile,

                    courseId:

                        selectedEnrollment.courseId,

                    courseName:

                        selectedEnrollment.courseName,

                    amount:

                        Number(

                            amount.value

                        ),

                    currency:

                        currency.value,

                    paymentMethod:

                        paymentMethod.value,

                    transactionNumber:

                        transactionNumber.value.trim(),

                    remarks:

                        remarks.value.trim(),

                    status:

                        "Verified",

                    createdAt:

                        serverTimestamp(),

                    verifiedAt:

                        serverTimestamp()

                }

            );

            /* ==========================
               Update Enrollment
               ========================== */

            await updateDoc(

                doc(

                    db,

                    "enrollments",

                    selectedEnrollment.id

                ),

                {

                    paymentStatus:

                        "Verified",

                    approvalStatus:

                        "Approved",

                    approvedAt:

                        serverTimestamp()

                }

            );

            showToast(

                "Payment verified successfully."

            );

            setTimeout(

                ()=>{

                    location.href =

                        "payments.html";

                },

                1200

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
   RESET FORM
   ========================================================================== */

function resetForm(){

    paymentForm.reset();

    selectedEnrollment = null;

    courseSelect.innerHTML =

        `<option value="">Select Course</option>`;

    amount.value = "";

    currency.value = "SAR";

}

/* ==========================================================================
   END
   ========================================================================== */