import { playSound, soundData } from '../sounds/sounds.js';

export let limitsData = []; // Global variable to store the limits
loadLimits()

function populateSoundDropdown(selectElement, selectedSound = "") {
    // Clear existing options except "No Sound"
    selectElement.innerHTML = '<option value="">No Sound</option>';
    
    // Add all available sounds
    soundData.forEach(soundItem => {
        const option = document.createElement('option');
        option.value = soundItem.sound;
        option.textContent = soundItem.sound;
        if (soundItem.sound === selectedSound) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

export function refreshAllSoundDropdowns() {
    const soundSelects = document.querySelectorAll('.limitSoundSelect');
    soundSelects.forEach(select => {
        const currentValue = select.value;
        populateSoundDropdown(select, currentValue);
    });
}

export function initializeLimits() {
    const rangeInputArray = document.getElementsByClassName("limitRange");
    
    const limitBoxes = document.querySelectorAll(".limitBox");
    limitBoxes.forEach(box => {
        // Add event listeners for all input fields
        const inputs = box.querySelectorAll("input, select");
        inputs.forEach(input => {
            input.addEventListener("change", function () {
                const id = box.getAttribute("data-id");
                const field = input.className;
                const value = input.value;

                // Update the corresponding limit in limitsData
                const limit = limitsData.find(l => l.id == id);
                if (limit) {
                    if (field === "limitName") limit.name = value;
                    if (field === "limitFrom") limit.from = value;
                    if (field === "limitTo") limit.to = value;
                    if (field === "limitPercentage") limit.percentage = parseInt(value, 10);
                    if (field === "limitSoundSelect") limit.selectedSound = value;
                }

                saveLimits();
            });
        })
    });

    // For the range gradient updates
    for (let e = 0; e < rangeInputArray.length; e++) {
        rangeInputArray[e].addEventListener("change", function () {
            updateRange(this);

            const limitPercentage = findLimitPercentage(rangeInputArray[e])
            limitPercentage.value = rangeInputArray[e].value
        })

        rangeInputArray[e].addEventListener("input", function () {
            updateRange(this);

            const limitPercentage = findLimitPercentage(rangeInputArray[e])
            limitPercentage.value = rangeInputArray[e].value
        })
    }

    // For the range gradient initial ammount
    for (let e = 0; e < rangeInputArray.length; e++) {
        updateRange(rangeInputArray[e]);

        const limitPercentage = findLimitPercentage(rangeInputArray[e])
        limitPercentage.value = rangeInputArray[e].value

        limitPercentage.addEventListener("input", function () {
            const limitRange = findLimitRange(limitPercentage)
            limitRange.value = limitPercentage.value
            updateRange(limitRange);
        })
    }

    const deleteButtonArray = document.querySelectorAll(".deleteButton");
    deleteButtonArray.forEach(button => {
        button.addEventListener("click", function () {
            const limitBox = findLimitBox(this);
            const id = limitBox.getAttribute("data-id");

            limitsData = limitsData.filter(l => l.id !== id);
            limitBox.remove();
            saveLimits()
        });
    });
}

export function checkActiveLimits() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Get current time in "HH:MM" format

    limitsData.forEach(limit => {
        const limitBox = document.querySelector(`.limitBox[data-id="${limit.id}"]`);
        if (!limitBox) return; // Skip if the limit box is not found

        const activeIndicator = limitBox.querySelector(".activeIndicator");

        // Check if the time range spans across midnight
        if (limit.from > limit.to) {
            // Active if current time is after `limitFrom` or before `limitTo`
            if (currentTime >= limit.from || currentTime <= limit.to) {
                activeIndicator.style.display = "inline"; // Show 
            } else {
                activeIndicator.style.display = "none"; // Hide
            }
        } else {
            // Active if current time is between `limitFrom` and `limitTo`
            if (currentTime >= limit.from && currentTime <= limit.to) {
                activeIndicator.style.display = "inline"; // Show
            } else {
                activeIndicator.style.display = "none"; // Hide
            }
        }
    });
}

let lastSoundPlayTime = 0;
const soundCooldown = 2000; // Cooldown in milliseconds (e.g., 3 seconds)

export function checkSoundLevelAndPlay() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    const peakElement = document.getElementById("negative");
    const currentPeak = parseFloat(peakElement.style.width); 
    
    const limitBoxes = document.querySelectorAll(".limitBox");
    limitBoxes.forEach(limitBox => {
        const limitFrom = limitBox.querySelector(".limitFrom").value;
        const limitTo = limitBox.querySelector(".limitTo").value;
        const limitPercentage = parseInt(limitBox.querySelector(".limitPercentage").value, 10);
        const selectedSound = limitBox.querySelector(".limitSoundSelect").value;

        // Check if the time range spans across midnight
        const isActive = (limitFrom > limitTo)
            ? (currentTime >= limitFrom || currentTime <= limitTo) // Active if time spans midnight
            : (currentTime >= limitFrom && currentTime <= limitTo); // Active if time is within range

        if (isActive && currentPeak > limitPercentage) {
            // Check if the cooldown period has passed
            const currentTimestamp = Date.now();
            if (currentTimestamp - lastSoundPlayTime < soundCooldown) {
                return;
            }

            // Play the specific sound selected for this limit, or fall back to random enabled sounds
            if (selectedSound) {
                console.log(`Playing selected sound for limit: ${selectedSound}`);
                playSound(selectedSound);
                lastSoundPlayTime = currentTimestamp;
            } else {
                // Fallback to original behavior: play a random enabled sound
                const enabledSounds = soundData.filter(sound => sound.enabled);

                if (enabledSounds.length > 0) {
                    // Play a random enabled sound
                    const randomSound = enabledSounds[Math.floor(Math.random() * enabledSounds.length)];
                    if (!randomSound) return; 
                    console.log(enabledSounds, randomSound);

                    playSound(randomSound.sound);
                    lastSoundPlayTime = currentTimestamp;
                }
            }
        }
    });
}

export function newLimit(id = Date.now(), name = "New limit!", from = "00:00", to = "00:00", percentage = 50, selectedSound = "") {
    const container = document.getElementById("limitContainer")

    const template = `
        <div class="limitBox" data-id="${id}">
            <p>
                <input class="limitName" value="${name}"></input>
                <input type="time" class="limitFrom" value="${from}"></input>
                <input type="time" class="limitTo" value="${to}"></input>
                <input type="number" class="limitPercentage" min="0" max="100" value="${percentage}"></input>
                <select class="limitSoundSelect">
                    <option value="">No Sound</option>
                </select>
                <span class="activeIndicator" style="display: none; color: red;">●</span>
                <button class="deleteButton">✕</button>
                <input type="range" class="limitRange" min="0" max="100" value="${percentage}">
            </p>
        </div>
    `

    container.insertAdjacentHTML("beforeend", template)
    
    // Populate the sound dropdown for this limit
    const limitBox = container.querySelector(`[data-id="${id}"]`);
    populateSoundDropdown(limitBox.querySelector('.limitSoundSelect'), selectedSound);
    
    limitsData.push({ id, name, from, to, percentage, selectedSound });

    initializeLimits();
}

export async function saveLimits() {
    const limitBoxes = document.querySelectorAll(".limitBox");
    const limits = [];

    limitBoxes.forEach(box => {
        const id = box.getAttribute("data-id");
        const name = box.querySelector(".limitName").value;
        const from = box.querySelector(".limitFrom").value;
        const to = box.querySelector(".limitTo").value;
        const percentage = parseInt(box.querySelector(".limitPercentage").value, 10);
        const selectedSound = box.querySelector(".limitSoundSelect").value;

        limits.push({ id, name, from, to, percentage, selectedSound });
    });

    // Send the limits data to the main process
    if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('save-limits', limits);
    } else {
        console.error("Electron ipcRenderer is not available.");
    }
}

