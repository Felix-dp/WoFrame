import {execFile} from 'node:child_process';
import {copyFile, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {promisify} from 'node:util';

const exec = promisify(execFile);

export async function synthesizeSpeech(text) {
  const windows = process.platform === 'win32' && !process.env.STUDIO_TTS_COMMAND && process.env.STUDIO_TTS_PROVIDER !== 'edge';
  const directory = await mkdtemp(join(tmpdir(), 'studio-voice-'));
  const input = join(directory, 'narration.txt');
  const output = join(directory, windows ? 'voice.wav' : 'voice.mp3');
  try {
    await writeFile(input, text, 'utf8');
    const script = join(directory, 'synthesize.ps1');
    if (windows) await copyFile(new URL('./windows-voice.ps1', import.meta.url), script);
    const command = windows ? 'powershell.exe' : process.env.STUDIO_TTS_COMMAND || 'edge-tts';
    const args = windows
      ? ['-NoProfile', '-NonInteractive', '-File', script, input, output]
      : ['--voice', process.env.STUDIO_TTS_VOICE || 'zh-CN-XiaoxiaoNeural', '--file', input, '--write-media', output];
    await exec(command, args, {timeout: 35000, windowsHide: true});
    const audio = await readFile(output);
    if (!audio.length) throw new Error('Empty speech output');
    return {audio, contentType: windows ? 'audio/wav' : 'audio/mpeg'};
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
}
