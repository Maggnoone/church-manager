const MAX_SAFE_ERROR_LENGTH = 4_000;
const MAX_SERIALIZED_DEPTH = 4;
const MAX_SERIALIZED_ITEMS = 40;
const MAX_SERIALIZED_STRING_LENGTH = 512;
const SENSITIVE_QUERY_PARAMETER_PATTERN =
  /([?&](?:access_token|refresh_token|token|code|key|secret|password|api_key|apikey)=)[^&#\s]*/gi;
const SENSITIVE_HEADER_ASSIGNMENT_PATTERN =
  /((?:["']?(?:authorization|cookie|set-cookie)["']?)\s*[:=]\s*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\r\n,}\]]+)/gi;
const SENSITIVE_ASSIGNMENT_PATTERN =
  /((?:["']?(?:access[_-]?token|refresh[_-]?token|authorization|cookie|set-cookie|password|secret|api[_-]?key|apikey|token|code|private[_-]?key|session)["']?)\s*[:=]\s*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}'`\]]+)/gi;
const SENSITIVE_KEY_PATTERN =
  /^(?:access[_-]?token|refresh[_-]?token|authorization|cookie|set-cookie|password|secret|api[_-]?key|apikey|token|code|private[_-]?key|session)$/i;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const BEARER_TOKEN_PATTERN = /(\bBearer\s+)[^\s]+/gi;

function redactAssignmentValue(value: string) {
  const quote =
    value[0] === value[value.length - 1] && (value[0] === '"' || value[0] === "'")
      ? value[0]
      : "";

  return quote ? `${quote}[REDACTED]${quote}` : "[REDACTED]";
}

function redactSensitiveData(value: string) {
  const redacted = value
    .replace(BEARER_TOKEN_PATTERN, "$1[REDACTED]")
    .replace(SENSITIVE_QUERY_PARAMETER_PATTERN, "$1[REDACTED]")
    .replace(
      SENSITIVE_HEADER_ASSIGNMENT_PATTERN,
      (_match, prefix: string, rawValue: string) => `${prefix}${redactAssignmentValue(rawValue)}`,
    )
    .replace(
      SENSITIVE_ASSIGNMENT_PATTERN,
      (_match, prefix: string, rawValue: string) => `${prefix}${redactAssignmentValue(rawValue)}`,
    )
    .replace(JWT_PATTERN, "[REDACTED_JWT]");

  return redacted.length > MAX_SAFE_ERROR_LENGTH
    ? `${redacted.slice(0, MAX_SAFE_ERROR_LENGTH)}…`
    : redacted;
}

function serializeUnknownValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
  key?: string,
): string {
  if (key && SENSITIVE_KEY_PATTERN.test(key)) return JSON.stringify("[REDACTED]");
  if (depth > MAX_SERIALIZED_DEPTH) return JSON.stringify("[Max depth]");

  if (typeof value === "string") {
    const shortened =
      value.length > MAX_SERIALIZED_STRING_LENGTH
        ? `${value.slice(0, MAX_SERIALIZED_STRING_LENGTH)}…`
        : value;
    return JSON.stringify(shortened);
  }

  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "bigint") return JSON.stringify(`${value}n`);
  if (typeof value === "undefined") return JSON.stringify("[undefined]");
  if (typeof value === "function") {
    return JSON.stringify(`[Function ${value.name || "anonymous"}]`);
  }
  if (typeof value === "symbol") return JSON.stringify(String(value));

  if (value instanceof Date) {
    return JSON.stringify(Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString());
  }
  if (value instanceof RegExp) return JSON.stringify(String(value));

  if (seen.has(value)) return JSON.stringify("[Circular]");
  seen.add(value);

  try {
    if (Array.isArray(value)) {
      const items: string[] = [];
      const itemCount = Math.min(value.length, MAX_SERIALIZED_ITEMS);

      for (let index = 0; index < itemCount; index += 1) {
        try {
          items.push(serializeUnknownValue(value[index], depth + 1, seen));
        } catch {
          items.push(JSON.stringify("[Unserializable]"));
        }
      }

      if (value.length > itemCount) items.push(JSON.stringify("[Truncated]"));
      return `[${items.join(",")}]`;
    }

    const keys = Object.keys(value);
    const entries: string[] = [];

    for (const currentKey of keys.slice(0, MAX_SERIALIZED_ITEMS)) {
      let currentValue: unknown;
      try {
        currentValue = (value as Record<string, unknown>)[currentKey];
      } catch {
        currentValue = "[Unserializable]";
      }

      entries.push(
        `${JSON.stringify(currentKey)}:${serializeUnknownValue(currentValue, depth + 1, seen, currentKey)}`,
      );
    }

    if (keys.length > MAX_SERIALIZED_ITEMS) {
      entries.push(`${JSON.stringify("__truncated__")}:true`);
    }

    return `{${entries.join(",")}}`;
  } catch {
    return JSON.stringify("[Unserializable object]");
  } finally {
    seen.delete(value);
  }
}

function stringifyUnknownError(error: unknown) {
  if (typeof error === "string") return error;

  if (error !== null && typeof error === "object") {
    return serializeUnknownValue(error, 0, new WeakSet<object>());
  }

  try {
    return String(error);
  } catch {
    return "Unknown error";
  }
}

export interface SafeErrorDetails {
  name: string;
  message: string;
  stack?: string;
}

export function getSafeErrorDetails(error: unknown): SafeErrorDetails {
  if (error instanceof Error) {
    return {
      name: redactSensitiveData(error.name || "Error"),
      message: redactSensitiveData(error.message || "Unknown error"),
      ...(error.stack ? { stack: redactSensitiveData(error.stack) } : {}),
    };
  }

  return {
    name: typeof error,
    message: redactSensitiveData(stringifyUnknownError(error)),
  };
}

export function logSafeError(
  context: string,
  error: unknown,
  metadata?: Record<string, boolean | number | string | undefined>,
) {
  const safeMetadata = metadata
    ? Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [
          key,
          typeof value === "string" ? redactSensitiveData(value) : value,
        ]),
      )
    : undefined;

  console.error(redactSensitiveData(context), {
    ...safeMetadata,
    error: getSafeErrorDetails(error),
  });
}
