import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stats } from '@react-three/drei';
import { Suspense } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import GameWorld from './GameWorld';
import GameUI from './GameUI';
const GameContainer = styled.div `
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;
const CanvasContainer = styled.div `
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;
const LoadingScreen = styled(motion.div) `
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 10;
`;
export default function GameScene() {
    return (_jsxs(GameContainer, { children: [_jsx(CanvasContainer, { children: _jsx(Suspense, { fallback: _jsx(LoadingScreen, { initial: { opacity: 1 }, animate: { opacity: 0 }, transition: { duration: 1, delay: 2 }, children: _jsxs(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.5 }, children: [_jsx("h2", { children: "Loading Game World..." }), _jsx("div", { style: { marginTop: '20px' }, className: "loading" })] }) }), children: _jsxs(Canvas, { camera: { position: [0, 5, 10], fov: 60 }, shadows: true, gl: { antialias: true, alpha: true }, children: [_jsx(Environment, { preset: "sunset" }), _jsx("ambientLight", { intensity: 0.4 }), _jsx("directionalLight", { position: [10, 10, 5], intensity: 1, castShadow: true, "shadow-mapSize-width": 2048, "shadow-mapSize-height": 2048 }), _jsx(GameWorld, {}), _jsx(OrbitControls, { enablePan: true, enableZoom: true, enableRotate: true, maxPolarAngle: Math.PI / 2, minDistance: 5, maxDistance: 20 }), process.env.NODE_ENV === 'development' && _jsx(Stats, {})] }) }) }), _jsx(GameUI, {})] }));
}
