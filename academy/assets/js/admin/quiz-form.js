"use strict";

/* ==========================================================================
   ISSA Academy
   Quiz Form
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
    addDoc,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const quizId =
    params.get("id");

/* ==========================================================================
   DOM
   ========================================================================== */

const quizForm =
    document.getElementById("quizForm");

const courseId =
    document.getElementById("courseId");

const moduleId =
    document.getElementById("moduleId");

const quizTitle =
    document.getElementById("quizTitle");

const quizType =
    document.getElementById("quizType");

const duration =
    document.getElementById("duration");

const totalQuestions =
    document.getElementById("totalQuestions");

const passMark =
    document.getElementById("passMark");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(

    auth,

    async user=>{

        if(!user){

            location.replace(

                "../student/login.html"

            );

            return;

        }

        showLoader();

        await loadCourses();
toggleModuleField();
        if(quizId){

            await loadQuiz();

        }

        hideLoader();

    }

);

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadCourses(){

    const snapshot = await getDocs(

        collection(

            db,

            "courses"

        )

    );

    courseId.innerHTML =

        `<option value="">Select Course</option>`;

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
   LOAD MODULES
   ========================================================================== */

courseId.addEventListener(

    "change",

    loadModules

);

quizType.addEventListener("change", toggleModuleField);

function toggleModuleField(){

    if(quizType.value === "final"){

        moduleId.value = "";

        moduleId.disabled = true;

        moduleId.required = false;

    }

    else{

        moduleId.disabled = false;

        moduleId.required = true;

    }

}

async function loadModules(){

    moduleId.innerHTML =

        `<option value="">Select Module</option>`;

    if(!courseId.value){

        return;

    }

    const snapshot = await getDocs(

        query(

            collection(

                db,

                "modules"

            ),

            where(

                "courseId",

                "==",

                courseId.value

            )

        )

    );

    snapshot.forEach(docSnap=>{

        const module =

            docSnap.data();

        moduleId.innerHTML += `

<option value="${docSnap.id}">

${module.title}

</option>

`;

    });

}

/* ==========================================================================
   LOAD QUIZ
   ========================================================================== */

async function loadQuiz(){

    const snapshot = await getDoc(

        doc(

            db,

            "quizzes",

            quizId

        )

    );

    if(!snapshot.exists()){

        showToast(

            "Quiz not found.",

            "error"

        );

        return;

    }

    const quiz =

        snapshot.data();

    courseId.value =

        quiz.courseId;

    await loadModules();

    moduleId.value =

        quiz.moduleId || "";

    quizTitle.value =

        quiz.title || "";

    quizType.value =

        quiz.type || "module";

    duration.value =

        quiz.duration || 30;

    totalQuestions.value =

        quiz.totalQuestions || 10;

    passMark.value =

        quiz.passMark || 70;

   toggleModuleField();

}

/* ==========================================================================
   SAVE QUIZ
   ========================================================================== */

quizForm.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        showLoader();

        if(

    quizType.value === "module"

    &&

    !moduleId.value

){

    hideLoader();

    showToast(

        "Please select a module.",

        "error"

    );

    return;

}

        try{

            const courseSnap = await getDoc(

                doc(

                    db,

                    "courses",

                    courseId.value

                )

            );

            const moduleSnap =

                moduleId.value

                ?

                await getDoc(

                    doc(

                        db,

                        "modules",

                        moduleId.value

                    )

                )

                :

                null;

            const data = {

                title:

                    quizTitle.value.trim(),

                courseId:

                    courseId.value,

                courseName:

                    courseSnap.data().title,

              moduleId:

    quizType.value === "final"
        ? ""
        : moduleId.value,

                moduleName:

    quizType.value === "final"
        ? ""
        : moduleSnap?.data().title || "",

                type:

                    quizType.value,

                duration:

                    Number(

                        duration.value

                    ),

                totalQuestions:

                    Number(

                        totalQuestions.value

                    ),

                passMark:

                    Number(

                        passMark.value

                    ),

                updatedAt:

                    serverTimestamp()

            };

            if(quizId){

                await updateDoc(

                    doc(

                        db,

                        "quizzes",

                        quizId

                    ),

                    data

                );

            }

            else{

                data.createdAt =

                    serverTimestamp();

                await addDoc(

                    collection(

                        db,

                        "quizzes"

                    ),

                    data

                );

            }

            showToast(

                "Exam saved successfully."

            );

            setTimeout(()=>{

                location.href =

                    "quizzes.html";

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