/**
 * Mongoose documents (ObjectId, Date, Buffer) cannot cross the server/client
 * boundary. Every service returns plain JSON through this helper rather than
 * each page repeating JSON.parse(JSON.stringify(...)).
 */
export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
