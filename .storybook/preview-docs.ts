import { createElement, Fragment } from 'react';
import {
    Title,
    Subtitle,
    Description,
    Primary,
    Controls,
    Stories,
} from '@storybook/addon-docs/blocks';

export const autoDocsTemplate = () =>
    createElement(
        Fragment,
        null,
        createElement(Title),
        createElement(Subtitle),
        createElement(Description),
        createElement(Primary),
        createElement(Controls),
        createElement(Stories),
    );

export const expectedAddonDocsConfig = {
    options: {
        autodocs: 'tag',
        defaultName: 'Documentation',
        docsMode: true,
    },
};