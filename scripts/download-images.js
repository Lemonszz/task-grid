import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the CSV file
const CSV_PATH = join(__dirname, '../public/items.csv');
// Directory to save images
const IMAGE_DIR = join(__dirname, '../public/assets/taskicon');

/**
 * Parse a CSV line, handling quoted fields
 */
function parseCSVLine(line) {
	const result = [];
	let current = '';
	let inQuotes = false;
	
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
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
	
	result.push(current);
	return result;
}

/**
 * Extract filename from URL
 */
function extractFilenameFromUrl(url) {
	try {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;
		const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
		// Remove query parameters and decode URL encoding (e.g., %27 -> ')
		const filenameWithoutQuery = filename.split('?')[0];
		return decodeURIComponent(filenameWithoutQuery);
	} catch {
		const parts = url.split('/');
		const filenameWithoutQuery = parts[parts.length - 1].split('?')[0];
		return decodeURIComponent(filenameWithoutQuery);
	}
}

/**
 * Download a file from a URL
 */
function downloadFile(url, dest) {
	return new Promise((resolve, reject) => {
		const protocol = url.startsWith('https') ? https : http;
		
		// Add proper headers to avoid 403 errors
		const options = {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
				'Referer': new URL(url).origin
			}
		};
		
		protocol.get(url, options, (response) => {
			if (response.statusCode === 301 || response.statusCode === 302) {
				// Handle redirects
				downloadFile(response.headers.location, dest)
					.then(resolve)
					.catch(reject);
				return;
			}
			
			if (response.statusCode !== 200) {
				reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
				return;
			}
			
			const chunks = [];
			response.on('data', (chunk) => chunks.push(chunk));
			response.on('end', async () => {
				try {
					// Only write the file if we successfully received all data
					const buffer = Buffer.concat(chunks);
					
					// Validate we actually got some data
					if (buffer.length === 0) {
						reject(new Error('Downloaded file is empty'));
						return;
					}
					
					await fs.writeFile(dest, buffer);
					resolve();
				} catch (err) {
					// Clean up partial file if write fails
					try {
						await fs.unlink(dest);
					} catch (unlinkErr) {
						// Ignore unlink errors (file might not exist)
					}
					reject(err);
				}
			});
			
			response.on('error', (err) => {
				reject(err);
			});
		}).on('error', (err) => {
			reject(err);
		});
	});
}

/**
 * Main function to download images from CSV
 */
async function main() {
	try {
		console.log('Reading CSV file...');
		const csvContent = await fs.readFile(CSV_PATH, 'utf-8');
		const lines = csvContent.trim().split('\n');
		
		// Check if header exists
		const hasHeader = lines[0].toLowerCase().includes('title');
		const hasIdColumn = lines[0].toLowerCase().includes('id');
		const startIndex = hasHeader ? 1 : 0;
		
		// Ensure image directory exists
		await fs.mkdir(IMAGE_DIR, { recursive: true });
		console.log(`Image directory ready: ${IMAGE_DIR}`);
		
		// Track unique URLs to avoid downloading duplicates
		const urlsToDownload = new Map(); // filename -> url
		
		// Parse CSV and collect unique image URLs
		for (let i = startIndex; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;
			
			const parts = parseCSVLine(line);
			let imageUrl;
			
			if (hasIdColumn) {
				if (parts.length < 5) continue;
				imageUrl = parts[4].trim();
			} else {
				if (parts.length < 4) continue;
				imageUrl = parts[3].trim();
			}
			
			// Only process external URLs
			if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
				const filename = extractFilenameFromUrl(imageUrl);
				if (!urlsToDownload.has(filename)) {
					urlsToDownload.set(filename, imageUrl);
				}
			}
		}
		
		console.log(`Found ${urlsToDownload.size} unique images to download`);
		
		// Download images
		let downloaded = 0;
		let skipped = 0;
		let failed = 0;
		
		for (const [filename, url] of urlsToDownload) {
			const destPath = join(IMAGE_DIR, filename);
			
			// Check if file already exists
			try {
				await fs.access(destPath);
				console.log(`⏭️  Skipped (already exists): ${filename}`);
				skipped++;
				continue;
			} catch {
				// File doesn't exist, proceed with download
			}
			
			try {
				console.log(`⬇️  Downloading: ${filename}`);
				await downloadFile(url, destPath);
				console.log(`✅ Downloaded: ${filename}`);
				downloaded++;
				
				// Add a small delay to avoid overwhelming the server
				await new Promise(resolve => setTimeout(resolve, 100));
			} catch (error) {
				console.error(`❌ Failed to download ${filename}: ${error.message}`);
				failed++;
				
				// Ensure no partial/empty file exists after failure
				try {
					await fs.unlink(destPath);
				} catch (unlinkErr) {
					// Ignore if file doesn't exist
				}
			}
		}
		
		console.log('\n=== Download Summary ===');
		console.log(`✅ Downloaded: ${downloaded}`);
		console.log(`⏭️  Skipped: ${skipped}`);
		console.log(`❌ Failed: ${failed}`);
		console.log(`📁 Total unique images: ${urlsToDownload.size}`);
		
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
}

main();
