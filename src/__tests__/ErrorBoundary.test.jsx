import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../components/ErrorBoundary'

function BrokenChild() {
  throw new Error('Test render explosion')
}

function HealthyChild() {
  return <p>All systems nominal</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress React's console.error for the intentional throw
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <HealthyChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('All systems nominal')).toBeInTheDocument()
  })

  it('renders fallback UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/needs to restart/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
  })

  it('does not render children after an error is caught', () => {
    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Test render explosion')).not.toBeInTheDocument()
  })
})
