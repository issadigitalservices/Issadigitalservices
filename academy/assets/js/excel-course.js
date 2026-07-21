import { modules, lessons, courses } from "./course-data.js";

// ==============================
// Continue Learning Button
// ==============================

document.getElementById("continueBtn").addEventListener("click", () => {

    window.location.href = "excel-lesson.html?course=excel&lesson=1";

});

// ==============================
// Generate Modules & Lessons
// ==============================

const modulesContainer = document.getElementById("modulesContainer");

modules.forEach(module => {

    // Create Module Card
    const moduleDiv = document.createElement("div");
    moduleDiv.className = "module";

    // Module Title
    const moduleTitle = document.createElement("div");
    moduleTitle.className = "module-title";

    moduleTitle.innerHTML = `
        <i class="fa-solid fa-folder-open"></i>
        Module ${module.id} - ${module.title}
    `;

    moduleDiv.appendChild(moduleTitle);

    // Lesson List
    const lessonList = document.createElement("ul");

    // Filter lessons for this module
    const moduleLessons = lessons.filter(
        lesson => lesson.moduleId === module.id
    );

    moduleLessons.forEach(lesson => {

        const lessonItem = document.createElement("li");

        lessonItem.innerHTML = `
            <a href="excel-lesson.html?course=excel&lesson=${lesson.id}" class="lesson-link">

                <div class="lesson-left">

                    <i class="fa-solid fa-circle-play"></i>

                    <div>

                        <strong>Lesson ${lesson.id}</strong>

                        <p>${lesson.title}</p>

                    </div>

                </div>

                <span>${lesson.duration}</span>

            </a>
        `;

        lessonList.appendChild(lessonItem);

    });

    moduleDiv.appendChild(lessonList);

    modulesContainer.appendChild(moduleDiv);

});