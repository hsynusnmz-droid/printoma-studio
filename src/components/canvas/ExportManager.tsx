'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useStore } from '@/store/useStore';

/**
 * ExportManager Component
 * Handles high-resolution screenshot export from the 3D scene
 */
export default function ExportManager() {
    const { gl, scene, camera } = useThree();
    const screenshotRequested = useStore((s) => s.screenshotRequested);
    const setScreenshotRequested = useStore((s) => s.setScreenshotRequested);
    const layers = useStore((s) => s.layers);

    // 📸 High-Res Mockup Export
    useEffect(() => {
        if (screenshotRequested) {
            const originalDpr = gl.getPixelRatio();

            // 1. Boost Pixel Ratio for High-Res Output (e.g., 3x)
            gl.setPixelRatio(3);

            // 2. Force Render at High Res
            gl.render(scene, camera);

            // 3. Take Screenshot
            const dataUrl = gl.domElement.toDataURL('image/png', 1.0);

            // 4. Restore Original Pixel Ratio
            gl.setPixelRatio(originalDpr);

            // 5. Download
            const link = document.createElement('a');
            link.setAttribute('download', `printoma-mockup-${Date.now()}.png`);
            link.setAttribute('href', dataUrl);
            link.click();
            link.remove();

            // 6. Reset Flag
            setScreenshotRequested(false);

            // Log Data (JSON Export) - Development only
            if (process.env.NODE_ENV === 'development') {
                console.log('📄 Print Data Export:', JSON.stringify(layers, null, 2));
            }
        }
    }, [screenshotRequested, gl, scene, camera, setScreenshotRequested, layers]);

    return null;
}
