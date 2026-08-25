import {
  LoginRequestSchema,
  ResendVerificationRequestSchema,
  VerifyEmailRequestSchema,
  type LoginRequest,
} from '@aerealith-ai/core';
import { createSchema } from 'graphql-yoga';
import { requireAuthorization } from '@aerealith-ai/api-platform';

import type { AuthApplication } from './auth-application.service';
import type { AuthTransportContext } from './auth-api-context';
import { toGraphqlError } from './auth-transport.helpers';
import {
  clearSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from './session-cookie';

export function createAuthGraphqlSchema(application: AuthApplication) {
  return createSchema<AuthTransportContext>({
    typeDefs: /* GraphQL */ `
      type AuthUser {
        id: ID!
        username: String!
        email: String!
        emailVerified: Boolean!
        role: String!
        displayName: String
        createdAt: String!
        updatedAt: String!
      }

      input LoginInput {
        usernameOrEmail: String!
        password: String!
      }

      type Query {
        me: AuthUser
      }

      type Mutation {
        login(input: LoginInput!): AuthUser!
        logout: Boolean!
        verifyEmail(token: String!): AuthUser!
        resendVerification(email: String!): Boolean!
      }
    `,
    resolvers: {
      Query: {
        me: async (_root, _arguments, context) => {
          const user = await application.currentUser(
            readSessionCookie(context.honoContext),
          );
          if (!user) return null;
          await requireAuthorization({
            authorization: context.apiContext.authorization,
            principal: { id: user.id, type: 'user' },
            permission: 'account.read',
            scope: { type: 'resource', id: user.id },
          });
          return user;
        },
      },
      Mutation: {
        login: async (_root, arguments_: { input: LoginRequest }, context) => {
          try {
            const input = LoginRequestSchema.parse(arguments_.input);
            const result = await application.login(input);
            writeSessionCookie(context.honoContext, result.sessionToken);
            return result.user;
          } catch (error) {
            throw toGraphqlError(error);
          }
        },
        logout: async (_root, _arguments, context) => {
          await application.logout(readSessionCookie(context.honoContext));
          clearSessionCookie(context.honoContext);
          return true;
        },
        verifyEmail: async (_root, arguments_: { token: string }) => {
          try {
            return await application.verifyEmail(
              VerifyEmailRequestSchema.parse(arguments_).token,
            );
          } catch (error) {
            throw toGraphqlError(error);
          }
        },
        resendVerification: async (_root, arguments_: { email: string }) => {
          try {
            await application.resendVerification(
              ResendVerificationRequestSchema.parse(arguments_).email,
            );
            return true;
          } catch (error) {
            throw toGraphqlError(error);
          }
        },
      },
    },
  });
}
