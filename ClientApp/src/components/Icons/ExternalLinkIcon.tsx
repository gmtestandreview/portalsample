 

interface ClassName {
    className?: string
}

const ExternalLinkIcon = ({ className }: ClassName) => (
    <svg className={className} aria-hidden='true' focusable='false' width='16px' height='17px' viewBox='0 0 16 17' fill='currentColor' xmlns='http://www.w3.org/2000/svg'>
        <path fillRule='evenodd' clipRule='evenodd' d='M0 16.5V0.5H6.62532V2.49977H1.8927V14.5002H13.2506V9.49989H15.1433V16.5H0ZM5.95579 8.7925L11.9124 2.49978H9.46437V0.5H15.1433V6.50023H13.2506V3.91366L7.29397 10.2073L5.95579 8.7925ZM13.2507 2.50067V2.49977H13.2498L13.2507 2.50067Z' fill='currentColor' />
    </svg>
);
export default ExternalLinkIcon;
