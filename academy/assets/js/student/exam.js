"use strict";

/* ==========================================================================
ISSA Academy
Student Exam
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
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
URL
========================================================================== */

const params = new URLSearchParams(location.search);
const examId = params.get("id");

/* ==========================================================================
DOM
========================================================================== */

const examTitle = document.getElementById("examTitle");
const currentQuestion = document.getElementById("currentQuestion");
const totalQuestions = document.getElementById("totalQuestions");
const timer = document.getElementById("timer");
const questionText = document.getElementById("questionText");
const optionsList = document.getElementById("optionsList");
const palette = document.getElementById("palette");
const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBar = document.getElementById("progressBar");
const pageLoader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
GLOBALS
========================================================================== */

let studentId = "";
let exam = {};
let questions = [];
let answers = {};
let current = 0;
let seconds = 0;
let timerInterval;
let attemptId = "";

/* ==========================================================================
AUTH
========================================================================== */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        location.replace("login.html");
        return;
    }

    studentId = user.uid;
    showLoader();

    // Load exam details
    const examLoaded = await loadExam();
    if (!examLoaded) {
        hideLoader();
        return;
    }

    /* ================================================================
       VERIFY EXAM ACCESS & CHECK ATTEMPTS CONCURRENTLY
    ================================================================ */

    const [examAccessAllowed, passedSnapshot, attemptSnapshot] = await Promise.all([
        verifyExamAccess(),
        getDocs(query(
            collection(db, "examAttempts"),
            where("studentId", "==", studentId),
            where("examId", "==", examId),
            where("passed", "==", true)
        )),
        getDocs(query(
            collection(db, "examAttempts"),
            where("studentId", "==", studentId),
            where("examId", "==", examId),
            where("submittedAt", "==", null)
        ))
    ]);

    if (!examAccessAllowed) {
        hideLoader();
        return;
    }

    if (!passedSnapshot.empty) {
        location.replace(`course.html?id=${exam.courseId}`);
        return;
    }

    // Resume existing attempt
    if (!attemptSnapshot.empty) {
        const attemptDoc = attemptSnapshot.docs[0];
        attemptId = attemptDoc.id;
        const attempt = attemptDoc.data();

        answers = attempt.answers || {};
        current = attempt.currentQuestion || 0;

        if (attempt.expiresAt) {
            seconds = Math.max(
                0,
                Math.floor((attempt.expiresAt.toMillis() - Date.now()) / 1000)
            );
        }
    } else {
        seconds = (exam.duration || 30) * 60;

        const newAttempt = await addDoc(
            collection(db, "examAttempts"),
            {
                studentId,
                examId,
                answers: {},
                currentQuestion: 0,
                score: 0,
                totalMarks: 0,
                percentage: 0,
                passed: false,
                submittedAt: null,
                startedAt: serverTimestamp(),
                expiresAt: Timestamp.fromMillis(
                    Date.now() + seconds * 1000
                )
            }
        );

        attemptId = newAttempt.id;
    }

    await loadQuestions();

    if (questions.length === 0) {
        showToast("No questions found for this Exam.", "error");
        hideLoader();
        return;
    }

    renderQuestion();
    startTimer();
    hideLoader();
});

/* ==========================================================================
LOAD EXAM
========================================================================== */

async function loadExam() {
    const examDoc = await getDoc(doc(db, "exams", examId));

    if (!examDoc.exists()) {
        showToast("Exam not found.", "error");
        return false;
    }

    exam = {
        id: examDoc.id,
        ...examDoc.data()
    };

    examTitle.textContent = exam.title;

    if (seconds === 0) {
        seconds = (exam.duration || 30) * 60;
    }

    return true;
}

/* ==========================================================================
VERIFY EXAM ACCESS (BULK PARALLELIZED)
========================================================================== */

