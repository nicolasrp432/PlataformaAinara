/**
 * Generador nativo de tono de notificación de lujo para mensajes.
 * Utiliza Web Audio API pura: sin descargas de archivos .mp3, sin latencia,
 * y funciona en todos los navegadores modernos (Safari, Chrome, Firefox, Edge).
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass()
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Reproduce un repique cálido y sutil (dos tonos armónicos en progresión suave).
 */
export function playMessageChime() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Tono 1: Frecuencia 587.33 Hz (Re5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(587.33, now)

    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.02)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.3)

    // Tono 2: Frecuencia 880.00 Hz (La5) ligeramente desplazado
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(880.0, now + 0.08)

    gain2.gain.setValueAtTime(0, now + 0.08)
    gain2.gain.linearRampToValueAtTime(0.14, now + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(now + 0.08)
    osc2.stop(now + 0.48)
  } catch {
    // Silencioso si el navegador bloquea audio antes de interacción
  }
}
