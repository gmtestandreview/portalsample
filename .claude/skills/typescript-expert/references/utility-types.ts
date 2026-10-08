/**
 * TypeScript utility-type pattern catalog.
 *
 * Copy only the pattern needed and adapt it to the project's contracts.
 * These examples provide static shapes, not runtime validation. In particular,
 * branded Email/UUID/PositiveNumber/Timestamp aliases do not prove that a
 * runtime value is valid; validate first and brand at a trusted boundary.
 *
 * Recursive utilities can increase compiler instantiation cost on large or
 * recursive models. Prefer built-ins or shallower project-specific types when
 * they are sufficient.
 */

// =============================================================================
// BRANDED TYPES
// =============================================================================

/**
 * Create nominal/branded types to prevent primitive obsession.
 * 
 * @example
 * type UserId = Brand<string, 'UserId'>
 * type OrderId = Brand<string, 'OrderId'>
 */
export type Brand<K, T> = K & { readonly __brand: T }

// Branded type constructors
export type UserId = Brand<string, 'UserId'>
export type Email = Brand<string, 'Email'>
export type UUID = Brand<string, 'UUID'>
export type Timestamp = Brand<number, 'Timestamp'>
export type PositiveNumber = Brand<number, 'PositiveNumber'>

// =============================================================================
// RESULT TYPE (Error Handling)
// =============================================================================

/**
 * Type-safe error handling without exceptions.
 */
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E }

export const ok = <T>(data: T): Result<T, never> => ({
    success: true,
    data
})

export const err = <E>(error: E): Result<never, E> => ({
    success: false,
    error
})

// =============================================================================
// OPTION TYPE (Nullable Handling)  
// =============================================================================

/**
 * Explicit optional value handling.
 */
export type Option<T> = Some<T> | None

export type Some<T> = { type: 'some'; value: T }
export type None = { type: 'none' }

export const some = <T>(value: T): Some<T> => ({ type: 'some', value })
export const none: None = { type: 'none' }

// =============================================================================
// DEEP UTILITIES
// =============================================================================

/**
 * Make all properties deeply readonly.
 */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
    ? T
    : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T

/**
 * Make all properties deeply optional.
 */
export type DeepPartial<T> = T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

/**
 * Make all properties deeply required.
 */
export type DeepRequired<T> = T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T

/**
 * Make all properties deeply mutable (remove readonly).
 */
export type DeepMutable<T> = T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/**
 * Get keys of object where value matches type.
 */
export type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never
}[keyof T]

/**
 * Pick properties by value type.
 */
export type PickByType<T, V> = Pick<T, KeysOfType<T, V>>

/**
 * Omit properties by value type.
 */
export type OmitByType<T, V> = Omit<T, KeysOfType<T, V>>

/**
 * Make specific keys optional.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific keys required.
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Make specific keys readonly.
 */
export type ReadonlyBy<T, K extends keyof T> = Omit<T, K> & Readonly<Pick<T, K>>

/**
 * Merge two types (second overrides first).
 */
export type Merge<T, U> = Omit<T, keyof U> & U

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Get element type from array.
 */
export type ElementOf<T> = T extends readonly (infer E)[] ? E : never

/**
 * Tuple of a bounded non-negative integer length.
 *
 * Broad `number` falls back to `T[]`. Negative/fractional literals and literal
 * sizes above 64 resolve to `never` instead of recursing indefinitely. Raise
 * the bound only with project-specific type-performance evidence.
 */
export type Tuple<T, N extends number> = number extends N
    ? T[]
    : _IsNonNegativeInteger<N> extends true
    ? _TupleOf<T, N, []>
    : never

type _IsNonNegativeInteger<N extends number> =
    `${N}` extends `-${string}`
    ? false
    : `${N}` extends `${bigint}`
    ? true
    : false

type _TupleOf<
    T,
    N extends number,
    R extends T[],
    Depth extends unknown[] = []
> = R['length'] extends N
    ? R
    : Depth['length'] extends 64
    ? never
    : _TupleOf<T, N, [T, ...R], [unknown, ...Depth]>

/**
 * Non-empty array.
 */
