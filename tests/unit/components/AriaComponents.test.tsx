import {Time, parseDate} from '@internationalized/date';
import {act} from 'react';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {ResizableTableContainer} from 'react-aria-components/Table';
import {DialogTrigger} from '@/components/Dialog/Dialog';
import {Button} from '@/components/Buttons/AriaButton/Button';
import {Heading, Text} from '@/components/AriaComponents/Content';
import {Link} from '@/components/AriaComponents/Link';
import {Header as ListBoxHeader, ListBox, ListBoxItem, ListBoxLoadMoreItem, ListBoxSection} from '@/components/AriaComponents/ListBox';
import {Menu, MenuItem, MenuTrigger, SubmenuTrigger} from '@/components/AriaComponents/Menu';
import {Meter} from '@/components/AriaComponents/Meter';
import {Modal} from '@/components/AriaComponents/Modal';
import {Check, ChevronDown} from '@/components/AriaComponents/NmiIcon';
import {NumberField} from '@/components/AriaComponents/NumberField';
import {Popover} from '@/components/AriaComponents/Popover';
import {ProgressBar} from '@/components/AriaComponents/ProgressBar';
import {ProgressCircle} from '@/components/AriaComponents/ProgressCircle';
import {Radio, RadioGroup} from '@/components/AriaComponents/RadioGroup';
import {RangeCalendar} from '@/components/AriaComponents/RangeCalendar';
import {SearchField} from '@/components/AriaComponents/SearchField';
import {Select, SelectItem} from '@/components/AriaComponents/Select';
import {SegmentedControl, SegmentedControlItem} from '@/components/AriaComponents/SegmentedControl';
import {Separator} from '@/components/AriaComponents/Separator';
import {Sheet, Heading as SheetHeading} from '@/components/AriaComponents/Sheet';
import {Slider} from '@/components/AriaComponents/Slider';
import {Switch} from '@/components/AriaComponents/Switch';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from '@/components/AriaComponents/Tabs';
import {Cell, Column, Row, Table, TableBody, TableHeader, TableLoadMoreItem} from '@/components/AriaComponents/Table';
import {Tag, TagGroup} from '@/components/AriaComponents/TagGroup';
import {TextArea, TextField} from '@/components/AriaComponents/TextField';
import {TimeField} from '@/components/AriaComponents/TimeField';
import {MyToastRegion} from '@/components/AriaComponents/Toast';
import {queue} from '@/components/AriaComponents/ToastQueue';
import {ToggleButton} from '@/components/AriaComponents/ToggleButton';
import {ToggleButtonGroup} from '@/components/AriaComponents/ToggleButtonGroup';
import {Toolbar} from '@/components/AriaComponents/Toolbar';
import {Tooltip, TooltipTrigger} from '@/components/AriaComponents/Tooltip';
import {Tree, TreeHeader, TreeItem, TreeLoadMoreItem, TreeSection} from '@/components/AriaComponents/Tree';

if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = vi.fn(() => []);
}

class TestIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];

    disconnect() {}

    observe() {}

    takeRecords() {
        return [];
    }

    unobserve() {}
}

