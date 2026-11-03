import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { projectRoot } from './dev-server.mjs';

const web = resolve(projectRoot, 'apps/web');
const output = resolve(projectRoot, 'dist');
// Only this project's fixed, generated dist directory can be cleaned.
if (relative(projectRoot, output) !== 'dist') throw new Error('Invalid build target');
await stat(resolve(web, 'index.html'));
await rm(output, { recursive:true, force:true });
await mkdir(output, { recursive:true });
await cp(resolve(web, 'index.html'), resolve(output, 'index.html'));
await cp(resolve(web, 'src'), resolve(output, 'src'), { recursive:true });
await cp(resolve(web, 'public'), output, { recursive:true });
console.log(`Built: ${output}`);
