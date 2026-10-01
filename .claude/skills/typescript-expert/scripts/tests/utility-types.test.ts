import type { AtLeast, Tuple } from "../../references/utility-types"

type Assert<T extends true> = T
type IsNever<T> = [T] extends [never] ? true : false
type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2)
        ? true
        : false

type Negative = Assert<IsNever<Tuple<string, -1>>>
type Fractional = Assert<IsNever<Tuple<string, 1.5>>>
type Oversized = Assert<IsNever<Tuple<string, 500>>>
type OverBound = Assert<IsNever<Tuple<string, 65>>>
type MaxBound = Assert<Equal<Tuple<string, 64>["length"], 64>>
type NegativeAtLeast = Assert<IsNever<AtLeast<string, -1>>>
type Two = Assert<Equal<Tuple<string, 2>, [string, string]>>
type Broad = Assert<Equal<Tuple<string, number>, string[]>>
