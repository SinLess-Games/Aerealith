// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AlertDialog, AlertDialogContent } from './alert-dialog'
describe('AlertDialog', () => {
  it('renders modal content', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>Confirm</AlertDialogContent>
      </AlertDialog>,
    )
    expect(screen.getByRole('dialog').textContent).toBe('Confirm')
  })
})
