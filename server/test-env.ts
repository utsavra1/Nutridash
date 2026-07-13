import { config } from 'dotenv';
import path from 'path';

const result = config({ path: path.join(process.cwd(), '.env') });
console.log('Dotenv result:', result);
console.log('Current directory:', process.cwd());
console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET);