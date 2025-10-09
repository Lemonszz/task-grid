import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing due to component errors
 */
class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="modal" style={{ 
					position: "fixed", 
					top: "50%", 
					left: "50%", 
					transform: "translate(-50%, -50%)",
					maxWidth: "500px",
					zIndex: 1000
				}}>
					<h3 style={{ margin: "0 0 16px 0", color: "#ff6464" }}>⚠️ Something went wrong</h3>
					<p className="small" style={{ marginBottom: 16 }}>
						An error occurred while rendering this component. Please try refreshing the page.
					</p>
					{this.state.error && (
						<details style={{ marginBottom: 16 }}>
							<summary style={{ cursor: "pointer", marginBottom: 8 }}>Error details</summary>
							<pre style={{ 
								fontSize: 11, 
								padding: 8, 
								background: "rgba(0,0,0,0.3)", 
								borderRadius: 4,
								overflow: "auto",
								maxHeight: 200
							}}>
								{this.state.error.toString()}
								{this.state.error.stack}
							</pre>
						</details>
					)}
					<button 
						className="btn" 
						onClick={() => window.location.reload()}
						style={{ width: "100%" }}
					>
						Reload Page
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
