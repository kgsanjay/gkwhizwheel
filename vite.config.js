import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Custom Vite plugin to convert JPEG/PNG marketing assets to WebP at build time
 * for everything under resources/images and public/images, keeping quality at 80%.
 */
function webpConverterPlugin(options = {}) {
    const quality = options.quality ?? 80;
    const targetDirs = options.dirs ?? ['resources/images', 'public/images'];

    const processDirectory = async (dir) => {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
                const ext = path.extname(entry.name);
                const webpPath = fullPath.slice(0, -ext.length) + '.webp';

                const srcStat = fs.statSync(fullPath);
                let shouldConvert = true;
                if (fs.existsSync(webpPath)) {
                    const webpStat = fs.statSync(webpPath);
                    if (webpStat.mtimeMs >= srcStat.mtimeMs) {
                        shouldConvert = false;
                    }
                }

                if (shouldConvert) {
                    await sharp(fullPath)
                        .webp({ quality })
                        .toFile(webpPath);
                }
            }
        }
    };

    return {
        name: 'vite-plugin-webp-converter',
        apply: 'build',
        async buildStart() {
            for (const dir of targetDirs) {
                await processDirectory(path.resolve(process.cwd(), dir));
            }
        },
    };
}

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        ViteImageOptimizer({
            test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
            includePublic: true,
            logStats: true,
            ansiColors: true,
            png: {
                quality: 80,
            },
            jpeg: {
                quality: 80,
            },
            jpg: {
                quality: 80,
            },
            webp: {
                lossless: false,
                quality: 80,
            },
        }),
        webpConverterPlugin({
            quality: 80,
            dirs: ['resources/images', 'public/images'],
        }),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-is|es-toolkit)[\\/]/.test(id)) {
                            return 'vendor-react';
                        }
                        if (/[\\/]node_modules[\\/](@mui|@emotion)[\\/]/.test(id)) {
                            return 'vendor-mui';
                        }
                        if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|@reduxjs[\\/]toolkit|reselect|immer|react-redux|decimal\.js-light)[\\/]/.test(id)) {
                            return 'vendor-charts';
                        }
                    }
                },
            },
        },
    },
});
