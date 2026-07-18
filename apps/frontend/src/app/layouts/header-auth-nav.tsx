import { NavLink } from 'react-router'

import { useLogout, useSession } from '../../features/auth/use-session'

const linkClass = 'rounded-md px-3 py-2 text-sm font-medium transition-colors'

const buttonClass =
  'rounded-md border border-[var(--ae-border)] px-3 py-2 text-sm font-medium transition-colors'

type HeaderAuthNavProps = Readonly<{ mobile?: boolean }>

function responsiveClass(
  mobile: boolean,
  mobileClass: string,
  desktopClass: string,
) {
  return mobile ? mobileClass : desktopClass
}

export function HeaderAuthNav({ mobile = false }: HeaderAuthNavProps) {
  const { user, isAuthenticated, isLoading } = useSession()
  const logout = useLogout()

  if (isLoading) {
    return (
      <span
        aria-busy='true'
        aria-label='Checking session'
        className={responsiveClass(
          mobile,
          'h-11 w-full',
          'inline-block h-9 w-16',
        )}
      />
    )
  }

  if (isAuthenticated && user) {
    return (
      <div
        className={responsiveClass(
          mobile,
          'grid gap-2',
          'flex items-center gap-2',
        )}
      >
        <NavLink
          to='/app'
          className={responsiveClass(
            mobile,
            linkClass + ' text-center',
            linkClass,
          )}
        >
          Dashboard
        </NavLink>
        <span
          className={responsiveClass(
            mobile,
            'text-center text-sm',
            'hidden text-sm sm:inline',
          )}
        >
          {user.username}
        </span>
        <button
          type='button'
          className={responsiveClass(
            mobile,
            buttonClass + ' w-full',
            buttonClass,
          )}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {logout.isPending ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    )
  }

  return (
    <NavLink
      to='/sign-in'
      className={responsiveClass(
        mobile,
        buttonClass + ' text-center',
        buttonClass,
      )}
    >
      Sign in
    </NavLink>
  )
}
