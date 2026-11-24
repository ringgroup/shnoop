import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const root=process.cwd();
const skip=new Set(['node_modules','.git','.vercel','coverage']);
const rules=[
 ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
 ['GitHub credential',/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/],
 ['cloud key',/\bAKIA[A-Z0-9]{16}\b/],
 ['credentialed database URL',/postgres(?:ql)?:\/\/[^\s:/]+:[^\s@]+@/i],
 ['assigned credential literal',/(?:CLIENT_SECRET|API_KEY|ENCRYPTION_KEY|DATABASE_URL)\s*[:=]\s*["'](?!["']|fixture|test|YOUR|<|\$)[A-Za-z0-9_+\/=.-]{24,}["']/],
 ['JWT-shaped credential',/\beyJ[A-Za-z0-9_-]{12,}\.eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/]
];
let count=0;const findings=[];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){if(skip.has(entry.name))continue;const path=join(dir,entry.name);if(entry.isDirectory())walk(path);else if(entry.isFile()){count++;const text=readFileSync(path,'utf8');for(const [name,rule] of rules)if(rule.test(text))findings.push(`${relative(root,path)}: ${name}`);}}}
walk(root);
console.log(`Heuristic scan: ${count} files, ${findings.length} findings.`);
for(const item of findings)console.log(item);
console.log('Review synthetic fixtures and run a maintained scanner plus manual history/privacy review before release.');
process.exitCode=findings.length?1:0;
