import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Render error:', error, info.componentStack)
    // Log to diagnostic system (dynamic import avoids circular deps)
    import('../lib/devlog').then(({ devlog }) => {
      devlog.error('ReactCrash', error.message, undefined, error.stack?.slice(0, 500), {
        component: info.componentStack?.split('\n')[1]?.trim(),
      })
    })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-5">
            <span className="text-danger text-2xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-navy mb-2">Une erreur est survenue</h1>
          <p className="text-sm text-muted mb-6 max-w-sm leading-relaxed">
            L'application a rencontré une erreur inattendue. Veuillez recharger la page.
          </p>
          <pre className="text-left text-xs text-danger bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 max-w-lg w-full overflow-x-auto mb-6 whitespace-pre-wrap break-words">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Recharger la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
