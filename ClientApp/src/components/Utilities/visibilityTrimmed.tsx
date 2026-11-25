import React from 'react';

export interface VisibleProps {
  isVisible: boolean;
}

/**
 * Conditionally renders its children based on the isVisible prop.
 * @param props VisibleProps
 * @returns jsx
 */
const VisibilityTrimmed = (props: React.PropsWithChildren<VisibleProps>) => {
  const { children } = props;

  return <>{props.isVisible && children}</>;
};

export default VisibilityTrimmed;
