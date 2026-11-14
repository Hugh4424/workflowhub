// 2026-11-12-001-c11-query-writer.mjs
// C11/P1 查询写入器：只用 Node 标准库，对项目知识图做一次有界查询，
// 把查询结果的完整原始 JSON 原样写到 --raw 与 stdout（同一份字节），
// 并派生页面只读的数据文件 --data、记录可重跑的查询命令 --command。
// 不复制图文件、不写网络、不改判定器。坏输入一律非零退出。
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';

// 有界查询定义（固定写死，保证同一图输入得到同一结果；不引入外部参数）
const QUERY = Object.freeze({
  name: 'skills-experience-candidates',
  filter: Object.freeze({
    file_type: Object.freeze(['concept', 'rationale']),
    source_file_prefix: 'skills/',
  }),
  order_by: 'id asc',
  limit: 8,
});

function fail(code, message) {
  process.stderr.write(message + '\n');
  process.exit(code);
}

function parseArgs(argv) {
  const out = { graph: null, raw: null, data: null, command: null };
  const known = new Set(['--graph', '--raw', '--data', '--command']);
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!known.has(key)) fail(2, '查询写入器参数非法：未知参数 ' + key);
    const value = argv[i + 1];
    if (typeof value !== 'string' || value === '' || value.startsWith('--')) {
      fail(2, '查询写入器参数非法：' + key + ' 缺少取值');
    }
    out[key.slice(2)] = value;
    i += 1;
  }
  for (const key of ['graph', 'raw', 'data', 'command']) {
    if (!out[key]) fail(2, '查询写入器参数非法：缺少 --' + key);
  }
  return out;
}

function communityLabel(record) {
  if (typeof record.community_name === 'string' && record.community_name) return record.community_name;
  if (Number.isInteger(record.community)) return 'Community ' + record.community;
  return '社区未标注';
}

function shellQuote(value) {
  return "'" + String(value).replace(/'/g, "'\\''") + "'";
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const graphPath = path.resolve(args.graph);
  const rawPath = path.resolve(args.raw);
  const dataPath = path.resolve(args.data);
  const commandPath = path.resolve(args.command);

  let graphText;
  try {
    graphText = fs.readFileSync(graphPath, 'utf8');
  } catch (error) {
    fail(2, '查询写入器读不到图文件：' + graphPath + '（' + error.message + '）');
  }

  let graph;
  try {
    graph = JSON.parse(graphText);
  } catch (error) {
    fail(2, '查询写入器读到的图不是合法 JSON：' + graphPath + '（' + error.message + '）');
  }
  if (!graph || !Array.isArray(graph.nodes)) {
    fail(2, '查询写入器读到的图没有 nodes 数组：' + graphPath);
  }

  // 有界查询：按固定过滤条件取经验条目（概念/理由节点），按 id 升序，取前 limit 条。
  const matched = graph.nodes
    .filter((node) => node
      && typeof node.id === 'string'
      && node.id !== ''
      && typeof node.source_file === 'string'
      && node.source_file.startsWith(QUERY.filter.source_file_prefix)
      && QUERY.filter.file_type.includes(node.file_type))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  if (matched.length === 0) {
    fail(3, '查询写入器没有匹配到经验条目：' + graphPath);
  }

  const records = matched.slice(0, QUERY.limit).map((node) => ({
    id: node.id,
    label: typeof node.label === 'string' ? node.label : node.id,
    file_type: node.file_type,
    source_file: node.source_file,
    source_location: typeof node.source_location === 'string' ? node.source_location : '',
    community: Number.isInteger(node.community) ? node.community : null,
    community_name: typeof node.community_name === 'string' ? node.community_name : '',
  }));

  const rawDoc = {
    schema: 'c11-query-raw/1',
    query: {
      name: QUERY.name,
      filter: {
        file_type: QUERY.filter.file_type.slice(),
        source_file_prefix: QUERY.filter.source_file_prefix,
      },
      order_by: QUERY.order_by,
      limit: QUERY.limit,
    },
    graph: {
      path: graphPath,
      built_at_commit: typeof graph.built_at_commit === 'string' ? graph.built_at_commit : '',
      nodes: graph.nodes.length,
    },
    total_matched: matched.length,
    returned: records.length,
    records,
  };
  const rawText = JSON.stringify(rawDoc, null, 2) + '\n';

  const dataDoc = {
    schema: 'c11-query-data/1',
    source: {
      graph_path: graphPath,
      built_at_commit: rawDoc.graph.built_at_commit,
      query: rawDoc.query,
      raw_sha256: crypto.createHash('sha256').update(rawText, 'utf8').digest('hex'),
    },
    samples: records.map((record) => {
      const location = record.source_location ? ' ' + record.source_location : '';
      const yamlLines = [
        'id: ' + JSON.stringify(record.id),
        'label: ' + JSON.stringify(record.label),
        'kind: ' + JSON.stringify(record.file_type),
        'source_file: ' + JSON.stringify(record.source_file),
        'source_location: ' + JSON.stringify(record.source_location),
        'community: ' + JSON.stringify(communityLabel(record)),
      ];
      return {
        id: record.id,
        name: record.label,
        kind: record.file_type,
        source_file: record.source_file,
        source_location: record.source_location,
        community: communityLabel(record),
        summary: record.label + '（' + record.file_type + ' · ' + record.source_file + location + '）',
        yaml_text: yamlLines.join('\n') + '\n',
        canonical_content: {
          id: record.id,
          label: record.label,
          file_type: record.file_type,
          source_file: record.source_file,
          source_location: record.source_location,
          community: record.community,
          community_name: record.community_name,
        },
      };
    }),
  };
  // 页面只读数据文件：内嵌查询结果的 JSON 原文；JSON 非法时给出可读的解析失败标记。
  const dataText = [
    '// 2026-11-12-002-c11-query-data.js',
    '// 由 2026-11-12-001-c11-query-writer.mjs 生成；页面只读，勿手改。',
    '(function () {',
    '  var text = ' + JSON.stringify(JSON.stringify(dataDoc)) + ';',
    '  try {',
    '    window.C11_QUERY_DATA = JSON.parse(text);',
    '  } catch (error) {',
    '    window.C11_QUERY_DATA = null;',
    '    window.C11_QUERY_DATA_ERROR = "查询数据文件不是合法 JSON：" + error.message;',
    '  }',
    '})();',
    '',
  ].join('\n');

  const recordedCommand = [
    'node',
    shellQuote(path.resolve(process.argv[1])),
    '--graph', shellQuote(graphPath),
    '--raw', shellQuote(rawPath),
    '--data', shellQuote(dataPath),
    '--command', shellQuote(commandPath),
  ].join(' ');
  const commandText = recordedCommand + ' # exit=0\n';

  try {
    fs.mkdirSync(path.dirname(rawPath), { recursive: true });
    fs.writeFileSync(rawPath, rawText, 'utf8');
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, dataText, 'utf8');
    fs.mkdirSync(path.dirname(commandPath), { recursive: true });
    fs.writeFileSync(commandPath, commandText, 'utf8');
  } catch (error) {
    fail(2, '查询写入器写不出结果文件：' + error.message);
  }

  // 落盘的原始输出与 stdout 是同一份字节；调用方只做原样重定向。
  process.stdout.write(rawText);
}

main();
