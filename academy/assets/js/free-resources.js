"use strict";


/* ==========================================================================
   FIRESTORE SERVICE
   ========================================================================== */

import {
    getPublicResources,
    incrementResourceDownloads
} from "./core/firestore-service.js";


/* ==========================================================================
   DOM
   ========================================================================== */

const resourcesGrid =
    document.getElementById(
        "resourcesGrid"
    );

const categoryFilters =
    document.getElementById(
        "categoryFilters"
    );


/* ==========================================================================
   STATE
   ========================================================================== */

let allResources = [];

let selectedCategory = "All";


/* ==========================================================================
   HTML ESCAPE
   ========================================================================== */

function escapeHtml(value = "") {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* ==========================================================================
   DATE
   ========================================================================== */

function formatDate(value) {

    if (!value) {

        return "";

    }


    const date =
        value?.toDate
            ? value.toDate()
            : new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* ==========================================================================
   ICON
   ========================================================================== */

function getIcon(item) {

    const value = (

        `${item.category || ""} ` +

        `${item.fileType || ""} ` +

        `${item.fileName || ""}`

    ).toLowerCase();


    if (
        value.includes("excel") ||
        /\.xlsx?$/.test(value)
    ) {

        return "fa-file-excel";

    }


    if (
        value.includes("word") ||
        /\.docx?$/.test(value)
    ) {

        return "fa-file-word";

    }


    if (
        value.includes("powerpoint") ||
        /\.pptx?$/.test(value)
    ) {

        return "fa-file-powerpoint";

    }


    if (
        value.includes("pdf")
    ) {

        return "fa-file-pdf";

    }


    if (
        value.includes("image") ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/.test(value)
    ) {

        return "fa-file-image";

    }


    if (
        value.includes("cv") ||
        value.includes("resume")
    ) {

        return "fa-file-lines";

    }


    return "fa-file";

}


/* ==========================================================================
   RENDER
   ========================================================================== */

function renderResources() {

    const resources =

        selectedCategory === "All"

            ? allResources

            : allResources.filter(
                resource =>
                    resource.category ===
                    selectedCategory
            );


    if (!resources.length) {

        resourcesGrid.innerHTML = `

            <div class="resources-message">

                <i
                    class="fa-regular fa-folder-open">
                </i>

                <strong>
                    No resources available
                </strong>

                <p>
                    There are no resources
                    in this category yet.
                </p>

            </div>

        `;

        return;

    }


    resourcesGrid.innerHTML =

        resources.map(
            resource => `

                <article
                    class="resource-card">


                    <!-- ICON -->

                    <div class="resource-icon">

                        <i
                            class="fa-solid ${getIcon(
                                resource
                            )}">
                        </i>

                    </div>


                    <!-- CATEGORY -->

                    <span
                        class="resource-category">

                        ${escapeHtml(
                            resource.category ||
                            "Other"
                        )}

                    </span>


                    <!-- TITLE -->

                    <h3>

                        ${escapeHtml(
                            resource.title
                        )}

                    </h3>


                    <!-- DESCRIPTION -->

                    <p>

                        ${escapeHtml(
                            resource.description ||
                            "Free downloadable resource."
                        )}

                    </p>


                    <!-- FOOTER -->

                    <div
                        class="resource-footer">


                        <span
                            class="resource-date">

                            ${formatDate(
                                resource.createdAt
                            )}

                        </span>


                        <button
    class="download-btn"
    type="button"
    data-resource-id="${escapeHtml(
        resource.id
    )}"
    data-file-url="${escapeHtml(
        resource.fileUrl
    )}">

    <i
        class="fa-solid fa-download">
    </i>

    Download

</button>

                    </div>

                </article>

            `
            ).join("");


    /* --------------------------------------------------------------
       DOWNLOAD TRACKING
       -------------------------------------------------------------- */

    resourcesGrid
        .querySelectorAll(".download-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const resourceId =
                        button.dataset.resourceId;

                    const fileUrl =
                        button.dataset.fileUrl;


                    try {

    const result =
        await incrementResourceDownloads(
            resourceId
        );


    if (!result.success) {

        console.error(
            "Download count update failed:",
            result.error
        );

    } else {

        console.log(
            "Download count updated successfully:",
            resourceId
        );

    }

} catch (error) {

    console.error(
        "Download count update failed:",
        error
    );

}


                    if (fileUrl) {

                        window.open(
                            fileUrl,
                            "_blank",
                            "noopener,noreferrer"
                        );

                    }

                }
            );

        });

}


/* ==========================================================================
   LOAD RESOURCES
   ========================================================================== */

async function loadResources() {

    resourcesGrid.innerHTML = `

        <div class="resources-message">

            <i
                class="fa-solid fa-spinner fa-spin">
            </i>

            Loading free resources...

        </div>

    `;


    try {

        const result =
            await getPublicResources();


        if (!result.success) {

            throw new Error(
                result.error ||
                "Unable to load resources."
            );

        }


        allResources =
            Array.isArray(result.data)
                ? result.data
                : [];


        renderResources();


    } catch (error) {

        console.error(
            "Free resources error:",
            error
        );


        resourcesGrid.innerHTML = `

            <div class="resources-message">

                <i
                    class="fa-solid fa-triangle-exclamation">
                </i>

                <strong>
                    Unable to load resources
                </strong>

                <p>
                    Please try again later.
                </p>

            </div>

        `;

    }

}


/* ==========================================================================
   CATEGORY FILTER
   ========================================================================== */

categoryFilters
    .querySelectorAll(
        ".category-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedCategory =
                    button.dataset.category;


                categoryFilters
                    .querySelectorAll(
                        ".category-btn"
                    )
                    .forEach(item => {

                        item.classList.toggle(
                            "active",
                            item === button
                        );

                    });


                renderResources();

            }
        );

    });


/* ==========================================================================
   START
   ========================================================================== */

loadResources();