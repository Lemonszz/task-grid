import React, { useEffect, useState, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Item } from "../data/items";
import { getTileBackgroundColor } from "../utils/difficultyColors";
import { TILE_REVEAL_DURATION, TILE_CELEBRATION_DURATION, SLOT_CYCLE_INTERVAL } from "../utils/constants";

type Props = {
	x: number;
	y: number;
	size: number;
	isRevealed: boolean;
	isCompleted: boolean;
	isShrouded: boolean;
	isLocked: boolean;
	item?: Item | null;
	onClick: () => void;
	randomItems?: Item[]; // Random items for slot machine animation
	forceRevealAnimation?: boolean; // Force the slot machine animation to play
	disableCelebration?: boolean; // Disable the celebration animation after reveal
};

function Tile({
	x,
	y,
	size,
	isRevealed,
	isCompleted,
	isShrouded,
	isLocked,
	item,
	onClick,
	randomItems = [],
	forceRevealAnimation = false,
	disableCelebration = false
}: Props) {
	const [showRevealAnimation, setShowRevealAnimation] = useState(false);
	const [showCelebration, setShowCelebration] = useState(false);
	const [prevItemId, setPrevItemId] = useState<string | undefined>(item?.id);
	const [slotIndex, setSlotIndex] = useState(0);
	const [isInitialMount, setIsInitialMount] = useState(true);
	const [shuffledItems, setShuffledItems] = useState<Item[]>([]);
	const [hasPlayedAnimation, setHasPlayedAnimation] = useState(false);
	const slotIndexRef = useRef(0); // Use ref to track actual index
	const shuffledItemsRef = useRef<Item[]>([]); // Store shuffled items in ref too
	const animationFrameRef = useRef<number | null>(null);
	
	// Slot machine animation effect - separate from item tracking
	useEffect(() => {
		if (!showRevealAnimation || shuffledItemsRef.current.length === 0) return;
		
		console.log('🎬 Starting slot animation loop');
		const startTime = performance.now();
		let lastUpdateTime = startTime;
		slotIndexRef.current = 0;
		setSlotIndex(0);
		
		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const timeSinceLastUpdate = currentTime - lastUpdateTime;
			
			// Update index every SLOT_CYCLE_INTERVAL ms
			if (timeSinceLastUpdate >= SLOT_CYCLE_INTERVAL) {
				slotIndexRef.current++;
				setSlotIndex(slotIndexRef.current);
				lastUpdateTime = currentTime;
				const currentItem = shuffledItemsRef.current[slotIndexRef.current % shuffledItemsRef.current.length];
				console.log(`   🎲 Cycle ${slotIndexRef.current}: slotIndex=${slotIndexRef.current}, showing ${currentItem?.title}`);
			}
			
			// Continue animation until TILE_REVEAL_DURATION
			if (elapsed < TILE_REVEAL_DURATION) {
				animationFrameRef.current = requestAnimationFrame(animate);
			} else {
				console.log(`   ✅ Animation complete after ${slotIndexRef.current} cycles`);
				setShowRevealAnimation(false);
				animationFrameRef.current = null;
			}
		};
		
		animationFrameRef.current = requestAnimationFrame(animate);
		
		return () => {
			if (animationFrameRef.current !== null) {
				console.log('   ⚠️ Cleaning up animation frame');
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
		};
	}, [showRevealAnimation]);
	
	// Item tracking effect - triggers when item is revealed
	useEffect(() => {
		const currentItemId = item?.id;
		
		if (isInitialMount) {
			setPrevItemId(currentItemId);
			setIsInitialMount(false);
			return;
		}
		
		// Play animation when:
		// 1. Item is FIRST assigned (undefined -> defined) AND isRevealed, OR
		// 2. forceRevealAnimation is true and we haven't played it yet
		const shouldPlayAnimation = 
			(!prevItemId && currentItemId && isRevealed && !hasPlayedAnimation) ||
			(forceRevealAnimation && currentItemId && isRevealed && !hasPlayedAnimation);
		
		if (shouldPlayAnimation && randomItems.length > 0) {
			console.log('🎰 PREPARING SLOT MACHINE');
			console.log('   randomItems received:', randomItems.length);
			
			// Shuffle the items
			const shuffled = [...randomItems];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			
			console.log('   Shuffled items:', shuffled.map(i => i.title).join(', '));
			
			// Store in both state and ref
			setShuffledItems(shuffled);
			shuffledItemsRef.current = shuffled;
			setHasPlayedAnimation(true);
			
			// Trigger the animation loop (in the other useEffect)
			setShowRevealAnimation(true);
		}
		
		setPrevItemId(currentItemId);
	}, [item?.id, isRevealed, forceRevealAnimation, prevItemId, hasPlayedAnimation, randomItems]);
	
	const classes = ["tile"];
	if (isRevealed) classes.push("revealed");
	if (isShrouded) classes.push("shroud");
	
	const displayItem = showRevealAnimation && shuffledItems.length > 0
		? shuffledItems[slotIndex % shuffledItems.length]
		: item;
	
	// DEBUG: Log every render during slot animation
	if (showRevealAnimation && shuffledItems.length > 0) {
		console.log(`🎨 RENDER: slotIndex=${slotIndex}, displaying: ${displayItem?.title}`);
	}
	
	const backgroundColor = getTileBackgroundColor(displayItem?.difficulty, isRevealed);
	
	return (
		<motion.div
			className={classes.join(" ")}
			style={{
				width: size - 10,
				height: size - 10,
				overflow: "visible",
				position: "relative",
				background: backgroundColor,
				opacity: isCompleted ? 0.3 : 1,
			}}
			animate={isCompleted ? {
				scale: 0.67,
				zIndex: 1
			} : {
				scale: 1,
				zIndex: 1
			}}
			transition={{ type: "spring", stiffness: 500, damping: 30 }}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			>
			{isRevealed && displayItem ? (
				<>
					<div style={{
						position: "absolute",
						inset: "8px",
						border: "3px solid rgba(255,255,255,0.15)",
						overflow: "hidden",
						background: "rgba(0,0,0,0.3)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center"
					}}>
						{showRevealAnimation && shuffledItems.length > 0 ? (
							<>
								<motion.div
									key={`current-${slotIndex}`}
									initial={{ y: 0 }}
									animate={{ y: size * 0.8 }}
									transition={{ duration: SLOT_CYCLE_INTERVAL / 1000, ease: "linear" }}
									style={{ 
										width: "100%", 
										height: "100%",
										position: "absolute",
										top: 0,
										left: 0,
										display: "flex",
										alignItems: "center",
										justifyContent: "center"
									}}
								>
									<img 
										src={shuffledItems[slotIndex % shuffledItems.length].imageUrl} 
										alt={shuffledItems[slotIndex % shuffledItems.length].title}
										loading="eager"
										style={{ 
											width: "85%", 
											height: "85%", 
											objectFit: "contain",
											imageRendering: "pixelated"
										}} 
									/>
								</motion.div>
								<motion.div
									key={`next-${slotIndex}`}
									initial={{ y: -size * 0.8 }}
									animate={{ y: 0 }}
									transition={{ duration: SLOT_CYCLE_INTERVAL / 1000, ease: "linear" }}
									style={{ 
										width: "100%", 
										height: "100%",
										position: "absolute",
										top: 0,
										left: 0,
										display: "flex",
										alignItems: "center",
										justifyContent: "center"
									}}
								>
									<img 
										src={shuffledItems[(slotIndex + 1) % shuffledItems.length].imageUrl} 
										alt={shuffledItems[(slotIndex + 1) % shuffledItems.length].title}
										loading="eager"
										style={{ 
											width: "85%", 
											height: "85%", 
											objectFit: "contain",
											imageRendering: "pixelated"
										}} 
									/>
								</motion.div>
							</>
						) : (
							<motion.div
								style={{ 
									width: "85%", 
									height: "85%",
									position: "relative",
									display: "flex",
									alignItems: "center",
									justifyContent: "center"
								}}
							>
								<img 
									src={displayItem.imageUrl} 
									alt={displayItem.title} 
									loading="eager"
									decoding="async"
									style={{ 
										width: "100%", 
										height: "100%", 
										objectFit: "contain",
										imageRendering: "pixelated"
									}} 
								/>
							</motion.div>
						)}
					</div>
				</>
			) : null}
			
			{isCompleted && (
				<div style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					fontSize: "64px",
					fontWeight: "bold",
					color: "rgba(255, 255, 255, 0.9)",
					textShadow: "0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.5)",
					pointerEvents: "none",
					zIndex: 10
				}}>
					✓
				</div>
			)}
			
			{isLocked && !isCompleted && isRevealed && !showRevealAnimation && (
				<div style={{
					position: "absolute",
					top: "8px",
					right: "8px",
					fontSize: "24px",
					color: "rgba(255, 200, 50, 0.95)",
					textShadow: "0 0 10px rgba(0,0,0,0.9), 0 0 5px rgba(255,200,50,0.5)",
					pointerEvents: "none",
					zIndex: 10,
					filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
				}}>
					🔒
				</div>
			)}
		</motion.div>
	);
}

export default memo(Tile, (prevProps, nextProps) => {
	return (
		prevProps.x === nextProps.x &&
		prevProps.y === nextProps.y &&
		prevProps.size === nextProps.size &&
		prevProps.isRevealed === nextProps.isRevealed &&
		prevProps.isCompleted === nextProps.isCompleted &&
		prevProps.isShrouded === nextProps.isShrouded &&
		prevProps.isLocked === nextProps.isLocked &&
		prevProps.item?.id === nextProps.item?.id &&
		prevProps.randomItems?.length === nextProps.randomItems?.length
	);
});
