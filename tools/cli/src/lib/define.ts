import {
  Command,
  Option,
  type BaseContext,
  type CommandClass,
} from 'clipanion';
import { runSteps, splitDryRun, type Step } from './run.js';

export interface Spec {
  path: string[];
  description: string;
  /** Builds the steps to run; extra CLI args are forwarded. */
  steps: (args: string[]) => Step[];
}

export function defineCommand(spec: Spec): CommandClass<BaseContext> {
  return class extends Command<BaseContext> {
    static override paths = [spec.path];
    static override usage = Command.Usage({
      description: spec.description,
      details:
        'Extra arguments are forwarded. Use --dry-run to print the commands only.',
    });
    rest = Option.Proxy();

    async execute(): Promise<number> {
      const { args, dryRun } = splitDryRun(this.rest);
      return runSteps(spec.steps(args), { dryRun });
    }
  };
}
