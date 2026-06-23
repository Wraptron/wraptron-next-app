import { SeverityNumber } from "@opentelemetry/api-logs";

type LogAttributes = Record<string, string | number | boolean>;

export function emitPostHogLog(
  severity: SeverityNumber,
  severityText: string,
  body: string,
  attributes?: LogAttributes,
): void {
  const logger = globalThis.__posthogLogger;
  if (!logger) return;

  logger.emit({
    severityNumber: severity,
    severityText,
    body,
    attributes,
  });
}
