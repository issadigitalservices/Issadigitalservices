"use strict";

/* ==========================================================================
   ISSA Academy
   Modules Controller
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
    document.getElementById("modulesGrid");

const template =
    document.getElementById("moduleCardTemplate");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const courseFilter =
    document.getElementById("courseFilter");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   STATE
   ========================================================================== */

const state={

    modules:[],

    filtered:[],

    courses:{}

};

/* ==========================================================================
   INIT
   ========================================================================== */

init();

async function init(){

    showLoader();

    await loadCourses();

    await loadModules();

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

    state.modules=[];

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

    snapshot.forEach(docSnap=>{

        state.modules.push({

            id:docSnap.id,

            ...docSnap.data()

        });

    });

    state.filtered=[

        ...state.modules

    ];

    await renderModules();

}

/* ==========================================================================
   RENDER
   ========================================================================== */

async function renderModules(){

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

    for (const module of state.filtered) {

        const card =

            template.content.cloneNode(true);

        card.querySelector(

            ".module-title"

        ).textContent =

            module.title;

        card.querySelector(

            ".module-order"

        ).textContent =

            `Module ${module.order}`;

        card.querySelector(

            ".module-course"

        ).textContent =

            state.courses[module.courseId] ||

            "-";

        card.querySelector(

            ".module-description"

        ).textContent =

            module.description ||

            "-";

        const lessonSnapshot = await getDocs(

    query(

        collection(

            db,

            "lessons"

        ),

        where(

            "moduleId",

            "==",

            module.id

        )

    )

);

card.querySelector(

    ".lesson-count"

).textContent =

    lessonSnapshot.size;

        /* ================= EDIT ================= */

        card.querySelector(

            ".btn-edit"

        ).addEventListener(

            "click",

            ()=>{

                location.href =

                    `edit-module.html?id=${module.id}`;

            }

        );

        /* ================= DELETE ================= */

        card.querySelector(

            ".btn-delete"

        ).addEventListener(

            "click",

            ()=>{

                deleteModule(

                    module.id

                );

            }

        );
        grid.appendChild(card);
}

}

        /* ==========================================================================
   SEARCH
   ========================================================================== */

if(searchInput){

    searchInput.addEventListener(

        "input",

        applyFilters

    );

}

if(courseFilter){

    courseFilter.addEventListener(

        "change",

        applyFilters

    );

}

/* ==========================================================================
   FILTER
   ========================================================================== */

async function applyFilters(){

    const keyword =

        searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedCourse =

        courseFilter
        ? courseFilter.value
        : "";

    state.filtered = state.modules.filter(module=>{

        const matchKeyword =

            (module.title || "")
            .toLowerCase()
            .includes(keyword);

        const matchCourse =

            selectedCourse === "" ||

            module.courseId === selectedCourse;

        return matchKeyword && matchCourse;

    });

    await renderModules();

}

/* ==========================================================================
   DELETE MODULE
   ========================================================================== */

async function deleteModule(moduleId){

    const confirmed =

        confirm(

            "Delete this module?\n\nAll lessons inside this module will also be deleted."

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

                        "moduleId",

                        "==",

                        moduleId

                    )

                )

            );

        for(const lessonDoc of lessonSnapshot.docs){

            await deleteDoc(

                lessonDoc.ref

            );

        }

        /* ================= Delete Module ================= */

        await deleteDoc(

            doc(

                db,

                "modules",

                moduleId

            )

        );

        showToast(

            "Module deleted successfully."

        );

        await loadModules();

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

async function refreshModules(){

    showLoader();

    try{

        await loadModules();

    }

    finally{

        hideLoader();

    }

}

/* ==========================================================================
   END OF FILE
   ========================================================================== */