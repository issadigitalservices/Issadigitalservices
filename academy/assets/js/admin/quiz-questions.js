"use strict";

/* ==========================================================================
   ISSA Academy
   Quiz Questions
   ========================================================================== */

import {

    auth,
    db

} from "../core/firebase-config.js";

import {
    uploadFile
} from "../services/r2-upload.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    deleteDoc,
    updateDoc,
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

const quizTitle =
    document.getElementById("quizTitle");

const questionForm =
    document.getElementById("questionForm");

const question =
    document.getElementById("question");

const optionA =
    document.getElementById("optionA");

const optionB =
    document.getElementById("optionB");

const optionC =
    document.getElementById("optionC");

const optionD =
    document.getElementById("optionD");

const correctAnswer =
    document.getElementById("correctAnswer");

const marks =
    document.getElementById("marks");

const explanation =
    document.getElementById("explanation");

    const questionAttachment =
    document.getElementById(
        "questionAttachment"
    );

const attachmentPreview =
    document.getElementById(
        "attachmentPreview"
    );

const questionsList =
    document.getElementById("questionsList");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

const saveBtnText =
    document.getElementById("saveBtnText");

    /* ==========================================================================
   ATTACHMENT PREVIEW
   ========================================================================== */

questionAttachment.addEventListener(

    "change",

    ()=>{

        if(

            !questionAttachment.files.length

        ){

            attachmentPreview.innerHTML = "";

            return;

        }

        const file =

            questionAttachment.files[0];

        attachmentPreview.innerHTML =

        `

        <div class="attachment-item">

            <i class="fa-solid fa-paperclip"></i>

            ${file.name}

            <br>

            <small>

                ${(
                    file.size /
                    1024 /
                    1024
                ).toFixed(2)} MB

            </small>

        </div>

        `;

    }

);

/* ==========================================================================
   AUTH
   ========================================================================== */

let editQuestionId = null;

   onAuthStateChanged(

    auth,

    async user=>{

        if(!user){

            location.replace(

                "../student/login.html"

            );

            return;

        }

        if(!quizId){

            location.href =

                "quizzes.html";

            return;

        }

        showLoader();

        await loadQuiz();

        await loadQuestions();

        hideLoader();

    }

);

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

    quizTitle.textContent =

        snapshot.data().title;

}

/* ==========================================================================
   SAVE QUESTION
   ========================================================================== */

questionForm.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        showLoader();

        try{

            let attachmentUrl = "";

let attachmentName = "";

if (questionAttachment.files.length) {

    const file =

        questionAttachment.files[0];

    const uploadedFile =
    await uploadFile(
        file,
        "quiz-files"
    );

attachmentUrl =
    uploadedFile.url;

attachmentName =
    uploadedFile.fileName;

}

            const data = {

                quizId,

                attachmentUrl,

attachmentName,

                question:

                    question.value.trim(),

                optionA:

                    optionA.value.trim(),

                optionB:

                    optionB.value.trim(),

                optionC:

                    optionC.value.trim(),

                optionD:

                    optionD.value.trim(),

                correctAnswer:

                    correctAnswer.value,

                explanation:

                    explanation.value.trim(),

                marks:

                    Number(

                        marks.value

                    )

            };

            if(editQuestionId){

                await updateDoc(

                    doc(

                        db,

                        "quizQuestions",

                        editQuestionId

                    ),

                    data

                );

                showToast(

                    "Question updated."

                );

            }
            else{

                data.createdAt =

                    serverTimestamp();

                await addDoc(

                    collection(

                        db,

                        "quizQuestions"

                    ),

                    data

                );

                showToast(

                    "Question saved."

                );

            }

            resetForm();

            await loadQuestions();

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

window.deleteQuestion = async function(id){

    if(!confirm("Delete this question?")){

        return;

    }

    showLoader();

    try{

        await deleteDoc(

            doc(

                db,

                "quizQuestions",

                id

            )

        );

        if(editQuestionId===id){

            resetForm();

        }

        showToast(

            "Question deleted."

        );

        await loadQuestions();

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
   LOAD QUESTIONS
   ========================================================================== */

async function loadQuestions(){

    questionsList.innerHTML = "";

    const snapshot = await getDocs(

        query(

            collection(

                db,

                "quizQuestions"

            ),

            where(

                "quizId",

                "==",

                quizId

            )

        )

    );

    let number = 1;

    snapshot.forEach(docSnap=>{

        const data =

            docSnap.data();

        questionsList.innerHTML += `

<div class="question-card">

<h3>

Q${number++}. ${data.question}

</h3>

${

    data.attachmentUrl

        ?

        `

<div class="question-attachment">

    <i class="fa-solid fa-paperclip"></i>

    <a

        href="${data.attachmentUrl}"

        target="_blank">

        ${data.attachmentName}

    </a>

</div>

`

        :

        ""

}

<div class="option ${data.correctAnswer==="A"?"correct":""}">

A. ${data.optionA}

</div>

<div class="option ${data.correctAnswer==="B"?"correct":""}">

B. ${data.optionB}

</div>

<div class="option ${data.correctAnswer==="C"?"correct":""}">

C. ${data.optionC}

</div>

<div class="option ${data.correctAnswer==="D"?"correct":""}">

D. ${data.optionD}

</div>

<div class="question-footer">

<div>

<strong>

Answer:

</strong>

${data.correctAnswer}

</div>

<div class="question-actions">

<button
class="btn-edit"
onclick="editQuestion('${docSnap.id}')">

<i class="fa-solid fa-pen"></i>

Edit

</button>

<button
class="btn-delete"
onclick="deleteQuestion('${docSnap.id}')">

<i class="fa-solid fa-trash"></i>

Delete

</button>

</div>

</div>

</div>

`;

    });

}

/* ==========================================================================
   DELETE QUESTION
   ========================================================================== */

window.editQuestion = async function(id){

    showLoader();

    try{

        const snapshot = await getDoc(

            doc(

                db,

                "quizQuestions",

                id

            )

        );

        if(!snapshot.exists()){

            hideLoader();

            return;

        }

        const data =

            snapshot.data();

        editQuestionId = id;

        question.value =

            data.question;

        optionA.value =

            data.optionA;

        optionB.value =

            data.optionB;

        optionC.value =

            data.optionC;

        optionD.value =

            data.optionD;

        correctAnswer.value =

            data.correctAnswer;

        marks.value =

            data.marks;

        explanation.value =

            data.explanation || "";

        saveBtnText.textContent =
    "Update Question";

question.focus();

window.scrollTo({

    top:0,

    behavior:"smooth"

});

    }

    finally{

        hideLoader();

    }

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

function resetForm(){

    questionForm.reset();

    marks.value = 1;

    correctAnswer.value = "A";

    explanation.value = "";

    editQuestionId = null;

    saveBtnText.textContent =

        "Save Question";

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