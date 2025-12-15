// GrooveStation Logic

// --- Audio Engine (Synthesis + Samples) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// Sound Source State
let soundSource = 'synth'; // 'synth', 'embedded', 'cdn'
const audioBuffers = {}; // Store loaded samples
let samplesLoaded = false;

// Local Sample Paths (User downloads samples to sounds/ folder)
const localSamples = {
    'Kick 808': 'sounds/kick.wav',
    'Kick Punch': 'sounds/kick.wav',
    'Snare 808': 'sounds/snare.wav',
    'Snare Tight': 'sounds/snare.wav',
    'Ghost Snare': 'sounds/snare.wav',
    'Rim': 'sounds/rim.wav',
    'HiHat Closed': 'sounds/hihat-closed.wav',
    'HiHat Open': 'sounds/hihat-open.wav',
    'HiHat Foot': 'sounds/hihat-closed.wav',
    'Tom 1': 'sounds/tom-high.wav',
    'Tom 2': 'sounds/tom-mid.wav',
    'Floor Tom': 'sounds/tom-low.wav',
    'Ride': 'sounds/ride.wav',
    'Splash': 'sounds/crash.wav',
    'Clap': 'sounds/clap.wav',
    'Cowbell': 'sounds/cowbell.wav'
};

// CDN Sample URLs - Using alternative CORS-friendly sources
// Note: May still have CORS issues, local samples recommended
const cdnSamples = {
    'Kick 808': 'https://cdn.freesound.org/previews/131/131117_2398403-lq.mp3',
    'Kick Punch': 'https://cdn.freesound.org/previews/387/387186_7255534-lq.mp3',
    'Snare 808': 'https://cdn.freesound.org/previews/387/387186_7255534-lq.mp3',
    'Snare Tight': 'https://cdn.freesound.org/previews/270/270156_5123851-lq.mp3',
    'Ghost Snare': 'https://cdn.freesound.org/previews/270/270156_5123851-lq.mp3',
    'Rim': 'https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3',
    'HiHat Closed': 'https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3',
    'HiHat Open': 'https://cdn.freesound.org/previews/131/131658_2398403-lq.mp3',
    'HiHat Foot': 'https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3',
    'Tom 1': 'https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3',
    'Tom 2': 'https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3',
    'Floor Tom': 'https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3',
    'Ride': 'https://cdn.freesound.org/previews/131/131658_2398403-lq.mp3',
    'Splash': 'https://cdn.freesound.org/previews/131/131658_2398403-lq.mp3',
    'Clap': 'https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3',
    'Cowbell': 'https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3'
};

// Embedded samples - Enhanced synthesis for better quality
const embeddedSamples = {};

// Icon Mapping
const instrumentIcons = {
    'Kick 808': 'fa-drum',
    'Kick Punch': 'fa-drum',
    'Snare 808': 'fa-drum-steelpan',
    'Snare Tight': 'fa-drum-steelpan',
    'Ghost Snare': 'fa-drum-steelpan', // Same icon
    'Rim': 'fa-bullseye', // Rim icon
    'HiHat Closed': 'fa-ring',
    'HiHat Open': 'fa-ring',
    'HiHat Foot': 'fa-shoe-prints', // Foot icon
    'Tom 1': 'fa-circle',
    'Tom 2': 'fa-circle',
    'Floor Tom': 'fa-circle-dot',
    'Ride': 'fa-compact-disc',
    'Splash': 'fa-compact-disc', // Splash cymbal
    'Clap': 'fa-hands-clapping',
    'Cowbell': 'fa-bell'
};

