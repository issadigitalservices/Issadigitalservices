"use strict";

/* ==========================================================================
   ISSA Academy
   Progress Service
   Version : 1.0.0
   ==========================================================================
   PURPOSE
   --------------------------------------------------------------------------
   LMS Business Logic

   This file NEVER communicates with Firestore directly.

   It ONLY uses firestore-service.js.

   Responsibilities

   ✓ Lesson Progress
   ✓ Continue Learning
   ✓ Course Completion
   ✓ Progress Percentage
   ✓ Unlock Logic
   ✓ Dashboard Statistics
   ✓ Certificate Eligibility
   ========================================================================== */

import {

    getEnrollment,

    updateCourseProgress,

    completeLesson,

    completeCourse,

    refreshCourseProgress,

    getCourseProgress,

    getContinueLearning,

    isCourseCompleted,

    getLesson,

    getLessons,

    getModules

} from "../core/firestore-service.js";

/* ==========================================================================
   LOCAL STORAGE KEYS
   ========================================================================== */

const STORAGE = Object.freeze({

    LAST_COURSE: "issa_last_course",

    LAST_LESSON: "issa_last_lesson",

    LAST_MODULE: "issa_last_module",

    LAST_PROGRESS: "issa_last_progress"

});

/* ==========================================================================
   LOCAL CACHE
   ========================================================================== */

const memoryCache = {

    enrollment: null,

    modules: [],

    lessons: [],

    progress: 0

};

/* ==========================================================================
   LOCAL STORAGE HELPERS
   ========================================================================== */

function save(key, value) {

    localStorage.setItem(

        key,

        JSON.stringify(value)

    );

}

function load(key) {

    const value = localStorage.getItem(key);

    if (!value) {

        return null;

    }

    return JSON.parse(value);

}

function remove(key) {

    localStorage.removeItem(key);

}

/* ==========================================================================
   CACHE HELPERS
   ========================================================================== */

function clearMemoryCache() {

    memoryCache.enrollment = null;

    memoryCache.modules = [];

    memoryCache.lessons = [];

    memoryCache.progress = 0;

}

/* ==========================================================================
   CONTINUE LEARNING
   ========================================================================== */

/**
 * Save current lesson
 */
export function saveContinueLearning(

    courseId,

    moduleId,

    lessonId

) {

    save(

        STORAGE.LAST_COURSE,

        courseId

    );

    save(

        STORAGE.LAST_MODULE,

        moduleId

    );

    save(

        STORAGE.LAST_LESSON,

        lessonId

    );

}

/**
 * Load continue learning
 */
export function loadContinueLearning() {

    return {

        courseId: load(

            STORAGE.LAST_COURSE

        ),

        moduleId: load(

            STORAGE.LAST_MODULE

        ),

        lessonId: load(

            STORAGE.LAST_LESSON

        )

    };

}

/* ==========================================================================
   PROGRESS
   ========================================================================== */

/**
 * Save latest progress locally.
 */
export function cacheProgress(progress) {

    memoryCache.progress = progress;

    save(

        STORAGE.LAST_PROGRESS,

        progress

    );

}

/**
 * Get cached progress
 */
export function getCachedProgress() {

    if (

        memoryCache.progress > 0

    ) {

        return memoryCache.progress;

    }

    return load(

        STORAGE.LAST_PROGRESS

    ) || 0;

}

/**
 * Reset local progress
 */
export function resetLocalProgress() {

    remove(

        STORAGE.LAST_PROGRESS

    );

    remove(

        STORAGE.LAST_COURSE

    );

    remove(

        STORAGE.LAST_MODULE

    );

    remove(

        STORAGE.LAST_LESSON

    );

    clearMemoryCache();

}

/* ==========================================================================
   LESSON COMPLETION
   ========================================================================== */

/**
 * Mark a lesson as completed and refresh progress.
 *
 * @param {string} uid
 * @param {string} courseId
 * @param {string} lessonId
 * @returns {Promise<Object>}
 */
export async function completeCourseLesson(
    uid,
    courseId,
    lessonId
) {

    try {

        const completeResult = await completeLesson(

            uid,

            courseId,

            lessonId

        );

        if (!completeResult.success) {

            return completeResult;

        }

        const progressResult = await refreshCourseProgress(

            uid,

            courseId

        );

        if (!progressResult.success) {

            return progressResult;

        }

        const progress = progressResult.data.progress ?? 0;

        cacheProgress(progress);

        return {

            success: true,

            data: progressResult.data,

            error: null

        };

    }

    catch (error) {

        return {

            success: false,

            data: null,

            error: error.message

        };

    }

}

/* ==========================================================================
   PROGRESS
   ========================================================================== */

