import type React from 'react';

interface ProgressBarProps {
    percent: number;
    status: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent, status }) => (
    <div role='progressbar' className='w-100 mt-2'>
        <h3 className='d-flex justify-content-between mb-1 h5'>
            <span>{status}</span>
            <span>
                {` ${percent}%`}
            </span>
        </h3>
        <div
            className='w-100 bg-light rounded-pill overflow-hidden'
            style={{
                height: 24,
            }}
        >
            <div
                className='h-100 bg-primary rounded-pill'
                style={{
                    width: `${percent}%`,
                    transition: 'width 0.3s ease',
                }}
            />
        </div>
    </div>
);

export default ProgressBar;
