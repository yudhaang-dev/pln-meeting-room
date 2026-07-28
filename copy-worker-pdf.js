// import fs from 'node:fs';
// import { createRequire } from 'node:module';
// import path from 'node:path';

// const require = createRequire(import.meta.url);
// const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
// const pdfWorkerPath = path.join(pdfjsDistPath, 'build', 'pdf.worker.mjs');

// // Menyalin file ke folder public bawaan Laravel
// fs.cpSync(pdfWorkerPath, './public/pdf.worker.mjs', { recursive: true });

// console.log('✅ Berhasil menyalin pdf.worker.mjs ke folder public Laravel!');

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
const pdfWorkerPath = path.join(pdfjsDistPath, 'build', 'pdf.worker.mjs');

fs.cpSync(pdfWorkerPath, './public/pdf.worker.mjs', { recursive: true });
