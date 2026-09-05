import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[DealFlow360] Unhandled render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="error-boundary">
        <div className="error-boundary-inner">
          <div className="error-boundary-icon">⚠</div>
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred in this section. Your other data is safe.</p>
          {this.state.error && (
            <code className="error-boundary-detail">{this.state.error.message}</code>
          )}
          <button className="button button-primary" onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      </div>
    )
  }
}
