// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AccessibleChartSummary } from './accessible-chart-summary'
describe('AccessibleChartSummary', () => {
  it('renders chart data as a table', () => {
    render(
      <AccessibleChartSummary
        data={[['Jan', 2]]}
        summary='Rising'
        title='Usage'
      />,
    )
    expect(screen.getByRole('table')).toBeTruthy()
  })
})