async function verifyExamAccess() {
    if (!studentId || !examId || !exam.courseId) {
        showToast("Unable to verify exam access.", "error");
        return false;
    }

    /* 1. VERIFY ACTIVE ENROLLMENT */
    const enrollmentSnapshot = await getDocs(
        query(
            collection(db, "enrollments"),
            where("studentId", "==", studentId),
            where("courseId", "==", exam.courseId),
            where("approvalStatus", "==", "Approved")
        )
    );

    if (enrollmentSnapshot.empty) {
        showToast("You are not enrolled in this course.", "error");
        setTimeout(() => {
            location.replace("my-courses.html");
        }, 1200);
        return false;
    }

    /* 2. MODULE EXAM ACCESS */
    if (exam.type === "module") {
        if (!exam.moduleId) {
            showToast("This Exam is not properly configured.", "error");
            return false;
        }

        const [moduleSnap, lessonSnapshot, progressSnapshot] = await Promise.all([
            getDoc(doc(db, "modules", exam.moduleId)),
            getDocs(query(collection(db, "lessons"), where("moduleId", "==", exam.moduleId))),
            getDocs(query(
                collection(db, "lessonProgress"),
                where("studentId", "==", studentId),
                where("courseId", "==", exam.courseId),
                where("moduleId", "==", exam.moduleId)
            ))
        ]);

        if (!moduleSnap.exists()) {
            showToast("Module not found.", "error");
            return false;
        }

        const moduleData = moduleSnap.data();
        const moduleOrder = Number(moduleData.order || 1);

        const lessonIds = lessonSnapshot.docs.map(lessonDoc => lessonDoc.id);

        if (lessonIds.length === 0) {
            showToast("This module has no lessons.", "error");
            return false;
        }

        const completedLessonIds = new Set();
        progressSnapshot.forEach(progressDoc => {
            const progress = progressDoc.data();
            if (progress.completed === true) {
                completedLessonIds.add(progress.lessonId);
            }
        });

        const allLessonsCompleted = lessonIds.every(lessonId => completedLessonIds.has(lessonId));

        if (!allLessonsCompleted) {
            showToast("Complete all lessons in this module before starting the Exam.", "error");
            setTimeout(() => {
                location.replace(`course.html?id=${exam.courseId}`);
            }, 1200);
            return false;
        }

        if (moduleOrder > 1) {
            const modulesSnapshot = await getDocs(
                query(collection(db, "modules"), where("courseId", "==", exam.courseId))
            );

            const previousModules = modulesSnapshot.docs.filter(moduleDoc => {
                const data = moduleDoc.data();
                return Number(data.order || 1) < moduleOrder;
            });

            const previousExamsVerification = await Promise.all(
                previousModules.map(async previousModule => {
                    const previousExamSnapshot = await getDocs(
                        query(
                            collection(db, "exams"),
                            where("courseId", "==", exam.courseId),
                            where("moduleId", "==", previousModule.id),
                            where("type", "==", "module")
                        )
                    );

                    if (previousExamSnapshot.empty) return { error: "missing" };

                    const previousExam = previousExamSnapshot.docs[0];
                    const passedSnapshot = await getDocs(
                        query(
                            collection(db, "examAttempts"),
                            where("studentId", "==", studentId),
                            where("examId", "==", previousExam.id),
                            where("passed", "==", true)
                        )
                    );

                    return { error: passedSnapshot.empty ? "not_passed" : null };
                })
            );

            for (const result of previousExamsVerification) {
                if (result.error === "missing") {
                    showToast("A previous Module Exam is missing.", "error");
                    return false;
                }
                if (result.error === "not_passed") {
                    showToast("Complete the previous Module Exam first.", "error");
                    setTimeout(() => {
                        location.replace(`course.html?id=${exam.courseId}`);
                    }, 1200);
                    return false;
                }
            }
        }
    }

    /* 3. FINAL EXAM ACCESS */
    if (exam.type === "final") {
        const [courseSnap, modulesSnapshot] = await Promise.all([
            getDoc(doc(db, "courses", exam.courseId)),
            getDocs(query(collection(db, "modules"), where("courseId", "==", exam.courseId)))
        ]);

        if (!courseSnap.exists()) {
            showToast("Course not found.", "error");
            return false;
        }

        const moduleDocs = modulesSnapshot.docs;

        const modulesVerification = await Promise.all(
            moduleDocs.map(async moduleDoc => {
                const moduleExamSnapshot = await getDocs(
                    query(
                        collection(db, "exams"),
                        where("courseId", "==", exam.courseId),
                        where("moduleId", "==", moduleDoc.id),
                        where("type", "==", "module")
                    )
                );

                if (moduleExamSnapshot.empty) return { error: "missing" };

                const moduleExam = moduleExamSnapshot.docs[0];
                const passedSnapshot = await getDocs(
                    query(
                        collection(db, "examAttempts"),
                        where("studentId", "==", studentId),
                        where("examId", "==", moduleExam.id),
                        where("passed", "==", true)
                    )
                );

                return { error: passedSnapshot.empty ? "not_passed" : null };
            })
        );

        for (const result of modulesVerification) {
            if (result.error === "missing") {
                showToast("A Module Exam is missing.", "error");
                return false;
            }
            if (result.error === "not_passed") {
                showToast("Complete all Module Exams before starting the Final Exam.", "error");
                setTimeout(() => {
                    location.replace(`course.html?id=${exam.courseId}`);
                }, 1200);
                return false;
            }
        }
    }

    return true;
}

