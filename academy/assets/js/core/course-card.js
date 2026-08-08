/**
 * ============================================================
 * ISSA Academy
 * Reusable Course Card Component
 * Version : 2.0
 * ============================================================
 */

function formatPrice(price) {
    if (!price || Number(price) <= 0) return "Free";
    return `₹${Number(price).toLocaleString("en-IN")}`;
}

function plural(count, text) {
    return `${count} ${text}${count == 1 ? "" : "s"}`;
}

function getImage(course) {
    return (
        course.dashboardImage ||
        course.thumbnail ||
        course.thumbnailUrl ||
        "../../assets/images/course-placeholder.jpg"
    );
}

function getCategory(course) {
    return (
        course.categoryName ||
        course.category ||
        "General"
    );
}

function renderStudent(course, actionButton = "") {

    const originalPrice =
        course.originalPrice ??
        course.price ??
        0;

    const offerPrice =
        course.offerPrice ??
        course.price ??
        0;

    return `

        <div class="course-price">

            ${
                originalPrice > offerPrice
                    ? `
                        <span class="old-price">
                            ${formatPrice(originalPrice)}
                        </span>
                    `
                    : ""
            }

            <span class="offer-price">
                ${formatPrice(offerPrice)}
            </span>

        </div>

        <div class="course-meta">

            <span>
                <i class="fa-solid fa-layer-group"></i>
                ${plural(course.totalModules || 0, "Module")}
            </span>

            <span>
                <i class="fa-solid fa-video"></i>
                ${plural(course.totalLessons || 0, "Lesson")}
            </span>

        </div>

        <div class="course-action-container">

            ${
                actionButton ||

                `
                <button
                    class="btn btn-primary enroll-btn"
                    data-course-id="${course.id}">

                    Enroll Now

                </button>
                `
            }

        </div>

    `;
}

function renderDashboard(course, progress, completedLessons) {

    return `

        <div class="course-progress">

            <div class="progress-bar">

                <div
                    class="progress-fill"
                    style="width:${progress}%">
                </div>

            </div>

            <div class="progress-info">

                <span>${progress}% Complete</span>

                <span>

                    ${completedLessons}
                    /
                    ${course.totalLessons || 0}
                    Lessons

                </span>

            </div>

        </div>

        <a
            href="course.html?id=${course.id}"
            class="btn btn-primary continue-btn">

            Continue Learning

        </a>

    `;
}

function renderAdmin(course) {

    const originalPrice =
        course.originalPrice ??
        course.price ??
        0;

    const offerPrice =
        course.offerPrice ??
        course.price ??
        0;

    return `

        <span class="category-badge">

            ${getCategory(course)}

        </span>

        <div class="course-price">

            ${
                originalPrice > offerPrice
                    ? `
                    <span class="old-price">
                        ${formatPrice(originalPrice)}
                    </span>
                    `
                    : ""
            }

            <span class="offer-price">
                ${formatPrice(offerPrice)}
            </span>

        </div>

        <div class="course-meta">

            <span>
                <i class="fa-solid fa-layer-group"></i>
                ${plural(course.totalModules || 0, "Module")}
            </span>

            <span>
                <i class="fa-solid fa-video"></i>
                ${plural(course.totalLessons || 0, "Lesson")}
            </span>

        </div>

        <div class="course-actions">

            <button
                class="btn btn-outline edit-course"
                data-id="${course.id}">

                Edit

            </button>

            <button
                class="btn btn-danger delete-course"
                data-id="${course.id}">

                Delete

            </button>

        </div>

    `;
}

/**
 * ============================================================
 * Create Course Card
 * ============================================================
 *
 * Modes:
 * student
 * dashboard
 * admin
 */

export function createCourseCard(course, options = {}) {

    const {
    mode = "student",
    progress = 0,
    completedLessons = 0,
    actionButton = ""
} = options;

    let extraContent = "";

    switch (mode) {

        case "dashboard":
            extraContent = renderDashboard(
                course,
                progress,
                completedLessons
            );
            break;

        case "admin":
            extraContent = renderAdmin(course);
            break;

        case "student":
default:
    extraContent = renderStudent(
        course,
        actionButton
    );
    break;

    }

    return `

        <div class="
    ${mode === "admin" ? "admin-course-card" : "course-card"}
    ${options.className || ""}
">

            <div class="course-image">

                <img
                    src="${getImage(course)}"
                    alt="${course.title || "Course"}">

            </div>

            <div class="course-body">

                <h3 class="course-title">

                    ${course.title || "Untitled Course"}

                </h3>

                <p class="course-description">

                    ${course.shortDescription || ""}

                </p>

                ${extraContent}

            </div>

        </div>

    `;
}