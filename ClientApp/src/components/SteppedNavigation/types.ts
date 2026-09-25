export interface SteppedNavigationStep {
    title: string;
    path?: string;
    completed?: boolean;
}

export interface SteppedNavigationProps {
    activeStep: number;
    steps: SteppedNavigationStep[];
    id?: string;
    interactive?: boolean;
}
