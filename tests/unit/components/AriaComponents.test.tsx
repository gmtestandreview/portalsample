import {Time} from '@internationalized/date';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {Heading, Text} from '@/components/AriaComponents/Content';
import {Link} from '@/components/AriaComponents/Link';
import {ListBox, ListBoxItem} from '@/components/AriaComponents/ListBox';
import {Meter} from '@/components/AriaComponents/Meter';
import {Check, ChevronDown} from '@/components/AriaComponents/NmiIcon';
import {NumberField} from '@/components/AriaComponents/NumberField';
import {ProgressBar} from '@/components/AriaComponents/ProgressBar';
import {ProgressCircle} from '@/components/AriaComponents/ProgressCircle';
import {SearchField} from '@/components/AriaComponents/SearchField';
import {SegmentedControl, SegmentedControlItem} from '@/components/AriaComponents/SegmentedControl';
import {Separator} from '@/components/AriaComponents/Separator';
import {Switch} from '@/components/AriaComponents/Switch';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from '@/components/AriaComponents/Tabs';
import {Tag, TagGroup} from '@/components/AriaComponents/TagGroup';
import {TextArea, TextField} from '@/components/AriaComponents/TextField';
import {TimeField} from '@/components/AriaComponents/TimeField';
import {ToggleButton} from '@/components/AriaComponents/ToggleButton';
import {ToggleButtonGroup} from '@/components/AriaComponents/ToggleButtonGroup';
import {Toolbar} from '@/components/AriaComponents/Toolbar';

if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = vi.fn(() => []);
}

