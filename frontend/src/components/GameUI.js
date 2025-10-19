import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useBalance } from 'wagmi';
const UIOverlay = styled.div `
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 20;
`;
const TopLeft = styled.div `
  position: absolute;
  top: 100px;
  left: 20px;
  pointer-events: auto;
`;
const TopRight = styled.div `
  position: absolute;
  top: 100px;
  right: 20px;
  pointer-events: auto;
`;
const BottomLeft = styled.div `
  position: absolute;
  bottom: 20px;
  left: 20px;
  pointer-events: auto;
`;
const BottomRight = styled.div `
  position: absolute;
  bottom: 20px;
  right: 20px;
  pointer-events: auto;
`;
const InfoCard = styled(motion.div) `
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;
const Button = styled(motion.button) `
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  margin: 8px;
`;
const StatsGrid = styled.div `
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
`;
const StatItem = styled.div `
  text-align: center;
  
  .label {
    font-size: 0.8rem;
    opacity: 0.7;
    margin-bottom: 4px;
  }
  
  .value {
    font-size: 1.2rem;
    font-weight: 600;
  }
`;
export default function GameUI() {
    const { address } = useAccount();
    const { data: balance } = useBalance({ address });
    const [showStats, setShowStats] = useState(false);
    return (_jsxs(UIOverlay, { children: [_jsxs(TopLeft, { children: [_jsxs(InfoCard, { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5 }, children: [_jsx("h3", { style: { margin: '0 0 8px 0', fontSize: '1rem' }, children: "Player Info" }), _jsx("div", { style: { fontSize: '0.9rem', opacity: 0.9 }, children: address ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: ["Address: ", address.slice(0, 6), "...", address.slice(-4)] }), _jsxs("div", { children: ["Balance: ", balance ? parseFloat(balance.formatted).toFixed(4) : '0', " ETH"] })] })) : (_jsx("div", { children: "Not connected" })) })] }), _jsx(Button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => setShowStats(!showStats), children: showStats ? 'Hide Stats' : 'Show Stats' }), _jsx(AnimatePresence, { children: showStats && (_jsxs(InfoCard, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.3 }, children: [_jsx("h3", { style: { margin: '0 0 12px 0', fontSize: '1rem' }, children: "Game Stats" }), _jsxs(StatsGrid, { children: [_jsxs(StatItem, { children: [_jsx("div", { className: "label", children: "Level" }), _jsx("div", { className: "value", children: "1" })] }), _jsxs(StatItem, { children: [_jsx("div", { className: "label", children: "XP" }), _jsx("div", { className: "value", children: "250" })] }), _jsxs(StatItem, { children: [_jsx("div", { className: "label", children: "Coins" }), _jsx("div", { className: "value", children: "1,500" })] }), _jsxs(StatItem, { children: [_jsx("div", { className: "label", children: "NFTs" }), _jsx("div", { className: "value", children: "3" })] })] })] })) })] }), _jsx(TopRight, { children: _jsxs(InfoCard, { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 }, children: [_jsx("h3", { style: { margin: '0 0 8px 0', fontSize: '1rem' }, children: "Controls" }), _jsxs("div", { style: { fontSize: '0.8rem', opacity: 0.9, lineHeight: '1.4' }, children: [_jsx("div", { children: "\uD83D\uDDB1\uFE0F Left Click: Rotate view" }), _jsx("div", { children: "\uD83D\uDDB1\uFE0F Right Click: Pan" }), _jsx("div", { children: "\uD83C\uDFAF Scroll: Zoom" }), _jsx("div", { children: "\uD83C\uDFAE Click objects to interact" })] })] }) }), _jsx(BottomLeft, { children: _jsxs(InfoCard, { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.4 }, children: [_jsx("h3", { style: { margin: '0 0 8px 0', fontSize: '1rem' }, children: "Quick Actions" }), _jsxs("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' }, children: [_jsx(Button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, style: { fontSize: '0.8rem', padding: '8px 12px' }, children: "Mint NFT" }), _jsx(Button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, style: { fontSize: '0.8rem', padding: '8px 12px' }, children: "Claim Tokens" })] })] }) }), _jsx(BottomRight, { children: _jsxs(InfoCard, { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.6 }, children: [_jsx("h3", { style: { margin: '0 0 8px 0', fontSize: '1rem' }, children: "Game Status" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: {
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#4ade80',
                                        animation: 'pulse 2s infinite'
                                    } }), _jsx("span", { style: { fontSize: '0.9rem' }, children: "Connected to blockchain" })] })] }) })] }));
}