/**
 * Load latest progress from Firestore.
 *
 * @param {string} uid
 * @param {string} courseId
 */
export async function loadProgress(
    uid,
    courseId
) {

    const result = await getCourseProgress(

        uid,

        courseId

    );

    if (

        result.success

    ) {

        cacheProgress(result.data);

    }

    return result;

}

/**
 * Refresh and return latest progress.
 */
export async function refreshProgress(
    uid,
    courseId
) {

    const result = await refreshCourseProgress(

        uid,

        courseId

    );

    if (

        result.success

    ) {

        cacheProgress(

            result.data.progress

        );

    }

    return result;

}

/**
 * Get enrollment information.
 */
export async function getEnrollmentInfo(
    uid,
    courseId
) {

    const result = await getEnrollment(

        uid,

        courseId

    );

    if (

        result.success

    ) {

        memoryCache.enrollment = result.data;

    }

    return result;

}

/**
 * Get progress percentage.
 */
export async function getProgressPercentage(
    uid,
    courseId
) {

    const result = await loadProgress(

        uid,

        courseId

    );

    if (

        !result.success

    ) {

        return 0;

    }

    return result.data;

}

/**
 * Check whether progress reached 100%.
 */
export async function isProgressComplete(
    uid,
    courseId
) {

    const result = await getCourseProgress(

        uid,

        courseId

    );

    if (

        !result.success

    ) {

        return false;

    }

    return result.data >= 100;

}

/**
 * Get local cached progress.
 */
export function getLocalProgress() {

    return getCachedProgress();

}

/* ==========================================================================
   DASHBOARD
   ========================================================================== */

/**
 * Dashboard progress card.
 */
export async function getDashboardProgress(
    uid,
    courseId
) {

    const progress = await getCourseProgress(

        uid,

        courseId

    );

    const enrollment = await getEnrollment(

        uid,

        courseId

    );

    if (

        !progress.success ||

        !enrollment.success

    ) {

        return {

            success: false,

            data: null

        };

    }

    return {

        success: true,

        data: {

            progress:

                progress.data,

            completed:

                enrollment.data.completed,

            currentLesson:

                enrollment.data.currentLessonId,

            currentModule:

                enrollment.data.currentModuleId

        }

    };

}

/* ==========================================================================
   LESSON NAVIGATION & UNLOCK ENGINE
   ========================================================================== */

/**
 * Get complete course structure.
 *
 * Returns modules with their lessons.
 *
 * @param {string} courseId
 * @returns {Promise<Object>}
 */
export async function getCourseStructure(courseId) {

    try {

        const modulesResult = await getModules(courseId);

        if (!modulesResult.success) {

            return modulesResult;

        }

        const modules = modulesResult.data;

        for (const module of modules) {

            const lessonsResult = await getLessons(module.id);

            module.lessons = lessonsResult.success
                ? lessonsResult.data
                : [];

        }

        return {

            success: true,

            data: modules,

            error: null

        };

    }

    catch (error) {

        return {

            success: false,

            data: null,

            error: error.message

        };

    }

}

/**
 * Find lesson index.
 */
function findLessonIndex(lessons, lessonId) {

    return lessons.findIndex(

        lesson => lesson.id === lessonId

    );

}

/**
 * Get next lesson in current module.
 */
export function getNextLessonFromList(
    lessons,
    currentLessonId
) {

    const index = findLessonIndex(

        lessons,

        currentLessonId

    );

    if (

        index === -1 ||

        index >= lessons.length - 1

    ) {

        return null;

    }

    return lessons[index + 1];

}

/**
 * Get previous lesson in current module.
 */
export function getPreviousLessonFromList(
    lessons,
    currentLessonId
) {

    const index = findLessonIndex(

        lessons,

        currentLessonId

    );

    if (index <= 0) {

        return null;

    }

    return lessons[index - 1];

}

/**
 * Check whether lesson is unlocked.
 *
 * Rule:
 * First lesson is always unlocked.
 * Remaining lessons require previous lesson completion.
 */
export function isLessonUnlocked(
    lessons,
    completedLessons,
    lessonId
) {

    const index = findLessonIndex(

        lessons,

        lessonId

    );

    if (index <= 0) {

        return true;

    }

    const previousLesson = lessons[index - 1];

    return completedLessons.includes(

        previousLesson.id

    );

}

/**
 * Resume course.
 */
export async function resumeCourse(
    uid,
    courseId
) {

    const result = await getContinueLearning(

        uid,

        courseId

    );

    if (

        !result.success ||

        !result.data

    ) {

        return result;

    }

    return {

        success: true,

        data: {

            moduleId:

                result.data.moduleId,

            lessonId:

                result.data.lessonId,

            progress:

                result.data.progress

        },

        error: null

    };

}

