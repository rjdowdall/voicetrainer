window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var recIndex = 0;
var FFT_SIZE = 2048;

function saveAudio() {
  audioRecorder.exportWAV(doneEncoding);
}

function gotBuffers(buffers) {
  // the ONLY time gotBuffers is called is right after a new recording is completed -
  // so here's where we should set up the download.
  audioRecorder.exportWAV(doneEncoding);
}

function doneEncoding(blob) {
  Recorder.setupDownload(blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav");
  recIndex++;
}

function toggleRecording(e) {
  var recordButton = e.target;
  if (recordButton.classList.contains("recording")) {
    // stop recording
    audioRecorder.stop();
    recordButton.classList.remove("recording");
    audioRecorder.getBuffers(gotBuffers);
  } else {
    // start recording
    if (!audioRecorder) {
      return;
    }
    recordButton.classList.add("recording");
    audioRecorder.clear();
    audioRecorder.record();
  }
}

function updateAnalysers(plot, analyserNode) {
  var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteFrequencyData(freqByteData);

  // d3 code
  plot.draw(freqByteData)

  rafID = window.requestAnimationFrame(function() {
    updateAnalysers(plot, analyserNode)
  });
}

function cancelAnalyserUpdates() {
  window.cancelAnimationFrame(rafID);
  rafID = null;
}


var freqs =  new Array();
var res = audioContext.sampleRate / FFT_SIZE;
for (i = 0; i < FFT_SIZE / 2; i++) {
    freqs[i] = (i+1) * res;

function gotStream(stream) {
  inputPoint = audioContext.createGain();

  // Create an AudioNode from the stream.
  realAudioInput = audioContext.createMediaStreamSource(stream);
  audioInput = realAudioInput;
  audioInput.connect(inputPoint);

  var analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
  inputPoint.connect(analyserNode);

  audioRecorder = new Recorder(inputPoint);

  var zeroGain = audioContext.createGain();
  zeroGain.gain.value = 0.0;
  inputPoint.connect(zeroGain);
  zeroGain.connect(audioContext.destination);

  var freqs =  new Array();
  for (i = 0; i < FFT_SIZE / 2; i++) {
      freqs[i] = i+1;
  }
  var plot = new D3Plot(freqs, '.microphone-analyser');
  updateAnalysers(plot, analyserNode);

}

// creates a buffer from a file, callback is a function of the newly created buffer
function bufferFromFile(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    callback(e.target.result);
  };
  reader.readAsArrayBuffer(file);
}

function handleFileInput() {
  var fileInput = document.querySelector('.file-input');

  fileInput.addEventListener('change', onNewFile);
}

function onNewFile(e) {
  var file = e.target.files[0];

  bufferFromFile(file, function(buffer) {
    audioContext.decodeAudioData(buffer, function(audioBuffer) {
      var source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      var analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;
      source.connect(analyserNode);

      var zeroGain = audioContext.createGain();
      zeroGain.gain.value = 0.0;
      source.connect(zeroGain);
      // source.connect(audioContext.destination); // play music

      var freqs =  new Array();
      for (i = 0; i < FFT_SIZE / 2; i++) {
          freqs[i] = i+1;
      }
      var plot = new D3Plot(freqs, '.file-analyser');
      updateAnalysers(plot, analyserNode);
      source.start(0);
    });
  });
}

function handleRecordButton() {
  var recordButton = document.getElementById('record');
  recordButton.addEventListener('click', toggleRecording);
}

function handleMicrophoneInput() {
  navigator.getUserMedia({
    "audio": {
      "mandatory": {
        "googEchoCancellation": "false",
        "googAutoGainControl": "false",
        "googNoiseSuppression": "false",
        "googHighpassFilter": "false"
      },
      "optional": []
    },
  }, gotStream, function(e) {
    alert('Error getting audio');
    console.log(e);
  });
}

function main() {
  if (!navigator.getUserMedia) {
    navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  }
  if (!navigator.cancelAnimationFrame) {
    navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
  }
  if (!navigator.requestAnimationFrame) {
    navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;
  }

  handleRecordButton();
  handleFileInput();
  handleMicrophoneInput();
}

document.addEventListener('DOMContentLoaded', main);
