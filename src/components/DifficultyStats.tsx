import React, { useMemo } from "react";
import type { Difficulty, Item } from "../data/items";
import { DIFFICULTIES } from "../types/grid";
import Tooltip from "./Tooltip";
import { getDifficultyColor } from "../utils/difficultyColors";

type DifficultyStatsProps = {
	assigned: Record<string, string>;
	completed: Record<string, boolean>;
	itemsById: Record<string, Item>;
	difficultyCounts: Record<Difficulty, number>;
};

export default function DifficultyStats({ assigned, completed, itemsById, difficultyCounts }: DifficultyStatsProps) {
	const stats = useMemo(() => {
		return DIFFICULTIES.map((difficulty) => {
			const totalCount = difficultyCounts[difficulty] || 0;
			if (totalCount === 0) return null;

			// Count completed tasks and visible incomplete tasks of this difficulty
			let completedCount = 0;
			let incompleteVisibleCount = 0;
			Object.keys(assigned).forEach((key) => {
				const itemId = assigned[key];
				const item = itemsById[itemId];
				if (item?.difficulty === difficulty) {
					if (completed[key]) {
						completedCount++;
					} else {
						incompleteVisibleCount++;
					}
				}
			});

			// Calculate percentage: completed tasks / total tasks in that tier
			const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

			return {
				difficulty,
				totalCount,
				completedCount,
				incompleteVisibleCount,
				percentage,
				color: getDifficultyColor(difficulty),
			};
		}).filter(Boolean);
	}, [assigned, completed, itemsById, difficultyCounts]);

	return (
		<div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
			{stats.map((stat) => {
				if (!stat) return null;
				return (
					<Tooltip
						key={stat.difficulty}
						content={
							<div style={{ color: stat.color }}>
								<div className="tooltip-label">{stat.difficulty} Tier</div>
								<div className="tooltip-value" style={{ marginBottom: "8px" }}>
									{stat.completedCount} / {stat.totalCount} Completed
								</div>
								<div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "2px" }}>
									Incomplete on grid: {stat.incompleteVisibleCount}
								</div>
								<div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "6px" }}>
									Not yet visible: {stat.totalCount - stat.completedCount - stat.incompleteVisibleCount}
								</div>
								<div className="tooltip-progress-bar">
									<div
										className="tooltip-progress-fill"
										style={{ width: `${stat.percentage}%` }}
									/>
								</div>
							</div>
						}
					>
						<div
							className="small difficulty-stat"
							style={{
								color: stat.color,
								cursor: "help",
							}}
						>
							{stat.difficulty}: {stat.percentage}%
						</div>
					</Tooltip>
				);
			})}
		</div>
	);
}
