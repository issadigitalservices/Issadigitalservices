"use strict";

/* ==========================================================================
   ISSA Academy
   Start Assessment
   ========================================================================== */

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const quizId =
    params.get("id");

const courseId =
    params.get("courseId");

const lessonId =
    params.get("lessonId");

/* ==========================================================================
   DOM
   ========================================================================== */

const agreeCheckbox =
    document.getElementById("agreeCheckbox");

const agreeBtn =
    document.getElementById("agreeBtn");

const disagreeBtn =
    document.getElementById("disagreeBtn");

/* ==========================================================================
   ENABLE BUTTON
   ========================================================================== */

agreeCheckbox.addEventListener(

    "change",

    ()=>{

        agreeBtn.disabled =

            !agreeCheckbox.checked;

    }

);

/* ==========================================================================
   START QUIZ
   ========================================================================== */

agreeBtn.addEventListener(

    "click",

    ()=>{

        if(!quizId){

            alert(

                "Quiz not found."

            );

            return;

        }

        location.href =

            `quiz.html?id=${quizId}`;

    }

);

/* ==========================================================================
   GO BACK
   ========================================================================== */

disagreeBtn.addEventListener(

    "click",

    ()=>{

        if(courseId){

            location.href =

                `course.html?id=${courseId}`;

        }

        else{

            history.back();

        }

    }

);