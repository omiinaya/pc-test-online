import { h } from 'vue';

/**
 * Centralized icon definitions as Vue render functions
 * This reduces code duplication and ensures consistency
 */

// Common icon properties
const defaultIconProps = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

/**
 * Create SVG icon component
 */
const createIcon = (paths, props = {}) => {
    return (iconProps = {}) => {
        const mergedProps = { ...defaultIconProps, ...props, ...iconProps };
        return h(
            'svg',
            mergedProps,
            paths.map(path =>
                typeof path === 'string'
                    ? h('path', { d: path })
                    : h(path.tag || 'path', path.attrs || {}, path.children)
            )
        );
    };
};

// Error/Alert Icons
export const AlertTriangleIcon = createIcon([
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    { tag: 'line', attrs: { x1: '12', y1: '9', x2: '12', y2: '13' } },
    { tag: 'line', attrs: { x1: '12', y1: '17', x2: '12.01', y2: '17' } },
]);

export const AlertCircleIcon = createIcon([
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { tag: 'line', attrs: { x1: '12', y1: '8', x2: '12', y2: '12' } },
    { tag: 'line', attrs: { x1: '12', y1: '16', x2: '12.01', y2: '16' } },
]);

export const XCircleIcon = createIcon([
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { tag: 'line', attrs: { x1: '15', y1: '9', x2: '9', y2: '15' } },
    { tag: 'line', attrs: { x1: '9', y1: '9', x2: '15', y2: '15' } },
]);

// Success Icons
export const CheckCircleIcon = createIcon([
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { tag: 'polyline', attrs: { points: '9,12 12,15 16,10' } },
]);

export const CheckIcon = createIcon([{ tag: 'polyline', attrs: { points: '20,6 9,17 4,12' } }]);

// Loading/Spinner Icons
export const LoaderIcon = createIcon([
    { tag: 'line', attrs: { x1: '12', y1: '2', x2: '12', y2: '6' } },
    { tag: 'line', attrs: { x1: '12', y1: '18', x2: '12', y2: '22' } },
    { tag: 'line', attrs: { x1: '4.93', y1: '4.93', x2: '7.76', y2: '7.76' } },
    { tag: 'line', attrs: { x1: '16.24', y1: '16.24', x2: '19.07', y2: '19.07' } },
    { tag: 'line', attrs: { x1: '2', y1: '12', x2: '6', y2: '12' } },
    { tag: 'line', attrs: { x1: '18', y1: '12', x2: '22', y2: '12' } },
    { tag: 'line', attrs: { x1: '4.93', y1: '19.07', x2: '7.76', y2: '16.24' } },
    { tag: 'line', attrs: { x1: '16.24', y1: '7.76', x2: '19.07', y2: '4.93' } },
]);

// Permission/Lock Icons
export const LockIcon = createIcon([
    { tag: 'rect', attrs: { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' } },
    'M7 11V7a5 5 0 0 1 10 0v4',
]);

export const UnlockIcon = createIcon([
    { tag: 'rect', attrs: { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' } },
    'M7 11V7a5 5 0 0 1 9.9-1',
]);

// Device Icons
export const CameraIcon = createIcon([
    'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z',
    { tag: 'circle', attrs: { cx: '12', cy: '13', r: '4' } },
]);

export const MicIcon = createIcon([
    'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z',
    'M19 10v2a7 7 0 0 1-14 0v-2',
    { tag: 'line', attrs: { x1: '12', y1: '19', x2: '12', y2: '23' } },
    { tag: 'line', attrs: { x1: '8', y1: '23', x2: '16', y2: '23' } },
]);

export const SpeakerIcon = createIcon([
    { tag: 'rect', attrs: { x: '4', y: '2', width: '16', height: '20', rx: '2', ry: '2' } },
    { tag: 'circle', attrs: { cx: '12', cy: '14', r: '4' } },
    { tag: 'line', attrs: { x1: '12', y1: '6', x2: '12', y2: '6' } },
]);

// Navigation Icons
export const ArrowUpIcon = createIcon([
    { tag: 'line', attrs: { x1: '12', y1: '19', x2: '12', y2: '5' } },
    { tag: 'polyline', attrs: { points: '5,12 12,5 19,12' } },
]);

export const ArrowDownIcon = createIcon([
    { tag: 'line', attrs: { x1: '12', y1: '5', x2: '12', y2: '19' } },
    { tag: 'polyline', attrs: { points: '19,12 12,19 5,12' } },
]);

export const ArrowRightIcon = createIcon([
    { tag: 'line', attrs: { x1: '5', y1: '12', x2: '19', y2: '12' } },
    { tag: 'polyline', attrs: { points: '12,5 19,12 12,19' } },
]);

export const RefreshIcon = createIcon([
    { tag: 'polyline', attrs: { points: '1,4 1,10 7,10' } },
    'M3.51 15a9 9 0 1 0 2.13-9.36L1 10',
]);

// Media Icons
export const PlayIcon = createIcon([{ tag: 'polygon', attrs: { points: '5,3 19,12 5,21 5,3' } }]);

export const PauseIcon = createIcon([
    { tag: 'rect', attrs: { x: '6', y: '4', width: '4', height: '16' } },
    { tag: 'rect', attrs: { x: '14', y: '4', width: '4', height: '16' } },
]);

// Utility Icons
export const InfoIcon = createIcon([
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { tag: 'line', attrs: { x1: '12', y1: '16', x2: '12', y2: '12' } },
    { tag: 'line', attrs: { x1: '12', y1: '8', x2: '12.01', y2: '8' } },
]);

export const SettingsIcon = createIcon([
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
]);

/**
 * Composable for icon usage
 */
export function useIcons() {
    /**
     * Get icon component by name
     */
    const getIcon = (iconName, props = {}) => {
        const iconMap = {
            'alert-triangle': AlertTriangleIcon,
            'alert-circle': AlertCircleIcon,
            'x-circle': XCircleIcon,
            'check-circle': CheckCircleIcon,
            check: CheckIcon,
            loader: LoaderIcon,
            lock: LockIcon,
            unlock: UnlockIcon,
            camera: CameraIcon,
            mic: MicIcon,
            speaker: SpeakerIcon,
            'arrow-up': ArrowUpIcon,
            'arrow-down': ArrowDownIcon,
            'arrow-right': ArrowRightIcon,
            refresh: RefreshIcon,
            play: PlayIcon,
            pause: PauseIcon,
            info: InfoIcon,
            settings: SettingsIcon,
        };

        const IconComponent = iconMap[iconName];
        return IconComponent ? IconComponent(props) : null;
    };

    /**
     * Create icon with custom props
     */
    const createIconWithProps = (iconName, defaultProps = {}) => {
        return (props = {}) => getIcon(iconName, { ...defaultProps, ...props });
    };

    return {
        getIcon,
        createIconWithProps,
        // Export individual icons for direct use
        AlertTriangleIcon,
        AlertCircleIcon,
        XCircleIcon,
        CheckCircleIcon,
        CheckIcon,
        LoaderIcon,
        LockIcon,
        UnlockIcon,
        CameraIcon,
        MicIcon,
        SpeakerIcon,
        ArrowUpIcon,
        ArrowDownIcon,
        ArrowRightIcon,
        RefreshIcon,
        PlayIcon,
        PauseIcon,
        InfoIcon,
        SettingsIcon,
    };
}
