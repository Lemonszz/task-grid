import React from "react";

type Props = {
	showTaskRules: boolean;
	onClose: () => void;
};

export default function TaskRulesModal({ showTaskRules, onClose }: Props) {
	if (!showTaskRules) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
				<h2 style={{ marginTop: 0 }}>📋 Task-Specific Rules</h2>

				<div style={{ overflowY: 'auto', flex: 1, paddingRight: 8 }}>
					<div style={{ fontSize: "14px", lineHeight: "1.6", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
						<p style={{ marginTop: 0 }}>
							These are task-specific clarifications and exceptions to the general rules:
						</p>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Lumberjack Outfit</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>There is a specific passive task for the Lumberjack Outfit.</li>
							<li>You should not obtain the Lumberjack outfit for a Forestry task</li>
							<li>When you have unlocked the passive task, you can obtain it from any source</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Angler Outfit</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>There are several tasks for the Angler Outfit.</li>
							<li>You should not obtain the Angler outfit for an Aerial Fishing Task</li>
							<li>When you have unlocked an Angler Outfit task, you can obtain it from any source</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Black Pickaxe</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>The Black Pickaxe only counts towards the <strong>beginner</strong> treasure trails tasks</li>
							<li>It does not count as an easy treasure trails unique</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Uncut Onyx</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>There is a specific passive task for an Uncut Onyx.</li>
							<li>An Uncut Onyx will not count towards a unique in any collection log table it is part of</li>
							<li>Some Uncut Onyx sources do not complete the collection log slot, these do <strong>not</strong> count towards the task</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Draconic Visage</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>There is a specific task for a Draconic Visage.</li>
							<li>A Draconic Visage will not count towards a unique in any collection log table it is part of</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Pets</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>PvM pets do <strong>not</strong> count towards their bosse's collection log tasks</li>
							<li>Only Heron, Rock Golem, Braver, Baby Chinchompa, Giant Squirrel, Tangleroot, Rocky and Rift Guardian count towards skillings pets</li>
							<li>Quetzin is a Hunter Guild unique</li>
							<li>Chompy Chick is a Chompy Bird Hunting unique</li>
							<li>Herbi is a passive task</li>
							<li>Pet Penance Queen is a Barbarian Assault unique</li>
							<li>Lil' Creator is a Soul Wars unique</li>
							<li>Abbysal Protector, Tiny Tempor, Smolcano Pheonix are PvM pets</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Shared DT2 Uniques</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>There are several tasks related to shared DT2 uniques, seperate from their bosses</li>
							<li>The shared uniques do not count towards their respective bosses' collection log tasks</li>
							<li>If you get a shared drop while working on a boss task, it will not count towards that task, but will towards a future Shared DT2 Uniques task</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Other</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>Any other situation not listed here, you should assume <strong>does count</strong> towards any unique count</li>
							<li>These are either less rare items or they're not deemed important enough to matter</li>
							<li>If you notice a mistake or inconsistency, <a href="https://github.com/Lemonszz/task-grid/issues">please report it!</a></li>
							<li>If you make a mistake, don't worry just adjust future tasks to account for it.</li>
						</ul>
					</div>
				</div>

				<button className="btn" onClick={onClose} style={{ width: "100%", marginTop: 16 }}>
					Close
				</button>
			</div>
		</div>
	);
}
