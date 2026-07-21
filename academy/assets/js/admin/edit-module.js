"use strict";

/* ==========================================================================
   ISSA Academy
   Edit Module
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
    getDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   AUTH
   ========================================================================== */

await requireAdmin();

/* ==========================================================================
   DOM
   ========================================================================== */

const form =
    document.getElementById("moduleForm");

const courseId =
    document.getElementById("courseId");

const title =
    document.getElementById("title");

const order =
    document.getElementById("order");

const description =
    document.getElementById("description");

const status =
    document.getElementById("status");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const moduleId =
    params.get("id");

/* ==========================================================================
   INIT
   ========================================================================== */

init();

async function init(){

    if(!moduleId){

        showToast(

            "Invalid Module.",

            "error"

        );

        location.href="modules.html";

        return;

    }

    showLoader();

    await loadCourses();

    await loadModule();

    hideLoader();

}

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadCourses(){

    courseId.innerHTML="";

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

    snapshot.forEach(docSnap=>{

        const course =

            docSnap.data();

        courseId.innerHTML += `

            <option value="${docSnap.id}">

                ${course.title}

            </option>

        `;

    });

}

/* ==========================================================================
   LOAD MODULE
   ========================================================================== */

async function loadModule(){

    const docSnap =

        await getDoc(

            doc(

                db,

                "modules",

                moduleId

            )

        );

    if(!docSnap.exists()){

        showToast(

            "Module not found.",

            "error"

        );

        location.href="modules.html";

        return;

    }

    const module =

        docSnap.data();

    courseId.value =
        module.courseId || "";

    title.value =
        module.title || "";

    order.value =
        module.order || 1;

    description.value =
        module.description || "";

    status.value =
        module.status || "draft";

}

/* ==========================================================================
   UPDATE
   ========================================================================== */

form.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        showLoader();

        try{

            await updateDoc(

                doc(

                    db,

                    "modules",

                    moduleId

                ),

                {

                    courseId:

                        courseId.value,

                    title:

                        title.value.trim(),

                    order:

                        Number(

                            order.value

                        ),

                    description:

                        description.value.trim(),

                    status:

                        status.value,

                    updatedAt:

                        serverTimestamp()

                }

            );

            showToast(

                "Module updated successfully."

            );

            setTimeout(()=>{

                location.href=

                    "modules.html";

            },1200);

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

);

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader(){

    loader.classList.remove(

        "hidden"

    );

}

function hideLoader(){

    loader.classList.add(

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