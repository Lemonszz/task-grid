import React, { useState, useMemo } from "react";
import type { Difficulty, Item } from "../data/items";
import { DIFFICULTIES } from "../types/grid";
import { getDifficultyColor } from "../utils/difficultyColors";

type TaskListModalProps = {
	showTaskList: boolean;
	assigned: Record<string, string>;
	completed: Record<string, boolean>;
	itemsById: Record<string, Item>;
	onClose: () => void;
	onTaskClick?: (x: number, y: number) => void;
	isRevealed?: (x: number, y: number) => boolean;
};

export default function TaskListModal({
	showTaskList,
	assigned,
	completed,
	itemsById,
	onClose,
	onTaskClick,
	isRevealed,
}: TaskListModalProps) {
	const [selectedTier, setSelectedTier] = useState<Difficulty | "All">("All");

	// Group tasks by difficulty and calculate completion status
	const tasksByDifficulty = useMemo(() => {
		const groups: Record<Difficulty, { item: Item; isCompleted: boolean; isAssigned: boolean; coord?: string }[]> = {
			Beginner: [],
			Easy: [],
			Medium: [],
			Hard: [],
			Elite: [],
			Master: [],
			Passive: [],
		};

		// Create a reverse map from itemId to coordinates for completion checking
		const itemIdToCoord: Record<string, string> = {};
		Object.entries(assigned).forEach(([coord, itemId]) => {
			itemIdToCoord[itemId] = coord;
		});

		// Get ALL items from itemsById
		Object.values(itemsById).forEach((item) => {
			const coord = itemIdToCoord[item.id];
			const isAssigned = !!coord;
			const isCompleted = isAssigned && !!completed[coord];
			
			groups[item.difficulty].push({ 
				item, 
				isCompleted,
				isAssigned,
				coord: coord || undefined,
			});
		});

		// Sort each group by title
		Object.keys(groups).forEach((difficulty) => {
			groups[difficulty as Difficulty].sort((a, b) => 
				a.item.title.localeCompare(b.item.title)
			);
		});

		return groups;
	}, [assigned, completed, itemsById]);

	// Calculate stats for each tier
	const tierStats = useMemo(() => {
		const stats: Record<Difficulty, { total: number; completed: number }> = {
			Beginner: { total: 0, completed: 0 },
			Easy: { total: 0, completed: 0 },
			Medium: { total: 0, completed: 0 },
			Hard: { total: 0, completed: 0 },
			Elite: { total: 0, completed: 0 },
			Master: { total: 0, completed: 0 },
			Passive: { total: 0, completed: 0 },
		};

		Object.entries(tasksByDifficulty).forEach(([difficulty, tasks]) => {
			const diff = difficulty as Difficulty;
			stats[diff].total = tasks.length;
			stats[diff].completed = tasks.filter((t) => t.isCompleted).length;
		});

		return stats;
	}, [tasksByDifficulty]);

	// Get tasks to display based on selected tier
	const tasksToDisplay = useMemo(() => {
		if (selectedTier === "All") {
			// Show all tasks grouped by difficulty in order
			return DIFFICULTIES.flatMap((difficulty) => 
				tasksByDifficulty[difficulty].map((task) => ({ ...task, difficulty }))
			);
		} else {
			return tasksByDifficulty[selectedTier].map((task) => ({ ...task, difficulty: selectedTier }));
		}
	}, [selectedTier, tasksByDifficulty]);

	// Calculate overall stats
	const overallStats = useMemo(() => {
		let total = 0;
		let completed = 0;
		Object.values(tierStats).forEach((stat) => {
			total += stat.total;
			completed += stat.completed;
		});
		return { total, completed };
	}, [tierStats]);

	if (!showTaskList) return null;

	return (
		<div className="modal task-list-modal" onClick={(e) => e.stopPropagation()}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
				<h3 style={{ margin: 0 }}>Task List</h3>
				<button className="btn" onClick={onClose}>
					✕
				</button>
			</div>

			{/* Overall progress */}
			<div style={{ 
				marginBottom: 16, 
				padding: 14, 
				background: "linear-gradient(135deg, rgba(42,37,32,0.6), rgba(26,21,16,0.6))", 
				borderRadius: 6, 
				border: "2px solid rgba(139,105,20,0.3)" 
			}}>
				<div className="small" style={{ marginBottom: 6, fontWeight: 600, color: "var(--gold)", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
					Overall Progress: {overallStats.completed} / {overallStats.total} (
					{overallStats.total > 0 ? Math.round((overallStats.completed / overallStats.total) * 100) : 0}%)
				</div>
				<div className="progress-container">
					<div
						className="progress-bar"
						style={{
							width: `${overallStats.total > 0 ? (overallStats.completed / overallStats.total) * 100 : 0}%`,
						}}
					/>
				</div>
			</div>

			{/* Tier filter buttons */}
			<div style={{ marginBottom: 16 }}>
				<div className="small" style={{ marginBottom: 8 }}>Filter by Tier:</div>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
					<button
						className={`btn tier-filter ${selectedTier === "All" ? "active" : ""}`}
						onClick={() => setSelectedTier("All")}
						style={{ fontSize: 12, padding: "6px 10px" }}
					>
						All ({overallStats.total})
					</button>
					{DIFFICULTIES.map((difficulty) => {
						const stats = tierStats[difficulty];
						return (
							<button
								key={difficulty}
								className={`btn tier-filter ${selectedTier === difficulty ? "active" : ""}`}
								onClick={() => setSelectedTier(difficulty)}
								style={{
									fontSize: 12,
									padding: "6px 10px",
									borderLeft: `3px solid ${getDifficultyColor(difficulty)}`,
								}}
							>
								{difficulty} ({stats.completed}/{stats.total})
							</button>
						);
					})}
				</div>
			</div>

			{/* Task list */}
			<div className="task-list-container">
				{tasksToDisplay.length === 0 ? (
					<div className="small" style={{ textAlign: "center", padding: 32, opacity: 0.6 }}>
						No tasks found for this tier yet.
					</div>
				) : (
					<div>
						{DIFFICULTIES.map((difficulty) => {
							const tasks = tasksToDisplay.filter((t) => t.difficulty === difficulty);
							if (tasks.length === 0) return null;

							return (
								<div key={difficulty} style={{ marginBottom: 16 }}>
									{selectedTier === "All" && (
										<div
											style={{
												fontSize: 14,
												fontWeight: 600,
												marginBottom: 8,
												paddingBottom: 4,
												borderBottom: `2px solid ${getDifficultyColor(difficulty)}`,
												color: getDifficultyColor(difficulty),
											}}
										>
											{difficulty} ({tierStats[difficulty].completed}/{tierStats[difficulty].total})
										</div>
									)}
									{tasks.map((task, idx) => {
										// Parse coordinates from the coord string (e.g., "3,5")
										const coords = task.coord ? task.coord.split(',').map(Number) : null;
										const isTaskRevealed = coords && isRevealed ? isRevealed(coords[0], coords[1]) : false;
										const canClick = task.isAssigned && coords && onTaskClick && isTaskRevealed;
										
										return (
											<div
												key={`${task.item.id}-${idx}`}
												className="task-list-item"
												style={{
													display: "flex",
													alignItems: "center",
													padding: 8,
													marginBottom: 4,
													background: task.isCompleted
														? "rgba(74, 222, 128, 0.15)"
														: task.isAssigned
														? "rgba(255,255,255,0.05)"
														: "rgba(255,255,255,0.02)",
													borderRadius: 6,
													borderLeft: `3px solid ${getDifficultyColor(task.difficulty)}`,
													opacity: task.isAssigned ? 1 : 0.5,
													cursor: canClick ? "pointer" : "default",
													transition: "background 0.15s ease",
												}}
												onClick={() => {
													if (canClick && coords) {
														onTaskClick(coords[0], coords[1]);
														onClose();
													}
												}}
												onMouseEnter={(e) => {
													if (canClick) {
														e.currentTarget.style.background = task.isCompleted
															? "rgba(74, 222, 128, 0.25)"
															: "rgba(255,255,255,0.1)";
													}
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.background = task.isCompleted
														? "rgba(74, 222, 128, 0.15)"
														: task.isAssigned
														? "rgba(255,255,255,0.05)"
														: "rgba(255,255,255,0.02)";
												}}
											>
												<div
													style={{
														width: 20,
														height: 20,
														borderRadius: 4,
														border: "2px solid rgba(255,255,255,0.3)",
														marginRight: 10,
														background: task.isCompleted ? getDifficultyColor(task.difficulty) : "transparent",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														flexShrink: 0,
													}}
												>
													{task.isCompleted && <span style={{ fontSize: 12 }}>✓</span>}
												</div>
												<img 
													src={task.item.imageUrl} 
													alt="" 
													style={{ 
														width: 32, 
														height: 32, 
														borderRadius: 4, 
														marginRight: 10,
														imageRendering: "pixelated",
														objectFit: "contain",
														flexShrink: 0,
													}} 
												/>
												<div style={{ flex: 1, minWidth: 0 }}>
													<div style={{ 
														display: "flex", 
														alignItems: "center", 
														gap: 8,
														flexWrap: "wrap",
													}}>
														<span style={{ 
															fontSize: 13, 
															fontWeight: 500,
															opacity: task.isCompleted ? 0.7 : 1 
														}}>
															{task.item.title}
														</span>
														{!task.isAssigned && (
															<span style={{ fontSize: 11, opacity: 0.6, flexShrink: 0 }}>
																(Not yet visible)
															</span>
														)}
														{canClick && (
															<span style={{ fontSize: 11, opacity: 0.8, flexShrink: 0, color: "var(--gold)" }}>
																📍 Click to view
															</span>
														)}
													</div>
													<div style={{ 
														fontSize: 12, 
														opacity: 0.6,
														marginTop: 2,
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
													}}>
														{task.item.description}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
