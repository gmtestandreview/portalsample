import { Row, Col } from 'react-bootstrap';
import RhfSelectInput from '../RhfSelectInput';
import RhfTextInput from '../RhfTextInput';
import states from '../AddressLookup/constants';
import type { ManualAddressInputProps } from '../AddressLookup/types';
import { omitUndefined } from '../../../utils/omitUndefined';

/**
 * React Hook Form counterpart of `ManualAddressInput`: the same six address
 * fields stored under `${name}.*`, so it must render inside a `FormProvider`.
 */
const RhfManualAddressInput = (props: Readonly<ManualAddressInputProps>) => {
  const { name, disabled, ...rest } = props;
  return (
    <>
      <RhfTextInput
        key={`${name}.line1`}
        name={`${name}.line1`}
        label='Address line 1'
        {...omitUndefined({ disabled })}
        {...rest}
      />
      <RhfTextInput
        key={`${name}.line2`}
        name={`${name}.line2`}
        label='Address line 2'
        {...omitUndefined({ disabled })}
        {...rest}
      />
      <RhfTextInput
        key={`${name}.line3`}
        name={`${name}.line3`}
        label='Address line 3'
        {...omitUndefined({ disabled })}
        {...rest}
      />
      <RhfTextInput
        key={`${name}.suburb`}
        name={`${name}.suburb`}
        label='Suburb'
        {...omitUndefined({ disabled })}
        {...rest}
      />
      <Row>
        <Col md={6}>
          <RhfTextInput
            key={`${name}.postcode`}
            name={`${name}.postcode`}
            label='Postcode'
            {...omitUndefined({ disabled })}
            {...rest}
          />
        </Col>
        <Col md={6}>
          <RhfSelectInput<string>
            key={`${name}.state`}
            name={`${name}.state`}
            label='State'
            options={states}
            addBlank
            {...omitUndefined({ disabled })}
            {...rest}
          />
        </Col>
      </Row>
    </>
  );
};

export default RhfManualAddressInput;
