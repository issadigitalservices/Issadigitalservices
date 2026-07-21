"use strict";

/* ==========================================================================
   ISSA Academy
   Admin Payments
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
    query,
    orderBy,
    where,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const paymentTable =
    document.getElementById("paymentTable");

const totalRevenue =
    document.getElementById("totalRevenue");

const verifiedPayments =
    document.getElementById("verifiedPayments");

const pendingPayments =
    document.getElementById("pendingPayments");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const emptyState =
    document.getElementById("emptyState");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   STATE
   ========================================================================== */

let payments = [];

let filteredPayments = [];

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

        await loadPayments();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD ENROLLMENTS
========================================================================== */

async function loadPayments(){

    try{

        const snapshot = await getDocs(

            query(

                collection(

                    db,

                    "enrollments"

                ),

                orderBy(

                    "enrolledAt",

                    "desc"

                )

            )

        );

        payments = [];

        snapshot.forEach(document=>{

            const data = document.data();

            payments.push({

                id:document.id,

                ...data,

                status:

                    data.approvalStatus || "Pending",

                amount:

                    data.coursePrice || 0,

                currency:

                    "₹"

            });

        });

        filteredPayments = [...payments];

        renderPayments();

        updateStatistics();

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to load enrollments.",

            "error"

        );

    }

}

/* ==========================================================================
   RENDER ENROLLMENTS
========================================================================== */

function renderPayments(){

    paymentTable.innerHTML = "";

    if(filteredPayments.length===0){

        emptyState.classList.remove(

            "hidden"

        );

        return;

    }

    emptyState.classList.add(

        "hidden"

    );

    filteredPayments.forEach(payment=>{

        paymentTable.innerHTML += `

<tr>

<td>

<div class="student-info">

<strong>

${payment.studentName || "-"}

</strong>

<small>

${payment.studentEmail || ""}

</small>

</div>

</td>

<td>

${payment.courseName || "-"}

</td>

<td>

${payment.currency}

${Number(payment.amount || 0).toFixed(2)}

</td>

<td>

${payment.paymentMethod || "WhatsApp"}

</td>

<td>

<span class="payment-status ${String(payment.approvalStatus || "Pending").toLowerCase()}">

${payment.approvalStatus || "Pending"}

</span>

</td>

<td>

<div class="action-group">

${payment.approvalStatus==="Pending"

?

`

<button

class="btn-verify"

data-id="${payment.id}">

Approve

</button>

<button

class="btn-delete"

data-id="${payment.id}">

Reject

</button>

`

:

payment.approvalStatus==="Approved"

?

`

<span class="badge-success">

<i class="fa-solid fa-circle-check"></i>

Approved

</span>

`

:

`

<span class="badge-danger">

<i class="fa-solid fa-circle-xmark"></i>

Rejected

</span>

`

}

</div>

</td>

</tr>

`;

    });

    bindPaymentEvents();

}

/* ==========================================================================
   DASHBOARD STATISTICS
========================================================================== */

function updateStatistics(){

    let revenue = 0;

    let approved = 0;

    let pending = 0;

    payments.forEach(payment=>{

        const amount = Number(payment.amount || 0);

        if(payment.approvalStatus === "Approved"){

            approved++;

            revenue += amount;

        }

        else if(payment.approvalStatus === "Pending"){

            pending++;

        }

    });

    totalRevenue.textContent =

        `₹ ${revenue.toFixed(2)}`;

    verifiedPayments.textContent =

        approved;

    pendingPayments.textContent =

        pending;

}

/* ==========================================================================
   SEARCH
   ========================================================================== */

searchInput.addEventListener(

    "input",

    applyFilters

);

/* ==========================================================================
   FILTER
   ========================================================================== */

statusFilter.addEventListener(

    "change",

    applyFilters

);

/* ==========================================================================
   APPLY FILTERS
   ========================================================================== */