describe('React Aria evaluation wrappers', () => {
    it('renders content, links, separators, and icons through their public wrappers', () => {
        const {container} = render(
            <>
                <Heading level={2}>Calibration services</Heading>
                <Text slot='description'>Choose a service type</Text>
                <Link href='https://measurement.gov.au'>NMI</Link>
                <Separator orientation='vertical' />
                <Check data-testid='decorative-icon' size={20} className='status-icon' />
                <ChevronDown aria-label='Expand services' />
            </>,
        );

        expect(screen.getByRole('heading', {level: 2, name: 'Calibration services'})).toBeInTheDocument();
        expect(screen.getByText('Choose a service type')).toBeInTheDocument();
        expect(screen.getByRole('link', {name: 'NMI'})).toHaveAttribute('href', 'https://measurement.gov.au');
        expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');

        const decorativeIcon = screen.getByTestId('decorative-icon');
        expect(decorativeIcon).toHaveClass('nmi-react-aria-icon', 'icon-tick', 'status-icon');
        expect(decorativeIcon).toHaveAttribute('aria-hidden', 'true');
        expect(decorativeIcon).toHaveStyle({fontSize: '20px'});

        const labelledIcon = container.querySelector('[data-nmi-icon="chevron-down"]');
        expect(labelledIcon).toHaveAttribute('aria-label', 'Expand services');
        expect(labelledIcon).not.toHaveAttribute('aria-hidden');
    });

    it('renders listbox item text as an accessible option label', () => {
        render(
            <ListBox aria-label='Ice cream flavor' selectionMode='single'>
                <ListBoxItem id='chocolate'>Chocolate</ListBoxItem>
                <ListBoxItem id='mint'>Mint</ListBoxItem>
            </ListBox>,
        );

        expect(screen.getByRole('listbox', {name: 'Ice cream flavor'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Chocolate'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Mint'})).toBeInTheDocument();
    });

    it.each([
        ['low', 40, 'var(--green)'],
        ['warning', 75, 'var(--orange)'],
        ['critical', 95, 'var(--red)'],
    ])('maps %s meter values to the expected fill state', (_state, value, fillColor) => {
        const {container} = render(
            <Meter label='Storage used' value={value} minValue={0} maxValue={100} />,
        );

        expect(screen.getByRole('meter', {name: 'Storage used'})).toHaveTextContent(`${value}%`);
        const fill = container.querySelector('.fill') as HTMLElement;
        expect(fill.style.width).toBe(`${value}%`);
        expect(fill.style.getPropertyValue('--fill-color')).toBe(fillColor);
    });

    it('renders determinate and indeterminate progress affordances', () => {
        const {container, rerender} = render(
            <ProgressBar label='Upload progress' value={30} minValue={0} maxValue={100} />,
        );

        expect(screen.getByRole('progressbar', {name: 'Upload progress'})).toHaveTextContent('30%');
        expect((container.querySelector('.fill') as HTMLElement).style.getPropertyValue('--percent')).toBe('30%');

        rerender(<ProgressBar label='Upload progress' isIndeterminate />);
        expect((container.querySelector('.fill') as HTMLElement).style.getPropertyValue('--percent')).toBe('100%');
    });

    it('renders progress circles with explicit, default, determinate, and indeterminate values', () => {
        const {container, rerender} = render(
            <ProgressCircle aria-label='Saving' value={60} minValue={0} maxValue={100} size={24} />,
        );

        expect(screen.getByRole('progressbar', {name: 'Saving'})).toHaveStyle({
            width: '24px',
            height: '24px',
        });
        expect(container.querySelectorAll('circle')[1]).toHaveAttribute('stroke-dashoffset', '40');

        rerender(<ProgressCircle aria-label='Loading' isIndeterminate />);
        expect(screen.getByRole('progressbar', {name: 'Loading'})).toHaveStyle({
            width: '16px',
            height: '16px',
        });
        expect(container.querySelectorAll('circle')[1]).toHaveAttribute('stroke-dashoffset', '75');
        expect(container.querySelector('animateTransform')).toBeInTheDocument();
    });

    it('renders text, textarea, number, search, time, and switch field content', () => {
        render(
            <>
                <TextField
                    label='Certificate holder'
                    description='Use the legal name'
                    errorMessage='Name is required'
                    placeholder='Legal name'
                    isInvalid
                />
                <TextArea
                    label='Instructions'
                    description='Include handling notes'
                    errorMessage='Instructions are required'
                    placeholder='Notes'
                    rows={4}
                    isInvalid
                />
                <NumberField
                    label='Quantity'
                    description='Whole numbers only'
                    errorMessage='Quantity is required'
                    defaultValue={2}
                    isInvalid
                />
                <SearchField
                    label='Find service'
                    description='Search by keyword'
                    errorMessage='Search is required'
                    placeholder='Mass'
                    isInvalid
                />
                <TimeField
                    label='Collection time'
                    description='Use local time'
                    errorMessage='Time is required'
                    defaultValue={new Time(9, 30)}
                    isInvalid
                />
                <Switch description='Applies to all instruments' errorMessage='Choose an option' isInvalid>
                    Expedited handling
                </Switch>
            </>,
        );

        expect(screen.getByRole('textbox', {name: 'Certificate holder'})).toHaveAttribute('placeholder', 'Legal name');
        expect(screen.getByRole('textbox', {name: 'Instructions'})).toHaveAttribute('rows', '4');
        expect(screen.getByRole('textbox', {name: 'Quantity'})).toHaveValue('2');
        expect(screen.getByRole('button', {name: 'Decrease Quantity'})).toHaveAttribute('data-variant', 'secondary');
        expect(screen.getByRole('button', {name: 'Increase Quantity'})).toHaveAttribute('data-variant', 'secondary');
        expect(screen.getByRole('searchbox', {name: 'Find service'})).toHaveAttribute('placeholder', 'Mass');
        expect(screen.getByText('Collection time')).toBeInTheDocument();
        expect(screen.getByRole('group', {name: 'Collection time'})).toBeInTheDocument();
        expect(screen.getByRole('switch', {name: 'Expedited handling'})).toBeInTheDocument();
        expect(screen.getByText('Choose an option')).toBeInTheDocument();
    });

    it('renders toggle and segmented controls with their configured variants', () => {
        render(
            <>
                <ToggleButton variant='secondary'>Pin</ToggleButton>
                <ToggleButtonGroup aria-label='Text style' selectionMode='multiple'>
                    <ToggleButton id='bold' variant='quiet'>Bold</ToggleButton>
                    <ToggleButton id='italic'>Italic</ToggleButton>
                </ToggleButtonGroup>
                <SegmentedControl aria-label='View mode' selectedKeys={['list']} selectionMode='single'>
                    <SegmentedControlItem id='list'>List</SegmentedControlItem>
                    <SegmentedControlItem id='grid'>Grid</SegmentedControlItem>
                </SegmentedControl>
            </>,
        );

        expect(screen.getByRole('button', {name: 'Pin'})).toHaveAttribute('data-variant', 'secondary');
        expect(screen.getByRole('button', {name: 'Bold'})).toHaveAttribute('data-variant', 'quiet');
        expect(screen.getByRole('button', {name: 'Italic'})).toHaveAttribute('data-variant', 'primary');
        expect(screen.getByRole('toolbar', {name: 'Text style'})).toHaveAttribute('aria-orientation', 'horizontal');
        expect(screen.getByRole('radio', {name: 'List'})).toHaveClass('segmented-control-item');
        expect(screen.getByRole('radio', {name: 'Grid'})).toHaveClass('segmented-control-item');
    });

    it('renders tabs and changes the visible panel through the wrapped tab pieces', async () => {
        const onSelectionChange = vi.fn();
        const user = userEvent.setup();

        render(
            <Tabs onSelectionChange={onSelectionChange}>
                <TabList aria-label='Application sections'>
                    <Tab id='details'>Details</Tab>
                    <Tab id='documents'>Documents</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel id='details'>Application details</TabPanel>
                    <TabPanel id='documents'>Supporting documents</TabPanel>
                </TabPanels>
            </Tabs>,
        );

        expect(screen.getByRole('tabpanel')).toHaveTextContent('Application details');

        await user.click(screen.getByRole('tab', {name: 'Documents'}));

        expect(screen.getByRole('tab', {name: 'Documents'})).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tabpanel')).toHaveTextContent('Supporting documents');
        expect(onSelectionChange).toHaveBeenCalledWith('documents');
    });

    it('renders removable tags and empty tag groups', () => {
        const onRemove = vi.fn();
        const {rerender} = render(
            <TagGroup
                label='Selected services'
                description='Remove services no longer required'
                errorMessage='Select at least one service'
                selectionMode='multiple'
                onRemove={onRemove}
            >
                <Tag id='mass'>Mass</Tag>
                <Tag id='volume' textValue='Volume'><span>Volume</span></Tag>
            </TagGroup>,
        );

        expect(screen.getByRole('grid', {name: 'Selected services'})).toBeInTheDocument();
        expect(screen.getByText('Remove services no longer required')).toBeInTheDocument();
        expect(screen.getByText('Select at least one service')).toBeInTheDocument();
        expect(within(screen.getByRole('row', {name: /Mass/})).getByRole('button', {name: 'Remove Mass'}))
            .toBeInTheDocument();

        rerender(
            <TagGroup
                label='Selected services'
                renderEmptyState={() => 'No services selected'}
            >
                {[]}
            </TagGroup>,
        );
        expect(screen.getByText('No services selected')).toBeInTheDocument();
    });

    it('provides toolbar orientation context to child controls', () => {
        const {rerender} = render(
            <Toolbar aria-label='Formatting'>
                <ToggleButtonGroup aria-label='Text style'>
                    <ToggleButton id='bold'>Bold</ToggleButton>
                </ToggleButtonGroup>
                <Separator />
            </Toolbar>,
        );

        expect(screen.getByRole('toolbar', {name: 'Formatting'})).toHaveAttribute('aria-orientation', 'horizontal');
        expect(screen.getByRole('separator')).toBeInTheDocument();

        rerender(
            <Toolbar aria-label='Formatting' orientation='vertical'>
                <ToggleButtonGroup aria-label='Text style'>
                    <ToggleButton id='bold'>Bold</ToggleButton>
                </ToggleButtonGroup>
                <Separator />
            </Toolbar>,
        );

        expect(screen.getByRole('toolbar', {name: 'Formatting'})).toHaveAttribute('aria-orientation', 'vertical');
        expect(screen.getByRole('separator')).toBeInTheDocument();
    });
});
