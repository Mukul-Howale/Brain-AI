chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processAudio") {
      transcribeAudio(request.audio)
        .then(text => summarizeText(text))
        .then(summary => {
          // Send the summary back to the popup or content script
          chrome.runtime.sendMessage({
            action: "updateSummary",
            summary: summary
          });
        });
    }
  });
  
  async function transcribeAudio(audioData) {
    // This is a placeholder. You'll need to implement the actual API call
    // to your chosen speech recognition service.
    const response = await fetch('https://api.speechrecognition.com/v1/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: audioData
    });
    const result = await response.json();
    return result.transcript;
  }
  
  async function summarizeText(text) {
    // This is a placeholder. You'll need to implement the actual API call
    // to your chosen summarization service.
    const response = await fetch('https://api.summarization.com/v1/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({ text: text })
    });
    const result = await response.json();
    return result.summary;
  }