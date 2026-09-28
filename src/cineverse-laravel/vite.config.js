import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.ts'],
            refresh: true,
        }),
        vue(),
        tailwindcss(),
    ],
    resolve: {
        alias: [
            {
                find: '@/assets',
                replacement: fileURLToPath(new URL('./resources/js/cineverse/assets', import.meta.url)),
            },
            {
                find: '@/core',
                replacement: fileURLToPath(new URL('./resources/js/cineverse/core', import.meta.url)),
            },
            {
                find: '@/features',
                replacement: fileURLToPath(new URL('./resources/js/cineverse/features', import.meta.url)),
            },
            {
                find: '@/layouts',
                replacement: fileURLToPath(new URL('./resources/js/cineverse/layouts', import.meta.url)),
            },
            {
                find: '@/shared',
                replacement: fileURLToPath(new URL('./resources/js/cineverse/shared', import.meta.url)),
            },
            {
                find: '@/views',
                replacement: fileURLToPath(new URL('./resources/js/cineverse/views', import.meta.url)),
            },
            {
                find: '@',
                replacement: fileURLToPath(new URL('./resources/js', import.meta.url)),
            },
        ],
    },
});
