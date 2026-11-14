import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {configuredModels, createAi, ModelError} from './ai.mjs';
import {synthesizeSpeech} from './voice.mjs';
import {hasMp4Encoder, toMp4} from './mp4.mjs';

const files = new Map([
  ['/design/reference.html', ['../design/reference.html', 'text/html; charset=utf-8']],
  ['/design/reference.js', ['../design/reference.js', 'text/javascript; charset=utf-8']],
  ['/design/start.html', ['../design/start.html', 'text/html; charset=utf-8']],
  ['/design/theme.css', ['../design/theme.css', 'text/css; charset=utf-8']],
  ['/design/word-cloud.js', ['../design/word-cloud.js', 'text/javascript; charset=utf-8']],
  ['/design/cloud-fx.js', ['../design/cloud-fx.js', 'text/javascript; charset=utf-8']],
  ['/design/trending-topics.json', ['../design/trending-topics.json', 'application/json; charset=utf-8']],
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/draft.mjs', ['draft.mjs', 'text/javascript; charset=utf-8']],
  ['/media.mjs', ['media.mjs', 'text/javascript; charset=utf-8']],
  ['/languages.mjs', ['languages.mjs', 'text/javascript; charset=utf-8']],
  ['/takes.mjs', ['takes.mjs', 'text/javascript; charset=utf-8']],
]);
const port = Number(process.env.STUDIO_PORT ?? 4173);
const models = configuredModels(process.env);
const generators = new Map([...models].map(([id, config]) => [id, createAi(config)]));
const defaultGenerator = generators.values().next().value ?? createAi({});
const modelOptions = [...models].map(([id, {label}]) => ({id, label}));
const mp4Available = hasMp4Encoder();
let transcoding = false;

createServer(async (request, response) => {
  const path = request.url?.split('?')[0];
  if (request.method === 'GET' && path === '/api/status') {
    response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'})
      .end(JSON.stringify({aiConfigured: models.size > 0, models: modelOptions, mp4Available: await mp4Available}));
    return;
  }
  if (request.method === 'POST' && path === '/api/mp4') {
    if (!await mp4Available || transcoding) {
      response.writeHead(503).end();
      return;
    }
    transcoding = true;
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of request.iterator({destroyOnReturn: false})) {
        size += chunk.length;
        if (size > 64 * 1024 * 1024) {
          response.writeHead(413).end();
          request.resume();
          return;
        }
        chunks.push(chunk);
      }
      const video = await toMp4(Buffer.concat(chunks, size));
      response.writeHead(200, {'Content-Type': 'video/mp4', 'Cache-Control': 'no-store'}).end(video);
    } catch {
      response.writeHead(422).end();
    } finally {
      transcoding = false;
    }
    return;
  }
  if (request.method === 'POST' && ['/api/angles', '/api/draft', '/api/revise', '/api/voice'].includes(path)) {
    let body = '';
    try {
      for await (const chunk of request.setEncoding('utf8').iterator({destroyOnReturn: false})) {
        body += chunk;
        if (body.length > 4096) {
          response.writeHead(413, {'Content-Type': 'application/json; charset=utf-8'}).end(JSON.stringify({error: '输入过长。'}));
          request.resume();
          return;
        }
      }
      const input = JSON.parse(body);
      if (path === '/api/voice') {
        if (typeof input?.text !== 'string' || !input.text.trim() || input.text.length > 1200) {
          response.writeHead(400).end();
          return;
        }
        const {audio, contentType} = await synthesizeSpeech(input.text, input.language);
        response.writeHead(200, {'Content-Type': contentType, 'Cache-Control': 'no-store'}).end(audio);
        return;
      }
      const generate = input?.modelId ? generators.get(input.modelId) : defaultGenerator;
      if (!generate) throw new ModelError(400, '请选择服务端已配置的模型。');
      const data = await generate(path.slice(5), input);
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({data}));
    } catch (error) {
      const upstream = error instanceof ModelError;
      const message = upstream || error.code === 'VOICE_SCRIPT_POLICY' ? error.message
        : path === '/api/voice' ? '配音失败，请检查所选语言的系统语音包或 Edge 语音配置。'
          : '生成暂未成功，请重试。';
      response.writeHead(upstream ? error.status : path === '/api/voice' ? 503 : 422, {'Content-Type': 'application/json; charset=utf-8'})
        .end(JSON.stringify({error: message}));
    }
    return;
  }
  const entry = files.get(path);
  if (!entry || request.method !== 'GET') {
    response.writeHead(404).end();
    return;
  }
  const [file, contentType] = entry;
  try {
    const content = await readFile(new URL(file, import.meta.url));
    response.writeHead(200, {'Content-Type': contentType}).end(content);
  } catch (error) {
    console.error(error);
    response.writeHead(500).end();
  }
}).listen(port, '127.0.0.1', function () {
  console.log(`http://127.0.0.1:${this.address().port}`);
});
