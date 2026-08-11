const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://www.issadigitalservices.com",
    "https://issadigitalservices.com"
];

function getCorsHeaders(request) {

    const origin =
        request.headers.get("Origin");

    const headers = {
        "Access-Control-Allow-Methods":
            "GET, POST, OPTIONS",

        "Access-Control-Allow-Headers":
            "Authorization, Content-Type, Range",

        "Access-Control-Allow-Credentials":
            "true",

        "Vary":
            "Origin"
    };

    if (
        origin &&
        allowedOrigins.includes(origin)
    ) {
        headers["Access-Control-Allow-Origin"] =
            origin;
    }

    return headers;
}

const FIREBASE_PROJECT_ID = "issa-academy";

const FIREBASE_API_KEY =
    "AIzaSyBNgQN_Kl0FDKmOfNS1no2KBvYHP2m9Gh4";

const VIDEO_TOKEN_LIFETIME = 15 * 60;

export default {

  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);
   /* ============================================================
   PROTECTED VIDEO SESSION + VIDEO STREAM
   ============================================================ */

const requestUrl = new URL(request.url);


/* ============================================================
   PROTECTED VIDEO SESSION
   ============================================================ */

if (
    request.method === "POST" &&
    requestUrl.pathname === "/video-session"
) {

    try {

        const authorization =
            request.headers.get("Authorization");


        if (
            !authorization ||
            !authorization.startsWith("Bearer ")
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "Authentication required."
                },
                {
                    status: 401,
                    headers: corsHeaders
                }
            );

        }


        const idToken =
            authorization.substring(7);


        /* ========================================================
           VERIFY FIREBASE LOGIN
        ======================================================== */

        const authResponse =
            await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        idToken
                    })
                }
            );


        if (!authResponse.ok) {

            return Response.json(
                {
                    success: false,
                    message:
                        "Invalid or expired login session."
                },
                {
                    status: 401,
                    headers: corsHeaders
                }
            );

        }


        const authData =
            await authResponse.json();


        const user =
            authData.users?.[0];


        if (!user) {

            return Response.json(
                {
                    success: false,
                    message:
                        "User not found."
                },
                {
                    status: 401,
                    headers: corsHeaders
                }
            );

        }


        /* ========================================================
           REQUEST DATA
        ======================================================== */

        const body =
            await request.json();


        const courseId =
            body.courseId;


        const videoKey =
            body.videoKey;


        if (
            typeof courseId !== "string" ||
            !courseId ||
            typeof videoKey !== "string" ||
            !videoKey
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "courseId and videoKey are required."
                },
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        /* ========================================================
           VERIFY ENROLLMENT
        ======================================================== */

        const enrollmentResponse =
            await fetch(
                `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${idToken}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        structuredQuery: {

                            from: [
                                {
                                    collectionId:
                                        "enrollments"
                                }
                            ],

                            where: {

                                compositeFilter: {

                                    op: "AND",

                                    filters: [

                                        {
                                            fieldFilter: {

                                                field: {
                                                    fieldPath:
                                                        "studentId"
                                                },

                                                op: "EQUAL",

                                                value: {
                                                    stringValue:
                                                        user.localId
                                                }

                                            }

                                        },

                                        {
                                            fieldFilter: {

                                                field: {
                                                    fieldPath:
                                                        "courseId"
                                                },

                                                op: "EQUAL",

                                                value: {
                                                    stringValue:
                                                        courseId
                                                }

                                            }

                                        }

                                    ]

                                }

                            },

                            limit: 1

                        }

                    })

                }
            );


        if (!enrollmentResponse.ok) {

            return Response.json(
                {
                    success: false,
                    message:
                        "Unable to verify course access."
                },
                {
                    status: 403,
                    headers: corsHeaders
                }
            );

        }


        const enrollmentResults =
            await enrollmentResponse.json();


        const enrollment =
            enrollmentResults.find(
                item => item.document
            );


        if (!enrollment) {

            return Response.json(
                {
                    success: false,
                    message:
                        "You do not have access to this course."
                },
                {
                    status: 403,
                    headers: corsHeaders
                }
            );

        }


        const enrollmentFields =
            enrollment.document.fields || {};


        /* ========================================================
           APPROVAL CHECK
        ======================================================== */

        if (
            enrollmentFields.approvalStatus?.stringValue !==
            "Approved"
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "Course access is not approved."
                },
                {
                    status: 403,
                    headers: corsHeaders
                }
            );

        }


        /* ========================================================
           EXPIRY CHECK
        ======================================================== */

        const expiresAt =
            enrollmentFields.expiresAt?.timestampValue;


        if (expiresAt) {

            if (
                Date.now() >=
                new Date(expiresAt).getTime()
            ) {

                return Response.json(
                    {
                        success: false,
                        message:
                            "Course access has expired."
                    },
                    {
                        status: 403,
                        headers: corsHeaders
                    }
                );

            }

        }


        /* ========================================================
           VERIFY VIDEO BELONGS TO COURSE
        ======================================================== */

        const lessonsResponse =
            await fetch(
                `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${idToken}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        structuredQuery: {

                            from: [
                                {
                                    collectionId:
                                        "lessons"
                                }
                            ],

                            where: {

                                fieldFilter: {

                                    field: {
                                        fieldPath:
                                            "courseId"
                                    },

                                    op: "EQUAL",

                                    value: {
                                        stringValue:
                                            courseId
                                    }

                                }

                            }

                        }

                    })

                }
            );


        if (!lessonsResponse.ok) {

            return Response.json(
                {
                    success: false,
                    message:
                        "Unable to verify lesson access."
                },
                {
                    status: 403,
                    headers: corsHeaders
                }
            );

        }


        const lessonResults =
            await lessonsResponse.json();


        let videoBelongsToCourse =
            false;


        for (
            const item of lessonResults
        ) {

            if (!item.document) {
                continue;
            }


            const fields =
                item.document.fields || {};


            /* ----------------------------------------------------
               Check videoKey field if available
            ---------------------------------------------------- */

            const storedVideoKey =
                fields.videoKey?.stringValue;


            if (
                storedVideoKey &&
                storedVideoKey === videoKey
            ) {

                videoBelongsToCourse =
                    true;

                break;

            }


            /* ----------------------------------------------------
               Check existing videoUrl field
               This keeps all your existing lessons working.
            ---------------------------------------------------- */

            const storedVideoUrl =
                fields.videoUrl?.stringValue;


            if (!storedVideoUrl) {
                continue;
            }


            try {

                const parsedUrl =
                    new URL(storedVideoUrl);


                const storedKey =
                    decodeURIComponent(
                        parsedUrl.pathname
                            .replace(/^\/+/, "")
                    );


                if (
                    storedKey === videoKey
                ) {

                    videoBelongsToCourse =
                        true;

                    break;

                }

            }

            catch {

                /* Ignore invalid video URL */

            }

        }


        if (!videoBelongsToCourse) {

            return Response.json(
                {
                    success: false,
                    message:
                        "This video does not belong to the requested course."
                },
                {
                    status: 403,
                    headers: corsHeaders
                }
            );

        }


        /* ========================================================
           CREATE TEMPORARY TOKEN
        ======================================================== */

        const payload = {

            studentId:
                user.localId,

            courseId,

            videoKey,

            expiresAt:
                Date.now() +
                VIDEO_TOKEN_LIFETIME * 1000

        };


        const encodedPayload =
            btoa(
                JSON.stringify(payload)
            )
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");


        const secretKey =
            await crypto.subtle.importKey(
                "raw",

                new TextEncoder().encode(
                    env.VIDEO_SESSION_SECRET
                ),

                {
                    name: "HMAC",
                    hash: "SHA-256"
                },

                false,

                ["sign"]
            );


        const signatureBuffer =
            await crypto.subtle.sign(
                "HMAC",
                secretKey,
                new TextEncoder().encode(
                    encodedPayload
                )
            );


        const signature =
            btoa(
                String.fromCharCode(
                    ...new Uint8Array(
                        signatureBuffer
                    )
                )
            )
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");


        const token =
            `${encodedPayload}.${signature}`;


        return new Response(
    JSON.stringify({
        success: true,
        token,
        expiresIn: VIDEO_TOKEN_LIFETIME
    }),
    {
        status: 200,
        headers: {
    ...corsHeaders,
    "Content-Type": "application/json"
}
    }
);

    }

    catch (error) {

        console.error(
            "Video session error:",
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    "Unable to create video session."
            },
            {
                status: 500,
                headers: corsHeaders
            }
        );

    }

}


