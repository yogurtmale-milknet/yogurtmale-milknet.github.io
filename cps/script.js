 let time = 0;
    let interval;
    let countdownInterval;
    let clicks = 0;
    let startTime;
    let isRunning = false;

    function setTime(seconds) {
      if (isRunning) return;
      time = parseInt(seconds);
      startCountdown();
    }

    function setCustomTime(value) {
      if (isRunning) return;
      const val = parseInt(value);
      if (val > 0) setTime(val);
    }

    function startCountdown() {
      document.getElementById('countdown').textContent = '3.';
      let count = 3;
      countdownInterval = setInterval(() => {
        count--;
        if (count === 0) {
          clearInterval(countdownInterval);
          document.getElementById('countdown').textContent = 'Go';
          setTimeout(() => {
            document.getElementById('countdown').textContent = '';
            startTest();
          }, 500);
        } else {
          document.getElementById('countdown').textContent = `${count}.`;
        }
      }, 1000);
    }

    function startTest() {
      clicks = 0;
      updateDisplay();
      isRunning = true;
      startTime = Date.now();
      interval = setTimeout(endTest, time * 1000);
    }

    function endTest() {
      isRunning = false;
      const elapsed = (Date.now() - startTime) / 1000;
      const cps = (clicks / elapsed).toFixed(2);
      document.getElementById('cps').textContent = `${cps} CPS`;
      updateHighScore(cps);
      if (document.getElementById('auto-restart').checked) {
        startCountdown();
      } else {
        document.getElementById('countdown').textContent = 'GG';
      }
    }

    function registerClick() {
      if (!isRunning) return;
      clicks++;
      updateDisplay();
    }

    function updateDisplay() {
      document.getElementById('clicks').textContent = `${clicks} Clicks`;
    }

    function updateHighScore(cps) {
      const stored = parseFloat(localStorage.getItem('highscore')) || 0;
      if (cps > stored) {
        localStorage.setItem('highscore', cps);
        updateHistory(cps);
      }
      document.getElementById('highscore').textContent = `High Score: ${Math.max(cps, stored)} CPS`;
    }

    function updateHistory(cps) {
      let history = JSON.parse(localStorage.getItem('history') || '[]');
      history.unshift({ score: cps, time: new Date().toLocaleString() });
      localStorage.setItem('history', JSON.stringify(history.slice(0, 10)));
    }

    function showHistory() {
      const history = JSON.parse(localStorage.getItem('history') || '[]');
      const list = document.getElementById('history-list');
      list.innerHTML = history.length
        ? history.map(h => `<div class='history-entry'>${h.time} — ${h.score} CPS</div>`).join('')
        : 'No history yet.';
      document.getElementById('history-modal').style.display = 'flex';
    }

    function hideHistory() {
      document.getElementById('history-modal').style.display = 'none';
    }

    window.onload = () => {
      const score = parseFloat(localStorage.getItem('highscore')) || 0;
      document.getElementById('highscore').textContent = `High Score: ${score} CPS`;
      document.getElementById('countdown').textContent = '';
    };
