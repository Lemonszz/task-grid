import { openDB } from "idb";
import type { Item } from "../data/items";

const DB_NAME = "tile-grid-db";
const STORE = "app";

export type PersistState = {
	layoutSeed: string;
	assigned: Record<string, string>; // key: "x,y" => itemId
	completed: Record<string, boolean>;
	rerollPoints: number;
	overrides: Record<string, string>; // coordinate -> itemId (same as assigned but kept separate semantically)
};

const DEFAULT: PersistState = {
	layoutSeed: "default-seed",
	assigned: {},
	completed: {},
	rerollPoints: 0,
	overrides: {}
};

export async function getDB() {
	return openDB(DB_NAME, 1, {
		upgrade(db) {
			db.createObjectStore(STORE);
		}
	});
}

export async function loadState(): Promise<PersistState> {
	const db = await getDB();
	const s = (await db.get(STORE, "state")) as PersistState | undefined;
	return s ?? DEFAULT;
}

export async function saveState(state: PersistState) {
	const db = await getDB();
	await db.put(STORE, state, "state");
}

export async function exportStateJSON(): Promise<string> {
	const s = await loadState();
	return JSON.stringify(s);
}

export async function importStateJSON(json: string) {
	const parsed = JSON.parse(json) as PersistState;
	await saveState(parsed);
}
