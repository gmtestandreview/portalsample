/**
 * ButtonGroup Component
 * Provides a flexible layout for grouping two buttons, typically used for actions that are related but distinct.
 * The component accepts two functions as props, `left` and `right`, which return the JSX for the left and right buttons respectively.
 * This allows for dynamic rendering of buttons based on the current state or props of the parent component.
 *
 * @param {ButtonGroupProps} props - Component props
 * @param {() => JSX.Element} props.left - Function that returns the JSX for the left button.
 * @param {() => JSX.Element} props.right - Function that returns the JSX for the right button.
 * @returns {JSX.Element} Rendered button group element 
 * 
 */

export interface ButtonGroupProps {
    left: () => JSX.Element,
    right: () => JSX.Element,
}

const ButtonGroup = (props: ButtonGroupProps) => {
    const { left, right } = props;
    return (
        <div className='d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
            {left()}
            {right()}
        </div>
    );
};

export default ButtonGroup;
