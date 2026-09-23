import type { DetailsProps } from './types.ts';

const Details = ({ id, title, inlineHelp }: Readonly<DetailsProps>) => (
  <details id={id} className='details'>
    <summary className='details-summary'>
      <span className='details-summary-title'>
        <i className='icon-chevron-right me-1' aria-hidden='true' />
        <span>{title}</span>
      </span>
    </summary>
    <div className='details-text'>{inlineHelp}</div>
  </details>
);

export default Details;
