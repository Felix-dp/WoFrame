"""Download platform-specific Qwen3-TTS weights and synthesize offline."""
import argparse
import json
import sys

import numpy as np
import soundfile as sf
from huggingface_hub import hf_hub_download, snapshot_download
MODELS = {
    "mlx": ("mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit",
            "049ef77fe8816b536193c0c25f9a214d17921282"),
    "torch-cpu": ("Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice",
                  "85e237c12c027371202489a0ec509ded67b5e4b5"),
}

MODEL_FILES = (
    "config.json", "generation_config.json", "merges.txt", "model.safetensors",
    "preprocessor_config.json", "tokenizer_config.json",
    "vocab.json", "speech_tokenizer/config.json", "speech_tokenizer/configuration.json",
    "speech_tokenizer/model.safetensors", "speech_tokenizer/preprocessor_config.json",
)


def model_path(backend, *, install=False):
    model, revision = MODELS[backend]
    files = (*MODEL_FILES, "model.safetensors.index.json") if backend == "mlx" else MODEL_FILES
    if install:
        return snapshot_download(model, revision=revision, allow_patterns=files)
    # snapshot_download(local_files_only=True) can return an incomplete snapshot.
    for filename in files:
        hf_hub_download(model, filename, revision=revision, local_files_only=True)
    return snapshot_download(model, revision=revision, local_files_only=True)


def torch_runtime():
    import torch
    from qwen_tts import Qwen3TTSModel

    return torch, Qwen3TTSModel


def load_generator(backend, path):
    if backend == "mlx":
        from mlx_audio.tts.utils import load_model

        model = load_model(path)

        def generate(text, speaker, language):
            results = list(model.generate_custom_voice(text=text, speaker=speaker, language=language))
            if not results:
                raise RuntimeError("Qwen3-TTS returned no audio")
            audio = np.concatenate([np.asarray(result.audio).reshape(-1) for result in results])
            return audio, results[0].sample_rate

        return generate

    torch, model_class = torch_runtime()
    model = model_class.from_pretrained(path, device_map="cpu", dtype=torch.float32,
                                        attn_implementation="sdpa", local_files_only=True)

    def generate(text, speaker, language):
        waveforms, rate = model.generate_custom_voice(text=text, speaker=speaker, language=language)
        if not waveforms or not waveforms[0].size:
            raise RuntimeError("Qwen3-TTS returned no audio")
        return waveforms[0], rate

    return generate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend", choices=MODELS, default="mlx")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--download", action="store_true")
    args = parser.parse_args()
    if args.check or args.download:
        if args.backend == "torch-cpu":
            torch_runtime()
        else:
            import mlx_audio.tts.utils  # Check that the installed runtime can import.
        model_path(args.backend, install=args.download)
        return
    request = json.load(sys.stdin)
    generate = load_generator(args.backend, model_path(args.backend))
    for job in request["jobs"]:
        audio, rate = generate(job["text"], request["speaker"], request["language"])
        sf.write(job["file"], audio, rate, subtype="PCM_16")


if __name__ == "__main__":
    main()
