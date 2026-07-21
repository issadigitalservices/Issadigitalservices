"use strict";

/* ==========================================================================
   ISSA Academy
   Quiz Management
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

const quizGrid =
    document.getElementById("quizGrid");

const searchInput =
    document.getElementById("searchInput");

const courseFilter =
    document.getElementById("courseFilter");

const typeFilter =
    document.getElementById("typeFilter");

const statusFilter =
    document.getElementById("statusFilter");

const emptyState =
    document.getElementById("emptyState");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

const template =
    document.getElementById("quizCardTemplate");

/* ==========================================================================
   STATE
   ========================================================================== */

let quizzes = [];

let filteredQuizzes = [];

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(

    auth,

    async user=>{

        if(!user){

            location.replace("../student/login.html");

            return;

        }

        showLoader();

        await loadQuizzes();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD QUIZZES
   ========================================================================== */

async function loadQuizzes(){

    try{

        const snapshot = await getDocs(

            query(

                collection(db,"quizzes"),

                orderBy("createdAt","desc")

            )

        );

        quizzes = [];

        snapshot.forEach(docSnap=>{

            quizzes.push({

                id:docSnap.id,

                ...docSnap.data()

            });

        });

        filteredQuizzes = [...quizzes];

        loadCourseFilter();

        renderQuizzes();

    }

    catch(error){

        console.error(error);

        showToast(

            error.message,

            "error"

        );

    }

}

/* ==========================================================================
   COURSE FILTER
   ========================================================================== */

function loadCourseFilter(){

    const courses = [...new Set(

        quizzes.map(item=>item.courseName)

    )];

    courseFilter.innerHTML =

        `<option value="all">All Courses</option>`;

    courses.forEach(course=>{

        if(!course){

            return;

        }

        courseFilter.innerHTML += `

<option value="${course}">

${course}

</option>

`;

    });

}

/* ==========================================================================
   RENDER QUIZZES
   ========================================================================== */

function renderQuizzes(){

    quizGrid.innerHTML = "";

    if(filteredQuizzes.length===0){

        emptyState.classList.remove(

            "hidden"

        );

        return;

    }

    emptyState.classList.add(

        "hidden"

    );

    filteredQuizzes.forEach(quiz=>{

        const clone =

            template.content

            .cloneNode(true);

        clone.querySelector(

            ".quiz-title"

        ).textContent =

            quiz.title || "-";

        clone.querySelector(

            ".quiz-course"

        ).textContent =

            quiz.courseName || "-";

        clone.querySelector(

            ".quiz-module"

        ).textContent =

            quiz.moduleName || "-";

        clone.querySelector(

            ".quiz-type"

        ).textContent =

            quiz.type==="final"

            ?

            "Final Exam"

            :

            "Module Quiz";

        clone.querySelector(

            ".quiz-duration"

        ).textContent =

            `${quiz.duration || 30} Minutes`;

        clone.querySelector(

            ".quiz-questions"

        ).textContent =

            `${quiz.totalQuestions || 0} Questions`;

        clone.querySelector(

            ".quiz-passmark"

        ).textContent =

            `${quiz.passMark || 70}%`;

        const status =

            clone.querySelector(

                ".quiz-status"

            );

        status.textContent =

            quiz.status || "Draft";

        status.classList.add(

            (quiz.status || "draft")

            .toLowerCase()

        );

        clone.querySelector(

            ".btn-edit"

        ).onclick = ()=>{

            location.href =

            `quiz-form.html?id=${quiz.id}`;

        };

        clone.querySelector(

            ".btn-questions"

        ).onclick = ()=>{

            location.href =

            `quiz-questions.html?id=${quiz.id}`;

        };

        clone.querySelector(

            ".btn-delete"

        ).onclick = ()=>{

            deleteQuiz(

                quiz.id

            );

        };

        quizGrid.appendChild(

            clone

        );

    });

}

/* ==========================================================================
   FILTERS
   ========================================================================== */

searchInput.addEventListener(

    "input",

    filterQuizzes

);

courseFilter.addEventListener(

    "change",

    filterQuizzes

);

typeFilter.addEventListener(

    "change",

    filterQuizzes

);

statusFilter.addEventListener(

    "change",

    filterQuizzes

);

function filterQuizzes(){

    const keyword =

        searchInput.value

        .trim()

        .toLowerCase();

    filteredQuizzes =

        quizzes.filter(item=>{

            const matchKeyword =

                (item.title || "")

                .toLowerCase()

                .includes(keyword);

            const matchCourse =

                courseFilter.value==="all"

                ||

                item.courseName===courseFilter.value;

            const matchType =

                typeFilter.value==="all"

                ||

                item.type===typeFilter.value;

            const matchStatus =

                statusFilter.value==="all"

                ||

                item.status===statusFilter.value;

            return(

                matchKeyword

                &&

                matchCourse

                &&

                matchType

                &&

                matchStatus

            );

        });

    renderQuizzes();

}

/* ==========================================================================
   DELETE QUIZ
   ========================================================================== */

async function deleteQuiz(id){

    if(

        !confirm(

            "Delete this quiz?"

        )

    ){

        return;

    }

    showLoader();

    try{

        await deleteDoc(

            doc(

                db,

                "quizzes",

                id

            )

        );

        showToast(

            "Quiz deleted successfully."

        );

        await loadQuizzes();

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

    pageLoader.classList.remove(

        "hidden"

    );

}

function hideLoader(){

    pageLoader.classList.add(

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