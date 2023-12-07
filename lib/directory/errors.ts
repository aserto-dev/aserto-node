/**
 * Custom error class for directory service operations.
 * Extends the built-in Error class.
 *
 * @class DirectoryService
 * @extends Error
 */
class DirectoryServiceError extends Error {}
export class ConfigError extends DirectoryServiceError {}
/**
 * Object or Relation is not found.
 * Extends the DirectoryServiceError class.
 *
 * @class NotFoundError
 * @extends DirectoryServiceError
 */
export class NotFoundError extends DirectoryServiceError {}
/**
 * "Invalid Argument" error.
 * Extends the DirectoryServiceError class.
 *
 * @class InvalidArgumentError
 * @extends DirectoryServiceError
 */
export class InvalidArgumentError extends DirectoryServiceError {}
/**
 * "Etag Mismatch" error.
 * Extends the DirectoryServiceError class.
 *
 * @class EtagMismatchError
 * @extends DirectoryServiceError
 */
export class EtagMismatchError extends DirectoryServiceError {}
/**
 * "Unauthenticated" error.
 * Extends the DirectoryServiceError class.
 *
 * @class UnauthenticatedError
 * @extends DirectoryServiceError
 */
export class UnauthenticatedError extends DirectoryServiceError {}
