import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
const repo='https://raw.githubusercontent.com/kgsanjay/gkwhizwheel/main/public/images/';
export default defineConfig({
  base:'/gkwhizwheel/',
  plugins:[react(),{name:'remap-laravel-public-images-for-pages',enforce:'pre',transform(code,id){
    if(!id.includes('/resources/js/')) return null;
    return {code:code.replaceAll('/images/',repo),map:null};
  }}],
  resolve:{alias:[{find:'@inertiajs/react',replacement:path.resolve(process.cwd(),'preview-src/inertia-shim.jsx')},{find:'@',replacement:path.resolve(process.cwd(),'resources/js')}]},
  build:{outDir:'preview-dist',assetsDir:'preview-bundle',emptyOutDir:true,rollupOptions:{input:path.resolve(process.cwd(),'preview-src/template.html')}},
});
