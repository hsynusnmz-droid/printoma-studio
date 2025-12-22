import * as THREE from 'three';

interface PrintArea {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    maxScale: number;
}

interface ClampedTransform {
    position: THREE.Vector3;
    scale: number;
}

/**
 * Clamps a decal's position and scale to ensure it stays within the print area.
 * Logic: Ensures the decal's bounding box (approximated by scale) stays inside min/max bounds.
 * 
 * @param position - Current or proposed position
 * @param scale - Current or proposed scale
 * @param area - Defined print area constraints
 * @returns {ClampedTransform} - Corrected position and scale
 */
export const clampLayerTransform = (
    position: THREE.Vector3,
    scale: number,
    area: PrintArea
): ClampedTransform => {
    // 1. Clamp Scale first (to know true dimensions)
    const clampedScale = Math.min(scale, area.maxScale);

    // 2. Calculate Half-Size (Decal covers from -scale/2 to +scale/2)
    const halfSize = clampedScale / 2;

    // 3. Define Safe Centroid Boundaries
    // The center can move as long as the edges don't overflow
    // Min Center X = minX + halfSize
    // Max Center X = maxX - halfSize
    const xMinLimit = area.minX + halfSize;
    const xMaxLimit = area.maxX - halfSize;

    const yMinLimit = area.minY + halfSize;
    const yMaxLimit = area.maxY - halfSize;

    // 4. Clamp Position
    const clampedX = Math.max(xMinLimit, Math.min(position.x, xMaxLimit));
    const clampedY = Math.max(yMinLimit, Math.min(position.y, yMaxLimit));

    // Z is not constrained by area, but we preserve it.
    // If usage requires projecting to Z, we assume input position handles Z projection.

    return {
        position: new THREE.Vector3(clampedX, clampedY, position.z),
        scale: clampedScale
    };
};

/**
 * Calculates current print size in CM based on scale.
 * Assumption: 1 unit scale = 1 meter? Or 100cm?
 * Config says: scale 0.15 for chest. T-shirt is usually ~70cm tall.
 * If model is in meters, 0.85 scale -> 85cm?
 * Product scale is 0.85. 
 * Decal scale 0.15.
 * We'll assume scale = meters for simplicity, so 0.15 = 15cm.
 */
export const calculatePrintSizeCm = (scale: number): { width: number, height: number } => {
    // Using 1.0 scale = 100cm as baseline for "1 meter" unit convention in ThreeJS
    // This can be adjusted based on real-world calibration.
    const size = parseFloat((scale * 100).toFixed(1));
    return { width: size, height: size }; // Square assumption for now
};