export async function loadLimits() {
    // Request the saved limits from the main process
    if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.invoke('load-limits').then((limits) => {
            if (Array.isArray(limits)) {
                limits.forEach(limit => {
                    newLimit(limit.id, limit.name, limit.from, limit.to, limit.percentage, limit.selectedSound || "");
                });
            } else {
                console.error("Invalid limits data received:", limits);
            }
        }).catch(err => {
            console.error("Failed to load limits:", err);
        });
    } else {
        console.error("Electron ipcRenderer is not available.");
    }
}
export function updateRange(e) {
    const value = e.value;
    const percentage = (value / e.max) * 100;
    let style = window.getComputedStyle(document.documentElement);
    const progressColor = style.getPropertyValue('--back-bg'); // Color for the traveled amount
    const remainingColor = style.getPropertyValue('--accent-color'); // Color for the leftover amount

    e.style.backgroundImage = `linear-gradient(to right, ${progressColor} ${percentage}%, ${remainingColor} ${percentage}%)`;
}


//?UTIL

//finds the limitBox from any element
function findLimitBox(element) {
    const limitBox = element.closest(".limitBox")

    if (limitBox) {
        return limitBox;
    }

    return null;
}

// finds the percentage box from a element
function findLimitPercentage(limitRangeElement) {
    const limitBox = limitRangeElement.closest(".limitBox")

    if (limitBox) {
        const limitPercentageElement = limitBox.querySelector(".limitPercentage");
        return limitPercentageElement;
    }

    return null;
}

// finds the range from a element
function findLimitRange(limitRangeElement) {
    const limitBox = limitRangeElement.closest(".limitBox")

    if (limitBox) {
        const limitPercentageElement = limitBox.querySelector(".limitRange");
        return limitPercentageElement;
    }

    return null;
}