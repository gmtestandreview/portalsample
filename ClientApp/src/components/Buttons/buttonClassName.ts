export const getButtonClassName = (
  variant = 'primary',
  className?: string,
) => {
  const variantClassName = variant.startsWith('btn')
    ? variant
    : `btn btn-${variant}`;

  return [variantClassName, className].filter(Boolean).join(' ');
};
