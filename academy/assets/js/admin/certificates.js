"use strict";

/* ==========================================================================
   ISSA Academy
   Certificates
   Version : 2.0.0
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
    where,
    addDoc,
    serverTimestamp,
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

let pendingCertificates = [];

let filteredCertificates = [];

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(
    auth,

    async user => {

        if (!user) {

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
   LOAD CERTIFICATES + PENDING FINAL EXAMS
   ========================================================================== */

async function loadCertificates() {

    try {

        /* ==============================================================
           1. LOAD ISSUED CERTIFICATES
           ============================================================== */

        const certificateSnapshot =
            await getDocs(
                collection(
                    db,
                    "certificates"
                )
            );

        certificates = [];

        certificateSnapshot.forEach(
            documentSnapshot => {

                certificates.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data(),

                    recordType:
                        "certificate"

                });

            }
        );


        /* ==============================================================
           2. LOAD PASSED EXAM ATTEMPTS
           ============================================================== */

        const attemptsSnapshot =
            await getDocs(

                query(

                    collection(
                        db,
                        "examAttempts"
                    ),

                    where(
                        "passed",
                        "==",
                        true
                    )

                )

            );


        /* ==============================================================
           3. LOAD EXAMS
           ============================================================== */

        const examsSnapshot =
            await getDocs(
                collection(
                    db,
                    "exams"
                )
            );


        const examsMap = {};

        examsSnapshot.forEach(
            examDocument => {

                examsMap[
                    examDocument.id
                ] = {

                    id:
                        examDocument.id,

                    ...examDocument.data()

                };

            }
        );


        /* ==============================================================
           4. EXISTING CERTIFICATE LOOKUP
           ============================================================== */

        const issuedLookup =
            new Set();

        certificates.forEach(
            certificate => {

                if (
                    certificate.studentId &&
                    certificate.courseId
                ) {

                    issuedLookup.add(

                        `${certificate.studentId}_${certificate.courseId}`

                    );

                }

            }
        );


        /* ==============================================================
           5. BUILD PENDING FINAL EXAMS
           ============================================================== */

        pendingCertificates = [];


        for (
            const attemptDocument
            of attemptsSnapshot.docs
        ) {

            const attempt =
                attemptDocument.data();


            const exam =
                examsMap[attempt.examId];


            /* ----------------------------------------------------------
               Only Final Exams
               ---------------------------------------------------------- */

            if (
                !exam ||
                exam.type !== "final"
            ) {

                continue;

            }


            /* ----------------------------------------------------------
               Already issued?
               ---------------------------------------------------------- */

            const lookupKey =
                `${attempt.studentId}_${exam.courseId}`;


            if (
                issuedLookup.has(
                    lookupKey
                )
            ) {

                continue;

            }


            /* ----------------------------------------------------------
               Student Details
               ---------------------------------------------------------- */

            let student = {};

            try {

                const studentSnapshot =
                    await getDocs(

                        query(

                            collection(
                                db,
                                "students"
                            ),

                            where(
                                "__name__",
                                "==",
                                attempt.studentId
                            )

                        )

                    );

                if (
                    !studentSnapshot.empty
                ) {

                    student =
                        studentSnapshot.docs[0].data();

                }

            }

            catch (studentError) {

                console.error(
                    "Unable to load student:",
                    studentError
                );

            }


            /* ----------------------------------------------------------
               Add Pending Certificate
               ---------------------------------------------------------- */

            pendingCertificates.push({

                id:
                    attemptDocument.id,

                recordType:
                    "pending",

                studentId:
                    attempt.studentId,

                studentName:
                    student.fullName ||
                    student.name ||
                    student.studentName ||
                    "-",

                studentEmail:
                    student.email ||
                    "-",

                courseId:
                    exam.courseId,

                courseName:
                    exam.courseName ||
                    "-",

                examId:
                    attempt.examId,

                examTitle:
                    exam.title ||
                    "Final Exam",

                score:
                    attempt.score || 0,

                totalMarks:
                    attempt.totalMarks || 0,

                percentage:
                    attempt.percentage || 0,

                passed:
                    true

            });

        }


        /* ==============================================================
           6. COMBINE
           ============================================================== */

        filteredCertificates = [

            ...pendingCertificates,

            ...certificates

        ];


        renderCertificates();

        updateStatistics();

    }

    catch (error) {

        console.error(
            "Unable to load certificates:",
            error
        );

        showToast(
            "Unable to load certificates.",
            "error"
        );

    }

}

