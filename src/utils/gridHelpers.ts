import type { Coord } from "../types/grid";

export function keyOf(x: number, y: number): string {
	return `${x},${y}`;
}

export function parseKey(k: string): Coord {
	const [x, y] = k.split(",").map(Number);
	return { x, y };
}

export function manhattan(x: number, y: number): number {
	return Math.abs(x) + Math.abs(y);
}