// Synthesis Library - Enhanced for realism
const synthLibrary = {
    'Kick 808': (time, vol = 1) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const click = audioCtx.createOscillator();
        const clickGain = audioCtx.createGain();

        // Body
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.5);
        gain.gain.setValueAtTime(1 * vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        // Click (Transient)
        click.frequency.setValueAtTime(3000, time);
        click.frequency.exponentialRampToValueAtTime(100, time + 0.02);
        clickGain.gain.setValueAtTime(0.5 * vol, time);
        clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);

        osc.connect(gain);
        click.connect(clickGain);
        gain.connect(audioCtx.destination);
        clickGain.connect(audioCtx.destination);

        osc.start(time);
        click.start(time);
        osc.stop(time + 0.5);
        click.stop(time + 0.02);
    },
    'Snare 808': (time, vol = 1) => {
        // Noise (Snares)
        const noise = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;

        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(1 * vol, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        // Tone (Body)
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, time);
        osc.frequency.exponentialRampToValueAtTime(150, time + 0.1);
        const oscGain = audioCtx.createGain();
        oscGain.gain.setValueAtTime(0.7 * vol, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        osc.connect(oscGain);
        noiseGain.connect(audioCtx.destination);
        oscGain.connect(audioCtx.destination);

        noise.start(time);
        osc.start(time);
        osc.stop(time + 0.2);
    },
    'Rim': (time, vol = 1) => {
        // Rimshot: High pitched, short, metallic/wooden
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, time);
        osc.frequency.exponentialRampToValueAtTime(500, time + 0.05);

        gain.gain.setValueAtTime(0.6 * vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.05);
    },
    'HiHat Closed': (time, vol = 1) => {
        // Metallic Noise
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.4 * vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(time);
    },
    'Tom 1': (time, vol = 1) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(300, time);
        osc.frequency.exponentialRampToValueAtTime(150, time + 0.2);
        gain.gain.setValueAtTime(0.8 * vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    },
    'Tom 2': (time, vol = 1) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.3);
        gain.gain.setValueAtTime(0.8 * vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.3);
    },
    'Floor Tom': (time, vol = 1) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(100, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.4);
        gain.gain.setValueAtTime(0.9 * vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.4);
    },
    'Ride': (time, vol = 1) => {
        // Improved Ride Cymbal Synthesis
        const ratios = [1, 1.45, 1.98, 2.44, 4.32];
        const fund = 350;

        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.3 * vol, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + 2.5);
        masterGain.connect(audioCtx.destination);

        ratios.forEach(ratio => {
            const osc = audioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = fund * ratio;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 800;

            osc.connect(filter);
            filter.connect(masterGain);

            osc.start(time);
            osc.stop(time + 2.5);
        });
    },
    'Splash': (time, vol = 1) => {
        // Splash cymbal - bright, short, high-pitched
        const ratios = [1, 1.7, 2.1, 2.9, 3.8];
        const fund = 600; // Higher than ride

        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.4 * vol, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + 0.8); // Shorter decay
        masterGain.connect(audioCtx.destination);

        ratios.forEach(ratio => {
            const osc = audioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = fund * ratio;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1200; // Higher filter

            osc.connect(filter);
            filter.connect(masterGain);

            osc.start(time);
            osc.stop(time + 0.8);
        });
    },
    'Clap': async (time, vol = 1) => { // Made async to support await
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        // Placeholder for actual clap sound generation
        // This part would typically involve noise bursts and envelopes
        // For now, a simple noise burst:
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.7 * vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        noise.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(time);
        noise.stop(time + 0.1);
    }
};

async function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    document.getElementById('status-text').textContent = "Audio Engine Ready";
}

function playSound(key, time, volume = 1) {
    if (!audioCtx) return;

    // Check if we should use samples (local, cdn, or embedded)
    if ((soundSource === 'local' || soundSource === 'cdn' || soundSource === 'embedded') && audioBuffers[key]) {
        // Play sample
        const source = audioCtx.createBufferSource();
        const gainNode = audioCtx.createGain();

        source.buffer = audioBuffers[key];
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.value = volume;

        source.start(time);
        return;
    }

    // Fallback to synthesis
    const synth = synthLibrary[key];
    if (synth) {
        synth(time, volume);
    }
}

// --- Sequencer State ---
const state = {
    isPlaying: false,
    bpm: 120,
    currentStep: 0,
    nextNoteTime: 0,
    timerID: null,
    lookahead: 25.0,
    scheduleAheadTime: 0.1,
    currentMeasure: 0,
    totalMeasures: 1, // Max 10
    timeSignature: '4/4', // 4/4, 3/4, 6/8
    tracks: [
        { name: 'Kick', key: 'Kick 808', volume: 4, measures: [new Array(32).fill(false)] },
        { name: 'Snare', key: 'Snare 808', volume: 4, measures: [new Array(32).fill(false)] },
        { name: 'HiHat Closed', key: 'HiHat Closed', volume: 3, measures: [new Array(32).fill(false)] },
        { name: 'Ride', key: 'Ride', volume: 3, measures: [new Array(32).fill(false)] },
        { name: 'Splash', key: 'Splash', volume: 3, measures: [new Array(32).fill(false)] }
    ]
};

// --- Scheduler ---
function nextNote() {
    const secondsPerBeat = 60.0 / state.bpm;
    // Assuming 4/4 or 3/4 where beat is quarter note. For 6/8 beat is dotted quarter?
    // For simplicity, let's stick to 16th notes as base unit.
    // 4/4 = 16 steps (4 beats * 4 sub-beats)
    // 3/4 = 12 steps (3 beats * 4 sub-beats)
    // 6/8 = 12 steps (2 beats * 6 sub-beats? Or just 6 8th notes? Let's treat as 12 16th notes for now)

    const secondsPerStep = secondsPerBeat / 4;
    state.nextNoteTime += secondsPerStep;

    // Calculate total steps based on signature
    let stepsPerMeasure = 32; // Default 4/4 double
    if (state.timeSignature === '4/4') stepsPerMeasure = 32; // Keeping 32 as "1 Page"
    if (state.timeSignature === '3/4') stepsPerMeasure = 24; // 2 bars of 3/4? Or just 24 steps.

    // Advance step
    state.currentStep++;

    // Handle Measure Wrapping
    if (state.currentStep >= stepsPerMeasure) {
        state.currentStep = 0;
        state.currentMeasure++;
        if (state.currentMeasure >= state.totalMeasures) {
            state.currentMeasure = 0;
        }
        // Update UI to show playing measure if following
        // renderGrid(); // Too heavy to re-render grid on every measure change? Maybe just update indicator.
    }
}

