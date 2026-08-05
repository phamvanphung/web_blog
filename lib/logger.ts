// lib/logger.ts
// Minimal structured logger. No external dep — replace later with pino/winston if needed.

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const envLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as Level;
const threshold = LEVELS[envLevel] ?? LEVELS.info;

function shouldLog(level: Level): boolean {
  return LEVELS[level] >= threshold;
}

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(meta ?? {})
  };
  // In dev, pretty-print; in prod, single-line JSON.
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
  } else {
    // eslint-disable-next-line no-console
    console.log(`[${payload.ts}] ${level.toUpperCase()} ${msg(message, meta)}`);
  }
}

function msg(message: string, meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return message;
  try {
    return `${message} ${JSON.stringify(meta)}`;
  } catch {
    return message;
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit('error', msg, meta)
};

export type Logger = typeof logger;
export default logger;
