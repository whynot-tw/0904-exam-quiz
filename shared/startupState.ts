export type StartupStatus = "loading" | "recoverable-error" | "ready";

export function getStartupStatus(input: {
  authLoading: boolean;
  bootstrapLoading: boolean;
  bootstrapError: boolean;
  timedOut: boolean;
}): StartupStatus {
  if (input.bootstrapError || input.timedOut) return "recoverable-error";
  if (input.authLoading || input.bootstrapLoading) return "loading";
  return "ready";
}
