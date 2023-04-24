document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const distortButton = document.getElementById("distortButton");
  const playButton = document.getElementById("playButton");
  const pauseButton = document.getElementById("pauseButton");
  const stopButton = document.getElementById("stopButton");
  const downloadButton = document.getElementById("downloadButton");
  const audioElement = document.getElementById("audioElement");
  let audioContext, audioBuffer, audioBufferSource, audioDistortion;
  let isPaused = false;
  let isStopped = false;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  async function loadAudioFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function (event) {
        try {
          const data = event.target.result;
          const buffer = await audioContext.decodeAudioData(data);
          resolve(buffer);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = function (event) {
        reject(event.target.error);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  fileInput.addEventListener("change", async function () {
    if (this.files.length === 0) {
      return;
    }
    stopAudio();
    audioBuffer = await loadAudioFile(this.files[0]);
    audioBufferSource = audioContext.createBufferSource();
    audioDistortion = audioContext.createWaveShaper();
    audioBufferSource.buffer = audioBuffer;
    audioBufferSource.loop = false;

    audioDistortion.curve = makeDistortionCurve(440); // Increased distortion by 10%
    audioDistortion.oversample = "4x";

    audioBufferSource.connect(audioDistortion);
    audioDistortion.connect(audioContext.destination);
    distortButton.disabled = false;
  });

  distortButton.addEventListener("click", function () {
    if (!audioBufferSource || isPaused || isStopped) {
      return;
    }

    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    audioBufferSource.start(0);
    playButton.disabled = false;
    pauseButton.disabled = false;
    stopButton.disabled = false;
    downloadButton.disabled = false;
  });

  playButton.addEventListener("click", function () {
    playAudio();
  });

  pauseButton.addEventListener("click", function () {
    pauseAudio();
  });

  stopButton.addEventListener("click", function () {
    stopAudio();
  });

  downloadButton.addEventListener("click", function () {
    downloadDistortedAudio();
  });

  function playAudio() {
    if (isPaused) {
      audioContext.resume();
      isPaused = false;
    } else if (isStopped) {
      audioBufferSource = audioContext.createBufferSource();
      audioBufferSource.buffer = audioBuffer;
      audioBufferSource.loop = false;
      audioBufferSource.connect(audioDistortion);
      audioDistortion.connect(audioContext.destination);
      audioBufferSource.start(0);
      isStopped = false;
    }
  }
  
  function pauseAudio() {
    if (!isPaused) {
      audioContext.suspend();
      isPaused = true;
    }
  }

  function stopAudio() {
    if (!isStopped) {
      if (audio
  function stopAudio() {
    if (!isStopped) {
      if (audioBufferSource) {
        audioBufferSource.stop();
        isStopped = true;
        isPaused = false;
      }
    }
  }

  function downloadDistortedAudio() {
    if (!audioBuffer) {
      return;
    }
  
    const offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
    const offlineBufferSource = offlineContext.createBufferSource();
    const offlineDistortion = offlineContext.createWaveShaper();
  
    offlineBufferSource.buffer = audioBuffer;
    offlineBufferSource.loop = false;
    offlineDistortion.curve = makeDistortionCurve(440);
    offlineDistortion.oversample = "4x";
  
    offlineBufferSource.connect(offlineDistortion);
    offlineDistortion.connect(offlineContext.destination);
  
    offlineBufferSource.start(0);
    offlineContext.startRendering().then(function (renderedBuffer) {
      const mp3Encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128);
      const mp3Data = [];
      const bufferSize = 1152;
  
      for (let i = 0; i < renderedBuffer.numberOfChannels; i++) {
        const channelData = renderedBuffer.getChannelData(i);
        for (let j = 0; j < channelData.length; j += bufferSize) {
          const left = channelData.subarray(j, j + bufferSize);
          const mp3Buffer = mp3Encoder.encodeBuffer(left);
          if (mp3Buffer.length > 0) {
            mp3Data.push(mp3Buffer);
          }
        }
      }
  
      const endBuffer = mp3Encoder.flush();
      if (endBuffer.length > 0) {
        mp3Data.push(endBuffer);
      }
  
      const mp3Blob = new Blob(mp3Data, { type: "audio/mp3" });
      const url = URL.createObjectURL(mp3Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "distorted-audio.mp3";
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 0);
    });
  }  

  function makeDistortionCurve(amount) {
    const n_samples = 8192;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }
});
