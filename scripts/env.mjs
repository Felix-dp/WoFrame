import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export const chromeCandidates = [
  process.env.WOFRAME_CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

export function detectChrome() {
  return chromeCandidates.find(path => existsSync(path)) ?? null;
}

function scalar(value) {
  const text = String(value).trim();
  if (/^".*"$/.test(text) || /^'.*'$/.test(text)) return text.slice(1, -1);
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

export function parseYaml(source) {
  const lines = source.split(/\r?\n/)
    .map(raw => raw.replace(/\t/g, '  '))
    .filter(text => text.trim() && !text.trim().startsWith('#'))
    .map(text => ({indent: text.match(/^ */)[0].length, body: text.trim()}));
  let index = 0;

  function parseBlock(indent) {
    return lines[index]?.body.startsWith('- ') ? parseList(indent) : parseMap(indent);
  }

  function parseMap(indent) {
    const out = {};
    while (index < lines.length && lines[index].indent === indent) {
      const match = lines[index].body.match(/^([\w-]+):\s*(.*)$/);
      if (!match) break;
      const [, key, value] = match;
      index += 1;
      if (value === '' && index < lines.length && lines[index].indent > indent) {
        out[key] = parseBlock(lines[index].indent);
      } else {
        out[key] = value === '' ? {} : scalar(value);
      }
    }
    return out;
  }

  function parseList(indent) {
    const out = [];
    while (index < lines.length && lines[index].indent === indent && lines[index].body.startsWith('- ')) {
      const item = {};
      const first = lines[index].body.slice(2).trim();
      const match = first.match(/^([\w-]+):\s*(.*)$/);
      index += 1;
      if (match) item[match[1]] = match[2] === '' ? {} : scalar(match[2]);
      while (index < lines.length && lines[index].indent > indent && !lines[index].body.startsWith('- ')) {
        const entry = lines[index].body.match(/^([\w-]+):\s*(.*)$/);
        if (!entry) break;
        index += 1;
        item[entry[1]] = entry[2] === '' ? {} : scalar(entry[2]);
      }
      out.push(item);
    }
    return out;
  }

  return parseBlock(0);
}

export function loadRequirements() {
  return parseYaml(readFileSync(join(repoRoot, 'requirements.yaml'), 'utf8'));
}

function commandWorks(command) {
  const [bin, ...args] = String(command).split(/\s+/);
  if (!bin) return false;
  const result = spawnSync(bin, args, {stdio: 'ignore', timeout: 20000});
  return result.status === 0;
}

function satisfies(version, range) {
  const need = String(range).match(/(\d+)\.(\d+)/);
  const have = String(version).replace(/^v/, '').split('.').map(Number);
  if (!need) return true;
  return have[0] > Number(need[1]) || (have[0] === Number(need[1]) && have[1] >= Number(need[2]));
}

const platformKey = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'darwin' : 'linux';

export function findHypit() {
  const result = spawnSync('hypit', ['--version'], {shell: platformKey === 'windows', stdio: 'ignore', timeout: 3000});
  return result.status === 0;
}

export function hypitReadiness() {
  if (!findHypit()) {
    return {ready: false, reason: '未找到 Hypit CLI', next: 'npm install --global @hypit/hypit'};
  }
  const next = '在当前 Hypit 项目目录运行 hypit doctor，按提示配置 Runtime Profile 和所用服务';
  const result = spawnSync('hypit', ['doctor', '--json'], {
    encoding: 'utf8', shell: platformKey === 'windows', timeout: 30000,
  });
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    return {ready: false, reason: '无法读取 Hypit 环境检查结果', next};
  }
  if (!report.profileSource || report.profileSource === 'none') {
    return {ready: false, reason: '当前 Hypit 项目没有 Runtime Profile', next: 'hypit runtime init'};
  }
  if (result.status !== 0 || report.ok !== true) {
    return {ready: false, reason: 'Hypit Runtime 或服务配置未通过检查', next};
  }
  const warnings = (report.diagnostics ?? []).filter(item => item.severity === 'warning').map(item => item.code);
  return {ready: true, warnings};
}

export function evaluateRequirements({needsUv = false} = {}) {
  const requirements = loadRequirements();
  const results = [];

  results.push({
    id: 'node',
    ok: satisfies(process.versions.node, requirements.node),
    required: true,
    detail: '当前 ' + process.versions.node + '，需要 ' + requirements.node,
    fix: 'https://nodejs.org',
  });

  const hasDeps = existsSync(join(repoRoot, 'node_modules', '@remotion', 'player'));
  results.push({
    id: 'npm',
    ok: hasDeps,
    required: Boolean(requirements.npm?.install),
    detail: hasDeps ? '依赖已安装' : '未安装仓库依赖',
    fix: 'npm install',
  });

  for (const check of requirements.checks ?? []) {
    const ok = check.id === 'chrome' ? Boolean(detectChrome()) : Boolean(check.command && commandWorks(check.command));
    results.push({
      id: check.id,
      ok,
      required: Boolean(check.required || (needsUv && check.id === 'uv')),
      detail: check.why ?? '',
      fix: check[platformKey] ?? '',
    });
  }

  const missing = results.filter(row => !row.ok && row.required);
  return {platform: process.platform, node: process.versions.node, results, missing,
    ready: missing.length === 0};
}

export function installMissing(report) {
  const done = [];
  for (const row of report.missing) {
    if (row.id === 'node') {
      throw new Error('Node.js 版本不够，请先升级到 ' + loadRequirements().node);
    }
    if (row.id === 'npm') {
      execFileSync('npm install', {cwd: repoRoot, stdio: 'inherit', shell: true});
      done.push('npm install');
      continue;
    }
    if (!row.fix) throw new Error('缺少 ' + row.id + '，但没有当前平台的安装命令');
    if (done.includes(row.fix)) continue;
    execFileSync(row.fix, {shell: true, stdio: 'inherit', cwd: repoRoot});
    done.push(row.fix);
  }
  return done;
}
