import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Tile from "./components/Tile";
import { mulberry32, stringToSeed } from "./utils/prng";
import { getItems, setLoadedItems, type Item, type Difficulty } from "./data/items";
import { keyOf } from "./utils/gridHelpers";
import { useTileAssignment } from "./hooks/useTileAssignment";
import { loadItemsFromCSVPath } from "./utils/csvLoader";
import { TILE_SIZE, SLOT_ANIMATION_ITEMS_COUNT } from "./utils/constants";
import { imagePreloader } from "./utils/imagePreloader";

const GRID_SIZE = 25; // 25x25 grid centered around origin for more tiles
const INITIAL_ZOOM = 10; // Very zoomed in
const FINAL_ZOOM = 0.8; // Zoom out further
const ZOOM_DURATION = 10000; // 10 seconds
const REVEAL_STAGGER = 150; // Milliseconds between each tile reveal

export default function ZoomReveal() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [zoom, setZoom] = useState(INITIAL_ZOOM);
	const [isAnimating, setIsAnimating] = useState(false);
	const [hasAnimated, setHasAnimated] = useState(false);
	const [hideCursor, setHideCursor] = useState(true);
	
	const seed = "zoom-reveal-seed";
	const [assigned, setAssigned] = useState<Record<string, string>>({});
	const [completed] = useState<Record<string, boolean>>({});
	const [itemsById, setItemsById] = useState<Record<string, Item>>({});
	const [remainingIds, setRemainingIds] = useState<Set<string>>(new Set());
	const [passiveChance] = useState<number>(0.1);
	const [revealedTiles, setRevealedTiles] = useState<Set<string>>(new Set());
	const [forceAnimationTiles, setForceAnimationTiles] = useState<Set<string>>(new Set());
	const preAssignedItems = useRef<Record<string, string>>({});
	const tilesByDistance = useRef<Array<{x: number, y: number, distance: number, key: string, activationThreshold: number}>>([]);
	
	const uiRngRef = useRef<(() => number) | null>(null);
	const animationStartTime = useRef<number>(0);
	const animationFrameRef = useRef<number | null>(null);

	const difficultyCounts = useRef<Record<Difficulty, number>>({
		Beginner: 0,
		Easy: 0,
		Medium: 0,
		Hard: 0,
		Elite: 0,
		Master: 0,
		Passive: 0,
	});

	const { assignItemToTile, syncCaches, layoutRngRef } = useTileAssignment({
		seed,
		assigned,
		completed,
		remainingIds,
		itemsById,
		passiveChance,
		difficultyCounts: difficultyCounts.current,
		setAssigned,
		setRemainingIds,
	});

	// Load items
	useEffect(() => {
		const loadItems = async () => {
			try {
				const csvItems = await loadItemsFromCSVPath('/items.csv');
				if (csvItems.length > 0) {
					setLoadedItems(csvItems);
					console.log(`Loaded ${csvItems.length} items from CSV`);
				}
			} catch (error) {
				console.warn('Could not load items.csv, using sample items', error);
			}
			
			const items = getItems();
			const map: Record<string, Item> = {};
			const counts: Record<string, number> = {
				Beginner: 0,
				Easy: 0,
				Medium: 0,
				Hard: 0,
				Elite: 0,
				Master: 0,
				Passive: 0,
			};

			for (const it of items) {
				map[it.id] = it;
				counts[it.difficulty] = (counts[it.difficulty] || 0) + 1;
			}

			difficultyCounts.current = counts as Record<Difficulty, number>;
			setItemsById(map);
			setRemainingIds(new Set(items.map((it) => it.id)));
			
			// Preload all images
			imagePreloader.preloadItemImages(items).then(() => {
				console.log(`Preloaded ${items.length} task images`);
			}).catch(err => {
				console.warn('Some images failed to preload:', err);
			});
		};
		
		loadItems();
	}, []);

	// Initialize UI RNG
	useEffect(() => {
		uiRngRef.current = mulberry32(stringToSeed(seed + "_ui"));
	}, []);

	// Pre-assign all tiles in the grid and sort by distance from center
	useEffect(() => {
		if (Object.keys(itemsById).length === 0) return;
		if (Object.keys(preAssignedItems.current).length > 0) return; // Already pre-assigned
		
		const newAssigned: Record<string, string> = {};
		const halfSize = Math.floor(GRID_SIZE / 2);
		const tiles: Array<{x: number, y: number, distance: number, key: string, activationThreshold: number}> = [];
		
		// First, build the tiles array and calculate distances
		for (let x = -halfSize; x <= halfSize; x++) {
			for (let y = -halfSize; y <= halfSize; y++) {
				const k = keyOf(x, y);
				// Calculate distance from (-1, -1) instead of (0, 0)
				const dx = x - (-1);
				const dy = y - (-1);
				const distance = Math.sqrt(dx * dx + dy * dy);
				const randomOffset = (Math.random() - 0.5) * 2; // Random offset for variety
				
				// Random activation threshold between 0.1 and 0.95 (when during animation this tile activates)
				// Tile at (-1, -1) gets 0 so it activates immediately (1 up, 1 left from center)
				const activationThreshold = (x === -1 && y === -1) ? 0 : (0.1 + Math.random() * 0.85);
				
				tiles.push({ x, y, distance: distance + randomOffset, key: k, activationThreshold });
			}
		}
		
		// Sort tiles by distance from (-1, -1) BEFORE assigning items
		tiles.sort((a, b) => a.distance - b.distance);
		tilesByDistance.current = tiles;
		
		// Now assign items in the sorted order (center outward)
		for (const tile of tiles) {
			const itemId = assignItemToTile(tile.x, tile.y);
			if (itemId) {
				newAssigned[tile.key] = itemId;
			}
		}
		
		// Store assigned items in ref
		preAssignedItems.current = newAssigned;
		syncCaches(newAssigned);
	}, [itemsById, assignItemToTile, syncCaches]);

	// Progressive reveal during zoom animation - only reveal tiles in viewport AND past their activation threshold
	const updateRevealedTiles = useCallback((progress: number, currentZoom: number) => {
		const totalTiles = tilesByDistance.current.length;
		const tilesToReveal = Math.floor(totalTiles * progress);
		
		// Calculate viewport bounds based on current zoom
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		
		// Calculate how many tiles fit in the viewport at current zoom
		const tilesVisibleX = (viewportWidth / (TILE_SIZE * currentZoom)) / 2;
		const tilesVisibleY = (viewportHeight / (TILE_SIZE * currentZoom)) / 2 + 1; // +1 for better vertical coverage
		
		const newRevealed = new Set<string>();
		const newForceAnimation = new Set<string>();
		const newAssignments: Record<string, string> = {};
		
		// Reveal tiles from center outward based on progress
		for (let i = 0; i < tilesToReveal && i < totalTiles; i++) {
			const tile = tilesByDistance.current[i];
			
			// Check if tile is within viewport bounds
			const isInViewport = 
				Math.abs(tile.x) <= tilesVisibleX + 1 && // +1 for buffer
				Math.abs(tile.y) <= tilesVisibleY + 1;
			
			// Check if we've passed this tile's activation threshold
			const isPastActivationThreshold = progress >= tile.activationThreshold;
			
			if (isInViewport && isPastActivationThreshold) {
				newRevealed.add(tile.key);
				
				// If this tile doesn't have an assigned item yet, assign it now
				if (!assigned[tile.key]) {
					const itemId = preAssignedItems.current[tile.key];
					if (itemId) {
						newAssignments[tile.key] = itemId;
						newForceAnimation.add(tile.key);
					}
				}
			}
		}
		
		// Update state
		if (Object.keys(newAssignments).length > 0) {
			setAssigned(prev => ({ ...prev, ...newAssignments }));
			setForceAnimationTiles(prev => new Set([...prev, ...newForceAnimation]));
		}
		
		setRevealedTiles(newRevealed);
	}, [assigned]);

	// Zoom animation loop
	useEffect(() => {
		if (!isAnimating) return;
		
		const animate = () => {
			const currentTime = performance.now();
			const elapsed = currentTime - animationStartTime.current;
			const progress = Math.min(elapsed / ZOOM_DURATION, 1);
			
			// Smooth ease in-out using custom bezier-like curve
			// Starts fast, ends slow, no hitching
			const easeProgress = progress < 0.5
				? 4 * progress * progress * progress // Cubic ease in for first half
				: 1 - Math.pow(-2 * progress + 2, 3) / 2; // Cubic ease out for second half
			
			const currentZoom = INITIAL_ZOOM - (INITIAL_ZOOM - FINAL_ZOOM) * easeProgress;
			setZoom(currentZoom);
			updateRevealedTiles(progress, currentZoom);
			
			if (progress < 1) {
				animationFrameRef.current = requestAnimationFrame(animate);
			} else {
				setIsAnimating(false);
				setHasAnimated(true);
				setHideCursor(false);
			}
		};
		
		animationFrameRef.current = requestAnimationFrame(animate);
		
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [isAnimating, updateRevealedTiles]);

	// Start animation on spacebar press only
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.code === 'Space' && !isAnimating && !hasAnimated && Object.keys(itemsById).length > 0) {
				e.preventDefault();
				setIsAnimating(true);
				setHideCursor(true);
				setRevealedTiles(new Set());
				setForceAnimationTiles(new Set());
				setAssigned({});
				animationStartTime.current = performance.now();
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [isAnimating, hasAnimated, itemsById]);

	// Generate random items for slot machine animation
	const randomItems = useMemo(() => {
		if (Object.keys(itemsById).length === 0) return [];
		
		const allItems = Object.values(itemsById);
		// Shuffle using Fisher-Yates algorithm
		const shuffled = [...allItems];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		// Take enough items for the slot animation
		const items = shuffled.slice(0, Math.min(SLOT_ANIMATION_ITEMS_COUNT, shuffled.length));
		console.log('🎲 ZoomReveal: Generated random items for slot animation:', items.length);
		console.log('   Items:', items.map(i => i.title).join(', '));
		return items;
	}, [itemsById]);

	// Render the grid
	const halfSize = Math.floor(GRID_SIZE / 2);
	const tiles = [];
	
	for (let x = -halfSize; x <= halfSize; x++) {
		for (let y = -halfSize; y <= halfSize; y++) {
			const k = keyOf(x, y);
			const itemId = assigned[k];
			const item = itemId ? itemsById[itemId] : null;
			const isRevealed = revealedTiles.has(k);
			const isCompleted = completed[k] || false;
			const shouldForceAnimation = forceAnimationTiles.has(k);
			
			tiles.push(
				<Tile
					key={k}
					x={x}
					y={y}
					size={TILE_SIZE}
					isRevealed={isRevealed}
					isCompleted={isCompleted}
					isShrouded={!isRevealed} // Tiles are shrouded until revealed
					isLocked={false}
					item={item}
					onClick={() => {}}
					randomItems={randomItems}
					forceRevealAnimation={shouldForceAnimation}
					disableCelebration={true}
				/>
			);
		}
	}

	return (
		<div
			ref={containerRef}
			style={{
				width: '100vw',
				height: '100vh',
				overflow: 'hidden',
				backgroundColor: '#1a1a1a',
				cursor: hideCursor ? 'none' : 'default',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				position: 'relative',
			}}
		>
			<motion.div
				style={{
					position: 'relative',
					width: GRID_SIZE * TILE_SIZE,
					height: GRID_SIZE * TILE_SIZE,
				}}
				animate={{
					scale: zoom,
				}}
				transition={{
					duration: 0,
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: '50%',
						transform: 'translate(-50%, -50%)',
					}}
				>
					{tiles.map((tile, idx) => {
						const x = tile.props.x;
						const y = tile.props.y;
						
						return (
							<div
								key={tile.key}
								style={{
									position: 'absolute',
									left: x * TILE_SIZE + TILE_SIZE / 2,
									top: y * TILE_SIZE + TILE_SIZE / 2,
									width: TILE_SIZE,
									height: TILE_SIZE,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{tile}
							</div>
						);
					})}
				</div>
			</motion.div>
		</div>
	);
}
