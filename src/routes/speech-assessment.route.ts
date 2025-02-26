
import { Router } from 'express';
import { Request, Response } from 'express';
import AzureClient, { SpeechAssessmentResult } from '../services/azure-client';
import asyncHandler from 'express-async-handler';

const speechAssessmentRoutes = Router();

speechAssessmentRoutes.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Configurer Azure Speech
    const { API_KEY: apiKey, AZURE_SPEECH_REGION: serviceRegion, AZURE_SPEECH_LANGUAGE: speechLanguage } = process.env;
    // Initialiser OpenAI
    const { audio_url, reference_text } = req.body;
    console.log(apiKey, serviceRegion, speechLanguage, audio_url, reference_text);
    // Vérifier si les paramètres nécessaires sont présents
    if (!apiKey || !serviceRegion || !speechLanguage || !audio_url || !reference_text) {
        res.status(400).json({ error: 'Paramètres manquants' });
        return;
    }

    const azureTtsService: AzureClient = new AzureClient(apiKey as string, serviceRegion as string, speechLanguage as string);

    try {
        const result: SpeechAssessmentResult = await azureTtsService.speechAssessment(reference_text, audio_url);
        res.json(result);
    } catch (error) {
        console.error('Erreur lors de l\'évaluation de la prononciation:', error);
        res.status(500).json({ error: 'Erreur lors de l\'évaluation de la prononciation' });
    }
}));

export default speechAssessmentRoutes;
