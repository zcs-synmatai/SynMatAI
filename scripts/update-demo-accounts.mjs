import { readFile, writeFile } from 'node:fs/promises';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const configDirectory = new URL('../config/', import.meta.url);
const config = JSON.parse(await readFile(new URL('prototype-auth.json', configDirectory), 'utf8'));
const accounts = [...(config.accounts ?? [])];
if (config.username !== undefined || config.password !== undefined) {
  accounts.unshift({ username:config.username, password:config.password });
}
if (!accounts.length || accounts.some(account => !account?.username?.trim() || !account.password) ||
    new Set(accounts.map(account => account.username)).size !== accounts.length) {
  throw new Error('Each demo account needs a unique username and a password');
}
const iterations = 600_000;
const sessionHours = Math.min(72, Math.max(1, Number(config.sessionHours) || 8));
const verifiers = accounts.map(({username, password}) => {
  const salt = randomBytes(16).toString('hex');
  const digest = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return { username, salt, digest };
});
await writeFile(new URL('demo-accounts.json', configDirectory), JSON.stringify({ iterations, sessionHours, accounts:verifiers }, null, 2) + '\n');
