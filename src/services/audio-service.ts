import axios from "axios";
import { createReadStream, createWriteStream, unlink } from "fs"; // updated import
import { AudioInputStream, PushAudioInputStream } from "microsoft-cognitiveservices-speech-sdk";
import stream from "stream";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const execPromise = promisify(exec);

export async function downloadAudioFile(audioUrl: string): Promise<stream.Readable> {
    const { data: fetchedStream } = await axios<stream.Readable>({
        method: "GET",
        url: audioUrl,
        responseType: "stream",
    });

    return fetchedStream;
}

/**
 * Convert an audio file to a WAV file and return a push stream
 * @param audioUrl The URL of the audio file to convert
 * @returns A Promise resolving to an AudioInputStream
 * @throws Error if the audio fetch or conversion fails
 * 
 * Audio conversion parameters:
 * - Codec: PCM 16-bit little-endian
 * - Channels: Mono (1 channel)
 * - Sample rate: 16kHz
 * - Format: WAV
 */
export async function convertAudioToPushStream(audioUrl: string): Promise<AudioInputStream> {
    let pushStream: PushAudioInputStream | null = null;
    let tempInput: string | null = null;
    let tempOutput: string | null = null;

    try {
        // Create temporary input and output files
        tempInput = path.join(tmpdir(), `temp-input-${Date.now()}.m4a`);
        tempOutput = path.join(tmpdir(), `temp-output-${Date.now()}.wav`);

        // Download the audio file
        console.log(`Downloading audio from ${audioUrl} to ${tempInput}`);
        const downloadStream = await downloadAudioFile(audioUrl);
        await new Promise<void>((resolve, reject) => {
            if (!tempInput)
                reject("temporary input file is null");
            const fileStream = createWriteStream(tempInput as string);
            downloadStream.pipe(fileStream);
            fileStream.on("finish", resolve);
            fileStream.on("error", reject);
        });

        // Create the ffmpeg command with proper path escaping
        const ffmpegCmd = `"${ffmpegPath}" -i "${tempInput}" -acodec pcm_s16le -ac 1 -ar 16000 -f wav "${tempOutput}"`;

        console.log(`Executing FFmpeg command: ${ffmpegCmd}`);

        // Execute the FFmpeg command
        const { stdout, stderr } = await execPromise(ffmpegCmd);

        if (stderr) {
            console.log('FFmpeg output:', stderr);
        }

        console.log("Conversion finished successfully");

        // Create a push stream from the converted output file
        pushStream = AudioInputStream.createPushStream();

        // Read the WAV file and push its content to the stream
        const convertedStream = createReadStream(tempOutput);

        await new Promise<void>((resolve, reject) => {
            convertedStream.on("data", (chunk: Buffer | string) => {
                console.log(`Pushing chunk of ${chunk.length} bytes to stream`);
                pushStream?.write(chunk as Buffer);
            });

            convertedStream.on("end", () => {
                console.log("File reading complete, closing push stream");
                pushStream?.close();
                resolve();
            });

            convertedStream.on("error", (err) => {
                reject(new Error(`Error reading converted file: ${err.message}`));
            });
        });

        return pushStream;
    } catch (err) {
        console.error("Conversion failed:", err);
        // Clean up resources on error
        pushStream?.close();

        throw err instanceof Error ? err : new Error(String(err));
    } finally {
        // Clean up temporary files
        if (tempInput) {
            unlink(tempInput, (err) => {
                if (err) console.error(`Failed to delete temp input file: ${err.message}`);
            });
        }

        if (tempOutput) {
            unlink(tempOutput, (err) => {
                if (err) console.error(`Failed to delete temp output file: ${err.message}`);
            });
        }
    }
}
// New function to create a read stream from a local file
export function createLocalFileStream(filePath: string): stream.Readable {
    return createReadStream(filePath);
}
