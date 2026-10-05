export class ReviewError extends Error {
  constructor(code, message) { super(message); this.name = "ReviewError"; this.code = code; }
}

export function fail(code, message) { throw new ReviewError(code, message); }

export function publicError(error) {
  return { code: error instanceof ReviewError ? error.code : "INTERNAL_ERROR", message: error instanceof Error ? error.message : String(error) };
}
