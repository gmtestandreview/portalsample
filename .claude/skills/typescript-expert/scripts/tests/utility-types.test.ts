import { describe, expect, it } from 'vitest';
import { err, none, ok, some } from '../../references/utility-types';
import type {
  Arguments,
  assertNever,
  AssertEqual,
  AsyncFunction,
  AtLeast,
  Brand,
  DeepMutable,
  DeepPartial,
  DeepReadonly,
  DeepRequired,
  ElementOf,
  exhaustiveCheck,
  FirstArgument,
  IsAny,
  IsNever,
  IsUnknown,
  Jsonify,
  Join,
  KeysOfType,
  Merge,
  NonEmptyArray,
  OmitByType,
  PartialBy,
  PathOf,
  PickByType,
  Promisify,
  ReadonlyBy,
  RequiredBy,
  Result,
  Split,
  Tuple,
  UnionToIntersection,
  UnionToTuple,
} from '../../references/utility-types';

type Assert<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

type Negative = Assert<IsNever<Tuple<string, -1>>>;
type Fractional = Assert<IsNever<Tuple<string, 1.5>>>;
type Oversized = Assert<IsNever<Tuple<string, 500>>>;
type OverBound = Assert<IsNever<Tuple<string, 65>>>;
type MaxBound = Assert<Equal<Tuple<string, 64>['length'], 64>>;
type NegativeAtLeast = Assert<IsNever<AtLeast<string, -1>>>;
type Two = Assert<Equal<Tuple<string, 2>, [string, string]>>;
type Broad = Assert<Equal<Tuple<string, number>, string[]>>;

type UserId = Brand<string, 'UserId'>;
type Branded = Assert<Equal<UserId, string & { readonly __brand: 'UserId' }>>;

type Nested = {
  readonly name: string;
  readonly address: {
    readonly postcode: string;
  };
};
type ReadonlyNested = Assert<
  Equal<DeepReadonly<{ name: string; address: { postcode: string } }>, Nested>
>;
type PartialNested = Assert<
  Equal<
    DeepPartial<{ name: string; address: { postcode: string } }>,
    {
      name?: string;
      address?: { postcode?: string };
    }
  >
>;
type RequiredNested = Assert<
  Equal<
    DeepRequired<{ name?: string; address?: { postcode?: string } }>,
    {
      name: string;
      address: { postcode: string };
    }
  >
>;
type MutableNested = Assert<
  Equal<DeepMutable<Nested>, { name: string; address: { postcode: string } }>
>;

type Person = { name: string; age: number; active: boolean };
type StringKeys = Assert<Equal<KeysOfType<Person, string>, 'name'>>;
type StringProperties = Assert<
  Equal<PickByType<Person, string>, { name: string }>
>;
type WithoutStrings = Assert<
  Equal<OmitByType<Person, string>, { age: number; active: boolean }>
>;
type OptionalName = Assert<
  Equal<PartialBy<Person, 'name'>['name'], string | undefined>
>;
type RequiredName = Assert<
  Equal<RequiredBy<{ name?: string; age: number }, 'name'>['name'], string>
>;
type ReadonlyName = Assert<Equal<ReadonlyBy<Person, 'name'>['name'], string>>;
type MergedId = Assert<
  Equal<
    Merge<
      { id: string; value: number },
      { value: boolean; label: string }
    >['id'],
    string
  >
>;
type MergedValue = Assert<
  Equal<
    Merge<
      { id: string; value: number },
      { value: boolean; label: string }
    >['value'],
    boolean
  >
>;
type MergedLabel = Assert<
  Equal<
    Merge<
      { id: string; value: number },
      { value: boolean; label: string }
    >['label'],
    string
  >
>;

type Elements = Assert<
  Equal<ElementOf<readonly [string, number]>, string | number>
>;
type NonEmpty = Assert<Equal<NonEmptyArray<number>, [number, ...number[]]>>;
type AtLeastTwo = Assert<
  Equal<AtLeast<string, 2>, [string, string, ...string[]]>
>;

