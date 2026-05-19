import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatMessage } from '../../src/components/ChatMessage'
import type { ChatEntry } from '../../src/data/mockRiot'

describe('ChatMessage', () => {
  const mockAssistantEntry: ChatEntry = {
    id: 1,
    role: 'assistant',
    author: 'Lolek',
    message: 'Your current build path looks good!',
    time: '14:32',
  }

  const mockUserEntry: ChatEntry = {
    id: 2,
    role: 'user',
    author: 'You',
    message: 'What should I buy next?',
    time: '14:30',
  }

  it('renders assistant message with assistant styling', () => {
    render(<ChatMessage entry={mockAssistantEntry} />)

    expect(screen.getByText('Lolek')).toBeInTheDocument()
    expect(screen.getByText('Your current build path looks good!')).toBeInTheDocument()
  })

  it('renders user message with user styling', () => {
    render(<ChatMessage entry={mockUserEntry} />)

    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('What should I buy next?')).toBeInTheDocument()
  })

  it('displays correct time for messages', () => {
    render(<ChatMessage entry={mockAssistantEntry} />)
    expect(screen.getByText('14:32')).toBeInTheDocument()
  })

  it('renders assistant icon for assistant messages', () => {
    const { container } = render(<ChatMessage entry={mockAssistantEntry} />)
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('renders user icon for user messages', () => {
    const { container } = render(<ChatMessage entry={mockUserEntry} />)
    const userIcon = container.querySelector('svg')
    expect(userIcon).toBeInTheDocument()
  })

  it('applies different styling for assistant vs user messages', () => {
    const { container: assistantContainer } = render(
      <ChatMessage entry={mockAssistantEntry} />
    )
    const { container: userContainer } = render(
      <ChatMessage entry={mockUserEntry} />
    )

    const assistantMessage = assistantContainer.querySelector('div[class*="bg-slate-950"]')
    const userMessage = userContainer.querySelector('div[class*="bg-fuchsia"]')

    expect(assistantMessage).toBeInTheDocument()
    expect(userMessage).toBeInTheDocument()
  })

  it('justifies user messages to the end', () => {
    const { container } = render(<ChatMessage entry={mockUserEntry} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('justify-end')
  })

  it('does not justify assistant messages to the end', () => {
    const { container } = render(<ChatMessage entry={mockAssistantEntry} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toMatch(/justify-end/)
  })

  it('renders long messages correctly', () => {
    const longMessage = 'A'.repeat(500)
    const entry: ChatEntry = {
      ...mockAssistantEntry,
      message: longMessage,
    }

    render(<ChatMessage entry={entry} />)
    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })

  it('handles special characters in messages', () => {
    const entry: ChatEntry = {
      ...mockAssistantEntry,
      message: 'Use items like IE & RFC <components>',
    }

    render(<ChatMessage entry={entry} />)
    expect(screen.getByText(/Use items like IE & RFC/)).toBeInTheDocument()
  })
})
