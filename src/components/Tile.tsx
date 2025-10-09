import React, { useEffect, useState, memo } from "react";
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
	randomItems = []
}: Props) {
	const [showRevealAnimation, setShowRevealAnimation] = useState(false);
	const [showCelebration, setShowCelebration] = useState(false);
	const [prevItemId, setPrevItemId] = useState<string | undefined>(item?.id);
	const [slotIndex, setSlotIndex] = useState(0);
	const [isInitialMount, setIsInitialMount] = useState(true);
	const [shuffledItems, setShuffledItems] = useState<Item[]>([]);
	
	useEffect(() => {
		const currentItemId = item?.id;
		
		if (isInitialMount) {
			setPrevItemId(currentItemId);
			setIsInitialMount(false);
			return;
		}
		
		// Only play animation when item is FIRST assigned (undefined -> defined)
		// This happens when a tile is revealed for the first time
		if (!prevItemId && currentItemId && isRevealed) {
			const shuffled = [...randomItems];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			setShuffledItems(shuffled);
			
			setShowRevealAnimation(true);
			setSlotIndex(0);
			
			const interval = setInterval(() => {
				setSlotIndex(prev => prev + 1);
			}, SLOT_CYCLE_INTERVAL);
			
			const timer = setTimeout(() => {
				clearInterval(interval);
				setShowRevealAnimation(false);
				setShowCelebration(true);
				setTimeout(() => setShowCelebration(false), TILE_CELEBRATION_DURATION);
			}, TILE_REVEAL_DURATION);
			
			return () => {
				clearInterval(interval);
				clearTimeout(timer);
			};
		}
		
		setPrevItemId(currentItemId);
	}, [item?.id, isRevealed]);
	
	const classes = ["tile"];
	if (isRevealed) classes.push("revealed");
	if (isShrouded) classes.push("shroud");
	
	const displayItem = showRevealAnimation && shuffledItems.length > 0
		? shuffledItems[slotIndex % shuffledItems.length]
		: item;
	
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
			whileHover={{ 
				scale: isCompleted ? 0.67 : 1.03, 
				rotateZ: isRevealed && !showRevealAnimation && !isCompleted ? 2 : 0,
				zIndex: 50
			}}
			animate={showRevealAnimation ? {
				scale: [1, 1.25, 1.25, 1],
				rotateZ: [0, -8, 8, -8, 8, -6, 6, -4, 4, -2, 2, 0],
				zIndex: 100
			} : isCompleted ? {
				scale: 0.67,
				zIndex: 1
			} : {
				scale: 1,
				zIndex: 1
			}}
			transition={showRevealAnimation ? { 
				duration: TILE_REVEAL_DURATION / 1000,
				times: [0, 0.2, 0.8, 1],
				ease: "easeInOut" 
			} : { type: "spring", stiffness: 500, damping: 30 }}
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
									transition={{ duration: 0.1, ease: "linear" }}
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
									transition={{ duration: 0.1, ease: "linear" }}
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
								animate={showCelebration ? {
									scale: [1, 1.15, 1],
									rotateZ: [0, 5, -5, 0]
								} : { scale: 1, rotateZ: 0 }}
								transition={showCelebration ? { duration: 0.5, ease: "easeOut" } : {}}
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
