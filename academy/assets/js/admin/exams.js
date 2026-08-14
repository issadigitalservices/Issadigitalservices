"use strict";

/* ==========================================================================
   ISSA Academy
   Exam Management
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

const examGrid =
    document.getElementById("examGrid");

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
    document.getElementById("examCardTemplate");

/* ==========================================================================
   STATE
   ========================================================================== */

let exams = [];

let filteredExams = [];

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

        await loadExams();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD EXAMS
   ========================================================================== */

async function loadExams(){

    try{

        const snapshot = await getDocs(

            query(

                collection(db,"exams"),

                orderBy("createdAt","desc")

            )

        );

        exams = [];

        snapshot.forEach(docSnap=>{

            exams.push({

                id:docSnap.id,

                ...docSnap.data()

            });

        });

        filteredExams = [...exams];

        loadCourseFilter();

        renderExams();

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

        exams.map(item=>item.courseName)

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
   RENDER EXAMS
   ========================================================================== */

function renderExams(){

    examGrid.innerHTML = "";

    if(filteredExams.length===0){

        emptyState.classList.remove(

            "hidden"

        );

        return;

    }

    emptyState.classList.add(

        "hidden"

    );

    filteredExams.forEach(exam=>{

        const clone =

            template.content

            .cloneNode(true);

        clone.querySelector(

            ".exam-title"

        ).textContent =

            exam.title || "-";

        clone.querySelector(

            ".exam-course"

        ).textContent =

            exam.courseName || "-";

        clone.querySelector(

            ".exam-module"

        ).textContent =

            exam.moduleName || "-";

        clone.querySelector(

            ".exam-type"

        ).textContent =

            exam.type==="final"

            ?

            "Final Exam"

            :

            "Module Exam";

        clone.querySelector(

            ".exam-duration"

        ).textContent =

            `${exam.duration || 30} Minutes`;

        clone.querySelector(

            ".exam-questions"

        ).textContent =

            `${exam.totalQuestions || 0} Questions`;

        clone.querySelector(

            ".exam-passmark"

        ).textContent =

            `${exam.passMark || 70}%`;

        

        clone.querySelector(

            ".btn-edit"

        ).onclick = ()=>{

            location.href =

            `exam-form.html?id=${exam.id}`;

        };

        clone.querySelector(

            ".btn-questions"

        ).onclick = ()=>{

            location.href =

            `exam-questions.html?id=${exam.id}`;

        };

        clone.querySelector(

            ".btn-delete"

        ).onclick = ()=>{

            deleteExam(

                exam.id

            );

        };

        examGrid.appendChild(

            clone

        );

    });

}

/* ==========================================================================
   FILTERS
   ========================================================================== */

if (searchInput) {
    searchInput.addEventListener("input", filterExams);
}

if (courseFilter) {
    courseFilter.addEventListener("change", filterExams);
}

if (typeFilter) {
    typeFilter.addEventListener("change", filterExams);
}

// Safely handle status filter if it exists
if (statusFilter) {
    statusFilter.addEventListener("change", filterExams);
}

function filterExams(){

    const keyword =

        searchInput.value

        .trim()

        .toLowerCase();

    filteredExams =

        exams.filter(item=>{

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

    renderExams();

}

/* ==========================================================================
   DELETE EXAM
   ========================================================================== */

async function deleteExam(id){

    if(

        !confirm(

            "Delete this Exam?"

        )

    ){

        return;

    }

    showLoader();

    try{

        await deleteDoc(

            doc(

                db,

                "exams",

                id

            )

        );

        showToast(

            "Exam deleted successfully."

        );

        await loadExams();

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