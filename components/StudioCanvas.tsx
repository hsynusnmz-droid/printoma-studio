'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center } from '@react-three/drei';
import ActiveProduct from './ActiveProduct';

export default function StudioCanvas() {
    return (
        <div className="w-full h-full relative">
            <Canvas shadows camera={{ position: [0, 0, 2.5], fov: 25 }}>
                <ambientLight intensity={0.7} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <Center>
                    <ActiveProduct />
                </Center>
                <Environment preset="studio" blur={1} />
                <ContactShadows resolution={1024} scale={10} blur={1} opacity={0.5} far={10} color="#333" />
                <OrbitControls makeDefault minDistance={1} maxDistance={4} enablePan={false} />
            </Canvas>
        </div>
    );
}
