import type { APIResponse } from '@playwright/test';
import Ajv, { type AnySchema, type ErrorObject } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

type ContractValidationOptions = {
    name?: string;
};

const draft7Validator = addFormats(new Ajv({
    allErrors: true,
    strict: true,
}));

const draft2020Validator = addFormats(new Ajv2020({
    allErrors: true,
    strict: true,
}));

const isJsonSchemaObject = (schema: AnySchema): schema is Record<string, unknown> => (
    typeof schema === 'object' && schema !== null && !Array.isArray(schema)
);

const validatorForSchema = (schema: AnySchema) => {
    if (
        isJsonSchemaObject(schema)
        && typeof schema.$schema === 'string'
        && schema.$schema.includes('2020-12')
    ) {
        return draft2020Validator;
    }

    return draft7Validator;
};

const formatError = (error: ErrorObject) => {
    const path = error.instancePath || '/';
    const detail = error.params.missingProperty === undefined
        ? error.message
        : `${error.message}: ${error.params.missingProperty}`;

    return `${path} ${detail ?? 'failed schema validation'}`;
};

export const expectValueToMatchSchema = (
    value: unknown,
    schema: AnySchema,
    options: ContractValidationOptions = {},
): void => {
    const validate = validatorForSchema(schema).compile(schema);

    if (validate(value)) {
        return;
    }

    const contractName = options.name ?? 'API response';
    const errors = validate.errors?.map(formatError).join('\n') ?? 'Unknown schema error';

    throw new Error(`${contractName} did not match its JSON Schema contract:\n${errors}`);
};

export const expectJsonResponseToMatchSchema = async <T = unknown>(
    response: APIResponse,
    schema: AnySchema,
    options: ContractValidationOptions = {},
): Promise<T> => {
    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
        throw new Error(
            `${options.name ?? 'API response'} returned content-type "${contentType}", not JSON`,
        );
    }

    const body = await response.json() as T;
    expectValueToMatchSchema(body, schema, options);

    return body;
};
