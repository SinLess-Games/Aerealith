// apps/frontend/src/app/routes/sign-in.route.tsx

import { Button, Input, Label } from '@aerealith-ai/ui'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { useLogin } from '../../../features/auth/use-session'
import { AuthCard } from './auth-card'

/** Sign-in page: authenticates against `POST /api/V1/auth/login`. */
export function SignInRoute() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { mutate, isPending, isError, error } = useLogin()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutate({ usernameOrEmail, password }, { onSuccess: () => navigate('/') })
  }

  return (
    <AuthCard
      title='Welcome back'
      subtitle='Sign in to your Aerealith account.'
      footer={
        <>
          New here? <Link to='/sign-up'>Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className='space-y-4' noValidate>
        <div className='space-y-1.5'>
          <Label htmlFor='usernameOrEmail'>Username or email</Label>
          <Input
            id='usernameOrEmail'
            name='usernameOrEmail'
            autoComplete='username'
            required
            value={usernameOrEmail}
            onChange={(event) => setUsernameOrEmail(event.target.value)}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            name='password'
            type='password'
            autoComplete='current-password'
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {isError ? (
          <p role='alert' className='text-sm'>
            {error.message}
          </p>
        ) : null}

        <Button type='submit' fullWidth disabled={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  )
}

export default SignInRoute
