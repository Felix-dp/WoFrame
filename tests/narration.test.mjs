import assert from 'node:assert/strict';
import {copyFile, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {narrateEpisode} from '../scripts/narration.mjs';

const narration = fileURLToPath(new URL('../public/examples/baoyan/narration.wav', import.meta.url));

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'woframe-voice-test-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const file = join(dir, 'episode.json');
  const project = {title: 'Narration test', route: 'faceless', preferences: {track: 'vertical'}, scenes: [
    {frames: 300, narrationText: '这个镜头由模型朗读。'},
    {frames: 1378, narrationText: '这段已有录音。', audio: 'recorded.wav'},
  ]};
  await copyFile(narration, join(dir, 'recorded.wav'));
  await writeFile(file, JSON.stringify(project));
  const read = () => readFile(file, 'utf8');
  return {dir, file, read, project, original: await read()};
}

async function generate(voice, jobs) {
  assert.equal(jobs.length, 1);
  await copyFile(narration, jobs[0].file);
}

test('audition leaves the project unchanged and switching a voice preserves existing recordings', async t => {
  const {file, read, original} = await fixture(t);
  const sample = await narrateEpisode(file, {voiceId: 'qwen-vivian', sample: true, generate});
  assert.match(sample.file, /voice-sample-[^/]+\/scene-001\.wav$/);
  assert.equal(await read(), original);

  const previous = await narrateEpisode(file, {voiceId: 'qwen-vivian', generate});
  const next = await narrateEpisode(file, {voiceId: 'qwen-uncle-fu', generate});
  const project = JSON.parse(await read());
  assert.equal(project.preferences.narrationVoice, 'qwen-uncle-fu');
  assert.ok(project.scenes[0].frames > 1000);
  assert.equal(project.scenes[0].audio, next.generated[0].audio);
  assert.notEqual(project.scenes[0].audio, previous.generated[0].audio);
  assert.equal(project.scenes[1].audio, 'recorded.wav');
});

test('failed synthesis preserves the project and removes the incomplete take', async t => {
  const {dir, file, read, original} = await fixture(t);
  await assert.rejects(narrateEpisode(file, {voiceId: 'qwen-vivian', generate: async (voice, jobs) => {
    await writeFile(jobs[0].file, 'incomplete');
    throw new Error('synthesis failed');
  }}), /synthesis failed/);
  assert.equal(await read(), original);
  assert.deepEqual((await readdir(dir)).sort(), ['episode.json', 'recorded.wav']);
});
