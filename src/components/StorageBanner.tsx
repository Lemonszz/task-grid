import React, { useState, useEffect } from "react";

export default function StorageBanner() {
	const [showBanner, setShowBanner] = useState(false);

	useEffect(() => {
		// Check if user has already acknowledged the banner
		const acknowledged = localStorage.getItem("storage-acknowledged");
		if (!acknowledged) {
			setShowBanner(true);
		}
	}, []);

	const handleAcknowledge = () => {
		localStorage.setItem("storage-acknowledged", "true");
		setShowBanner(false);
	};

	if (!showBanner) return null;

	return (
		<div
			style={{
				position: "fixed",
				bottom: 0,
				left: 0,
				right: 0,
				padding: "16px 24px",
				background: "rgba(30, 30, 30, 0.98)",
				backdropFilter: "blur(10px)",
				color: "#fff",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				gap: "16px",
				zIndex: 1000,
				boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.3)",
				borderTop: "1px solid rgba(255, 200, 50, 0.3)",
			}}
		>
			<div style={{ fontSize: "14px", lineHeight: "1.5" }}>
				📦 This app stores your progress data locally in your browser.{" "}
				<strong>No data is sent to external servers.</strong> Make sure to export your save regularly to back up your progress.
			</div>
			<div style={{ fontSize: "14px", lineHeight: "1.5" }}>
				Created using intellectual property belonging to Jagex Limited under the terms of Jagex's Fan Content Policy. This content is not endorsed by or affiliated with Jagex.
			</div>
			<button className="btn" onClick={handleAcknowledge} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
				Got it
			</button>
		</div>
	);
}
