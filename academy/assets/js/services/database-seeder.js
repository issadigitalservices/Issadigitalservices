"use strict";

import { app } from "../core/firebase-config.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import courses from "../../seed/courses.json" assert { type: "json" };
import modules from "../../seed/modules.json" assert { type: "json" };
import lessons from "../../seed/lessons.json" assert { type: "json" };

const db = getFirestore(app);

export async function seedDatabase() {

    const batch = writeBatch(db);

    /* ==========================================================
       Courses
    ========================================================== */

    for (const course of courses) {

        batch.set(

            doc(db, "courses", course.courseId),

            {
                ...course,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }

        );

    }

    /* ==========================================================
       Modules
    ========================================================== */

    for (const module of modules) {

        batch.set(

            doc(db, "modules", module.moduleId),

            {
                ...module,
                createdAt: serverTimestamp()
            }

        );

    }

    /* ==========================================================
       Lessons
    ========================================================== */

    for (const lesson of lessons) {

        batch.set(

            doc(db, "lessons", lesson.lessonId),

            {
                ...lesson,
                createdAt: serverTimestamp()
            }

        );

    }

    /* ==========================================================
       Default Announcement
    ========================================================== */

    batch.set(

        doc(db, "announcements", "welcome"),

        {

            title: "Welcome to ISSA Academy",

            message:
                "Welcome to ISSA Academy. Start your learning journey today.",

            status: "published",

            createdAt: serverTimestamp()

        }

    );

    /* ==========================================================
       Settings
    ========================================================== */

    batch.set(

        doc(db, "settings", "general"),

        {

            academyName: "ISSA Academy",

            academyEmail: "info@issaacademy.com",

            maintenanceMode: false,

            createdAt: serverTimestamp()

        }

    );

    await batch.commit();

    console.log("✅ Database Seed Completed");

}