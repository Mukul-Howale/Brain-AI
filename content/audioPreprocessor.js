class AudioPreprocessor {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.noiseGate = this.createNoiseGate();
    }

    createNoiseGate() {
        const noiseGate = this.audioContext.createGain();
        noiseGate.gain.value = 0;
        return noiseGate;
    }

    connectNodes(sourceNode) {
        sourceNode.connect(this.noiseGate);
        this.noiseGate.connect(this.compressor);
        this.compressor.connect(this.audioContext.destination);
    }

    setNoiseGateThreshold(threshold) {
        // Implement a simple noise gate
        this.noiseGate.gain.setValueAtTime(threshold, this.audioContext.currentTime);
    }

    setCompressorSettings(settings) {
        Object.keys(settings).forEach(key => {
            if (this.compressor[key]) {
                this.compressor[key].setValueAtTime(settings[key], this.audioContext.currentTime);
            }
        });
    }
}

export default AudioPreprocessor;