import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Torus, Text } from '@react-three/drei';
function FloatingCube({ position }) {
    const meshRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.5;
        }
    });
    return (_jsx(Box, { ref: meshRef, position: position, scale: hovered ? 1.2 : 1, onPointerOver: () => setHovered(true), onPointerOut: () => setHovered(false), onClick: () => console.log('Cube clicked!'), children: _jsx("meshStandardMaterial", { color: hovered ? "#ff6b6b" : "#4ecdc4", metalness: 0.8, roughness: 0.2 }) }));
}
function RotatingSphere({ position }) {
    const meshRef = useRef(null);
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.005;
            meshRef.current.rotation.y += 0.01;
        }
    });
    return (_jsx(Sphere, { ref: meshRef, position: position, children: _jsx("meshStandardMaterial", { color: "#ffd93d", metalness: 0.6, roughness: 0.4 }) }));
}
function SpinningTorus({ position }) {
    const meshRef = useRef(null);
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.02;
            meshRef.current.rotation.z += 0.01;
        }
    });
    return (_jsx(Torus, { ref: meshRef, position: position, args: [2, 0.5, 16, 32], children: _jsx("meshStandardMaterial", { color: "#a8e6cf", metalness: 0.7, roughness: 0.3 }) }));
}
export default function GameWorld() {
    return (_jsxs("group", { children: [_jsx(Box, { position: [0, -1, 0], args: [20, 2, 20], children: _jsx("meshStandardMaterial", { color: "#8b4513" }) }), _jsx(FloatingCube, { position: [-5, 2, -5] }), _jsx(FloatingCube, { position: [5, 3, -3] }), _jsx(FloatingCube, { position: [-3, 2.5, 5] }), _jsx(FloatingCube, { position: [4, 4, 4] }), _jsx(RotatingSphere, { position: [-8, 1, 0] }), _jsx(RotatingSphere, { position: [8, 1.5, 0] }), _jsx(RotatingSphere, { position: [0, 1, -8] }), _jsx(RotatingSphere, { position: [0, 2, 8] }), _jsx(SpinningTorus, { position: [0, 3, 0] }), _jsx(Text, { position: [0, 6, 0], fontSize: 2, color: "#ffffff", anchorX: "center", anchorY: "middle", children: "Ethereum Game" }), _jsx(Box, { position: [0, 0.5, -10], args: [1, 1, 1], children: _jsx("meshStandardMaterial", { color: "#ff4757", transparent: true, opacity: 0.8 }) }), _jsx(Text, { position: [0, 1.5, -10], fontSize: 0.5, color: "#ffffff", anchorX: "center", anchorY: "middle", children: "Click to interact!" })] }));
}
