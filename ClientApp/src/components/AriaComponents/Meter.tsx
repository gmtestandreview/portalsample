'use client';
import { useLayoutEffect, useRef } from 'react';
import { Meter as AriaMeter, type MeterProps as AriaMeterProps } from 'react-aria-components/Meter';
import { Label } from '../forms/AriaForm/Form';
import './Meter.css';

export interface MeterProps extends AriaMeterProps {
  label?: string;
}

export function Meter({ label, ...props }: MeterProps) {
  const meterRef = useRef<HTMLDivElement>(null);

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
          <span className="value">{valueText}</span>
          <div className="track inset">
            <div
              className="fill"
              style={
                {
                  width: percentage + '%',
                  '--fill-color':
                    percentage < 70
                      ? 'var(--green)'
                      : percentage < 90
                        ? 'var(--orange)'
                        : 'var(--red)',
                } as any
              }
            />
          </div>
        </>
      )}
    </AriaMeter>
  );
}
