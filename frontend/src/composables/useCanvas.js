import { ref, nextTick } from 'vue';
import { useEventListeners } from './useEventListeners.js';
import { useAnimations } from './useAnimations.js';

/**
 * Composable for managing canvas operations
 */
export function useCanvas(canvasRef = ref(null)) {
    const { addEventListener } = useEventListeners();
    const context = ref(null);
    const canvasSize = ref({ width: 0, height: 0 });

    /**
     * Initialize canvas context and size
     */
    const initializeCanvas = async () => {
        await nextTick();

        if (!canvasRef.value) {
            console.error('Canvas element not found');
            return false;
        }

        context.value = canvasRef.value.getContext('2d');
        resizeCanvas();

        // Auto-resize on window resize
        addEventListener(window, 'resize', resizeCanvas);

        return true;
    };

    /**
     * Resize canvas to match display size with device pixel ratio
     */
    const resizeCanvas = () => {
        if (!canvasRef.value) return;

        const canvas = canvasRef.value;
        const rect = canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Set display size
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Set actual size in memory (scaled up for pixel density)
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;

        // Scale the drawing context so everything draws at the correct size
        if (context.value) {
            context.value.scale(devicePixelRatio, devicePixelRatio);
        }

        canvasSize.value = {
            width: canvas.width,
            height: canvas.height,
            displayWidth: rect.width,
            displayHeight: rect.height,
        };
    };

    /**
     * Clear the entire canvas
     */
    const clearCanvas = () => {
        if (!context.value || !canvasRef.value) return;

        const { displayWidth, displayHeight } = canvasSize.value;
        context.value.clearRect(0, 0, displayWidth, displayHeight);
    };

    /**
     * Set canvas styles
     */
    const setCanvasStyle = (styles = {}) => {
        if (!context.value) return;

        Object.entries(styles).forEach(([property, value]) => {
            context.value[property] = value;
        });
    };

    return {
        context,
        canvasSize,
        initializeCanvas,
        resizeCanvas,
        clearCanvas,
        setCanvasStyle,
    };
}

/**
 * Composable for audio visualization (microphone test pattern)
 */
export function useAudioVisualization(canvasRef, audioContext = null) {
    const { context, initializeCanvas, clearCanvas, resizeCanvas, canvasSize } =
        useCanvas(canvasRef);
    const { requestAnimationFrame, cleanupAnimations } = useAnimations();

    const analyser = ref(null);
    const dataArray = ref(null);
    const isVisualizing = ref(false);

    /**
     * Setup audio analysis for visualization
     */
    const setupAudioAnalysis = stream => {
        if (!audioContext || !stream) {
            console.error('Audio context or stream not provided');
            return false;
        }

        try {
            analyser.value = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser.value);

            analyser.value.fftSize = 2048;
            dataArray.value = new Uint8Array(analyser.value.frequencyBinCount);

            return true;
        } catch (error) {
            console.error('Failed to setup audio analysis:', error);
            return false;
        }
    };

    /**
     * Start audio visualization
     */
    const startVisualization = () => {
        if (!analyser.value || !context.value || isVisualizing.value) return;

        isVisualizing.value = true;
        visualize();
    };

    /**
     * Stop audio visualization
     */
    const stopVisualization = () => {
        isVisualizing.value = false;
        cleanupAnimations();
        clearCanvas();
    };

    /**
     * Visualization loop
     */
    const visualize = () => {
        if (!isVisualizing.value || !analyser.value || !context.value) return;

        analyser.value.getByteFrequencyData(dataArray.value);

        drawWaveform();

        requestAnimationFrame(visualize);
    };

    /**
     * Draw waveform visualization
     */
    const drawWaveform = () => {
        if (!context.value || !dataArray.value) return;

        const canvas = canvasRef.value;
        const { displayWidth, displayHeight } = canvasSize.value || {
            displayWidth: canvas?.width || 800,
            displayHeight: canvas?.height || 400,
        };

        clearCanvas();

        // Set styles
        context.value.lineWidth = 2;
        context.value.strokeStyle = '#ff6b00';
        context.value.fillStyle = 'rgba(255, 107, 0, 0.1)';

        // Draw waveform
        context.value.beginPath();

        const sliceWidth = displayWidth / dataArray.value.length;
        let x = 0;

        for (let i = 0; i < dataArray.value.length; i++) {
            const v = dataArray.value[i] / 128.0;
            const y = (v * displayHeight) / 2;

            if (i === 0) {
                context.value.moveTo(x, y);
            } else {
                context.value.lineTo(x, y);
            }

            x += sliceWidth;
        }

        context.value.lineTo(displayWidth, displayHeight / 2);
        context.value.stroke();

        // Fill area under curve
        context.value.lineTo(displayWidth, displayHeight);
        context.value.lineTo(0, displayHeight);
        context.value.closePath();
        context.value.fill();
    };

    return {
        analyser,
        dataArray,
        isVisualizing,
        setupAudioAnalysis,
        startVisualization,
        stopVisualization,
        initializeCanvas,
        resizeCanvas,
        canvasSize,
    };
}
