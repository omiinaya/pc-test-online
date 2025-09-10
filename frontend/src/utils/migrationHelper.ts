// Migration utility for Phase 1 directory structure standardization
// This helps move files to the new organized structure

export interface MigrationPath {
    oldPath: string;
    newPath: string;
    type: 'composable' | 'component' | 'utility' | 'type';
    description: string;
}

export const PHASE_1_MIGRATION_PATHS: MigrationPath[] = [
    // Composables to move to new structure
    {
        oldPath: 'src/composables/useDeviceTest.js',
        newPath: 'src/composables/base/useBaseDeviceTest.ts',
        type: 'composable',
        description: 'Base composable for all device testing (converted to TypeScript)',
    },
    {
        oldPath: 'src/composables/useEnhancedDeviceTest.js',
        newPath: 'src/composables/extensions/useMediaDeviceTest.ts',
        type: 'composable',
        description: 'Media device extension composable',
    },
    {
        oldPath: 'src/composables/useCommonTestPatterns.js',
        newPath: 'src/composables/utils/useCommonTestPatterns.ts',
        type: 'composable',
        description: 'Common test patterns utility (convert to TypeScript)',
    },
    {
        oldPath: 'src/composables/useErrorHandling.js',
        newPath: 'src/composables/utils/useErrorHandling.ts',
        type: 'composable',
        description: 'Error handling utility (convert to TypeScript)',
    },

    // Components to move to organized folders
    {
        oldPath: 'src/components/WebcamTest.vue',
        newPath: 'src/components/device-tests/WebcamTest.vue',
        type: 'component',
        description: 'Webcam test component',
    },
    {
        oldPath: 'src/components/MicrophoneTest.vue',
        newPath: 'src/components/device-tests/MicrophoneTest.vue',
        type: 'component',
        description: 'Microphone test component',
    },
    {
        oldPath: 'src/components/SpeakerTest.vue',
        newPath: 'src/components/device-tests/SpeakerTest.vue',
        type: 'component',
        description: 'Speaker test component',
    },
    {
        oldPath: 'src/components/KeyboardTest.vue',
        newPath: 'src/components/device-tests/KeyboardTest.vue',
        type: 'component',
        description: 'Keyboard test component',
    },
    {
        oldPath: 'src/components/MouseTest.vue',
        newPath: 'src/components/device-tests/MouseTest.vue',
        type: 'component',
        description: 'Mouse test component',
    },
    {
        oldPath: 'src/components/TouchTest.vue',
        newPath: 'src/components/device-tests/TouchTest.vue',
        type: 'component',
        description: 'Touch test component',
    },
    {
        oldPath: 'src/components/BatteryTest.vue',
        newPath: 'src/components/device-tests/BatteryTest.vue',
        type: 'component',
        description: 'Battery test component',
    },

    // Layout components
    {
        oldPath: 'src/components/AppHeader.vue',
        newPath: 'src/components/layout/AppHeader.vue',
        type: 'component',
        description: 'Application header component',
    },
    {
        oldPath: 'src/components/AppFooter.vue',
        newPath: 'src/components/layout/AppFooter.vue',
        type: 'component',
        description: 'Application footer component',
    },
    {
        oldPath: 'src/components/StatePanel.vue',
        newPath: 'src/components/common/StatePanel.vue',
        type: 'component',
        description: 'Common state panel component',
    },
    {
        oldPath: 'src/components/DeviceSelector.vue',
        newPath: 'src/components/common/DeviceSelector.vue',
        type: 'component',
        description: 'Common device selector component',
    },

    // Utility files
    {
        oldPath: 'src/types/index.ts',
        newPath: 'src/types/index.ts', // Stays in place
        type: 'type',
        description: 'Global type definitions (enhance with new types)',
    },
];

export interface ImportUpdate {
    oldImport: string;
    newImport: string;
    filePattern: string;
    description: string;
}

export const IMPORT_UPDATES: ImportUpdate[] = [
    // Composable import updates
    {
        oldImport: '../composables/useEnhancedDeviceTest.js',
        newImport: '../composables/extensions/useMediaDeviceTest.ts',
        filePattern: '**/device-tests/*.vue',
        description: 'Update media device composable imports',
    },
    {
        oldImport: '../composables/useDeviceTest.js',
        newImport: '../composables/base/useBaseDeviceTest.ts',
        filePattern: '**/*.vue',
        description: 'Update base composable imports (if any exist)',
    },

    // Component import updates
    {
        oldImport: '../components/WebcamTest.vue',
        newImport: '../components/device-tests/WebcamTest.vue',
        filePattern: '**/App.vue',
        description: 'Update component imports in main App',
    },
    {
        oldImport: '../components/MicrophoneTest.vue',
        newImport: '../components/device-tests/MicrophoneTest.vue',
        filePattern: '**/App.vue',
        description: 'Update component imports in main App',
    },
];

/**
 * Gets migration recommendations for a specific file
 */
export function getMigrationRecommendations(filePath: string): MigrationPath[] {
    return PHASE_1_MIGRATION_PATHS.filter(
        path => path.oldPath === filePath || path.newPath === filePath
    );
}

/**
 * Checks if a file needs migration
 */
export function needsMigration(filePath: string): boolean {
    return PHASE_1_MIGRATION_PATHS.some(path => path.oldPath === filePath);
}

/**
 * Gets all files that need migration
 */
export function getAllFilesNeedingMigration(): MigrationPath[] {
    return PHASE_1_MIGRATION_PATHS.filter(path => path.oldPath !== path.newPath);
}

/**
 * Generates migration commands for the command line
 */
export function generateMigrationCommands(): string[] {
    const commands: string[] = [];

    PHASE_1_MIGRATION_PATHS.forEach(path => {
        if (path.oldPath !== path.newPath) {
            commands.push(`mv ${path.oldPath} ${path.newPath}`);
        }
    });

    return commands;
}

// Example usage:
console.log('Phase 1 Migration Helper');
console.log('========================');
console.log('Files needing migration:');
getAllFilesNeedingMigration().forEach((path, index) => {
    console.log(`${index + 1}. ${path.oldPath} -> ${path.newPath}`);
    console.log(`   ${path.description}`);
});
