import fs from 'node:fs';
import path from 'node:path';
export const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const readDialog = (name) => fs.readFileSync(path.join(root, 'data/dialogs', name + '.txt'), 'utf8');
export const dialogNames = () => fs.readdirSync(path.join(root, 'data/dialogs')).filter((f) => f.endsWith('.txt')).map((f) => f.replace(/\.txt$/, ''));
