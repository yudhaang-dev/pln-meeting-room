import beepSound from '@/../assets/audio/beep.wav';

export const AUDIO_UNLOCK_EVENT = 'audio-unlocked';
export const AUDIO_BLOCKED_EVENT = 'audio-blocked';

// Hanya ditulis untuk kompatibilitas dengan media-player; tidak lagi dibaca di sini.
const AUDIO_UNLOCK_KEY = 'display-media-audio-unlocked';

let soundUrl: string | null = null;
let audioElement: HTMLAudioElement | null = null;

// Status ini SENGAJA tidak dibaca dari localStorage. Izin suara dinilai browser
// per halaman: flag dari sesi lama tidak membuktikan halaman ini sudah boleh
// berbunyi. Memutar audio senyap juga bukan bukti, karena selalu diizinkan.
// Satu-satunya bukti adalah gestur pengguna nyata (klik/ketuk/tombol).
let audioUnlocked = false;
let audioBlocked = false;

const GESTURE_EVENTS: (keyof DocumentEventMap)[] = [
    'click',
    'pointerdown',
    'keydown',
    'touchstart',
];

function resolveSoundUrl() {
    return soundUrl ?? beepSound;
}

function ensureElement(): HTMLAudioElement {
    if (!audioElement) {
        audioElement = new Audio(resolveSoundUrl());
    }

    return audioElement;
}

export function configureNotificationSound(url: string | null) {
    soundUrl = url;

    if (audioElement) {
        audioElement.src = resolveSoundUrl();
        audioElement.load();
    }
}

function markUnlocked() {
    audioUnlocked = true;
    audioBlocked = false;

    try {
        window.localStorage.setItem(AUDIO_UNLOCK_KEY, '1');
    } catch {
        // localStorage bisa tidak tersedia; tidak memengaruhi suara.
    }

    window.dispatchEvent(new Event(AUDIO_UNLOCK_EVENT));
}

function onGesture(event: Event) {
    // Klik buatan skrip (element.click(), dispatchEvent) tidak dihitung oleh
    // browser sebagai interaksi pengguna, jadi jangan dianggap membuka suara.
    if (!event.isTrusted) {
        return;
    }

    for (const name of GESTURE_EVENTS) {
        document.removeEventListener(name, onGesture, true);
    }

    markUnlocked();

    // "Menyiapkan" elemen audio di dalam gestur (diperlukan Safari/WebView lama).
    const audio = ensureElement();
    audio.volume = 0;
    audio.muted = true;
    audio
        .play()
        .then(() => audio.pause())
        .catch(() => {});
}

function armGestureListeners() {
    for (const event of GESTURE_EVENTS) {
        document.addEventListener(event, onGesture, true);
    }
}

export function isAudioUnlocked(): boolean {
    return audioUnlocked;
}

export function isAudioBlocked(): boolean {
    return audioBlocked;
}

export function setupAudioUnlock() {
    // Halaman yang sudah pernah disentuh pengguna (mis. klik tombol masuk di
    // halaman yang sama) sudah boleh berbunyi.
    const activation = (
        navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }
    ).userActivation;

    if (activation?.hasBeenActive) {
        markUnlocked();

        return;
    }

    armGestureListeners();
}

export function playBeep() {
    const audio = ensureElement();

    audio.volume = 1;
    audio.muted = false;
    audio.currentTime = 0;

    audio
        .play()
        .then(() => {
            audioBlocked = false;
        })
        .catch((error: unknown) => {
            console.warn('Beep playback failed:', error);

            // Diblokir kebijakan autoplay: tandai, beri tahu UI, dan buka
            // kembali begitu pengguna berinteraksi.
            if (
                error instanceof DOMException &&
                error.name === 'NotAllowedError'
            ) {
                audioUnlocked = false;
                audioBlocked = true;
                window.dispatchEvent(new Event(AUDIO_BLOCKED_EVENT));
                armGestureListeners();
            }
        });
}
