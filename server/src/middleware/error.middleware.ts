import type { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFoundHandler = (request: Request, _response: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${request.originalUrl}`, 404));
};

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
      statusCode: error.statusCode,
    });

    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';

  console.error('[errorHandler] Error:', error);

  response.status(500).json({
    message,
    statusCode: 500,
  });
};
