<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTestResults } from '../composables/useTestResults.js';
import { useComponentLifecycle } from '../composables/useComponentLifecycle.js';
import { usePointerEvents } from '../composables/useEventListeners.js';
import { useGlobalReset } from '../composables/useTestState.js';
import { useTouchCompatibility } from '../composables/useTouchCompatibility.ts';

const keyboardLayoutDefinition = {
    main: [
        [
            { code: 'Backquote', display: '`' },
            { code: 'Digit1', display: '1' },
            { code: 'Digit2', display: '2' },
            { code: 'Digit3', display: '3' },
            { code: 'Digit4', display: '4' },
            { code: 'Digit5', display: '5' },
            { code: 'Digit6', display: '6' },
            { code: 'Digit7', display: '7' },
            { code: 'Digit8', display: '8' },
            { code: 'Digit9', display: '9' },
            { code: 'Digit0', display: '0' },
            { code: 'Minus', display: '-' },
            { code: 'Equal', display: '=' },
            { code: 'Backspace', style: 'utility key-backspace' },
        ],
        [
            { code: 'Tab', style: 'utility key-tab' },
            { code: 'KeyQ', display: 'Q' },
            { code: 'KeyW', display: 'W' },
            { code: 'KeyE', display: 'E' },
            { code: 'KeyR', display: 'R' },
            { code: 'KeyT', display: 'T' },
            { code: 'KeyY', display: 'Y' },
            { code: 'KeyU', display: 'U' },
            { code: 'KeyI', display: 'I' },
            { code: 'KeyO', display: 'O' },
            { code: 'KeyP', display: 'P' },
            { code: 'BracketLeft', display: '[' },
            { code: 'BracketRight', display: ']' },
            { code: 'Backslash', display: '\\', style: 'utility key-backslash' },
        ],
        [
            { code: 'CapsLock', display: 'Caps', style: 'utility key-caps' },
            { code: 'KeyA', display: 'A' },
            { code: 'KeyS', display: 'S' },
            { code: 'KeyD', display: 'D' },
            { code: 'KeyF', display: 'F' },
            { code: 'KeyG', display: 'G' },
            { code: 'KeyH', display: 'H' },
            { code: 'KeyJ', display: 'J' },
            { code: 'KeyK', display: 'K' },
            { code: 'KeyL', display: 'L' },
            { code: 'Semicolon', display: ';' },
            { code: 'Quote', display: "'" },
            { code: 'Enter', style: 'utility key-enter' },
        ],
        [
            { code: 'ShiftLeft', display: 'Shift', style: 'utility key-shift-left' },
            { code: 'KeyZ', display: 'Z' },
            { code: 'KeyX', display: 'X' },
            { code: 'KeyC', display: 'C' },
            { code: 'KeyV', display: 'V' },
            { code: 'KeyB', display: 'B' },
            { code: 'KeyN', display: 'N' },
            { code: 'KeyM', display: 'M' },
            { code: 'Comma', display: ',' },
            { code: 'Period', display: '.' },
            { code: 'Slash', display: '/' },
            {
                code: 'ShiftRight',
                display: 'Shift',
                style: 'utility key-shift-right',
            },
        ],
        [
            { code: 'ControlLeft', display: 'Ctrl', style: 'utility' },
            { code: 'MetaLeft', display: 'Win', style: 'utility' },
            { code: 'AltLeft', display: 'Alt', style: 'utility' },
            { code: 'Space', style: 'key-space' },
            { code: 'AltRight', display: 'Alt', style: 'utility' },
            { code: 'MetaRight', display: 'Win', style: 'utility' },
            { code: 'ControlRight', display: 'Ctrl', style: 'utility' },
        ],
    ],
    functions: [
        [
            { code: 'Escape', display: 'Esc', style: 'utility' },
            { code: 'blank', style: 'key-blank-f' },
            { code: 'F1', style: 'utility' },
            { code: 'F2', style: 'utility' },
            { code: 'F3', style: 'utility' },
            { code: 'F4', style: 'utility' },
            { code: 'blank', style: 'key-blank-f' },
            { code: 'F5', style: 'utility' },
            { code: 'F6', style: 'utility' },
            { code: 'F7', style: 'utility' },
            { code: 'F8', style: 'utility' },
            { code: 'blank', style: 'key-blank-f' },
            { code: 'F9', style: 'utility' },
            { code: 'F10', style: 'utility' },
            { code: 'F11', style: 'utility' },
            { code: 'F12', style: 'utility' },
        ],
    ],
    navigation: [
        [
            { code: 'Insert', display: 'Ins', style: 'utility' },
            { code: 'Home', style: 'utility' },
            { code: 'PageUp', display: 'PgUp', style: 'utility' },
        ],
        [
            { code: 'Delete', display: 'Del', style: 'utility' },
            { code: 'End', style: 'utility' },
            { code: 'PageDown', display: 'PgDn', style: 'utility' },
        ],
        [
            { code: 'blank', style: 'key-blank' },
            { code: 'blank', style: 'key-blank' },
            { code: 'blank', style: 'key-blank' },
        ],
        [
            { code: 'blank', style: 'key-blank' },
            { code: 'ArrowUp', display: '↑', style: 'utility' },
            { code: 'blank', style: 'key-blank' },
        ],
        [
            { code: 'ArrowLeft', display: '←', style: 'utility' },
            { code: 'ArrowDown', display: '↓', style: 'utility' },
            { code: 'ArrowRight', display: '→', style: 'utility' },
        ],
    ],
};

