"use strict";

/* ==========================================================================
   ISSA Academy
   Add Module Controller
   Version : 1.0.0
   ========================================================================== */

import { auth } from "../core/firebase-config.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    getFirestore,

    collection,

    getDocs,

    addDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore();

/* ==========================================================================
   DOM
   ========================================================================== */

const moduleForm =
    document.getElementById("moduleForm");

const courseId =
    document.getElementById("courseId");

const moduleTitle =
    document.getElementById("moduleTitle");

const moduleDescription =
    document.getElementById("moduleDescription");

const moduleOrder =
    document.getElementById("moduleOrder");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader(){

    pageLoader.classList.remove("hidden");

}

function hideLoader(){

    pageLoader.classList.add("hidden");

}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(message){

    const toast=document.createElement("div");

    toast.className="toast";

    toast.textContent=message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(()=>{

        toast.classList.add("show");

    });

    setTimeout(()=>{

        toast.remove();

    },3000);

}

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

        await loadCourses();

    }

);

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadCourses(){

    const snapshot = await getDocs(

        collection(db,"courses")

    );

    snapshot.forEach(docSnap=>{

        const course = docSnap.data();

        const option = document.createElement("option");

        option.value = docSnap.id;

        option.textContent = course.title;

        option.dataset.title = course.title;

        courseId.appendChild(option);

    });

}

/* ==========================================================================
   AUTO NEXT MODULE ORDER
   ========================================================================== */

async function loadNextModuleOrder(courseIdValue){

    if(!courseIdValue){

        moduleOrder.value = 1;

        return;

    }

    const snapshot = await getDocs(

        collection(db,"modules")

    );

    let highestOrder = 0;

    snapshot.forEach(docSnap=>{

        const module = docSnap.data();

        if(

            module.courseId === courseIdValue &&

            Number(module.order) > highestOrder

        ){

            highestOrder = Number(module.order);

        }

    });

    moduleOrder.value = highestOrder + 1;

}

courseId.addEventListener(

    "change",

    async ()=>{

        await loadNextModuleOrder(

            courseId.value

        );

    }

);

/* ==========================================================================
   SAVE MODULE
   ========================================================================== */

moduleForm.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        const selected=

            courseId.options[

                courseId.selectedIndex

            ];

        if(

            !courseId.value ||

            !moduleTitle.value.trim()

        ){

            showToast(

                "Please complete all required fields."

            );

            return;

        }

        try{

            showLoader();

            await addDoc(

                collection(

                    db,

                    "modules"

                ),

                {

                    courseId:

                        courseId.value,

                    courseTitle:

                        selected.dataset.title,

                    title:

                        moduleTitle.value.trim(),

                    description:

                        moduleDescription.value.trim(),

                    order:

    Number(

        moduleOrder.value

    ),

createdAt: serverTimestamp(),

updatedAt: serverTimestamp()

                }

            );

            hideLoader();

            showToast(

                "Module created successfully."

            );

            setTimeout(()=>{

                location.href=

                    "modules.html";

            },1000);

        }

        catch(error){

            console.error(error);

            hideLoader();

            showToast(

                "Failed to save module."

            );

        }

    }

);

/* ==========================================================================
   END
   ========================================================================== */