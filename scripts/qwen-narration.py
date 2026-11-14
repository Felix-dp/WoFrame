"""Generate preset voices with Qwen3-TTS on Apple Silicon."""
import json
import sys

import numpy as np
import soundfile as sf
from huggingface_hub import hf_hub_download, snapshot_download
from mlx_audio.tts.utils import load_model

MODEL = "mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit"
REVISION = "049ef77fe8816b536193c0c25f9a214d17921282"

MODEL_FILES = (
    "config.json", "generation_config.json", "merges.txt", "model.safetensors",
    "model.safetensors.index.json", "preprocessor_config.json", "tokenizer_config.json",
    "vocab.json", "speech_tokenizer/config.json", "speech_tokenizer/configuration.json",
    "speech_tokenizer/model.safetensors", "speech_tokenizer/preprocessor_config.json",
)


def model_path(*, install=False):
    if install:
        return snapshot_download(MODEL, revision=REVISION, allow_patterns=MODEL_FILES)
    # snapshot_download(local_files_only=True) can return an incomplete snapshot.
    for filename in MODEL_FILES:
        hf_hub_download(MODEL, filename, revision=REVISION, local_files_only=True)
    return snapshot_download(MODEL, revision=REVISION, local_files_only=True)


def main():
    if sys.argv[1:] == ["--check"]:
        model_path()
        return
    if sys.argv[1:] == ["--download"]:
        model_path(install=True)
        return
    request = json.load(sys.stdin)
    model = load_model(model_path())
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
