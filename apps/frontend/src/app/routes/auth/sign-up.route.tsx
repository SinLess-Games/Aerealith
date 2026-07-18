// apps/frontend/src/app/routes/sign-up.route.tsx

import { Button, Input, Label } from '@aerealith-ai/ui'
import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { useSignUp } from '../../../features/auth/use-session'
import { AuthCard } from './auth-card'

/** Sign-up page: registers against `POST /api/V1/auth/sign-up`. */
export function SignUpRoute() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { mutate, isPending, isError, error } = useSignUp()

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    mutate({ username, email, password }, { onSuccess: () => navigate('/app') })
  }

  return (
    <AuthCard
      title='Create your account'
      subtitle='Start with a trust-first command center for your digital life.'
      footer={
        <>
          Already have an account? <Link to='/sign-in'>Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className='space-y-4' noValidate>
        <div className='space-y-1.5'>
          <Label htmlFor='username'>Username</Label>
          <Input
            id='username'
            name='username'
            autoComplete='username'
            required
            minLength={3}
            maxLength={32}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name='email'
            type='email'
            autoComplete='email'
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            name='password'
            type='password'
            autoComplete='new-password'
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className='text-xs'>At least 8 characters.</p>
        </div>

        {isError ? (
          <p role='alert' className='text-sm'>
            {error.message}
          </p>
        ) : null}

        <Button type='submit' fullWidth disabled={isPending}>
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  )
}

export default SignUpRoute
