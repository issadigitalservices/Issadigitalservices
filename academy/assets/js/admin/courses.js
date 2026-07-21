"use strict";

/* ==========================================================================
   ISSA Academy
   Courses Controller
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
    doc,
    deleteDoc,
    updateDoc,
    where

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   AUTH
   ========================================================================== */

await requireAdmin();

/* ==========================================================================
   DOM
   ========================================================================== */

const grid =
    document.getElementById("coursesGrid");

const template =
    document.getElementById("courseCardTemplate");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   STATE
   ========================================================================== */

const state={

    courses:[],

    filtered:[]

};

/* ==========================================================================
   INIT
   ========================================================================== */

init();

async function init(){

    showLoader();

    await loadCourses();

    hideLoader();

}

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadCourses(){

    state.courses=[];

    const snapshot=

        await getDocs(

            query(

                collection(

                    db,

                    "courses"

                ),

                orderBy(

                    "createdAt",

                    "desc"

                )

            )

        );

    snapshot.forEach(docSnap=>{

        state.courses.push({

            id:docSnap.id,

            ...docSnap.data()

        });

    });

    state.filtered=[

        ...state.courses

    ];

    renderCourses();

}

/* ==========================================================================
   RENDER
   ========================================================================== */

function renderCourses(){

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

    state.filtered.forEach(course=>{

        const card=

            template.content.cloneNode(true);

        card.querySelector(

            ".thumbnail"

        ).src=

            course.thumbnail ||

            "../assets/images/course-placeholder.jpg";

        card.querySelector(

            ".course-title"

        ).textContent=

            course.title ||

            "Untitled Course";

        card.querySelector(

            ".course-category"

        ).textContent=

            course.category ||

            "-";

        card.querySelector(

            ".course-description"

        ).textContent=

            course.description ||

            "-";

        card.querySelector(

            ".course-status"

        ).textContent=

            course.status ||

            "draft";

        card.querySelector(

            ".lessons"

        ).textContent=

            course.totalLessons || 0;

        card.querySelector(

            ".students"

        ).textContent=

            course.totalStudents || 0;

        /* ================= EDIT ================= */

        card.querySelector(

            ".btn-edit"

        ).addEventListener(

            "click",

            ()=>{

                location.href=

                `edit-course.html?id=${course.id}`;

            }

        );

        /* ================= DELETE ================= */

        card.querySelector(

            ".btn-delete"

        ).addEventListener(

            "click",

            ()=>{

                deleteCourse(

                    course.id

                );

            }

        );

        /* ================= STATUS ================= */

        card.querySelector(

            ".btn-publish"

        ).addEventListener(

            "click",

            ()=>{

                toggleCourseStatus(

                    course.id,

                    course.status

                );

            }

        );

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
   FILTER
   ========================================================================== */

statusFilter.addEventListener(

    "change",

    applyFilters

);

function applyFilters(){

    const keyword =

        searchInput.value

        .trim()

        .toLowerCase();

    const status =

        statusFilter.value;

    state.filtered =

        state.courses.filter(course=>{

            const matchKeyword =

                (course.title || "")

                .toLowerCase()

                .includes(keyword);

            const matchStatus =

                status === "all"

                ||

                (course.status || "draft") === status;

            return (

                matchKeyword &&

                matchStatus

            );

        });

    renderCourses();

}

/* ==========================================================================
   DELETE COURSE
   ========================================================================== */

async function deleteCourse(courseId){

    const confirmed =

        confirm(

            "Delete this course?\n\nModules and lessons related to this course will also be deleted."

        );

    if(!confirmed){

        return;

    }

    showLoader();

    try{

        /* ================= Delete Lessons ================= */

        const lessonSnapshot =

            await getDocs(

                query(

                    collection(

                        db,

                        "lessons"

                    ),

                    where(

                        "courseId",

                        "==",

                        courseId

                    )

                )

            );

        for(const lessonDoc of lessonSnapshot.docs){

            await deleteDoc(

                lessonDoc.ref

            );

        }

        /* ================= Delete Modules ================= */

        const moduleSnapshot =

            await getDocs(

                query(

                    collection(

                        db,

                        "modules"

                    ),

                    where(

                        "courseId",

                        "==",

                        courseId

                    )

                )

            );

        for(const moduleDoc of moduleSnapshot.docs){

            await deleteDoc(

                moduleDoc.ref

            );

        }

        /* ================= Delete Course ================= */

        await deleteDoc(

            doc(

                db,

                "courses",

                courseId

            )

        );

        showToast(

            "Course deleted successfully."

        );

        await loadCourses();

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

async function toggleCourseStatus(

    courseId,

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

                "courses",

                courseId

            ),

            {

                status:newStatus

            }

        );

        showToast(

            `Course ${newStatus}.`

        );

        await loadCourses();

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

async function refreshCourses(){

    showLoader();

    try{

        await loadCourses();

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

            document.visibilityState==="visible"

        ){

            await refreshCourses();

        }

    }

);

/* ==========================================================================
   OPTIONAL AUTO REFRESH
   ========================================================================== */

setInterval(

    async ()=>{

        await refreshCourses();

    },

    60000

);

/* ==========================================================================
   EXPORTS (Future Use)
   ========================================================================== */

export{

    refreshCourses,

    loadCourses

};

/* ==========================================================================
   END OF FILE
   ========================================================================== */