export default {
    name: 'KeyboardTest',
    components: {},
    emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],
    setup(props, { emit }) {
        // Initialize composables for normalized patterns
        const testResults = useTestResults('keyboard', emit);
        const lifecycle = useComponentLifecycle();
        const pointerEvents = usePointerEvents();
        const touchCompat = useTouchCompatibility();

        // Reactive state
        const keyboardLayout = ref({
            main: [],
            functions: [],
            navigation: [],
            arrows: [],
        });
        const testCompleted = ref(false);
        const isMobile = computed(() => touchCompat.isMobile);

        // Computed properties
        const pressedKeysCount = computed(() => {
            const allKeys = Object.values(keyboardLayout.value).flat(2);
            return allKeys.filter(k => k.pressed).length;
        });

        // Methods
        const initializeKeyboard = () => {
            for (const section in keyboardLayoutDefinition) {
                keyboardLayout.value[section] = keyboardLayoutDefinition[section].map(row =>
                    row.map(key => {
                        const isBlank = key.code === 'blank';
                        const display = isBlank ? '' : key.display || key.code;
                        if (!isBlank);
                        return {
                            ...key,
                            display,
                            pressed: false,
                            active: false,
                            releasing: false,
                            tested: false,
                            code: isBlank ? `blank-${Math.random()}` : key.code,
                        };
                    })
                );
            }
        };

        const handleKeyDown = e => {
            e.preventDefault();

            // Start test timing on first key press
            if (testResults && testResults.testStatus === 'pending') {
                testResults.startTest();
            }

            const key = findKey(e.code);
            if (key) {
                key.releasing = false;
                key.pressed = true;
                key.active = true;
                key.tested = true;
            }
        };

        const handleKeyUp = e => {
            const key = findKey(e.code);
            if (key) {
                key.pressed = false;
                key.active = false;
                key.releasing = true;
                setTimeout(() => {
                    if (key) key.releasing = false;
                }, 150); // Match the keyRelease animation duration
            }
        };

        const findKey = code => {
            for (const section in keyboardLayout.value) {
                for (const row of keyboardLayout.value[section]) {
                    const found = row.find(k => k.code === code);
                    if (found) return found;
                }
            }
            return null;
        };

        const resetTest = () => {
            initializeKeyboard();
            testCompleted.value = false;
            testResults.resetTest();
        };

        // Helper method to convert old style classes to BEM modifiers
        const getKeyModifierClass = (style) => {
            if (!style) return '';
            const styleMap = {
                'utility': 'keyboard__key--utility',
                'key-space': 'keyboard__key--space',
                'key-backspace': 'keyboard__key--backspace',
                'key-tab': 'keyboard__key--tab',
                'key-caps': 'keyboard__key--caps',
                'key-enter': 'keyboard__key--enter',
                'key-shift-left': 'keyboard__key--shift-left',
                'key-shift-right': 'keyboard__key--shift-right',
                'key-backslash': 'keyboard__key--backslash',
                'key-blank': 'keyboard__key--blank',
                'key-blank-f': 'keyboard__key--blank-f'
            };
            return styleMap[style] || '';
        };

        // Watch for global resets
        useGlobalReset(resetTest);

        // Initialize keyboard layout
        initializeKeyboard();

        // Lifecycle hooks using composables
        onMounted(() => {
            lifecycle.initialize(() => {
                pointerEvents.addKeyboardListeners({
                    onKeyDown: handleKeyDown,
                    onKeyUp: handleKeyUp,
                });
            });
        });

        onUnmounted(() => {
            lifecycle.cleanup(() => {
                // Event listeners are automatically cleaned up by useEventListeners
            });
        });

        return {
            // State
            keyboardLayout,
            testCompleted,
            isMobile,

            // Computed
            pressedKeysCount,

            // Methods
            resetTest,
            getKeyModifierClass,
        };
    },
};
</script>