function scheduleNote(stepNumber, time) {
    state.tracks.forEach(track => {
        // Ensure measure exists
        if (!track.measures[state.currentMeasure]) {
            track.measures[state.currentMeasure] = new Array(32).fill(false);
        }

        if (track.measures[state.currentMeasure][stepNumber]) {
            const vol = track.volume / 5;
            playSound(track.key, time, vol);
        }
    });

    // Visuals
    // Only update visuals if we are viewing the current playing measure
    // We need a way to know which measure is being viewed vs played.
    // For now, let's assume we view what we play or have a separate "viewedMeasure" in state?
    // Let's use state.currentMeasure for PLAYBACK.
    // We need state.viewedMeasure for UI.
    // Let's add state.viewedMeasure.

    const drawTime = (time - audioCtx.currentTime) * 1000;
    setTimeout(() => updateVisuals(stepNumber, state.currentMeasure), Math.max(0, drawTime));
}

function scheduler() {
    while (state.nextNoteTime < audioCtx.currentTime + state.scheduleAheadTime) {
        scheduleNote(state.currentStep, state.nextNoteTime);
        nextNote();
    }
    state.timerID = window.setTimeout(scheduler, state.lookahead);
}

function updateVisuals(step, playingMeasure) {
    // Only animate if we are viewing the playing measure
    if (playingMeasure !== state.viewedMeasure) return;

    document.querySelectorAll('.step.playing').forEach(el => el.classList.remove('playing'));
    const rows = document.querySelectorAll('.track-row');
    rows.forEach(row => {
        const steps = row.querySelectorAll('.step');
        if (steps[step]) steps[step].classList.add('playing');
    });
}

// --- UI & Modals/Drawers ---
function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function openDrawer(id) {
    document.getElementById(id).classList.add('active');
}
function closeDrawer(id) {
    document.getElementById(id).classList.remove('active');
}

function openTrackDrawer() {
    const list = document.getElementById('drawer-sound-options');
    list.innerHTML = '';
    const instruments = [
        { key: 'Kick 808', name: 'Kick' },
        { key: 'Snare 808', name: 'Snare' },
        { key: 'Ghost Snare', name: 'Ghost Snare' },
        { key: 'Rim', name: 'Rim' },
        { key: 'HiHat Closed', name: 'HiHat Closed' },
        { key: 'HiHat Open', name: 'HiHat Open' },
        { key: 'HiHat Foot', name: 'HiHat Foot' },
        { key: 'Tom 1', name: 'High Tom' },
        { key: 'Tom 2', name: 'Mid Tom' },
        { key: 'Floor Tom', name: 'Low Tom' },
        { key: 'Ride', name: 'Ride' },
        { key: 'Splash', name: 'Splash' },
        { key: 'Cowbell', name: 'Cowbell' },
        { key: 'Clap', name: 'Clap' }
    ];

    instruments.forEach(inst => {
        const btn = document.createElement('button');
        btn.className = 'drawer-item';
        const iconClass = instrumentIcons[inst.key] || 'fa-music';
        btn.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${inst.name}`;
        btn.onclick = () => {
            addTrack(inst.key, inst.name);
            closeTrackDrawer();
        };
        list.appendChild(btn);
    });

    document.getElementById('track-drawer').classList.add('active');
}

function closeTrackDrawer() {
    document.getElementById('track-drawer').classList.remove('active');
}

function removeTrack(index) {
    if (confirm('Remove this track?')) {
        state.tracks.splice(index, 1);
        renderGrid();
        drawNotation();
    }
}

function addTrack(key, name) {
    state.tracks.push({
        name: name || key,
        key: key,
        volume: 4,
        measures: [new Array(32).fill(false)]
    });
    renderGrid();
}

function openSaveModal() {
    openModal('save-modal');
    document.getElementById('pattern-name-input').focus();
}

function savePattern() {
    const name = document.getElementById('pattern-name-input').value.trim() || 'Untitled';
    const patternData = {
        id: Date.now(),
        name: name,
        bpm: state.bpm,
        totalMeasures: state.totalMeasures,
        timeSignature: state.timeSignature,
        tracks: state.tracks.map(t => ({
            name: t.name,
            key: t.key,
            volume: t.volume || 4, // Save volume
            measures: t.measures.map(m => [...m])
        })),
        date: new Date().toISOString()
    };
    let library = JSON.parse(localStorage.getItem('groove_library') || '[]');
    library.push(patternData);
    localStorage.setItem('groove_library', JSON.stringify(library));
    closeModal('save-modal');
    alert('Saved!');
}

function openLibrary() {
    const list = document.getElementById('library-list');
    list.innerHTML = '';
    const library = JSON.parse(localStorage.getItem('groove_library') || '[]');

    if (library.length === 0) {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">No saved patterns</div>';
    } else {
        library.forEach((pattern, index) => {
            const item = document.createElement('div');
            item.className = 'library-item';
            item.innerHTML = `
                <div>
                    <div class="lib-name">${pattern.name}</div>
                    <div class="lib-date">${pattern.date} • ${pattern.bpm} BPM</div>
                </div>
                <div class="lib-actions">
                    <button class="lib-btn load" title="Yükle" onclick="loadPattern(${pattern.id})"><i class="fa-solid fa-upload"></i></button>
                    <button class="lib-btn delete" title="Sil" onclick="deletePattern(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            list.appendChild(item);
        });
    }
    openModal('library-modal');
}

