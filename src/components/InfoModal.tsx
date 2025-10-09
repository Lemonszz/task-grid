import React, { useState } from "react";

type Props = {
	showInfo: boolean;
	onClose: () => void;
};

export default function InfoModal({ showInfo, onClose }: Props) {
	const [showWarning, setShowWarning] = useState(true);

	if (!showInfo) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
			
						{showWarning && (
							<div
								style={{
									marginBottom: 24,
									padding: 16,
									background: "linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(185, 28, 28, 0.15) 100%)",
									border: "2px solid rgba(220, 38, 38, 0.5)",
									borderRadius: 8,
									boxShadow: "0 0 20px rgba(220, 38, 38, 0.2)",
									position: "relative",
								}}
							>
								<button
									onClick={() => setShowWarning(false)}
									style={{
										position: "absolute",
										top: 8,
										right: 8,
										background: "transparent",
										border: "none",
										color: "#ff6b6b",
										fontSize: "20px",
										cursor: "pointer",
										padding: 4,
										lineHeight: 1,
										opacity: 0.7,
									}}
									onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
									onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
								>
									×
								</button>
								<h3 style={{ marginTop: 0, marginBottom: 12, color: "#ff6b6b", display: "flex", alignItems: "center", gap: 8 }}>
									⚠️ IMPORTANT READ ME
								</h3>
							<div style={{ fontSize: "14px", lineHeight: "1.6", color: "#ffcccc", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
								<p style={{ margin: "8px 0" }}>
									<strong>This app stores data locally in your browser.</strong> Clearing browser data will delete your progress.
								</p>
								<p style={{ margin: "8px 0" }}>
									<strong>Backing up your data is your responsibility.</strong> there is no data stored on a server.
								</p>
								<p style={{ margin: "8px 0" }}>
									Use the <strong>Export Save</strong> feature regularly to back up your progress to a file.
								</p>
								<p style={{ margin: "8px 0" }}>
									Creating a new grid with will <strong>permanently delete</strong> your current progress.
								</p>
								<p style={{ margin: "8px 0" }}>
									Using the testing features in the settings will <strong>permanently alter</strong> your current progress.
								</p>
							</div>
							</div>
						)}
			
				<h2 style={{ marginTop: 0 }}>ℹ️ Information</h2>

				<div style={{ overflowY: 'auto', flex: 1, paddingRight: 8 }}>
					{/* Rules Section */}
					<div style={{ marginBottom: 24 }}>
						<h3 style={{ marginTop: 0, marginBottom: 12, color: "#ffc832" }}>📜 Rules</h3>
						<div style={{ fontSize: "14px", lineHeight: "1.6", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
							<ul style={{ margin: 0, paddingLeft: 20 }}>
								<li>Work towards any visible, unlocked task</li>
								<li>Once complete, mark the task as complete, adjacent tasks will be revealed</li>
								<li>Tasks are locked if you have incomplete lower-tier tasks visible</li>
								<li>Passive tasks may be completed at any time. Complete Passive tasks to earn reroll points</li>
								<li>Do not complete any collection log slots that are not working towards your tasks</li>
								<li>The Farming skill can be trained regardless of task progress</li>
								<li>Quests/Miniquests can be completed if they work towards an unlocked task</li>
								<li>Achievement Diaries can be completed at any time, as long as any diary task involving a collection slot are already complete</li>
								<li>You may process bones/ashes for prayer xp as long as your gained them through working towards a task</li>
								<li>You may gather resources when a task requires it (e.g. Chopping logs, mining ores, fishing for food) but any method that may gain a collection log slot</li>
								<li>Rules are self-enforced, please play responsibly</li>
							</ul>
						</div>
					</div>


					{/* App Info Section */}
					<div style={{ marginBottom: 24 }}>
						<h3 style={{ marginTop: 0, marginBottom: 12, color: "#ffc832" }}>ℹ️ App Info</h3>

							<div style={{ fontSize: "14px", lineHeight: "1.6", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
								<p>This app is free and open source. View the code on <a href="https://github.com/Lemonszz/task-grid">GitHub</a>.</p>
								<p>Created using intellectual property belonging to Jagex Limited under the terms of Jagex's Fan Content Policy. This content is not endorsed by or affiliated with Jagex.</p>
							</div>
					</div>
				</div>

				<button className="btn" onClick={onClose} style={{ width: "100%", marginTop: 16 }}>
					Close
				</button>
			</div>
		</div>
	);
}
