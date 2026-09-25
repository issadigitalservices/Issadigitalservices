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


        /* ==================================================================
           FINAL EXAM
        ================================================================== */

        if (exam.type === "final") {

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


            if (!certificateSnapshot.empty) {

                continueBtn.textContent =
                    "View Certificate";

                continueBtn.href =
                    `certificate-view.html?courseId=${exam.courseId}`;

                continueBtn.classList.remove(
                    "hidden"
                );

            }

            else {

                continueBtn.textContent =
                    "Certificate Pending";

                continueBtn.removeAttribute(
                    "href"
                );

                continueBtn.classList.remove(
                    "hidden"
                );

                continueBtn.classList.add(
                    "certificate-pending"
                );

                resultMessage.textContent =
                    "You have successfully passed the Final Exam. Your certificate is pending admin approval.";

                const whatsappAdminBtn =
                    document.getElementById(
                        "whatsappAdminBtn"
                    );

                if (whatsappAdminBtn) {

                    whatsappAdminBtn.classList.remove(
                        "hidden"
                    );

                }

            }


            /*
             * Final Exam:
             * Review button is not required here.
             */

            reviewBtn.classList.add(
                "hidden"
            );

        }


        /* ==================================================================
           MODULE EXAM
        ================================================================== */

        else {

            continueBtn.textContent =
                "Continue Learning";

            continueBtn.href =
                `course.html?id=${exam.courseId}`;

            continueBtn.classList.remove(
                "hidden"
            );


            /* ==============================================================
               MODULE UNLOCK MESSAGE
            ============================================================== */

            if (exam.type === "module") {

                const message =
                    document.createElement(
                        "p"
                    );

                message.className =
                    "unlock-message";

                message.textContent =
                    "Congratulations! The next module has been unlocked.";

                const actions =
                    document.querySelector(
                        ".actions"
                    );

                if (actions) {

                    actions.after(
                        message
                    );

                }

            }


            /* ==============================================================
               VIEW MY ANSWERS
            ============================================================== */

            reviewBtn.textContent =
                "View My Answers";

            reviewBtn.classList.remove(
                "hidden"
            );


            reviewBtn.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    await showAnswerReview(
                        studentId,
                        true
                    );

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

/* ==========================================================================
   SHOW ANSWER REVIEW
========================================================================== */

async function showAnswerReview(
    studentId,
    showCorrectAnswers
) {

    reviewSection.classList.remove(
        "hidden"
    );

    reviewContainer.innerHTML = `
        <div class="review-placeholder">
            Loading your answers...
        </div>
    `;

    try {

        /*
         * Find the submitted attempt
         * for this student and exam.
         */

        const attemptSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "examAttempts"
                    ),

                    where(
                        "studentId",
                        "==",
                        studentId
                    ),

                    where(
                        "examId",
                        "==",
                        examId
                    ),

                    where(
                        "submittedAt",
                        "!=",
                        null
                    )
                )
            );


        if (attemptSnapshot.empty) {

            reviewContainer.innerHTML = `
                <div class="review-placeholder">
                    <p>
                        Your submitted answers could not be found.
                    </p>
                </div>
            `;

            return;

        }


        /*
         * Use the latest submitted attempt.
         */

        const attempts =
            attemptSnapshot.docs
                .map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                }))
                .sort(
                    (a, b) => {

                        const dateA =
                            a.submittedAt?.toMillis
                                ? a.submittedAt.toMillis()
                                : 0;

                        const dateB =
                            b.submittedAt?.toMillis
                                ? b.submittedAt.toMillis()
                                : 0;

                        return dateB - dateA;

                    }
                );


        const attempt =
            attempts[0];


        const studentAnswers =
            attempt.answers || {};


        /*
         * Load exam questions.
         */

        const questionsSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "examQuestions"
                    ),

                    where(
                        "examId",
                        "==",
                        examId
                    )
                )
            );


        if (questionsSnapshot.empty) {

            reviewContainer.innerHTML = `
                <div class="review-placeholder">
                    <p>
                        No questions were found for this exam.
                    </p>
                </div>
            `;

            return;

        }


        const questions =
            questionsSnapshot.docs.map(
                docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                })
            );


        reviewContainer.innerHTML = "";


        questions.forEach(
            (question, index) => {

                const studentAnswer =
                    studentAnswers[
                        question.id
                    ] || "Not Answered";


                const getOptionText =
                    answer => {

                        if (
                            !answer ||
                            answer === "Not Answered"
                        ) {
                            return "Not Answered";
                        }

                        const optionKey =
                            `option${answer.toUpperCase()}`;

                        return question[
                            optionKey
                        ] || answer;

                    };


                const studentAnswerText =
                    getOptionText(
                        studentAnswer
                    );


                let reviewHTML = `

                    <div class="review-question">

                        <h3>
                            Question ${index + 1}
                        </h3>

                        <p class="review-question-text">
                            ${question.question}
                        </p>

                        <div class="review-answer">

                            <strong>
                                Your Answer:
                            </strong>

                            <span>
                                ${studentAnswerText}
                            </span>

                        </div>
                `;


                /*
                 * ONLY PASSED STUDENTS
                 * see correct answer/status.
                 */

                if (showCorrectAnswers) {

                    const correctAnswer =
                        question.correctAnswer;

                    const correctAnswerText =
                        getOptionText(
                            correctAnswer
                        );


                    const isCorrect =
                        studentAnswer ===
                        correctAnswer;


                    reviewHTML += `

                        <div class="review-answer">

                            <strong>
                                Correct Answer:
                            </strong>

                            <span>
                                ${correctAnswerText}
                            </span>

                        </div>


                        <div class="review-status">

                            ${
                                isCorrect
                                    ? "✅ Correct"
                                    : "❌ Wrong"
                            }

                        </div>

                    `;

                }


                reviewHTML += `

                    </div>

                `;


                reviewContainer.insertAdjacentHTML(
                    "beforeend",
                    reviewHTML
                );

            }
        );


        reviewSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

    catch (error) {

        console.error(
            "Answer review error:",
            error
        );

        reviewContainer.innerHTML = `
            <div class="review-placeholder">

                <p>
                    Unable to load your answers.
                    Please try again.
                </p>

            </div>
        `;

    }

}