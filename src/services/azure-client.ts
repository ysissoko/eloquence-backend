import { SpeechConfig, SpeechSynthesisOutputFormat, SpeechSynthesizer, AudioConfig, ResultReason, PronunciationAssessmentResult, SpeechRecognizer, PronunciationAssessmentGradingSystem, PronunciationAssessmentGranularity, PronunciationAssessmentConfig, AudioInputStream } from 'microsoft-cognitiveservices-speech-sdk';
import { v4 as uuidv4 } from 'uuid';
import uploadAudioFile from './uploader';
import { convertAudioToPushStream } from './audio-service';

export type SpeechAssessmentResult = {
    referenceText: string;
    pronunciationScore: number;
    accuracyScore: number;
    fluencyScore: number;
    completnessScore: number;
    prosodyScore: number;
}
export default class AzureClient {
    private speechConfig: SpeechConfig;
    private speechSynthesizer: SpeechSynthesizer;

    constructor(apiKey: string, serviceRegion: string, speechLanguage = "fr-FR") {
        this.speechConfig = SpeechConfig.fromSubscription(apiKey, serviceRegion);
        this.speechSynthesizer = new SpeechSynthesizer(this.speechConfig);
        this.speechConfig.speechSynthesisLanguage = speechLanguage;
        this.speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
    }

    async speechAssessment(referenceText: string, audioUrl: string): Promise<SpeechAssessmentResult> {
        // Télécharger l'audio et le convertir en WAV
        const wavStream: AudioInputStream = await convertAudioToPushStream(audioUrl);
        console.log("Audio converted to WAV");
        const audioConfig: AudioConfig = AudioConfig.fromStreamInput(wavStream);
        const speechRecognizer = new SpeechRecognizer(this.speechConfig, audioConfig);
        const pronunciationAssessmentConfig = new PronunciationAssessmentConfig(
            referenceText,
            PronunciationAssessmentGradingSystem.HundredMark,
            PronunciationAssessmentGranularity.Phoneme,
            true
        );

        pronunciationAssessmentConfig.enableProsodyAssessment = true;
        pronunciationAssessmentConfig.applyTo(speechRecognizer);

        return new Promise((resolve, reject) => {
            console.log("Starting speech recognition");
            speechRecognizer.recognizeOnceAsync(async (result) => {
                try {
                    if (result.reason === ResultReason.RecognizedSpeech) {
                        console.info("Speech recognized");
                        const pronunciationResult = PronunciationAssessmentResult.fromResult(result);

                        const assessmentResult = {
                            referenceText,
                            pronunciationScore: pronunciationResult.pronunciationScore,
                            accuracyScore: pronunciationResult.accuracyScore,
                            fluencyScore: pronunciationResult.fluencyScore,
                            completnessScore: pronunciationResult.completenessScore,
                            prosodyScore: pronunciationResult.prosodyScore
                        };

                        speechRecognizer.close();
                        resolve(assessmentResult);
                    } else {
                        console.error("Speech not recognized. Reason:", result.reason);
                        speechRecognizer.close();
                        reject(new Error("Speech not recognized. Reason: " + result.reason));
                    }
                } catch (error) {
                    speechRecognizer.close();
                    console.error("Speech assessment error:", error);
                    reject(error);
                }
            }, (err) => {
                speechRecognizer.close();
                console.error("Speech recognition error:", err);
                reject(err);
            });
        });
    }

    textToSpeech(userId: string, sessionId: string, text: string) {
        return new Promise((resolve, reject) => {
            this.speechSynthesizer.speakTextAsync(text, async (speechResult) => {
                if (speechResult.reason === ResultReason.SynthesizingAudioCompleted) {
                    console.info("Synthesizing audio completed");
                    this.speechSynthesizer.close();

                    try {
                        const uploadPath = `${userId}/sessions/${sessionId}/${uuidv4()}.mp3`;
                        const { url: audioPath } = await uploadAudioFile(Buffer.from(speechResult.audioData), uploadPath);

                        resolve({
                            suggestions: {
                                text,
                                audioPath,
                            }
                        });
                    } catch (error: any) {
                        console.error("Error uploading audio:", error);
                        reject(new Error("Failed to upload audio: " + error.message));
                    }
                } else {
                    this.speechSynthesizer.close();
                    reject(new Error("Failed to synthesize speech. Reason: " + speechResult.reason));
                }
            }, (err: any) => {
                this.speechSynthesizer.close();
                console.error("TTS error:", err);
                reject(new Error("Text-to-speech failed: " + err.message));
            });
        });
    }
}
