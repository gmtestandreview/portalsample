import * as yup from 'yup';
import { contactSchema } from '../../validationSchemas/contactValidation.ts';
import '../../validationSchemas/yupExtensions/index.ts';

const contactSubmitValidation = yup.object({
  contact: contactSchema(),
});

export default contactSubmitValidation;