/* ==========================================================================
   RENDER
   ========================================================================== */

function renderCertificates() {

    if (!certificateTable) {
        return;
    }

    certificateTable.innerHTML = "";


    if (
        filteredCertificates.length === 0
    ) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    filteredCertificates.forEach(
        certificate => {

            /* ==========================================================
               PENDING CERTIFICATE
               ========================================================== */

            if (
                certificate.recordType ===
                "pending"
            ) {

                certificateTable.innerHTML += `

                <tr>

                    <td>

                        <div class="student-info">

                            <strong>
                                ${escapeHtml(
                                    certificate.studentName
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    certificate.studentEmail
                                )}
                            </span>

                        </div>

                    </td>

                    <td>
                        ${escapeHtml(
                            certificate.courseName
                        )}
                    </td>

                    <td>

                        <span
                            style="
                                color:#d97706;
                                font-weight:600;
                            "
                        >
                            Pending Approval
                        </span>

                    </td>

                    <td>

                        <strong>
                            ${certificate.percentage}%
                        </strong>

                        <small
                            style="
                                display:block;
                                color:#6b7280;
                            "
                        >
                            ${certificate.score}
                            /
                            ${certificate.totalMarks}
                        </small>

                    </td>

                    <td>

                        <div class="action-group">

                            <button
                                class="btn btn-success btn-issue"
                                data-id="${certificate.id}"
                            >

                                <i class="fa-solid fa-award"></i>

                                Issue Certificate

                            </button>

                        </div>

                    </td>

                </tr>

                `;

                return;

            }


            /* ==========================================================
               ISSUED CERTIFICATE
               ========================================================== */

            const issuedDate =
                formatDate(
                    certificate.issueDate ||
                    certificate.issuedAt
                );


            certificateTable.innerHTML += `

            <tr>

                <td>

                    <div class="student-info">

                        <strong>
                            ${escapeHtml(
                                certificate.studentName ||
                                "-"
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                certificate.studentEmail ||
                                ""
                            )}
                        </span>

                    </div>

                </td>

                <td>
                    ${escapeHtml(
                        certificate.courseName ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        certificate.certificateNumber ||
                        "-"
                    )}
                </td>

                <td>
                    ${issuedDate}
                </td>

                <td>

                    <div class="action-group">

                        <a
                            href="javascript:void(0)"
                            class="btn btn-primary btn-view"
                            data-course-id="${certificate.courseId}"
                        >

                            <i class="fa-solid fa-eye"></i>

                            View

                        </a>

                        <button
                            class="btn btn-danger btn-delete"
                            data-id="${certificate.id}"
                        >

                            <i class="fa-solid fa-trash"></i>

                            Delete

                        </button>

                    </div>

                </td>

            </tr>

            `;

        }
    );


    bindEvents();

}

/* ==========================================================================
   STATISTICS
   ========================================================================== */

function updateStatistics() {

    if (totalCertificates) {

        totalCertificates.textContent =
            certificates.length;

    }


    const students =
        new Set();


    certificates.forEach(
        certificate => {

            if (
                certificate.studentId
            ) {

                students.add(
                    certificate.studentId
                );

            }

        }
    );


    if (completedStudents) {

        completedStudents.textContent =
            students.size;

    }

}

/* ==========================================================================
   SEARCH
   ========================================================================== */

if (searchInput) {

    searchInput.addEventListener(
        "input",

        () => {

            const keyword =
                searchInput.value
                    .trim()
                    .toLowerCase();


            filteredCertificates = [

                ...pendingCertificates,

                ...certificates

            ].filter(
                item => {

                    return (

                        (
                            item.studentName ||
                            ""
                        )
                            .toLowerCase()
                            .includes(keyword)

                        ||

                        (
                            item.studentEmail ||
                            ""
                        )
                            .toLowerCase()
                            .includes(keyword)

                        ||

                        (
                            item.courseName ||
                            ""
                        )
                            .toLowerCase()
                            .includes(keyword)

                        ||

                        (
                            item.certificateNumber ||
                            ""
                        )
                            .toLowerCase()
                            .includes(keyword)

                    );

                }
            );


            renderCertificates();

        }
    );

}

