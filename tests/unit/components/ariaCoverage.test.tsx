import { parseDate } from '@internationalized/date';
import { useDragAndDrop } from 'react-aria-components';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input } from 'react-aria-components/Input';
import { ResizableTableContainer } from 'react-aria-components/Table';
import { Button as AriaButton } from '@/components/AriaComponents/AriaButton/Button';
import { Button as LoadingButton } from '@/components/AriaComponents/Button/Button';
import {
  Breadcrumb,
  Breadcrumbs,
} from '@/components/AriaComponents/Breadcrumb/Breadcrumbs';
import { Calendar } from '@/components/AriaComponents/Calendar/Calendar';
import { Checkbox } from '@/components/AriaComponents/Checkbox/Checkbox';
import { CheckboxGroup } from '@/components/AriaComponents/CheckboxGroup/CheckboxGroup';
import { ColorArea } from '@/components/AriaComponents/ColorArea/ColorArea';
import { ColorField } from '@/components/AriaComponents/ColorField/ColorField';
import { ColorPicker } from '@/components/AriaComponents/ColorPicker/ColorPicker';
import { ColorSlider } from '@/components/AriaComponents/ColorSlider/ColorSlider';
import { ColorSwatch } from '@/components/AriaComponents/ColorSwatch/ColorSwatch';
import {
  ColorSwatchPicker,
  ColorSwatchPickerItem,
} from '@/components/AriaComponents/ColorSwatchPicker/ColorSwatchPicker';
import { ColorWheel } from '@/components/AriaComponents/ColorWheel/ColorWheel';
import {
  ComboBox,
  ComboBoxItem,
} from '@/components/AriaComponents/ComboBox/ComboBox';
import { CommandPalette } from '@/components/AriaComponents/CommandPalette/CommandPalette';
import { DateField } from '@/components/AriaComponents/DateField/DateField';
import { DatePicker } from '@/components/AriaComponents/DatePicker/DatePicker';
import { DateRangePicker } from '@/components/AriaComponents/DateRangePicker/DateRangePicker';
import { RangeCalendar } from '@/components/AriaComponents/RangeCalander/RangeCalendar';
import {
  Disclosure,
  DisclosureHeader,
  DisclosurePanel,
} from '@/components/AriaComponents/Disclosure/Disclosure';
import { DisclosureGroup } from '@/components/AriaComponents/DisclosureGroup/DisclosureGroup';
import {
  DropZone,
  Text as DropZoneText,
} from '@/components/AriaComponents/DropZone/DropZone';
import {
  Description,
  FieldButton,
  FieldError,
  Form,
  Label,
} from '@/components/AriaComponents/Form/Form';
import {
  GridList,
  GridListItem,
  GridListLoadMoreItem,
} from '@/components/AriaComponents/GridLists/GridList';
import { InputGroup } from '@/components/AriaComponents/InputGroup/InputGroup';
import {
  DropdownItem,
  DropdownListBox,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  ListBoxSection,
} from '@/components/AriaComponents/ListBox/ListBox';
import {
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  SubmenuTrigger,
} from '@/components/AriaComponents/Menu/Menu';
import { Popover } from '@/components/AriaComponents/Popover/Popover';
import { Slider } from '@/components/AriaComponents/Slider/Slider';
import { Switch } from '@/components/AriaComponents/Switch/Switch';
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  TableLoadMoreItem,
} from '@/components/AriaComponents/Table/Table';
import {
  Tree,
  TreeHeader,
  TreeItem,
  TreeLoadMoreItem,
  TreeSection,
} from '@/components/AriaComponents/Tree/Tree';

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds = [];

  disconnect() {}

  observe() {}

  takeRecords() {
    return [];
  }

  unobserve() {}
}

globalThis.IntersectionObserver ??= TestIntersectionObserver;
const originalUserAgent = navigator.userAgent;

function DragAndDropCollections() {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      Array.from(keys, (key) => ({ 'text/plain': String(key) })),
  });

  return (
    <>
      <GridList
        aria-label='Draggable applications'
        dragAndDropHooks={dragAndDropHooks}
      >
        <GridListItem>Draggable application</GridListItem>
      </GridList>
      <Table aria-label='Draggable files' dragAndDropHooks={dragAndDropHooks}>
        <TableHeader>
          <Column id='draggable-name'>Name</Column>
        </TableHeader>
        <TableBody>
          <Row id='draggable-row'>
            <Cell>Draggable file</Cell>
          </Row>
        </TableBody>
      </Table>
      <Tree aria-label='Draggable tree' dragAndDropHooks={dragAndDropHooks}>
        <TreeItem title='Draggable item' />
      </Tree>
    </>
  );
}

