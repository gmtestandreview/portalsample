'use client';
import {
  Tabs as RACTabs,
  TabList as RACTabList,
  type TabListProps,
  type TabProps,
  Tab as RACTab,
  type TabsProps,
  TabPanels as RACTabPanels,
  type TabPanelProps,
  TabPanel as RACTabPanel,
  SelectionIndicator,
  type TabPanelsProps,
} from 'react-aria-components/Tabs';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import './Tabs.css';

export function Tabs(props: Readonly<TabsProps>) {
  return <RACTabs {...props} />;
}

export function TabList<T>(props: Readonly<TabListProps<T>>) {
  return <RACTabList {...props} />;
}

export function Tab(props: Readonly<TabProps>) {
  return (
    <RACTab {...props}>
      {composeRenderProps(props.children, (children) => (
        <>
          {children}
          <SelectionIndicator />
        </>
      ))}
    </RACTab>
  );
}

export function TabPanels<T>(props: Readonly<TabPanelsProps<T>>) {
  return <RACTabPanels {...props} />;
}

export function TabPanel(props: Readonly<TabPanelProps>) {
  return <RACTabPanel {...props} />;
}