export type NonEmptyArray<T> = [T, ...T[]]

/**
 * At least N elements, using the same bounded-count rules as `Tuple`.
 */
export type AtLeast<T, N extends number> = Tuple<T, N> extends infer Prefix
    ? Prefix extends T[]
    ? [...Prefix, ...T[]]
    : never
    : never

// =============================================================================
// FUNCTION UTILITIES
// =============================================================================

/**
 * Get function arguments as tuple.
 */
export type Arguments<T> = T extends (...args: infer A) => unknown ? A : never

/**
 * Get first argument of function.
 */
export type FirstArgument<T> = T extends (...args: infer A) => unknown
    ? A extends [infer F, ...unknown[]]
        ? F
        : never
    : never

/**
 * Async version of function.
 */
export type AsyncFunction<T extends (...args: never[]) => unknown> = (
    ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>>

/**
 * Promisify return type.
 */
export type Promisify<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : never

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Split string by delimiter.
 */
export type Split<S extends string, D extends string> =
    S extends `${infer T}${D}${infer U}`
    ? [T, ...Split<U, D>]
    : [S]

/**
 * Join tuple to string.
 */
export type Join<T extends string[], D extends string> =
    T extends []
    ? ''
    : T extends [infer F extends string]
    ? F
    : T extends [infer F extends string, ...infer R extends string[]]
    ? `${F}${D}${Join<R, D>}`
    : never

/**
 * Path to nested object.
 *
 * Intended for bounded record-like shapes. Arrays, functions, index signatures,
 * and recursive schemas may need a project-specific variant to avoid surprising
 * keys or excessive type instantiation.
 */
export type PathOf<T, K extends keyof T = keyof T> = K extends string
    ? T[K] extends object
    ? K | `${K}.${PathOf<T[K]>}`
    : K
    : never

// =============================================================================
// UNION UTILITIES
// =============================================================================

/**
 * Last element of union.
 */
export type UnionLast<T> = UnionToIntersection<
    T extends unknown ? () => T : never
> extends () => infer R
    ? R
    : never

/**
 * Union to intersection.
 */
export type UnionToIntersection<U> = (
    U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
    ? I
    : never

/**
 * Union to tuple.
 *
 * Do not rely on the resulting element order: union ordering is not a stable
 * semantic contract. Keep unions small; this recursive transform can become
 * expensive and is unsuitable as an ordering mechanism.
 */
export type UnionToTuple<T, L = UnionLast<T>> = [T] extends [never]
    ? []
    : [...UnionToTuple<Exclude<T, L>>, L]

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Assert type at compile time.
 */
export type AssertEqual<T, U> =
    (<V>() => V extends T ? 1 : 2) extends (<V>() => V extends U ? 1 : 2)
    ? true
    : false

/**
 * Ensure type is not never.
 */
export type IsNever<T> = [T] extends [never] ? true : false

/**
 * Ensure type is any.
 */
export type IsAny<T> = 0 extends 1 & T ? true : false

/**
 * Ensure type is unknown.
 */
export type IsUnknown<T> = IsAny<T> extends true
    ? false
    : unknown extends T
    ? true
    : false

// =============================================================================
// JSON UTILITIES
// =============================================================================

/**
 * JSON-safe types.
 */
export type JsonPrimitive = string | number | boolean | null
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = JsonPrimitive | JsonArray | JsonObject

/**
 * Make type JSON-serializable.
 */
export type Jsonify<T> = T extends JsonPrimitive
    ? T
    : T extends undefined | ((...args: never[]) => unknown) | symbol
    ? never
    : T extends { toJSON(): infer R }
    ? R
    : T extends object
    ? { [K in keyof T]: Jsonify<T[K]> }
    : never

// =============================================================================
// EXHAUSTIVE CHECK
// =============================================================================

/**
 * Ensure all cases are handled in switch/if.
 */
export function assertNever(value: never, message?: string): never {
    throw new Error(message ?? `Unexpected value: ${value}`)
}

/**
 * Exhaustive check without throwing.
 */
export function exhaustiveCheck(_value: never): void {
    // This function should never be called
}
