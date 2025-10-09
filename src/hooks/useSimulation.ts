import { useRef, useEffect } from "react";
import { parseKey } from "../utils/gridHelpers";

type SimulationProps = {
	assigned: Record<string, string>;
	completed: Record<string, boolean>;
	unlockTile: (x: number, y: number) => void;
};

export function useSimulation({ assigned, completed, unlockTile }: SimulationProps) {
	const isSimulatingRef = useRef(false);

	useEffect(() => {
		if (!isSimulatingRef.current) return;

		// Get all current assigned tiles that aren't completed yet
		const tilesToComplete: string[] = [];

		Object.keys(assigned).forEach((key) => {
			if (!completed[key]) {
				tilesToComplete.push(key);
			}
		});

		if (tilesToComplete.length === 0) {
			isSimulatingRef.current = false;
			console.log(`Simulation complete! Completed ${Object.keys(completed).length} tiles.`);
			alert(`Simulation complete! Completed ${Object.keys(completed).length} tiles.`);
			return;
		}

		// Complete the first tile after a delay
		const timer = setTimeout(() => {
			if (tilesToComplete.length > 0 && isSimulatingRef.current) {
				const key = tilesToComplete[0];
				const coord = parseKey(key);
				unlockTile(coord.x, coord.y);
			}
		}, 100);

		return () => clearTimeout(timer);
	}, [assigned, completed, unlockTile]);

	const runSimulation = () => {
		if (!window.confirm("This will automatically complete all revealed tiles. Continue?")) {
			return;
		}

		isSimulatingRef.current = true;
		// Trigger the useEffect by updating a state
		// The useEffect will handle the recursive completion
	};

	return { runSimulation };
}
