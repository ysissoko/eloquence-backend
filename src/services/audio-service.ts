import axios from "axios";
import stream from "stream";
import { AudioInputStream, PushAudioInputStream } from "microsoft-cognitiveservices-speech-sdk";

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
    // let audioStream: stream.Readable | null = null;
    let pushStream: PushAudioInputStream | null = null;

    try {
        // Fetch audio file
        const fetchedStream = await downloadAudioFile(audioUrl);
        // Set up conversion pipeline
        // outputStream = new stream.PassThrough();
        pushStream = AudioInputStream.createPushStream();

        // Handle stream events
        fetchedStream.on("data", (chunk) => pushStream?.write(chunk));
        fetchedStream.on("end", () => pushStream?.close());
        fetchedStream.on("error", (err) => {
            throw new Error(`Output stream error: ${err.message}`);
        });

        return pushStream;
    } catch (err) {
        // Clean up resources on error
        pushStream?.close();
        throw err instanceof Error ? err : new Error(String(err));
    }
}
