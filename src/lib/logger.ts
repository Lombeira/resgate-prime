/**
 * Logger estruturado para observability
 * Em produção, integrar com Datadog/Logflare/Papertrail
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private context: LogContext = {};

  constructor(initialContext: LogContext = {}) {
    this.context = initialContext;
  }

  private log(level: LogLevel, message: string, extra: LogContext = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...extra,
    };

    // Em produção, enviar para serviço de logging
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrar com Datadog/Logflare
      console.log(JSON.stringify(logEntry));
    } else {
      // Em dev, formato legível
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      console[level === 'debug' ? 'log' : level](
        `${emoji} [${timestamp}] ${message}`,
        Object.keys({ ...this.context, ...extra }).length > 0
          ? { ...this.context, ...extra }
          : ''
      );
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | LogContext, context?: LogContext) {
    const errorContext: LogContext = {};

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      Object.assign(errorContext, error);
    }

    this.log('error', message, { ...errorContext, ...context });
  }

  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }
}

// Instância global
export const logger = new Logger();

// Helper para criar logger com contexto
export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}

// Helper para logs de performance
export function measureTime(label: string) {
  const start = Date.now();

  return {
    end: (context?: LogContext) => {
      const duration = Date.now() - start;
      logger.info(`⏱️ ${label}`, { duration, ...context });
      return duration;
    },
  };
}
