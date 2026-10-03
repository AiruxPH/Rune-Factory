import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())await scan(path);else if(/\.(js|mjs)$/.test(path)){const result=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});if(result.status)process.exit(result.status);}}}
await scan('src');await scan('test');console.log('JavaScript syntax checks passed');
