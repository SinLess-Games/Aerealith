import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from './app'

describe('App', () => {
  it('renders successfully', () => {
    const { baseElement } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(baseElement).toBeTruthy()
  })

  it('shows the Aerealith headings', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Aerealith AI',
      }),
    ).toBeTruthy()

    expect(
      screen.getByRole('heading', {
        name: 'Welcome to Aerealith',
      }),
    ).toBeTruthy()
  })

  it('renders primary navigation', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('navigation', {
        name: 'Primary navigation',
      }),
    ).toBeTruthy()

    expect(
      screen.getByRole('link', {
        name: 'Home',
      }),
    ).toBeTruthy()

    expect(
      screen.getByRole('link', {
        name: 'Page 2',
      }),
    ).toBeTruthy()
  })
})
