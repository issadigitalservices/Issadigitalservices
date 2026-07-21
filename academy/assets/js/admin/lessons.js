"use strict";

/* ==========================================================================
   ISSA Academy
   Lessons Controller
   ========================================================================== */

import {

    db

} from "../core/firebase-config.js";

import {

    requireAdmin

} from "../core/auth-guard.js";

import {

    collection,
    getDocs,
    query,
    orderBy,
    where,
    deleteDoc,
    updateDoc,
    doc

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   AUTH
   ========================================================================== */

await requireAdmin();

/* ==========================================================================
   DOM
   ========================================================================== */

const grid =
    document.getElementById("lessonsGrid");

const template =
    document.getElementById("lessonCardTemplate");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const courseFilter =
    document.getElementById("courseFilter");

const moduleFilter =
    document.getElementById("moduleFilter");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   STATE
   ========================================================================== */

const state={

    lessons:[],

    filtered:[],

    courses:{},

    modules:{}

};

/* ==========================================================================
   INIT
   ========================================================================== */

init();

async function init(){

    showLoader();

    await loadCourses();

    await loadModules();

    await loadLessons();

    hideLoader();

}

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadCourses(){

    const snapshot =

        await getDocs(

            query(

                collection(

                    db,

                    "courses"

                ),

                orderBy(

                    "title"

                )

            )

        );

    courseFilter.innerHTML =

        `<option value="">All Courses</option>`;

    snapshot.forEach(docSnap=>{

        const course =

            docSnap.data();

        state.courses[docSnap.id] =

            course.title;

        courseFilter.innerHTML += `

            <option value="${docSnap.id}">

                ${course.title}

            </option>

        `;

    });

}

/* ==========================================================================
   LOAD MODULES
   ========================================================================== */

async function loadModules(){

    const snapshot =

        await getDocs(

            query(

                collection(

                    db,

                    "modules"

                ),

                orderBy(

                    "order"

                )

            )

        );

    moduleFilter.innerHTML =

        `<option value="">All Modules</option>`;

    snapshot.forEach(docSnap=>{

        const module =

            docSnap.data();

        state.modules[docSnap.id] =

            module.title;

        moduleFilter.innerHTML += `

            <option value="${docSnap.id}">

                ${module.title}

            </option>

        `;

    });

}

/* ==========================================================================
   LOAD LESSONS
   ========================================================================== */

async function loadLessons(){

    state.lessons=[];

    const snapshot =

        await getDocs(

            query(

                collection(

                    db,

                    "lessons"

                ),

                orderBy(

                    "order"

                )

            )

        );

    snapshot.forEach(docSnap=>{

        state.lessons.push({

            id:docSnap.id,

            ...docSnap.data()

        });

    });

    state.filtered=[

        ...state.lessons

    ];

    renderLessons();

}

/* ==========================================================================
   RENDER
   ========================================================================== */

function renderLessons(){

    grid.innerHTML="";

    if(!state.filtered.length){

        emptyState.classList.remove(

            "hidden"

        );

        return;

    }

    emptyState.classList.add(

        "hidden"

    );

    state.filtered.forEach(lesson=>{

        const card =

            template.content.cloneNode(true);

        card.querySelector(".lesson-title").textContent =
    lesson.title;

card.querySelector(".lesson-module").innerHTML =
`
<strong>${lesson.courseTitle || "-"}</strong><br>
Module: ${state.modules[lesson.moduleId] || "-"}
`;

card.querySelector(".lesson-order").textContent =
    `Lesson ${lesson.order}`;

            /* ================= EDIT ================= */

        card.querySelector(

            ".btn-edit"

        ).addEventListener(

            "click",

            ()=>{

                location.href=

                `edit-lesson.html?id=${lesson.id}`;

            }

        );

        /* ================= DELETE ================= */

        card.querySelector(

            ".btn-delete"

        ).addEventListener(

            "click",

            ()=>{

                deleteLesson(

                    lesson.id

                );

            }

        );

        /* ================= STATUS ================= */

        

        grid.appendChild(card);

    });

}

/* ==========================================================================
   SEARCH
   ========================================================================== */

searchInput.addEventListener(

    "input",

    applyFilters

);

/* ==========================================================================
   COURSE FILTER
   ========================================================================== */

courseFilter.addEventListener(

    "change",

    ()=>{

        filterModules();

        applyFilters();

    }

);

/* ==========================================================================
   MODULE FILTER
   ========================================================================== */

moduleFilter.addEventListener(

    "change",

    applyFilters

);

/* ==========================================================================
   FILTER MODULE DROPDOWN
   ========================================================================== */

function filterModules(){

    const selectedCourse =

        courseFilter.value;

    moduleFilter.innerHTML =

        `<option value="">All Modules</option>`;

    state.lessons.forEach(lesson=>{

        if(

            selectedCourse !== "" &&

            lesson.courseId !== selectedCourse

        ){

            return;

        }

        const moduleName =

            state.modules[lesson.moduleId];

        if(

            moduleName &&

            !moduleFilter.querySelector(

                `option[value="${lesson.moduleId}"]`

            )

        ){

            moduleFilter.innerHTML += `

                <option value="${lesson.moduleId}">

                    ${moduleName}

                </option>

            `;

        }

    });

}

/* ==========================================================================
   APPLY FILTERS
   ========================================================================== */

function applyFilters(){

    const keyword =

        searchInput.value

        .trim()

        .toLowerCase();

    const selectedCourse =

        courseFilter.value;

    const selectedModule =

        moduleFilter.value;

    state.filtered =

        state.lessons.filter(lesson=>{

            const matchKeyword =

                (lesson.title || "")

                .toLowerCase()

                .includes(keyword);

            const matchCourse =

                selectedCourse === ""

                ||

                lesson.courseId === selectedCourse;

            const matchModule =

                selectedModule === ""

                ||

                lesson.moduleId === selectedModule;

            return (

                matchKeyword &&

                matchCourse &&

                matchModule

            );

        });

    renderLessons();

}

/* ==========================================================================
   DELETE LESSON
   ========================================================================== */

async function deleteLesson(

    lessonId

){

    const confirmed =

        confirm(

            "Delete this lesson?"

        );

    if(

        !confirmed

    ){

        return;

    }

    showLoader();

    try{

        await deleteDoc(

            doc(

                db,

                "lessons",

                lessonId

            )

        );

        showToast(

            "Lesson deleted successfully."

        );

        await loadLessons();

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
   TOGGLE STATUS
   ========================================================================== */

async function toggleLessonStatus(

    lessonId,

    currentStatus

){

    showLoader();

    try{

        const newStatus =

            currentStatus === "published"

            ?

            "draft"

            :

            "published";

        await updateDoc(

            doc(

                db,

                "lessons",

                lessonId

            ),

            {

                status:newStatus

            }

        );

        showToast(

            `Lesson ${newStatus}.`

        );

        await loadLessons();

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

    if(loader){

        loader.classList.remove(

            "hidden"

        );

    }

}

function hideLoader(){

    if(loader){

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

    type="success"

){

    if(!toastContainer){

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

    requestAnimationFrame(()=>{

        toast.classList.add(

            "show"

        );

    });

    setTimeout(()=>{

        toast.classList.remove(

            "show"

        );

        setTimeout(()=>{

            toast.remove();

        },300);

    },3000);

}

/* ==========================================================================
   REFRESH
   ========================================================================== */

async function refreshLessons(){

    showLoader();

    try{

        await loadLessons();

        filterModules();

        applyFilters();

    }

    finally{

        hideLoader();

    }

}

/* ==========================================================================
   PAGE VISIBILITY
   ========================================================================== */

document.addEventListener(

    "visibilitychange",

    async ()=>{

        if(

            document.visibilityState === "visible"

        ){

            await refreshLessons();

        }

    }

);

/* ==========================================================================
   AUTO REFRESH
   ========================================================================== */

setInterval(

    async ()=>{

        await refreshLessons();

    },

    60000

);

/* ==========================================================================
   EXPORTS
   ========================================================================== */

export{

    refreshLessons,

    loadLessons

};

/* ==========================================================================
   END OF FILE
   ========================================================================== */