describe('React Aria coverage wrappers', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
  });

  it('renders the wrapper-only controls and their optional content', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();

    render(
      <>
        <AriaButton>Save</AriaButton>
        <AriaButton isPending>Save pending</AriaButton>
        <LoadingButton>Standard button</LoadingButton>
        <LoadingButton isPending>Pending button</LoadingButton>
        <Breadcrumbs aria-label='Path'>
          <Breadcrumb href='/'>Home</Breadcrumb>
          <Breadcrumb href='/services'>Services</Breadcrumb>
        </Breadcrumbs>
        <Calendar
          aria-label='Appointment date'
          visibleDuration={{ months: 2 }}
          errorMessage='Choose an available date'
        />
        <Calendar aria-label='Single month date' />
        <CheckboxGroup
          label='Notifications'
          description='Choose updates'
          errorMessage='Choose one'
          orientation='horizontal'
        >
          <Checkbox>News</Checkbox>
        </CheckboxGroup>
        <Checkbox isIndeterminate description='Mixed selection'>
          Mixed
        </Checkbox>
        <ColorArea defaultValue='hsl(30, 100%, 50%)' />
        <ColorField
          label='Color'
          description='Accepts hex, rgb or hsl notation.'
          errorMessage='Enter a color'
          placeholder='Enter a color'
        />
        <ColorPicker label='Fill color' defaultValue='#f00' />
        <ColorPicker label='Custom color' defaultValue='#0f0'>
          <span>Custom controls</span>
        </ColorPicker>
        <ColorSlider label='Red opacity' defaultValue='#f00' channel='alpha' />
        <ColorSwatch color='#f00' />
        <ColorSwatchPicker aria-label='Theme colors'>
          <ColorSwatchPickerItem key='red' color='#f00' />
          <ColorSwatchPickerItem key='blue' color='#00f' />
        </ColorSwatchPicker>
        <ColorWheel defaultValue='#f00' />
        <ComboBox
          label='Ice cream flavor'
          description='Choose one'
          errorMessage='Flavor is required'
          placeholder='Choose a flavor'
          selectionMode='multiple'
        >
          <ComboBoxItem id='chocolate'>Chocolate</ComboBoxItem>
          <ComboBoxItem id='mint'>Mint</ComboBoxItem>
        </ComboBox>
        <DateField
          label='Appointment'
          description='Select a date'
          errorMessage='Date is required'
          defaultValue={parseDate('2026-01-10')}
        />
        <DatePicker
          label='Start date'
          description='Choose a start date'
          errorMessage='Start date is required'
          defaultValue={parseDate('2026-01-10')}
        />
        <DateRangePicker
          label='Date range'
          description='Choose a range'
          errorMessage='Range is required'
          defaultValue={{
            start: parseDate('2026-01-10'),
            end: parseDate('2026-01-12'),
          }}
        />
        <RangeCalendar aria-label='Simple range' />
        <DisclosureGroup>
          <Disclosure>
            <DisclosureHeader>Details</DisclosureHeader>
            <DisclosurePanel>More details</DisclosurePanel>
          </Disclosure>
        </DisclosureGroup>
        <DropZone>
          <DropZoneText>Drop files here</DropZoneText>
        </DropZone>
        <Form>
          <Label>Reference</Label>
          <Description>Reference description</Description>
          <FieldError>Reference error</FieldError>
          <FieldButton>Choose</FieldButton>
        </Form>
        <InputGroup label='Certificate number'>
          <Input aria-label='Certificate number' placeholder='5/6A/91B' />
        </InputGroup>
        <InputGroup>
          <Input aria-label='Search' placeholder='Search applications' />
        </InputGroup>
        <ListBox aria-label='Services'>
          <ListBoxSection>
            <ListBoxItem id='mass'>Mass</ListBoxItem>
            <ListBoxItem id='custom' textValue='Custom'>
              <span>Custom</span>
            </ListBoxItem>
          </ListBoxSection>
          <ListBoxLoadMoreItem onLoadMore={vi.fn<() => void>()} />
        </ListBox>
        <DropdownListBox
          aria-label='Dropdown services'
          selectionMode='single'
          selectedKeys={['selected']}
        >
          <DropdownItem id='selected'>Selected</DropdownItem>
          <DropdownItem id='custom-dropdown'>
            <span>Custom dropdown</span>
          </DropdownItem>
        </DropdownListBox>
        <MenuTrigger>
          <AriaButton>Actions</AriaButton>
          <Menu selectionMode='multiple' selectedKeys={['copy']}>
            <MenuSection>
              <MenuItem id='copy'>Copy</MenuItem>
              <MenuItem id='custom-menu-item'>
                <span>Custom menu item</span>
              </MenuItem>
            </MenuSection>
            <SubmenuTrigger>
              <MenuItem id='share'>Share</MenuItem>
              <Menu>
                <MenuItem id='email'>Email</MenuItem>
              </Menu>
            </SubmenuTrigger>
          </Menu>
        </MenuTrigger>
        <MenuTrigger>
          <AriaButton>Single actions</AriaButton>
          <Menu selectionMode='single' selectedKeys={['single']}>
            <MenuItem id='single'>Single selected</MenuItem>
          </Menu>
        </MenuTrigger>
        <Popover>Popover content</Popover>
        <Slider label='Target' defaultValue={50} minValue={0} maxValue={100} />
        <Switch defaultSelected description='Enabled' errorMessage='Required'>
          Enabled option
        </Switch>
      </>,
    );

    expect(screen.getByText('Choose an available date')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Enabled option' }),
    ).toBeChecked();
    expect(screen.getByRole('slider', { name: 'Target' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Single actions' }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('renders grid, table, and tree wrappers with optional affordances', () => {
    expect.hasAssertions();

    render(
      <>
        <GridList
          aria-label='Applications'
          selectionMode='multiple'
          selectionBehavior='toggle'
        >
          <GridListItem>Application</GridListItem>
          <GridListLoadMoreItem onLoadMore={vi.fn<() => void>()} />
        </GridList>
        <GridList aria-label='Simple applications'>
          <GridListItem>Simple application</GridListItem>
          <GridListItem textValue='Custom application'>
            <span>Custom application</span>
          </GridListItem>
        </GridList>
        <DragAndDropCollections />
        <ResizableTableContainer>
          <Table
            aria-label='Files'
            treeColumn='name'
            selectionMode='multiple'
            selectionBehavior='toggle'
            sortDescriptor={{ column: 'name', direction: 'descending' }}
          >
            <TableHeader>
              <Column id='name' isRowHeader allowsSorting allowsResizing>
                Name
              </Column>
              <Column id='type'>Type</Column>
            </TableHeader>
            <TableBody>
              <Row id='documents' hasChildItems>
                <Cell>Documents</Cell>
                <Cell>Folder</Cell>
              </Row>
              <Row id='leaf' hasChildItems={false}>
                <Cell>Leaf</Cell>
                <Cell>File</Cell>
              </Row>
              <TableLoadMoreItem onLoadMore={vi.fn<() => void>()} />
            </TableBody>
            <TableFooter>Footer</TableFooter>
          </Table>
        </ResizableTableContainer>
        <Table
          aria-label='Simple files'
          sortDescriptor={{ column: 'simple-name', direction: 'ascending' }}
        >
          <TableHeader>
            <Column id='simple-name' allowsSorting>
              Name
            </Column>
          </TableHeader>
          <TableBody>
            <Row id='simple-row'>
              <Cell>Simple file</Cell>
            </Row>
          </TableBody>
        </Table>
        <Tree
          aria-label='Files tree'
          selectionMode='multiple'
          selectionBehavior='toggle'
        >
          <TreeSection>
            <TreeHeader>Documents</TreeHeader>
            <TreeItem title='Reports'>
              <TreeItem title='Annual report' />
            </TreeItem>
            <TreeItem textValue='Untitled'>
              <span>Untitled</span>
            </TreeItem>
          </TreeSection>
          <TreeLoadMoreItem onLoadMore={vi.fn<() => void>()} />
        </Tree>
        <Tree aria-label='Simple tree'>
          <TreeItem title='Simple item' />
        </Tree>
      </>,
    );

    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeInTheDocument();
    expect(
      screen.getByRole('treegrid', { name: 'Files tree' }),
    ).toBeInTheDocument();
  });

  it('opens and closes the command palette from its keyboard shortcuts', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onOpenChange = vi.fn<(isOpen?: boolean) => void>();
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0',
    });

    const { unmount } = render(
      <CommandPalette aria-label='Commands' isOpen onOpenChange={onOpenChange}>
        <MenuItem id='dashboard'>Dashboard</MenuItem>
      </CommandPalette>,
    );

    await user.keyboard('{Control>}j{/Control}{Escape}');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);

    unmount();

    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Macintosh',
    });
    const { unmount: unmountMac } = render(
      <CommandPalette aria-label='Commands' isOpen onOpenChange={onOpenChange}>
        <MenuItem id='dashboard'>Dashboard</MenuItem>
      </CommandPalette>,
    );
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'j', metaKey: true }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(true);

    unmountMac();

    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
  });
});
