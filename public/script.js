const recordButton = document.getElementById('record-btn');
const stopButton = document.getElementById('stop-btn');
const submitButton = document.getElementById('submit-btn');
const audioPlayback = document.getElementById('audio-playback');
const statusText = document.getElementById('status');

let mediaRecorder;
let audioChunks = [];

recordButton.addEventListener('click', async () => {
    console.log('Start Recording button clicked'); // Debug log

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Audio recording is not supported in this browser.');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone stream started:', stream); // Debug log

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            console.log('Data available from MediaRecorder:', event.data); // Debug log
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayback.src = audioUrl;
            audioPlayback.style.display = 'block';
            submitButton.disabled = false;
            statusText.textContent = 'Status: Recording completed. Ready to submit.';
        };

        audioChunks = [];
        mediaRecorder.start();
        console.log('Recording started'); // Debug log
        statusText.textContent = 'Status: Recording...';
        recordButton.disabled = true;
        stopButton.disabled = false;
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording. Check console for details.');
    }
});

stopButton.addEventListener('click', () => {
    console.log('Stop Recording button clicked'); // Debug log

    if (mediaRecorder) {
        mediaRecorder.stop();
        statusText.textContent = 'Status: Recording stopped';
        recordButton.disabled = false;
        stopButton.disabled = true;
    } else {
        console.error('MediaRecorder is not initialized.');
    }
});
