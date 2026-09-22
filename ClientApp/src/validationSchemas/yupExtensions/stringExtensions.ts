import * as Yup from "yup";
import { NotEmpty } from "../common.ts";

const buildErrMsg = (
	label: string | undefined,
	errorMessage: string | undefined,
	labelMessage: (l: string) => string,
	fallback: string,
): string => {
	if (typeof errorMessage === "string" && errorMessage) return errorMessage;
	if (typeof label === "string" && label) return labelMessage(label);
	return fallback;
};

declare module "yup" {
	export interface StringSchema {
		fixedDigits(
			digits: number,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		numbersOnly(label?: string, errorMessage?: string): StringSchema;
		minValue(
			minValue: number,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		maxValue(
			maxValue: number,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		decimalNumbersOnly(label?: string, errorMessage?: string): StringSchema;
		postcode(label?: string, errorMessage?: string): StringSchema;
		phone(
			mobileOnly?: boolean,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		email(label?: string, errorMessage?: string): StringSchema;
		minEntered(
			minLength: number,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		addressFormat(label?: string, errorMessage?: string): StringSchema;
		allowedFormat(
			extended?: boolean,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		nameAllowedFormat(
			extended?: boolean,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		businessName(label?: string, errorMessage?: string): StringSchema;
		noConsecutiveChars(
			threshold?: number,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		atLeastOneChar(label?: string, errorMessage?: string): StringSchema;
		noConsecutivePuncuation(
			label?: string,
			errorMessage?: string,
		): StringSchema;
		numberWithinRange(
			minValue: number,
			maxValue: number,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		maxLength(
			maxValue: number,
			label?: string,
			errorMessage?: string,
		): StringSchema;
		isRequired(label?: string, errorMessage?: string): StringSchema;
	}
}

const YUP_FIXEDDIGITS_METHOD = "fixedDigits";
const YUP_NUMBERSONLY_METHOD = "numbersOnly";
const YUP_MINVALUE_METHOD = "minValue";
const YUP_MAXVALUE_METHOD = "maxValue";
const YUP_DECIMALNUMBERSONLY_METHOD = "decimalNumbersOnly";
const YUP_AUSTPOSTCODE_METHOD = "postcode";
const YUP_PHONE_METHOD = "phone";
const YUP_EMAIL_METHOD = "email";
const YUP_MINENTERED_METHOD = "minEntered";
const YUP_ADDRESSFORMAT_METHOD = "addressFormat";
const YUP_ALLOWEDFORMAT_METHOD = "allowedFormat";
const YUP_NAMEALLOWEDFORMAT_METHOD = "nameAllowedFormat";
const YUP_BUSINESSNAME_METHOD = "businessName";
const YUP_NOCONSECUTIVECHARS_METHOD = "noConsecutiveChars";
const YUP_ATLEASTONECHAR_METHOD = "atLeastOneChar";
const YUP_NOCONSECUTIVEPUNCUATION_METHOD = "noConsecutivePuncuation";
const YUP_NUMBERWITHINRANGE_METHOD = "numberWithinRange";
const YUP_MAXLENGTH_METHOD = "maxLength";
const YUP_REQUIREDWITHTRIM_METHOD = "isRequired";

let yupStringExtensionsRegistered = false;

const STANDARD_LANDLINE_PHONE_REGEX = /^(?:\+61 ?|0)[2-47-8] ?\d{4} ?\d{4}$/u;
const LONG_SERVICE_PHONE_REGEX = /^1[38]00 ?\d{3} ?\d{3}$/u;
const SHORT_SERVICE_PHONE_REGEX = /^13 ?\d{2} ?\d{2}$/u;
const MOBILE_PHONE_REGEX = /^(?:\+61 ?|0)4\d{2} ?\d{3} ?\d{3}$/u;
const BUSINESS_PHONE_REGEXES = [
	STANDARD_LANDLINE_PHONE_REGEX,
	LONG_SERVICE_PHONE_REGEX,
	SHORT_SERVICE_PHONE_REGEX,
	MOBILE_PHONE_REGEX,
] as const;

const matchesAnyPhonePattern = (value: string, patterns: readonly RegExp[]) =>
	patterns.some((pattern) => pattern.test(value));

export const registerYupStringExtensions = () => {
	if (yupStringExtensionsRegistered) {
		return;
	}

	yupStringExtensionsRegistered = true;

	Yup.addMethod(
		Yup.string,
		YUP_FIXEDDIGITS_METHOD,

		function yupFixedDigits(
			digits: number,
			label?: string,
			errorMessage?: string,
		) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} must be ${digits} digits`,
				`\${path} must be ${digits} digits`,
			);

			return this.test(
				YUP_FIXEDDIGITS_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						const regExStr = String.raw`^(?:\d{0}|\d{${digits}})$`;

						return value.match(regExStr) !== null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_NUMBERSONLY_METHOD,

		function yupNumbersOnly(label?: string, errorMessage?: string) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} must only include numbers`,
				"${path} must only include numbers",
			);

			return this.test(
				YUP_NUMBERSONLY_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						const regExStr = /^[\d\b]+$/u;

						return value.match(regExStr) !== null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_MINVALUE_METHOD,

		function yupMinValue(
			minValue: number,
			label?: string,
			errorMessage?: string,
		) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} cannot be less than ${minValue} characters`,
				`\${path} cannot be less than ${minValue} characters`,
			);

			return this.test(
				YUP_MINVALUE_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						const regExStr = /^[\d\b]+$/u;

						if (value.match(regExStr) !== null) {
							const inputValue = Number.parseInt(value, 10);
							return inputValue >= minValue;
						}

						return false;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_MAXVALUE_METHOD,

		function yupMaxValue(
			maxValue: number,
			label?: string,
			errorMessage?: string,
		) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} cannot be greater than ${maxValue} characters`,
				`\${path} cannot be greater than ${maxValue} characters`,
			);

			return this.test(
				YUP_MAXVALUE_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						const regExStr = /^[\d\b]+$/u;

						if (value.match(regExStr) !== null) {
							const inputValue = Number.parseInt(value, 10);
							return inputValue <= maxValue;
						}

						return false;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_DECIMALNUMBERSONLY_METHOD,

		function yupDecimalNumbersOnly(label?: string, errorMessage?: string) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} must only include numbers`,
				"${path} must only include numbers",
			);

			return this.test(
				YUP_DECIMALNUMBERSONLY_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						const regExStr = /^-?\d+\.?\d*$/u;

						return value.match(regExStr) !== null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_AUSTPOSTCODE_METHOD,

		function yupPostcode(label?: string, errorMessage?: string) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} is not a valid Australian postcode`,
				"${path} is not a valid Australian postcode",
			);

			return this.test(
				YUP_AUSTPOSTCODE_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						if (NotEmpty(value)) {
							const num = Number.parseInt(value, 10);
							if (
								!Number.isNaN(num) &&
								value.length === 4 &&
								((num >= 200 && num <= 299) || (num >= 800 && num <= 9999))
							) {
								return true;
							}
							return false;
						}
						return true;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_ADDRESSFORMAT_METHOD,
		function yupAddress(label?: string, errorMessage?: string) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} contains invalid characters`,
				"${path} contains invalid characters",
			);

			return this.test(
				YUP_ADDRESSFORMAT_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						const regExStr = /^[\dA-Z '()/&,."-]*$/u;
						return value.match(new RegExp(regExStr, "iu")) !== null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_PHONE_METHOD,

		function yupPhone(
			mobileOnly?: boolean,
			label?: string,
			errorMessage?: string,
		) {
			const errType =
				mobileOnly === undefined || mobileOnly === false
					? "is not a valid phone number"
					: "is not a valid mobile number";

			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} ${errType}`,
				`\${path} ${errType}`,
			);

			return this.test(
				YUP_PHONE_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						if (typeof value !== "string") {
							return false;
						}

						if (mobileOnly === undefined || mobileOnly === false) {
							return matchesAnyPhonePattern(value, BUSINESS_PHONE_REGEXES);
						}

						return MOBILE_PHONE_REGEX.test(value);
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	/**
	 * Local part: dot-separated runs of permitted characters. `.` is absent from the
	 * class, so it is a hard separator - there is exactly one way to split the
	 * input and the match is linear.
	 */
	const EmailLocalPart =
		/^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~]+)*$/u;

	/** A single DNS label, already split on `.`. One character class, so linear. */
	const DnsLabel = /^[a-zA-Z0-9-]+$/u;

	/** RFC 1035: labels are capped at 63 characters. */
	const MaxLabelLength = 63;

	/**
	 * Validates an email address without regex backtracking.
	 *
	 * The previous single-regex form was vulnerable to catastrophic backtracking
	 * (`typescript:S5852`): in `(-*\.?[a-zA-Z0-9-]){0,62}` both `-*` and the
	 * character class match `-`, so a run of hyphens could be split exponentially
	 * many ways. A 34-character address took ~18s. These schemas are shared with a
	 * Node backend, where one stalled request stalls the whole event loop.
	 *
	 * Splitting on the structural characters first means each part is matched by an
	 * unambiguous pattern, so validation is linear in the length of the input.
	 */
	const isValidEmailAddress = (value: string): boolean => {
		const at = value.indexOf("@");
		// Need exactly one `@`, and a non-empty local part before it.
		if (at < 1 || value.includes("@", at + 1)) {
			return false;
		}

		if (!EmailLocalPart.test(value.slice(0, at))) {
			return false;
		}

		const labels = value.slice(at + 1).split(".");
		// A bare host is not enough; a domain needs at least one dot.
		if (labels.length < 2) {
			return false;
		}

		const tld = labels.at(-1) ?? "";
		if (tld.length < 2 || !/^[a-zA-Z]/u.test(tld)) {
			return false;
		}

		return labels.every(
			(label) =>
				label.length > 0 &&
				label.length <= MaxLabelLength &&
				DnsLabel.test(label) &&
				!label.startsWith("-") &&
				!label.endsWith("-"),
		);
	};

	Yup.addMethod(
		Yup.string,
		YUP_EMAIL_METHOD,

		function yupEmail(label?: string, errorMessage?: string) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} is not a valid email address`,
				"${path} is not a valid email address",
			);

			return this.test(
				YUP_EMAIL_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						return isValidEmailAddress(value);
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_NOCONSECUTIVEPUNCUATION_METHOD,

		function yupConsPunc(label?: string, errorMessage?: string) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) =>
					`${l} must not contain consecutive apostrophe, hyphen or space characters`,
				"${path} must not contain consecutive apostrophe, hyphen or space characters",
			);

			return this.test(
				YUP_NOCONSECUTIVEPUNCUATION_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						const regExStr = "([ '\u2019\\-\u2013\u2014])\\1+";
						return value.match(new RegExp(regExStr, "iu")) === null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_ATLEASTONECHAR_METHOD,
		function yupOneChar(label?: string, errorMessage?: string) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} must contain at least one letter`,
				"${path} must contain at least one letter",
			);

			return this.test(
				YUP_ATLEASTONECHAR_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						const regExStr = "(?=.*[a-z])";
						return value.match(new RegExp(regExStr, "iu")) !== null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_REQUIREDWITHTRIM_METHOD,
		function isRequired(label?: string, errorMessage?: string) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} is required`,
				"${path} is required",
			);

			return this.test(
				YUP_REQUIREDWITHTRIM_METHOD,
				errMsg,
				(value: string | undefined, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							!isNullable &&
							(value === null || value === undefined || value.trim() === "")
						) {
							return false;
						}

						return value !== null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_NOCONSECUTIVECHARS_METHOD,
		function yupConsChars(
			threshold?: number,
			label?: string,
			errorMessage?: string,
		) {
			let numChars = threshold ?? 3;
			if (numChars < 2) {
				numChars = 2;
			}
			numChars -= 1;

			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} cannot have more than ${numChars} repeating characters`,
				`\${path} cannot have more than ${numChars} repeating characters`,
			);

			return this.test(
				YUP_NOCONSECUTIVECHARS_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						let numCharsTest = threshold ?? 3;
						if (numCharsTest < 2) {
							numCharsTest = 2;
						}
						numCharsTest -= 1;
						const consecutiveCharsRegex = String.raw`([a-z])\1{${numCharsTest},}`;
						return (
							value.match(new RegExp(consecutiveCharsRegex, "iu")) === null
						);
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_ALLOWEDFORMAT_METHOD,
		function yupAllowedFormat(
			extended?: boolean,
			label?: string,
			errorMessage?: string,
		) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) =>
					`${l} has invalid characters. Please use only letters, periods, numbers, and keyboard characters`,
				"${path} has invalid characters. Please use only letters, periods, numbers, and keyboard characters",
			);

