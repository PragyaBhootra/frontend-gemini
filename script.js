let ws;
let audioContext, processor, source;

document.getElementById("start").onclick = async () => {
  ws = new WebSocket("wss://gemini-oy82.onrender.com/ws"); // Replace this
  ws.binaryType = "arraybuffer";

  const status = document.getElementById("status");
  status.innerText = "Connecting...";

  ws.onopen = async () => {
    status.innerText = "Connected. Speak now.";

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContext();
    source = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(1024, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        pcm16[i] = Math.min(1, Math.max(-1, input[i])) * 0x7fff;
      }
      ws.send(pcm16.buffer);
    };

    ws.onmessage = (e) => {
      const buffer = e.data;
      playAudio(buffer);
    };
  };
};

document.getElementById("stop").onclick = () => {
  document.getElementById("status").innerText = "Stopped.";
  if (processor) processor.disconnect();
  if (source) source.disconnect();
  if (audioContext) audioContext.close();
  if (ws) ws.close();
};

function playAudio(arrayBuffer) {
  const ctx = new AudioContext();
  ctx.decodeAudioData(arrayBuffer).then((buffer) => {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start();
  });
}