<template>
    <div class="keyboard-view">
        <!-- Mobile detection message -->
        <div v-if="isMobile" class="mobile-notice">
            <div class="mobile-notice-content">
                <div class="mobile-icon">📱</div>
                <h3>{{ $t('keyboard.mobile_unavailable') }}</h3>
                <p>
                    {{ $t('keyboard.mobile_description') }}
                </p>
                <p>
                    <strong>{{ $t('keyboard.mobile_what_can_do') }}</strong>
                </p>
                <ul>
                    <li v-for="(option, index) in $t('keyboard.mobile_options')" :key="index">{{ option }}</li>
                </ul>
                <button class="button button--primary button--medium" @click="$emit('test-skipped')">
                    {{ $t('keyboard.skip_test') }}
                </button>
            </div>
        </div>

        <!-- Keyboard test for non-mobile devices -->
        <div v-else class="keyboard">
            <div class="keyboard__section keyboard__section--function">
                <div class="keyboard__row">
                    <div
                        v-for="key in keyboardLayout.functions[0]"
                        :key="key.code"
                        :data-code="key.code"
                        class="keyboard__key"
                        :class="[
                            getKeyModifierClass(key.style),
                            {
                                'keyboard__key--pressed': key.pressed,
                                'keyboard__key--active': key.active,
                                'keyboard__key--tested': key.tested,
                                'keyboard__key--releasing': key.releasing,
                                'keyboard__key--blank': key.code === 'blank',
                            },
                        ]"
                    >
                        <span v-if="key.code !== 'blank'">{{ key.display }}</span>
                    </div>
                </div>
            </div>

            <div class="keyboard__section keyboard__section--main">
                <div class="keyboard__main-keys">
                    <div
                        v-for="(row, rowIndex) in keyboardLayout.main"
                        :key="`row-${rowIndex}`"
                        class="keyboard__row"
                    >
                        <div
                            v-for="key in row"
                            :key="key.code"
                            :data-code="key.code"
                            class="keyboard__key"
                            :class="[
                                getKeyModifierClass(key.style),
                                {
                                    'keyboard__key--pressed': key.pressed,
                                    'keyboard__key--active': key.active,
                                    'keyboard__key--tested': key.tested,
                                    'keyboard__key--releasing': key.releasing,
                                    'keyboard__key--blank': key.code === 'blank',
                                },
                            ]"
                        >
                            <span>{{ key.display }}</span>
                        </div>
                    </div>
                </div>

                <div class="keyboard__side-section">
                    <div class="keyboard__nav-keys">
                        <div
                            v-for="(row, rowIndex) in keyboardLayout.navigation"
                            :key="`nav-row-${rowIndex}`"
                            class="keyboard__row"
                        >
                            <div
                                v-for="key in row"
                                :key="key.code"
                                :data-code="key.code"
                                class="keyboard__key"
                                :class="[
                                    getKeyModifierClass(key.style),
                                    {
                                        'keyboard__key--pressed': key.pressed,
                                        'keyboard__key--active': key.active,
                                        'keyboard__key--tested': key.tested,
                                        'keyboard__key--releasing': key.releasing,
                                        'keyboard__key--blank': key.code === 'blank',
                                    },
                                ]"
                            >
                                <span v-if="key.code !== 'blank'">{{ key.display }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes keyboard__key-press {
    0% {
        transform: translateY(0) translateZ(0);
        border-bottom-width: 3px;
    }

    100% {
        transform: translateY(2px) translateZ(0);
        border-bottom-width: 1px;
    }
}

@keyframes keyboard__key-release {
    0% {
        transform: translateY(2px) translateZ(0);
        border-bottom-width: 1px;
    }

    100% {
        transform: translateY(0) translateZ(0);
        border-bottom-width: 3px;
    }
}

.keyboard-test-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.test-area {
    display: block;
    background: none;
    border: none;
    border-radius: 0;
    overflow: visible;
    position: static;
    min-height: unset;
    height: unset;
    box-shadow: none;
}

.keyboard-test-container,
.test-area,
.keyboard-view {
    display: block;
    min-height: unset;
    height: unset;
}

.keyboard-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow-x: hidden;
}

