type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const IS_DEV = import.meta.env.DEV
const MIN_LEVEL: LogLevel = IS_DEV ? 'debug' : 'info'

function ts(): string {
  return new Date().toISOString()
}

function emit(level: LogLevel, scope: string, message: string, data?: Record<string, unknown>) {
  if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return

  const prefix = `[${ts()}] [${level.toUpperCase()}] [${scope}]`
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.info

  if (data && Object.keys(data).length > 0) {
    fn(prefix, message, data)
  } else {
    fn(prefix, message)
  }
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, data?: Record<string, unknown>) => emit('debug', scope, msg, data),
    info: (msg: string, data?: Record<string, unknown>) => emit('info', scope, msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => emit('warn', scope, msg, data),
    error: (msg: string, data?: Record<string, unknown>) => emit('error', scope, msg, data),
  }
}