// --- Notation View ---
window.toggleNotationView = () => {
    const view = document.getElementById('notation-view');
    view.classList.toggle('active');

    if (view.classList.contains('active')) {
        // Draw current state
        setTimeout(() => drawNotation(), 100);
    }
};

window.downloadPDF = () => {
    window.print();
};

function drawNotation() {
    const canvas = document.getElementById('notation-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Layout config
    const measureWidth = 400;
    const measuresPerRow = 2;
    const rowHeight = 250; // Height for each staff row
    const totalRows = Math.ceil(state.totalMeasures / measuresPerRow);
    const totalWidth = Math.max(rect.width, 100 + (measuresPerRow * measureWidth));
    const totalHeight = Math.max(rect.height, 100 + (totalRows * rowHeight));

    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    ctx.scale(dpr, dpr);

    // Update style dimensions
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    // Clear
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Config
    const startX = 60;
    const lineSpacing = 16;
    const noteRadius = 6;

    // Title
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.bpm} BPM - ${state.timeSignature}`, totalWidth / 2, 40);

    // Instrument Mapping
    const map = {
        'Kick': { y: 3.5 * lineSpacing, head: 'circle' },
        'Snare': { y: 1.5 * lineSpacing, head: 'circle' },
        'Ghost Snare': { y: 1.5 * lineSpacing, head: 'ghost' },
        'Rim': { y: 1.5 * lineSpacing, head: 'x' },
        'HiHat Closed': { y: 0.5 * lineSpacing, head: 'x' },
        'HiHat Open': { y: 0.5 * lineSpacing, head: 'circle-x' },
        'HiHat Foot': { y: 4.5 * lineSpacing, head: 'x' },
        'High Tom': { y: 0.5 * lineSpacing, head: 'circle' },
        'Mid Tom': { y: 1 * lineSpacing, head: 'circle' },
        'Low Tom': { y: 2.5 * lineSpacing, head: 'circle' },
        'Ride': { y: -0.5 * lineSpacing, head: 'x' },
        'Splash': { y: -1.5 * lineSpacing, head: 'x' },
        'Clap': { y: 1.5 * lineSpacing, head: 'x' },
        'Cowbell': { y: -0.5 * lineSpacing, head: 'diamond' }
    };

    // Draw measures in rows
    for (let row = 0; row < totalRows; row++) {
        const staffY = 80 + (row * rowHeight);

        // Draw Staff Lines for this row
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = staffY + (i * lineSpacing);
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(totalWidth - 20, y);
            ctx.stroke();
        }

        // Clef for this row
        ctx.fillStyle = '#000';
        ctx.fillRect(startX, staffY + lineSpacing, 6, lineSpacing * 2);
        ctx.fillRect(startX + 10, staffY + lineSpacing, 6, lineSpacing * 2);

        // Draw measures in this row
        let currentX = startX + 40;
        const startMeasure = row * measuresPerRow;
        const endMeasure = Math.min(startMeasure + measuresPerRow, state.totalMeasures);

        for (let m = startMeasure; m < endMeasure; m++) {
            // Measure Number
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText(m + 1, currentX, staffY - 10);

            // Determine steps in this measure
            let stepsInMeasure = 32;
            if (state.timeSignature === '2/4') stepsInMeasure = 16;
            if (state.timeSignature === '3/4') stepsInMeasure = 24;
            if (state.timeSignature === '6/8') stepsInMeasure = 24;

            const stepWidth = (measureWidth - 20) / stepsInMeasure;

            // Draw Notes
            state.tracks.forEach(track => {
                if (!track.measures || !track.measures[m]) return;

                // Normalize name
                let key = track.name;
                if (key === 'Kick 808' || key === 'Kick Punch') key = 'Kick';
                if (key === 'Snare 808' || key === 'Snare Tight') key = 'Snare';
                if (key === 'Tom 1') key = 'High Tom';
                if (key === 'Tom 2') key = 'Mid Tom';
                if (key === 'Floor Tom') key = 'Low Tom';

                const config = map[key] || map[track.name] || { y: 2 * lineSpacing, head: 'circle' };

                track.measures[m].forEach((active, stepIndex) => {
                    if (!active || stepIndex >= stepsInMeasure) return;

                    const x = currentX + (stepIndex * stepWidth);
                    const y = staffY + config.y;

                    ctx.fillStyle = '#000';
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;

                    // Draw Note Head
                    if (config.head === 'circle' || config.head === 'ghost') {
                        ctx.beginPath();
                        ctx.ellipse(x, y, noteRadius, noteRadius * 0.8, 0, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (config.head === 'x') {
                        ctx.beginPath();
                        ctx.moveTo(x - noteRadius, y - noteRadius);
                        ctx.lineTo(x + noteRadius, y + noteRadius);
                        ctx.moveTo(x + noteRadius, y - noteRadius);
                        ctx.lineTo(x - noteRadius, y + noteRadius);
                        ctx.stroke();
                    } else if (config.head === 'circle-x') {
                        ctx.beginPath();
                        ctx.arc(x, y, noteRadius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(x - noteRadius / 2, y - noteRadius / 2);
                        ctx.lineTo(x + noteRadius / 2, y + noteRadius / 2);
                        ctx.moveTo(x + noteRadius / 2, y - noteRadius / 2);
                        ctx.lineTo(x - noteRadius / 2, y + noteRadius / 2);
                        ctx.stroke();
                    } else if (config.head === 'diamond') {
                        ctx.beginPath();
                        ctx.moveTo(x, y - noteRadius);
                        ctx.lineTo(x + noteRadius, y);
                        ctx.lineTo(x, y + noteRadius);
                        ctx.lineTo(x - noteRadius, y);
                        ctx.closePath();
                        ctx.stroke();
                    }
                });
            });

            // Bar Line
            currentX += measureWidth;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(currentX, staffY);
            ctx.lineTo(currentX, staffY + (4 * lineSpacing));
            ctx.stroke();
            currentX += 20; // Spacing
        }
    }
}

// Global functions for HTML onclick
window.closeModal = closeModal;
window.closeDrawer = closeDrawer;
// window.removeTrack removed to avoid duplicate definition

window.loadPattern = (id) => {
    try {
        const library = JSON.parse(localStorage.getItem('groove_library') || '[]');
        const pattern = library.find(p => p.id === id);
        if (pattern && confirm('Load pattern?')) {
            state.bpm = pattern.bpm;
            state.totalMeasures = pattern.totalMeasures || 1;
            state.timeSignature = pattern.timeSignature || '4/4';
            state.viewedMeasure = 0;

            document.getElementById('bpm-input').value = state.bpm;
            const tsSelect = document.getElementById('time-sig-select');
            if (tsSelect) tsSelect.value = state.timeSignature;

            state.tracks = pattern.tracks.map(t => ({
                name: t.name,
                key: t.key,
                volume: t.volume || 4,
                measures: t.measures ? t.measures.map(m => [...m]) : [t.steps ? [...t.steps] : new Array(32).fill(false)]
            }));

            // Ensure all tracks have enough measures
            state.tracks.forEach(t => {
                while (t.measures.length < state.totalMeasures) {
                    t.measures.push(new Array(32).fill(false));
                }
            });

            renderGrid();
            drawNotation();
            closeModal('library-modal');
        }
    } catch (e) {
        console.error('Load Error:', e);
        alert('Error loading pattern');
    }
};

window.deletePattern = (index) => {
    if (confirm('Delete pattern?')) {
        let library = JSON.parse(localStorage.getItem('groove_library') || '[]');
        library.splice(index, 1);
        localStorage.setItem('groove_library', JSON.stringify(library));
        openLibrary();
    }
};

function addTrack(key) {
    state.tracks.push({ name: key, key: key, volume: 4, steps: new Array(32).fill(false) });
    renderGrid();
}

// Drag and Drop Variables
let draggedItemIndex = null;

function handleDragStart(e, index) {
    draggedItemIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.target.closest('.track-row').classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const row = e.target.closest('.track-row');
    if (row) row.classList.add('drag-over');
}

function handleDragLeave(e) {
    const row = e.target.closest('.track-row');
    if (row) row.classList.remove('drag-over');
}

function handleDrop(e, index) {
    e.preventDefault();
    const row = e.target.closest('.track-row');
    if (row) row.classList.remove('drag-over');

    if (draggedItemIndex !== null && draggedItemIndex !== index) {
        // Swap tracks
        const item = state.tracks.splice(draggedItemIndex, 1)[0];
        state.tracks.splice(index, 0, item);
        renderGrid();
    }
    draggedItemIndex = null;
    document.querySelectorAll('.track-row').forEach(r => r.classList.remove('dragging'));
}

// Add viewedMeasure to state initialization if missing
if (typeof state.viewedMeasure === 'undefined') state.viewedMeasure = 0;

function renderGrid() {
    const container = document.getElementById('sequencer-grid');
    if (!container) return console.error('Grid container not found');
    container.innerHTML = '';

    // Header for Measure Controls
    const controlsRow = document.createElement('div');
    controlsRow.className = 'measure-controls';
    controlsRow.innerHTML = `
        <button onclick="changeMeasure(-1)" ${state.viewedMeasure === 0 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
        <span>Measure ${state.viewedMeasure + 1} / ${state.totalMeasures}</span>
        <button onclick="changeMeasure(1)" ${state.viewedMeasure >= state.totalMeasures - 1 && state.totalMeasures < 10 ? '' : (state.viewedMeasure >= state.totalMeasures - 1 ? 'disabled' : '')}><i class="fa-solid fa-chevron-right"></i></button>
        ${state.viewedMeasure === state.totalMeasures - 1 && state.totalMeasures < 10 ? '<button onclick="addMeasure()" title="Add Measure"><i class="fa-solid fa-plus"></i></button>' : ''}
        ${state.totalMeasures > 1 ? '<button onclick="removeMeasure()" title="Remove Measure" style="margin-left:5px;"><i class="fa-solid fa-minus"></i></button>' : ''}
    `;
    container.appendChild(controlsRow);

    state.tracks.forEach((track, trackIndex) => {
        // Ensure measure array exists
        if (!track.measures) track.measures = [new Array(32).fill(false)];
        if (!track.measures[state.viewedMeasure]) track.measures[state.viewedMeasure] = new Array(32).fill(false);

        const row = document.createElement('div');
        row.className = 'track-row';
        row.draggable = true;

        // Drag Events
        row.addEventListener('dragstart', (e) => handleDragStart(e, trackIndex));
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('dragleave', handleDragLeave);
        row.addEventListener('drop', (e) => handleDrop(e, trackIndex));

        const info = document.createElement('div');
        info.className = 'track-info';

        // Volume Bars HTML
        let volHtml = '<div class="volume-control">';
        for (let i = 1; i <= 5; i++) {
            volHtml += `<div class="vol-bar ${i <= (track.volume || 4) ? 'active' : ''}" onclick="setVolume(${trackIndex}, ${i})"></div>`;
        }
        volHtml += '</div>';

        const iconClass = instrumentIcons[track.key] || 'fa-music';

        info.innerHTML = `
            <div class="drag-handle"><i class="fa-solid fa-grip-lines"></i></div>
            <div class="track-icon"><i class="fa-solid ${iconClass}"></i></div>
            <div class="track-details">
                <span class="track-name">${track.name}</span>
                ${volHtml}
            </div>
            <button class="delete-track-btn" onclick="removeTrack(${trackIndex})">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'steps-container';

        // Adjust grid columns based on time signature
        // 2/4 = 16 steps (1 bar)
        // 3/4 = 24 steps (2 bars)
        // 4/4 = 32 steps (2 bars)
        // 6/8 = 24 steps (2 bars)
        let stepCount = 32;
        if (state.timeSignature === '2/4') stepCount = 16;
        if (state.timeSignature === '3/4') stepCount = 24;
        if (state.timeSignature === '6/8') stepCount = 24;

        // Resize array if needed
        if (track.measures[state.viewedMeasure].length !== stepCount) {
            const old = track.measures[state.viewedMeasure];
            track.measures[state.viewedMeasure] = new Array(stepCount).fill(false).map((_, i) => old[i] || false);
        }

        track.measures[state.viewedMeasure].forEach((isActive, stepIndex) => {
            const step = document.createElement('div');
            step.className = `step ${isActive ? 'active' : ''}`;

            const toggleStep = (e) => {
                if (e.type === 'touchstart') e.preventDefault(); // Prevent double firing

                track.measures[state.viewedMeasure][stepIndex] = !track.measures[state.viewedMeasure][stepIndex];
                step.classList.toggle('active');
                if (track.measures[state.viewedMeasure][stepIndex]) {
                    const vol = (track.volume || 4) / 5;
                    playSound(track.key, audioCtx ? audioCtx.currentTime : 0, vol);
                }
                drawNotation();
            };

            step.addEventListener('touchstart', toggleStep, { passive: false });
            step.addEventListener('click', toggleStep);

            stepsContainer.appendChild(step);
        });

        // Update grid columns CSS dynamically
        stepsContainer.style.gridTemplateColumns = `repeat(${stepCount}, 1fr)`;

        row.appendChild(info);
        row.appendChild(stepsContainer);
        container.appendChild(row);
    });

    // Add Track Button
    const addRow = document.createElement('div');
    addRow.className = 'add-track-row';
    addRow.innerHTML = `<button id="add-track-btn" class="add-track-btn"><i class="fa-solid fa-plus"></i> Add Track</button>`;
    container.appendChild(addRow);
    document.getElementById('add-track-btn').addEventListener('click', openTrackDrawer);
}

