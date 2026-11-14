import {access, mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {validateEpisode} from '../preview/episode.mjs';

const read = async file => JSON.parse(await readFile(file, 'utf8'));
const print = value => console.log(JSON.stringify(value, null, 2));
const keys = ['audience', 'targetSeconds', 'pace', 'platform', 'ratio', 'style',
  'visualStyle', 'voice', 'bgmStyle', 'captionStyle', 'materialSource'];
const preferences = value => Object.fromEntries(keys.filter(key =>
  ['string', 'number', 'boolean'].includes(typeof value?.[key])).map(key => [key, value[key]]));
const installed = (name, args) => spawnSync(name, args, {stdio: 'ignore', timeout: 3000}).status === 0;
const require = createRequire(import.meta.url);
function hasRemotion() {
  try {
    require.resolve('@remotion/player');
    return true;
  } catch {
    return false;
  }
}

async function main([command, first, second]) {
  switch (command) {
    case 'doctor':
      print({node: process.version, ffmpeg: installed('ffmpeg', ['-version']),
        hypitCli: installed('hypit', ['--version']), uv: installed('uv', ['--version']),
        elevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
        hypitKey: Boolean(process.env.HYPIT_API_KEY),
        remotion: hasRemotion()});
      return;
    case 'check': {
      const episode = validateEpisode(await read(first));
      const files = new Set([episode.bgm, ...episode.scenes.flatMap(scene => [scene.video, scene.audio])]);
      for (const file of files) if (file) await access(resolve(dirname(first), file));
      print({ok: true, scenes: episode.scenes.length, seconds: episode.duration / episode.fps});
      return;
    }
    case 'save-handbook': {
      const episode = await read(first);
      const handbook = {version: 1, preferences: preferences({...episode.preferences, ...(episode.ratio && {ratio: episode.ratio})})};
      if (second) {
        await mkdir(dirname(second), {recursive: true});
        await writeFile(second, `${JSON.stringify(handbook, null, 2)}\n`, {encoding: 'utf8', flag: 'wx'});
      }
      print(handbook);
      return;
    }
    case 'apply-handbook': {
      const handbook = await read(first);
      if (handbook.version !== 1 || !handbook.preferences) throw new Error('Handbook 格式无效');
      const episode = await read(second);
      print({...episode, preferences: {...preferences(handbook.preferences), ...episode.preferences}});
      return;
    }
    default:
      throw new Error('用法：woframe.mjs doctor | check <episode.json> | save-handbook <episode.json> [handbook.json] | apply-handbook <handbook.json> <episode.json>');
  }
}

main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
