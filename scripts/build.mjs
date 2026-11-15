process.env.NODE_ENV = 'production';
import { spawn } from 'node:child_process';

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
