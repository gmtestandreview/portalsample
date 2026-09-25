import HashLink from './hashLink';

const SkipLinks = () => (
    <div id='page-top' tabIndex={-1}>
        <h1 className='d-none' aria-hidden='true'>{document.title || 'NMI Services portal'}</h1>
        <nav className='noindex' aria-labelledby='skiplink-title'>
            <div className='d-flex justify-content-center'>
                <h2 id='skiplink-title' className='visually-hidden' aria-hidden='true'>In page nav</h2>
                <HashLink
                    to='#main'
                    scrollToBlock='start'
                    className='btn btn-skiplinks position-absolute mx-auto visually-hidden-focusable'
                >
                    <span>
                        Skip to main content
                    </span>
                </HashLink>
            </div>
        </nav>
    </div>
);

export default SkipLinks;
