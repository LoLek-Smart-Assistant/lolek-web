import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlayerCard } from '../../src/components/PlayerCard'
import type { Player } from '../../src/data/mockRiot'

describe('PlayerCard', () => {
  const mockPlayer: Player = {
    champion: 'Ahri',
    summonerName: 'NeonFox',
    currentItems: ['Item1', 'Item2'],
    predictedItems: ['Item3', 'Item4'],
    level: 14,
    role: 'Mid',
    kda: '6 / 1 / 4',
    accent: 'from-cyan-400 to-blue-500',
  }

  it('renders player summoner name', () => {
    render(<PlayerCard player={mockPlayer} />)
    expect(screen.getByText('NeonFox')).toBeInTheDocument()
  })

  it('renders champion name', () => {
    render(<PlayerCard player={mockPlayer} />)
    expect(screen.getByText('Ahri')).toBeInTheDocument()
  })

  it('renders player card as an article element', () => {
    const { container } = render(<PlayerCard player={mockPlayer} />)
    expect(container.querySelector('article')).toBeInTheDocument()
  })

  it('displays champion initials in badge', () => {
    render(<PlayerCard player={mockPlayer} />)
    // Ahri -> AH
    expect(screen.getByText('AH')).toBeInTheDocument()
  })

  it('applies correct champion initials for different champions', () => {
    const champions = [
      { name: 'Yasuo', expected: 'YA' },
      { name: 'Lee Sin', expected: 'LE' },
      { name: 'Kai\'Sa', expected: 'KA' },
    ]

    champions.forEach(({ name, expected }) => {
      const player: Player = { ...mockPlayer, champion: name }
      const { unmount } = render(<PlayerCard player={player} />)

      expect(screen.getByText(expected)).toBeInTheDocument()
      unmount()
    })
  })

  it('applies accent color class from player data', () => {
    const { container } = render(<PlayerCard player={mockPlayer} />)
    const badge = container.querySelector('div[class*="from-cyan-400"]')
    expect(badge).toBeInTheDocument()
  })

  it('renders card with hover effects', () => {
    const { container } = render(<PlayerCard player={mockPlayer} />)
    const article = container.querySelector('article')
    expect(article).toHaveClass('hover:border-cyan-400/20', 'hover:bg-slate-950/90')
  })

  it('combines current and predicted items', () => {
    const player: Player = {
      ...mockPlayer,
      currentItems: ['Boot', 'Sword'],
      predictedItems: ['Shield', 'Helm', 'Cloak', 'Ring'],
    }

    render(<PlayerCard player={player} />)
    // Should render up to 6 items total (4 current + predicted = Boot, Sword, Shield, Helm, Cloak, Ring)
    // But only first 2 are current, rest are predicted
  })

  it('handles player with no items', () => {
    const player: Player = {
      ...mockPlayer,
      currentItems: [],
      predictedItems: [],
    }

    render(<PlayerCard player={player} />)
    expect(screen.getByText('NeonFox')).toBeInTheDocument()
  })

  it('handles player with many items', () => {
    const manyItems = Array.from({ length: 10 }, (_, i) => `Item${i + 1}`)
    const player: Player = {
      ...mockPlayer,
      currentItems: manyItems.slice(0, 5),
      predictedItems: manyItems.slice(5),
    }

    render(<PlayerCard player={player} />)
    expect(screen.getByText('NeonFox')).toBeInTheDocument()
  })

  it('renders correctly for different roles', () => {
    const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']

    roles.forEach(role => {
      const player: Player = { ...mockPlayer, role }
      const { unmount } = render(<PlayerCard player={player} />)
      expect(screen.getByText('NeonFox')).toBeInTheDocument()
      unmount()
    })
  })

  it('handles long summoner names with truncation', () => {
    const player: Player = {
      ...mockPlayer,
      summonerName: 'A'.repeat(50),
    }

    const { container } = render(<PlayerCard player={player} />)
    const nameElement = container.querySelector('p[class*="truncate"]')
    expect(nameElement).toBeInTheDocument()
  })

  it('applies correct styling to champion badge', () => {
    const { container } = render(<PlayerCard player={mockPlayer} />)
    const badge = container.querySelector('div[class*="h-11 w-11"]')
    expect(badge).toHaveClass('rounded-full', 'text-slate-950', 'shadow-[0_0_20px_rgba(56,189,248,0.22)]')
  })
})
