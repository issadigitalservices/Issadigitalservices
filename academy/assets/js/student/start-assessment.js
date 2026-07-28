"use strict";

/* ==========================================================================
   ISSA Academy
   Start Exam
   ========================================================================== */

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const examId =
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
   START Exam
   ========================================================================== */

agreeBtn.addEventListener(

    "click",

    ()=>{

        if(!examId){

            alert(

                "Exam not found."

            );

            return;

        }

        location.href =

            `exam.html?id=${examId}`;

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