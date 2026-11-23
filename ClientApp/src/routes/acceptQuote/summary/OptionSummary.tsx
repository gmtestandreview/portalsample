import SummaryDisplay from '../../../components/SummaryDisplay';

interface OptionSummaryProps {
  legend: string;
  id: string;
  value: string | undefined;
  options: readonly { label: string; value: string }[];
}

/**
 * Read-only radio answer: the label of the chosen option, or nothing while
 * no answer was given. Form-free twin of `RadioButtonGroup` in summary mode.
 */
const OptionSummary = ({
  legend,
  id,
  value,
  options,
}: Readonly<OptionSummaryProps>) =>
  value ? (
    <SummaryDisplay
      label={legend}
      value={
        options.find((option) => option.value === value)?.label ??
        'No details added'
      }
      id={id}
      as='span'
    />
  ) : null;

export default OptionSummary;
