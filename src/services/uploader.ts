import supabase from '../services/supabase-client';

export default async function uploadAudioFile(audioData: Buffer, destinationPath: string) {
    try {
        const { error: uploadError } = await supabase.storage
            .from('audio')
            .upload(destinationPath, audioData, {
                contentType: 'audio/wav',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('audio')
            .getPublicUrl(destinationPath);
        
        console.log(`File uploaded successfully to ${destinationPath}`);
        console.log(`Public URL: ${publicUrl}`);

        return {
            path: destinationPath,
            url: publicUrl,
        };
    } catch (error: any) {
        console.error("Error uploading buffer:", error);
        throw new Error("Failed to upload audio file: " + error.message);
    }
};
