const { ipcRenderer } = require('electron');

const stageLabel = document.getElementById('stage-label');
const timeDisplay = document.getElementById('time-display');
const progressRing = document.getElementById('progress-ring');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const focusDurationInput = document.getElementById('focus-duration');
const breakDurationInput = document.getElementById('break-duration');

const STATE = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused'
};

const STAGE = {
  FOCUS: 'focus',
  BREAK: 'break'
};

let currentState = STATE.IDLE;
let currentStage = STAGE.FOCUS;
let timeRemaining = 25 * 60;
let totalDuration = 25 * 60;
let timerInterval = null;

const RING_RADIUS = 120;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function initProgressRing() {
  progressRing.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
  progressRing.style.strokeDashoffset = 0;
}

function updateProgressRing() {
  const progress = timeRemaining / totalDuration;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  progressRing.style.strokeDashoffset = offset;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(timeRemaining);
}

function updateStageUI() {
  if (currentStage === STAGE.FOCUS) {
    stageLabel.textContent = '专注阶段';
    stageLabel.className = 'stage-focus';
    progressRing.style.stroke = '#e74c3c';
  } else {
    stageLabel.textContent = '休息阶段';
    stageLabel.className = 'stage-break';
    progressRing.style.stroke = '#3498db';
  }
}

function showNotification(title, body) {
  ipcRenderer.send('show-notification', title, body);
}

function switchStage() {
  if (currentStage === STAGE.FOCUS) {
    showNotification('专注结束', '休息时间到！休息一下吧。');
    currentStage = STAGE.BREAK;
    totalDuration = parseInt(breakDurationInput.value) * 60;
  } else {
    showNotification('休息结束', '该专注工作了！');
    currentStage = STAGE.FOCUS;
    totalDuration = parseInt(focusDurationInput.value) * 60;
  }
  
  timeRemaining = totalDuration;
  updateStageUI();
  updateDisplay();
  updateProgressRing();
}

function tick() {
  if (timeRemaining > 0) {
    timeRemaining--;
    updateDisplay();
    updateProgressRing();
  } else {
    switchStage();
  }
}

function startTimer() {
  if (currentState === STATE.RUNNING) return;
  
  currentState = STATE.RUNNING;
  startBtn.textContent = '暂停';
  startBtn.classList.add('pause');
  
  timerInterval = setInterval(tick, 1000);
}

function pauseTimer() {
  if (currentState !== STATE.RUNNING) return;
  
  currentState = STATE.PAUSED;
  startBtn.textContent = '继续';
  startBtn.classList.remove('pause');
  
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  currentState = STATE.IDLE;
  currentStage = STAGE.FOCUS;
  totalDuration = parseInt(focusDurationInput.value) * 60;
  timeRemaining = totalDuration;
  
  startBtn.textContent = '开始';
  startBtn.classList.remove('pause');
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  updateStageUI();
  updateDisplay();
  updateProgressRing();
}

function toggleTimer() {
  if (currentState === STATE.RUNNING) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function onFocusDurationChange() {
  if (currentState === STATE.IDLE && currentStage === STAGE.FOCUS) {
    totalDuration = parseInt(focusDurationInput.value) * 60;
    timeRemaining = totalDuration;
    updateDisplay();
    updateProgressRing();
  }
}

function onBreakDurationChange() {
  if (currentState === STATE.IDLE && currentStage === STAGE.BREAK) {
    totalDuration = parseInt(breakDurationInput.value) * 60;
    timeRemaining = totalDuration;
    updateDisplay();
    updateProgressRing();
  }
}

function validateDuration(input) {
  const value = parseInt(input.value);
  const min = parseInt(input.min);
  const max = parseInt(input.max);
  
  if (isNaN(value) || value < min) {
    input.value = min;
  } else if (value > max) {
    input.value = max;
  }
}

startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
focusDurationInput.addEventListener('change', () => {
  validateDuration(focusDurationInput);
  onFocusDurationChange();
});
breakDurationInput.addEventListener('change', () => {
  validateDuration(breakDurationInput);
  onBreakDurationChange();
});

initProgressRing();
updateStageUI();
updateDisplay();
updateProgressRing();