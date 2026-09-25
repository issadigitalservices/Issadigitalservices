"use strict";

import { requireAdmin } from "../core/auth-guard.js";

import { uploadFile } from "../services/r2-upload.js";

import {
    getAdminResources,
    createResource,
    deleteResource
} from "../core/firestore-service.js";


/* ==========================================================================
   ADMIN ACCESS
   ========================================================================== */

await requireAdmin();


/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */

const form =
    document.getElementById("resourceForm");

const categoryInput =
    document.getElementById("resCategory");

const titleInput =
    document.getElementById("resTitle");

const descriptionInput =
    document.getElementById("resDesc");

const fileInput =
    document.getElementById("resFile");

const publishButton =
    document.getElementById("publishResourceBtn");

const progressWrap =
    document.getElementById("uploadProgressWrap");

const progressFill =
    document.getElementById("uploadProgressFill");

const progressText =
    document.getElementById("uploadProgressText");

const resourcesList =
    document.getElementById("resourcesList");

const categoryFilter =
    document.getElementById("adminCategoryFilter");


/* ==========================================================================
   STATE
   ========================================================================== */

let allResources = [];


/* ==========================================================================
   SECURITY / HTML ESCAPE
   ========================================================================== */

function escapeHtml(value = "") {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


/* ==========================================================================
   UPLOAD PROGRESS
   ========================================================================== */

function setProgress(
    percent,
    message
) {

    progressWrap.style.display = "block";

    progressFill.style.width =
        `${percent}%`;

    progressText.textContent =
        message;

}


function resetProgress() {

    progressWrap.style.display = "none";

    progressFill.style.width =
        "0%";

}


/* ==========================================================================
   DATE FORMAT
   ========================================================================== */

function formatDate(value) {

    if (!value) {

        return "Recently added";

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

        return "Recently added";

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
   FILE ICON
   ========================================================================== */

function iconFor(item) {

    const value =
        `${item.fileType || ""} ${item.fileName || ""}`
            .toLowerCase();


    if (
        value.includes("pdf")
    ) {

        return "fa-file-pdf";

    }


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
        /\.(jpg|jpeg|png|gif|webp|svg)$/.test(value)
    ) {

        return "fa-file-image";

    }


    return "fa-file";

}


/* ==========================================================================
   RENDER RESOURCES
   ========================================================================== */

function renderResources() {

    const selected =
        categoryFilter.value;


    const resources =
        selected === "All"

            ? allResources

            : allResources.filter(
                item =>
                    item.category === selected
            );


    if (!resources.length) {

        resourcesList.innerHTML = `

            <div class="empty-state">

                <i
                    class="fa-regular fa-folder-open"
                    style="font-size:2rem;">
                </i>

                <p>
                    No resources found.
                </p>

            </div>

        `;

        return;

    }


    resourcesList.innerHTML =
        resources.map(item => `

            <article class="resource-card">

                <div style="min-width:0;">

                    <div
                        style="
                        display:flex;
                        gap:10px;
                        align-items:center;
                        ">

                        <i
                            class="fa-solid ${iconFor(item)}"
                            style="
                            font-size:1.4rem;
                            color:#2563eb;
                            ">
                        </i>

                        <strong>
                            ${escapeHtml(item.title)}
                        </strong>

                    </div>


                    <p
                        style="
                        color:#64748b;
                        margin:7px 0 0;
                        ">

                        ${escapeHtml(
                            item.description
                        )}

                    </p>


                    <div class="resource-meta">

                        <span class="badge">

                            ${escapeHtml(
                                item.category ||
                                "Other"
                            )}

                        </span>


                        <span class="badge status">

                            Published

                        </span>


                        <span
    style="
    font-size:12px;
    color:#64748b;
">

    ${formatDate(
        item.createdAt
    )}

</span>


<span
    class="badge"
    style="
    display:inline-flex;
    align-items:center;
    gap:5px;
">

    <i class="fa-solid fa-download"></i>

    ${Number(
        item.downloadCount || 0
    )}

    Downloads

</span>

                    </div>

                </div>


                <button
                    class="delete-btn"
                    type="button"
                    data-id="${escapeHtml(
                        item.id
                    )}">

                    <i
                        class="fa-solid fa-trash">
                    </i>

                    Delete

                </button>

            </article>

        `).join("");


    resourcesList
        .querySelectorAll(".delete-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteSelected(
                    button.dataset.id
                )
            );

        });

}


