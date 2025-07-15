// Pomodoro App Main JS
// Loads settings from info.json, manages timer, UI, and persistence

const INFO_JSON = {
    appName: "Pomodoro App",
    description: "A Pomodoro app with a circular timer, customizable fonts and colors, and dark/light mode.",
    settings: {
        defaultTimes: {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15
        },
        fonts: [
            { name: "Kumbh Sans", class: "font-kumbh", default: true },
            { name: "Roboto Slab", class: "font-roboto", default: false },
            { name: "Space Mono", class: "font-space", default: false }
        ],
        colors: [
            { name: "Red-Orange", hex: "#F87070", default: true },
            { name: "Cyan", hex: "#70F3F8", default: false },
            { name: "Purple", hex: "#D881F8", default: false }
        ],
        darkModeEnabled: true
    },
    modes: [
        { id: "pomodoro", displayName: "Pomodoro", durationKey: "pomodoro" },
        { id: "shortBreak", displayName: "Short Break", durationKey: "shortBreak" },
        { id: "longBreak", displayName: "Long Break", durationKey: "longBreak" }
    ]
};

// --- State ---
let state = {
    mode: "pomodoro",
    times: { ...INFO_JSON.settings.defaultTimes },
    font: INFO_JSON.settings.fonts.find(f => f.default).class,
    color: INFO_JSON.settings.colors.find(c => c.default).hex,
    darkMode: INFO_JSON.settings.darkModeEnabled,
    timer: null,
    timeLeft: INFO_JSON.settings.defaultTimes.pomodoro * 60,
    running: false,
    paused: false
};

// --- Persistence ---
function loadSettings() {
    const saved = localStorage.getItem("pomodoroSettings");
    if (saved) {
        const s = JSON.parse(saved);
        if (s.times) state.times = s.times;
        if (s.font) state.font = s.font;
        if (s.color) state.color = s.color;
        if (typeof s.darkMode === "boolean") state.darkMode = s.darkMode;
    }
}
function saveSettings() {
    localStorage.setItem("pomodoroSettings", JSON.stringify({
        times: state.times,
        font: state.font,
        color: state.color,
        darkMode: state.darkMode
    }));
}

// --- UI Elements ---
const modeButtons = document.getElementById("modeButtons");
const timerDisplay = document.getElementById("timerDisplay");
const progressBar = document.getElementById("progressBar");
const startPauseBtn = document.getElementById("startPauseBtn");
const timerMessage = document.getElementById("timerMessage");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const cancelSettings = document.getElementById("cancelSettings");
const settingsForm = document.getElementById("settingsForm");
const pomodoroTime = document.getElementById("pomodoroTime");
const shortBreakTime = document.getElementById("shortBreakTime");
const longBreakTime = document.getElementById("longBreakTime");
const fontOptions = document.getElementById("fontOptions");
const colorOptions = document.getElementById("colorOptions");
const themeToggle = document.getElementById("themeToggle");
const appRoot = document.getElementById("app");
const htmlRoot = document.documentElement;