			return this.test(
				YUP_ALLOWEDFORMAT_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}
						// /[0-9a-zA-Z$ :%,;*,"@&?'#=~/\\_\-|(){}]$/
						const regExStr =
							extended !== undefined && extended === false
								? /^[-–—0-9A-Za-z ‘.&#,]*$/u
								: /^[!-~\s\u2013\u2014\u2019\u2018\u201C\u201D]*$/u;

						return value.match(regExStr) !== null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_NAMEALLOWEDFORMAT_METHOD,
		function yupNameAllowedFormat(
			extended?: boolean,
			label?: string,
			errorMessage?: string,
		) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) =>
					`${l} has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen`,
				"${path} has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen",
			);

			return this.test(
				YUP_NAMEALLOWEDFORMAT_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}
						// /[a-zA-Z '\-]$/
						const regExStr =
							extended !== undefined && extended === false
								? /^[-–—A-Za-z ‘]*$/u
								: /[0-9a-zA-Z$ :%,;*\u2013\u2014\u2019\u201C\u201D"@&?'#=~/\\_\-|(){}]$/u;

						return value.match(regExStr) !== null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_BUSINESSNAME_METHOD,
		function yupBusinessName(label?: string, errorMessage?: string) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} contains invalid characters`,
				"${path} contains invalid characters",
			);

			return this.test(
				YUP_BUSINESSNAME_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						// RULE-035: BA sign-off required — do not change during migration.
						// OPEN-ITEMS-BACKLOG P2 item 16 asks whether business names may contain '&' and
						// whether this ASIC-aligned charset is correct. The charset below does permit '&'.
						// based on the CompanyName rule in https://download.asic.gov.au/media/jdchdnzn/message-implementation-guide-for-brs-v1-7.pdf
						const regExStr = /^[A-Za-z0-9!@#$%^&*()?;:=_\-/.,'{}| "]+$/u;
						return value.match(regExStr) !== null;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_MINENTERED_METHOD,
		function yupMinEntered(
			minLength: number,
			label?: string,
			errorMessage?: string,
		) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} cannot be less than ${minLength} characters`,
				`\${path} cannot be less than ${minLength} characters`,
			);

			return this.test(
				YUP_MINENTERED_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						return value.length >= minLength;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_NUMBERWITHINRANGE_METHOD,
		function yupNumberWithinRange(
			minValue: number,
			maxValue: number,
			label?: string,
			errorMessage?: string,
		) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} must be between ${minValue} and ${maxValue}`,
				`\${path} must be between ${minValue} and ${maxValue}`,
			);

			return this.test(
				YUP_NUMBERWITHINRANGE_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						const numberValue: number = Number.parseFloat(value);

						return numberValue >= minValue && numberValue <= maxValue;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);

	Yup.addMethod(
		Yup.string,
		YUP_MAXLENGTH_METHOD,
		function yupMaxLengthMethod(
			maxLength: number,
			label?: string,
			errorMessage?: string,
		) {
			const errMsg = buildErrMsg(
				label,
				errorMessage,
				(l) => `${l} cannot be greater than ${maxLength} characters`,
				`\${path} cannot be greater than ${maxLength} characters`,
			);

			return this.test(
				YUP_MAXLENGTH_METHOD,
				errMsg,
				(value: any, context?: Yup.TestContext | object) => {
					try {
						const isNullable =
							context && (context as Yup.TestContext).schema.spec.nullable;
						if (
							(isNullable && value === null) ||
							value === undefined ||
							value === ""
						) {
							return true;
						}

						return value.length <= maxLength;
					} catch {
						/* c8 ignore next -- defensive fallback for malformed Yup internals; public Yup validation cannot construct this state */
						return false;
					}
				},
			);
		},
	);
};
