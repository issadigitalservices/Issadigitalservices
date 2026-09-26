"use strict";

/* ==========================================================================
   ISSA Academy
   Admin Login Activity
   ========================================================================== */

import {
    requireAdmin
} from "../core/auth-guard.js";

import {
    getLoginActivity
} from "../core/firestore-service.js";


/* ==========================================================================
   ADMIN ACCESS
   ========================================================================== */

await requireAdmin();


/* ==========================================================================
   DOM
   ========================================================================== */

const totalLogins =
    document.getElementById("totalLogins");

const studentsTracked =
    document.getElementById("studentsTracked");

const multipleDeviceAccounts =
    document.getElementById("multipleDeviceAccounts");

const activitySearch =
    document.getElementById("activitySearch");

const activityTableBody =
    document.getElementById("activityTableBody");


/* ==========================================================================
   STATE
   ========================================================================== */

let allActivity = [];


/* ==========================================================================
   ESCAPE HTML
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
   DATE
   ========================================================================== */

function formatDate(value) {

    if (!value) {

        return "Unknown";

    }

    const date =
        value?.toDate
            ? value.toDate()
            : new Date(value);

    if (Number.isNaN(date.getTime())) {

        return "Unknown";

    }

    return date.toLocaleString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* ==========================================================================
   DEVICE ICON
   ========================================================================== */

function deviceIcon(type) {

    if (
        String(type)
            .toLowerCase()
            .includes("mobile")
    ) {

        return "fa-mobile-screen";

    }

    return "fa-desktop";

}


/* ==========================================================================
   RENDER
   ========================================================================== */

function renderActivity() {

    const search =
        activitySearch.value
            .trim()
            .toLowerCase();


    const filtered =
        allActivity.filter(item => {

            const value = [

                item.email,

                item.studentName,

                item.studentId,

                item.browser,

                item.operatingSystem,

                item.deviceType

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return value.includes(search);

        });


    if (!filtered.length) {

        activityTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-state">

                    No login activity found.

                </td>

            </tr>

        `;

        return;

    }


    activityTableBody.innerHTML =
        filtered.map(item => `

            <tr>

                <td>

                    <strong>

                        ${escapeHtml(
                            item.studentName ||
                            "Student"
                        )}

                    </strong>

                    <br>

                    <small
                        style="color:#64748b;">

                        ${escapeHtml(
                            item.studentId || ""
                        )}

                    </small>

                </td>


                <td>

                    ${escapeHtml(
                        item.email || ""
                    )}

                </td>


                <td>

                    ${formatDate(
                        item.loginAt
                    )}

                </td>


                <td>

                    <span
                        class="device-badge">

                        <i
                            class="fa-solid
                            ${deviceIcon(
                                item.deviceType
                            )}">
                        </i>

                        ${escapeHtml(
                            item.deviceType ||
                            "Unknown"
                        )}

                    </span>

                </td>


                <td>

                    ${escapeHtml(
                        item.operatingSystem ||
                        "Unknown"
                    )}

                </td>


                <td>

                    ${escapeHtml(
                        item.browser ||
                        "Unknown"
                    )}

                </td>


                <td>

                    <small
                        style="
                        color:#64748b;
                        word-break:break-all;
                        ">

                        ${escapeHtml(
                            item.deviceId ||
                            "Unknown"
                        )}

                    </small>

                </td>

            </tr>

        `).join("");

}


/* ==========================================================================
   LOAD
   ========================================================================== */

async function loadActivity() {

    activityTableBody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="empty-state">

                Loading login activity...

            </td>

        </tr>

    `;


    const result =
        await getLoginActivity();


    if (!result.success) {

        activityTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-state">

                    Unable to load login activity.

                    <br>

                    <small>

                        ${escapeHtml(
                            result.error || ""
                        )}

                    </small>

                </td>

            </tr>

        `;

        return;

    }


    allActivity =
        result.data || [];


    /* ==============================================================
       SUMMARY
       ============================================================== */

    totalLogins.textContent =
        allActivity.length;


    const studentIds =
        new Set(
            allActivity
                .map(item => item.studentId)
                .filter(Boolean)
        );


    studentsTracked.textContent =
        studentIds.size;


    const devicesByStudent =
        new Map();


    allActivity.forEach(item => {

        if (!item.studentId) {

            return;

        }


        if (!devicesByStudent.has(item.studentId)) {

            devicesByStudent.set(
                item.studentId,
                new Set()
            );

        }


        if (item.deviceId) {

            devicesByStudent
                .get(item.studentId)
                .add(item.deviceId);

        }

    });


    let multipleDeviceCount = 0;


    devicesByStudent.forEach(devices => {

        if (devices.size > 1) {

            multipleDeviceCount++;

        }

    });


    multipleDeviceAccounts.textContent =
        multipleDeviceCount;


    renderActivity();

}


/* ==========================================================================
   SEARCH
   ========================================================================== */

activitySearch.addEventListener(
    "input",
    renderActivity
);


/* ==========================================================================
   START
   ========================================================================== */

loadActivity();