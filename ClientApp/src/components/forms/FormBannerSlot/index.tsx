import { isValidElement } from 'react';
import type { ReactNode } from 'react';
import FormBanner from '../FormBanner';
import type { DiscardProps } from '../types';
import { omitUndefined } from '../../../utils/omitUndefined';

interface FormBannerSlotProps {
  /** A caller-supplied banner replaces the standard one. */
  banner?: ReactNode;
  showBanner?: boolean | undefined;
  title?: string | undefined;
  refTitle?: string | undefined;
  subTitle?: string | undefined;
  showGoToDashboardButton?: boolean | undefined;
  discard?: DiscardProps | undefined;
  /** Shows Save and exit in the banner. Defaults to true. */
  canSaveDraft?: boolean | undefined;
}

/**
 * The banner of a form shell. It holds no form-library state: Save and exit
 * adapts to the surrounding shell itself, so Formik and RHF shells share it.
 */
const FormBannerSlot = ({
  banner,
  showBanner,
  title,
  refTitle,
  subTitle,
  showGoToDashboardButton,
  discard,
  canSaveDraft,
}: Readonly<FormBannerSlotProps>) => {
  if (isValidElement(banner)) {
    return banner;
  }

  if (!showBanner) {
    return null;
  }

  return (
    <FormBanner
      {...omitUndefined({
        title,
        refTitle,
        subTitle,
        showGoToDashboardButton,
        discard,
      })}
      showSaveAndExitButton={canSaveDraft ?? true}
    />
  );
};

export default FormBannerSlot;
