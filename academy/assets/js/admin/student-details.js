"use strict";

/* ==========================================================================
   ISSA Academy
   Student Details
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
    getDocs,
    collection,
    query,
    where

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const studentPhoto =
    document.getElementById("studentPhoto");

const studentName =
    document.getElementById("studentName");

const studentEmail =
    document.getElementById("studentEmail");

const studentMobile =
    document.getElementById("studentMobile");

const studentStatus =
    document.getElementById("studentStatus");

const registeredDate =
    document.getElementById("registeredDate");

const courseCount =
    document.getElementById("courseCount");

const completedCount =
    document.getElementById("completedCount");

const certificateCount =
    document.getElementById("certificateCount");

const courseList =
    document.getElementById("courseList");

const paymentList =
    document.getElementById("paymentList");

const certificateList =
    document.getElementById("certificateList");

const whatsappBtn =
    document.getElementById("whatsappBtn");

const emailBtn =
    document.getElementById("emailBtn");

const disableBtn =
    document.getElementById("disableBtn");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   URL
   ========================================================================== */

const params =

    new URLSearchParams(

        location.search

    );

const studentId =

    params.get("id");

/* ==========================================================================
   STATE
   ========================================================================== */

let student = null;

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

        await loadStudent();

        await loadCourses();

        await loadPayments();

        await loadCertificates();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD STUDENT
   ========================================================================== */

async function loadStudent(){

    try{

        const snapshot =

            await getDoc(

                doc(

                    db,

                    "students",

                    studentId

                )

            );

        if(

            !snapshot.exists()

        ){

            showToast(

                "Student not found.",

                "error"

            );

            return;

        }

        student =

            snapshot.data();

        studentPhoto.src =

            student.photo ||

            "../assets/images/default-avatar.png";

        studentName.textContent =

            student.name || "-";

        studentEmail.textContent =

            student.email || "-";

        studentMobile.textContent =

            student.mobile || "-";

        studentStatus.textContent =

            student.status || "Active";

        if(student.createdAt){

            registeredDate.textContent =

                student.createdAt

                .toDate()

                .toLocaleDateString();

        }

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to load student.",

            "error"

        );

    }

}

/* ==========================================================================
   LOAD PURCHASED COURSES
   ========================================================================== */

async function loadCourses(){

    try{

        const snapshot =

            await getDocs(

                query(

                    collection(

                        db,

                        "enrollments"

                    ),

                    where(

                        "studentId",

                        "==",

                        studentId

                    ),

                    where(

                        "approvalStatus",

                        "==",

                        "Approved"

                    )

                )

            );

        let totalCourses = 0;

        let completedCourses = 0;

        courseList.innerHTML = "";

        snapshot.forEach(document=>{

            const course = document.data();

            totalCourses++;

            const progress =

                Number(

                    course.progress || 0

                );

            if(progress >= 100){

                completedCourses++;

            }

            courseList.innerHTML += `

            <div class="list-item">

                <div>

                    <strong>

                        ${course.courseName}

                    </strong>

                    <span>

                        Progress : ${progress}%

                    </span>

                </div>

                <div class="progress">

                    <div

                        style="width:${progress}%">

                    </div>

                </div>

            </div>

            `;

        });

        if(totalCourses===0){

            courseList.innerHTML =

            `

            <div class="empty-state">

                No purchased courses.

            </div>

            `;

        }

        courseCount.textContent =

            totalCourses;

        completedCount.textContent =

            completedCourses;

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================================================================
   LOAD PAYMENTS
   ========================================================================== */

async function loadPayments(){

    try{

        const snapshot =

            await getDocs(

                query(

                    collection(

                        db,

                        "payments"

                    ),

                    where(

                        "studentId",

                        "==",

                        studentId

                    )

                )

            );

        paymentList.innerHTML = "";

        snapshot.forEach(document=>{

            const payment =

                document.data();

            paymentList.innerHTML += `

            <div class="list-item">

                <div>

                    <strong>

                        ${payment.courseName}

                    </strong>

                    <span>

                        ${payment.paymentMethod}

                    </span>

                </div>

                <strong>

                    ${payment.currency}

                    ${payment.amount}

                </strong>

            </div>

            `;

        });

        if(snapshot.empty){

            paymentList.innerHTML =

            `

            <div class="empty-state">

                No payment history.

            </div>

            `;

        }

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================================================================
   LOAD CERTIFICATES
   ========================================================================== */

async function loadCertificates(){

    try{

        const snapshot =

            await getDocs(

                query(

                    collection(

                        db,

                        "certificates"

                    ),

                    where(

                        "studentId",

                        "==",

                        studentId

                    )

                )

            );

        let totalCertificates = 0;

        certificateList.innerHTML = "";

        snapshot.forEach(document=>{

            const certificate =

                document.data();

            totalCertificates++;

            certificateList.innerHTML += `

            <div class="list-item">

                <div>

                    <strong>

                        ${certificate.courseName}

                    </strong>

                    <span>

                        Completed

                    </span>

                </div>

                <a

                    href="${certificate.fileUrl}"

                    target="_blank"

                    class="btn btn-primary">

                    View

                </a>

            </div>

            `;

        });

        if(snapshot.empty){

            certificateList.innerHTML =

            `

            <div class="empty-state">

                No certificates.

            </div>

            `;

        }

        certificateCount.textContent =

            totalCertificates;

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================================================================
   WHATSAPP
   ========================================================================== */

whatsappBtn.addEventListener(

    "click",

    ()=>{

        if(!student || !student.mobile){

            showToast(

                "Mobile number not available.",

                "error"

            );

            return;

        }

        const number =

            student.mobile

            .replace(/\D/g,"");

        window.open(

            `https://wa.me/${number}`,

            "_blank"

        );

    }

);

/* ==========================================================================
   EMAIL
   ========================================================================== */

emailBtn.addEventListener(

    "click",

    ()=>{

        if(!student || !student.email){

            showToast(

                "Email address not available.",

                "error"

            );

            return;

        }

        location.href =

            `mailto:${student.email}`;

    }

);

/* ==========================================================================
   DISABLE / ENABLE STUDENT
   ========================================================================== */

disableBtn.addEventListener(

    "click",

    async ()=>{

        if(!student){

            return;

        }

        const newStatus =

            student.status === "Disabled"

            ? "Active"

            : "Disabled";

        const message =

            newStatus === "Disabled"

            ?

            "Disable this student?"

            :

            "Enable this student?";

        if(!confirm(message)){

            return;

        }

        showLoader();

        try{

            await updateDoc(

                doc(

                    db,

                    "students",

                    studentId

                ),

                {

                    status:newStatus

                }

            );

            student.status =

                newStatus;

            studentStatus.textContent =

                newStatus;

            disableBtn.innerHTML =

                newStatus === "Disabled"

                ?

                `<i class="fa-solid fa-user-check"></i> Enable Student`

                :

                `<i class="fa-solid fa-user-slash"></i> Disable Student`;

            showToast(

                `Student ${newStatus.toLowerCase()} successfully.`

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