// Global setVolume
window.setVolume = (trackIndex, level) => {
    state.tracks[trackIndex].volume = level;
    renderGrid();
    // Preview sound at new volume
    const vol = level / 5;
    playSound(state.tracks[trackIndex].key, audioCtx.currentTime, vol);
};

async function togglePlay() {
    if (!audioCtx) await initAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    state.isPlaying = !state.isPlaying;
    const btn = document.getElementById('play-btn');

    if (state.isPlaying) {
        btn.classList.add('playing');
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        state.currentStep = 0;
        state.nextNoteTime = audioCtx.currentTime;
        scheduler();
    } else {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        window.clearTimeout(state.timerID);
    }
}

function stop() {
    state.isPlaying = false;

    document.getElementById('play-btn').classList.remove('playing');
    document.getElementById('play-btn').innerHTML = '<i class="fa-solid fa-play"></i>';

    window.clearTimeout(state.timerID);
    state.currentStep = 0;
    document.querySelectorAll('.step.playing').forEach(el => el.classList.remove('playing'));
}

function init() {
    // Force reset tracks if empty or just to be safe for this debugging session
    if (!state.tracks || state.tracks.length === 0) {
        state.tracks = [
            { name: 'Kick', key: 'Kick 808', volume: 4, steps: new Array(32).fill(false) },
            { name: 'Snare', key: 'Snare 808', volume: 4, steps: new Array(32).fill(false) },
            { name: 'HiHat Closed', key: 'HiHat Closed', volume: 3, steps: new Array(32).fill(false) },
            { name: 'Ride', key: 'Ride', volume: 3, steps: new Array(32).fill(false) },
            { name: 'Splash', key: 'Splash', volume: 3, steps: new Array(32).fill(false) }
        ];
    }

    // Start Overlay
    const overlay = document.getElementById('start-overlay');
    if (overlay) {
        overlay.addEventListener('click', async () => {
            await initAudio();
            overlay.classList.remove('active');
        });
    }

    const playBtn = document.getElementById('play-btn');
    if (playBtn) playBtn.addEventListener('click', togglePlay);

    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) stopBtn.addEventListener('click', stop);

    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) recordBtn.addEventListener('click', openSaveModal);

    const libBtn = document.getElementById('library-btn');
    if (libBtn) libBtn.addEventListener('click', openLibrary);

    const saveBtn = document.getElementById('confirm-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', savePattern);

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        if (confirm('Clear?')) { state.tracks.forEach(t => t.steps.fill(false)); renderGrid(); }
    });

    const bpmInput = document.getElementById('bpm-input');
    document.getElementById('bpm-input').addEventListener('change', (e) => state.bpm = parseInt(e.target.value));

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    });

    renderGrid();
}

