import HashLink from './hashLink';

const BackToTopButton = ({
    className = '',
    to = '#page-top',
}) => (
    <nav aria-labelledby='btt' className='position-fixed bottom-0 end-0'>
        <h3 id='btt' className='d-none'>Back to top navigation</h3>
        <HashLink
            to={to}
            className={`mb-3 me-3 btn btn-backtotop ${className} fade show`}
            aria='Back to top'
        >
            <i className='icon-arrow-up' aria-hidden='true' />
            <span className='d-none d-md-inline-block ms-1'>Back to top</span>
        </HashLink>
    </nav>
);

export default BackToTopButton;
