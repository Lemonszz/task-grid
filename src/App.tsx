import React, { useRef } from "react";
import Grid, { type GridHandle } from "./components/Grid";
import StorageBanner from "./components/StorageBanner";

const VERSION = "0.1.0"; // Update this when making releases

export default function App() {
	const gridRef = useRef<GridHandle | null>(null);

	return (
		<div className="app">
			<div className="header">
				<div className="flex-row gap-12">
					<img src="https://oldschool.runescape.wiki/images/thumb/Collection_log_detail.png/260px-Collection_log_detail.png?70bda" style={{ width: 40, height: 40 }} alt="logo" />
					<h2 style={{ margin: 0 }}>Task Grid</h2>
				</div>
				<div className="flex-row gap-12">
					<button className="btn" onClick={() => gridRef.current?.openInfo()}>
						ℹ️ Info
					</button>
					<button className="btn" onClick={() => gridRef.current?.openSettings()}>
						⚙️ Settings
					</button>
					<button className="btn" onClick={() => gridRef.current?.exportSave()}>
						Export Save
					</button>
					<label className="btn">
						Import Save
						<input
							type="file"
							accept="application/json"
							style={{ display: "none" }}
							onChange={(e) => gridRef.current?.importSave(e.target.files?.[0] ?? null)}
						/>
					</label>
					<div className="badge">v{VERSION}</div>
				</div>
			</div>
			<Grid ref={gridRef} />
			<StorageBanner />
		</div>
	);
}
