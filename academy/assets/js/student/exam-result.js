"use strict";

/* ==========================================================================
   ISSA Academy
   Exam Result
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
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* ==========================================================================
   URL
========================================================================== */

const params =
    new URLSearchParams(location.search);

const examId =
    params.get("id");

const score =
    Number(params.get("score"));

const total =
    Number(params.get("total"));

const percentage =
    Number(params.get("percentage"));

const passed =
    params.get("passed") === "true";


/* ==========================================================================
   DOM
========================================================================== */

const resultLoader =
    document.getElementById("resultLoader");

const resultCard =
    document.getElementById("resultCard");

const resultIcon =
    document.getElementById("resultIcon");

const resultIconSymbol =
    document.getElementById("resultIconSymbol");

const resultTitle =
    document.getElementById("resultTitle");

const resultMessage =
    document.getElementById("resultMessage");

const scoreElement =
    document.getElementById("score");

const percentageElement =
    document.getElementById("percentage");

const statusElement =
    document.getElementById("status");

const continueBtn =
    document.getElementById("continueBtn");

const retryBtn =
    document.getElementById("retryBtn");

const reviewBtn =
    document.getElementById("reviewBtn");

const reviewSection =
    document.getElementById("reviewSection");

const reviewContainer =
    document.getElementById("reviewContainer");


/* ==========================================================================
   AUTH
========================================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            location.href = "login.html";

            return;

        }

        await loadResult(user.uid);

    }
);


/* ==========================================================================
   LOAD RESULT
========================================================================== */

async function loadResult(studentId) {

    scoreElement.textContent =
        `${score} / ${total}`;

    percentageElement.textContent =
        `${percentage}%`;


    /* ======================================================================
       LOAD EXAM
    ====================================================================== */

    const examSnap =
        await getDoc(
            doc(
                db,
                "exams",
                examId
            )
        );


    if (!examSnap.exists()) {

        resultLoader.classList.add("hidden");

        resultCard.classList.remove("hidden");

        resultTitle.textContent =
            "Exam Not Found";

        resultMessage.textContent =
            "We could not find this exam.";

        return;

    }


    const exam =
        examSnap.data();


    /* ======================================================================
       PASSED
    ====================================================================== */

    if (passed) {

        statusElement.textContent =
            "PASS";

        resultTitle.textContent =
            "Congratulations!";

        resultMessage.textContent =
            "You have successfully passed this Exam.";


        /* ================================================================
           FINAL EXAM
        ================================================================= */

        if (exam.type === "final") {

            /*
             * The Final Exam does NOT automatically issue a certificate.
             *
             * The certificate must be created by the admin.
             */

            const certificateSnapshot =
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
                        ),
                        where(
                            "courseId",
                            "==",
                            exam.courseId
                        )
                    )
                );


            /* ============================================================
               CERTIFICATE ALREADY ISSUED
            ============================================================ */

            if (!certificateSnapshot.empty) {

                continueBtn.textContent =
                    "View Certificate";

                continueBtn.href =
                    `certificate-view.html?courseId=${exam.courseId}`;

                continueBtn.classList.remove("hidden");

            }


            /* ============================================================
               CERTIFICATE NOT YET ISSUED
            ============================================================ */

            else {

                continueBtn.textContent =
                    "Certificate Pending";

                continueBtn.removeAttribute("href");

                continueBtn.classList.remove("hidden");

                continueBtn.classList.add(
                    "certificate-pending"
                );

                resultMessage.textContent =
                    "You have successfully passed the Final Exam. Your certificate is pending admin approval.";

                    // Show WhatsApp Contact Admin button ONLY for passed Final Exam without certificate
                const whatsappAdminBtn = 
                    document.getElementById("whatsappAdminBtn");

                if (whatsappAdminBtn) {
                    whatsappAdminBtn.classList.remove("hidden");
                }
            }


            /*
             * Final Exam does not need a Review button here.
             */

            reviewBtn.classList.add("hidden");

        }


        /* ================================================================
           MODULE EXAM
        ================================================================= */

        else {

            continueBtn.textContent =
                "Continue Learning";

            continueBtn.href =
                `course.html?id=${exam.courseId}`;

            continueBtn.classList.remove("hidden");


            /* ============================================================
               MODULE UNLOCK MESSAGE
            ============================================================ */

            if (exam.type === "module") {

                const message =
                    document.createElement("p");

                message.className =
                    "unlock-message";

                message.textContent =
                    "Congratulations! The next module has been unlocked.";

                const actions =
                    document.querySelector(".actions");

                if (actions) {

                    actions.after(message);

                }

            }


            /* ============================================================
               REVIEW BUTTON
            ============================================================ */

            reviewBtn.classList.add("hidden");

            reviewBtn.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    reviewSection.classList.remove(
                        "hidden"
                    );

                    reviewContainer.innerHTML = `
                        <div class="review-placeholder">
                            <h3>Exam Review</h3>
                            <p>
                                Question review will be available
                                in the next update.
                            </p>
                        </div>
                    `;

                    reviewSection.scrollIntoView({
                        behavior: "smooth"
                    });

                }
            );

        }

    }


    /* ======================================================================
       FAILED
    ====================================================================== */

    else {

        resultIcon.classList.add(
            "fail"
        );

        resultIconSymbol.className =
            "fa-solid fa-circle-xmark";

        statusElement.textContent =
            "FAIL";

        resultTitle.textContent =
            "Exam Failed";

        resultMessage.textContent =
            "Don't worry. Review the lessons and try again.";

        retryBtn.classList.remove(
            "hidden"
        );

        retryBtn.href =
            `start-assessment.html?id=${examId}`;

        reviewBtn.classList.add(
            "hidden"
        );

    }


    /* ======================================================================
       SHOW RESULT
    ====================================================================== */

    resultLoader.classList.add(
        "hidden"
    );

    resultCard.classList.remove(
        "hidden"
    );

}