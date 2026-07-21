const WORKER_URL =
    "https://issa-upload-worker.issadigitalservices.workers.dev";

export async function uploadFile(

    file,

    folder = "uploads",

    onProgress = null

) {

    if (!file) {

        throw new Error("No file selected.");

    }

    const formData = new FormData();

    formData.append("file", file);

    formData.append("folder", folder);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {

        xhr.open("POST", WORKER_URL);

        xhr.upload.onprogress = event => {

            if (event.lengthComputable && onProgress) {

                const percent = Math.round(

                    (event.loaded / event.total) * 100

                );

                onProgress(percent);

            }

        };

        xhr.onload = () => {

            if (xhr.status >= 200 && xhr.status < 300) {

                const response = JSON.parse(xhr.responseText);

                if (response.success) {

                    resolve(response);

                }

                else {

                    reject(

                        new Error(

                            response.message ||

                            response.error ||

                            "Upload failed."

                        )

                    );

                }

            }

            else {

                reject(

                    new Error("Upload failed.")

                );

            }

        };

        xhr.onerror = () => {

            reject(

                new Error(

                    "Unable to connect to the upload server."

                )

            );

        };

        xhr.send(formData);

    });

}