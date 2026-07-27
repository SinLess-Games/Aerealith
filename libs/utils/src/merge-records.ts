export function mergeRecords(
  ...records: ReadonlyArray<Readonly<Record<string, unknown>> | undefined>
): Record<string, unknown> {
  return Object.assign({}, ...records.filter((record) => record !== undefined));
}