// Measure Helpers
window.changeMeasure = (delta) => {
    const newMeasure = state.viewedMeasure + delta;
    if (newMeasure >= 0 && newMeasure < state.totalMeasures) {
        state.viewedMeasure = newMeasure;
        renderGrid();
        drawNotation();
    }
};

window.addMeasure = () => {
    if (state.totalMeasures >= 10) return alert('Max 10 measures!');
    state.totalMeasures++;
    state.viewedMeasure = state.totalMeasures - 1;
    renderGrid();
    drawNotation();
};

window.removeMeasure = () => {
    if (state.totalMeasures <= 1) return alert('Cannot remove the last measure!');
    if (!confirm('Remove the last measure?')) return;

    // Remove last measure from all tracks
    state.tracks.forEach(track => {
        if (track.measures && track.measures.length > 1) {
            track.measures.pop();
        }
    });

    state.totalMeasures--;

    // Adjust viewed measure if necessary
    if (state.viewedMeasure >= state.totalMeasures) {
        state.viewedMeasure = state.totalMeasures - 1;
    }

    renderGrid();
    drawNotation();
};

window.changeTimeSignature = (sig) => {
    state.timeSignature = sig;
    renderGrid();
    drawNotation();
};

// Metronome State
const metronomeState = {
    isPlaying: false,
    bpm: 120,
    volume: 0.5,
    timeSignature: '4/4',
    currentBeat: 0,
    nextBeatTime: 0,
    timerID: null,
    lookahead: 25.0,
    scheduleAheadTime: 0.1
};

