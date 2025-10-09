import type { Item } from "../data/items";

/**
 * Preload images to improve perceived performance
 * Images are loaded in batches to avoid overwhelming the browser
 */
export class ImagePreloader {
	private cache = new Set<string>();
	private loading = new Set<string>();
	private batchSize = 20; // Load 20 images at a time
	
	/**
	 * Preload a single image
	 */
	preloadImage(url: string): Promise<void> {
		if (this.cache.has(url) || this.loading.has(url)) {
			return Promise.resolve();
		}
		
		this.loading.add(url);
		
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				this.cache.add(url);
				this.loading.delete(url);
				resolve();
			};
			img.onerror = () => {
				this.loading.delete(url);
				reject(new Error(`Failed to load image: ${url}`));
			};
			img.src = url;
		});
	}
	
	/**
	 * Preload multiple images in batches
	 * Returns a promise that resolves when all images are loaded (or failed)
	 */
	async preloadImages(urls: string[]): Promise<void> {
		const uniqueUrls = [...new Set(urls)].filter(url => !this.cache.has(url));
		
		// Process in batches to avoid overwhelming the browser
		for (let i = 0; i < uniqueUrls.length; i += this.batchSize) {
			const batch = uniqueUrls.slice(i, i + this.batchSize);
			await Promise.allSettled(batch.map(url => this.preloadImage(url)));
		}
	}
	
	/**
	 * Preload images from items array
	 */
	async preloadItemImages(items: Item[]): Promise<void> {
		const urls = items.map(item => item.imageUrl);
		await this.preloadImages(urls);
	}
	
	/**
	 * Check if an image is already cached
	 */
	isCached(url: string): boolean {
		return this.cache.has(url);
	}
	
	/**
	 * Clear the cache
	 */
	clearCache(): void {
		this.cache.clear();
	}
}

// Global singleton instance
export const imagePreloader = new ImagePreloader();
