import { describe, it, expect } from 'vitest';
import { useCSSCompatibility } from '../useCSSCompatibility';

describe('useCSSCompatibility', () => {
    it('should initialize with state object', () => {
        const { state } = useCSSCompatibility();
        expect(state).toBeDefined();
        expect(typeof state.supported).toBe('boolean');
        expect(typeof state.supportedFeatures).toBe('object');
        expect(typeof state.unsupportedFeatures).toBe('object');
        expect(typeof state.cssGrade).toBe('string');
        expect(Array.isArray(state.compatibilityIssues)).toBe(true);
        expect(Array.isArray(state.recommendations)).toBe(true);
    });

    it('should have supported property that is boolean', () => {
        const { state } = useCSSCompatibility();
        expect(typeof state.supported).toBe('boolean');
    });

    it('should have unsupportedFeatures as an array', () => {
        const { state } = useCSSCompatibility();
        expect(Array.isArray(state.unsupportedFeatures)).toBe(true);
    });

    it('should have supportedFeatures as an object', () => {
        const { state } = useCSSCompatibility();
        expect(typeof state.supportedFeatures).toBe('object');
        expect(state.supportedFeatures).not.toBeNull();
    });

    it('should generate recommendations when unsupported features exist', () => {
        const { state } = useCSSCompatibility();
        if (state.unsupportedFeatures.length > 0) {
            expect(state.recommendations.length).toBeGreaterThan(0);
        }
    });

    it('should have a valid CSS grade (A-F)', () => {
        const { state } = useCSSCompatibility();
        expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(state.cssGrade);
    });
});
