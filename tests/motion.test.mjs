import assert from 'node:assert/strict';
import {test} from 'node:test';
import {validateEpisode} from '../preview/episode.mjs';
import {reveal, sceneTransition, speakerLayout, videoTimeline} from '../preview/motion.mjs';

test('legacy text scenes gain a short transition without changing the project duration', () => {
  const project = validateEpisode({
    title: '测试', route: 'faceless', scenes: [{frames: 30, text: '开头'}, {frames: 12, text: '结果'}],
  });
  assert.equal(project.duration, 42);
  assert.deepEqual(sceneTransition(...project.scenes, project.fps), {type: 'fade', frames: 4});
  assert.deepEqual(sceneTransition(project.scenes[0], {frames: 2}, 30), {type: 'cut', frames: 0});
  assert.deepEqual(sceneTransition({frames: 30, video: 'take.mp4'}, project.scenes[1], 30),
    {type: 'cut', frames: 0});
});

test('config rejects unordered cues, early focus and a PiP without video', () => {
  const validate = motion => validateEpisode({title: '测试', route: 'faceless', scenes: [{frames: 100, motion}]});
  assert.throws(() => validate({beats: [{label: '甲', at: 0.7}, {label: '乙', at: 0.3}]}), /出现顺序/);
  assert.throws(() => validate({beats: [{label: '甲', at: 0.7}], focus: {beat: 0, at: 0.3}}), /focus/);
  assert.throws(() => validate({speaker: 'pip'}), /视频素材/);
  assert.doesNotThrow(() => validate({beats: [{label: '总数', type: 'metric', value: 0}]}));
});

test('late reveals finish before the last frame even after timeline fit shrinks a scene', () => {
  assert.equal(reveal(0, 12, 30, 0.9), 0);
  assert.equal(reveal(11, 12, 30, 0.9), 1);
  assert.equal(reveal(0, 1, 30, 0.9), 1);
});

test('comparison symbols require exactly two beats in a comparison layout', () => {
  const beats = [{label: '甲'}, {label: '乙'}];
  const validate = motion => validateEpisode({title: '测试', route: 'faceless', scenes: [{frames: 100, motion}]});
  assert.doesNotThrow(() => validate({layout: 'compare', relation: '≠', beats}));
  assert.throws(() => validate({layout: 'steps', relation: '≠', beats}), /两项比较/);
  assert.throws(() => validate({relation: '或', beats: beats.slice(0, 1)}), /两项比较/);
});

test('contiguous slices of one take share its video and original audio across layouts', () => {
  const scenes = [
    {video: 'take.mp4', videoStartFrame: 12, frames: 48},
    {video: 'take.mp4', videoStartFrame: 60, frames: 60, motion: {speaker: 'pip'}},
    {video: 'take.mp4', videoStartFrame: 120, frames: 30},
    {video: 'take.mp4', frames: 30},
  ];
  const {shots, runs} = videoTimeline(scenes);
  assert.deepEqual(shots.map(shot => shot.from), [0, 48, 108, 138]);
  assert.deepEqual(runs.map(({from, frames, trimBefore}) => [from, frames, trimBefore]),
    [[0, 138, 12], [138, 30, 0]]);
  assert.equal(videoTimeline([{...scenes[0], audio: 'dub.wav'}, scenes[1]]).runs.length, 2);
  assert.throws(() => validateEpisode({
    title: '测试', route: 'talking-head', scenes: [{...scenes[0], videoStartFrame: -1}],
  }), /videoStartFrame/);
});

test('speaker insets accept both shapes and validate per-shot framing', () => {
  const validate = (pipShape, motion) => validateEpisode({
    title: '测试', route: 'talking-head', preferences: {pipShape},
    scenes: [{frames: 60, video: 'take.mp4', motion}],
  });
  for (const shape of ['rounded', 'circle']) {
    assert.doesNotThrow(() => validate(shape, {speaker: 'pip', pipCrop: {x: 30, y: 20, zoom: 2}}));
  }
  assert.throws(() => validate('square', {}), /pipShape/);
  assert.throws(() => validate('circle', {pipCrop: {x: 30}}), /pipCrop/);
  assert.throws(() => validate('circle', {speaker: 'pip', pipCrop: {zoom: 0.5}}), /pipCrop/);
});

test('inset and board have separate bounds for every supported aspect ratio', () => {
  for (const [width, height] of [[1920, 1080], [1080, 1920], [1080, 1440], [1440, 1080], [1080, 1080]]) {
    const {size, right, bottom, panelRight, panelBottom} = speakerLayout(width, height);
    const gap = Math.min(width, height) * 0.04;
    assert.ok(Math.max(panelRight - (size + right), panelBottom - (size + bottom)) >= gap - 0.001);
  }
});
