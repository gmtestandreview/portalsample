import type {ComponentPropsWithoutRef, CSSProperties} from 'react';

type NmiIconProps = Omit<ComponentPropsWithoutRef<'i'>, 'children'> & {
    size?: number | string;
    strokeWidth?: number;
};

function createNmiIcon(icon: string) {
    return function NmiIcon({
        className,
        size,
        strokeWidth: _strokeWidth,
        style,
        ...props
    }: NmiIconProps) {
        const iconStyle: CSSProperties = {
            ...style,
            ...(size === undefined ? {} : {fontSize: size}),
        };

        return (
            <i
                {...props}
                aria-hidden={props['aria-label'] ? undefined : true}
                className={`nmi-react-aria-icon icon-${icon}${className ? ` ${className}` : ''}`}
                data-nmi-icon={icon}
                style={iconStyle}
            />
        );
    };
}

export const Check = createNmiIcon('tick');
export const ChevronDown = createNmiIcon('chevron-down');
export const ChevronLeft = createNmiIcon('chevron-left');
export const ChevronRight = createNmiIcon('chevron-right');
export const ChevronUp = createNmiIcon('chevron-up');
export const Dot = createNmiIcon('dot');
export const GripVertical = createNmiIcon('menu');
export const HelpCircle = createNmiIcon('question');
export const Minus = createNmiIcon('minus');
export const Plus = createNmiIcon('plus');
export const Save = createNmiIcon('save');
export const Search = createNmiIcon('search');
export const X = createNmiIcon('close');