.test-info {
    text-align: center;
    margin-bottom: 1.5rem;
}

.test-info .status {
    font-size: 1.1rem;
    color: #e0e0e0;
}

.keyboard {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--spacing-lg);
    background-color: var(--surface-secondary);
    border-radius: var(--border-radius-medium);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-large);
    width: 100%;
    padding-top: 10%;
    padding-bottom: 10%;
    min-width: auto;
    box-sizing: border-box;
    justify-content: center;
    margin: 0 auto;
}

.keyboard__section {
    display: flex;
    gap: 8px;
}

.keyboard__section--function {
    margin-bottom: 8px;
}

.keyboard__section--main {
    display: flex;
    gap: 16px;
}

.keyboard__main-keys {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.keyboard__side-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.keyboard__nav-keys {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.keyboard__row {
    display: flex;
    gap: 3px;
    width: 100%;
}

.keyboard__key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    min-width: 32px;
    flex-basis: 0;
    flex-grow: 1;
    max-width: 55px;
    padding: 0 3px;
    background-color: var(--surface-tertiary);
    color: var(--text-primary);
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
    border-bottom: 2px solid var(--border-color);
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 10px;
    transition: all var(--animation-fast) cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    position: relative;
    top: 0;
    box-sizing: border-box;
    will-change: transform, background-color;
    backface-visibility: hidden;
    transform: translateZ(0);
}

.keyboard__key--tested {
    background-color: var(--primary-color);
}

.keyboard__key--pressed {
    animation: keyboard__key-press var(--animation-fast) cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.keyboard__key--releasing {
    animation: keyboard__key-release var(--animation-fast) cubic-bezier(0.2, 0, 0.4, 1) forwards;
}

.keyboard__key--active {
    background-color: var(--primary-color);
    animation: keyboard__key-press var(--animation-fast) cubic-bezier(0.4, 0, 0.2, 1) forwards;
    box-shadow: 0 0 5px rgba(255, 107, 0, 0.5);
    z-index: 1;
}

.keyboard__key--utility {
    background-color: var(--surface-quaternary);
    color: var(--text-secondary);
}

.keyboard__key--utility.keyboard__key--tested {
    background-color: var(--primary-color);
    color: var(--text-primary);
}

.keyboard__key--utility.keyboard__key--pressed,
.keyboard__key--utility.keyboard__key--active {
    background-color: var(--primary-color);
    color: var(--text-primary);
}

.keyboard__key--utility.keyboard__key--releasing {
    color: var(--text-primary);
}

.keyboard__key--space {
    min-width: 160px;
    flex-grow: 6;
    max-width: 280px;
}

.keyboard__key--backspace,
.keyboard__key--caps,
.keyboard__key--enter {
    min-width: 65px;
    flex-grow: 2.2;
    max-width: 95px;
}

.keyboard__key--tab {
    min-width: 50px;
    flex-grow: 1.8;
    max-width: 75px;
}

.keyboard__key--shift-left,
.keyboard__key--shift-right {
    min-width: 80px;
    flex-grow: 2.8;
    max-width: 110px;
}

.keyboard__key--blank,
.keyboard__key--blank-f {
    background-color: transparent;
    border-color: transparent;
    pointer-events: none;
    box-shadow: none;
    color: transparent;
    min-width: 0;
    flex-basis: 0;
    width: 0;
    padding: 0;
}

/* --- Controls Bar --- */
.controls-bar {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
    background-color: var(--surface-primary);
    border-top: 1px solid var(--border-color);
    margin-top: auto;
}

/* Responsive Design - Better scaling for different screen sizes */
@media (max-width: 1080px) {
    .keyboard {
        max-width: min(90vw, 800px);
        padding: var(--spacing-sm);
    }

    .keyboard__key {
        height: clamp(24px, 2vh, 32px);
        min-width: clamp(24px, 2.2vw, 40px);
        max-width: clamp(28px, 3vw, 48px);
        font-size: clamp(7px, 0.6vw, 10px);
    }

    .keyboard__key--space {
        min-width: clamp(120px, 10vw, 240px);
        max-width: clamp(160px, 12vw, 280px);
    }

    .keyboard__key--backspace,
    .keyboard__key--caps,
    .keyboard__key--enter {
        min-width: clamp(50px, 4vw, 80px);
        max-width: clamp(60px, 5vw, 95px);
    }

    .keyboard__key--tab {
        min-width: clamp(40px, 3.5vw, 65px);
        max-width: clamp(50px, 4.5vw, 75px);
    }

    .keyboard__key--shift-left,
    .keyboard__key--shift-right {
        min-width: clamp(60px, 5vw, 95px);
        max-width: clamp(70px, 6vw, 110px);
    }
}

/* Enhanced responsiveness for larger screens */
@media (min-width: 1600px) {
    .keyboard {
        max-width: min(90vw, 1600px);
        padding: var(--spacing-lg);
    }

    .keyboard__key {
        height: clamp(35px, 2.5vh, 45px);
        font-size: clamp(11px, 0.8vw, 14px);
    }
}

@media (min-width: 2000px) {
    .keyboard {
        max-width: min(85vw, 1800px);
        padding: var(--spacing-xl);
    }

    .keyboard__key {
        height: clamp(40px, 2.8vh, 50px);
        font-size: clamp(12px, 0.9vw, 16px);
    }
}

/* Mobile Notice Styles */
.mobile-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: var(--spacing-lg);
    text-align: center;
}

.mobile-notice-content {
    max-width: 500px;
    background-color: var(--surface-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-medium);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-large);
}

.mobile-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
}

.mobile-notice h3 {
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
    font-size: 1.5rem;
}

.mobile-notice p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-md);
    line-height: 1.6;
}

.mobile-notice ul {
    text-align: left;
    margin: var(--spacing-md) 0;
    color: var(--text-secondary);
}

.mobile-notice li {
    margin-bottom: var(--spacing-sm);
}
</style>
