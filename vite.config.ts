import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        middlewareMode: false,
    },
    build: {
        assetsInlineLimit: 0,
        rollupOptions: {
            input: {
                main: './index.html',
                zoom: './zoom.html',
            },
            output: {
                assetFileNames: (assetInfo) => {
                    // Add cache busting for images in production
                    if (assetInfo.name?.match(/\.(png|jpe?g|gif|svg|webp)$/)) {
                        return 'assets/[name]-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                },
            },
        },
    },
    base: "/"
});