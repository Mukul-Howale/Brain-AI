class TranscriptionService {
    constructor() {
        this.apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
        this.apiEndpoint = 'https://api.example.com/transcribe'; // Replace with your API endpoint
    }

    async transcribe(audioChunk) {
        const formData = new FormData();
        formData.append('audio', audioChunk, 'audio.webm');

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.transcription;
    }
}

export default TranscriptionService;