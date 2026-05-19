import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureCard } from '../../src/components/FeatureCard'

describe('FeatureCard', () => {
  it('renders the feature card with title and description', () => {
    render(
      <FeatureCard
        title="Real-time Analytics"
        description="Get instant insights into your gameplay performance"
      />
    )

    expect(screen.getByText('Real-time Analytics')).toBeInTheDocument()
    expect(screen.getByText('Get instant insights into your gameplay performance')).toBeInTheDocument()
  })

  it('renders as an article element', () => {
    const { container } = render(
      <FeatureCard
        title="Test Title"
        description="Test Description"
      />
    )

    expect(container.querySelector('article')).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    const { container } = render(
      <FeatureCard
        title="Test"
        description="Test Description"
      />
    )

    const article = container.querySelector('article')
    expect(article).toHaveClass('rounded-3xl', 'border', 'bg-white/90')
  })

  it('renders title with correct styling', () => {
    render(
      <FeatureCard
        title="Test Title"
        description="Test Description"
      />
    )

    const title = screen.getByText('Test Title')
    expect(title.tagName).toBe('H2')
    expect(title).toHaveClass('text-lg', 'font-semibold')
  })

  it('renders description with correct styling', () => {
    render(
      <FeatureCard
        title="Test Title"
        description="Test Description"
      />
    )

    const description = screen.getByText('Test Description')
    expect(description.tagName).toBe('P')
    expect(description).toHaveClass('text-sm', 'text-slate-600')
  })

  it('handles long titles and descriptions', () => {
    const longTitle = 'A'.repeat(100)
    const longDescription = 'B'.repeat(200)

    render(
      <FeatureCard
        title={longTitle}
        description={longDescription}
      />
    )

    expect(screen.getByText(longTitle)).toBeInTheDocument()
    expect(screen.getByText(longDescription)).toBeInTheDocument()
  })

  it('handles special characters in content', () => {
    render(
      <FeatureCard
        title="Test & Special <> Characters"
        description={'Description with quotes: \'single\' and "double"'}
      />
    )

    expect(screen.getByText(/Test & Special/)).toBeInTheDocument()
    expect(screen.getByText(/Description with quotes/)).toBeInTheDocument()
  })
})
