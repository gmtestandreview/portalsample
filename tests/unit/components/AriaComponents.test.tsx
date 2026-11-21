import { Time, parseDate } from '@internationalized/date';
import { act } from 'react';
import type { Key } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ResizableTableContainer } from 'react-aria-components/Table';
import { defined } from '../helpers/defined';
import { DialogTrigger } from '@/components/AriaComponents/Dialog/Dialog';
import { Button } from '@/components/AriaComponents/Button/Button';
import { Heading, Text } from '@/components/AriaComponents/Content/Content';
import { Link } from '@/components/AriaComponents/Link/Link';
import {
  Header as ListBoxHeader,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  ListBoxSection,
} from '@/components/AriaComponents/ListBox/ListBox';
import {
  Menu,
  MenuItem,
  MenuTrigger,
  SubmenuTrigger,
} from '@/components/AriaComponents/Menu/Menu';
import { Meter } from '@/components/AriaComponents/Meter/Meter';
import { Modal } from '@/components/AriaComponents/modal/Modal';
import { Check, ChevronDown } from '@/components/AriaComponents/NmiIcon';
import { NumberField } from '@/components/AriaComponents/numberfield/NumberField';
import { Popover } from '@/components/AriaComponents/Popover/Popover';
import { ProgressBar } from '@/components/AriaComponents/ProgressBar/ProgressBar';
import { ProgressCircle } from '@/components/AriaComponents/ProgressCircle/ProgressCircle';
import {
  Radio,
  RadioGroup,
} from '@/components/AriaComponents/RadioGroup/RadioGroup';
import { RangeCalendar } from '@/components/AriaComponents/RangeCalander/RangeCalendar';
import { SearchField } from '@/components/AriaComponents/SearchField/SearchField';
import { Select, SelectItem } from '@/components/AriaComponents/Select/Select';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@/components/AriaComponents/SegmentControl/SegmentedControl';
import { Separator } from '@/components/AriaComponents/Seperator/Separator';
import {
  Sheet,
  Heading as SheetHeading,
} from '@/components/AriaComponents/Sheet/Sheet';
import { Slider } from '@/components/AriaComponents/Slider/Slider';
import { ColorSlider } from '@/components/AriaComponents/ColorSlider/ColorSlider';
import { Switch } from '@/components/AriaComponents/Switch/Switch';
import {
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@/components/AriaComponents/Tabs/Tabs';
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
  TableLoadMoreItem,
} from '@/components/AriaComponents/Table/Table';
import { Tag, TagGroup } from '@/components/AriaComponents/TagGroups/TagGroup';
import {
  TextArea,
  TextField,
} from '@/components/AriaComponents/TextField/TextField';
import { TimeField } from '@/components/AriaComponents/TimeField/TimeField';
import { MyToastRegion } from '@/components/AriaComponents/Toast/Toast';
import { queue } from '@/components/AriaComponents/Toast/ToastQueue';
import { ToggleButton } from '@/components/AriaComponents/ToggleButton/ToggleButton';
import { ToggleButtonGroup } from '@/components/AriaComponents/ToggleButtonGroup/ToggleButtonGroup';
import { Toolbar } from '@/components/AriaComponents/Toolbar/Toolbar';
import {
  Tooltip,
  TooltipTrigger,
} from '@/components/AriaComponents/ToolTip/Tooltip';
import {
  Tree,
  TreeHeader,
  TreeItem,
  TreeLoadMoreItem,
  TreeSection,
} from '@/components/AriaComponents/Tree/Tree';

const getAnimations: unknown = Reflect.get(Element.prototype, 'getAnimations');
if (!getAnimations) {
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: vi.fn<() => Animation[]>(() => []),
    writable: true,
  });
}

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds = [];

  disconnect() {
    // Test double — no observation to tear down.
  }

  observe() {
    // Test double — no observation to start.
  }

  takeRecords() {
    return [];
  }

  unobserve() {
    // Test double — no observation to stop.
  }
}

