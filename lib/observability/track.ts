/**
 * Structured observability for EmbedStudio.
 *
 * In development: logs to console.
 * In production: replace with Sentry, Datadog, or your own collector.
 */

const PREFIX = "[EmbedStudio]";

/** Log a structured error event. */
export function trackError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  console.error(
    `${PREFIX}[error]`,
    JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    }),
  );
}

/** Log a structured event (page view, action, metric, etc.). */
export function trackEvent(
  name: string,
  data?: Record<string, unknown>,
): void {
  console.log(
    `${PREFIX}[${name}]`,
    JSON.stringify(data ?? {}),
  );
}
