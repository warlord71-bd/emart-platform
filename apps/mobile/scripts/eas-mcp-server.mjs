#!/usr/bin/env node
/**
 * EAS MCP Server — wraps eas-cli for Claude Code integration
 * Allows Claude to trigger builds, check status, and submit to Play Store.
 *
 * Setup: set EXPO_TOKEN in /root/.config/expo-token
 * Run via Claude MCP config (see settings.json)
 */

import { createServer } from 'node:http';
import { execSync, spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';

const MOBILE_DIR = '/root/emart-platform/apps/mobile';
const TOKEN_FILE = '/root/.config/expo-token';
const SERVICE_KEY = '/root/.config/emart-play-service-account.json';

function getToken() {
  if (process.env.EXPO_TOKEN) return process.env.EXPO_TOKEN;
  if (existsSync(TOKEN_FILE)) return readFileSync(TOKEN_FILE, 'utf8').trim();
  return null;
}

function runEas(args, opts = {}) {
  const token = getToken();
  const env = { ...process.env, PATH: process.env.PATH };
  if (token) env.EXPO_TOKEN = token;
  try {
    return execSync(`eas ${args}`, {
      cwd: MOBILE_DIR,
      env,
      timeout: opts.timeout ?? 30000,
      encoding: 'utf8',
    }).trim();
  } catch (e) {
    throw new Error(e.stderr?.toString().trim() || e.message);
  }
}

// MCP JSON-RPC over stdio
const readline = createInterface({ input: process.stdin });

function respond(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(msg + '\n');
}

function error(id, code, message) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  process.stdout.write(msg + '\n');
}

const TOOLS = [
  {
    name: 'eas_build_list',
    description: 'List recent EAS builds for the Emart mobile app',
    inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 5 } } },
  },
  {
    name: 'eas_build_start',
    description: 'Start a new EAS production build for Android (uploads to Play Store when done if --auto-submit)',
    inputSchema: {
      type: 'object',
      properties: {
        profile: { type: 'string', enum: ['production', 'preview', 'development'], default: 'production' },
        auto_submit: { type: 'boolean', default: false, description: 'Automatically submit to Play Store after build completes' },
      },
    },
  },
  {
    name: 'eas_build_status',
    description: 'Check status of a specific EAS build by ID',
    inputSchema: {
      type: 'object',
      required: ['build_id'],
      properties: { build_id: { type: 'string' } },
    },
  },
  {
    name: 'eas_submit',
    description: 'Submit an existing build to Google Play Store (internal track)',
    inputSchema: {
      type: 'object',
      required: ['build_id'],
      properties: {
        build_id: { type: 'string' },
        track: { type: 'string', enum: ['internal', 'alpha', 'beta', 'production'], default: 'internal' },
      },
    },
  },
  {
    name: 'eas_account_status',
    description: 'Check EAS account login status and project info',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function callTool(name, args) {
  const token = getToken();
  if (!token && name !== 'eas_account_status') {
    return `❌ EXPO_TOKEN not set.\nGet token from: expo.dev → Account → Access Tokens → Create\nSave to: ${TOKEN_FILE}`;
  }

  switch (name) {
    case 'eas_account_status': {
      const hasToken = !!token;
      const hasKey = existsSync(SERVICE_KEY);
      let projectInfo = '';
      try {
        projectInfo = runEas('project:info --json 2>/dev/null || eas project:info');
      } catch { projectInfo = 'Unable to fetch project info'; }
      return [
        `EXPO_TOKEN: ${hasToken ? '✅ set' : '❌ missing — set in ' + TOKEN_FILE}`,
        `Play Service Account: ${hasKey ? '✅ found at ' + SERVICE_KEY : '❌ missing — save JSON key from Play Console'}`,
        `Project: ${projectInfo}`,
      ].join('\n');
    }

    case 'eas_build_list': {
      const limit = args?.limit ?? 5;
      return runEas(`build:list --platform android --limit ${limit} --non-interactive`, { timeout: 20000 });
    }

    case 'eas_build_start': {
      const profile = args?.profile ?? 'production';
      const submit = args?.auto_submit ? '--auto-submit' : '';
      if (!hasKey && submit) return '❌ Play Store service account key missing. Cannot auto-submit.';
      return runEas(`build --platform android --profile ${profile} --non-interactive ${submit}`, { timeout: 60000 });
    }

    case 'eas_build_status': {
      return runEas(`build:view ${args.build_id} --non-interactive`, { timeout: 15000 });
    }

    case 'eas_submit': {
      if (!existsSync(SERVICE_KEY)) {
        return `❌ Play Store service account key not found at ${SERVICE_KEY}\nDownload from: Play Console → Setup → API access → Service accounts → Create key (JSON)`;
      }
      const track = args?.track ?? 'internal';
      return runEas(`submit --platform android --id ${args.build_id} --non-interactive`, { timeout: 60000 });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

readline.on('line', async (line) => {
  let req;
  try { req = JSON.parse(line); } catch { return; }

  const { id, method, params } = req;

  if (method === 'initialize') {
    respond(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'eas-mcp', version: '1.0.0' },
    });
  } else if (method === 'tools/list') {
    respond(id, { tools: TOOLS });
  } else if (method === 'tools/call') {
    try {
      const result = await callTool(params?.name, params?.arguments ?? {});
      respond(id, { content: [{ type: 'text', text: String(result) }] });
    } catch (e) {
      respond(id, { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true });
    }
  } else if (method === 'ping') {
    respond(id, {});
  }
});

process.stderr.write('[eas-mcp] EAS MCP server ready\n');