/* ==========================================================================
LOAD QUESTIONS
========================================================================== */

async function loadQuestions(){
    const snapshot = await getDocs(
        query(collection(db, "examQuestions"), where("examId", "==", examId))
    );

    questions = [];
    snapshot.forEach(doc => {
        questions.push({
            id: doc.id,
            ...doc.data()
        });
    });

    totalQuestions.textContent = questions.length;
    updatePalette();
}

/* ==========================================================================
RENDER QUESTION
========================================================================== */

function renderQuestion(){
    currentQuestion.textContent = current + 1;
    const q = questions[current];
    questionText.textContent = q.question;

    const attachment = document.getElementById("questionAttachment");

    if (q.attachmentUrl) {
        attachment.classList.remove("hidden");
        const extension = q.attachmentName.split(".").pop().toLowerCase();
        let icon = "fa-file";

        switch (extension) {
            case "xlsx":
            case "xls":
            case "csv":
                icon = "fa-file-excel";
                break;
            case "pdf":
                icon = "fa-file-pdf";
                break;
            case "doc":
            case "docx":
                icon = "fa-file-word";
                break;
            case "ppt":
            case "pptx":
                icon = "fa-file-powerpoint";
                break;
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "webp":
                icon = "fa-file-image";
                break;
            case "zip":
            case "rar":
            case "7z":
                icon = "fa-file-zipper";
                break;
        }

        attachment.innerHTML = `
        <div class="question-file">
            <div class="question-file-info">
                <i class="fa-solid ${icon} question-file-icon"></i>
                <div>
                    <div class="question-file-title">Question Attachment</div>
                    <div class="question-file-name">${q.attachmentName.replace(/^\d+-/, "")}</div>
                </div>
            </div>
            <a href="${q.attachmentUrl}" target="_blank" class="question-file-button">
                <i class="fa-solid fa-download"></i> Open
            </a>
        </div>`;
    } else {
        attachment.classList.add("hidden");
        attachment.innerHTML = "";
    }

    optionsList.innerHTML = "";

    const options = [
        { key: "A", value: q.optionA },
        { key: "B", value: q.optionB },
        { key: "C", value: q.optionC },
        { key: "D", value: q.optionD }
    ];

    options.forEach(option => {
        const selected = answers[q.id] === option.key ? "selected" : "";
        optionsList.innerHTML += `
        <label class="option ${selected}">
            <input type="radio" name="answer" value="${option.key}" ${selected ? "checked" : ""}>
            <strong>${option.key}.</strong>
            ${option.value}
        </label>`;
    });

    document.querySelectorAll(".option").forEach(item => {
        item.addEventListener("click", async () => {
            document.querySelectorAll(".option").forEach(option => option.classList.remove("selected"));
            item.classList.add("selected");
            answers[q.id] = item.querySelector("input").value;
            updatePalette();

            await updateDoc(doc(db, "examAttempts", attemptId), {
                answers,
                currentQuestion: current
            });
        });
    });

    progressBar.style.width = `${((current + 1) / questions.length) * 100}%`;
    previousBtn.disabled = current === 0;
    nextBtn.classList.toggle("hidden", current === questions.length - 1);
    submitBtn.classList.toggle("hidden", current !== questions.length - 1);
}

/* ==========================================================================
PALETTE
========================================================================== */

function buildPalette(){
    palette.innerHTML = "";
    questions.forEach((question, index) => {
        const button = document.createElement("button");
        button.textContent = index + 1;

        if(index === 0){
            button.classList.add("active");
        }

        button.onclick = () => {
            current = index;
            updatePalette();
            renderQuestion();
        };

        palette.appendChild(button);
    });
}

