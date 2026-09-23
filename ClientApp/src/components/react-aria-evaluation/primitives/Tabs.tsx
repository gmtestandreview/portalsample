'use client';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import {
  Tab as RacTab,
  TabList as RacTabList,
  TabPanel as RacTabPanel,
  TabPanels as RacTabPanels,
  Tabs as RacTabs,
  SelectionIndicator,
  type TabListProps,
  type TabPanelProps,
  type TabPanelsProps,
  type TabProps,
  type TabsProps,
} from 'react-aria-components/Tabs';
import './Tabs.css';

export function Tabs(props: Readonly<TabsProps>) {
  return <RacTabs {...props} />;
}

export function TabList<T>(props: Readonly<TabListProps<T>>) {
  return <RacTabList {...props} />;
}

export function Tab(props: Readonly<TabProps>) {
  return (
    <RacTab {...props}>
      {composeRenderProps(props.children, (children) => (
        <>
          {children}
          <SelectionIndicator />
        </>
      ))}
    </RacTab>
  );
}

export function TabPanels<T>(props: Readonly<TabPanelsProps<T>>) {
  return <RacTabPanels {...props} />;
}

export function TabPanel(props: Readonly<TabPanelProps>) {
  return <RacTabPanel {...props} />;
}
