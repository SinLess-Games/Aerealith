import {
  createDatabaseConnection,
  type DatabaseClientConnection,
} from '@aerealith-ai/db';

import {
  WaitlistApplicationService,
  type JoinWaitlistInput,
  type WaitlistApplication,
} from './waitlist-application.service';

export class LazyWaitlistApplication implements WaitlistApplication {
  private connection?: DatabaseClientConnection;
  private application?: WaitlistApplication;

  constructor(private readonly databaseUrl?: string) {}

  join(input: JoinWaitlistInput) {
    return this.getApplication().join(input);
  }

  async close(): Promise<void> {
    await this.connection?.close();
  }

  private getApplication(): WaitlistApplication {
    this.connection ??= createDatabaseConnection(
      this.databaseUrl ? { DATABASE_URL: this.databaseUrl } : process.env,
    );
    this.application ??= new WaitlistApplicationService(this.connection.client);
    return this.application;
  }
}
