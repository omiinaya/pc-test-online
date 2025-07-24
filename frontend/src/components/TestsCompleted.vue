<script>
export default {
    name: 'TestsCompleted',
    emits: ['start-over'],
};
</script>

<template>
    <div class="completion-container">
        <!-- Celebration Animation -->
        <div class="celebration-animation">
            <!-- Confetti particles -->
            <div
                class="confetti-particle"
                v-for="i in 20"
                :key="'confetti-' + i"
                :style="{
                    '--delay': i * 0.05 + 's',
                    '--x': Math.random() * 100 + '%',
                    '--rotation': Math.random() * 360 + 'deg',
                }"
            ></div>

            <!-- Star particles -->
            <div
                class="star-particle"
                v-for="i in 15"
                :key="'star-' + i"
                :style="{
                    '--delay': i * 0.08 + 's',
                    '--x': Math.random() * 100 + '%',
                }"
            >
                ★
            </div>

            <!-- Sparkle particles -->
            <div
                class="sparkle-particle"
                v-for="i in 25"
                :key="'sparkle-' + i"
                :style="{
                    '--delay': i * 0.04 + 's',
                    '--x': Math.random() * 100 + '%',
                }"
            >
                ✨
            </div>

            <!-- Floating balloons -->
            <!--
          <div class="balloon-particle" v-for="i in 4" :key="'balloon-' + i" 
               :style="{ '--delay': (i * 0.1) + 's', '--x': (i * 12 + 10) + '%' }">
            🎈
          </div>
          -->
        </div>

        <!-- Main Success Icon -->
        <div class="success-section">
            <svg width="100" height="100" viewBox="0 0 100 100" class="completion-icon">
                <circle class="circle-bg" cx="50" cy="50" r="45" />
                <circle class="circle-fg" cx="50" cy="50" r="45" />
                <polyline class="checkmark" points="30,52 45,67 70,42" />
            </svg>

            <h2 class="success-title">Testing Complete!</h2>
            <p class="success-subtitle">Your device has been thoroughly tested</p>
        </div>

        <!-- Action Buttons -->
        <div class="action-section">
            <button @click="$emit('start-over')" class="start-over-btn">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                Start Over
            </button>
        </div>
    </div>
</template>

<style scoped>
.completion-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xl);
    min-height: 500px;
    padding: var(--spacing-lg);
    overflow: hidden;
}

/* Celebration Animation */
.celebration-animation {
    position: absolute;
    top: -10px;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
}

/* Confetti Particles */
.confetti-particle {
    position: absolute;
    width: 12px;
    height: 12px;
    top: -20px;
    left: var(--x);
    transform: rotate(var(--rotation));
    animation: confetti-fall var(--animation-celebration) var(--delay) ease-in-out forwards;
}

.confetti-particle:nth-child(4n + 1) {
    background: var(--primary-color);
    border-radius: 50%;
    width: 8px;
    height: 8px;
}

.confetti-particle:nth-child(4n + 2) {
    background: var(--success-color);
    border-radius: 2px;
    width: 10px;
    height: 6px;
}

.confetti-particle:nth-child(4n + 3) {
    background: var(--warning-color);
    border-radius: 50%;
    width: 6px;
    height: 6px;
}

.confetti-particle:nth-child(4n + 4) {
    background: linear-gradient(45deg, var(--primary-color), var(--primary-color-dark));
    transform: rotate(45deg);
    width: 8px;
    height: 8px;
}

/* Star Particles */
.star-particle {
    position: absolute;
    top: -20px;
    left: var(--x);
    font-size: 20px;
    color: var(--warning-color);
    animation: star-fall var(--animation-celebration) var(--delay) ease-in-out forwards;
    text-shadow: 0 0 10px currentColor;
}

.star-particle:nth-child(odd) {
    color: var(--primary-color);
    font-size: 16px;
}

.star-particle:nth-child(even) {
    color: var(--success-color);
    font-size: 24px;
}

/* Sparkle Particles */
.sparkle-particle {
    position: absolute;
    top: -20px;
    left: var(--x);
    font-size: 14px;
    animation: sparkle-fall var(--animation-celebration) var(--delay) ease-in-out forwards;
    text-shadow: 0 0 8px currentColor;
}

.sparkle-particle:nth-child(3n + 1) {
    filter: hue-rotate(0deg);
}

.sparkle-particle:nth-child(3n + 2) {
    filter: hue-rotate(120deg);
}

.sparkle-particle:nth-child(3n + 3) {
    filter: hue-rotate(240deg);
}

/* Balloon Particles */
.balloon-particle {
    position: absolute;
    bottom: -50px;
    left: var(--x);
    font-size: 28px;
    animation: balloon-float var(--animation-celebration) var(--delay) ease-in-out forwards;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.balloon-particle:nth-child(2n) {
    font-size: 24px;
    animation-duration: var(--animation-celebration);
}

.balloon-particle:nth-child(3n) {
    font-size: 32px;
    animation-duration: var(--animation-celebration);
}

/* Animations */
@keyframes confetti-fall {
    0% {
        transform: translateY(-100vh) rotate(0deg);
        opacity: 1;
    }
    50% {
        opacity: 1;
    }
    100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
    }
}