function updatePalette(){
    palette.innerHTML = "";
    questions.forEach((question, index) => {
        const button = document.createElement("button");
        button.textContent = index + 1;

        if(index === current){
            button.classList.add("active");
        }

        if(answers[question.id]){
            button.classList.add("answered");
        }

        button.addEventListener("click", async () => {
            current = index;
            updatePalette();
            renderQuestion();

            await updateDoc(doc(db, "examAttempts", attemptId), {
                currentQuestion: current
            });
        });

        palette.appendChild(button);
    });
}

/* ==========================================================================
TIMER
========================================================================== */

function startTimer(){
    updateTimer();
    timerInterval = setInterval(async () => {
        seconds--;
        updateTimer();

        if(seconds % 30 === 0){
            await updateDoc(doc(db, "examAttempts", attemptId), {
                expiresAt: Timestamp.fromMillis(Date.now() + seconds * 1000),
                currentQuestion: current,
                answers,
                lastActivity: serverTimestamp()
            });
        }

        if(seconds <= 0){
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

function updateTimer(){
    if(seconds < 0){
        seconds = 0;
    }
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    timer.textContent = `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

/* ==========================================================================
NAVIGATION
========================================================================== */

previousBtn.addEventListener("click", async () => {
    if(current > 0){
        current--;
        await updateDoc(doc(db, "examAttempts", attemptId), {
            currentQuestion: current
        });
        updatePalette();
        renderQuestion();
    }
});

nextBtn.addEventListener("click", async () => {
    if(current < questions.length - 1){
        current++;
        await updateDoc(doc(db, "examAttempts", attemptId), {
            currentQuestion: current
        });
        renderQuestion();
        updatePalette();
    }
});

submitBtn.addEventListener("click", () => {
    const answered = Object.keys(answers).length;
    const unanswered = questions.length - answered;
    let message = "";

    if(unanswered > 0){
        message = `You have answered ${answered} of ${questions.length} questions.

${unanswered} question(s) are still unanswered.

Do you want to submit anyway?`;
    } else {
        message = `You have answered all ${questions.length} questions.

Are you sure you want to submit your Answers?`;
    }

    const confirmed = confirm(message);
    if(!confirmed){
        return;
    }

    submitExam();
});

/* ==========================================================================
SUBMIT EXAM
========================================================================== */

async function submitExam(){
    clearInterval(timerInterval);
    let score = 0;

    questions.forEach(question => {
        if(answers[question.id] === question.correctAnswer){
            score += question.marks || 1;
        }
    });

    const totalMarks = questions.reduce((total, question) => total + (question.marks || 1), 0);
    const percentage = totalMarks === 0 ? 0 : Math.round((score / totalMarks) * 100);
    const passed = percentage >= (exam.passMark || 70);

    await updateDoc(doc(db, "examAttempts", attemptId), {
        score,
        totalMarks,
        percentage,
        passed,
        answers,
        currentQuestion: current,
        submittedAt: serverTimestamp()
    });

    if (passed) {
        const examDoc = await getDoc(doc(db, "exams", examId));
        const examData = examDoc.data();

        if (examData.type === "module") {
            const progressSnapshot = await getDocs(
                query(
                    collection(db, "moduleProgress"),
                    where("studentId", "==", studentId),
                    where("courseId", "==", examData.courseId),
                    where("moduleId", "==", examData.moduleId)
                )
            );

            if (progressSnapshot.empty) {
                await addDoc(collection(db, "moduleProgress"), {
                    studentId: studentId,
                    courseId: examData.courseId,
                    moduleId: examData.moduleId,
                    completed: true,
                    passed: true,
                    completedAt: serverTimestamp(),
                    passedAt: serverTimestamp()
                });
            }
        } else if (examData.type === "final") {
            console.log("Final Exam passed. Certificate requires admin approval.");
        }

        location.href = `exam-result.html?id=${examId}&score=${score}&total=${totalMarks}&percentage=${percentage}&passed=${passed}`;
    }
}

/* ==========================================================================
LOADER & TOAST
========================================================================== */

function showLoader(){
    pageLoader.classList.remove("hidden");
}

function hideLoader(){
    pageLoader.classList.add("hidden");
}

function showToast(message, type = "success"){
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.remove();
    }, 3000);
}