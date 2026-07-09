// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Label } from './label'
describe('Label', () => {
  it('labels a control', () => {
    render(
      <>
        <Label htmlFor='name'>Name</Label>
        <input id='name' />
      </>,
    )
    expect(screen.getByLabelText('Name')).toBeTruthy()
  })
})
