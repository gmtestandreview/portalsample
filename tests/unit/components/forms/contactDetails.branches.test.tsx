import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import ContactDetails from '@/components/forms/CommonForms/ContactDetails';

const customLabels = {
    titleLabel: 'Salutation',
    firstNameLabel: 'Given names',
    lastNameLabel: 'Family name',
    roleLabel: 'Position',
    businessPhoneLabel: 'Office number',
    mobilePhoneLabel: 'Mobile number',
    emailAddressLabel: 'Work email',
};

describe('ContactDetails branch coverage', () => {
    it('renders all supplied labels in edit mode', () => {
        render(
            <Formik
                initialValues={{
                    contact: {
                        title: '',
                        titleOther: '',
                        firstName: '',
                        lastName: '',
                        role: '',
                        phone: '',
                        mobile: '',
                        email: '',
                    },
                    organisationAndContact: { contact: { title: '' } },
                }}
                initialStatus={{ hidden: {} }}
                onSubmit={vi.fn()}
            >
                <ContactDetails name='contact' {...customLabels} />
            </Formik>,
        );

        for (const label of Object.values(customLabels)) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
    });

    it('omits the empty-title fallback when a summary has a title', () => {
        render(
            <Formik
                initialValues={{
                    contact: {
                        title: 'Dr',
                        titleOther: '',
                        firstName: 'Alex',
                        lastName: 'Smith',
                        role: 'Scientist',
                        phone: '0299999999',
                        mobile: '0400000000',
                        email: 'alex@example.test',
                    },
                    organisationAndContact: { contact: { title: 'Dr' } },
                }}
                initialStatus={{ hidden: {} }}
                onSubmit={vi.fn()}
            >
                <ContactDetails name='contact' isSummary {...customLabels} />
            </Formik>,
        );

        expect(screen.getByText('Dr')).toBeInTheDocument();
    });
});