/* ==========================================================================
   EVENTS
   ========================================================================== */

function bindEvents() {


    /* ==============================================================
       ISSUE CERTIFICATE
       ============================================================== */

    document
        .querySelectorAll(
            ".btn-issue"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",

                    () => {

                        issueCertificate(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    /* ==============================================================
       DELETE CERTIFICATE
       ============================================================== */

    document
        .querySelectorAll(
            ".btn-delete"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",

                    () => {

                        deleteCertificate(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    /* ==============================================================
       VIEW CERTIFICATE
       ============================================================== */

    document
        .querySelectorAll(
            ".btn-view"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",

                    () => {

                        location.href =
                            `../student/certificate-view.html?courseId=${encodeURIComponent(
                                button.dataset.courseId
                            )}`;

                    }

                );

            }
        );

}

/* ==========================================================================
   ISSUE CERTIFICATE
   ========================================================================== */

async function issueCertificate(
    attemptId
) {

    const pending =
        pendingCertificates.find(
            item =>
                item.id === attemptId
        );


    if (!pending) {

        showToast(
            "Pending certificate not found.",
            "error"
        );

        return;

    }


    const confirmed =
        confirm(

            `Issue certificate to ${pending.studentName} for ${pending.courseName}?`

        );


    if (!confirmed) {

        return;

    }


    showLoader();


    try {

        /* ==========================================================
           DOUBLE-CHECK EXISTING CERTIFICATE
           ========================================================== */

        const existingSnapshot =
            await getDocs(

                query(

                    collection(
                        db,
                        "certificates"
                    ),

                    where(
                        "studentId",
                        "==",
                        pending.studentId
                    ),

                    where(
                        "courseId",
                        "==",
                        pending.courseId
                    )

                )

            );


        if (
            !existingSnapshot.empty
        ) {

            showToast(
                "Certificate already exists.",
                "error"
            );

            await loadCertificates();

            return;

        }


        /* ==========================================================
           GENERATE CERTIFICATE NUMBER
           ========================================================== */

        const certificateNumber =
            "ISSA-" +
            Date.now();


        /* ==========================================================
           CREATE CERTIFICATE
           ========================================================== */

        await addDoc(

            collection(
                db,
                "certificates"
            ),

            {

                studentId:
                    pending.studentId,

                studentName:
                    pending.studentName,

                studentEmail:
                    pending.studentEmail,

                courseId:
                    pending.courseId,

                courseName:
                    pending.courseName,

                certificateNumber,

                issueDate:
                    serverTimestamp(),

                examId:
                    pending.examId,

                score:
                    pending.score,

                totalMarks:
                    pending.totalMarks,

                percentage:
                    pending.percentage,

                createdAt:
                    serverTimestamp()

            }

        );


        showToast(
            "Certificate issued successfully."
        );


        await loadCertificates();

    }

    catch (error) {

        console.error(
            "Certificate issue failed:",
            error
        );

        showToast(
            error.message ||
            "Failed to issue certificate.",
            "error"
        );

    }

    finally {

        hideLoader();

    }

}

/* ==========================================================================
   DELETE CERTIFICATE
   ========================================================================== */

async function deleteCertificate(
    id
) {

    if (
        !confirm(
            "Delete this certificate?"
        )
    ) {

        return;

    }


    showLoader();


    try {

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

    catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

    finally {

        hideLoader();

    }

}

/* ==========================================================================
   DATE FORMAT
   ========================================================================== */

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    let date;


    try {

        if (
            typeof value.toDate ===
            "function"
        ) {

            date =
                value.toDate();

        }

        else if (
            value instanceof Date
        ) {

            date = value;

        }

        else {

            date =
                new Date(value);

        }


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";

        }


        return date.toLocaleDateString(
            "en-GB",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"

            }
        );

    }

    catch {

        return "-";

    }

}

/* ==========================================================================
   HTML ESCAPE
   ========================================================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader() {

    if (loader) {

        loader.classList.remove(
            "hidden"
        );

    }

}

function hideLoader() {

    if (loader) {

        loader.classList.add(
            "hidden"
        );

    }

}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(
    message,
    type = "success"
) {

    if (!toastContainer) {

        alert(message);

        return;

    }


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


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3000
    );

}

/* ==========================================================================
   END
   ========================================================================== */