function getBeatsPerMeasure(timeSig) {
    const beats = {
        '2/4': 2,
        '3/4': 3,
        '4/4': 4,
        '6/8': 2  // 6/8 is felt in 2 (dotted quarter notes)
    };
    return beats[timeSig] || 4;
}

function playMetronomeClick(time, isAccent = false) {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.value = isAccent ? 1200 : 800;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(metronomeState.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
}

function metronomeScheduler() {
    const beatsPerMeasure = getBeatsPerMeasure(metronomeState.timeSignature);

    while (metronomeState.nextBeatTime < audioCtx.currentTime + metronomeState.scheduleAheadTime) {
        const isAccent = metronomeState.currentBeat === 0;
        playMetronomeClick(metronomeState.nextBeatTime, isAccent);

        // Visual indicator
        const drawTime = (metronomeState.nextBeatTime - audioCtx.currentTime) * 1000;
        setTimeout(() => {
            const indicator = document.getElementById('metro-indicator');
            if (indicator) {
                indicator.style.background = isAccent ? '#ff6b6b' : '#4ecdc4';
                setTimeout(() => { indicator.style.background = '#ddd'; }, 100);
            }
        }, Math.max(0, drawTime));

        // Advance beat
        const secondsPerBeat = 60.0 / metronomeState.bpm;
        metronomeState.nextBeatTime += secondsPerBeat;
        metronomeState.currentBeat = (metronomeState.currentBeat + 1) % beatsPerMeasure;
    }
    metronomeState.timerID = window.setTimeout(metronomeScheduler, metronomeState.lookahead);
}

window.toggleMetronome = () => {
    openModal('metronome-modal');
    document.getElementById('metro-bpm').value = metronomeState.bpm;
    document.getElementById('metro-time-sig').value = metronomeState.timeSignature;
};

window.updateMetronomeBPM = (bpm) => {
    metronomeState.bpm = parseInt(bpm);
};

window.updateMetronomeTimeSig = (timeSig) => {
    metronomeState.timeSignature = timeSig;
    // Reset beat if metronome is playing
    if (metronomeState.isPlaying) {
        metronomeState.currentBeat = 0;
    }
};

window.updateMetronomeVolume = (vol) => {
    metronomeState.volume = parseInt(vol) / 100;
};

async function toggleMetronomePlay() {
    if (!audioCtx) await initAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    metronomeState.isPlaying = !metronomeState.isPlaying;
    const btn = document.getElementById('metro-toggle');

    if (metronomeState.isPlaying) {
        btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop';
        btn.classList.remove('primary');
        btn.classList.add('secondary');
        metronomeState.currentBeat = 0;
        metronomeState.nextBeatTime = audioCtx.currentTime;
        metronomeScheduler();
    } else {
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        btn.classList.remove('secondary');
        btn.classList.add('primary');
        window.clearTimeout(metronomeState.timerID);
    }
}

window.toggleMetronomePlay = toggleMetronomePlay;

// Sample Loading Functions
async function loadSample(url, key) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioBuffers[key] = audioBuffer;
        return true;
    } catch (error) {
        console.warn(`Failed to load sample for ${key}:`, error);
        return false;
    }
}

