import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import GameTable from './components/GameTable';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import CardIntro from './components/CardIntro';
import Header from './components/Header';
const AppContainer = styled.div `
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
`;
const MainContent = styled.main `
  position: relative;
  z-index: 2;
`;
function App() {
    const { isConnected, address } = useAccount();
    return (_jsxs(AppContainer, { children: [_jsx(Header, {}), _jsx(MainContent, { children: !isConnected ? (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        textAlign: 'center',
                        padding: '20px'
                    }, children: [_jsx("h1", { style: {
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                background: 'linear-gradient(45deg, #fff, #e0e0e0)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                            }, children: "CoFHE Shop" }), _jsx("p", { style: {
                                fontSize: '1.2rem',
                                marginBottom: '2rem',
                                opacity: 0.9,
                                maxWidth: '600px'
                            }, children: "Connect your wallet to start your blockchain gaming adventure. Collect NFTs, trade items, and explore the decentralized metaverse." }), _jsx("div", { style: { display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }, children: _jsx(ConnectButton, {}) })] })) : (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/table", replace: true }) }), _jsx(Route, { path: "/table", element: _jsx(GameTable, { meAddress: address ?? '' }) }), _jsx(Route, { path: "/marketplace", element: _jsx(CardIntro, {}) })] })) })] }));
}
export default App;
