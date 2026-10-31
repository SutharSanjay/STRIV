type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const REDACTED = '[redacted]';

const SENSITIVE_KEY =
  /^(weight|reps|note|notes|email|measurement|measurements|token|secret|password|body|name|userName|displayName|fullName|firstName|lastName|bodyWeight)$/i;

export function redact(
  context: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY.test(key)) {
      safe[key] = REDACTED;
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      safe[key] = redact(value as Record<string, unknown>);
      continue;
    }

    safe[key] = value;
  }

  return safe;
}

export function log(
  level: LogLevel,
  message: string,
  context?: Readonly<Record<string, unknown>>,
): void {
  const entry = {
    level,
    message,
    context: context ? redact(context) : undefined,
  };

  if (level === 'error') {
    console.error(entry);
    return;
  }

  if (level === 'warn') {
    console.warn(entry);
    return;
  }

  console.log(entry);
}
