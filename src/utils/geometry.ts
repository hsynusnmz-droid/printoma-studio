import * as THREE from 'three';

/**
 * Calculates a stable rotation (Euler XYZ) and scale factor for a decal given a surface normal.
 * Ensures the 'Up' vector of the decal aligns with the World 'Up' (Y-axis).
 * Also handles mirroring on the back of the model by flipping the X scale.
 * Accepts an optional Z-rotation (spin) in radians.
 * 
 * @param normal The surface normal vector (normalized)
 * @param rotationZ The spin angle in radians (default 0)
 * @returns { rotation: [x, y, z], scaleX: number }
 */
export function calculateDecalRotation(normal: THREE.Vector3, rotationZ: number = 0): { rotation: [number, number, number]; scaleX: number } {
    const up = new THREE.Vector3(0, 1, 0);

    // Handle singularity: if normal is perfectly Up (0,1,0) or Down (0,-1,0)
    // In that case, World Up is parallel to Normal, so Cross Product fails.
    // We switch fallback 'Up' to Z-axis.
    if (Math.abs(normal.dot(up)) > 0.99) {
        up.set(0, 0, 1);
    }

    // Z-axis points OUT of the surface (along Normal)
    const zAxis = normal.clone().normalize();

    // X-axis is perpendicular to WorldUp and Normal (Right vector)
    const xAxis = new THREE.Vector3().crossVectors(up, zAxis).normalize();

    // Y-axis is perpendicular to Normal and Right (Local Up)
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();

    // Construct Rotation Matrix from Basis Vectors
    const matrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

    // Quaternion Approach for Composition
    const baseQuaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);

    // Create Spin Quaternion (Local Z rotation)
    const spinQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotationZ);

    // Combine: Apply Spin, then Base Orientation
    // Note: In ThreeJS, multiply(q) applies q as local rotation if we consider pre-multiplication order
    // But intuitively: Alignment * Spin
    baseQuaternion.multiply(spinQuaternion);

    const euler = new THREE.Euler().setFromQuaternion(baseQuaternion, 'XYZ');

    // Decal Logic Adjustment:
    // Adding Math.PI to X rotates it 180 degrees.
    // This fixes the "Upside Down" issue reported by the user.
    const rotationX = euler.x + Math.PI;

    // ✅ Mirror Fix: If on the back (Z < 0), flip horizontal scale
    // This fixes the "Mirrored" issue reported on the back.
    const scaleX = normal.z < 0 ? -1 : 1;

    return {
        rotation: [rotationX, euler.y, euler.z],
        scaleX
    };
}
