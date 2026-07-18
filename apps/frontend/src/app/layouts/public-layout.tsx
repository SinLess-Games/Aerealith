import { Outlet } from 'react-router'

import { PublicFooter } from './public-footer'
import { PublicHeader } from './public-header'

export function PublicLayout() {
  return (
    <div className='flex min-h-screen flex-col gap-8'>
      <PublicHeader />

      <main className='flex flex-1 flex-col'>
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  )
}

export default PublicLayout
