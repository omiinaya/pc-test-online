
/**
 * Utility script to kill processes running on specified ports
 * Usage: node scripts/kill-ports.js [port1] [port2] ...
 */

const { execSync } = require('child_process');
const { platform } = require('os');

const ports = process.argv.slice(2).map(port => parseInt(port));

if (ports.length === 0) {
  console.log('Usage: node scripts/kill-ports.js [port1] [port2] ...');
  throw new Error('No ports specified');
}

function killPort(port) {
  try {
    if (platform() === 'win32') {
      // Windows command
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = result.split('\n').filter(line => line.includes(`:${port}`));
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          console.log(`Killing process on port ${port} with PID ${pid}`);
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
        }
      });
    } else {
      // Unix/Linux/Mac command
      const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
      const pids = result.trim().split('\n').filter(pid => pid);
      
      pids.forEach(pid => {
        console.log(`Killing process on port ${port} with PID ${pid}`);
        execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
      });
    }
    console.log(`Port ${port} is now free`);
  } catch (error) {
    if (error.status === 1) {
      console.log(`No processes found on port ${port}`);
    } else {
      console.error(`Error killing processes on port ${port}:`, error.message);
    }
  }
}

console.log('Clearing ports before starting development servers...');
ports.forEach(killPort);
console.log('Port clearing completed');