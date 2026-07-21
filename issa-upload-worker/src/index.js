const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

export default {

  async fetch(request, env) {

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