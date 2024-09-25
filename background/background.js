import TranscriptionService from '../lib/transcriptionService.js';

const transcriptionService = new TranscriptionService();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processAudioChunk') {
        processAudioChunk(request.audioChunk);
    }
});

async function processAudioChunk(audioChunk) {
    try {
        const transcription = await transcriptionService.transcribe(audioChunk);
        updateTranscription(transcription);
    } catch (error) {
        console.error('Transcription error:', error);
    }
}

function updateTranscription(transcription) {
    // Send transcription to popup for display
    chrome.runtime.sendMessage({
        action: 'updateTranscription',
        transcription: transcription
    });
}