type Handler = (id: string, retry?: boolean) => Promise<number>;
type HandlerArguments = Assert<
  Equal<Arguments<Handler>, [id: string, retry?: boolean]>
>;
type HandlerFirstArgument = Assert<Equal<FirstArgument<Handler>, string>>;
type HandlerAsync = Assert<
  Equal<AsyncFunction<(id: string) => number>, (id: string) => Promise<number>>
>;
type Promisified = Assert<
  Equal<Promisify<(id: string) => number>, (id: string) => Promise<number>>
>;
type AlreadyPromisified = Assert<Equal<Promisify<Handler>, Handler>>;

type SplitPath = Assert<
  Equal<Split<'users.profile.name', '.'>, ['users', 'profile', 'name']>
>;
type JoinedPath = Assert<
  Equal<Join<['users', 'profile', 'name'], '.'>, 'users.profile.name'>
>;
type ObjectPaths = Assert<
  Equal<
    PathOf<{
      id: number;
      profile: { name: string; settings: { theme: string } };
    }>,
    | 'id'
    | 'profile'
    | 'profile.name'
    | 'profile.settings'
    | 'profile.settings.theme'
  >
>;

type IntersectionId = Assert<
  Equal<UnionToIntersection<{ id: string } | { active: boolean }>['id'], string>
>;
type IntersectionActive = Assert<
  Equal<
    UnionToIntersection<{ id: string } | { active: boolean }>['active'],
    boolean
  >
>;
type UnionTupleLength = Assert<
  Equal<UnionToTuple<'draft' | 'published'>['length'], 2>
>;

type ResultShape = Assert<
  Equal<
    Result<string, Error>,
    { success: true; data: string } | { success: false; error: Error }
  >
>;
type EqualAlias = Assert<AssertEqual<{ value: string }, { value: string }>>;
type NeverCheck = Assert<IsNever<never>>;
type AnyCheck = Assert<IsAny<any>>;
type UnknownCheck = Assert<IsUnknown<unknown>>;
type NotUnknownCheck = Assert<Equal<IsUnknown<string>, false>>;

type JsonShape = Assert<
  Equal<
    Jsonify<{
      name: string;
      count: number;
      nested: { enabled: boolean };
      unsupported: () => void;
    }>,
    {
      name: string;
      count: number;
      nested: { enabled: boolean };
      unsupported: never;
    }
  >
>;

type AssertNeverSignature = Assert<
  Equal<typeof assertNever, (value: never, message?: string) => never>
>;
type ExhaustiveCheckSignature = Assert<
  Equal<typeof exhaustiveCheck, (value: never) => void>
>;

export type UtilityTypesCompileTimeAssertions = [
  Negative,
  Fractional,
  Oversized,
  OverBound,
  MaxBound,
  NegativeAtLeast,
  Two,
  Broad,
  Branded,
  ReadonlyNested,
  PartialNested,
  RequiredNested,
  MutableNested,
  StringKeys,
  StringProperties,
  WithoutStrings,
  OptionalName,
  RequiredName,
  ReadonlyName,
  MergedId,
  MergedValue,
  MergedLabel,
  Elements,
  NonEmpty,
  AtLeastTwo,
  HandlerArguments,
  HandlerFirstArgument,
  HandlerAsync,
  Promisified,
  AlreadyPromisified,
  SplitPath,
  JoinedPath,
  ObjectPaths,
  IntersectionId,
  IntersectionActive,
  UnionTupleLength,
  ResultShape,
  EqualAlias,
  NeverCheck,
  AnyCheck,
  UnknownCheck,
  NotUnknownCheck,
  JsonShape,
  AssertNeverSignature,
  ExhaustiveCheckSignature,
];

describe('utility type constructors', () => {
  it('constructs success and error results', () => {
    expect(ok('saved')).toEqual({ success: true, data: 'saved' });
    expect(err('failed')).toEqual({ success: false, error: 'failed' });
  });

  it('constructs present and absent options', () => {
    expect(some(42)).toEqual({ type: 'some', value: 42 });
    expect(none).toEqual({ type: 'none' });
  });
});
