class ApiError extends Error {
  constructor(
    statusCode,
    message = "something went wrong",
    error = [],
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.error = error;

    if (stack) {
      this.stack = stack; // if custom stack is provided
    } else {
      Error.captureStackTrace(this, this.constructor); // this is the usual way
    }
  }
}
export { ApiError };
