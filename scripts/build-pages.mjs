import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { projectRoot } from './dev-server.mjs';

await import('./build.mjs');

const output = resolve(projectRoot, 'dist');

async function rewrite(relativePath, replacements) {
  const file = resolve(output, relativePath);
  let content = await readFile(file, 'utf8');
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  await writeFile(file, content, 'utf8');
}

// GitHub project Pages are hosted below /SynMatAI/. Relative references keep
// the same build working at the repository subpath without changing hash routes.
await rewrite('index.html', [
  [/(href|src)="\/(src|assets)\//g, '$1="./$2/'],
]);

await rewrite('src/features/project-assets/model.js', [
  [/url:'\/assets\//g, "url:'./assets/"],
]);

// The archived V2 page is already inside archives/workflow-v2, so its assets
// should resolve from that directory rather than from the domain root.
await rewrite('archives/workflow-v2/index.html', [
  [/(href|src)="\/archives\/workflow-v2\//g, '$1="./'],
]);

await writeFile(resolve(output, '.nojekyll'), '', 'utf8');
console.log(`Built GitHub Pages artifact: ${output}`);
