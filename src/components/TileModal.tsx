import React from "react";
import type { Item } from "../data/items";

type TileModalProps = {
	item: Item | null;
	isLocked: boolean;
	onComplete: () => void;
	onReroll: () => void;
	onClose: () => void;
	onReveal: () => void;
	rerollPoints: number;
};

export default function TileModal({
	item,
	isLocked,
	onComplete,
	onReroll,
	onClose,
	onReveal,
	rerollPoints,
}: TileModalProps) {
	return (
		<div className="modal" onClick={(e) => e.stopPropagation()}>
			{item ? (
				<>
					<div className="flex-row gap-12">
						<img 
							src={item.imageUrl} 
							alt="" 
							loading="eager"
							decoding="async"
							style={{ 
								width: 96, 
								height: 96, 
								borderRadius: 8 
							}} 
							className="pixelated"
						/>
						<div>
							<h3 style={{ margin: 0 }}>{item.title}</h3>
							<div className="small">{item.description}</div>
							<div style={{ marginTop: 10 }} className="small">
								Difficulty: {item.difficulty}
							</div>
							{isLocked && (
								<div style={{ marginTop: 8, color: "#ffc832", fontSize: "12px" }}>
									🔒 This task is locked. Complete lower-tier tasks first.
								</div>
							)}
						</div>
					</div>
					<div style={{ marginTop: 12 }} className="flex-row gap-8">
						<button
							className="btn btn-complete"
							onClick={(e) => {
								e.stopPropagation();
								if (isLocked) {
									const confirmed = window.confirm(
										"This task is locked because you have incomplete lower-tier tasks visible on the grid.\n\n" +
										"Are you sure you want to complete this task anyway?"
									);
									if (!confirmed) return;
								}
								onComplete();
							}}
						>
							✓ Complete
						</button>
						<button
							className="btn"
							onClick={(e) => {
								e.stopPropagation();
								onReroll();
							}}
							disabled={rerollPoints <= 0}
						>
							Reroll (cost 1)
						</button>
						<button
							className="btn"
							onClick={(e) => {
								e.stopPropagation();
								onClose();
							}}
						>
							Close
						</button>
					</div>
				</>
			) : (
				<>
					<h3>Hidden tile</h3>
					<p className="small">This tile is not yet assigned. Click to assign & reveal.</p>
					<div className="flex-row gap-8">
						<button
							className="btn"
							onClick={() => {
								onReveal();
							}}
						>
							Reveal
						</button>
						<button className="btn" onClick={onClose}>
							Close
						</button>
					</div>
				</>
			)}
		</div>
	);
}
