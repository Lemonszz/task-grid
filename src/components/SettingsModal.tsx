import React from "react";
import type { Difficulty, Item } from "../data/items";
import { DIFFICULTIES } from "../types/grid";

type SettingsModalProps = {
	showSettings: boolean;
	newSeedInput: string;
	passiveChance: number;
	assigned: Record<string, string>;
	completed: Record<string, boolean>;
	itemsById: Record<string, Item>;
	difficultyCounts: Record<Difficulty, number>;
	onClose: () => void;
	onSeedInputChange: (value: string) => void;
	onPassiveChanceChange: (value: number) => void;
	onCreateNewGrid: (seed: string) => void;
	onRunSimulation: () => void;
	onCheckOrphanedItems: () => void;
};

export default function SettingsModal({
	showSettings,
	newSeedInput,
	passiveChance,
	assigned,
	completed,
	itemsById,
	difficultyCounts,
	onClose,
	onSeedInputChange,
	onPassiveChanceChange,
	onCreateNewGrid,
	onRunSimulation,
	onCheckOrphanedItems,
}: SettingsModalProps) {
	if (!showSettings) return null;

	const checkForDuplicates = () => {
		// Check for duplicate task assignments
		const taskCounts: Record<string, number> = {};
		Object.values(assigned).forEach((id) => {
			taskCounts[id] = (taskCounts[id] || 0) + 1;
		});
		const duplicates = Object.entries(taskCounts).filter(([id, count]) => count > 1);

		if (duplicates.length > 0) {
			console.log("Duplicate tasks found:", duplicates);
			alert(
				`Found ${duplicates.length} duplicate tasks!\n\n` +
					duplicates
						.slice(0, 5)
						.map(([id, count]) => `${itemsById[id]?.title || id}: ${count} times`)
						.join("\n") +
					(duplicates.length > 5 ? `\n...and ${duplicates.length - 5} more` : "")
			);
		} else {
			// Check completion percentages
			const stats: string[] = [];
			DIFFICULTIES.forEach((difficulty) => {
				const totalCount = difficultyCounts[difficulty] || 0;
				let completedCount = 0;
				Object.keys(assigned).forEach((key) => {
					const itemId = assigned[key];
					if (completed[key] && itemsById[itemId]?.difficulty === difficulty) {
						completedCount++;
					}
				});
				const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
				if (totalCount > 0) {
					stats.push(`${difficulty}: ${completedCount}/${totalCount} = ${percentage}%`);
				}
			});
			alert("No duplicates found! ✓\n\nCompletion stats:\n" + stats.join("\n"));
		}
	};

	return (
		<div className="modal" onClick={(e) => e.stopPropagation()}>
			<h3 style={{ margin: "0 0 16px 0" }}>Settings</h3>

			<div style={{ marginBottom: 16 }}>
				<label className="small" style={{ display: "block", marginBottom: 4 }}>
					New Seed:
				</label>
				<input
					className="seed-input"
					value={newSeedInput}
					onChange={(e) => onSeedInputChange(e.target.value)}
					placeholder="Enter seed for new grid"
				/>
			</div>

			<button
				className="btn full-width margin-bottom-16"
				onClick={() => {
					if (newSeedInput.trim()) {
						onCreateNewGrid(newSeedInput.trim());
					} else {
						alert("Please enter a seed");
					}
				}}
			>
				Create New Grid
			</button>

			<div className="margin-bottom-16">
				<label className="small" style={{ display: "block", marginBottom: 4 }}>
					Passive Chance:
				</label>
				<input
					type="range"
					min={0}
					max={0.5}
					step={0.01}
					value={passiveChance}
					onChange={(e) => onPassiveChanceChange(Number(e.target.value))}
					className="full-width"
				/>
				<div className="small">{Math.round(passiveChance * 100)}%</div>
			</div>

			<hr style={{ margin: "16px 0" }} />

			<div className="margin-bottom-16">
				<label className="small" style={{ display: "block", marginBottom: 4 }}>
					Testing:
				</label>
				<button
					className="btn full-width"
					onClick={() => {
						onClose();
						onRunSimulation();
					}}
					style={{ marginBottom: 8 }}
				>
					🤖 Run Auto-Complete Simulation
				</button>
				<button className="btn full-width" onClick={checkForDuplicates} style={{ marginBottom: 8 }}>
					🔍 Check for Duplicate Tasks
				</button>
				<button className="btn full-width" onClick={onCheckOrphanedItems}>
					🔧 Check for Orphaned Tasks
				</button>
				<div className="small" style={{ marginTop: 4, opacity: 0.7 }}>
					Validates task uniqueness and detects stuck tasks
				</div>
			</div>

			<button className="btn full-width" onClick={onClose}>
				Close
			</button>
		</div>
	);
}
