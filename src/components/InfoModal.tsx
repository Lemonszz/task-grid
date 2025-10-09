import React, { useState } from "react";

type Props = {
	showInfo: boolean;
	onClose: () => void;
	onOpenTaskRules: () => void;
};

export default function InfoModal({ showInfo, onClose, onOpenTaskRules }: Props) {
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
<div style={{ overflowY: 'auto', flex: 1, paddingRight: 8 }}>
					<div style={{ fontSize: "14px", lineHeight: "1.6", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
						<p style={{ marginTop: 0 }}>
							These are task-specific clarifications and exceptions to the general rules:
						</p>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Collection Log Tasks</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>You may only work towards collection log slots that are part of your active tasks</li>
							<li>Completing any other collection log slots is not allowed</li>
							<li>If a task requires multiple slots from the same activity, you may complete them in any order</li>
							<li>A small number of tasks/items have specific rules, check out the button below</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Resource Gathering</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>You may gather resources needed for a task (e.g., logs, ores, fish for food)</li>
							<li>Avoid methods that could grant unintended collection log slots</li>
							<li>Farming can be trained freely regardless of task progress</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Combat & Prayer</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>You may only kill monsters if working towards a task related to that monster</li>
							<li>You can train combat if your tasks requires you to kill an enemy you can't defeat at your level</li>
							<li>Bones/ashes can be processed for Prayer XP if obtained while working towards a task</li>
							<li>Slayer tasks can be completed if they work towards your unlocked tasks</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Quests & Diaries</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>Quests and miniquests can be completed if they work towards an unlocked task</li>
							<li>Achievement Diaries can be completed at any time</li>
							<li>Diary tasks involving collection log slots must have those slots already completed</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Passive Tasks</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>Passive tasks can be completed at any time</li>
							<li>Completing passive tasks grants reroll points</li>
							<li>Use reroll points to reroll unwanted tasks</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>Task Locking</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>Tasks are locked if you have incomplete lower-tier tasks visible</li>
							<li>Complete lower-tier tasks first to unlock higher-tier adjacent tasks</li>
							<li>Multiple tasks of the same tier can be worked on simultaneously</li>
						</ul>

						<h3 style={{ marginTop: 16, marginBottom: 8, color: "#ffc832" }}>General Notes</h3>
						<ul style={{ margin: "0 0 16px 0", paddingLeft: 20 }}>
							<li>Rules are self-enforced - play responsibly and have fun!</li>
							<li>When in doubt, avoid completing collection log slots that aren't task objectives</li>
							<li>You can always mark a task complete and reveal new tasks once finished</li>
						</ul>
					</div>
				</div>
						<button 
							className="btn" 
							onClick={onOpenTaskRules}
							style={{ marginTop: 12, width: "100%" }}
						>
							📋 View Task-Specific Rules
						</button>
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
