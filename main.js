const videoPlayer = document.querySelector('video');
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;
let mediaSource;
let stream;
let segmentNumber = 1;
let segments = []
let uploadInProgress = false;

async function fetchVideoList() {
  const response = await fetch('http://localhost:5000/list_videos', {
    method: 'GET'
  });

  const videoList = await response.json();
  displayVideoList(videoList);
}

function displayVideoList(videoList) {
  const container = document.getElementById('videoList');
  videoList.forEach(video => {
    const videoItem = document.createElement('div');
    videoItem.innerHTML = video;
    videoItem.onclick = () => playVideo(video);
    container.appendChild(videoItem);
  });
}

function playVideo(video) {
  const manifestUrl = 'video_repository/' + video;
  const player = dashjs.MediaPlayer().create();
  player.initialize(document.querySelector("#videoPlayer"), manifestUrl, true);
}

async function startCapture() {
  console.log('Starting capture...');
  try {
    recordedBlobs = [];
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
  }
}

function handleSuccess(stream) {
  console.log('Capture successful');
  window.stream = stream;
  videoPlayer.srcObject = stream;
  const options = { mimeType: 'video/webm; codecs="vp8,opus"' };
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    return;
  }
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped:', event);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(3000); // Collect 3000ms (3s) of data
  console.log('MediaRecorder started');
}

function stopCapture() {
  console.log('Stopping capture...');
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
  window.stream.getTracks().forEach(track => {
    track.stop();
  });
}

function handleDataAvailable(event) {
  console.log('Data available:', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
    const segment = recordedBlobs.shift();
    processSegment(segment, segmentNumber);
    segmentNumber++;
  }
}

async function processSegment(segment, segmentNumber) {
  const formData = new FormData();
  const segmentFile = new File([segment], `segment_${segmentNumber}.mp4`, { type: segment.type });
  formData.append('videoSegment', segmentFile);
  formData.append('segment_number', segmentNumber);

  try {
    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log(`Segment ${segmentNumber} uploaded successfully`);
    } else {
      console.error(`Error uploading segment ${segmentNumber}: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error uploading segment ${segmentNumber}: ${error}`);
  }
}

document.getElementById("startCapture").onclick = startCapture;
document.getElementById("stopCapture").onclick = stopCapture;

// Fetch the video list when the page is loaded
fetchVideoList();
