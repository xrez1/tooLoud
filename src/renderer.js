/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
import './index.css';
import {initializeLimits, newLimit, checkActiveLimits, checkSoundLevelAndPlay} from './limits/limits.js';
import {initializeSounds} from './sounds/sounds.js';

// buffer for the last 20 seconds of peak values
const peakBuffer = [];
const bufferDuration = 20000; // 20 seconds in milliseconds

// 80 seems more acurate to obs
let vuLowerRange = 60;
let vuUpperRange = 0;

let audioContext;
let audioSource;
let audioWorkletNode;

async function getMicrophoneStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log("Accessed microphone: ", stream);
        processAudioStream(stream); // Function to handle the audio stream
    } catch (err) {
        console.log("Failed to access microphone: ", err);
    }
}

async function processAudioStream(stream) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioSource = audioContext.createMediaStreamSource(stream);

        try {
            // Ensure the AudioWorkletProcessor is defined (loaded)
            await audioContext.audioWorklet.addModule('./audio-worklet-processor.js');

            audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');

            // Optional: Send parameters to the AudioWorkletProcessor
            // audioWorkletNode.port.postMessage({ parameter: 'value' });

            // Receive messages from the AudioWorkletProcessor
            audioWorkletNode.port.onmessage = (event) => {
                const { rms, peak } = event.data;

                // Convert RMS to decibels for better visualization
                const rmsDb = 20 * Math.log10(rms);
                const peakDb = 20 * Math.log10(peak);

                updateVUMeter(rmsDb, peakDb);

                /*if (window.electron && window.electron.ipcRenderer) {
                    window.electron.ipcRenderer.send('volume-data', audioData);
                }
                // Example: Sending audio data to the main process (see step 3)
                /*if (window.electron && window.electron.ipcRenderer) {
                    window.electron.ipcRenderer.send('audio-chunk', audioData);
                }*/
            };

            // Connect the audio source to the AudioWorkletNode
            audioSource.connect(audioWorkletNode);

            // Connect the AudioWorkletNode to the audio context's destination
            // (required to keep the audio stream active, though we might not be playing it)
            audioWorkletNode.connect(audioContext.destination);

        } catch (error) {
            console.error('Error creating or connecting AudioWorkletNode:', error);
            // Fallback to ScriptProcessorNode or inform the user
        }
    }
}

function updateVUMeter(rmsDb, peakDb) {
    const vuElement = document.getElementById("negative");
    const peakElement = document.getElementById("peak");
    const absolutePeakElement = document.getElementById("absolutePeak");

    // Log the raw values for debugging
    //console.log("RMS (dB):", rmsDb, "Peak (dB):", peakDb);

    // Normalize RMS and Peak values to a range (e.g., -80dB to 0dB)
    // Normalize to 0-100%
    const normalizedRms = Math.max(vuUpperRange, (peakDb + vuLowerRange) / vuLowerRange * 100);
    const normalizedPeak = Math.max(vuUpperRange, (rmsDb + vuLowerRange) / vuLowerRange * 100);

    vuElement.style.width = `${normalizedRms}%`;
    peakElement.style.width = `${normalizedPeak}%`;

    // Add the current peak to the buffer
    const currentTime = Date.now();
    peakBuffer.push({ time: currentTime, value: normalizedPeak });

    // Remove old values from the buffer (older than 20 seconds)
    while (peakBuffer.length > 0 && peakBuffer[0].time < currentTime - bufferDuration) {
        peakBuffer.shift();
    }

    // Find the highest peak in the buffer
    const highestPeak = Math.max(...peakBuffer.map(entry => entry.value));
    absolutePeakElement.style.width = `${highestPeak}%`;
}

document.addEventListener("DOMContentLoaded", function (e) {
    const limitButton = document.getElementById("limitButtons")
    limitButton.addEventListener("click", function () {
        newLimit();
    })

    getMicrophoneStream();

    initializeLimits();
    initializeSounds();

    // Start checking every second
    setInterval(checkActiveLimits, 1000);
    // Start monitoring sound levels and playing sounds
    setInterval(checkSoundLevelAndPlay, 500); // Check every 500ms
})

// TODO: ADD MORE THEMES
// TODO: ADD SOUNDS FROM FOLDER OR INDIVIDUAL SOUNDS FOR TIMEFRAMES

