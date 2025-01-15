export class HttpError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ValidationError extends HttpError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}
