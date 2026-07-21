"use strict";

/* ==========================================================================
   ISSA Academy
   Certificates
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
    deleteDoc,
    doc

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const certificateTable =
    document.getElementById("certificateTable");

const totalCertificates =
    document.getElementById("totalCertificates");

const completedStudents =
    document.getElementById("completedStudents");

const searchInput =
    document.getElementById("searchInput");

const emptyState =
    document.getElementById("emptyState");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   STATE
   ========================================================================== */

let certificates = [];

let filteredCertificates = [];

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

        await loadCertificates();

        hideLoader();

    }

);

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

                    orderBy(

                        "issuedAt",

                        "desc"

                    )

                )

            );

        certificates=[];

        snapshot.forEach(document=>{

            certificates.push({

                id:document.id,

                ...document.data()

            });

        });

        filteredCertificates=[

            ...certificates

        ];

        renderCertificates();

        updateStatistics();

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to load certificates.",

            "error"

        );

    }

}

/* ==========================================================================
   RENDER CERTIFICATES
   ========================================================================== */

function renderCertificates(){

    certificateTable.innerHTML = "";

    if(filteredCertificates.length === 0){

        emptyState.classList.remove(

            "hidden"

        );

        return;

    }

    emptyState.classList.add(

        "hidden"

    );

    filteredCertificates.forEach(certificate=>{

        const issuedDate =

            certificate.issuedAt

            ?

            certificate.issuedAt

                .toDate()

                .toLocaleDateString()

            :

            "-";

        certificateTable.innerHTML += `

        <tr>

            <td>

                <div class="student-info">

                    <strong>

                        ${certificate.studentName || "-"}

                    </strong>

                    <span>

                        ${certificate.studentEmail || ""}

                    </span>

                </div>

            </td>

            <td>

                ${certificate.courseName || "-"}

            </td>

            <td>

                ${certificate.certificateNumber || "-"}

            </td>

            <td>

                ${issuedDate}

            </td>

            <td>

                <div class="action-group">

                    <a

                        href="${certificate.fileUrl || "#"}"

                        target="_blank"

                        class="btn btn-primary">

                        <i class="fa-solid fa-eye"></i>

                        View

                    </a>

                    <a

                        href="${certificate.fileUrl || "#"}"

                        download

                        class="btn btn-success">

                        <i class="fa-solid fa-download"></i>

                        Download

                    </a>

                    <button

                        class="btn btn-danger btn-delete"

                        data-id="${certificate.id}">

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>

                </div>

            </td>

        </tr>

        `;

    });

    bindEvents();

}

/* ==========================================================================
   DASHBOARD
   ========================================================================== */

function updateStatistics(){

    totalCertificates.textContent =

        certificates.length;

    const students =

        new Set();

    certificates.forEach(item=>{

        students.add(

            item.studentId

        );

    });

    completedStudents.textContent =

        students.size;

}

/* ==========================================================================
   SEARCH
   ========================================================================== */

searchInput.addEventListener(

    "input",

    ()=>{

        const keyword =

            searchInput.value

                .trim()

                .toLowerCase();

        filteredCertificates =

            certificates.filter(item=>{

                return(

                    (item.studentName || "")

                        .toLowerCase()

                        .includes(keyword)

                    ||

                    (item.studentEmail || "")

                        .toLowerCase()

                        .includes(keyword)

                    ||

                    (item.courseName || "")

                        .toLowerCase()

                        .includes(keyword)

                    ||

                    (item.certificateNumber || "")

                        .toLowerCase()

                        .includes(keyword)

                );

            });

        renderCertificates();

    }

);

/* ==========================================================================
   EVENTS
   ========================================================================== */

function bindEvents(){

    document

        .querySelectorAll(

            ".btn-delete"

        )

        .forEach(button=>{

            button.addEventListener(

                "click",

                ()=>deleteCertificate(

                    button.dataset.id

                )

            );

        });

}

/* ==========================================================================
   DELETE CERTIFICATE
   ========================================================================== */

async function deleteCertificate(id){

    if(

        !confirm(

            "Delete this certificate?"

        )

    ){

        return;

    }

    showLoader();

    try{

        await deleteDoc(

            doc(

                db,

                "certificates",

                id

            )

        );

        showToast(

            "Certificate deleted successfully."

        );

        await loadCertificates();

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
   END
   ========================================================================== */