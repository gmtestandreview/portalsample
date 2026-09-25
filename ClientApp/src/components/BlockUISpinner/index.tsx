import type { ReactNode } from 'react';
import { Spinner } from 'react-bootstrap';
import './index.scss';

interface BlockUISpinnerProps {
    children: ReactNode;
    partial?: boolean;
}

/**
 * A spinner component that blocks the UI and displays a loading indicator. 
 * Blocks the entire viewport or a specific section of the UI based on the `partial` prop.
 * 
 * @param {BlockUISpinnerProps} param0 - Component props
 * @param {ReactNode} param0.children - The content to display alongside the spinner.
 * @param {boolean} [param0.partial=false] - If true, blocks only a specific section of the UI; otherwise, blocks the entire viewport.
 * @param param0 
 * @returns {JSX.Element} Rendered spinner element
 * 
 */

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