/* ==========================================================================
   LOAD RESOURCES
   ========================================================================== */

async function loadResources() {

    resourcesList.innerHTML = `

        <div class="empty-state">

            Loading resources...

        </div>

    `;


    const result =
        await getAdminResources();


    if (!result.success) {

        resourcesList.innerHTML = `

            <div class="empty-state">

                Unable to load resources.

                <br>

                <small>
                    ${escapeHtml(
                        result.error || ""
                    )}
                </small>

            </div>

        `;

        return;

    }


    allResources =
        result.data || [];


    renderResources();

}


/* ==========================================================================
   DELETE RESOURCE
   ========================================================================== */

async function deleteSelected(id) {

    const resource =
        allResources.find(
            item => item.id === id
        );


    if (!resource) {

        return;

    }


    const confirmed =
        confirm(
            `Delete "${resource.title}" from Free Resources?`
        );


    if (!confirmed) {

        return;

    }


    const result =
        await deleteResource(id);


    if (!result.success) {

        alert(
            result.error ||
            "Failed to delete resource."
        );

        return;

    }


    await loadResources();

}


/* ==========================================================================
   CREATE RESOURCE
   ========================================================================== */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const category =
            categoryInput.value.trim();

        const title =
            titleInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const file =
            fileInput.files?.[0];


        if (
            !category ||
            !title ||
            !description ||
            !file
        ) {

            alert(
                "Please complete all fields and select a file."
            );

            return;

        }


        publishButton.disabled =
            true;


        try {

            /* -----------------------------------------
               STEP 1
               Upload file to Cloudflare R2
               ----------------------------------------- */

            setProgress(
                0,
                "Preparing upload..."
            );


            const uploadResult =
                await uploadFile(

                    file,

                    "free-resources",

                    percent => {

                        setProgress(
                            percent,
                            `Uploading... ${percent}%`
                        );

                    }

                );


            if (
                !uploadResult?.success
            ) {

                throw new Error(

                    uploadResult?.message ||

                    uploadResult?.error ||

                    "File upload failed."

                );

            }


            /* -----------------------------------------
               STEP 2
               Get public URL
               ----------------------------------------- */

            const fileUrl =

                uploadResult.url ||

                uploadResult.fileUrl ||

                uploadResult.publicUrl;


            if (!fileUrl) {

                throw new Error(
                    "Upload completed, but no public file URL was returned."
                );

            }


            /* -----------------------------------------
               STEP 3
               Save Firestore data
               ----------------------------------------- */

            setProgress(
                100,
                "Saving resource information..."
            );


            const result =
                await createResource({

                    title,

                    description,

                    category,

                    fileName:
                        file.name,

                    fileType:
                        file.type ||
                        "application/octet-stream",

                    fileSize:
                        file.size,

                    fileUrl,

                    folder:
                        "free-resources",

                    status:
                        "published"

                });


            if (!result.success) {

                throw new Error(

                    result.error ||
                    "Failed to save resource."

                );

            }


            /* -----------------------------------------
               SUCCESS
               ----------------------------------------- */

            alert(
                "Resource uploaded and published successfully."
            );


            form.reset();

            resetProgress();

            await loadResources();


        } catch (error) {

            console.error(
                "Resource upload error:",
                error
            );


            alert(
                error?.message ||
                "Something went wrong."
            );


            setProgress(
                0,
                "Upload failed."
            );


        } finally {

            publishButton.disabled =
                false;

        }

    }
);


/* ==========================================================================
   CATEGORY FILTER
   ========================================================================== */

categoryFilter.addEventListener(
    "change",
    renderResources
);


/* ==========================================================================
   INITIAL LOAD
   ========================================================================== */

loadResources();