import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {detectChrome} from '../../scripts/env.mjs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const chrome = detectChrome();
if (!chrome) {
  throw new Error('找不到 Chrome，用来把封面模板截成图。跑 node scripts/woframe.mjs setup --install，或用 WOFRAME_CHROME 指向可执行文件。');
}
const SIZES = {'16x9':[1920,1080], '3x4':[1080,1440], '4x3':[1440,1080], '1x1':[1080,1080]};
const SLOTS = ['series', 'ep', 'title', 'hook', 'k1', 'k2', 'k3', 'note', 'sub', 'figure', 'still'];

export const styles = ['min', 'tech', 'cinema', 'slice', 'paper'];

export function render({style, format = '16x9', out, text = {}}) {
  if (!styles.includes(style)) throw new Error('未知风格：' + style + '，可选 ' + styles.join(' / '));
  const [w, h] = SIZES[format] ?? (() => { throw new Error('未知画幅：' + format + '，可选 ' + Object.keys(SIZES).join(' / ')); })();
  const query = new URLSearchParams({style, format, ...text}).toString();
  const page = pathToFileURL(resolve(here, 'covers.html')).href + '?' + query;
  mkdirSync(dirname(out), {recursive: true});
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
    '--force-device-scale-factor=1', '--virtual-time-budget=3000',
    '--window-size=' + w + ',' + h,
    '--screenshot=' + out, page], {stdio: 'ignore'});
  return out;
}

function parse(argv) {
  const args = {text: {}};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const value = argv[i + 1];
    i++;
    if (SLOTS.includes(name)) args.text[name] = value;
    else args[name] = value;
  }
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  if (argv.length && argv[0] !== 'all') {
    const args = parse(argv);
    const style = args.style ?? argv[0];
    const format = args.format ?? '16x9';
    const out = args.out ? resolve(args.out) : resolve(here, 'samples', style + '-' + format + '.png');
    console.log('rendered', render({style, format, out, text: args.text}));
  } else {
    for (const style of styles) {
      for (const format of ['16x9', '3x4']) {
        const out = resolve(here, 'samples', style + '-' + format + '.png');
        render({style, format, out});
        console.log('rendered', out);
      }
    }
  }
}