/* ============================================================
   PROTECTED VIDEO STREAM
   ============================================================ */

if (
    request.method === "GET" &&
    requestUrl.pathname === "/video"
) {

  
  /* ========================================================
   REQUIRE SIGNED VIDEO TOKEN
======================================================== */

const token =
    requestUrl.searchParams.get("token");

if (!token) {

    return new Response(
        "Video access denied.",
        {
            status: 403,
            headers: corsHeaders
        }
    );

}


try {


        const tokenParts =
            token.split(".");


        if (
            tokenParts.length !== 2
        ) {

            return new Response(
                "Invalid video token.",
                {
                    status: 403,
                    headers: corsHeaders
                }
            );

        }


        const encodedPayload =
            tokenParts[0];


        const providedSignature =
            tokenParts[1];


        /* ========================================================
           VERIFY TOKEN SIGNATURE
        ======================================================== */

        const secretKey =
            await crypto.subtle.importKey(
                "raw",

                new TextEncoder().encode(
                    env.VIDEO_SESSION_SECRET
                ),

                {
                    name: "HMAC",
                    hash: "SHA-256"
                },

                false,

                ["verify"]
            );


        const signatureBytes =
            Uint8Array.from(
                atob(
                    providedSignature
                        .replace(/-/g, "+")
                        .replace(/_/g, "/") +
                    "=".repeat(
                        (
                            4 -
                            (
                                providedSignature.length %
                                4
                            )
                        ) % 4
                    )
                ),
                char =>
                    char.charCodeAt(0)
            );


        const validSignature =
            await crypto.subtle.verify(
                "HMAC",
                secretKey,
                signatureBytes,
                new TextEncoder().encode(
                    encodedPayload
                )
            );


        if (!validSignature) {

            return new Response(
                "Invalid video token.",
                {
                    status: 403,
                    headers: corsHeaders
                }
            );

        }


        /* ========================================================
           DECODE TOKEN
        ======================================================== */

        let payload;


        try {

            const base64 =
                encodedPayload
                    .replace(/-/g, "+")
                    .replace(/_/g, "/");


            const padding =
                "=".repeat(
                    (
                        4 -
                        (
                            base64.length %
                            4
                        )
                    ) % 4
                );


            payload =
                JSON.parse(
                    atob(
                        base64 + padding
                    )
                );

        }

        catch {

            return new Response(
                "Invalid video token.",
                {
                    status: 403,
                    headers: corsHeaders
                }
            );

        }


        /* ========================================================
           CHECK TOKEN EXPIRY
        ======================================================== */

        if (
            !payload.expiresAt ||
            Date.now() >=
            Number(payload.expiresAt)
        ) {

            return new Response(
                "Video session expired.",
                {
                    status: 403,
                    headers: corsHeaders
                }
            );

        }


        if (
            typeof payload.videoKey !==
            "string" ||
            !payload.videoKey
        ) {

            return new Response(
                "Video file not specified.",
                {
                    status: 400,
                    headers: corsHeaders
                }
            );

        }


        /* ========================================================
           GET VIDEO FROM PRIVATE R2
        ======================================================== */

        const rangeHeader =
            request.headers.get(
                "Range"
            );


        let object;


        if (rangeHeader) {

            const rangeMatch =
                rangeHeader.match(
                    /^bytes=(\d*)-(\d*)$/
                );


            if (rangeMatch) {

                const start =
                    rangeMatch[1] === ""
                        ? null
                        : Number(
                            rangeMatch[1]
                        );


                const requestedEnd =
                    rangeMatch[2] === ""
                        ? null
                        : Number(
                            rangeMatch[2]
                        );


                const head =
                    await env.VIDEOS.head(
                        payload.videoKey
                    );


                if (!head) {

                    return new Response(
                        "Video not found.",
                        {
                            status: 404,
                            headers: corsHeaders
                        }
                    );

                }


                const size =
                    head.size;


                let offset;
                let length;


                if (
                    start !== null
                ) {

                    offset =
                        start;


                    const end =
                        requestedEnd !== null
                            ? Math.min(
                                requestedEnd,
                                size - 1
                            )
                            : size - 1;


                    if (
                        offset >= size ||
                        end < offset
                    ) {

                        return new Response(
                            "Requested range is not satisfiable.",
                            {
                                status: 416,
                                headers: {
                                    ...corsHeaders,

                                    "Content-Range":
                                        `bytes */${size}`
                                }
                            }
                        );

                    }


                    length =
                        end -
                        offset +
                        1;

                }

                else if (
                    requestedEnd !== null
                ) {

                    length =
                        Math.min(
                            requestedEnd,
                            size
                        );


                    offset =
                        size -
                        length;

                }


                if (
                    offset !== undefined &&
                    length !== undefined
                ) {

                    object =
                        await env.VIDEOS.get(
                            payload.videoKey,
                            {
                                range: {
                                    offset,
                                    length
                                }
                            }
                        );

                }

            }

        }


        /* ========================================================
           FULL VIDEO REQUEST
        ======================================================== */

        if (!object) {

            object =
                await env.VIDEOS.get(
                    payload.videoKey
                );

        }


        if (!object) {

            return new Response(
                "Video not found.",
                {
                    status: 404,
                    headers: corsHeaders
                }
            );

        }


        /* ========================================================
           RESPONSE HEADERS
        ======================================================== */

        const headers =
    new Headers(corsHeaders);


        headers.set(
            "Accept-Ranges",
            "bytes"
        );


        headers.set(
            "Cache-Control",
            "private, no-store"
        );


        object.writeHttpMetadata(
            headers
        );


        if (
            object.httpEtag
        ) {

            headers.set(
                "ETag",
                object.httpEtag
            );

        }


        /* ========================================================
           PARTIAL RESPONSE
        ======================================================== */

        if (
            rangeHeader &&
            object.range
        ) {

            const offset =
                object.range.offset || 0;


            const length =
                object.range.length ||
                object.size;


            headers.set(
                "Content-Range",
                `bytes ${offset}-${offset + length - 1}/${object.size}`
            );


            headers.set(
                "Content-Length",
                String(length)
            );


            return new Response(
                object.body,
                {
                    status: 206,
                    headers
                }
            );

        }


        /* ========================================================
           FULL RESPONSE
        ======================================================== */

        headers.set(
            "Content-Length",
            String(object.size)
        );


        return new Response(
            object.body,
            {
                status: 200,
                headers
            }
        );

    }

    catch (error) {

        console.error(
            "Protected video stream error:",
            error
        );


        return new Response(
            "Unable to stream video.",
            {
                status: 500,
                headers: corsHeaders
            }
        );

    }

}
    if (request.method === "OPTIONS") {

      return new Response(null, {
        headers: corsHeaders
      });

    }

    if (request.method !== "POST") {

      return new Response(

        JSON.stringify({

          success: false,

          message: "Only POST allowed"

        }),

        {

          status: 405,

          headers: {

            ...corsHeaders,

            "Content-Type": "application/json"

          }

        }

      );

    }

    try {

      const formData = await request.formData();

      const file = formData.get("file");

      if (!file) {

        return Response.json(

          {

            success: false,

            message: "No file uploaded."

          },

          {

            headers: corsHeaders

          }

        );

      }

      const folder =

        formData.get("folder") ||

        "uploads";

      const fileName =

        `${folder}/${Date.now()}-${file.name}`;

      await env.VIDEOS.put(

        fileName,

        file.stream(),

        {

          httpMetadata: {

            contentType: file.type

          }

        }

      );

      const fileUrl =

        `https://pub-4e6d3c8953e54fb1aa48b58557498743.r2.dev/${fileName}`;

      return Response.json(

        {

          success: true,

          url: fileUrl,

          fileName,

          type: file.type,

          originalName: file.name

        },

        {

          headers: corsHeaders

        }

      );

    }

    catch (error) {

      return Response.json(

        {

          success: false,

          error: error.message

        },

        {

          headers: corsHeaders

        }

      );

    }

  }

};