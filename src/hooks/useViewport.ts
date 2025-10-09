import { useState, useEffect, useRef } from "react";
import type { ViewRange } from "../types/grid";
import { VIEWPORT_BUFFER, DRAG_THRESHOLD } from "../utils/constants";

type ViewportProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	tileSize: number;
	zoom: number;
	offset: { x: number; y: number };
	openCoord: string | null;
};

export function useViewport({ containerRef, tileSize, zoom, offset, openCoord }: ViewportProps) {
	const [viewRange, setViewRange] = useState<ViewRange>({ xMin: -3, xMax: 3, yMin: -3, yMax: 3 });

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const resize = () => {
			const w = container.clientWidth,
				h = container.clientHeight;
			
			const leftTileX = (0 - offset.x - w/2) / (tileSize * zoom);
			const rightTileX = (w - offset.x - w/2) / (tileSize * zoom);
			const topTileY = (0 - offset.y - h/2) / (tileSize * zoom);
			const bottomTileY = (h - offset.y - h/2) / (tileSize * zoom);
			
			const buffer = VIEWPORT_BUFFER;
			
			setViewRange({
				xMin: Math.floor(leftTileX) - buffer,
				xMax: Math.ceil(rightTileX) + buffer,
				yMin: Math.floor(topTileY) - buffer,
				yMax: Math.ceil(bottomTileY) + buffer,
			});
		};
		resize();
		const obs = new ResizeObserver(resize);
		obs.observe(container);
		return () => obs.disconnect();
	}, [tileSize, offset, zoom, containerRef]);

	return viewRange;
}

type PanZoomProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	openCoord: string | null;
	zoom: number;
	offset: { x: number; y: number };
	setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
	setZoom: React.Dispatch<React.SetStateAction<number>>;
};

export function usePanZoom({ containerRef, openCoord, zoom, offset, setOffset, setZoom }: PanZoomProps) {
	const isPanning = useRef(false);
	const lastPan = useRef({ x: 0, y: 0 });
	const dragStartPos = useRef({ x: 0, y: 0 });
	const hasDragged = useRef(false);
	const pointerDownOnCanvas = useRef(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const onDown = (e: PointerEvent) => {
			const target = e.target as HTMLElement;
			if (openCoord || target.closest("button") || target.closest("input") || target.closest("label")) {
				return;
			}
			pointerDownOnCanvas.current = true;
			hasDragged.current = false;
			dragStartPos.current = { x: e.clientX, y: e.clientY };
			lastPan.current = { x: e.clientX, y: e.clientY };
		};
		const onMove = (e: PointerEvent) => {
			if (!pointerDownOnCanvas.current) return;

			const dx = e.clientX - lastPan.current.x;
			const dy = e.clientY - lastPan.current.y;

			const totalDx = Math.abs(e.clientX - dragStartPos.current.x);
			const totalDy = Math.abs(e.clientY - dragStartPos.current.y);
			if (totalDx > DRAG_THRESHOLD || totalDy > DRAG_THRESHOLD) {
				if (!hasDragged.current) {
					hasDragged.current = true;
					isPanning.current = true;
					container.setPointerCapture(e.pointerId);
				}
			}

			if (hasDragged.current) {
				lastPan.current = { x: e.clientX, y: e.clientY };
				setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
			}
		};
		const onUp = (e: PointerEvent) => {
			pointerDownOnCanvas.current = false;
			isPanning.current = false;
			if (hasDragged.current) {
				try {
					container.releasePointerCapture(e.pointerId);
				} catch {}
			}
		};
		container.addEventListener("pointerdown", onDown);
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		return () => {
			container.removeEventListener("pointerdown", onDown);
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
	}, [openCoord, containerRef, setOffset]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const onWheel = (e: WheelEvent) => {
			if (e.ctrlKey) return;
			e.preventDefault();
			
			const rect = container.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			
			const delta = -e.deltaY;
			const factor = delta > 0 ? 1.08 : 0.92;
			let newZoom = Math.min(2.4, Math.max(0.5, zoom * factor));
			
			const zoomRatio = newZoom / zoom;
			const newOffsetX = offset.x + (mouseX - offset.x) * (1 - zoomRatio);
			const newOffsetY = offset.y + (mouseY - offset.y) * (1 - zoomRatio);
			
			setZoom(newZoom);
			setOffset({ x: newOffsetX, y: newOffsetY });
		};
		container.addEventListener("wheel", onWheel, { passive: false });
		return () => container.removeEventListener("wheel", onWheel);
	}, [zoom, offset, containerRef, setZoom, setOffset]);

	return { hasDragged };
}
