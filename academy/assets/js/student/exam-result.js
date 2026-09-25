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

            reviewBtn.textContent = "View My Answers";

reviewBtn.classList.remove("hidden");

reviewBtn.addEventListener("click", async event => {
    event.preventDefault();

    await showAnswerReview(
        studentId,
        false
    );
});

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


    /* ================================================================
       VIEW MY ANSWERS
       Failed student can see ONLY:
       - Question
       - Their Answer

       Do NOT show:
       - Correct Answer
       - Correct/Wrong status
       - Explanation
    ================================================================= */

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
                false
            );

        }
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
            <p>Loading your answers...</p>
        </div>
    `;


    try {

        /* ================================================================
           LOAD LATEST SUBMITTED ATTEMPT
        ================================================================= */

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
                    )
                )
            );


        if (attemptSnapshot.empty) {

            reviewContainer.innerHTML = `
                <div class="review-placeholder">
                    <p>Your exam answers could not be found.</p>
                </div>
            `;

            return;

        }


        /* ================================================================
           GET LATEST ATTEMPT
        ================================================================= */

        const attempts =
            attemptSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(
                    attempt =>
                        attempt.submittedAt
                )
                .sort(
                    (a, b) => {

                        const aTime =
                            a.submittedAt?.toMillis?.() || 0;

                        const bTime =
                            b.submittedAt?.toMillis?.() || 0;

                        return bTime - aTime;

                    }
                );


        if (attempts.length === 0) {

            reviewContainer.innerHTML = `
                <div class="review-placeholder">
                    <p>Your submitted answers could not be found.</p>
                </div>
            `;

            return;

        }


        const attempt =
            attempts[0];


        const answers =
            attempt.answers || {};


        /* ================================================================
           LOAD QUESTIONS
        ================================================================= */

        const questionSnapshot =
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


        if (questionSnapshot.empty) {

            reviewContainer.innerHTML = `
                <div class="review-placeholder">
                    <p>No questions were found for this exam.</p>
                </div>
            `;

            return;

        }


        /* ================================================================
           BUILD REVIEW
        ================================================================= */

        let html = "";


        questionSnapshot.docs.forEach(
            (questionDoc, index) => {

                const question =
                    questionDoc.data();

                const questionId =
                    questionDoc.id;

                const studentAnswer =
                    answers[questionId] || "Not Answered";


                let studentAnswerText =
                    studentAnswer;


                /* ========================================================
                   CONVERT OPTION LETTER TO ACTUAL ANSWER
                ======================================================== */

                if (
                    studentAnswer === "A" &&
                    question.optionA
                ) {

                    studentAnswerText =
                        question.optionA;

                }

                else if (
                    studentAnswer === "B" &&
                    question.optionB
                ) {

                    studentAnswerText =
                        question.optionB;

                }

                else if (
                    studentAnswer === "C" &&
                    question.optionC
                ) {

                    studentAnswerText =
                        question.optionC;

                }

                else if (
                    studentAnswer === "D" &&
                    question.optionD
                ) {

                    studentAnswerText =
                        question.optionD;

                }


                /* ========================================================
                   PASSED STUDENT
                   Show:
                   - Question
                   - Your Answer
                   - Correct Answer
                   - Correct / Wrong

                   NO explanation
                ======================================================== */

                if (showCorrectAnswers) {

                    const correctAnswer =
                        question.correctAnswer || "";

                    let correctAnswerText =
                        correctAnswer;


                    if (
                        correctAnswer === "A" &&
                        question.optionA
                    ) {

                        correctAnswerText =
                            question.optionA;

                    }

                    else if (
                        correctAnswer === "B" &&
                        question.optionB
                    ) {

                        correctAnswerText =
                            question.optionB;

                    }

                    else if (
                        correctAnswer === "C" &&
                        question.optionC
                    ) {

                        correctAnswerText =
                            question.optionC;

                    }

                    else if (
                        correctAnswer === "D" &&
                        question.optionD
                    ) {

                        correctAnswerText =
                            question.optionD;

                    }


                    const isCorrect =
                        studentAnswer ===
                        correctAnswer;


                    html += `
                        <div class="review-item">

                            <h3>
                                Question ${index + 1}
                            </h3>

                            <p class="review-question">
                                ${question.question || ""}
                            </p>

                            <p>
                                <strong>Your Answer:</strong>
                                ${studentAnswerText}
                            </p>

                            <p>
                                <strong>Correct Answer:</strong>
                                ${correctAnswerText}
                            </p>

                            <p class="${
                                isCorrect
                                    ? "review-correct"
                                    : "review-wrong"
                            }">

                                ${
                                    isCorrect
                                        ? "✓ Correct"
                                        : "✗ Wrong"
                                }

                            </p>

                        </div>
                    `;

                }


                /* ========================================================
                   FAILED STUDENT
                   Show ONLY:
                   - Question
                   - Your Answer

                   NO correct answer
                   NO correct/wrong
                   NO explanation
                ======================================================== */

                else {

                    html += `
                        <div class="review-item">

                            <h3>
                                Question ${index + 1}
                            </h3>

                            <p class="review-question">
                                ${question.question || ""}
                            </p>

                            <p>
                                <strong>Your Answer:</strong>
                                ${studentAnswerText}
                            </p>

                        </div>
                    `;

                }

            }
        );


        reviewContainer.innerHTML =
            html;


        /* ================================================================
           SCROLL TO REVIEW
        ================================================================= */

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