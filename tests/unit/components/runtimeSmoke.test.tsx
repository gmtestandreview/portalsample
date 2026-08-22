import { render, screen } from '@testing-library/react';
import { AlertInfo } from '@/components/Alert';
import { CustomAccordion, CustomAccordionBody } from '@/components/Accordion';

describe('runtime smoke coverage for restored local type modules', () => {
    it('renders AlertInfo', () => {
        render(<AlertInfo>Informational alert</AlertInfo>);
        expect(screen.getByText('Informational alert')).toBeInTheDocument();
    });

    it('renders CustomAccordion with a body section', () => {
        render(
            <CustomAccordion id='accordion'>
                <CustomAccordionBody name='Section title' eventKey='0'>
                    Accordion content
                </CustomAccordionBody>
            </CustomAccordion>,
        );

        expect(screen.getByText('Section title')).toBeInTheDocument();
        expect(screen.getByText('Accordion content')).toBeInTheDocument();
    });
});
