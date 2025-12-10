import * as THREE from 'three';

/**
 * Calculates a stable rotation (Euler XYZ) for a decal given a surface normal.
 * Ensures the 'Up' vector of the decal aligns with the World 'Up' (Y-axis)
 * to prevent spinning/unpredictable rotation on curved surfaces.
 * 
 * @param normal The surface normal vector (normalized)
 * @returns [x, y, z] Euler angles
 */
export function calculateDecalRotation(normal: THREE.Vector3): [number, number, number] {
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

    // Extract Euler angles
    const euler = new THREE.Euler().setFromRotationMatrix(matrix, 'XYZ');

    // Decal Logic Adjustment:
    // DecalGeometry is usually projected along Z.
    // However, our Texture mapping often requires flipping.
    // Adding Math.PI to X rotates it 180 degrees to face "into" the normal or correct the texture flip.
    // Based on previous logic: activeMesh.rotation.set(e.x + Math.PI, e.y, e.z);

    return [euler.x + Math.PI, euler.y, euler.z];
}
