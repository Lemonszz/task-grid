import React, { useState, useRef, useEffect } from "react";

type TooltipProps = {
	children: React.ReactNode;
	content: React.ReactNode;
};

export default function Tooltip({ children, content }: TooltipProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const triggerRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);

	const updatePosition = (e: MouseEvent) => {
		if (!triggerRef.current || !tooltipRef.current) return;

		const triggerRect = triggerRef.current.getBoundingClientRect();
		const tooltipRect = tooltipRef.current.getBoundingClientRect();

		// Position tooltip above the element, centered
		let x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
		let y = triggerRect.top - tooltipRect.height - 8;

		// Ensure tooltip stays within viewport
		if (x < 8) x = 8;
		if (x + tooltipRect.width > window.innerWidth - 8) {
			x = window.innerWidth - tooltipRect.width - 8;
		}

		// If tooltip would go above viewport, show below instead
		if (y < 8) {
			y = triggerRect.bottom + 8;
		}

		setPosition({ x, y });
	};

	useEffect(() => {
		if (isVisible) {
			const handleMouseMove = (e: MouseEvent) => updatePosition(e);
			window.addEventListener("mousemove", handleMouseMove);
			return () => window.removeEventListener("mousemove", handleMouseMove);
		}
	}, [isVisible]);

	const handleMouseEnter = () => {
		setIsVisible(true);
		setTimeout(() => {
			if (triggerRef.current && tooltipRef.current) {
				updatePosition(new MouseEvent("mousemove"));
			}
		}, 0);
	};

	const handleMouseLeave = () => {
		setIsVisible(false);
	};

	return (
		<>
			<div
				ref={triggerRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				style={{ display: "inline-block" }}
			>
				{children}
			</div>
			{isVisible && (
				<div
					ref={tooltipRef}
					className="custom-tooltip"
					style={{
						position: "fixed",
						left: `${position.x}px`,
						top: `${position.y}px`,
						zIndex: 10000,
					}}
				>
					{content}
				</div>
			)}
		</>
	);
}
