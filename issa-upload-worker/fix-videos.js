import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { promisify } from "util";

// Point directly to the nested bin path containing ffmpeg.exe
ffmpeg.setFfmpegPath("C:\\ffmpeg-9.0.2-essentials_build\\ffmpeg-9.0.2-essentials_build\\bin\\ffmpeg.exe");

const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);

// Configure R2 client with your credentials
const s3 = new S3Client({
    region: "auto",
    endpoint: "https://c935fe9209376c11e3e23fc95745dfcf.r2.cloudflarestorage.com",
    credentials: {
        accessKeyId: "0f9514064e831a07a7b88e24280deadd",
        secretAccessKey: "6bc4211d9b359cdbac5254dcc0a95c655af5a42f34ed3919237b1ced2dd56fb7",
    },
});

const BUCKET_NAME = "issa-academy-videos";

async function processVideos() {
    try {
        console.log("Fetching video list from R2...");
        const listCommand = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
        const response = await s3.send(listCommand);

        const videos = response.Contents || [];
        console.log(`Found ${videos.length} files to process.`);

        for (const file of videos) {
            const key = file.Key;
            if (!key.endsWith(".mp4")) continue;

            console.log(`\nProcessing: ${key}`);
            const localInput = path.basename(key) + "_input.mp4";
            const localOutput = path.basename(key) + "_output.mp4";

            try {
                // 1. Download from R2
                const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
                const s3Object = await s3.send(getCommand);
                const inputStream = fs.createWriteStream(localInput);
                
                await new Promise((resolve, reject) => {
                    s3Object.Body.pipe(inputStream);
                    s3Object.Body.on("error", reject);
                    inputStream.on("finish", resolve);
                });

                // 2. Apply Faststart via FFmpeg
                await new Promise((resolve, reject) => {
                    ffmpeg(localInput)
                        .outputOptions("-movflags +faststart")
                        .videoCodec("copy")
                        .audioCodec("copy")
                        .save(localOutput)
                        .on("end", resolve)
                        .on("error", reject);
                });

                console.log(`Optimized ${key}, re-uploading to R2...`);

                // 3. Read file into buffer and re-upload to prevent socket timeouts
                const fileBuffer = await readFile(localOutput);
                const putCommand = new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: key,
                    Body: fileBuffer,
                    ContentType: "video/mp4"
                });
                await s3.send(putCommand);

                console.log(`Successfully fixed and updated: ${key}`);
            } catch (innerError) {
                console.error(`Failed processing ${key}:`, innerError.message);
            } finally {
                // 4. Cleanup local temp files safely
                if (fs.existsSync(localInput)) await unlink(localInput).catch(() => {});
                if (fs.existsSync(localOutput)) await unlink(localOutput).catch(() => {});
            }
        }

        console.log("\nBatch processing complete!");
    } catch (error) {
        console.error("Error processing videos:", error);
    }
}

processVideos();