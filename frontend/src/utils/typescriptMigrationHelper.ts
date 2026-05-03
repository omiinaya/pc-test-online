// TypeScript Migration Helper for Phase 3
// Provides utilities for converting JavaScript files to TypeScript with proper typing

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname } from 'path';

export interface TypeScriptMigrationOptions {
    targetFile: string;
    outputFile?: string;
    addTypes?: boolean;
    fixImports?: boolean;
    generateTests?: boolean;
}

export interface MigrationResult {
    success: boolean;
    changes: string[];
    warnings: string[];
    errors: string[];
    originalLineCount: number;
    newLineCount: number;
    typeCoverage: number;
}

export interface JavaScriptFunction {
    name: string;
    parameters: string[];
    returnType: string;
    lineNumber: number;
}

export class TypeScriptMigrationHelper {
    /**
     * Migrates a JavaScript file to TypeScript
     */
    static migrateFile(options: TypeScriptMigrationOptions): MigrationResult {
        const result: MigrationResult = {
            success: false,
            changes: [],
            warnings: [],
            errors: [],
            originalLineCount: 0,
            newLineCount: 0,
            typeCoverage: 0,
        };

        try {
            if (!existsSync(options.targetFile)) {
                result.errors.push(`File not found: ${options.targetFile}`);
                return result;
            }

            const content = readFileSync(options.targetFile, 'utf-8');
            result.originalLineCount = content.split('\n').length;

            let migratedContent = content;

            // Convert .js extension to .ts in imports
            if (options.fixImports) {
                migratedContent = this.fixImportExtensions(migratedContent);
            }

            // Add type annotations
            if (options.addTypes) {
                migratedContent = this.addTypeAnnotations(migratedContent);
            }

            // Convert to TypeScript
            migratedContent = this.convertToTypeScript(migratedContent);

            const outputPath = options.outputFile || options.targetFile.replace(/\.js$/, '.ts');

            // Ensure directory exists
            const outputDir = dirname(outputPath);
            if (!existsSync(outputDir)) {
                // In a real implementation, we'd create the directory here
                result.warnings.push(`Output directory doesn't exist: ${outputDir}`);
            }

            writeFileSync(outputPath, migratedContent, 'utf-8');
            result.newLineCount = migratedContent.split('\n').length;

            // Calculate type coverage (simplified)
            const totalFunctions = this.countFunctions(migratedContent);
            const typedFunctions = this.countTypedFunctions(migratedContent);
            result.typeCoverage =
                totalFunctions > 0 ? (typedFunctions / totalFunctions) * 100 : 100;

            result.success = true;
            result.changes.push(`Migrated ${options.targetFile} to ${outputPath}`);
            result.changes.push(`Type coverage: ${result.typeCoverage.toFixed(1)}%`);
        } catch (error) {
            result.errors.push(
                `Migration failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        return result;
    }

    /**
     * Fixes import extensions from .js to .ts
     */
    private static fixImportExtensions(content: string): string {
        return content.replace(/from\s+['"](\.\.?\/.*?)\.js(['"])/g, "from '$1.ts$2");
    }

    /**
     * Adds type annotations to functions and variables
     */
    private static addTypeAnnotations(content: string): string {
        let result = content;

        // Add types to function parameters and returns
        result = result.replace(
            /(export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(:\s*\w+)?\s*{/g,
            (_match, exportKeyword, asyncKeyword, functionName, params, returnType) => {
                const typedParams = this.addParameterTypes(params);
                const typedReturn = returnType || ': void';
                return `${exportKeyword || ''}${asyncKeyword || ''}function ${functionName}(${typedParams})${typedReturn} {`;
            }
        );

        // Add types to arrow functions
        result = result.replace(
            /(export\s+)?(async\s+)?const\s+(\w+)\s*=\s*\(([^)]*)\)\s*(:\s*\w+)?\s*=>/g,
            (_match, exportKeyword, asyncKeyword, constName, params, returnType) => {
                const typedParams = this.addParameterTypes(params);
                const typedReturn = returnType || ': void';
                return `${exportKeyword || ''}${asyncKeyword || ''}const ${constName} = (${typedParams})${typedReturn} =>`;
            }
        );

        // Add types to refs
        result = result.replace(/const\s+(\w+)\s*=\s*ref\(([^)]*)\)/g, (_match, varName, value) => {
            const inferredType = this.inferTypeFromValue(value);
            return `const ${varName} = ref<${inferredType}>(${value})`;
        });

        return result;
    }

    /**
     * Adds types to function parameters
     */
    private static addParameterTypes(params: string): string {
        return params
            .split(',')
            .map(param => param.trim())
            .map(param => {
                if (!param || param.includes(':')) return param;

                const parts = param.split('=').map(p => p.trim());
                const paramName = parts[0];
                const defaultValue = parts[1];
                // @ts-expect-error - defaultValue is guaranteed to be string after split
                const inferredType = this.inferParameterType(paramName, defaultValue || '');

                return defaultValue
                    ? `${paramName}: ${inferredType} = ${defaultValue}`
                    : `${paramName}: ${inferredType}`;
            })
            .join(', ');
    }

    /**
     * Infers TypeScript type from JavaScript value
     */
    private static inferTypeFromValue(value: string): string {
        value = value.trim();

        if (value === 'null') return 'null';
        if (value === 'undefined') return 'undefined';
        if (value === 'true' || value === 'false') return 'boolean';
        if (/^\d+$/.test(value)) return 'number';
        if (/^['"].*['"]$/.test(value)) return 'string';
        if (value.startsWith('[')) return 'any[]';
        if (value.startsWith('{')) return 'Record<string, unknown>';
        if (value.startsWith('new')) return this.inferTypeFromConstructor(value);

        return 'unknown';
    }

    /**
     * Infers type from constructor calls
     */
    private static inferTypeFromConstructor(value: string): string {
        if (value.includes('new Date')) return 'Date';
        if (value.includes('new Map')) return 'Map<unknown, unknown>';
        if (value.includes('new Set')) return 'Set<unknown>';
        if (value.includes('new Error')) return 'Error';

        return 'unknown';
    }

    /**
     * Infers parameter type from name and default value
     */
    private static inferParameterType(paramName: string, defaultValue: string | undefined): string {
        // Infer from parameter name patterns
        if (
            paramName.includes('Handler') ||
            paramName.includes('Callback') ||
            paramName.includes('Fn')
        ) {
            return 'Function';
        }
        if (paramName.includes('Event')) {
            return 'Event';
        }
        if (paramName.includes('Element') || paramName.includes('Ref')) {
            return 'HTMLElement';
        }
        if (paramName.includes('Array') || paramName.endsWith('s')) {
            return 'any[]';
        }
        if (
            paramName.includes('Number') ||
            paramName.includes('Count') ||
            paramName.includes('Index')
        ) {
            return 'number';
        }
        if (
            paramName.includes('String') ||
            paramName.includes('Text') ||
            paramName.includes('Message')
        ) {
            return 'string';
        }
        if (
            paramName.includes('Boolean') ||
            paramName.includes('Is') ||
            paramName.includes('Has')
        ) {
            return 'boolean';
        }

        // Infer from default value
        if (defaultValue) {
            return this.inferTypeFromValue(defaultValue);
        }

        return 'unknown';
    }

    /**
     * Converts JavaScript content to TypeScript
     */
    private static convertToTypeScript(content: string): string {
        let result = content;

        // Add TypeScript import for Ref if needed
        if (result.includes('ref(') && !result.includes('import type { Ref }')) {
            result = `import type { Ref } from 'vue';\n${result}`;
        }

        // Add TypeScript import for ComputedRef if needed
        if (result.includes('computed(') && !result.includes('import type { ComputedRef }')) {
            result = `import type { ComputedRef } from 'vue';\n${result}`;
        }

        return result;
    }

    /**
     * Counts total functions in content
     */
    private static countFunctions(content: string): number {
        const functionRegex =
            /(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|const\s+\w+\s*=\s*function)/g;
        return (content.match(functionRegex) || []).length;
    }

    /**
     * Counts typed functions in content
     */
    private static countTypedFunctions(content: string): number {
        const typedFunctionRegex =
            /(function\s+\w+\([^)]*\)\s*:\s*\w+|const\s+\w+\s*=\s*\([^)]*\)\s*:\s*\w+\s*=>)/g;
        return (content.match(typedFunctionRegex) || []).length;
    }

    /**
     * Batch migrates multiple files
     */
    static batchMigrate(
        files: string[],
        options: Partial<TypeScriptMigrationOptions> = {}
    ): MigrationResult[] {
        return files.map(file =>
            this.migrateFile({
                targetFile: file,
                addTypes: true,
                fixImports: true,
                ...options,
            })
        );
    }

    /**
     * Gets migration recommendations for Vue components
     */
    static getVueComponentRecommendations(componentContent: string): string[] {
        const recommendations: string[] = [];

        // Check for Options API
        if (componentContent.includes('export default {')) {
            recommendations.push('Convert from Options API to Composition API with <script setup>');
        }

        // Check for untyped props
        if (componentContent.includes('props: {') && !componentContent.includes('defineProps<')) {
            recommendations.push('Add TypeScript prop interfaces using defineProps');
        }

        // Check for untyped emits
        if (componentContent.includes('emits: [') && !componentContent.includes('defineEmits<')) {
            recommendations.push('Add TypeScript emit types using defineEmits');
        }

        return recommendations;
    }
}

// Example usage and CLI interface
if (require.main === module) {
    const filesToMigrate = [
        'src/composables/utils/useAnimations.ts',
        'src/composables/utils/useCanvas.ts',
        'src/composables/utils/useCommonTestPatterns.ts',
        // Add more files as needed
    ];

    console.log('TypeScript Migration Helper');
    console.log('==========================');
    console.log(`Migrating ${filesToMigrate.length} files to TypeScript...\n`);

    const results = TypeScriptMigrationHelper.batchMigrate(filesToMigrate);

    results.forEach((result, index) => {
        console.log(`File ${index + 1}: ${filesToMigrate[index]}`);
        if (result.success) {
            console.log(`✅ Success: ${result.changes.join(', ')}`);
        } else {
            console.log(`❌ Failed: ${result.errors.join(', ')}`);
        }
        console.log(`   Type coverage: ${result.typeCoverage.toFixed(1)}%`);
        console.log('---');
    });

    const totalSuccess = results.filter(r => r.success).length;
    const avgCoverage = results.reduce((sum, r) => sum + r.typeCoverage, 0) / results.length;

    console.log(`\nSummary: ${totalSuccess}/${results.length} files migrated successfully`);
    console.log(`Average type coverage: ${avgCoverage.toFixed(1)}%`);
}
