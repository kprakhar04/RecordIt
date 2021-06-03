const { Menu, dialog, desktopCapturer } = require('@electron/remote');
const { writeFile } = require('fs');


//global variables

let mediaRecorder;
let stream;
let currentSource;

let recordedChunks = [];

const videoElement = document.querySelector('video');

const startBtn = document.querySelector('#startBtn');
const stopBtn = document.querySelector('#stopBtn');
const pauseBtn = document.querySelector('#pauseBtn');
const audioBtn = document.querySelector('#switchColorInfo');

startBtn.addEventListener('click', event => {
    if (!mediaRecorder || mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') return;
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.textContent = 'Recording';
    pauseBtn.style.display = 'inline';
    audioBtn.disabled = true;
});

stopBtn.addEventListener('click', event => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.textContent = 'Start';
    pauseBtn.style.display = 'none';
    audioBtn.disabled = false;
});

pauseBtn.addEventListener('click', e => {
    if (!mediaRecorder) return;
    if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        pauseBtn.textContent = 'Pause';
        pauseBtn.classList.add('is-danger');
        pauseBtn.classList.remove('is-link');
    } else {
        mediaRecorder.pause();
        pauseBtn.textContent = 'Resume';
        pauseBtn.classList.remove('is-danger');
        pauseBtn.classList.add('is-link');
    }
});

const videoSelectBtn = document.querySelector('#videoSelectBtn');

videoSelectBtn.addEventListener('click', event => {
    getVideoSources();
});


const getVideoSources = async () => {
    const inputSources = await desktopCapturer.getSources(
        {
            types: ['window', 'screen']
        });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            }
        })
    );

    videoOptionsMenu.popup();
}

audioBtn.addEventListener('change', e => {
    if (currentSource) {
        configureSource(audioBtn.checked, currentSource);
    }
});

const selectSource = async source => {
    videoSelectBtn.textContent = source.name;
    currentSource = source;
    configureSource(audioBtn.checked, currentSource);
}

const configureSource = async (micStatus, source) => {
    const constraintsVideo = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    }
    const constraintsAudio = { audio: micStatus }

    // create audio and video streams separately
    let audioStream;
    if (micStatus) {
        audioStream = await navigator.mediaDevices.getUserMedia(constraintsAudio);
    }
    const videoStream = await navigator.mediaDevices.getUserMedia(constraintsVideo);

    if (micStatus) {
        stream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
    } else {
        stream = new MediaStream([...videoStream.getVideoTracks()]);
    }

    videoElement.srcObject = stream;
    videoElement.play();

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

// Captures all recorded chunks
const handleDataAvailable = e => {
    recordedChunks.push(e.data);
}

const handleStop = async e => {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });
    const buffer = Buffer.from(await blob.arrayBuffer());
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `rec-${Date.now()}.mp4`
    });
    if (filePath) {
        writeFile(filePath, buffer, () => console.log('recording saved successfully!'));
    }
    recordedChunks = [];

}