import { ref, nextTick, type Ref } from 'vue';
import { useEventListeners } from './useEventListeners';
import { useAnimations } from './useAnimations';
import type { CanvasStyle, CanvasSize, AudioContextType } from '../types';

export interface UseCanvasReturn {
    context: Ref<CanvasRenderingContext2D | null>;
    canvasSize: Ref<CanvasSize>;
    initializeCanvas: () => Promise<boolean>;
    resizeCanvas: () => void;
    clearCanvas: () => void;
    setCanvasStyle: (styles: Partial<CanvasStyle>) => void;
}

export interface UseAudioVisualizationReturn {
    analyser: Ref<AnalyserNode | null>;
    dataArray: Ref<Uint8Array | null>;
    isVisualizing: Ref<boolean>;
    setupAudioAnalysis: (stream: MediaStream) => boolean;
    startVisualization: () => void;
    stopVisualization: () => void;
    initializeCanvas: () => Promise<boolean>;
    resizeCanvas: () => void;
    canvasSize: Ref<CanvasSize>;
}

/**
 * Composable for managing canvas operations
 */
export function useCanvas(canvasRef: Ref<HTMLCanvasElement | null> = ref(null)): UseCanvasReturn {
    const { addEventListener } = useEventListeners();
    const context: Ref<CanvasRenderingContext2D | null> = ref(null);
    const canvasSize: Ref<CanvasSize> = ref({
        width: 0,
        height: 0,
        displayWidth: 0,
        displayHeight: 0,
    });

    /**
     * Initialize canvas context and size
     */
    const initializeCanvas = async (): Promise<boolean> => {
        await nextTick();

        if (!canvasRef.value) {
            console.error('Canvas element not found');
            return false;
        }

        const ctx = canvasRef.value.getContext('2d');
        if (!ctx) {
            console.error('Failed to get 2D context');
            return false;
        }

        context.value = ctx;
        resizeCanvas();

        // Auto-resize on window resize
        addEventListener(window, 'resize', resizeCanvas);

        return true;
    };

    /**
     * Resize canvas to match display size with device pixel ratio
     */
    const resizeCanvas = (): void => {
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
    const clearCanvas = (): void => {
        if (!context.value || !canvasRef.value) return;

        const { displayWidth, displayHeight } = canvasSize.value;
        context.value.clearRect(0, 0, displayWidth, displayHeight);
    };

    /**
     * Set canvas styles
     */
    const setCanvasStyle = (styles: Partial<CanvasStyle>): void => {
        if (!context.value) return;

        Object.entries(styles).forEach(([property, value]) => {
            (context.value as Record<string, unknown>)[property] = value;
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
export function useAudioVisualization(
    canvasRef: Ref<HTMLCanvasElement | null>,
    audioContext: AudioContextType | null = null
): UseAudioVisualizationReturn {
    const { context, initializeCanvas, clearCanvas, resizeCanvas, canvasSize } =
        useCanvas(canvasRef);
    const { requestAnimationFrame, cleanupAnimations } = useAnimations();

    const analyser: Ref<AnalyserNode | null> = ref(null);
    const dataArray: Ref<Uint8Array | null> = ref(null);
    const isVisualizing: Ref<boolean> = ref(false);

    /**
     * Setup audio analysis for visualization
     */
    const setupAudioAnalysis = (stream: MediaStream): boolean => {
        if (!audioContext || !stream) {
            console.error('Audio context or stream not provided');
            return false;
        }

        try {
            analyser.value = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser.value);

            analyser.value.fftSize = 2048;
            const bufferLength = analyser.value.frequencyBinCount;
            dataArray.value = new Uint8Array(bufferLength);

            return true;
        } catch (error) {
            console.error('Failed to setup audio analysis:', error);
            return false;
        }
    };

    /**
     * Start audio visualization
     */
    const startVisualization = (): void => {
        if (!analyser.value || !context.value || isVisualizing.value) return;

        isVisualizing.value = true;
        visualize();
    };

    /**
     * Stop audio visualization
     */
    const stopVisualization = (): void => {
        isVisualizing.value = false;
        cleanupAnimations();
        clearCanvas();
    };

    /**
     * Visualization loop
     */
    const visualize = (): void => {
        if (!isVisualizing.value || !analyser.value || !context.value) return;
        if (!dataArray.value) return;

        analyser.value.getByteFrequencyData(dataArray.value);

        drawWaveform();

        requestAnimationFrame(visualize);
    };

    /**
     * Draw waveform visualization
     */
    const drawWaveform = (): void => {
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
            const v = (dataArray.value[i] ?? 0) / 128.0;
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
