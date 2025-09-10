import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import WindiCSS from 'vite-plugin-windicss';

export default defineConfig({
    base: process.env.VITE_BASE_URL || '',
    plugins: [
        vue(),
        WindiCSS()
    ],

    server: {
        port: 5173,
        allowedHosts: true,
        host: '0.0.0.0',
    },

    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        minify: 'terser',

        // Performance budgets - increased limit for PDF libraries
        chunkSizeWarningLimit: 1000,

        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunks
                    'vue-vendor': ['vue', '@vueuse/core'],
                    'ml-vendor': ['@tensorflow/tfjs', 'ml-matrix'],

                    // Component chunks
                    'test-components': [
                        './src/components/WebcamTest.vue',
                        './src/components/MicrophoneTest.vue',
                        './src/components/SpeakerTest.vue',
                        './src/components/KeyboardTest.vue',
                        './src/components/MouseTest.vue',
                        './src/components/TouchTest.vue',
                        './src/components/BatteryTest.vue',
                    ],

                    // Composable chunks
                    composables: [
                        './src/composables/useEnhancedDeviceTest.js',
                        './src/composables/useDeviceTest.js',
                        './src/composables/useDeviceEnumeration.js',
                        './src/composables/useTestResults.js',
                        './src/composables/useAccessibility.ts',
                        './src/composables/usePerformance.ts',
                    ],
                },

                // Optimize chunk names
                chunkFileNames: chunkInfo => {
                    const facadeModuleId = chunkInfo.facadeModuleId;
                    if (facadeModuleId) {
                        const fileName = facadeModuleId
                            .split('/')
                            .pop()
                            ?.replace(/\.[^/.]+$/, '');
                        return `js/${fileName}-[hash].js`;
                    }
                    return 'js/[name]-[hash].js';
                },

                // Optimize asset names
                assetFileNames: assetInfo => {
                    const extType = assetInfo.name?.split('.').pop() || '';
                    const assetMap = {
                        png: 'images',
                        jpg: 'images',
                        jpeg: 'images',
                        svg: 'images',
                        gif: 'images',
                        webp: 'images',
                        woff: 'fonts',
                        woff2: 'fonts',
                        ttf: 'fonts',
                        css: 'styles',
                    };
                    const folder = assetMap[extType] || 'assets';
                    return `${folder}/[name]-[hash][extname]`;
                },
            },
        },

        // Terser optimization
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
            },
            mangle: {
                safari10: true,
            },
            format: {
                safari10: true,
            },
        },
    },

    // Optimization
    optimizeDeps: {
        include: ['vue', '@vueuse/core'],
        exclude: ['@tensorflow/tfjs', 'ml-matrix'],
    },

    // CSS optimization
    css: {
        devSourcemap: true,
        preprocessorOptions: {
            css: {
                charset: false,
            },
        },
    },

    // Define global constants
    define: {
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
});
