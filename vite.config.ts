import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		headers: {
			// Cache images aggressively
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	},
	build: {
		// Optimize asset handling
		assetsInlineLimit: 0, // Don't inline images, keep them as separate files for better caching
	},
});