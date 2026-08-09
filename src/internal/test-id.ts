export function getTestId(
  configuredValue: string | undefined,
  fallback: string,
): string {
  return configuredValue?.trim() === "" || configuredValue === undefined
    ? fallback
    : configuredValue;
}
