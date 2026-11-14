import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {validateEpisode} from '../preview/episode.mjs';
import {projectAssets} from '../scripts/project-media.mjs';

const collage = {
  book: '读书样片', author: '作者', cover: 'art/书封.jpg', portrait: 'art/作者.webp',
};
const scene = {frames: 90, text: '第一行\n第二行', collage};
const project = (scenes) => ({title: '示例', route: 'faceless', scenes});

test('collage images travel through the usual local media collection alongside audio', () => {
  const episode = validateEpisode(project([scene, {...scene, audio: 'voice.mp3'}]));
  assert.deepEqual([...projectAssets(episode)], ['art/书封.jpg', 'art/作者.webp', 'voice.mp3']);
});

test('collage rejects nonlocal and missing images, conflicting layouts and unfit headlines', () => {
  for (const invalid of [
    {...scene, collage: {...collage, portrait: '../portrait.png'}},
    {...scene, collage: {...collage, cover: undefined}},
    {...scene, motion: {layout: 'compare'}},
    {...scene, text: '过'.repeat(17)},
    {...scene, cues: [{frame: 0, text: '开场', screenText: '标题'}]},
  ]) {
    assert.throws(() => validateEpisode(project([invalid])), /分镜 1/);
  }
});