function applyFilters(){

    const keyword =

        searchInput.value

            .trim()

            .toLowerCase();

    const status =

        statusFilter.value;

    filteredPayments =

        payments.filter(payment=>{

            const student =

                (payment.studentName || "")

                .toLowerCase();

            const email =

                (payment.studentEmail || "")

                .toLowerCase();

            const mobile =

                (payment.studentMobile || "")

                .toLowerCase();

            const course =

                (payment.courseName || "")

                .toLowerCase();

            const transaction =

                (payment.transactionNumber || "")

                .toLowerCase();

            const searchMatch =

                student.includes(keyword)

                ||

                email.includes(keyword)

                ||

                mobile.includes(keyword)

                ||

                course.includes(keyword)

                ||

                transaction.includes(keyword);

            const statusMatch =

                status === ""

                ||

                payment.status === status;

            return (

                searchMatch

                &&

                statusMatch

            );

        });

    renderPayments();

}

/* ==========================================================================
   RESET FILTERS
   ========================================================================== */

function resetFilters(){

    searchInput.value = "";

    statusFilter.value = "";

    filteredPayments = [...payments];

    renderPayments();

}

/* ==========================================================================
   BIND BUTTON EVENTS
   ========================================================================== */

function bindPaymentEvents(){

    document

        .querySelectorAll(

            ".btn-verify"

        )

        .forEach(button=>{

            button.addEventListener(

                "click",

                ()=>verifyPayment(

                    button.dataset.id

                )

            );

        });

    document

        .querySelectorAll(

            ".btn-edit"

        )

        .forEach(button=>{

            button.addEventListener(

                "click",

                ()=>{

                    location.href =

                        `edit-payment.html?id=${button.dataset.id}`;

                }

            );

        });

    document

        .querySelectorAll(

            ".btn-delete"

        )

        .forEach(button=>{

            button.addEventListener(

                "click",

                ()=>deletePayment(

                    button.dataset.id

                )

            );

        });

}

/* ==========================================================================
   APPROVE ENROLLMENT
========================================================================== */

async function verifyPayment(enrollmentId){

    if(

        !confirm(

            "Approve this enrollment?\n\nHave you verified the payment in WhatsApp?"

        )

    ){

        return;

    }

    showLoader();

    try{

        await updateDoc(

            doc(

                db,

                "enrollments",

                enrollmentId

            ),

            {

                approvalStatus : "Approved",

                paymentStatus : "Verified",

                accessGranted : true,

                approvedBy : auth.currentUser.uid,

                approvedAt : serverTimestamp()

            }

        );

        showToast(

            "Enrollment approved successfully."

        );

        await loadPayments();

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

        /* ==========================
           Update Payment
           ========================== */

        await updateDoc(

            doc(

                db,

                "payments",

                paymentId

            ),

            {

                status:

                    "Verified",

                verifiedAt:

                    serverTimestamp()

            }

        );

        /* ==========================
           Update Enrollment
           ========================== */

        const enrollmentSnapshot =

            await getDocs(

                query(

                    collection(

                        db,

                        "enrollments"

                    ),

                    where(

                        "studentId",

                        "==",

                        payment.studentId

                    ),

                    where(

                        "courseId",

                        "==",

                        payment.courseId

                    )

                )

            );

        if(

            !enrollmentSnapshot.empty

        ){

            const enrollmentId =

                enrollmentSnapshot.docs[0].id;

            await updateDoc(

                doc(

                    db,

                    "enrollments",

                    enrollmentId

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

        }

        showToast(

            "Payment verified successfully."

        );

        await loadPayments();

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

/* ==========================================================================
   REJECT ENROLLMENT
========================================================================== */

async function deletePayment(enrollmentId){

    if(

        !confirm(

            "Reject this enrollment?"

        )

    ){

        return;

    }

    showLoader();

    try{

        await updateDoc(

            doc(

                db,

                "enrollments",

                enrollmentId

            ),

            {

                approvalStatus : "Rejected",

                paymentStatus : "Rejected",

                rejectedBy : auth.currentUser.uid,

                rejectedAt : serverTimestamp()

            }

        );

        showToast(

            "Enrollment rejected."

        );

        await loadPayments();

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
   INITIALIZE
   ========================================================================== */

window.addEventListener(

    "pageshow",

    ()=>{

        if(searchInput){

            searchInput.value="";

        }

        if(statusFilter){

            statusFilter.value="";

        }

    }

);

/* ==========================================================================
   END OF FILE
   ========================================================================== */