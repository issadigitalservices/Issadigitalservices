"use strict";

/* ==========================================================================
   ISSA Academy
   Quiz Result
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

const quizId =
    params.get("id");

const score =
    Number(params.get("score"));

const total =
    Number(params.get("total"));

const percentage =
    Number(params.get("percentage"));

const passed =
    params.get("passed")==="true";

/* ==========================================================================
   DOM
   ========================================================================== */

const resultLoader =
    document.getElementById(
        "resultLoader"
    );

const resultCard =
    document.getElementById(
        "resultCard"
    );

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

    async user=>{

        if(!user){

            location.href="login.html";

            return;

        }

        await loadResult(user.uid);

    }

);

/* ==========================================================================
   LOAD RESULT
   ========================================================================== */

async function loadResult(studentId){

    scoreElement.textContent =
        `${score} / ${total}`;

    percentageElement.textContent =
        `${percentage}%`;

    const quizSnap =
        await getDoc(

            doc(

                db,

                "quizzes",

                quizId

            )

        );

    if(!quizSnap.exists()){

        return;

    }

    const quiz =
        quizSnap.data();

    if(passed){

        statusElement.textContent =
            "PASS";

        resultTitle.textContent =
            "Congratulations!";

        resultMessage.textContent =
            "You have successfully passed this Exam.";

        /* ================= FINAL EXAM ================= */

        if(quiz.type==="final"){

            continueBtn.textContent =
                "View Certificate";

            continueBtn.href =
                "certificates.html";

        }

        

        /* ================= MODULE QUIZ ================= */

        else{

            continueBtn.innerHTML =

`<i class="fa-solid fa-book-open"></i>

Continue Learning`;

continueBtn.href =
    `course.html?id=${quiz.courseId}`;

    /* ================= MODULE UNLOCK MESSAGE ================= */

if(quiz.type === "module"){

    const message = document.createElement("p");

    message.className = "unlock-message";

    message.innerHTML =

`<i class="fa-solid fa-lock-open"></i>

Congratulations! The next module has been unlocked.`;

    document
    .querySelector(".actions")
    .after(message);

}
reviewBtn.classList.add("hidden");
                reviewBtn.addEventListener(

    "click",

    async event=>{

        event.preventDefault();

        reviewSection.classList.remove(

            "hidden"

        );

        reviewContainer.innerHTML =

`<div class="lesson-card">

<h3>

Exam Review

</h3>

<p>

Question review will be available in the next update.

</p>

</div>`;

        reviewSection.scrollIntoView({

            behavior:"smooth"

        });

    }

);

        }

    }

    else{

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

        reviewBtn.classList.add(

    "hidden"

);

        retryBtn.href =
    `start-assessment.html?id=${quizId}`;

    }

        /* ================= SHOW RESULT ================= */

    resultLoader.classList.add(

        "hidden"

    );

    resultCard.classList.remove(

        "hidden"

    );

}

