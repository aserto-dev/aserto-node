/**
 * Object or Relation is not found.
 * Extends the built-in Error class.
 *
 * @class NotFoundError
 * @extends Error
 */
export class NotFoundError extends Error {}
/**
 * "Invalid Argument" error.
 * Extends the built-in Error class.
 *
 * @class InvalidArgumentError
 * @extends Error
 */
export class InvalidArgumentError extends Error {}
/**
 * "Etag Mismatch" error.
 * Extends the built-in Error class.
 *
 * @class EtagMismatchError
 * @extends Error
 */
export class EtagMismatchError extends Error {}
/**
 * "Unauthenticated" error.
 * Extends the built-in Error class.
 *
 * @class EtagMismatchError
 * @extends Error
 */
export class UnauthenticatedError extends Error {}
export class ServiceError extends Error {}
