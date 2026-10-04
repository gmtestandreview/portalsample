import { Row, Col } from 'react-bootstrap';
import SelectInput from '../SelectInput';
import TextInput from '../TextInput';
import states from './constants';
import type { ManualAddressInputProps } from './types';
import { omitUndefined } from '../../../utils/omitUndefined';

const ManualAddressInput = (props: Readonly<ManualAddressInputProps>) => {
  const { name, disabled, ...rest } = props;
  return (
    <>
      <TextInput
        key={`${name}.line1`}
        name={`${name}.line1`}
        label='Address line 1'
        {...omitUndefined({ disabled })}
        {...rest}
      />
      <TextInput
        key={`${name}.line2`}
        name={`${name}.line2`}
        label='Address line 2'
        {...omitUndefined({ disabled })}
        {...rest}
      />
      <TextInput
        key={`${name}.line3`}
        name={`${name}.line3`}
        label='Address line 3'
        {...omitUndefined({ disabled })}
        {...rest}
      />
      <TextInput
        key={`${name}.suburb`}
        name={`${name}.suburb`}
        label='Suburb'
        {...omitUndefined({ disabled })}
        {...rest}
      />
      <Row>
        <Col md={6}>
          <TextInput
            key={`${name}.postcode`}
            name={`${name}.postcode`}
            label='Postcode'
            {...omitUndefined({ disabled })}
            {...rest}
          />
        </Col>
        <Col md={6}>
          <SelectInput<string>
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

export default ManualAddressInput;
