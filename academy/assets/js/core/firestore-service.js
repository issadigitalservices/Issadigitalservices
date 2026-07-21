"use strict";

/* ==========================================================================
   ISSA Academy
   Firestore Service
   Version : 3.0.0
   ==========================================================================
   RULES
   --------------------------------------------------------------------------
   • ONLY this file communicates with Firestore.
   • UI files NEVER import Firestore directly.
   • All database operations pass through this repository.
   ========================================================================== */

import { app } from "./firebase-config.js";

import {
    getFirestore,

    collection,
    doc,

    getDoc,
    getDocs,

    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,

    query,
    where,
    orderBy,
    limit,

    writeBatch,
    runTransaction,

    serverTimestamp,
    increment,
    arrayUnion,

    Timestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   FIRESTORE
   ========================================================================== */

const db = getFirestore(app);

/* ==========================================================================
   COLLECTIONS
   ========================================================================== */

export const COLLECTION = Object.freeze({

    STUDENTS: "students",

    COURSES: "courses",

    MODULES: "modules",

    LESSONS: "lessons",

    STUDENT_COURSES: "student_courses",

    PAYMENTS: "payments",

    CERTIFICATES: "certificates",

    REVIEWS: "reviews",

    ANNOUNCEMENTS: "announcements"

});

/* ==========================================================================
   DEFAULT QUERY LIMITS
   ========================================================================== */

export const QUERY_LIMIT = Object.freeze({

    COURSES: 100,

    MODULES: 100,

    LESSONS: 500,

    REVIEWS: 20,

    ANNOUNCEMENTS: 20

});

/* ==========================================================================
   STANDARD RESPONSE
   ========================================================================== */

function success(data = null) {

    return {

        success: true,

        data,

        error: null

    };

}

function failure(error) {

    console.error(error);

    return {

        success: false,

        data: null,

        error: error?.message || String(error)

    };

}

/* ==========================================================================
   VALIDATORS
   ========================================================================== */

function required(value, name) {

    if (

        value === undefined ||

        value === null ||

        value === ""

    ) {

        throw new Error(`${name} is required.`);

    }

}

function requiredObject(value, name) {

    if (

        typeof value !== "object" ||

        value === null ||

        Array.isArray(value)

    ) {

        throw new Error(`${name} must be an object.`);

    }

}

/* ==========================================================================
   REFERENCES
   ========================================================================== */

function collectionRef(name) {

    return collection(db, name);

}

function documentRef(collectionName, documentId) {

    return doc(

        db,

        collectionName,

        documentId

    );

}

/* ==========================================================================
   TIMESTAMP HELPERS
   ========================================================================== */

function createPayload(data) {

    return {

        ...data,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp()

    };

}

function updatePayload(data) {

    return {

        ...data,

        updatedAt: serverTimestamp()

    };

}

/* ==========================================================================
   BASE CRUD
   ========================================================================== */

async function getDocument(collectionName, documentId) {

    try {

        required(collectionName, "Collection");

        required(documentId, "Document ID");

        const snapshot = await getDoc(

            documentRef(

                collectionName,

                documentId

            )

        );

        if (!snapshot.exists()) {

            return success(null);

        }

        return success({

            id: snapshot.id,

            ...snapshot.data()

        });

    }

    catch (error) {

        return failure(error);

    }

}

async function createDocument(

    collectionName,

    documentId,

    data

) {

    try {

        required(collectionName, "Collection");

        required(documentId, "Document ID");

        requiredObject(data, "Data");

        await setDoc(

            documentRef(

                collectionName,

                documentId

            ),

            createPayload(data)

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

async function updateDocument(

    collectionName,

    documentId,

    data

) {

    try {

        required(collectionName, "Collection");

        required(documentId, "Document ID");

        requiredObject(data, "Data");

        await updateDoc(

            documentRef(

                collectionName,

                documentId

            ),

            updatePayload(data)

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

async function deleteDocument(

    collectionName,

    documentId

) {

    try {

        required(collectionName, "Collection");

        required(documentId, "Document ID");

        await deleteDoc(

            documentRef(

                collectionName,

                documentId

            )

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

async function addDocument(

    collectionName,

    data

) {

    try {

        required(collectionName, "Collection");

        requiredObject(data, "Data");

        const ref = await addDoc(

            collectionRef(collectionName),

            createPayload(data)

        );

        return success(ref.id);

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   STUDENT REPOSITORY
   ========================================================================== */

/**
 * Get student profile
 * @param {string} uid
 */
export async function getStudent(uid) {

    required(uid, "UID");

    return await getDocument(
        COLLECTION.STUDENTS,
        uid
    );

}

/**
 * Check whether student exists
 * @param {string} uid
 */
export async function studentExists(uid) {

    required(uid, "UID");

    try {

        const snapshot = await getDoc(
            documentRef(
                COLLECTION.STUDENTS,
                uid
            )
        );

        return success(snapshot.exists());

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Create student profile
 * Called after Firebase Authentication signup.
 *
 * @param {string} uid
 * @param {Object} student
 */
export async function createStudent(uid, student) {

    required(uid, "UID");
    requiredObject(student, "Student");

    return await createDocument(

        COLLECTION.STUDENTS,

        uid,

        {

            uid,

            fullName: student.fullName ?? "",

            email: student.email ?? "",

            mobile: student.mobile ?? "",

            photoURL: student.photoURL ?? "",

            role: "student",

            status: "active",

            enrolledCourses: 0,

            completedCourses: 0,

            certificates: 0,

            totalLearningMinutes: 0,

            lastCourseId: null,

            lastLessonId: null,

            lastLogin: serverTimestamp()

        }

    );

}

/**
 * Update student profile
 * @param {string} uid
 * @param {Object} data
 */
export async function updateStudent(uid, data) {

    required(uid, "UID");
    requiredObject(data, "Data");

    return await updateDocument(

        COLLECTION.STUDENTS,

        uid,

        data

    );

}

/**
 * Delete student profile
 * @param {string} uid
 */
export async function deleteStudent(uid) {

    required(uid, "UID");

    return await deleteDocument(

        COLLECTION.STUDENTS,

        uid

    );

}

/**
 * Update last login time
 * @param {string} uid
 */
export async function updateStudentLastLogin(uid) {

    required(uid, "UID");

    return await updateDocument(

        COLLECTION.STUDENTS,

        uid,

        {

            lastLogin: serverTimestamp()

        }

    );

}

/**
 * Update student photo
 * @param {string} uid
 * @param {string} photoURL
 */
export async function updateStudentPhoto(uid, photoURL) {

    required(uid, "UID");

    return await updateDocument(

        COLLECTION.STUDENTS,

        uid,

        {

            photoURL

        }

    );

}

/**
 * Update student mobile
 * @param {string} uid
 * @param {string} mobile
 */
export async function updateStudentMobile(uid, mobile) {

    required(uid, "UID");
    required(mobile, "Mobile");

    return await updateDocument(

        COLLECTION.STUDENTS,

        uid,

        {

            mobile

        }

    );

}

/**
 * Update display name
 * @param {string} uid
 * @param {string} fullName
 */
export async function updateStudentName(uid, fullName) {

    required(uid, "UID");
    required(fullName, "Full Name");

    return await updateDocument(

        COLLECTION.STUDENTS,

        uid,

        {

            fullName

        }

    );

}

/**
 * Save current learning position
 *
 * Used by dashboard Continue Learning.
 *
 * @param {string} uid
 * @param {string} courseId
 * @param {string} lessonId
 */
export async function updateLearningPosition(
    uid,
    courseId,
    lessonId
) {

    required(uid, "UID");
    required(courseId, "Course ID");
    required(lessonId, "Lesson ID");

    return await updateDocument(

        COLLECTION.STUDENTS,

        uid,

        {

            lastCourseId: courseId,

            lastLessonId: lessonId

        }

    );

}

/**
 * Increase enrolled courses
 * @param {string} uid
 */
export async function incrementEnrolledCourses(uid) {

    required(uid, "UID");

    try {

        await updateDoc(

            documentRef(
                COLLECTION.STUDENTS,
                uid
            ),

            {

                enrolledCourses: increment(1),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Increase completed courses
 * @param {string} uid
 */
export async function incrementCompletedCourses(uid) {

    required(uid, "UID");

    try {

        await updateDoc(

            documentRef(
                COLLECTION.STUDENTS,
                uid
            ),

            {

                completedCourses: increment(1),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Increase certificate count
 * @param {string} uid
 */
export async function incrementCertificates(uid) {

    required(uid, "UID");

    try {

        await updateDoc(

            documentRef(
                COLLECTION.STUDENTS,
                uid
            ),

            {

                certificates: increment(1),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Add learning minutes
 * @param {string} uid
 * @param {number} minutes
 */
export async function addLearningMinutes(uid, minutes) {

    required(uid, "UID");

    try {

        await updateDoc(

            documentRef(
                COLLECTION.STUDENTS,
                uid
            ),

            {

                totalLearningMinutes: increment(minutes),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   COURSE REPOSITORY
   ========================================================================== */

/**
 * Get all published courses
 * Ordered by display order.
 */
export async function getCourses() {

    try {

        const q = query(

            collectionRef(COLLECTION.COURSES),

            where("status", "==", "published"),

            orderBy("order"),

            limit(QUERY_LIMIT.COURSES)

        );

        const snapshot = await getDocs(q);

        const courses = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(courses);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get all courses
 * (Admin)
 */
export async function getAllCourses() {

    try {

        const q = query(

            collectionRef(COLLECTION.COURSES),

            orderBy("order"),

            limit(QUERY_LIMIT.COURSES)

        );

        const snapshot = await getDocs(q);

        const courses = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(courses);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get single course
 */
export async function getCourse(courseId) {

    required(courseId, "Course ID");

    return await getDocument(

        COLLECTION.COURSES,

        courseId

    );

}

/**
 * Create course
 */
export async function createCourse(
    courseId,
    course
) {

    required(courseId, "Course ID");
    requiredObject(course, "Course");

    return await createDocument(

        COLLECTION.COURSES,

        courseId,

        {

            title: course.title ?? "",

            description: course.description ?? "",

            thumbnail: course.thumbnail ?? "",

            instructor: course.instructor ?? "",

            level: course.level ?? "Beginner",

            language: course.language ?? "English",

            duration: course.duration ?? "",

            price: course.price ?? 0,

            currency: course.currency ?? "INR",

            featured: false,

            status: "draft",

            order: course.order ?? 1,

            totalModules: 0,

            totalLessons: 0,

            totalStudents: 0,

            views: 0,

            rating: 0,

            reviews: 0

        }

    );

}

/**
 * Update course
 */
export async function updateCourse(
    courseId,
    data
) {

    required(courseId, "Course ID");
    requiredObject(data, "Data");

    return await updateDocument(

        COLLECTION.COURSES,

        courseId,

        data

    );

}

/**
 * Delete course
 */
export async function deleteCourse(courseId) {

    required(courseId, "Course ID");

    return await deleteDocument(

        COLLECTION.COURSES,

        courseId

    );

}

/**
 * Publish course
 */
export async function publishCourse(courseId) {

    return await updateCourse(

        courseId,

        {

            status: "published"

        }

    );

}

/**
 * Unpublish course
 */
export async function unpublishCourse(courseId) {

    return await updateCourse(

        courseId,

        {

            status: "draft"

        }

    );

}

/**
 * Mark featured
 */
export async function featureCourse(courseId) {

    return await updateCourse(

        courseId,

        {

            featured: true

        }

    );

}

/**
 * Remove featured
 */
export async function unfeatureCourse(courseId) {

    return await updateCourse(

        courseId,

        {

            featured: false

        }

    );

}

/**
 * Increase course views
 */
export async function incrementCourseViews(courseId) {

    required(courseId, "Course ID");

    try {

        await updateDoc(

            documentRef(

                COLLECTION.COURSES,

                courseId

            ),

            {

                views: increment(1),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Increase enrolled students
 */
export async function incrementCourseStudents(courseId) {

    required(courseId, "Course ID");

    try {

        await updateDoc(

            documentRef(

                COLLECTION.COURSES,

                courseId

            ),

            {

                totalStudents: increment(1),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Update course rating
 */
export async function updateCourseRating(
    courseId,
    rating,
    reviews
) {

    required(courseId, "Course ID");

    return await updateCourse(

        courseId,

        {

            rating,

            reviews

        }

    );

}

/**
 * Increase total modules
 */
export async function incrementModuleCount(courseId) {

    required(courseId, "Course ID");

    try {

        await updateDoc(

            documentRef(

                COLLECTION.COURSES,

                courseId

            ),

            {

                totalModules: increment(1),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Increase total lessons
 */
export async function incrementLessonCount(courseId) {

    required(courseId, "Course ID");

    try {

        await updateDoc(

            documentRef(

                COLLECTION.COURSES,

                courseId

            ),

            {

                totalLessons: increment(1),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   MODULE REPOSITORY
   ========================================================================== */

/**
 * Get modules by course
 *
 * @param {string} courseId
 * @returns {Promise<Object>}
 */
export async function getModules(courseId) {

    required(courseId, "Course ID");

    try {

        const q = query(

            collectionRef(COLLECTION.MODULES),

            where("courseId", "==", courseId),

            orderBy("order"),

            limit(QUERY_LIMIT.MODULES)

        );

        const snapshot = await getDocs(q);

        const modules = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(modules);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get single module
 */
export async function getModule(moduleId) {

    required(moduleId, "Module ID");

    return await getDocument(

        COLLECTION.MODULES,

        moduleId

    );

}

/**
 * Create module
 */
export async function createModule(
    moduleId,
    module
) {

    required(moduleId, "Module ID");
    requiredObject(module, "Module");

    const payload = {

        courseId: module.courseId,

        title: module.title ?? "",

        description: module.description ?? "",

        thumbnail: module.thumbnail ?? "",

        order: module.order ?? 1,

        duration: module.duration ?? "",

        totalLessons: 0,

        status: module.status ?? "published"

    };

    return await createDocument(

        COLLECTION.MODULES,

        moduleId,

        payload

    );

}

/**
 * Update module
 */
export async function updateModule(
    moduleId,
    data
) {

    required(moduleId, "Module ID");
    requiredObject(data, "Data");

    return await updateDocument(

        COLLECTION.MODULES,

        moduleId,

        data

    );

}

/**
 * Delete module
 */
export async function deleteModule(moduleId) {

    required(moduleId, "Module ID");

    return await deleteDocument(

        COLLECTION.MODULES,

        moduleId

    );

}

/**
 * Publish module
 */
export async function publishModule(moduleId) {

    return await updateModule(

        moduleId,

        {

            status: "published"

        }

    );

}

/**
 * Hide module
 */
export async function hideModule(moduleId) {

    return await updateModule(

        moduleId,

        {

            status: "hidden"

        }

    );

}

/**
 * Increment lesson count
 */
export async function incrementModuleLessons(moduleId) {

    required(moduleId, "Module ID");

    try {

        await updateDoc(

            documentRef(

                COLLECTION.MODULES,

                moduleId

            ),

            {

                totalLessons: increment(1),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Reorder module
 */
export async function updateModuleOrder(
    moduleId,
    order
) {

    required(moduleId, "Module ID");

    return await updateModule(

        moduleId,

        {

            order

        }

    );

}

/**
 * Get first module of a course
 */
export async function getFirstModule(courseId) {

    required(courseId, "Course ID");

    try {

        const q = query(

            collectionRef(COLLECTION.MODULES),

            where("courseId", "==", courseId),

            orderBy("order"),

            limit(1)

        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            return success(null);

        }

        const document = snapshot.docs[0];

        return success({

            id: document.id,

            ...document.data()

        });

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get published modules only
 */
export async function getPublishedModules(courseId) {

    required(courseId, "Course ID");

    try {

        const q = query(

            collectionRef(COLLECTION.MODULES),

            where("courseId", "==", courseId),

            where("status", "==", "published"),

            orderBy("order"),

            limit(QUERY_LIMIT.MODULES)

        );

        const snapshot = await getDocs(q);

        const modules = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(modules);

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   LESSON REPOSITORY
   ========================================================================== */

/**
 * Get lessons by module
 *
 * @param {string} moduleId
 * @returns {Promise<Object>}
 */
export async function getLessons(moduleId) {

    required(moduleId, "Module ID");

    try {

        const q = query(

            collectionRef(COLLECTION.LESSONS),

            where("moduleId", "==", moduleId),

            orderBy("order"),

            limit(QUERY_LIMIT.LESSONS)

        );

        const snapshot = await getDocs(q);

        const lessons = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(lessons);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get single lesson
 */
export async function getLesson(lessonId) {

    required(lessonId, "Lesson ID");

    return await getDocument(

        COLLECTION.LESSONS,

        lessonId

    );

}

/**
 * Create lesson
 */
export async function createLesson(
    lessonId,
    lesson
) {

    required(lessonId, "Lesson ID");
    requiredObject(lesson, "Lesson");

    const payload = {

        courseId: lesson.courseId,

        moduleId: lesson.moduleId,

        title: lesson.title ?? "",

        description: lesson.description ?? "",

        videoUrl: lesson.videoUrl ?? "",

        pdfUrl: lesson.pdfUrl ?? "",

        thumbnail: lesson.thumbnail ?? "",

        duration: lesson.duration ?? "",

        lessonType: lesson.lessonType ?? "video",

        isPreview: lesson.isPreview ?? false,

        order: lesson.order ?? 1,

        views: 0,

        status: lesson.status ?? "published"

    };

    return await createDocument(

        COLLECTION.LESSONS,

        lessonId,

        payload

    );

}

/**
 * Update lesson
 */
export async function updateLesson(
    lessonId,
    data
) {

    required(lessonId, "Lesson ID");
    requiredObject(data, "Data");

    return await updateDocument(

        COLLECTION.LESSONS,

        lessonId,

        data

    );

}

/**
 * Delete lesson
 */
export async function deleteLesson(lessonId) {

    required(lessonId, "Lesson ID");

    return await deleteDocument(

        COLLECTION.LESSONS,

        lessonId

    );

}

/**
 * Publish lesson
 */
export async function publishLesson(lessonId) {

    return await updateLesson(

        lessonId,

        {

            status: "published"

        }

    );

}

/**
 * Hide lesson
 */
export async function hideLesson(lessonId) {

    return await updateLesson(

        lessonId,

        {

            status: "hidden"

        }

    );

}

/**
 * Increase lesson views
 */
export async function incrementLessonViews(lessonId) {

    required(lessonId, "Lesson ID");

    try {

        await updateDoc(

            documentRef(

                COLLECTION.LESSONS,

                lessonId

            ),

            {

                views: increment(1),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Update lesson order
 */
export async function updateLessonOrder(
    lessonId,
    order
) {

    required(lessonId, "Lesson ID");

    return await updateLesson(

        lessonId,

        {

            order

        }

    );

}

/**
 * Get first lesson in module
 */
export async function getFirstLesson(moduleId) {

    required(moduleId, "Module ID");

    try {

        const q = query(

            collectionRef(COLLECTION.LESSONS),

            where("moduleId", "==", moduleId),

            orderBy("order"),

            limit(1)

        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            return success(null);

        }

        const document = snapshot.docs[0];

        return success({

            id: document.id,

            ...document.data()

        });

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get next lesson
 */
export async function getNextLesson(
    moduleId,
    currentOrder
) {

    required(moduleId, "Module ID");

    try {

        const q = query(

            collectionRef(COLLECTION.LESSONS),

            where("moduleId", "==", moduleId),

            where("order", ">", currentOrder),

            orderBy("order"),

            limit(1)

        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            return success(null);

        }

        const document = snapshot.docs[0];

        return success({

            id: document.id,

            ...document.data()

        });

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get previous lesson
 */
export async function getPreviousLesson(
    moduleId,
    currentOrder
) {

    required(moduleId, "Module ID");

    try {

        const q = query(

            collectionRef(COLLECTION.LESSONS),

            where("moduleId", "==", moduleId),

            where("order", "<", currentOrder),

            orderBy("order", "desc"),

            limit(1)

        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            return success(null);

        }

        const document = snapshot.docs[0];

        return success({

            id: document.id,

            ...document.data()

        });

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   ENROLLMENT REPOSITORY
   ========================================================================== */

/**
 * Get enrollment document reference
 */
function enrollmentRef(uid, courseId) {

    return doc(
        db,
        COLLECTION.STUDENT_COURSES,
        uid,
        "enrollments",
        courseId
    );

}

/**
 * Get enrollment
 */
export async function getEnrollment(uid, courseId) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        const snapshot = await getDoc(
            enrollmentRef(uid, courseId)
        );

        if (!snapshot.exists()) {

            return success(null);

        }

        return success({

            id: snapshot.id,

            ...snapshot.data()

        });

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Check enrollment
 */
export async function isEnrolled(uid, courseId) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        const snapshot = await getDoc(
            enrollmentRef(uid, courseId)
        );

        return success(snapshot.exists());

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Enroll student
 */
export async function enrollCourse(uid, courseId) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        await setDoc(

            enrollmentRef(uid, courseId),

            {

                uid,

                courseId,

                progress: 0,

                completed: false,

                certificateIssued: false,

                currentModuleId: null,

                currentLessonId: null,

                completedLessons: [],

                enrolledAt: serverTimestamp(),

                updatedAt: serverTimestamp()

            }

        );

        await incrementEnrolledCourses(uid);

        await incrementCourseStudents(courseId);

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Update current lesson
 */
export async function updateCurrentLesson(
    uid,
    courseId,
    moduleId,
    lessonId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        await updateDoc(

            enrollmentRef(uid, courseId),

            {

                currentModuleId: moduleId,

                currentLessonId: lessonId,

                updatedAt: serverTimestamp()

            }

        );

        await updateLearningPosition(

            uid,

            courseId,

            lessonId

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Update course progress
 */
export async function updateCourseProgress(
    uid,
    courseId,
    progress
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        await updateDoc(

            enrollmentRef(uid, courseId),

            {

                progress,

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Complete course
 */
export async function completeCourse(
    uid,
    courseId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        await updateDoc(

            enrollmentRef(uid, courseId),

            {

                completed: true,

                progress: 100,

                completedAt: serverTimestamp(),

                updatedAt: serverTimestamp()

            }

        );

        await incrementCompletedCourses(uid);

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Mark lesson completed (Atomic)
 */
export async function completeLesson(
    uid,
    courseId,
    lessonId
) {

    required(uid, "UID");
    required(courseId, "Course ID");
    required(lessonId, "Lesson ID");

    try {

        await updateDoc(

            enrollmentRef(uid, courseId),

            {

                completedLessons: arrayUnion(lessonId),

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get all enrollments for a student
 */
export async function getStudentEnrollments(uid) {

    required(uid, "UID");

    try {

        const snapshot = await getDocs(

            collection(

                db,

                COLLECTION.STUDENT_COURSES,

                uid,

                "enrollments"

            )

        );

        const enrollments = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(enrollments);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Remove enrollment
 */
export async function removeEnrollment(
    uid,
    courseId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        await deleteDoc(
            enrollmentRef(uid, courseId)
        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   PROGRESS REPOSITORY
   ========================================================================== */

/**
 * Calculate course progress percentage
 *
 * @param {number} completedLessons
 * @param {number} totalLessons
 * @returns {number}
 */
export function calculateProgress(
    completedLessons,
    totalLessons
) {

    if (totalLessons <= 0) {

        return 0;

    }

    const percentage = Math.round(

        (completedLessons / totalLessons) * 100

    );

    return Math.min(100, Math.max(0, percentage));

}

/**
 * Get completed lesson count
 */
export async function getCompletedLessonCount(
    uid,
    courseId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        const enrollment = await getEnrollment(

            uid,
            courseId

        );

        if (!enrollment.success || !enrollment.data) {

            return success(0);

        }

        const completed = Array.isArray(
            enrollment.data.completedLessons
        )
            ? enrollment.data.completedLessons.length
            : 0;

        return success(completed);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Refresh enrollment progress
 */
export async function refreshCourseProgress(
    uid,
    courseId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        const enrollmentResult =
            await getEnrollment(uid, courseId);

        if (

            !enrollmentResult.success ||

            !enrollmentResult.data

        ) {

            return failure(
                new Error("Enrollment not found.")
            );

        }

        const enrollment = enrollmentResult.data;

        const lessonsQuery = query(

            collectionRef(COLLECTION.LESSONS),

            where("courseId", "==", courseId)

        );

        const lessonSnapshot = await getDocs(

            lessonsQuery

        );

        const totalLessons = lessonSnapshot.size;

        const completedLessons = Array.isArray(

            enrollment.completedLessons

        )
            ? enrollment.completedLessons.length
            : 0;

        const progress = calculateProgress(

            completedLessons,

            totalLessons

        );

        await updateDoc(

            enrollmentRef(uid, courseId),

            {

                progress,

                totalLessons,

                completedLessonCount:
                    completedLessons,

                updatedAt: serverTimestamp()

            }

        );

        return success({

            progress,

            totalLessons,

            completedLessons

        });

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get progress percentage
 */
export async function getCourseProgress(
    uid,
    courseId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        const enrollment = await getEnrollment(

            uid,

            courseId

        );

        if (

            !enrollment.success ||

            !enrollment.data

        ) {

            return success(0);

        }

        return success(

            enrollment.data.progress ?? 0

        );

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Check course completion
 */
export async function isCourseCompleted(
    uid,
    courseId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        const enrollment = await getEnrollment(

            uid,

            courseId

        );

        if (

            !enrollment.success ||

            !enrollment.data

        ) {

            return success(false);

        }

        return success(

            enrollment.data.completed === true

        );

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Continue Learning
 *
 * Returns the last saved module and lesson.
 */
export async function getContinueLearning(
    uid,
    courseId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        const enrollment = await getEnrollment(

            uid,

            courseId

        );

        if (

            !enrollment.success ||

            !enrollment.data

        ) {

            return success(null);

        }

        return success({

            moduleId:
                enrollment.data.currentModuleId,

            lessonId:
                enrollment.data.currentLessonId,

            progress:
                enrollment.data.progress ?? 0

        });

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Reset course progress
 *
 * Admin utility.
 */
export async function resetCourseProgress(
    uid,
    courseId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        await updateDoc(

            enrollmentRef(uid, courseId),

            {

                progress: 0,

                completed: false,

                completedLessons: [],

                completedLessonCount: 0,

                certificateIssued: false,

                currentModuleId: null,

                currentLessonId: null,

                updatedAt: serverTimestamp()

            }

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   CERTIFICATE REPOSITORY
   ========================================================================== */

/**
 * Get certificate document reference
 */
function certificateRef(certificateId) {

    return documentRef(
        COLLECTION.CERTIFICATES,
        certificateId
    );

}

/**
 * Get certificate by ID
 *
 * @param {string} certificateId
 */
export async function getCertificate(certificateId) {

    required(certificateId, "Certificate ID");

    return await getDocument(

        COLLECTION.CERTIFICATES,

        certificateId

    );

}

/**
 * Get certificates for a student
 *
 * @param {string} uid
 */
export async function getStudentCertificates(uid) {

    required(uid, "UID");

    try {

        const q = query(

            collectionRef(COLLECTION.CERTIFICATES),

            where("uid", "==", uid),

            orderBy("issuedAt", "desc")

        );

        const snapshot = await getDocs(q);

        const certificates = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(certificates);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Check if certificate exists
 *
 * @param {string} uid
 * @param {string} courseId
 */
export async function hasCertificate(uid, courseId) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        const q = query(

            collectionRef(COLLECTION.CERTIFICATES),

            where("uid", "==", uid),

            where("courseId", "==", courseId),

            limit(1)

        );

        const snapshot = await getDocs(q);

        return success(!snapshot.empty);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Issue certificate
 *
 * @param {Object} certificate
 */
export async function issueCertificate(certificate) {

    requiredObject(certificate, "Certificate");

    try {

        const exists = await hasCertificate(

            certificate.uid,

            certificate.courseId

        );

        if (exists.success && exists.data) {

            return failure(

                new Error("Certificate already exists.")

            );

        }

        const certificateId = await addDocument(

            COLLECTION.CERTIFICATES,

            {
    uid: certificate.uid,
    studentId: certificate.uid,

    courseId: certificate.courseId,

    studentName: certificate.studentName ?? "",

    studentEmail: certificate.studentEmail ?? "",

    courseTitle: certificate.courseTitle ?? "",

    certificateId:
        certificate.certificateNo ??
        `ISSA-${Date.now()}`,

    certificateUrl:
        certificate.certificateUrl ?? "",

    percentage:
        certificate.percentage ?? 100,

    issueDate:
        new Date().toLocaleDateString(),

    issuedAt: Timestamp.now()
}

        );

        await updateDoc(

            enrollmentRef(

                certificate.uid,

                certificate.courseId

            ),

            {

                certificateIssued: true,

                updatedAt: serverTimestamp()

            }

        );

        await incrementCertificates(

            certificate.uid

        );

        return success(certificateId.data);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Delete certificate
 *
 * @param {string} certificateId
 */
export async function deleteCertificate(certificateId) {

    required(certificateId, "Certificate ID");

    return await deleteDocument(

        COLLECTION.CERTIFICATES,

        certificateId

    );

}

/**
 * Update certificate URL
 *
 * @param {string} certificateId
 * @param {string} certificateUrl
 */
export async function updateCertificateUrl(
    certificateId,
    certificateUrl
) {

    required(certificateId, "Certificate ID");
    required(certificateUrl, "Certificate URL");

    return await updateDocument(

        COLLECTION.CERTIFICATES,

        certificateId,

        {

            certificateUrl

        }

    );

}

/**
 * Get latest certificate
 *
 * @param {string} uid
 */
export async function getLatestCertificate(uid) {

    required(uid, "UID");

    try {

        const q = query(

            collectionRef(COLLECTION.CERTIFICATES),

            where("uid", "==", uid),

            orderBy("issuedAt", "desc"),

            limit(1)

        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            return success(null);

        }

        const document = snapshot.docs[0];

        return success({

            id: document.id,

            ...document.data()

        });

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   PAYMENT REPOSITORY
   ========================================================================== */

/**
 * Get payment by ID
 *
 * @param {string} paymentId
 */
export async function getPayment(paymentId) {

    required(paymentId, "Payment ID");

    return await getDocument(

        COLLECTION.PAYMENTS,

        paymentId

    );

}

/**
 * Create payment
 *
 * @param {Object} payment
 */
export async function createPayment(payment) {

    requiredObject(payment, "Payment");

    return await addDocument(

        COLLECTION.PAYMENTS,

        {

            uid: payment.uid,

            courseId: payment.courseId,

            studentName: payment.studentName ?? "",

            studentEmail: payment.studentEmail ?? "",

            amount: payment.amount ?? 0,

            currency: payment.currency ?? "INR",

            paymentMethod: payment.paymentMethod ?? "",

            transactionId: payment.transactionId ?? "",

            gateway: payment.gateway ?? "",

            status: payment.status ?? "pending",

            paidAt: null

        }

    );

}

/**
 * Update payment
 */
export async function updatePayment(
    paymentId,
    data
) {

    required(paymentId, "Payment ID");
    requiredObject(data, "Data");

    return await updateDocument(

        COLLECTION.PAYMENTS,

        paymentId,

        data

    );

}

/**
 * Mark payment successful
 */
export async function markPaymentSuccess(
    paymentId
) {

    required(paymentId, "Payment ID");

    return await updateDocument(

        COLLECTION.PAYMENTS,

        paymentId,

        {

            status: "success",

            paidAt: serverTimestamp()

        }

    );

}

/**
 * Mark payment failed
 */
export async function markPaymentFailed(
    paymentId
) {

    required(paymentId, "Payment ID");

    return await updateDocument(

        COLLECTION.PAYMENTS,

        paymentId,

        {

            status: "failed"

        }

    );

}

/**
 * Refund payment
 */
export async function refundPayment(
    paymentId
) {

    required(paymentId, "Payment ID");

    return await updateDocument(

        COLLECTION.PAYMENTS,

        paymentId,

        {

            status: "refunded",

            refundedAt: serverTimestamp()

        }

    );

}

/**
 * Get payments by student
 */
export async function getStudentPayments(uid) {

    required(uid, "UID");

    try {

        const q = query(

            collectionRef(COLLECTION.PAYMENTS),

            where("uid", "==", uid),

            orderBy("createdAt", "desc")

        );

        const snapshot = await getDocs(q);

        const payments = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(payments);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get course payments
 * (Admin)
 */
export async function getCoursePayments(courseId) {

    required(courseId, "Course ID");

    try {

        const q = query(

            collectionRef(COLLECTION.PAYMENTS),

            where("courseId", "==", courseId),

            orderBy("createdAt", "desc")

        );

        const snapshot = await getDocs(q);

        const payments = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(payments);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Verify purchase
 */
export async function hasPurchasedCourse(
    uid,
    courseId
) {

    required(uid, "UID");
    required(courseId, "Course ID");

    try {

        const q = query(

            collectionRef(COLLECTION.PAYMENTS),

            where("uid", "==", uid),

            where("courseId", "==", courseId),

            where("status", "==", "success"),

            limit(1)

        );

        const snapshot = await getDocs(q);

        return success(!snapshot.empty);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get latest successful payment
 */
export async function getLatestPayment(uid) {

    required(uid, "UID");

    try {

        const q = query(

            collectionRef(COLLECTION.PAYMENTS),

            where("uid", "==", uid),

            where("status", "==", "success"),

            orderBy("paidAt", "desc"),

            limit(1)

        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            return success(null);

        }

        const document = snapshot.docs[0];

        return success({

            id: document.id,

            ...document.data()

        });

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Delete payment
 * (Admin)
 */
export async function deletePayment(paymentId) {

    required(paymentId, "Payment ID");

    return await deleteDocument(

        COLLECTION.PAYMENTS,

        paymentId

    );

}

/* ==========================================================================
   REVIEWS REPOSITORY
   ========================================================================== */

/**
 * Get reviews for a course
 *
 * @param {string} courseId
 */
export async function getCourseReviews(courseId) {

    required(courseId, "Course ID");

    try {

        const q = query(

            collectionRef(COLLECTION.REVIEWS),

            where("courseId", "==", courseId),

            where("status", "==", "published"),

            orderBy("createdAt", "desc"),

            limit(QUERY_LIMIT.REVIEWS)

        );

        const snapshot = await getDocs(q);

        const reviews = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(reviews);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Create review
 */
export async function createReview(review) {

    requiredObject(review, "Review");

    return await addDocument(

        COLLECTION.REVIEWS,

        {

            uid: review.uid,

            courseId: review.courseId,

            studentName: review.studentName ?? "",

            rating: review.rating ?? 5,

            review: review.review ?? "",

            status: "pending"

        }

    );

}

/**
 * Publish review
 */
export async function publishReview(reviewId) {

    required(reviewId, "Review ID");

    return await updateDocument(

        COLLECTION.REVIEWS,

        reviewId,

        {

            status: "published"

        }

    );

}

/**
 * Hide review
 */
export async function hideReview(reviewId) {

    required(reviewId, "Review ID");

    return await updateDocument(

        COLLECTION.REVIEWS,

        reviewId,

        {

            status: "hidden"

        }

    );

}

/**
 * Delete review
 */
export async function deleteReview(reviewId) {

    required(reviewId, "Review ID");

    return await deleteDocument(

        COLLECTION.REVIEWS,

        reviewId

    );

}

/* ==========================================================================
   ANNOUNCEMENT REPOSITORY
   ========================================================================== */

/**
 * Get published announcements
 */
export async function getAnnouncements() {

    try {

        const q = query(

            collectionRef(COLLECTION.ANNOUNCEMENTS),

            where("status", "==", "published"),

            orderBy("createdAt", "desc"),

            limit(QUERY_LIMIT.ANNOUNCEMENTS)

        );

        const snapshot = await getDocs(q);

        const announcements = snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

        return success(announcements);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Get announcement
 */
export async function getAnnouncement(announcementId) {

    required(announcementId, "Announcement ID");

    return await getDocument(

        COLLECTION.ANNOUNCEMENTS,

        announcementId

    );

}

/**
 * Create announcement
 */
export async function createAnnouncement(announcement) {

    requiredObject(announcement, "Announcement");

    return await addDocument(

        COLLECTION.ANNOUNCEMENTS,

        {

            title: announcement.title ?? "",

            message: announcement.message ?? "",

            courseId: announcement.courseId ?? null,

            priority: announcement.priority ?? "normal",

            status: "published"

        }

    );

}

/**
 * Update announcement
 */
export async function updateAnnouncement(
    announcementId,
    data
) {

    required(announcementId, "Announcement ID");
    requiredObject(data, "Data");

    return await updateDocument(

        COLLECTION.ANNOUNCEMENTS,

        announcementId,

        data

    );

}

/**
 * Publish announcement
 */
export async function publishAnnouncement(
    announcementId
) {

    return await updateAnnouncement(

        announcementId,

        {

            status: "published"

        }

    );

}

/**
 * Hide announcement
 */
export async function hideAnnouncement(
    announcementId
) {

    return await updateAnnouncement(

        announcementId,

        {

            status: "hidden"

        }

    );

}

/**
 * Delete announcement
 */
export async function deleteAnnouncement(
    announcementId
) {

    required(announcementId, "Announcement ID");

    return await deleteDocument(

        COLLECTION.ANNOUNCEMENTS,

        announcementId

    );

}

/* ==========================================================================
   ADMIN UTILITIES
   ========================================================================== */

/**
 * Batch publish courses
 *
 * @param {string[]} courseIds
 */
export async function batchPublishCourses(courseIds) {

    requiredObject(courseIds, "Course IDs");

    try {

        const batch = writeBatch(db);

        courseIds.forEach(courseId => {

            batch.update(

                documentRef(
                    COLLECTION.COURSES,
                    courseId
                ),

                {

                    status: "published",

                    updatedAt: serverTimestamp()

                }

            );

        });

        await batch.commit();

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Batch hide courses
 */
export async function batchHideCourses(courseIds) {

    requiredObject(courseIds, "Course IDs");

    try {

        const batch = writeBatch(db);

        courseIds.forEach(courseId => {

            batch.update(

                documentRef(
                    COLLECTION.COURSES,
                    courseId
                ),

                {

                    status: "draft",

                    updatedAt: serverTimestamp()

                }

            );

        });

        await batch.commit();

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/**
 * Batch delete lessons
 */
export async function batchDeleteLessons(lessonIds) {

    requiredObject(lessonIds, "Lesson IDs");

    try {

        const batch = writeBatch(db);

        lessonIds.forEach(lessonId => {

            batch.delete(

                documentRef(

                    COLLECTION.LESSONS,

                    lessonId

                )

            );

        });

        await batch.commit();

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   TRANSACTIONS
   ========================================================================== */

/**
 * Increment course views safely
 */
export async function transactionIncrementCourseViews(courseId) {

    required(courseId, "Course ID");

    try {

        await runTransaction(db, async transaction => {

            const reference = documentRef(

                COLLECTION.COURSES,

                courseId

            );

            const snapshot = await transaction.get(reference);

            if (!snapshot.exists()) {

                throw new Error("Course not found.");

            }

            const currentViews = snapshot.data().views || 0;

            transaction.update(reference, {

                views: currentViews + 1,

                updatedAt: serverTimestamp()

            });

        });

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   DATABASE HEALTH
   ========================================================================== */

/**
 * Check Firestore connectivity
 */
export async function pingFirestore() {

    try {

        await getDocs(

            query(

                collectionRef(COLLECTION.COURSES),

                limit(1)

            )

        );

        return success(true);

    }

    catch (error) {

        return failure(error);

    }

}

/* ==========================================================================
   EXPORT DATABASE
   ========================================================================== */

export {

    db,

    documentRef,

    collectionRef,

    getDocument,

    createDocument,

    updateDocument,

    deleteDocument,

    addDocument

};

/* ==========================================================================
   COMPATIBILITY FUNCTIONS
   DO NOT REMOVE
   ========================================================================== */

/**
 * Compatibility alias
 */
export async function getCourseModules(courseId) {

    return await getModules(courseId);

}

/**
 * Compatibility alias
 */
export async function getModuleLessons(moduleId) {

    return await getLessons(moduleId);

}

/**
 * Compatibility alias
 */
export async function getLastWatchedLesson(uid, courseId) {

    return await getContinueLearning(

        uid,

        courseId

    );

}

/**
 * Compatibility alias
 */
export async function updateLessonProgress(

    uid,

    courseId,

    lessonId

) {

    const enrollment = await getEnrollment(

        uid,

        courseId

    );

    if (

        !enrollment.success ||

        !enrollment.data

    ) {

        return enrollment;

    }

    return await completeLesson(

        uid,

        courseId,

        lessonId

    );

}

/**
 * Compatibility alias
 */
export async function saveStudentNotes(

    uid,

    lessonId,

    notes

) {

    console.log(

        "Notes Saved",

        uid,

        lessonId,

        notes

    );

    return {

        success: true,

        data: true

    };

}

/**
 * Compatibility alias
 */
export async function getStudentNotes(

    uid,

    lessonId

) {

    return {

        success: true,

        data: {

            notes: ""

        }

    };

}