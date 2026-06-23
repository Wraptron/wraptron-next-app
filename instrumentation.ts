import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";

declare global {
  // eslint-disable-next-line no-var
  var __posthogLogger: ReturnType<LoggerProvider["getLogger"]> | undefined;
}

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  if (!token) return;

  const exporter = new OTLPLogExporter({
    url: `${host}/otlp/v1/logs`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({
      "service.name": "wraptron-app",
    }),
    processors: [new SimpleLogRecordProcessor(exporter)],
  });

  globalThis.__posthogLogger = loggerProvider.getLogger("wraptron-app");
}