// --- Utility Functions ---
function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
function setProgressBar() {
    const total = state.times[state.mode] * 60;
    const percent = 1 - (state.timeLeft / total);
    const dashoffset = 628 * percent;
    progressBar.setAttribute('stroke', state.color);
    progressBar.style.strokeDashoffset = dashoffset;
}
function updateFont() {
    appRoot.classList.remove(...INFO_JSON.settings.fonts.map(f => f.class));
    appRoot.classList.add(state.font);
}
function updateColor() {
    // Update accent color for buttons and progress bar
    startPauseBtn.style.backgroundColor = state.color;
    startPauseBtn.style.boxShadow = `0 4px 20px 0 ${state.color}33`;
    progressBar.setAttribute('stroke', state.color);
}
function updateTheme() {
    const pomodoroLogo = document.getElementById('mainTitle');
    const footer = document.querySelector('footer');
    // Remove all possible color classes first
    if (pomodoroLogo) pomodoroLogo.classList.remove('text-gray-900', 'text-white');
    timerDisplay.classList.remove('text-gray-900', 'text-white');
    if (footer) footer.classList.remove('text-gray-900', 'text-white');
    if (state.darkMode) {
        htmlRoot.classList.add('dark');
        htmlRoot.classList.remove('light');
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        document.body.style.backgroundColor = '#18181b';
        htmlRoot.style.backgroundColor = '#18181b';
        themeToggleIcon.className = 'fas fa-moon';
        // Timer numbers, logo, and footer text light
        timerDisplay.classList.add('text-white');
        if (footer) footer.classList.add('text-white');
        if (pomodoroLogo) pomodoroLogo.classList.add('text-white');
        startPauseBtn.classList.remove('text-gray-900');
        startPauseBtn.classList.add('text-white');
    } else {
        htmlRoot.classList.remove('dark');
        htmlRoot.classList.add('light');
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        document.body.style.backgroundColor = '#fff';
        htmlRoot.style.backgroundColor = '#fff';
        themeToggleIcon.className = 'fas fa-sun';
        // Timer numbers, logo, and footer text dark
        timerDisplay.classList.add('text-gray-900');
        if (footer) footer.classList.add('text-gray-900');
        if (pomodoroLogo) pomodoroLogo.classList.add('text-gray-900');
        startPauseBtn.classList.remove('text-white');
        startPauseBtn.classList.add('text-gray-900');
    }
    updateColor();
    updateModeButtons();
}
function updateModeButtons() {
    modeButtons.innerHTML = '';
    INFO_JSON.modes.forEach(mode => {
        const btn = document.createElement('button');
        btn.textContent = mode.displayName;
        btn.className = `px-4 py-2 rounded-full font-bold text-lg focus:outline-none transition-colors ${state.mode === mode.id ? 'bg-opacity-100' : 'bg-opacity-30'} hover:scale-105 hover:shadow-md transition-transform duration-150`;
        btn.style.backgroundColor = state.mode === mode.id ? state.color : state.color + '33';
        // Text color for light/dark mode
        if (state.darkMode) {
            btn.classList.remove('text-gray-900');
            btn.classList.add('text-white');
        } else {
            btn.classList.remove('text-white');
            btn.classList.add('text-gray-900');
        }
        btn.onclick = () => switchMode(mode.id);
        modeButtons.appendChild(btn);
    });
}
function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(state.timeLeft);
    setProgressBar();
    // Force timer numbers color every update
    if (state.darkMode) {
        timerDisplay.classList.remove('text-gray-900');
        timerDisplay.classList.add('text-white');
    } else {
        timerDisplay.classList.remove('text-white');
        timerDisplay.classList.add('text-gray-900');
    }
}
function showMessage(msg) {
    timerMessage.textContent = msg;
    timerMessage.classList.remove('hidden');
    setTimeout(() => timerMessage.classList.add('hidden'), 2000);
}

// --- Timer Logic ---
function startTimer() {
    if (state.running) return;
    state.running = true;
    state.paused = false;
    startPauseBtn.textContent = 'Pause';
    state.timer = setInterval(() => {
        if (state.timeLeft > 0) {
            state.timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(state.timer);
            state.running = false;
            showMessage('Time is up!');
            autoSwitchMode();
        }
    }, 1000);
}
function pauseTimer() {
    if (!state.running) return;
    clearInterval(state.timer);
    state.running = false;
    state.paused = true;
    startPauseBtn.textContent = 'Resume';
}
function resumeTimer() {
    if (!state.paused) return;
    state.running = true;
    state.paused = false;
    startPauseBtn.textContent = 'Pause';
    state.timer = setInterval(() => {
        if (state.timeLeft > 0) {
            state.timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(state.timer);
            state.running = false;
            showMessage('Time is up!');
            autoSwitchMode();
        }
    }, 1000);
}
function resetTimer() {
    clearInterval(state.timer);
    state.running = false;
    state.paused = false;
    state.timeLeft = state.times[state.mode] * 60;
    startPauseBtn.textContent = 'Start';
    updateTimerDisplay();
}
function autoSwitchMode() {
    // Pomodoro -> Short Break -> Pomodoro -> Long Break
    if (state.mode === 'pomodoro') {
        switchMode('shortBreak');
    } else if (state.mode === 'shortBreak') {
        switchMode('pomodoro');
    } else if (state.mode === 'longBreak') {
        switchMode('pomodoro');
    }
}
function switchMode(mode) {
    state.mode = mode;
    state.timeLeft = state.times[mode] * 60;
    resetTimer();
    updateModeButtons();
    updateTimerDisplay();
    saveSettings();
}

