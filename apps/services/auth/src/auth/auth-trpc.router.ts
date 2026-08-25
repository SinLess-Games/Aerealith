import {
  LoginRequestSchema,
  ResendVerificationRequestSchema,
  VerifyEmailRequestSchema,
} from '@aerealith-ai/core';
import { initTRPC, TRPCError } from '@trpc/server';
import { requireAuthorization } from '@aerealith-ai/api-platform';

import type { AuthApplication } from './auth-application.service';
import type { AuthTransportContext } from './auth-api-context';
import { toTrpcError } from './auth-transport.helpers';
import {
  clearSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from './session-cookie';

const trpc = initTRPC.context<AuthTransportContext>().create();

export function createAuthTrpcRouter(application: AuthApplication) {
  return trpc.router({
    auth: trpc.router({
      login: trpc.procedure
        .input(LoginRequestSchema)
        .mutation(async ({ ctx, input }) => {
          try {
            const result = await application.login(input);
            writeSessionCookie(ctx.honoContext, result.sessionToken);
            return result.user;
          } catch (error) {
            throw toTrpcError(error);
          }
        }),
      me: trpc.procedure.query(async ({ ctx }) => {
        const user = await application.currentUser(
          readSessionCookie(ctx.honoContext),
        );
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication is required.',
          });
        }
        await requireAuthorization({
          authorization: ctx.apiContext.authorization,
          principal: { id: user.id, type: 'user' },
          permission: 'account.read',
          scope: { type: 'resource', id: user.id },
        });
        return user;
      }),
      logout: trpc.procedure.mutation(async ({ ctx }) => {
        await application.logout(readSessionCookie(ctx.honoContext));
        clearSessionCookie(ctx.honoContext);
        return null;
      }),
      verifyEmail: trpc.procedure
        .input(VerifyEmailRequestSchema)
        .mutation(async ({ input }) => {
          try {
            return await application.verifyEmail(input.token);
          } catch (error) {
            throw toTrpcError(error);
          }
        }),
      resendVerification: trpc.procedure
        .input(ResendVerificationRequestSchema)
        .mutation(async ({ input }) => {
          try {
            await application.resendVerification(input.email);
            return null;
          } catch (error) {
            throw toTrpcError(error);
          }
        }),
    }),
  });
}

export type AuthTrpcRouter = ReturnType<typeof createAuthTrpcRouter>;
