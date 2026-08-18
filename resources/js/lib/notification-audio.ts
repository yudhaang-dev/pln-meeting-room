import beepSound from '@/../assets/audio/beep.wav';

export const AUDIO_UNLOCK_EVENT = 'audio-unlocked';

const AUDIO_UNLOCK_KEY = 'display-media-audio-unlocked';

let soundUrl: string | null = null;
let audioElement: HTMLAudioElement | null = null;
let audioUnlocked =
    typeof window !== 'undefined' &&
    window.localStorage.getItem(AUDIO_UNLOCK_KEY) === '1';

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

    if (!audioElement) {
        audioElement = new Audio(resolveSoundUrl());
    }

    audioElement.volume = 0;
    audioElement.muted = true;

    audioElement
        .play()
        .then(() => {
            audioUnlocked = true;
            window.localStorage.setItem(AUDIO_UNLOCK_KEY, '1');
            window.dispatchEvent(new Event(AUDIO_UNLOCK_EVENT));
            audioElement?.pause();
        })
        .catch(() => {});
}

export function isAudioUnlocked(): boolean {
    return audioUnlocked;
}

export function setupAudioUnlock() {
    const unlock = () => unlockAudio();
    const events: (keyof DocumentEventMap)[] = [
        'click',
        'pointerdown',
        'keydown',
        'touchstart',
    ];

    for (const event of events) {
        document.addEventListener(event, unlock, { once: true });
    }
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