// --- Settings Modal ---
function openSettings() {
    pomodoroTime.value = state.times.pomodoro;
    shortBreakTime.value = state.times.shortBreak;
    longBreakTime.value = state.times.longBreak;
    renderFontOptions();
    renderColorOptions();
    settingsModal.classList.remove('hidden');
}
function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}
function renderFontOptions() {
    fontOptions.innerHTML = '';
    INFO_JSON.settings.fonts.forEach(font => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = font.name;
        btn.className = `px-4 py-2 rounded border font-bold focus:outline-none ${state.font === font.class ? 'border-2 border-black dark:border-white' : 'border-gray-300 dark:border-gray-600'}`;
        btn.classList.add(font.class);
        btn.onclick = () => {
            state.font = font.class;
            updateFont();
            renderFontOptions();
        };
        fontOptions.appendChild(btn);
    });
}
function renderColorOptions() {
    colorOptions.innerHTML = '';
    INFO_JSON.settings.colors.forEach(color => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `w-8 h-8 rounded-full border-4 focus:outline-none ${state.color === color.hex ? 'border-black dark:border-white' : 'border-transparent'}`;
        btn.style.backgroundColor = color.hex;
        btn.onclick = () => {
            state.color = color.hex;
            updateColor();
            renderColorOptions();
            updateModeButtons();
        };
        colorOptions.appendChild(btn);
    });
}
settingsBtn.onclick = openSettings;
closeSettings.onclick = closeSettingsModal;
cancelSettings.onclick = closeSettingsModal;
settingsForm.onsubmit = function (e) {
    e.preventDefault();
    state.times.pomodoro = Math.max(1, Math.min(60, parseInt(pomodoroTime.value)));
    state.times.shortBreak = Math.max(1, Math.min(30, parseInt(shortBreakTime.value)));
    state.times.longBreak = Math.max(1, Math.min(60, parseInt(longBreakTime.value)));
    saveSettings();
    closeSettingsModal();
    switchMode(state.mode); // reset timer with new values
};

// --- Theme Toggle ---
// Only one themeToggle button (in header)
const themeToggleIcon = themeToggle.querySelector('i');

// Remove reference to themeToggleEffect (span), since the button now only has an icon

themeToggle.onclick = function () {
    state.darkMode = !state.darkMode;
    updateTheme();
    saveSettings();
};

// --- Timer Button ---
startPauseBtn.onclick = function () {
    if (!state.running && !state.paused) {
        startTimer();
    } else if (state.running) {
        pauseTimer();
    } else if (state.paused) {
        resumeTimer();
    }
};

// --- Animated Background ---
const bgCanvas = document.getElementById('bgParticles');
const ctx = bgCanvas.getContext('2d');
let particles = [];
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

function resizeCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createParticles(num = 60) {
    particles = [];
    for (let i = 0; i < num; i++) {
        particles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            r: 1.5 + Math.random() * 2.5,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            alpha: 0.3 + Math.random() * 0.5
        });
    }
}
createParticles();

bgCanvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function animateParticles() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    for (let p of particles) {
        // Particle reacts to mouse
        let dx = mouse.x - p.x;
        let dy = mouse.y - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
            p.x += dx * 0.002;
            p.y += dy * 0.002;
        }
        // Move
        p.x += p.dx;
        p.y += p.dy;
        // Wrap
        if (p.x < 0) p.x = bgCanvas.width;
        if (p.x > bgCanvas.width) p.x = 0;
        if (p.y < 0) p.y = bgCanvas.height;
        if (p.y > bgCanvas.height) p.y = 0;
        // Draw
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        ctx.fillStyle = state.darkMode ? '#fff' : '#222';
        ctx.shadowColor = state.darkMode ? '#fff' : '#222';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

// --- Initialization ---
function init() {
    loadSettings();
    updateFont();
    updateColor();
    updateTheme();
    updateModeButtons();
    updateTimerDisplay();
    resizeCanvas();
    createParticles();
}

document.addEventListener('DOMContentLoaded', init); 