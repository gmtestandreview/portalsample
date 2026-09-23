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

export function Tabs(props: TabsProps) {
  return <RacTabs {...props} />;
}

export function TabList<T>(props: TabListProps<T>) {
  return <RacTabList {...props} />;
}

export function Tab(props: TabProps) {
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

export function TabPanels<T>(props: TabPanelsProps<T>) {
  return <RacTabPanels {...props} />;
}

export function TabPanel(props: TabPanelProps) {
  return <RacTabPanel {...props} />;
}
