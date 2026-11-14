import {createReadStream} from 'node:fs';
import {copyFile, mkdir, mkdtemp, realpath, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, isAbsolute, join, relative, resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
import {isEpisodePath, validateEpisode} from './episode.mjs';
import {projectAssets, checkAssets, sceneTiming} from '../scripts/project-media.mjs';

const entryPoint = fileURLToPath(new URL('./render-root.jsx', import.meta.url));
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const compositionId = 'WoFrameEpisode';

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readRequest(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({destroyOnReturn: false})) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      request.resume();
      throw new RequestError(413, '项目配置超过 1 MB');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, '项目配置必须是 JSON');
  }
}

async function localFile(directory, path, message) {
  const file = await realpath(resolve(directory, path)).catch(() => null);
  const inside = file && relative(directory, file);
  if (!inside || inside === '..' || inside.startsWith('../') || inside.startsWith('..\\') ||
      isAbsolute(inside) || !(await stat(file)).isFile()) {
    throw new RequestError(400, message);
  }
  return file;
}

async function prepareProject(payload, assetsDir) {
  let path;
  let project;
  try {
    path = decodeURIComponent(payload.path);
    project = validateEpisode(payload.project);
  } catch (error) {
    throw new RequestError(400, error.message);
  }
  if (!isEpisodePath(path)) throw new RequestError(400, '请选择 public/work 或 public/examples 内的项目 JSON');
  const episode = await localFile(await realpath(publicDir), path.slice(1), '找不到项目 JSON');
  await mkdir(assetsDir);
  for (const name of projectAssets(project)) {
    const source = await localFile(dirname(episode), name, `项目素材不可用：${name}`);
    const target = join(assetsDir, name);
    await mkdir(dirname(target), {recursive: true});
    await copyFile(source, target);
  }
  try {
    await checkAssets(project, assetsDir);
    if (sceneTiming(project, assetsDir).warnings.length) {
      throw new Error('分镜时长不匹配，请运行 check --strict 查看详情');
    }
  } catch (error) {
    throw new RequestError(400, error.message);
  }
  return project;
}

export function renderEpisodePlugin() {
  let rendering = false;
  return {
    name: 'woframe-render-episode',
    configureServer(server) {
      server.middlewares.use('/api/render-episode', async (request, response) => {
        let directory;
        try {
          const host = request.headers.host;
          if (request.method !== 'POST') throw new RequestError(405, '请从预览页生成 MP4');
          if (!/^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host ?? '') ||
              request.headers.origin !== `http://${host}` ||
              !request.headers['content-type']?.startsWith('application/json')) {
            throw new RequestError(403, '请从本地预览页生成 MP4');
          }
          if (rendering) throw new RequestError(409, '已有视频正在渲染，请稍后再试');
          const payload = await readRequest(request);
          if (rendering) throw new RequestError(409, '已有视频正在渲染，请稍后再试');
          rendering = true;
          try {
            directory = await mkdtemp(join(tmpdir(), 'woframe-render-'));
            const assetsDir = join(directory, 'assets');
            const project = await prepareProject(payload, assetsDir);
            const [{bundle}, {selectComposition, renderMedia}] = await Promise.all([
              import('@remotion/bundler'), import('@remotion/renderer'),
            ]);
            const serveUrl = await bundle({entryPoint, publicDir: assetsDir, outDir: join(directory, 'bundle')});
            const inputProps = {project};
            const browserExecutable = process.env.WOFRAME_CHROME || undefined;
            const composition = await selectComposition({serveUrl, id: compositionId, inputProps, browserExecutable});
            const outputLocation = join(directory, 'episode.mp4');
            await renderMedia({serveUrl, composition, inputProps, browserExecutable, codec: 'h264',
              outputLocation, concurrency: 2, pixelFormat: 'yuv420p'});
            response.writeHead(200, {'Content-Type': 'video/mp4', 'Content-Length': (await stat(outputLocation)).size,
              'Cache-Control': 'no-store'});
            await pipeline(createReadStream(outputLocation), response);
          } finally {
            rendering = false;
          }
        } catch (error) {
          if (!(error instanceof RequestError)) server.config.logger.error(error.stack ?? String(error));
          if (!response.headersSent && !response.destroyed) {
            response.writeHead(error.status ?? 500, {'Content-Type': 'application/json; charset=utf-8'});
            response.end(JSON.stringify({error: error instanceof RequestError ? error.message : '渲染失败，请查看启动预览的终端'}));
          }
        } finally {
          if (directory) await rm(directory, {recursive: true, force: true});
        }
      });
    },
  };
}
