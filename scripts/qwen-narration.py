"""Generate preset voices with Qwen3-TTS on Apple Silicon."""
import json
import sys

import numpy as np
import soundfile as sf
from huggingface_hub import snapshot_download
from mlx_audio.tts.utils import load_model

MODEL = "mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit"
REVISION = "049ef77fe8816b536193c0c25f9a214d17921282"

def main():
    request = json.load(sys.stdin)
    model = load_model(snapshot_download(MODEL, revision=REVISION,
                                         allow_patterns=["*.json", "*.txt", "*.safetensors"]))
    for job in request["jobs"]:
        results = list(model.generate_custom_voice(
            text=job["text"], speaker=request["speaker"], language=request["language"],
        ))
        if not results:
            raise RuntimeError("Qwen3-TTS returned no audio")
        audio = np.concatenate([np.asarray(result.audio).reshape(-1) for result in results])
        sf.write(job["file"], audio, results[0].sample_rate, subtype="PCM_16")

if __name__ == "__main__":
    main()
