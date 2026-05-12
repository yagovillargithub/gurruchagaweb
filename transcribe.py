import sys
from faster_whisper import WhisperModel

audio_path = r"C:\Users\Yago\Downloads\WhatsApp Ptt 2026-05-07 at 23.18.27.ogg"

print("Cargando modelo small...", flush=True)
model = WhisperModel("small", device="cpu", compute_type="int8")

print("Transcribiendo...", flush=True)
segments, info = model.transcribe(audio_path, language="es", beam_size=5, vad_filter=True)

print(f"\nIdioma detectado: {info.language} (prob {info.language_probability:.2f})")
print(f"Duracion: {info.duration:.1f}s\n")
print("--- TRANSCRIPCION ---")
full = []
for seg in segments:
    line = f"[{seg.start:6.2f} -> {seg.end:6.2f}] {seg.text.strip()}"
    print(line, flush=True)
    full.append(seg.text.strip())
print("\n--- TEXTO COMPLETO ---")
print(" ".join(full))
