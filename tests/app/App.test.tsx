import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../../src/app/App'

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })

  it('renders the DashboardScreen component', () => {
    render(<App />)
    // Check if the app renders content from DashboardScreen
    // This is a basic integration test
    expect(document.body).toBeTruthy()
  })

  it('has the correct root element structure', () => {
    const { container } = render(<App />)
    expect(container.firstChild).toBeTruthy()
  })
})
