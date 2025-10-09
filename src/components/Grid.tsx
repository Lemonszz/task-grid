import React, { useEffect, useRef, useState, useCallback, useMemo, useImperativeHandle, forwardRef } from "react";
import Tile from "./Tile";
import TileModal from "./TileModal";
import DifficultyStats from "./DifficultyStats";
import SettingsModal from "./SettingsModal";
import TaskListModal from "./TaskListModal";
import InfoModal from "./InfoModal";
import { mulberry32, stringToSeed } from "../utils/prng";
import { getItems, setLoadedItems, type Item, type Difficulty } from "../data/items";
import { loadState, saveState, exportStateJSON, importStateJSON } from "../db/storage";
import { motion } from "framer-motion";
import { keyOf, parseKey } from "../utils/gridHelpers";
import { useViewport, usePanZoom } from "../hooks/useViewport";
import { useTileAssignment } from "../hooks/useTileAssignment";
import { useSimulation } from "../hooks/useSimulation";
import { loadItemsFromCSVPath } from "../utils/csvLoader";
import { TILE_SIZE, PAN_ANIMATION_DURATION, ZOOM_OUT_THRESHOLD, SLOT_ANIMATION_ITEMS_COUNT } from "../utils/constants";
import { imagePreloader } from "../utils/imagePreloader";

type Props = {
	tileSize?: number;
	initialSeed?: string;
};

export type GridHandle = {
	openSettings: () => void;
	openInfo: () => void;
	exportSave: () => void;
	importSave: (file: File | null) => void;
};

