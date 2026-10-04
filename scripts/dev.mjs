#!/usr/bin/env node
import { spawn, execSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// Detect Python executable
function getPythonPath() {
  const isWin = process.platform === 'win32';
  const venvPythonWin = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
  const venvPythonBackendWin = path.join(backendDir, '.venv', 'Scripts', 'python.exe');
  const venvPythonUnix = path.join(rootDir, '.venv', 'bin', 'python');
  const venvPythonBackendUnix = path.join(backendDir, '.venv', 'bin', 'python');

  if (isWin) {
    if (fs.existsSync(venvPythonWin)) return venvPythonWin;
    if (fs.existsSync(venvPythonBackendWin)) return venvPythonBackendWin;
    return 'python';
  } else {
    if (fs.existsSync(venvPythonUnix)) return venvPythonUnix;
    if (fs.existsSync(venvPythonBackendUnix)) return venvPythonBackendUnix;
    return 'python3';
  }
}

// Detect Local Network (LAN) IP
function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal && alias.address !== '127.0.0.1') {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

const pythonBin = getPythonPath();
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const lanIp = getLanIp();

console.log('\x1b[32m%s\x1b[0m', '════════════════════════════════════════════════════════════════════');
console.log('\x1b[32m%s\x1b[0m', '   SHADOWSAFE 2.0 - DUAL-ENGINE SAFETY RUNNER (DEV ENVIRONMENT)');
console.log('\x1b[32m%s\x1b[0m', '════════════════════════════════════════════════════════════════════');
console.log(` > Python runtime:   \x1b[33m${pythonBin}\x1b[0m`);
console.log(` > Local Frontend:   \x1b[36mhttp://localhost:5173\x1b[0m`);
console.log(` > Mobile / LAN:     \x1b[36mhttp://${lanIp}:5173\x1b[0m`);
console.log(` > FastAPI Backend:  \x1b[34mhttp://localhost:8000\x1b[0m`);
console.log(` > OpenAPI Docs:     \x1b[34mhttp://localhost:8000/docs\x1b[0m`);
console.log('\x1b[90m%s\x1b[0m', '────────────────────────────────────────────────────────────────────');

// Helper to pipe child process output with prefixes
function prefixStream(stream, prefix, colorCode) {
  const rl = readline.createInterface({ input: stream });
  rl.on('line', (line) => {
    console.log(`${colorCode}${prefix}\x1b[0m ${line}`);
  });
}

// Spawn Backend
const backendProcess = spawn(
  pythonBin,
  ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
  { cwd: backendDir, stdio: ['inherit', 'pipe', 'pipe'], shell: process.platform === 'win32' }
);
prefixStream(backendProcess.stdout, '[backend] ', '\x1b[36m');
prefixStream(backendProcess.stderr, '[backend] ', '\x1b[36m');

// Spawn Frontend
const frontendProcess = spawn(
  npmCmd,
  ['run', 'dev', '--', '--host', '0.0.0.0'],
  { cwd: frontendDir, stdio: ['inherit', 'pipe', 'pipe'], shell: process.platform === 'win32' }
);
prefixStream(frontendProcess.stdout, '[frontend]', '\x1b[35m');
prefixStream(frontendProcess.stderr, '[frontend]', '\x1b[35m');

// Cleanup on exit
function shutdown() {
  console.log('\n\x1b[33mShutting down ShadowSafe 2.0 services...\x1b[0m');

  if (process.platform === 'win32') {
    if (backendProcess.pid) {
      try { execSync(`taskkill /F /T /PID ${backendProcess.pid} >nul 2>&1`); } catch (_) {}
    }
    if (frontendProcess.pid) {
      try { execSync(`taskkill /F /T /PID ${frontendProcess.pid} >nul 2>&1`); } catch (_) {}
    }
  } else {
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);
