"use strict";

/* ==========================================================================
   ISSA Academy
   Exam Form
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

const examId =
    params.get("id");

/* ==========================================================================
   DOM
   ========================================================================== */

const examForm =
    document.getElementById("examForm");

const courseId =
    document.getElementById("courseId");

const moduleId =
    document.getElementById("moduleId");

const examTitle =
    document.getElementById("examTitle");

const examType =
    document.getElementById("examType");

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
        if(examId){

            await loadExam();

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

examType.addEventListener("change", toggleModuleField);

function toggleModuleField(){

    if(examType.value === "final"){

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
   LOAD Exam
   ========================================================================== */

async function loadExam(){

    const snapshot = await getDoc(

        doc(

            db,

            "exams",

            examId

        )

    );

    if(!snapshot.exists()){

        showToast(

            "exam not found.",

            "error"

        );

        return;

    }

    const exam =

        snapshot.data();

    courseId.value =

        exam.courseId;

    await loadModules();

    moduleId.value =

        exam.moduleId || "";

    examTitle.value =

        exam.title || "";

    examType.value =

        exam.type || "module";

    duration.value =

        exam.duration || 30;

    totalQuestions.value =

        exam.totalQuestions || 10;

    passMark.value =

        exam.passMark || 70;

   toggleModuleField();

}

/* ==========================================================================
   SAVE Exam
   ========================================================================== */

examForm.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        showLoader();

        if(

    examType.value === "module"

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

                    examTitle.value.trim(),

                courseId:

                    courseId.value,

                courseName:

                    courseSnap.data().title,

              moduleId:

    examType.value === "final"
        ? ""
        : moduleId.value,

                moduleName:

    examType.value === "final"
        ? ""
        : moduleSnap?.data().title || "",

                type:

                    examType.value,

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

            if(examId){

                await updateDoc(

                    doc(

                        db,

                        "exams",

                        examId

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

                        "exams"

                    ),

                    data

                );

            }

            showToast(

                "Exam saved successfully."

            );

            setTimeout(()=>{

                location.href =

                    "exams.html";

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