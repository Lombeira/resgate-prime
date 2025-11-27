/**
 * Classes de erro personalizadas para melhor tratamento
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 'NOT_FOUND', 404);
  }
}

export class ProviderError extends AppError {
  constructor(message: string, public providerCode?: string) {
    super(message, 'PROVIDER_ERROR', 502);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Rate limit excedido', 'RATE_LIMIT', 429);
  }
}

export class DuplicateError extends AppError {
  constructor(resource: string) {
    super(`${resource} já existe`, 'DUPLICATE', 409);
  }
}

/**
 * Handler global de erros
 */
export function handleError(error: Error | AppError) {
  if (error instanceof AppError) {
    // Log operacional
    console.error(`[${error.code}] ${error.message}`, {
      statusCode: error.statusCode,
      stack: error.stack,
    });

    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // Erro desconhecido - log completo
  console.error('Erro não tratado:', {
    message: error.message,
    stack: error.stack,
  });

  return {
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
}

/**
 * Wrapper para funções async com tratamento de erro
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error instanceof AppError
        ? error
        : new AppError((error as Error).message, 'UNKNOWN_ERROR');
    }
  }) as T;
}
