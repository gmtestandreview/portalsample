'use client';
import { useEffect } from 'react';
import {
  Autocomplete as AriaAutocomplete,
  type AutocompleteProps as AriaAutocompleteProps,
  useFilter,
} from 'react-aria-components/Autocomplete';
import { Dialog } from 'react-aria-components/Dialog';
import type { MenuProps as AriaMenuProps } from 'react-aria-components/Menu';
import { Menu } from '../react-aria-evaluation/primitives/Menu.tsx';
import { Modal } from '../react-aria-evaluation/primitives/Modal.tsx';
import { SearchField } from '../react-aria-evaluation/primitives/SearchField.tsx';
import './CommandPalette.css';

export interface CommandPaletteProps<T>
  extends Omit<AriaAutocompleteProps, 'children'>, AriaMenuProps<T> {
  isOpen: boolean;
  onOpenChange: (isOpen?: boolean) => void;
}

export function CommandPalette<T>(props: CommandPaletteProps<T>) {
  const { isOpen, onOpenChange } = props;
  const { contains } = useFilter({ sensitivity: 'base' });

  useEffect(() => {
    const isMacUa = /mac(os|intosh)/iu.test(navigator.userAgent);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'j' && (isMacUa ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  return (
    <Modal isDismissable={true} isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog className='command-palette-dialog'>
        <AriaAutocomplete filter={contains} {...props}>
          <SearchField
            autoFocus={true}
            aria-label='Search commands'
            placeholder='Search commands'
          />
          <Menu {...props} renderEmptyState={() => 'No results found.'} />
        </AriaAutocomplete>
      </Dialog>
    </Modal>
  );
}
