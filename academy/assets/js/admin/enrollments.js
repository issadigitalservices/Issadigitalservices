"use strict";

/* ==========================================================================
   ISSA Academy
   Admin Enrollments
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
    doc,
    updateDoc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const table =
    document.getElementById("enrollmentTable");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

    /* ==========================================================================
   MODAL
========================================================================== */

const approveModal =
    document.getElementById("approveModal");

const modalStudentName =
    document.getElementById("modalStudentName");

const modalCourseName =
    document.getElementById("modalCourseName");

const confirmApprove =
    document.getElementById("confirmApprove");

const cancelApprove =
    document.getElementById("cancelApprove");

let selectedEnrollmentId = null;

/* ==========================================================================
   STATE
   ========================================================================== */

let enrollments = [];

let filtered = [];

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(

    auth,

    async user=>{

        if(!user){

            location.href="../student/login.html";

            return;

        }

        showLoader();

        await loadEnrollments();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD
   ========================================================================== */

async function loadEnrollments(){

    const snapshot =

        await getDocs(

            query(

                collection(

                    db,

                    "enrollments"

                ),

                orderBy(

                    "createdAt",

                    "desc"

                )

            )

        );

    enrollments=[];

    snapshot.forEach(docSnap=>{

        enrollments.push({

            id:docSnap.id,

            ...docSnap.data()

        });

    });

    filtered=[...enrollments];

    render();

}

/* ==========================================================================
   RENDER
   ========================================================================== */

function render(){

    table.innerHTML="";

    if(filtered.length===0){

        emptyState.classList.remove(

            "hidden"

        );

        return;

    }

    emptyState.classList.add(

        "hidden"

    );

    filtered.forEach(item=>{

        table.innerHTML += `

        <tr>

            <td>

                <div class="student-info">

                    <strong>

                        ${item.studentName}

                    </strong>

                    <small>

                        ${item.studentEmail}

                    </small>

                    <small>

                        ${item.studentMobile}

                    </small>

                </div>

            </td>

            <td>

                ${item.courseName}

            </td>

            <td>

                ${item.currency || "₹"} ${item.price || 999}

            </td>

            <td>

                ${item.paymentMethod}

            </td>

            <td>

                <span class="status ${item.approvalStatus.toLowerCase()}">

                    ${item.approvalStatus}

                </span>

            </td>

            <td>

    <div class="actions">

        <button

            class="btn-view"

            data-id="${item.id}">

            View

        </button>

        ${item.approvalStatus === "Pending" ? `

            <button

                class="btn-approve"

                data-id="${item.id}">

                Approve

            </button>

            <button

                class="btn-reject"

                data-id="${item.id}">

                Reject

            </button>

        ` : item.approvalStatus === "Approved" ? `

            <button

                class="btn-approved"

                disabled>

                <i class="fa-solid fa-circle-check"></i>

                Approved

            </button>

        ` : `

            <button

                class="btn-rejected"

                disabled>

                <i class="fa-solid fa-circle-xmark"></i>

                Rejected

            </button>

        `}

    </div>

</td>

        </tr>

        `;

    });

    bindEvents();

}

/* ==========================================================================
   EVENTS
   ========================================================================== */

function bindEvents(){

    document

        .querySelectorAll(

            ".btn-approve"

        )

        .forEach(button=>{

            button.addEventListener(

                "click",

                ()=>approve(

                    button.dataset.id

                )

            );

        });

    document

        .querySelectorAll(

            ".btn-reject"

        )

        .forEach(button=>{

            button.addEventListener(

                "click",

                ()=>reject(

                    button.dataset.id

                )

            );

        });

    document

        .querySelectorAll(

            ".btn-view"

        )

        .forEach(button=>{

            button.addEventListener(

                "click",

                ()=>{

                    location.href=

                    `student-details.html?id=${button.dataset.id}`;

                }

            );

        });

}

/* ==========================================================================
   APPROVE
   ========================================================================== */

async function approve(id){

    const enrollment = enrollments.find(
        item => item.id === id
    );

    selectedEnrollmentId = id;

    modalStudentName.textContent =
        enrollment.studentName;

    modalCourseName.textContent =
        enrollment.courseName;

    approveModal.classList.remove(
        "hidden"
    );

}

/* ==========================================================================
   REJECT
   ========================================================================== */

async function reject(id){

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

                id

            ),

            {

                approvalStatus:

                    "Rejected"

            }

        );

        showToast(

            "Enrollment Rejected."

        );

        await loadEnrollments();

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
   SEARCH
   ========================================================================== */

searchInput.addEventListener(

    "input",

    applyFilter

);

statusFilter.addEventListener(

    "change",

    applyFilter

);

function applyFilter(){

    const keyword =

        searchInput.value

        .trim()

        .toLowerCase();

    const status =

        statusFilter.value;

    filtered =

        enrollments.filter(item=>{

            const matchKeyword =

                item.studentName

                .toLowerCase()

                .includes(keyword)

                ||

                item.courseName

                .toLowerCase()

                .includes(keyword);

            const matchStatus =

                !status ||

                item.approvalStatus===status;

            return(

                matchKeyword &&

                matchStatus

            );

        });

    render();

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

    toast.className=

        `toast ${type}`;

    toast.textContent=

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
   APPROVE MODAL EVENTS
========================================================================== */

cancelApprove.addEventListener(

    "click",

    ()=>{

        approveModal.classList.add(
            "hidden"
        );

        selectedEnrollmentId = null;

    }

);

confirmApprove.addEventListener(

    "click",

    async ()=>{

        if(!selectedEnrollmentId){

            return;

        }

        approveModal.classList.add(
            "hidden"
        );

        showLoader();

        try{

            await updateDoc(

                doc(

                    db,

                    "enrollments",

                    selectedEnrollmentId

                ),

                {

                    approvalStatus:"Approved",

                    paymentStatus:"Paid",

                    accessGranted:true,

                    approvedBy:auth.currentUser.uid,

                    approvedAt:serverTimestamp()

                }

            );

            showToast(
                "Enrollment Approved."
            );

            selectedEnrollmentId = null;

            await loadEnrollments();

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
   END
   ========================================================================== */