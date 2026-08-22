import type { ReactNode } from 'react';
import { Spinner } from 'react-bootstrap';
import './index.scss';

interface BlockUISpinnerProps {
    children: ReactNode;
    partial?: boolean;
}

const BlockUISpinner = ({ children, partial } : BlockUISpinnerProps) => {
    const renderSpinner = () => (
        <>
            <Spinner animation='border' className='spinner' />
            {children}
        </>
    );
    if (partial) {
        return (
            <div className='partial children mx-auto w-100 h-100 text-center' role='alert' aria-live='polite'>
                {renderSpinner()}
            </div>
        );
    }
    return (
        <div className='block-ui vh-100' role='alert' aria-live='assertive'>
            <div className='children'>
                {renderSpinner()}
            </div>
        </div>
    );
};

export default BlockUISpinner;
