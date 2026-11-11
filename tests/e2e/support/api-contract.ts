import type { APIResponse } from '@playwright/test';
import Ajv, { type AnySchema, type ErrorObject } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

interface ContractValidationOptions {
  name?: string;
}

const draft7Validator = addFormats(
  new Ajv({
    allErrors: true,
    strict: true,
  }),
);

const draft2020Validator = addFormats(
  new Ajv2020({
    allErrors: true,
    strict: true,
  }),
);

const isJsonSchemaObject = (
  schema: unknown,
): schema is Record<string, unknown> => {
  return (
    typeof schema === 'object' && schema !== null && !Array.isArray(schema)
  );
};

const isJsonSchema = (schema: unknown): schema is AnySchema =>
  typeof schema === 'boolean' || isJsonSchemaObject(schema);

const validatorForSchema = (schema: AnySchema) => {
  if (
    isJsonSchemaObject(schema) &&
    typeof schema.$schema === 'string' &&
    schema.$schema.includes('2020-12')
  ) {
    return draft2020Validator;
  }

  return draft7Validator;
};

const formatError = (error: ErrorObject) => {
  const path = error.instancePath || '/';
  const detail =
    error.params['missingProperty'] === undefined
      ? error.message
      : `${error.message ?? ''}: ${String(error.params['missingProperty'])}`;

  return `${path} ${detail ?? 'failed schema validation'}`;
};

export const expectValueToMatchSchema = (
  value: unknown,
  schema: unknown,
  options: ContractValidationOptions = {},
): void => {
  const schemaValue: unknown = schema;
  if (!isJsonSchema(schemaValue)) {
    throw new Error(
      'API response contract schema must be a JSON Schema object or boolean',
    );
  }

  const validate = validatorForSchema(schemaValue).compile(schemaValue);

  if (validate(value)) {
    return;
  }

  const contractName = options.name ?? 'API response';
  const errors =
    validate.errors?.map(formatError).join('\n') ?? 'Unknown schema error';

  throw new Error(
    `${contractName} did not match its JSON Schema contract:\n${errors}`,
  );
};

export const expectJsonResponseToMatchSchema = async <T = unknown>(
  response: APIResponse,
  schema: AnySchema,
  options: ContractValidationOptions = {},
): Promise<T> => {
  const contentType = response.headers()['content-type'] ?? '';
  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  if (
    mediaType !== 'application/json' &&
    !(mediaType.startsWith('application/') && mediaType.endsWith('+json'))
  ) {
    throw new Error(
      `${options.name ?? 'API response'} returned content-type "${contentType}", not JSON`,
    );
  }

  const body = (await response.json()) as T;
  expectValueToMatchSchema(body, schema, options);

  return body;
};
