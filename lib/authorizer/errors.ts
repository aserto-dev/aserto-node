/**
 * Custom error class for authorizer service operations.
 * Extends the built-in Error class.
 *
 * @class AuthorizerService
 * @extends Error
 */
class AuthorizerServiceError extends Error {}
export class NotFoundError extends AuthorizerServiceError {}
/**
 * "Invalid Argument" error.
 * Extends the AuthorizerServiceError class.
 *
 * @class InvalidArgumentError
 * @extends AuthorizerServiceError
 */
export class InvalidArgumentError extends AuthorizerServiceError {}
/**
 * "Unauthenticated" error.
 * Extends the AuthorizerServiceError class.
 *
 * @class UnauthenticatedError
 * @extends AuthorizerServiceError
 */
export class UnauthenticatedError extends AuthorizerServiceError {}