/**
 * Load lesson details.
 */
export async function loadLesson(
    lessonId
) {

    return await getLesson(

        lessonId

    );

}

/**
 * Build lesson navigation model.
 */
export function buildLessonNavigation(
    lessons,
    currentLessonId,
    completedLessons = []
) {

    const previousLesson =
        getPreviousLessonFromList(
            lessons,
            currentLessonId
        );

    const nextLesson =
        getNextLessonFromList(
            lessons,
            currentLessonId
        );

    return {

        previousLesson,

        nextLesson,

        hasPrevious:
            previousLesson !== null,

        hasNext:
            nextLesson !== null,

        nextUnlocked:
            nextLesson
                ? isLessonUnlocked(
                    lessons,
                    completedLessons,
                    nextLesson.id
                )
                : false

    };

}

/* ==========================================================================
   COURSE COMPLETION & CERTIFICATE ELIGIBILITY
   ========================================================================== */

import {

    issueCertificate,

    hasCertificate,

    getStudentCertificates

} from "../core/firestore-service.js";

/**
 * Check whether the student is eligible
 * for certificate generation.
 *
 * @param {string} uid
 * @param {string} courseId
 * @returns {Promise<boolean>}
 */
export async function isCertificateEligible(
    uid,
    courseId
) {

    const completed = await isCourseCompleted(

        uid,

        courseId

    );

    if (

        !completed.success ||

        completed.data !== true

    ) {

        return false;

    }

    const exists = await hasCertificate(

        uid,

        courseId

    );

    if (

        !exists.success

    ) {

        return false;

    }

    return !exists.data;

}

/**
 * Automatically complete course
 * when progress reaches 100%.
 *
 * @param {string} uid
 * @param {string} courseId
 */
export async function autoCompleteCourse(
    uid,
    courseId
) {

    const progress = await getCourseProgress(

        uid,

        courseId

    );

    if (

        !progress.success

    ) {

        return progress;

    }

    if (

        progress.data < 100

    ) {

        return {

            success: true,

            data: false,

            error: null

        };

    }

    return await completeCourse(

        uid,

        courseId

    );

}

/**
 * Generate certificate.
 *
 * @param {Object} certificateData
 */
export async function generateCertificate(
    certificateData
) {

    const eligible =
        await isCertificateEligible(

            certificateData.uid,

            certificateData.courseId

        );

    if (!eligible) {

        return {

            success: false,

            data: null,

            error: "Student is not eligible."

        };

    }

    return await issueCertificate(

        certificateData

    );

}

/**
 * Get certificate count.
 *
 * @param {string} uid
 */
export async function getCertificateCount(
    uid
) {

    const result =
        await getStudentCertificates(uid);

    if (

        !result.success

    ) {

        return 0;

    }

    return result.data.length;

}

/**
 * Dashboard learning summary.
 *
 * @param {string} uid
 * @param {string} courseId
 */
export async function getLearningSummary(
    uid,
    courseId
) {

    const enrollment =
        await getEnrollmentInfo(

            uid,

            courseId

        );

    if (

        !enrollment.success ||

        !enrollment.data

    ) {

        return {

            success: false,

            data: null,

            error: "Enrollment not found."

        };

    }

    const progress =
        enrollment.data.progress ?? 0;

    const completedLessons =

        Array.isArray(
            enrollment.data.completedLessons
        )

            ? enrollment.data.completedLessons.length

            : 0;

    return {

        success: true,

        data: {

            progress,

            completedLessons,

            completed:

                enrollment.data.completed,

            currentLesson:

                enrollment.data.currentLessonId,

            currentModule:

                enrollment.data.currentModuleId

        },

        error: null

    };

}

/**
 * Clear all locally cached learning data.
 */
export function clearLearningCache() {

    clearMemoryCache();

    resetLocalProgress();

}

/* ==========================================================================
   PUBLIC EXPORTS
   ========================================================================== */

export default {

    saveContinueLearning,

    loadContinueLearning,

    cacheProgress,

    getCachedProgress,

    resetLocalProgress,

    completeCourseLesson,

    loadProgress,

    refreshProgress,

    getEnrollmentInfo,

    getProgressPercentage,

    isProgressComplete,

    getLocalProgress,

    getDashboardProgress,

    getCourseStructure,

    getNextLessonFromList,

    getPreviousLessonFromList,

    isLessonUnlocked,

    resumeCourse,

    loadLesson,

    buildLessonNavigation,

    isCertificateEligible,

    autoCompleteCourse,

    generateCertificate,

    getCertificateCount,

    getLearningSummary,

    clearLearningCache

};