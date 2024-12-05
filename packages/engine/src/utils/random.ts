/**
 * Generates a random integer between the specified minimum and maximum values, inclusive.
 *
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A random integer between min and max.
 */
export function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Generates a random floating-point number between the specified minimum and maximum values.
 *
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (exclusive).
 * @returns A random floating-point number between `min` (inclusive) and `max` (exclusive).
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Picks a random element from the given iterable.
 *
 * @template T - The type of elements in the iterable.
 * @param {Iterable<T>} iterable - The iterable to pick a random element from.
 * @returns {T} A random element from the iterable.
 */
export function pickRandom<T>(iterable: Iterable<T>): T {
  const array = Array.from(iterable);
  return array[randomInteger(0, array.length - 1)];
}
