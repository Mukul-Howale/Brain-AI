document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusText = document.getElementById('statusText');
    const transcriptionDiv = document.getElementById('transcription');
    const summaryDiv = document.getElementById('summary');

    let isTranscribing = false;

    startBtn.addEventListener('click', function() {
        isTranscribing = true;
        updateUI();
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "startTranscription"});
        });
    });

    stopBtn.addEventListener('click', function() {
        isTranscribing = false;
        updateUI();
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "stopTranscription"});
        });
    });

    function updateUI() {
        startBtn.disabled = isTranscribing;
        stopBtn.disabled = !isTranscribing;
        statusText.textContent = isTranscribing ? "Transcribing..." : "Ready to transcribe";
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "updateTranscription") {
            transcriptionDiv.textContent = request.text;
        } else if (request.action === "updateSummary") {
            summaryDiv.textContent = request.summary;
        }
    });
});