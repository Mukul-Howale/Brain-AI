// This is a simplified example and may need adjustments
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    let audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks);
      sendAudioToBackground(audioBlob);
      audioChunks = [];
    });

    // Start and stop recording based on user interaction or other triggers
    // This example uses a simple interval, but you'd want a more sophisticated approach
    setInterval(() => {
      if (mediaRecorder.state === "inactive") {
        mediaRecorder.start();
      } else {
        mediaRecorder.stop();
      }
    }, 5000); // Adjust interval as needed
  });

function sendAudioToBackground(audioBlob) {
  const reader = new FileReader();
  reader.onloadend = () => {
    chrome.runtime.sendMessage({
      action: "processAudio",
      audio: reader.result
    });
  };
  reader.readAsDataURL(audioBlob);
}