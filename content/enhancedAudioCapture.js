class EnhancedAudioCapture {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.silenceDetector = null;
        this.onDataAvailable = null;
        this.onSilenceDetected = null;
        this.onVisualizationData = null;
        this.onError = null;
        this.silenceThreshold = -50; // dB
        this.silenceDuration = 1000; // ms
        this.lastNonSilenceTime = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async initialize() {
        try {
            await this.setupAudioStream();
            this.setupAudioContext();
            this.setupMediaRecorder();
            this.startVisualization();
            return true;
        } catch (error) {
            this.handleError('Error initializing audio capture:', error);
            return false;
        }
    }

    async setupAudioStream() {
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    }

    setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.gainNode = this.audioContext.createGain();
        
        const source = this.audioContext.createMediaStreamSource(this.stream);
        source.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        
        this.analyser.fftSize = 2048;
    }

    setupMediaRecorder() {
        const options = { mimeType: this.getSupportedMimeType() };
        this.mediaRecorder = new MediaRecorder(this.stream, options);

        this.mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
                if (this.onDataAvailable) {
                    this.onDataAvailable(event.data);
                }
            }
        });

        this.mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.audioChunks = [];
            if (this.onRecordingStop) {
                this.onRecordingStop(audioBlob);
            }
        });
    }

    getSupportedMimeType() {
        const types = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus'];
        for (let type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        throw new Error('No supported mime type found for this browser');
    }

    startRecording() {
        if (!this.isRecording && this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.isRecording = true;
            this.mediaRecorder.start(1000); // Capture in 1-second chunks
            this.startSilenceDetection();
            return true;
        }
        return false;
    }

    stopRecording() {
        if (this.isRecording && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.isRecording = false;
            this.mediaRecorder.stop();
            this.stopSilenceDetection();
            return true;
        }
        return false;
    }

    startSilenceDetection() {
        this.lastNonSilenceTime = Date.now();
        this.silenceDetector = setInterval(() => {
            const dataArray = new Float32Array(this.analyser.fftSize);
            this.analyser.getFloatTimeDomainData(dataArray);
            const rms = this.calculateRMS(dataArray);
            const db = this.rmsToDB(rms);
            
            if (db >= this.silenceThreshold) {
                this.lastNonSilenceTime = Date.now();
            } else if (Date.now() - this.lastNonSilenceTime > this.silenceDuration) {
                if (this.onSilenceDetected) {
                    this.onSilenceDetected();
                }
            }
        }, 100); // Check every 100ms
    }

    stopSilenceDetection() {
        if (this.silenceDetector) {
            clearInterval(this.silenceDetector);
            this.silenceDetector = null;
        }
    }

    calculateRMS(dataArray) {
        return Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length);
    }

    rmsToDB(rms) {
        return 20 * Math.log10(rms);
    }

    startVisualization() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVisualization = () => {
            this.analyser.getByteFrequencyData(dataArray);
            if (this.onVisualizationData) {
                this.onVisualizationData(dataArray);
            }
            requestAnimationFrame(updateVisualization);
        };

        updateVisualization();
    }

    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }

    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.handleError('Max reconnection attempts reached');
            return false;
        }

        try {
            this.release();
            await this.initialize();
            this.reconnectAttempts = 0;
            return true;
        } catch (error) {
            this.reconnectAttempts++;
            this.handleError('Reconnection attempt failed:', error);
            return false;
        }
    }

    handleError(message, error = null) {
        console.error(message, error);
        if (this.onError) {
            this.onError(message, error);
        }
    }

    setCallbacks(callbacks) {
        this.onDataAvailable = callbacks.onDataAvailable || null;
        this.onRecordingStop = callbacks.onRecordingStop || null;
        this.onSilenceDetected = callbacks.onSilenceDetected || null;
        this.onVisualizationData = callbacks.onVisualizationData || null;
        this.onError = callbacks.onError || null;
    }

    async getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
        } catch (error) {
            this.handleError('Error getting audio devices:', error);
            return [];
        }
    }

    async changeAudioSource(deviceId) {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } }
            });
            this.stopRecording();
            this.release();
            this.stream = newStream;
            await this.initialize();
            return true;
        } catch (error) {
            this.handleError('Error changing audio source:', error);
            return false;
        }
    }

    release() {
        this.stopRecording();
        this.stopSilenceDetection();
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.stream = null;
        this.mediaRecorder = null;
        this.analyser = null;
        this.gainNode = null;
        this.audioContext = null;
    }
}

export default EnhancedAudioCapture;