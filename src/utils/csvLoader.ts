import type { Item, Difficulty } from "../data/items";

/**
 * Extract filename from a URL (e.g., "game_icon_abyssalsire.png" from URL)
 */
function extractFilenameFromUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;
		const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
		// Remove query parameters and decode URL encoding (e.g., %27 -> ')
		const filenameWithoutQuery = filename.split('?')[0];
		return decodeURIComponent(filenameWithoutQuery);
	} catch {
		// If URL parsing fails, just return the last part after /
		const parts = url.split('/');
		const filenameWithoutQuery = parts[parts.length - 1].split('?')[0];
		return decodeURIComponent(filenameWithoutQuery);
	}
}

/**
 * Check if an image URL should be replaced with a local version
 * If the image exists in /assets/taskicon/, use that instead of external URL
 */
function resolveImageUrl(imageUrl: string): string {
	// Check if it's already a local path
	if (imageUrl.startsWith('/') || imageUrl.startsWith('./')) {
		return imageUrl;
	}
	
	// Check if it's an external URL (http:// or https://)
	if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
		const filename = extractFilenameFromUrl(imageUrl);
		// Return the local path - the browser will attempt to load it
		// If it doesn't exist, it will fall back to the error handler
		return `/assets/taskicon/${filename}`;
	}
	
	// Return as-is if it's some other format
	return imageUrl;
}

/**
 * Parse CSV text into Item objects
 * Expected CSV format: title,description,difficulty,imageUrl
 * OR: id,title,description,difficulty,imageUrl (if you want to specify IDs)
 */
export function parseItemsFromCSV(csvText: string): Item[] {
	const lines = csvText.trim().split('\n');
	
	if (lines.length === 0) {
		return [];
	}
	
	// Check if header exists and determine if ID column is present
	const hasHeader = lines[0].toLowerCase().includes('title');
	const hasIdColumn = lines[0].toLowerCase().includes('id');
	const startIndex = hasHeader ? 1 : 0;
	
	const items: Item[] = [];
	
	for (let i = startIndex; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue; // Skip empty lines
		
		// Simple CSV parsing (handles basic cases)
		const parts = parseCSVLine(line);
		
		let id: string;
		let title: string;
		let description: string;
		let difficulty: string;
		let imageUrl: string;
		
		if (hasIdColumn) {
			// Format: id,title,description,difficulty,imageUrl
			if (parts.length < 5) {
				console.warn(`Skipping malformed CSV line ${i + 1}: ${line}`);
				continue;
			}
			[id, title, description, difficulty, imageUrl] = parts;
		} else {
			// Format: title,description,difficulty,imageUrl (auto-generate ID)
			if (parts.length < 4) {
				console.warn(`Skipping malformed CSV line ${i + 1}: ${line}`);
				continue;
			}
			[title, description, difficulty, imageUrl] = parts;
			// Auto-generate ID based on line number
			id = `item_${i}`;
		}
		
		// Validate difficulty
		const validDifficulties: Difficulty[] = [
			"Beginner", "Easy", "Medium", "Hard", "Elite", "Master", "Passive"
		];
		
		if (!validDifficulties.includes(difficulty.trim() as Difficulty)) {
			console.warn(`Invalid difficulty "${difficulty}" on line ${i + 1}, skipping`);
			continue;
		}
		
		items.push({
			id: id.trim(),
			title: title.trim(),
			description: description.trim(),
			difficulty: difficulty.trim() as Difficulty,
			imageUrl: resolveImageUrl(imageUrl.trim()),
		});
	}
	
	return items;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		
		if (char === '"') {
			// Handle escaped quotes ""
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++; // Skip next quote
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += char;
		}
	}
	
	result.push(current); // Add last field
	return result;
}

/**
 * Load items from a CSV file path (for bundled assets)
 */
export async function loadItemsFromCSVPath(path: string): Promise<Item[]> {
	try {
		const response = await fetch(path);
		if (!response.ok) {
			throw new Error(`Failed to load CSV: ${response.statusText}`);
		}
		const text = await response.text();
		return parseItemsFromCSV(text);
	} catch (error) {
		console.error('Error loading CSV file:', error);
		return [];
	}
}
