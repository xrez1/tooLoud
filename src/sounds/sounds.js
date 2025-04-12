export let soundData = [];
loadSounds();

export function initializeSounds() {
    initializeSoundEvents();
}

export async function loadSounds() {
    if (window.electron && window.electron.ipcRenderer) {
        soundData = await window.electron.ipcRenderer.invoke('load-sounds') || [];
        const sounds = await window.electron.ipcRenderer.invoke('get-sounds');

        sounds.forEach(sound => {
            newSound(sound, soundData.find(s => s.sound === sound)?.enabled || false);
        });
    } else {
        console.error('Electron ipcRenderer is not available.');
    }
}

export async function saveSounds() {
    if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('save-sounds', soundData);
    } else {
        console.error('Electron ipcRenderer is not available.');
    }
}

export function initializeSoundEvents() {
    document.getElementById('soundButtons').addEventListener('click', function () {
        window.electron.ipcRenderer.invoke('add-new-sound').then((e) => {
            newSound(e, false);
        })
    });

    document.querySelectorAll('.playSound').forEach(button => {
        button.addEventListener('click', function () {
            const soundFile = this.parentElement.parentElement.getAttribute('data-sound');
            playSound(soundFile);
        });
    });

    document.querySelectorAll('.deleteSound').forEach(button => {
        button.addEventListener('click', function () {
            const soundFile = this.parentElement.parentElement.getAttribute('data-sound');
            window.electron.ipcRenderer.send('delete-sound', soundFile);
            this.parentElement.parentElement.parentElement.remove();
        });
    });

    // Add event listeners for checkboxes
    document.querySelectorAll('.soundToggle').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const soundBox = this.parentElement.parentElement;
            const soundFile = soundBox.getAttribute('data-sound');
            if (this.checked && !soundData.find(s => s.sound === soundFile)) {
                soundData.push({ sound: soundFile, enabled: true });
            } else if (this.checked && soundData.find(s => s.sound === soundFile)) {
                const soundIndex = soundData.findIndex(s => s.sound === soundFile);
                if (soundIndex !== -1) {
                    soundData[soundIndex].enabled = true;
                }
            } else {
                const soundIndex = soundData.findIndex(s => s.sound === soundFile);
                if (soundIndex !== -1) {
                    soundData[soundIndex].enabled = false;
                }
            }
            saveSounds()
        });
    });
}

function newSound(sound, isEnabled = false) {
    if (!sound) return;

    if (!soundData.find(s => s.sound === sound)) {
        soundData.push({ sound, enabled: isEnabled });
        saveSounds();
    }

    const template = `
    <div id="soundList">
        <div data-sound="${sound}" class="soundBox">
        <span class="soundName">${sound}</span>
        <e style="float: right;">
            <input type="checkbox" class="soundToggle" ${isEnabled ? 'checked' : ''}>
            <button class="playSound" >▶</button>
            <button class="deleteSound">✕</button>
        </e>
        </div>
    </div>
    `;

    soundContainer.insertAdjacentHTML("beforeend", template);
    initializeSoundEvents();
}

export async function playSound(soundFile) {
    const soundPath = `local://${soundFile}`; // Use the custom protocol

    const audio = new Audio(soundPath);
    audio.play().catch((error) => {
        console.error('Error playing sound:', error);
    });
}