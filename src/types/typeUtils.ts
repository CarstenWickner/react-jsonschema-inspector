/**
 * "keyof" may return only "string | number", this will provide list of all keys that are specifically mentioned even if others are allowed too.
 * Copied from: https://github.com/microsoft/TypeScript/issues/25987
 */
export type KnownKeys<T> = {
    [K in keyof T]: string extends K ? never : number extends K ? never : K;
} extends { [_ in keyof T]: infer U }
    ? Record<string, unknown> extends U
        ? never
        : U
    : never;

/**
 * Collects all (known) keys of the given type that extend the desired value type.
 */
export type KeysWithValueType<T, V> = {
    [K in KnownKeys<T>]: V extends T[K] ? K : never;
}[KnownKeys<T>];