async function loadAllSamples(source) {
    const statusEl = document.getElementById('status-text');
    statusEl.textContent = 'Loading samples...';

    if (source === 'embedded') {
        statusEl.textContent = 'Using enhanced synthesis (Embedded mode)';
        samplesLoaded = true;
        return;
    }

    // Select sample source
    const samples = source === 'local' ? localSamples : cdnSamples;
    const keys = Object.keys(samples);
    let loaded = 0;
    let failed = 0;

    for (const key of keys) {
        statusEl.textContent = `Loading samples... ${loaded}/${keys.length}`;
        const success = await loadSample(samples[key], key);
        if (success) {
            loaded++;
        } else {
            failed++;
        }
    }

    samplesLoaded = loaded > 0;

    if (loaded === 0) {
        if (source === 'local') {
            statusEl.textContent = `⚠️ No samples found in sounds/ folder. Download samples first!`;
        } else {
            statusEl.textContent = `⚠️ CDN loading failed (CORS). Using synthesis instead.`;
        }
        soundSource = 'synth';
        document.getElementById('sound-source-select').value = 'synth';
    } else if (failed > 0) {
        statusEl.textContent = `Loaded ${loaded}/${keys.length} samples (${failed} failed)`;
    } else {
        statusEl.textContent = `✓ Loaded ${loaded} ${source} samples!`;
    }

    setTimeout(() => {
        if (soundSource !== 'synth') {
            statusEl.textContent = `Using ${soundSource} samples`;
        } else {
            statusEl.textContent = 'Using synthesis';
        }
    }, 3000);
}

window.changeSoundSource = async function (source) {
    soundSource = source;
    const statusEl = document.getElementById('status-text');

    if (source === 'synth') {
        statusEl.textContent = 'Using synthesis';
        return;
    }

    if (!audioCtx) await initAudio();

    // Load samples if not already loaded
    if (!samplesLoaded || Object.keys(audioBuffers).length === 0) {
        await loadAllSamples(source);
    } else {
        statusEl.textContent = `Using ${source} samples`;
    }
};

init();