globalThis.IntersectionObserver ??= TestIntersectionObserver;

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

    it('renders listbox sections and loading rows with accessible labels', () => {
        render(
            <ListBox aria-label='Available services'>
                <ListBoxSection>
                    <ListBoxHeader>Dimensional services</ListBoxHeader>
                    <ListBoxItem id='length'>Length</ListBoxItem>
                </ListBoxSection>
                <ListBoxLoadMoreItem onLoadMore={vi.fn()} />
            </ListBox>,
        );

        expect(screen.getByRole('listbox', {name: 'Available services'})).toBeInTheDocument();
        expect(screen.getByText('Dimensional services')).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Length'})).toBeInTheDocument();
        expect(screen.getByTestId('loadMoreSentinel')).toBeInTheDocument();
    });

    it('opens menus, shows selected indicators, and renders submenu affordances', async () => {
        const user = userEvent.setup();

        render(
            <MenuTrigger>
                <Button>Actions</Button>
                <Menu selectionMode='multiple' selectedKeys={['copy']}>
                    <MenuItem id='copy'>Copy</MenuItem>
                    <SubmenuTrigger>
                        <MenuItem id='share'>Share</MenuItem>
                        <Menu>
                            <MenuItem id='email'>Email</MenuItem>
                        </Menu>
                    </SubmenuTrigger>
                </Menu>
            </MenuTrigger>,
        );

        await user.click(screen.getByRole('button', {name: 'Actions'}));

        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByRole('menuitemcheckbox', {name: 'Copy'})).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('menuitem', {name: 'Share'})).toBeInTheDocument();
        expect(document.querySelector('[data-nmi-icon="chevron-right"]')).toBeInTheDocument();
    });

    it('renders selects with labels, validation text, and selectable options', async () => {
        const user = userEvent.setup();

        render(
            <Select label='Ice cream flavor' description='Choose one flavor' errorMessage='Flavor is required' isInvalid>
                <SelectItem id='chocolate'>Chocolate</SelectItem>
                <SelectItem id='mint'>Mint</SelectItem>
            </Select>,
        );

        expect(screen.getByText('Choose one flavor')).toBeInTheDocument();
        expect(screen.getByText('Flavor is required')).toBeInTheDocument();

        await user.click(screen.getByRole('button', {name: /Ice cream flavor/}));

        expect(screen.getByRole('listbox')).toHaveClass('dropdown-listbox');
        expect(screen.getByRole('option', {name: 'Chocolate'})).toHaveClass('dropdown-item');
        expect(screen.getByRole('option', {name: 'Mint'})).toBeInTheDocument();
    });

    it('renders radio groups with per-option descriptions and invalid feedback', async () => {
        const user = userEvent.setup();

        render(
            <RadioGroup
                label='Certificate type'
                description='Select one certificate'
                errorMessage='Certificate type is required'
                isInvalid
            >
                <Radio value='new' description='Create a new certificate'>New certificate</Radio>
                <Radio value='variation'>Variation</Radio>
            </RadioGroup>,
        );

        expect(screen.getByRole('radiogroup', {name: 'Certificate type'})).toBeInTheDocument();
        expect(screen.getByText('Select one certificate')).toBeInTheDocument();
        expect(screen.getByText('Certificate type is required')).toBeInTheDocument();
        expect(screen.getByText('Create a new certificate')).toBeInTheDocument();

        await user.click(screen.getByRole('radio', {name: 'Variation'}));

        expect(screen.getByRole('radio', {name: 'Variation'})).toBeChecked();
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

    it('renders range calendars with visible month controls and validation feedback', () => {
        render(
            <RangeCalendar
                aria-label='Booking window'
                visibleDuration={{months: 2}}
                defaultValue={{start: parseDate('2026-01-10'), end: parseDate('2026-01-12')}}
                errorMessage='Select an available date range'
            />,
        );

        expect(screen.getByRole('application', {name: /Booking window/})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /previous/i})).toHaveAttribute('data-variant', 'quiet');
        expect(screen.getAllByRole('button', {name: /next/i})[0]).toHaveAttribute('data-variant', 'quiet');
        expect(screen.getByText('Select an available date range')).toBeInTheDocument();
        expect(document.querySelectorAll('.month')).toHaveLength(2);
    });

    it('renders sliders with explicit thumb labels, fill offsets, and disabled track state', () => {
        const {container} = render(
            <Slider
                label='Target range'
                defaultValue={[25, 75]}
                minValue={0}
                maxValue={100}
                thumbLabels={['Minimum target', 'Maximum target']}
                fillOffset={10}
                isDisabled
            />,
        );

        expect(screen.getByRole('slider', {name: /Minimum target/})).toHaveValue('25');
        expect(screen.getByRole('slider', {name: /Maximum target/})).toHaveValue('75');
        expect(container.querySelector('.track')).toHaveAttribute('data-disabled', 'true');
        expect(container.querySelector('.react-aria-SliderThumb')).toHaveClass('indicator');
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

    it('renders toggle and segmented controls with their configured variants', async () => {
        await act(async () => {
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
        });

        expect(screen.getByRole('radio', {name: 'List'})).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', {name: 'Grid'})).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByRole('button', {name: 'Pin'})).toHaveAttribute('data-variant', 'secondary');
        expect(screen.getByRole('button', {name: 'Bold'})).toHaveAttribute('data-variant', 'quiet');
        expect(screen.getByRole('button', {name: 'Italic'})).toHaveAttribute('data-variant', 'primary');
        expect(screen.getByRole('toolbar', {name: 'Text style'})).toHaveAttribute('aria-orientation', 'horizontal');
        expect(screen.getByRole('radio', {name: 'List'})).toHaveClass('segmented-control-item');
        expect(screen.getByRole('radio', {name: 'Grid'})).toHaveClass('segmented-control-item');
    });

    it('renders table wrappers with sorting, selection, row headers, and load-more status', () => {
        render(
            <ResizableTableContainer>
                <Table aria-label='Files' selectionMode='multiple' selectionBehavior='toggle' sortDescriptor={{column: 'name', direction: 'ascending'}}>
                    <TableHeader>
                        <Column id='name' isRowHeader allowsSorting allowsResizing>Name</Column>
                        <Column id='type'>Type</Column>
                    </TableHeader>
                    <TableBody>
                        <Row id='games'>
                            <Cell>Games</Cell>
                            <Cell>Folder</Cell>
                        </Row>
                        <TableLoadMoreItem onLoadMore={vi.fn()} />
                    </TableBody>
                </Table>
            </ResizableTableContainer>,
        );

        expect(screen.getByRole('grid', {name: 'Files'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: /Name/})).toHaveClass('button-base');
        expect(screen.getByRole('rowheader', {name: 'Games'})).toBeInTheDocument();
        expect(screen.getAllByRole('checkbox')).toHaveLength(2);
        expect(screen.getByTestId('loadMoreSentinel')).toBeInTheDocument();
        expect(document.querySelector('[data-nmi-icon="chevron-up"]')).toBeInTheDocument();
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

    it('renders modal dialog content when open', () => {
        render(
            <Modal isOpen>
                <div role='dialog' aria-label='Review application'>Modal content</div>
            </Modal>,
        );

        expect(screen.getByRole('dialog', {name: 'Review application'})).toHaveTextContent('Modal content');
    });

    it('opens sheet content from dialog trigger context', async () => {
        const user = userEvent.setup();

        render(
            <DialogTrigger>
                <Button>Open sheet</Button>
                <Sheet>
                    <SheetHeading slot='title'>Sheet title</SheetHeading>
                    <p>Sheet content</p>
                </Sheet>
            </DialogTrigger>,
        );

        await user.click(screen.getByRole('button', {name: 'Open sheet'}));

        expect(screen.getByRole('dialog', {name: 'Sheet title'})).toHaveTextContent('Sheet content');
    });

    it('opens popover content from dialog trigger context', async () => {
        const user = userEvent.setup();

        render(
            <DialogTrigger>
                <Button>Open popover</Button>
                <Popover>
                    <div>Popover content</div>
                </Popover>
            </DialogTrigger>,
        );

        await user.click(screen.getByRole('button', {name: 'Open popover'}));

        expect(screen.getByText('Popover content')).toBeInTheDocument();
        expect(screen.getByRole('dialog', {name: 'Open popover'})).toHaveClass('react-aria-Popover');
    });

    it('shows tooltip content from its trigger', async () => {
        const user = userEvent.setup();

        render(
            <TooltipTrigger delay={0}>
                <Button>Help</Button>
                <Tooltip>Tooltip content</Tooltip>
            </TooltipTrigger>,
        );

        await user.hover(screen.getByRole('button', {name: 'Help'}));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Tooltip content');
    });

    it('renders and dismisses queued toast content', async () => {
        const user = userEvent.setup();

        render(<MyToastRegion />);

        act(() => {
            queue.add({title: 'Files uploaded', description: '3 files uploaded successfully.'});
        });

        await screen.findByText('Files uploaded');

        expect(screen.getByRole('alertdialog', {name: 'Files uploaded'})).toBeInTheDocument();
        expect(screen.getByText('3 files uploaded successfully.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', {name: 'Close'}));
        await waitFor(() => {
            expect(screen.queryByText('Files uploaded')).not.toBeInTheDocument();
        });
    });

    it('renders tree sections, selectable child items, and load-more status', () => {
        render(
            <Tree aria-label='Files' selectionMode='multiple' selectionBehavior='toggle' defaultExpandedKeys={['documents']}>
                <TreeSection>
                    <TreeHeader>Shared files</TreeHeader>
                    <TreeItem id='documents' title='Documents'>
                        <TreeItem id='report' title='Weekly Report' />
                    </TreeItem>
                </TreeSection>
                <TreeLoadMoreItem onLoadMore={vi.fn()} />
            </Tree>,
        );

        expect(screen.getByRole('treegrid', {name: 'Files'})).toBeInTheDocument();
        expect(screen.getByText('Shared files')).toBeInTheDocument();
        expect(screen.getByRole('row', {name: /Documents/})).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('row', {name: /Weekly Report/})).toBeInTheDocument();
        expect(screen.getByTestId('loadMoreSentinel')).toBeInTheDocument();
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
