import beepSound from '@/../assets/audio/beep.wav';

let soundUrl: string | null = null;
let audioElement: HTMLAudioElement | null = null;
let audioUnlocked = false;

function resolveSoundUrl() {
    return soundUrl ?? beepSound;
}

export function configureNotificationSound(url: string | null) {
    soundUrl = url;

    if (audioElement) {
        audioElement.src = resolveSoundUrl();
        audioElement.load();
    }
}

function unlockAudio() {
    if (audioUnlocked) {
        return;
    }

    audioElement = new Audio(resolveSoundUrl());
    audioElement.volume = 0;
    audioElement.muted = true;
    void audioElement.play().catch(() => {});

    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    if (ctx.state === 'suspended') {
        void ctx.resume();
    }

    audioUnlocked = true;
    window.setTimeout(() => ctx.close(), 500);
}

export function setupAudioUnlock() {
    document.addEventListener('click', unlockAudio, { once: true });
}

export function playBeep() {
    if (!audioUnlocked) {
        unlockAudio();
    }

    if (!audioElement) {
        audioElement = new Audio(resolveSoundUrl());
    }

    audioElement.volume = 1;
    audioElement.muted = false;
    audioElement.currentTime = 0;
    audioElement.play().catch((error) => {
        console.warn('Beep playback failed:', error);
    });
}
