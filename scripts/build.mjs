import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
await build({entryPoints:['src/app.jsx'],bundle:true,minify:true,sourcemap:true,outfile:'dist/app.js',format:'esm',target:['safari16','chrome100'],define:{'process.env.NODE_ENV':'"production"'}});
execFileSync(process.execPath,['node_modules/tailwindcss/lib/cli.js','-i','src/style.css','-o','dist/styles.css','--minify'],{stdio:'inherit'});
