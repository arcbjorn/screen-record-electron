const { desktopCapturer, remote } = require('electron');

// remote is handling IPC (Inter Process Communication)
const { Menu, dialog } = remote;

const { writeFile } = require('fs');

// State
let mediaRecorder; // capture the video
const recordedChunks = [];

// Buttons

const videoElement = document.querySelector('video');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = (e) => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = (e) => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;


// Get the available video sources

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map((source) => {
            return {
                label: source.name,
                click: () => selectSource(source)
            }
        })
    );

    videoOptionsMenu.popup();
}


// Change the videoSource window to record
async function selectSource(source) {
    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };
    
    // Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Preview the source in a video element
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the Media Recorded
    const options = { mimetype: 'video/webm; codec=vp9' }
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

// All recoreded chunks
function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}

// Combine chunks into the video
async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const {filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `video-${Date.now()}.webm`
    });

    console.log(filePath);
    writeFile(filePath, buffer, () => console.log('Video saved successfully!'));
}
