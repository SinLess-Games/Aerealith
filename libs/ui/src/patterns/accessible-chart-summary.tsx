import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../lib/cn'
export interface AccessibleChartSummaryProps extends ComponentPropsWithoutRef<'section'> {
  title: string
  summary: ReactNode
  data?: readonly (readonly ReactNode[])[]
}
export function AccessibleChartSummary({
  title,
  summary,
  data,
  className,
  ...props
}: AccessibleChartSummaryProps) {
  return (
    <section
      {...props}
      aria-label={`${title} chart summary`}
      className={cn('space-y-2', className)}
      data-slot='accessible-chart-summary'
    >
      <h3 className='font-semibold'>{title}</h3>
      <div>{summary}</div>
      {data && (
        <table>
          <caption className='sr-only'>{title} data</caption>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