@keyframes star-fall {
    0% {
        transform: translateY(-100vh) rotate(0deg) scale(0);
        opacity: 0;
    }
    10% {
        opacity: 1;
        transform: translateY(-80vh) rotate(36deg) scale(1);
    }
    90% {
        opacity: 1;
        transform: translateY(80vh) rotate(324deg) scale(1);
    }
    100% {
        transform: translateY(100vh) rotate(360deg) scale(0);
        opacity: 0;
    }
}

@keyframes sparkle-fall {
    0% {
        transform: translateY(-100vh) rotate(0deg) scale(0);
        opacity: 0;
    }
    15% {
        opacity: 1;
        transform: translateY(-70vh) rotate(90deg) scale(1);
    }
    85% {
        opacity: 1;
        transform: translateY(70vh) rotate(450deg) scale(1);
    }
    100% {
        transform: translateY(100vh) rotate(540deg) scale(0);
        opacity: 0;
    }
}

@keyframes balloon-float {
    0% {
        transform: translateY(100vh) rotate(0deg) scale(0);
        opacity: 0;
    }
    10% {
        opacity: 1;
        transform: translateY(80vh) rotate(5deg) scale(1);
    }
    50% {
        transform: translateY(-20vh) rotate(-5deg) scale(1);
    }
    90% {
        opacity: 1;
        transform: translateY(-80vh) rotate(10deg) scale(1);
    }
    100% {
        transform: translateY(-120vh) rotate(15deg) scale(0);
        opacity: 0;
    }
}

/* Success Section */
.success-section {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.completion-icon {
    margin-bottom: var(--spacing-md);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.circle-bg {
    fill: none;
    stroke: var(--border-color);
    stroke-width: 6;
}

.circle-fg {
    fill: none;
    stroke: var(--success-color);
    stroke-width: 6;
    stroke-dasharray: 282.7;
    stroke-dashoffset: 282.7;
    animation: draw-circle var(--animation-extra-slow) ease-out forwards;
    filter: drop-shadow(0 0 8px rgba(40, 167, 69, 0.5));
}

@keyframes draw-circle {
    to {
        stroke-dashoffset: 0;
    }
}

.checkmark {
    fill: none;
    stroke: var(--success-color);
    stroke-width: 8;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 50;
    stroke-dashoffset: 50;
    animation: draw-check var(--animation-slower) var(--animation-extra-slow) ease-out forwards;
    filter: drop-shadow(0 0 4px rgba(40, 167, 69, 0.7));
}

@keyframes draw-check {
    to {
        stroke-dashoffset: 0;
    }
}

.success-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0;
    text-align: center;
    background: linear-gradient(135deg, var(--success-color), #20c997);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.success-subtitle {
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    margin: 0;
    text-align: center;
    font-weight: var(--font-weight-medium);
}

/* Test Summary Section */
.test-summary {
    position: relative;
    z-index: 2;
    background: linear-gradient(135deg, var(--surface-primary), var(--surface-secondary));
    border-radius: var(--border-radius-large);
    padding: var(--spacing-xl);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-large);
    max-width: 600px;
    width: 100%;
}

.summary-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-lg) 0;
    text-align: center;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-md);
}

.summary-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    background: var(--surface-tertiary);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-medium);
    border: 1px solid var(--border-color-light);
    transition: var(--transition-default);
}

.summary-item:hover {
    background: var(--surface-quaternary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
}

.summary-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
    border-radius: var(--border-radius-medium);
    color: var(--text-primary);
}

.summary-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.summary-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
}

.summary-status {
    font-size: var(--font-size-sm);
    color: var(--success-color);
    font-weight: var(--font-weight-semibold);
}

/* Action Section */
.action-section {
    position: relative;
    z-index: 2;
    margin-top: var(--spacing-lg);
}

.start-over-btn {
    min-width: 220px;
    padding: var(--spacing-lg) var(--spacing-xl);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    box-shadow: var(--shadow-large);

    /* Primary button styling */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
    color: var(--text-primary);
    border: none;
    border-radius: var(--border-radius-medium);
    cursor: pointer;
    transition: var(--transition-default);
    position: relative;
    overflow: hidden;
}

.start-over-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left var(--animation-extra-slow) ease;
}

.start-over-btn:hover::before {
    left: 100%;
}

.start-over-btn:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-xl);
}

.start-over-btn:active {
    transform: translateY(-1px);
    box-shadow: var(--shadow-medium);
}

/* Performance Section */
.performance-section {
    width: 100%;
    max-width: 900px;
    margin: var(--spacing-lg) 0;
    z-index: 2;
    position: relative;
}

/* Responsive Design */
@media (max-width: 768px) {
    .completion-container {
        gap: var(--spacing-lg);
        min-height: auto;
        padding: var(--spacing-md);
    }

    .completion-icon {
        width: 80px;
        height: 80px;
    }

    .success-title {
        font-size: var(--font-size-2xl);
    }

    .summary-grid {
        grid-template-columns: 1fr;
    }

    .start-over-btn {
        min-width: 180px;
        padding: var(--spacing-md) var(--spacing-lg);
    }
}
</style>
