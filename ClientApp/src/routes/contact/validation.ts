import * as yup from 'yup';
import { contactSchema } from '../../validationSchemas/contactValidation';
import '../../validationSchemas/yupExtensions';

const contactSubmitValidation = yup.object({
    contact: contactSchema(),
});

export default contactSubmitValidation;
