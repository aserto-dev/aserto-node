/**
 * Custom error class for service operations.
 * Extends the built-in Error class.
 *
 * @class Service
 * @extends Error
 */
class ServiceError extends Error {}

export class ConfigError extends ServiceError {}
/**
 * "Etag Mismatch" error.
 * Extends the ServiceError class.
 *
 * @class EtagMismatchError
 * @extends ServiceError
 */
export class EtagMismatchError extends ServiceError {}
/**
 * "Invalid Argument" error.
 * Extends the ServiceError class.
 *
 * @class InvalidArgumentError
 * @extends ServiceError
 */
export class InvalidArgumentError extends ServiceError {}
export class InvalidSchemaError extends Error {}
/**
 * Object or Relation is not found.
 * Extends the ServiceError class.
 *
 * @class NotFoundError
 * @extends ServiceError
 */
export class NotFoundError extends ServiceError {}
/**
 * "Unauthenticated" error.
 * Extends the ServiceError class.
 *
 * @class UnauthenticatedError
 * @extends ServiceError
 */
export class UnauthenticatedError extends ServiceError {}
