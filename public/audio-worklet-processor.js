class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.lastUpdateTime = 0; // To throttle messages to the main thread
    }

    process(inputs, outputs, parameters) {
        const inputBuffer = inputs[0];

        if (inputBuffer && inputBuffer[0]) {
            const audioData = inputBuffer[0]; // Get data for the first channel

            let sumOfSquares = 0;
            let peak = 0;

            for (let i = 0; i < audioData.length; i++) {
                const sample = audioData[i];
                sumOfSquares += sample * sample;
                if (Math.abs(sample) > peak) {
                    peak = Math.abs(sample); // Track the peak value
                }
            }

            const rmsLevel = Math.sqrt(sumOfSquares / audioData.length);

            // Throttle messages to the main thread (e.g., every 100ms)
            let updTime = currentTime * 1000; // Convert to ms
            if (updTime - this.lastUpdateTime > 200) {
                this.port.postMessage({ rms: rmsLevel, peak: peak });
                this.lastUpdateTime = updTime;
            }
        }

        return true; // Keep the processor alive
    }
}

registerProcessor('audio-processor', AudioProcessor);