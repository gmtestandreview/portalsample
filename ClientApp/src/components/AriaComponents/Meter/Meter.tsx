'use client';
import { useLayoutEffect, useRef } from 'react';
import {
  Meter as AriaMeter,
  type MeterProps as AriaMeterProps,
} from 'react-aria-components/Meter';
import { Label } from '../Form/Form';
import './Meter.css';

export interface MeterProps extends AriaMeterProps {
  label?: string;
}

export function Meter({ label, ...props }: Readonly<MeterProps>) {
  const meterRef = useRef<HTMLDivElement>(null);

  const getFillColor = (percentage: number) => {
    if (percentage < 70) {
      return 'var(--green)';
    }

    if (percentage < 90) {
      return 'var(--orange)';
    }

    return 'var(--red)';
  };

  useLayoutEffect(() => {
    // React Aria emits a fallback role list (`meter progressbar`) for older
    // browsers. Modern accessibility tooling expects the supported role only.
    meterRef.current?.setAttribute('role', 'meter');
  });

  return (
    <AriaMeter {...props} ref={meterRef}>
      {({ percentage, valueText }) => (
        <>
          <Label>{label}</Label>
          <span className='value'>{valueText}</span>
          <div className='track inset'>
            <div
              className='fill'
              style={
                {
                  width: percentage + '%',
                  '--fill-color': getFillColor(percentage),
                } as any
              }
            />
          </div>
        </>
      )}
    </AriaMeter>
  );
}
