import {execFile} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {promisify} from 'node:util';

const exec = promisify(execFile);
const command = process.env.STUDIO_FFMPEG || 'ffmpeg';
const options = {windowsHide: true, timeout: 120000};

export async function hasMp4Encoder() {
  try {
    const {stdout} = await exec(command, ['-hide_banner', '-encoders'], {...options, timeout: 4000});
    return /\blibx264\b/.test(stdout) && /\baac\b/.test(stdout);
  } catch {
    return false;
  }
}

export async function toMp4(webm) {
  const directory = await mkdtemp(join(tmpdir(), 'studio-mp4-'));
  const input = join(directory, 'source.webm');
  const output = join(directory, 'video.mp4');
  try {
    await writeFile(input, webm);
    await exec(command, [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-protocol_whitelist', 'file',
      '-f', 'webm', '-i', input, '-map', '0:v:0', '-map', '0:a:0?',
      '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-movflags', '+faststart', output,
    ], options);
    return await readFile(output);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
}
