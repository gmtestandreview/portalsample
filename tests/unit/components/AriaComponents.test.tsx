import { Time, parseDate } from '@internationalized/date';

import { act } from 'react';

import { render, screen, waitFor, within } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import { ResizableTableContainer } from 'react-aria-components/Table';

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

if (!Element.prototype.getAnimations) {
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: vi.fn(() => []),
    writable: true,
  });
}

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

describe('react Aria evaluation wrappers', () => {
  it('renders content, links, separators, and icons through their public wrappers', () => {
    expect.assertions(1);
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
    expect(
      screen.getByRole('heading', { level: 2, name: 'Calibration services' }),
    ).toBeInTheDocument();
  });
});

describe('react Aria evaluation wrappers', () => {
  it('renders content, links, separators, and icons through their public wrappers', () => {
    expect.assertions(1);
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
    expect(screen.getByText('Choose a service type')).toBeInTheDocument();
  });
});

describe('react Aria evaluation wrappers', () => {
  it('renders content, links, separators, and icons through their public wrappers', () => {
    expect.assertions(1);
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
    expect(screen.getByRole('link', { name: 'NMI' })).toHaveAttribute(
      'href',
      'https://measurement.gov.au',
    );
  });
});

describe('react Aria evaluation wrappers', () => {
  it('renders content, links, separators, and icons through their public wrappers', () => {
    expect.assertions(1);
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
    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });
});

describe('react Aria evaluation wrappers', () => {
  it('renders content, links, separators, and icons through their public wrappers', () => {
    expect.assertions(1);
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
    expect(decorativeIcon).toHaveClass(
      'nmi-react-aria-icon',
      'icon-tick',
      'status-icon',
    );
  });
});
