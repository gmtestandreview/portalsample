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
