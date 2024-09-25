const audioCapture = new EnhancedAudioCapture();
let audioPreprocessor;

async function setupAudioCapture() {
    const initialized = await audioCapture.initialize();
    if (!initialized) {
        console.error('Failed to initialize audio capture');
        return;
    }

    audioPreprocessor = new AudioPreprocessor(audioCapture.audioContext);
    audioPreprocessor.connectNodes(audioCapture.gainNode);

    // Set up audio preprocessing
    audioPreprocessor.setNoiseGateThreshold(-50);
    audioPreprocessor.setCompressorSettings({
        threshold: -24,
        knee: 30,
        ratio: 12,
        attack: 0.003,
        release: 0.25
    });

    audioCapture.setCallbacks({
        onDataAvailable: sendAudioChunkToBackground,
        onRecordingStop: handleRecordingStop,
        onSilenceDetected: handleSilenceDetected,
        onVisualizationData: updateVisualization,
        onError: handleError
    });

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener(handleMessage);

    // Set up automatic reconnection
    setInterval(checkAndReconnectAudioStream, 5000);
}

function sendAudioChunkToBackground(data) {
    chrome.runtime.sendMessage({
        action: 'processAudioChunk',
        audioChunk: data
    });
}

function handleRecordingStop(audioBlob) {
    console.log('Recording stopped, final audio blob size:', audioBlob.size);
    // Implement final processing if needed
}

function handleSilenceDetected() {
    console.log('Silence detected');
    // Implement silence handling if needed
}

function updateVisualization(dataArray) {
    // Implement visualization logic
    // This could involve sending data to the popup for visualization
}

function handleError(message, error) {
    console.error(message, error);
    // Implement error reporting logic
}

function handleMessage(request, sender, sendResponse) {
    switch (request.action) {
        case 'startTranscription':
            audioCapture.startRecording();
            break;
        case 'stopTranscription':
            audioCapture.stopRecording();
            break;
        case 'changeVolume':
            audioCapture.setVolume(request.volume);
            break;
    }
}

async function checkAndReconnectAudioStream() {
    if (!audioCapture.stream || audioCapture.stream.getAudioTracks()[0].readyState === 'ended') {
        console.log('Audio stream lost, attempting to reconnect...');
        const reconnected = await audioCapture.reconnect();
        if (reconnected) {
            console.log('Successfully reconnected audio stream');
        } else {
            console.error('Failed to reconnect audio stream');
        }
    }
}

setupAudioCapture();

// Cleanup function to be called when the extension is deactivated or the tab is closed
function cleanup() {
    audioCapture.release();
}

// You might need to set up a way to call cleanup when appropriate