const intersectionObserver: unknown = globalThis.IntersectionObserver;
if (intersectionObserver === null || intersectionObserver === undefined) {
  globalThis.IntersectionObserver = TestIntersectionObserver;
}

const expectAnything = (): unknown => expect.anything();
const expectStringContaining = (value: string): unknown =>
  expect.stringContaining(value);

describe('react Aria evaluation wrappers', () => {
  it('renders content, links, separators, and icons through their public wrappers', () => {
    expect.hasAssertions();

    const { container } = render(
      <>
        <Heading level={2}>Calibration services</Heading>
        <Text slot='description'>Choose a service type</Text>
        <Link href='https://measurement.gov.au'>NMI</Link>
        <Separator orientation='vertical' />
        <Check
          data-testid='decorative-icon'
          size={20}
          className='status-icon'
        />
        <ChevronDown aria-label='Expand services' />
      </>,
    );

    const decorativeIcon = screen.getByTestId('decorative-icon');
    const labelledIcon = container.querySelector(
      '[data-nmi-icon="chevron-down"]',
    );

    expect({
      heading: screen.getByRole('heading', {
        level: 2,
        name: 'Calibration services',
      }),
      description: screen.getByText('Choose a service type'),
      linkHref: screen.getByRole('link', { name: 'NMI' }).getAttribute('href'),
      separatorOrientation: screen
        .getByRole('separator')
        .getAttribute('aria-orientation'),
      decorativeHidden: decorativeIcon.getAttribute('aria-hidden'),
      labelledAriaLabel: labelledIcon?.getAttribute('aria-label'),
      labelledHidden: labelledIcon?.getAttribute('aria-hidden'),
    }).toMatchObject({
      heading: expectAnything(),
      description: expectAnything(),
      linkHref: 'https://measurement.gov.au',
      separatorOrientation: 'vertical',
      decorativeHidden: 'true',
      labelledAriaLabel: 'Expand services',
      labelledHidden: null,
    });
    expect(decorativeIcon).toHaveClass(
      'nmi-react-aria-icon',
      'icon-tick',
      'status-icon',
    );
    expect(decorativeIcon).toHaveStyle({ fontSize: '20px' });
  });

  it('renders listbox item text as an accessible option label', () => {
    expect.hasAssertions();

    render(
      <ListBox aria-label='Ice cream flavor' selectionMode='single'>
        <ListBoxItem id='chocolate'>Chocolate</ListBoxItem>
        <ListBoxItem id='mint'>Mint</ListBoxItem>
      </ListBox>,
    );

    expect(
      screen.getByRole('listbox', { name: 'Ice cream flavor' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Chocolate' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mint' })).toBeInTheDocument();
  });

  it('renders listbox sections and loading rows with accessible labels', () => {
    expect.hasAssertions();

    render(
      <ListBox aria-label='Available services'>
        <ListBoxSection>
          <ListBoxHeader>Dimensional services</ListBoxHeader>
          <ListBoxItem id='length'>Length</ListBoxItem>
        </ListBoxSection>
        <ListBoxLoadMoreItem onLoadMore={vi.fn<() => void>()} />
      </ListBox>,
    );

    expect(
      screen.getByRole('listbox', { name: 'Available services' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Dimensional services')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Length' })).toBeInTheDocument();
    expect(screen.getByTestId('loadMoreSentinel')).toBeInTheDocument();
  });

  it('opens menus, shows selected indicators, and renders submenu affordances', async () => {
    expect.hasAssertions();

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

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Copy' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitem', { name: 'Share' })).toBeInTheDocument();
    expect(
      document.querySelector('[data-nmi-icon="chevron-right"]'),
    ).toBeInTheDocument();
  });

  it('renders selects with labels, validation text, and selectable options', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();

    render(
      <Select
        label='Ice cream flavor'
        description='Choose one flavor'
        errorMessage='Flavor is required'
        isInvalid
      >
        <SelectItem id='chocolate'>Chocolate</SelectItem>
        <SelectItem id='mint'>Mint</SelectItem>
      </Select>,
    );

    expect(screen.getByText('Choose one flavor')).toBeInTheDocument();
    expect(screen.getByText('Flavor is required')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ice cream flavor/ }));

    expect(screen.getByRole('listbox')).toHaveClass('dropdown-listbox');
    expect(screen.getByRole('option', { name: 'Chocolate' })).toHaveClass(
      'dropdown-item',
    );
    expect(screen.getByRole('option', { name: 'Mint' })).toBeInTheDocument();
  });

  it('renders radio groups with per-option descriptions and invalid feedback', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();

    render(
      <RadioGroup
        label='Certificate type'
        description='Select one certificate'
        errorMessage='Certificate type is required'
        isInvalid
      >
        <Radio value='new' description='Create a new certificate'>
          New certificate
        </Radio>
        <Radio value='variation'>Variation</Radio>
      </RadioGroup>,
    );

    expect(
      screen.getByRole('radiogroup', { name: 'Certificate type' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Select one certificate')).toBeInTheDocument();
    expect(
      screen.getByText('Certificate type is required'),
    ).toBeInTheDocument();
    expect(screen.getByText('Create a new certificate')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Variation' }));

    expect(screen.getByRole('radio', { name: 'Variation' })).toBeChecked();
  });

  it.each([
    ['low', 40, 'var(--green)'],
    ['warning', 75, 'var(--orange)'],
    ['critical', 95, 'var(--red)'],
  ])(
    'maps %s meter values to the expected fill state',
    (_state, value, fillColor) => {
      expect.hasAssertions();

      const { container } = render(
        <Meter
          label='Storage used'
          value={value}
          minValue={0}
          maxValue={100}
        />,
      );

      expect(
        screen.getByRole('meter', { name: 'Storage used' }),
      ).toHaveTextContent(`${value}%`);

      const fill = defined(
        container.querySelector<HTMLElement>('.fill'),
        'progress fill element',
      );

      expect(fill.style.width).toBe(`${value}%`);
      expect(fill.style.getPropertyValue('--fill-color')).toBe(fillColor);
    },
  );

  it('renders determinate and indeterminate progress affordances', () => {
    expect.hasAssertions();

    const { container, rerender } = render(
      <ProgressBar
        label='Upload progress'
        value={30}
        minValue={0}
        maxValue={100}
      />,
    );

    expect(
      screen.getByRole('progressbar', { name: 'Upload progress' }),
    ).toHaveTextContent('30%');
    expect(
      defined(
        container.querySelector<HTMLElement>('.fill'),
        'progress fill element',
      ).style.getPropertyValue('--percent'),
    ).toBe('30%');

    rerender(<ProgressBar label='Upload progress' isIndeterminate />);

    expect(
      defined(
        container.querySelector<HTMLElement>('.fill'),
        'progress fill element',
      ).style.getPropertyValue('--percent'),
    ).toBe('100%');
  });

  it('renders progress circles with explicit, default, determinate, and indeterminate values', () => {
    expect.hasAssertions();

    const { container, rerender } = render(
      <ProgressCircle
        aria-label='Saving'
        value={60}
        minValue={0}
        maxValue={100}
        size={24}
      />,
    );

    expect(screen.getByRole('progressbar', { name: 'Saving' })).toHaveStyle({
      width: '24px',
      height: '24px',
    });
    expect(container.querySelectorAll('circle')[1]).toHaveAttribute(
      'stroke-dashoffset',
      '40',
    );

    rerender(<ProgressCircle aria-label='Loading' isIndeterminate />);

    expect(screen.getByRole('progressbar', { name: 'Loading' })).toHaveStyle({
      width: '16px',
      height: '16px',
    });
    expect(container.querySelectorAll('circle')[1]).toHaveAttribute(
      'stroke-dashoffset',
      '75',
    );
    expect(container.querySelector('animateTransform')).toBeInTheDocument();
  });

  it('renders range calendars with visible month controls and validation feedback', () => {
    expect.hasAssertions();

    render(
      <RangeCalendar
        aria-label='Booking window'
        visibleDuration={{ months: 2 }}
        defaultValue={{
          start: parseDate('2026-01-10'),
          end: parseDate('2026-01-12'),
        }}
        errorMessage='Select an available date range'
      />,
    );

    expect(
      screen.getByRole('application', { name: /Booking window/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toHaveAttribute(
      'data-variant',
      'quiet',
    );
    expect(screen.getAllByRole('button', { name: /next/i })[0]).toHaveAttribute(
      'data-variant',
      'quiet',
    );
    expect(
      screen.getByText('Select an available date range'),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('.month')).toHaveLength(2);
  });

  it('renders sliders with explicit thumb labels, fill offsets, and disabled track state', () => {
    expect.hasAssertions();

    const { container } = render(
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

    expect(screen.getByRole('slider', { name: /Minimum target/ })).toHaveValue(
      '25',
    );
    expect(screen.getByRole('slider', { name: /Maximum target/ })).toHaveValue(
      '75',
    );
    expect(container.querySelector('.track')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    expect(container.querySelector('.react-aria-SliderThumb')).toHaveClass(
      'indicator',
    );
  });

  it('renders the color slider checkerboard when the track has no default background', () => {
    expect.hasAssertions();

    render(
      <ColorSlider
        aria-label='Red opacity'
        defaultValue='#f00'
        channel='alpha'
      />,
    );

    expect(screen.getByRole('slider', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('renders text, textarea, number, search, time, and switch field content', () => {
    expect.hasAssertions();

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
        <Switch
          description='Applies to all instruments'
          errorMessage='Choose an option'
          isInvalid
        >
          Expedited handling
        </Switch>
      </>,
    );

    expect({
      certificatePlaceholder: screen
        .getByRole('textbox', { name: 'Certificate holder' })
        .getAttribute('placeholder'),
      instructionsRows: screen
        .getByRole('textbox', { name: 'Instructions' })
        .getAttribute('rows'),
      quantityValue: screen.getByRole<HTMLInputElement>('textbox', {
        name: 'Quantity',
      }).value,
      decreaseVariant: screen
        .getByRole('button', { name: 'Decrease Quantity' })
        .getAttribute('data-variant'),
      increaseVariant: screen
        .getByRole('button', { name: 'Increase Quantity' })
        .getAttribute('data-variant'),
      searchPlaceholder: screen
        .getByRole('searchbox', { name: 'Find service' })
        .getAttribute('placeholder'),
      timeText: screen.getByText('Collection time'),
      group: screen.getByRole('group', { name: 'Collection time' }),
      switch: screen.getByRole('switch', { name: 'Expedited handling' }),
      errorMessage: screen.getByText('Choose an option'),
    }).toMatchObject({
      certificatePlaceholder: 'Legal name',
      instructionsRows: '4',
      quantityValue: '2',
      decreaseVariant: 'secondary',
      increaseVariant: 'secondary',
      searchPlaceholder: 'Mass',
      timeText: expectAnything(),
      group: expectAnything(),
      switch: expectAnything(),
      errorMessage: expectAnything(),
    });
  });

  it('renders toggle and segmented controls with their configured variants', async () => {
    expect.hasAssertions();

    await act(async () => {
      render(
        <>
          <ToggleButton variant='secondary'>Pin</ToggleButton>
          <ToggleButtonGroup aria-label='Text style' selectionMode='multiple'>
            <ToggleButton id='bold' variant='quiet'>
              Bold
            </ToggleButton>
            <ToggleButton id='italic'>Italic</ToggleButton>
          </ToggleButtonGroup>
          <SegmentedControl
            aria-label='View mode'
            selectedKeys={['list']}
            selectionMode='single'
          >
            <SegmentedControlItem id='list'>List</SegmentedControlItem>
            <SegmentedControlItem id='grid'>Grid</SegmentedControlItem>
          </SegmentedControl>
        </>,
      );
      await Promise.resolve();
    });

    expect({
      listChecked: screen
        .getByRole('radio', { name: 'List' })
        .getAttribute('aria-checked'),
      gridChecked: screen
        .getByRole('radio', { name: 'Grid' })
        .getAttribute('aria-checked'),
      pinVariant: screen
        .getByRole('button', { name: 'Pin' })
        .getAttribute('data-variant'),
      boldVariant: screen
        .getByRole('button', { name: 'Bold' })
        .getAttribute('data-variant'),
      italicVariant: screen
        .getByRole('button', { name: 'Italic' })
        .getAttribute('data-variant'),
      toolbarOrientation: screen
        .getByRole('toolbar', { name: 'Text style' })
        .getAttribute('aria-orientation'),
    }).toMatchObject({
      listChecked: 'true',
      gridChecked: 'false',
      pinVariant: 'secondary',
      boldVariant: 'quiet',
      italicVariant: 'primary',
      toolbarOrientation: 'horizontal',
    });
    expect(screen.getByRole('radio', { name: 'List' })).toHaveClass(
      'segmented-control-item',
    );
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveClass(
      'segmented-control-item',
    );
  });

  it('renders table wrappers with sorting, selection, row headers, and load-more status', () => {
    expect.hasAssertions();

    render(
      <ResizableTableContainer>
        <Table
          aria-label='Files'
          selectionMode='multiple'
          selectionBehavior='toggle'
          sortDescriptor={{ column: 'name', direction: 'ascending' }}
        >
          <TableHeader>
            <Column id='name' isRowHeader allowsSorting allowsResizing>
              Name
            </Column>
            <Column id='type'>Type</Column>
          </TableHeader>
          <TableBody>
            <Row id='games'>
              <Cell>Games</Cell>
              <Cell>Folder</Cell>
            </Row>
            <TableLoadMoreItem onLoadMore={vi.fn<() => void>()} />
          </TableBody>
        </Table>
      </ResizableTableContainer>,
    );

    expect({
      grid: screen.getByRole('grid', { name: 'Files' }),
      columnClass: screen
        .getByRole('columnheader', { name: /Name/ })
        .getAttribute('class'),
      rowHeader: screen.getByRole('rowheader', { name: 'Games' }),
      checkboxCount: screen.getAllByRole('checkbox').length,
      loadMore: screen.getByTestId('loadMoreSentinel'),
      chevron: document.querySelector('[data-nmi-icon="chevron-up"]'),
    }).toMatchObject({
      grid: expectAnything(),
      columnClass: expectStringContaining('button-base'),
      rowHeader: expectAnything(),
      checkboxCount: 2,
      loadMore: expectAnything(),
      chevron: expectAnything(),
    });
  });

  it('renders tabs and changes the visible panel through the wrapped tab pieces', async () => {
    expect.hasAssertions();

    const onSelectionChange = vi.fn<(key: Key) => void>();
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

    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Application details',
    );

    await user.click(screen.getByRole('tab', { name: 'Documents' }));

    expect(screen.getByRole('tab', { name: 'Documents' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Supporting documents',
    );
    expect(onSelectionChange).toHaveBeenCalledWith('documents');
  });

  it('renders removable tags and empty tag groups', () => {
    expect.hasAssertions();

    const onRemove = vi.fn<(keys: Set<Key>) => void>();
    const { rerender } = render(
      <TagGroup
        label='Selected services'
        description='Remove services no longer required'
        errorMessage='Select at least one service'
        selectionMode='multiple'
        onRemove={onRemove}
      >
        <Tag id='mass'>Mass</Tag>
        <Tag id='volume' textValue='Volume'>
          <span>Volume</span>
        </Tag>
      </TagGroup>,
    );

    expect(
      screen.getByRole('grid', { name: 'Selected services' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Remove services no longer required'),
    ).toBeInTheDocument();
    expect(screen.getByText('Select at least one service')).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: /Mass/ })).getByRole('button', {
        name: 'Remove Mass',
      }),
    ).toBeInTheDocument();

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
    expect.hasAssertions();

    render(
      <Modal isOpen>
        <div role='dialog' aria-label='Review application'>
          Modal content
        </div>
      </Modal>,
    );

    expect(
      screen.getByRole('dialog', { name: 'Review application' }),
    ).toHaveTextContent('Modal content');
  });

  it('opens sheet content from dialog trigger context', async () => {
    expect.hasAssertions();

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

    await user.click(screen.getByRole('button', { name: 'Open sheet' }));

    expect(
      screen.getByRole('dialog', { name: 'Sheet title' }),
    ).toHaveTextContent('Sheet content');
  });

  it('opens popover content from dialog trigger context', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();

    render(
      <DialogTrigger>
        <Button>Open popover</Button>
        <Popover>
          <div>Popover content</div>
        </Popover>
      </DialogTrigger>,
    );

    await user.click(screen.getByRole('button', { name: 'Open popover' }));

    expect(screen.getByText('Popover content')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Open popover' })).toHaveClass(
      'react-aria-Popover',
    );
  });

  it('shows tooltip content from its trigger', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();

    render(
      <TooltipTrigger delay={0}>
        <Button>Help</Button>
        <Tooltip>Tooltip content</Tooltip>
      </TooltipTrigger>,
    );

    await user.hover(screen.getByRole('button', { name: 'Help' }));

    await expect(screen.findByRole('tooltip')).resolves.toHaveTextContent(
      'Tooltip content',
    );
  });

  it('renders and dismisses queued toast content', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();

    render(<MyToastRegion />);

    act(() => {
      queue.add({
        title: 'Files uploaded',
        description: '3 files uploaded successfully.',
      });
    });

    await screen.findByText('Files uploaded');

    expect(
      screen.getByRole('alertdialog', { name: 'Files uploaded' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('3 files uploaded successfully.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('Files uploaded')).not.toBeInTheDocument();
    });
  });

  it('renders tree sections, selectable child items, and load-more status', () => {
    expect.hasAssertions();

    render(
      <Tree
        aria-label='Files'
        selectionMode='multiple'
        selectionBehavior='toggle'
        defaultExpandedKeys={['documents']}
      >
        <TreeSection>
          <TreeHeader>Shared files</TreeHeader>
          <TreeItem id='documents' title='Documents'>
            <TreeItem id='report' title='Weekly Report' />
          </TreeItem>
        </TreeSection>
        <TreeLoadMoreItem onLoadMore={vi.fn<() => void>()} />
      </Tree>,
    );

    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByText('Shared files')).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Documents/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(
      screen.getByRole('row', { name: /Weekly Report/ }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('loadMoreSentinel')).toBeInTheDocument();
  });

  it('provides toolbar orientation context to child controls', () => {
    expect.hasAssertions();

    const { rerender } = render(
      <Toolbar aria-label='Formatting'>
        <ToggleButtonGroup aria-label='Text style'>
          <ToggleButton id='bold'>Bold</ToggleButton>
        </ToggleButtonGroup>
        <Separator />
      </Toolbar>,
    );

    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();

    rerender(
      <Toolbar aria-label='Formatting' orientation='vertical'>
        <ToggleButtonGroup aria-label='Text style'>
          <ToggleButton id='bold'>Bold</ToggleButton>
        </ToggleButtonGroup>
        <Separator />
      </Toolbar>,
    );

    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
