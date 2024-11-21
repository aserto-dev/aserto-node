// https://stackoverflow.com/a/72810677
// Extend existing types to make specific fields optional.
type NestedKeys<T extends string, U extends string[]> = {
  [K in keyof U]: U[K] extends `${T}.${infer V}` ? V : never;
};
export type NestedOptional<T, U extends string[]> = {
  [K in keyof T as K extends U[number] ? K : never]?: T[K];
} & {
  [K in keyof T as K extends U[number] ? never : K]: K extends string
    ? NestedOptional<T[K], NestedKeys<K, U>>
    : T[K];
};

export type NestedOmit<T, K extends PropertyKey> = {
  [P in keyof T as P extends K ? never : P]: NestedOmit<
    T[P],
    K extends `${Exclude<P, symbol>}.${infer R}` ? R : never
  >;
};

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