const Grid = forwardRef<GridHandle, Props>(({ tileSize = TILE_SIZE, initialSeed = "default-seed" }, ref) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);

	const [seed, setSeed] = useState<string>(initialSeed);
	const [stateLoaded, setStateLoaded] = useState(false);
	const [assigned, setAssigned] = useState<Record<string, string>>({});
	const [completed, setCompleted] = useState<Record<string, boolean>>({});
	const [rerollPoints, setRerollPoints] = useState<number>(0);
	const [openCoord, setOpenCoord] = useState<string | null>(null);
	const [itemsById, setItemsById] = useState<Record<string, Item>>({});
	const [remainingIds, setRemainingIds] = useState<Set<string>>(new Set());
	const [passiveChance, setPassiveChance] = useState<number>(0.1);

	const [showSettings, setShowSettings] = useState(false);
	const [newSeedInput, setNewSeedInput] = useState<string>("");

	const [showInfo, setShowInfo] = useState(false);

	const [showTaskList, setShowTaskList] = useState(false);

	const [cursor, setCursor] = useState({ x: 0, y: 0 });

	const uiRngRef = useRef<(() => number) | null>(null);

	const difficultyCounts = useRef<Record<Difficulty, number>>({
		Beginner: 0,
		Easy: 0,
		Medium: 0,
		Hard: 0,
		Elite: 0,
		Master: 0,
		Passive: 0,
	});

	const viewRange = useViewport({ containerRef, tileSize, zoom, offset, openCoord });
	const { hasDragged } = usePanZoom({ containerRef, openCoord, zoom, offset, setOffset, setZoom });
	const { assignItemToTile, rerollTile: rerollTileHook, syncCaches, resetCaches, layoutRngRef } = useTileAssignment({
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
			
			// Preload all images in the background for faster display
			imagePreloader.preloadItemImages(items).then(() => {
				console.log(`Preloaded ${items.length} task images`);
			}).catch(err => {
				console.warn('Some images failed to preload:', err);
			});
		};
		
		loadItems();
	}, []);

	useEffect(() => {
		(async () => {
			const state = await loadState();
			setSeed(state.layoutSeed ?? initialSeed);
			setAssigned(state.assigned ?? {});
			setCompleted(state.completed ?? {});
			setRerollPoints(state.rerollPoints ?? 0);

			const loadedAssigned = state.assigned ?? {};
			syncCaches(loadedAssigned);

			setStateLoaded(true);
		})();
	}, [initialSeed, syncCaches]);

	useEffect(() => {
		uiRngRef.current = mulberry32(stringToSeed(seed + "_ui"));
	}, [seed]);

	useEffect(() => {
		if (!stateLoaded) return;
		saveState({
			layoutSeed: seed,
			assigned,
			completed,
			rerollPoints,
			overrides: {},
		});
	}, [seed, assigned, completed, rerollPoints, stateLoaded]);

	const hasInitialized = useRef(false);
	useEffect(() => {
		if (!stateLoaded || hasInitialized.current) return;
		if (Object.keys(itemsById).length === 0) return;
		if (remainingIds.size === 0) return;

		const k = keyOf(0, 0);
		if (assigned[k]) {
			hasInitialized.current = true;
			return;
		}

		try {
			if (!layoutRngRef.current) {
				layoutRngRef.current = mulberry32(stringToSeed(seed));
			}
			const rng = layoutRngRef.current;

			const allIds = Array.from(remainingIds);
			const beginnerIds = allIds.filter((id) => {
				const item = itemsById[id];
				return item && item.difficulty === "Beginner";
			});

			if (beginnerIds.length > 0) {
				const sel = Math.floor(rng() * beginnerIds.length);
				const selectedId = beginnerIds[sel];

				setAssigned((prev) => ({ ...prev, [k]: selectedId }));
				setRemainingIds((prev) => {
					const copy = new Set(prev);
					copy.delete(selectedId);
					return copy;
				});

				hasInitialized.current = true;
			}
		} catch (error) {
			console.error("Error initializing tile (0,0):", error);
		}
	}, [stateLoaded, itemsById, remainingIds, assigned, seed]);

	// Determine if a tile is revealed: revealed if assigned exists OR if any orthogonal neighbor is completed
	const isRevealed = useCallback(
		(x: number, y: number): boolean => {
			const k = keyOf(x, y);
			if (assigned[k]) return true;
			// A tile is revealed if any orthogonal neighbor is completed
			const neigh = [keyOf(x + 1, y), keyOf(x - 1, y), keyOf(x, y + 1), keyOf(x, y - 1)];
			for (const n of neigh) if (completed[n]) return true;
			// center visible initially
			if (x === 0 && y === 0) return true;
			return false;
		},
		[assigned, completed]
	);

	const isShrouded = useCallback(
		(x: number, y: number): boolean => {
			if (isRevealed(x, y)) return false;
			const neigh = [keyOf(x + 1, y), keyOf(x - 1, y), keyOf(x, y + 1), keyOf(x, y - 1)];
			for (const n of neigh) if (assigned[n] || completed[n]) return true;
			return false;
		},
		[assigned, completed, isRevealed]
	);

	const isLocked = useCallback(
		(x: number, y: number): boolean => {
			const k = keyOf(x, y);
			const itemId = assigned[k];
			if (!itemId) return false;
			
			const item = itemsById[itemId];
			if (!item) return false;
			
			if (item.difficulty === "Passive") return false;
			
			const tierOrder: Difficulty[] = ["Beginner", "Easy", "Medium", "Hard", "Elite", "Master"];
			const currentTierIndex = tierOrder.indexOf(item.difficulty);
			
			if (currentTierIndex === -1) return false;
			
			for (const key in assigned) {
				const assignedItemId = assigned[key];
				const assignedItem = itemsById[assignedItemId];
				
				if (completed[key] || !assignedItem) continue;
				
				if (assignedItem.difficulty === "Passive") continue;
				
				const assignedTierIndex = tierOrder.indexOf(assignedItem.difficulty);
				
				if (assignedTierIndex !== -1 && assignedTierIndex < currentTierIndex) {
					return true;
				}
			}
			
			return false;
		},
		[assigned, completed, itemsById]
	);

	// Check for and fix orphaned items
	const checkAndFixOrphanedItems = useCallback(() => {
		const assignedIds = new Set(Object.values(assigned));
		const allItemIds = new Set(Object.keys(itemsById));
		
		const orphaned: string[] = [];
		allItemIds.forEach(id => {
			if (!assignedIds.has(id) && !remainingIds.has(id)) {
				orphaned.push(id);
			}
		});
		
		if (orphaned.length > 0) {
			const orphanedList = orphaned.map(id => `• ${itemsById[id]?.title} (${itemsById[id]?.difficulty})`).join('\n');
			const shouldFix = window.confirm(
				`Found ${orphaned.length} orphaned task${orphaned.length > 1 ? 's' : ''}!\n\n` +
				`${orphanedList}\n\n` +
				`These tasks are stuck - not assigned to any tile and not in the remaining pool.\n\n` +
				`Would you like to restore them to the remaining pool?`
			);
			
			if (shouldFix) {
				setRemainingIds(prev => {
					const copy = new Set(prev);
					orphaned.forEach(id => copy.add(id));
					return copy;
				});
				alert(`✓ Restored ${orphaned.length} orphaned task${orphaned.length > 1 ? 's' : ''} to the pool!`);
			}
		} else {
			alert('✓ No orphaned tasks found!\n\nAll tasks are properly assigned or in the remaining pool.');
		}
	}, [assigned, itemsById, remainingIds]);

	useEffect(() => {
		if (!stateLoaded) return;
		if (Object.keys(itemsById).length === 0) return;
		if (remainingIds.size === 0) return;

		const tilesToReveal: Array<{ x: number; y: number }> = [];
		for (let x = viewRange.xMin; x <= viewRange.xMax; x++) {
			for (let y = viewRange.yMin; y <= viewRange.yMax; y++) {
				const k = keyOf(x, y);
				if (isRevealed(x, y) && !assigned[k]) {
					tilesToReveal.push({ x, y });
				}
			}
		}

		if (tilesToReveal.length > 0) {
			tilesToReveal.forEach(({ x, y }) => {
				assignItemToTile(x, y);
			});
		}
	}, [completed, viewRange, stateLoaded, itemsById, remainingIds, isRevealed, assigned, assignItemToTile]);

	// open tile modal
	const openTileAt = useCallback(
		(x: number, y: number) => {
			const k = keyOf(x, y);
			// ensure assigned if revealed
			if (isRevealed(x, y) && !assigned[k]) {
				assignItemToTile(x, y);
			}
			setOpenCoord(k);
		},
		[isRevealed, assigned, assignItemToTile]
	);

	// unlock tile (complete)
	const unlockTile = useCallback(
		(x: number, y: number) => {
			const k = keyOf(x, y);
			if (!assigned[k]) {
				assignItemToTile(x, y);
			}
			setCompleted((prev) => {
				const updated = { ...prev, [k]: true };
				const id = assigned[k];
				if (id && itemsById[id]?.difficulty === "Passive") {
					setRerollPoints((r) => r + 1);
				}
				return updated;
			});
			setOpenCoord(null);
		},
		[assigned, itemsById, assignItemToTile]
	);

	// reroll a revealed but not completed tile
	const rerollTile = useCallback(
		(x: number, y: number) => {
			const success = rerollTileHook(x, y, completed, rerollPoints);
			if (success) {
				setRerollPoints((p) => p - 1);
			}
		},
		[rerollTileHook, completed, rerollPoints]
	);

	// Create new grid with new seed
	const createNewGrid = useCallback(
		(newSeed: string) => {
			if (!window.confirm("This will delete your current progress and start a new grid. Are you sure?")) {
				return;
			}
			// Reset all state
			setSeed(newSeed);
			setAssigned({});
			setCompleted({});
			setRerollPoints(0);
			setOpenCoord(null);
			setRemainingIds(new Set(getItems().map((it) => it.id)));
			setOffset({ x: 0, y: 0 });
			setShowSettings(false);

			// Reset synchronous caches and hasInitialized
			resetCaches();
			hasInitialized.current = false;
		},
		[resetCaches]
	);

	// Use simulation hook
	const { runSimulation } = useSimulation({ assigned, completed, unlockTile });

	// Keyboard nav
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowUp") setCursor((c) => ({ x: c.x, y: c.y - 1 }));
			if (e.key === "ArrowDown") setCursor((c) => ({ x: c.x, y: c.y + 1 }));
			if (e.key === "ArrowLeft") setCursor((c) => ({ x: c.x - 1, y: c.y }));
			if (e.key === "ArrowRight") setCursor((c) => ({ x: c.x + 1, y: c.y }));
			if (e.key === "Enter") {
				openTileAt(cursor.x, cursor.y);
			}
			if (e.key.toLowerCase() === "u") {
				unlockTile(cursor.x, cursor.y);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [cursor, openTileAt, unlockTile]);

	// UI helpers: compute tile render list (memoized)
	const tiles = useMemo(() => {
		const result: { x: number; y: number }[] = [];
		for (let x = viewRange.xMin; x <= viewRange.xMax; x++) {
			for (let y = viewRange.yMin; y <= viewRange.yMax; y++) {
				result.push({ x, y });
			}
		}
		return result;
	}, [viewRange]);

	// export/import functions
	const handleExport = useCallback(async () => {
		const json = await exportStateJSON();
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `tile_state_${seed}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}, [seed]);

	const handleImport = useCallback(
		async (file: File | null) => {
			if (!file) return;
			const text = await file.text();
			await importStateJSON(text);
			// reload state from DB
			const s = await loadState();
			setSeed(s.layoutSeed);
			setAssigned(s.assigned);
			setCompleted(s.completed);
			setRerollPoints(s.rerollPoints);

			// Sync the caches with imported state
			syncCaches(s.assigned);
		},
		[syncCaches]
	);

	// Pan viewport to a specific tile coordinate with smooth animation
	const panToTile = useCallback((x: number, y: number) => {
		const containerEl = containerRef.current;
		if (!containerEl) return;
		
		const screenCenterX = containerEl.clientWidth / 2;
		const screenCenterY = containerEl.clientHeight / 2;
		
		// If zoomed in too much, zoom out to 1.0 first for better overview
		const targetZoom = zoom > ZOOM_OUT_THRESHOLD ? 1.0 : zoom;
		
		const targetOffsetX = screenCenterX * (1 - targetZoom) - x * tileSize * targetZoom;
		const targetOffsetY = screenCenterY * (1 - targetZoom) - y * tileSize * targetZoom;
		
		// Animate the pan
		const startOffset = { ...offset };
		const startZoom = zoom;
		const duration = PAN_ANIMATION_DURATION; // ms
		const startTime = performance.now();
		
		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			
			// Easing function (ease-in-out)
			const eased = progress < 0.5
				? 2 * progress * progress
				: 1 - Math.pow(-2 * progress + 2, 2) / 2;
			
			// Interpolate offset
			const newOffsetX = startOffset.x + (targetOffsetX - startOffset.x) * eased;
			const newOffsetY = startOffset.y + (targetOffsetY - startOffset.y) * eased;
			const newZoom = startZoom + (targetZoom - startZoom) * eased;
			
			setOffset({ x: newOffsetX, y: newOffsetY });
			setZoom(newZoom);
			
			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		};
		
		requestAnimationFrame(animate);
	}, [offset, zoom, tileSize]);

	// Generate shuffled random items for slot machine animation
	// Memoized based on remainingIds to avoid regeneration on every render
	const randomItems = useMemo(() => {
		const items = Array.from(remainingIds).map((id) => itemsById[id]).filter(Boolean);
		// Shuffle using Fisher-Yates algorithm
		for (let i = items.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[items[i], items[j]] = [items[j], items[i]];
		}
		return items.slice(0, SLOT_ANIMATION_ITEMS_COUNT);
	}, [remainingIds, itemsById]);

	// Expose methods to parent component
	useImperativeHandle(ref, () => ({
		openSettings: () => setShowSettings(true),
		openInfo: () => setShowInfo(true),
		exportSave: handleExport,
		importSave: handleImport,
	}));

	return (
		<div style={{ height: "100%", position: "relative" }}>
			<div className="padding-10 flex-row gap-10 flex-wrap">
				{/* Difficulty completion stats */}
				<DifficultyStats
					assigned={assigned}
					completed={completed}
					itemsById={itemsById}
					difficultyCounts={difficultyCounts.current}
				/>

				<div className="flex-row gap-10 ml-auto">
					{/* Reroll Points Fancy Box */}
					<div className="reroll-box">
						<span className="reroll-icon">🎲</span>
						<span className="reroll-label">Reroll Points:</span>
						<span className="reroll-count">{rerollPoints}</span>
					</div>
					<button className="btn" onClick={() => setShowTaskList(true)}>
						📋 Task List
					</button>
				</div>
			</div>

			<div ref={containerRef} className="canvas">
				{/* transformed viewport */}
				<div
					className="viewport"
					style={{
						transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
						transformOrigin: "0 0",
					}}
					onClick={() => {
						// clicking background clears open
						setOpenCoord(null);
					}}
				>
					{/* Draw tiles in view */}
					<div
						style={{
							position: "absolute",
							left: `calc(50% - ${tileSize / 2}px)`,
							top: `calc(50% - ${tileSize / 2}px)`,
						}}
					>
						{tiles.map(({ x, y }) => {
							const px = x * tileSize;
							const py = y * tileSize;
							const k = keyOf(x, y);
							const revealed = isRevealed(x, y);
							const shrouded = isShrouded(x, y);
							const locked = isLocked(x, y);

							// Don't render tiles that are neither revealed nor shrouded
							if (!revealed && !shrouded) {
								return null;
							}

							const itemId = assigned[k];
							const item = itemId ? itemsById[itemId] : null;

							return (
								<div key={k} style={{ position: "absolute", left: px, top: py }}>
									<Tile
										x={x}
										y={y}
										size={tileSize}
										isRevealed={revealed}
										isCompleted={!!completed[k]}
										isShrouded={shrouded}
										isLocked={locked}
										item={item ?? undefined}
										randomItems={randomItems}
										onClick={() => {
											// Only open if revealed and has item
											if (revealed && item && !hasDragged.current) {
												openTileAt(x, y);
											}
										}}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Modal - outside canvas to avoid touch-action:none blocking */}
			{openCoord && (() => {
				const c = parseKey(openCoord);
				const k = openCoord;
				const id = assigned[k] ?? null;
				const item = id ? itemsById[id] : null;
				const locked = isLocked(c.x, c.y);
				
				return (
					<TileModal
						item={item}
						isLocked={locked}
						onComplete={() => unlockTile(c.x, c.y)}
						onReroll={() => {
							rerollTile(c.x, c.y);
							setOpenCoord(null);
						}}
						onClose={() => setOpenCoord(null)}
						onReveal={() => assignItemToTile(c.x, c.y)}
						rerollPoints={rerollPoints}
					/>
				);
			})()}

		{/* Settings Modal */}
		<SettingsModal
			showSettings={showSettings}
			newSeedInput={newSeedInput}
			passiveChance={passiveChance}
			assigned={assigned}
			completed={completed}
			itemsById={itemsById}
			difficultyCounts={difficultyCounts.current}
			onClose={() => setShowSettings(false)}
			onSeedInputChange={setNewSeedInput}
			onPassiveChanceChange={setPassiveChance}
			onCreateNewGrid={createNewGrid}
			onRunSimulation={runSimulation}
			onCheckOrphanedItems={checkAndFixOrphanedItems}
		/>			{/* Info Modal */}
			<InfoModal
				showInfo={showInfo}
				onClose={() => setShowInfo(false)}
			/>

			{/* Task List Modal */}
			<TaskListModal
				showTaskList={showTaskList}
				assigned={assigned}
				completed={completed}
				itemsById={itemsById}
				onClose={() => setShowTaskList(false)}
				onTaskClick={panToTile}
				isRevealed={isRevealed}
			/>
		</div>
	);
});

Grid.displayName = "Grid";

export default Grid;
