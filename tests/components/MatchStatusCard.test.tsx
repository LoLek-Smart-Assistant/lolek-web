import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchStatusCard } from '../../src/components/MatchStatusCard'

describe('MatchStatusCard', () => {
  it('renders all three status pills', () => {
    render(
      <MatchStatusCard
        mode="5v5 Ranked"
        duration="24m 32s"
        region="EU West"
      />
    )

    expect(screen.getByText(/Game mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Duration/i)).toBeInTheDocument()
    expect(screen.getByText(/Region/i)).toBeInTheDocument()
  })

  it('displays correct mode value', () => {
    render(
      <MatchStatusCard
        mode="Aram"
        duration="12m"
        region="NA"
      />
    )

    expect(screen.getByText('Aram')).toBeInTheDocument()
  })

  it('displays correct duration value', () => {
    render(
      <MatchStatusCard
        mode="5v5"
        duration="35m 20s"
        region="KR"
      />
    )

    expect(screen.getByText('35m 20s')).toBeInTheDocument()
  })

  it('displays correct region value', () => {
    render(
      <MatchStatusCard
        mode="Ranked"
        duration="20m"
        region="BR"
      />
    )

    expect(screen.getByText('BR')).toBeInTheDocument()
  })

  it('renders as a section element', () => {
    const { container } = render(
      <MatchStatusCard
        mode="Test"
        duration="10m"
        region="Test"
      />
    )

    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    const { container } = render(
      <MatchStatusCard
        mode="Test"
        duration="10m"
        region="Test"
      />
    )

    const section = container.querySelector('section')
    expect(section).toHaveClass('rounded-[20px]', 'border', 'bg-slate-950/75')
  })

  it('renders labels with correct styling', () => {
    render(
      <MatchStatusCard
        mode="Test"
        duration="10m"
        region="Test"
      />
    )

    const labels = screen.getAllByText(/Game mode|Duration|Region/)
    labels.forEach(label => {
      expect(label).toHaveClass('uppercase', 'tracking-[0.16em]')
    })
  })

  it('renders icons for each status pill', () => {
    const { container } = render(
      <MatchStatusCard
        mode="Test"
        duration="10m"
        region="Test"
      />
    )

    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('handles different time formats', () => {
    const durations = ['1m', '59m 59s', '0m', '100m 15s']

    durations.forEach(duration => {
      const { unmount } = render(
        <MatchStatusCard
          mode="Test"
          duration={duration}
          region="Test"
        />
      )

      expect(screen.getByText(duration)).toBeInTheDocument()
      unmount()
    })
  })

  it('handles regions with special characters', () => {
    render(
      <MatchStatusCard
        mode="Test"
        duration="10m"
        region="Asia-Pacific 1"
      />
    )

    expect(screen.getByText('Asia-Pacific 1')).toBeInTheDocument()
  })
})
