let countdownInterval;

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getRandomAlarmSound() {
  const sounds = [
    'alarm.wav',
    'alarm2.wav',
    'alarm3.wav',
    'alarm4.wav',
    'alarm5.wav',
    'alarm6.wav',
    'alarm7.wav',
    'alarm8.wav',
    'alarm9.wav'
  ];
  const randomIndex = Math.floor(Math.random() * sounds.length);
  return sounds[randomIndex];
}

function setAlarm() {
  const timeStr = document.getElementById('timeInput').value;
  const message = document.getElementById('messageInput').value;
  const status = document.getElementById('status');
  const alarmSound = document.getElementById('alarmSound');

  const parts = timeStr.split(':');
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    alert("Please enter time in MM:SS format.");
    return;
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  const totalMs = (minutes * 60 + seconds) * 1000;

  if (totalMs <= 0) {
    alert("Enter a time greater than 0 idiot.");
    return;
  }

  clearInterval(countdownInterval);

  const endTime = Date.now() + totalMs;

  const soundFileInput = document.getElementById('soundFileInput');
  if (soundFileInput.files.length === 0) {
    alarmSound.src = getRandomAlarmSound();
  }

  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  countdownInterval = setInterval(() => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      document.title = "⏰ Time to do whatever you need to do";
      status.textContent = "⏰ Time to do whatever you need to do";
      return;
    }
    const formatted = formatTime(remaining);
    document.title = `⏳ ${formatted}`;
    status.textContent = `Time remaining: ${formatted}`;
  }, 1000);

  setTimeout(() => {
    const remaining = endTime - Date.now();
    const formatted = formatTime(remaining);
    document.title = `⏳ ${formatted}`;
    status.textContent = `Time remaining: ${formatted}`;
  }, 0);

  setTimeout(() => {
    clearInterval(countdownInterval);
    alarmSound.play();

    if (Notification.permission === "granted") {
      new Notification("⏰ Time to do whatever you need to do", { body: message });
    } else {
      alert("Timer: " + message);
    }

    status.textContent = "⏰ Time to do whatever you need to do";
    document.title = "my work here is done (unless you create another timer)";
  }, totalMs);
}

const soundFileInput = document.getElementById('soundFileInput');
soundFileInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const audioURL = URL.createObjectURL(file);
    const alarmSound = document.getElementById('alarmSound');
    alarmSound.src = audioURL;
    alarmSound.load();
    document.getElementById('status').textContent = `✅ This will play once time is up: ${file.name}`;
  }
});
