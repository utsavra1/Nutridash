import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
console.log('Checking file at:', envPath);
console.log('File exists?', fs.existsSync(envPath));
console.log('File stats:', fs.statSync(envPath));
console.log('File contents:', fs.readFileSync(envPath, 'utf8'));