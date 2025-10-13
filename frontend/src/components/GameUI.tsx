import { useState } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useBalance } from 'wagmi'

const UIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 20;
`

const TopLeft = styled.div`
  position: absolute;
  top: 100px;
  left: 20px;
  pointer-events: auto;
`

const TopRight = styled.div`
  position: absolute;
  top: 100px;
  right: 20px;
  pointer-events: auto;
`

const BottomLeft = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  pointer-events: auto;
`

const BottomRight = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  pointer-events: auto;
`

const InfoCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`

const Button = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  margin: 8px;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
`

const StatItem = styled.div`
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
`

export default function GameUI() {
  const { address } = useAccount()
  const { data: balance } = useBalance({ address })
  const [showStats, setShowStats] = useState(false)

  return (
    <UIOverlay>
      <TopLeft>
        <InfoCard
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Player Info</h3>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {address ? (
              <>
                <div>Address: {address.slice(0, 6)}...{address.slice(-4)}</div>
                <div>Balance: {balance ? parseFloat(balance.formatted).toFixed(4) : '0'} ETH</div>
              </>
            ) : (
              <div>Not connected</div>
            )}
          </div>
        </InfoCard>

        <Button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </Button>

        <AnimatePresence>
          {showStats && (
            <InfoCard
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Game Stats</h3>
              <StatsGrid>
                <StatItem>
                  <div className="label">Level</div>
                  <div className="value">1</div>
                </StatItem>
                <StatItem>
                  <div className="label">XP</div>
                  <div className="value">250</div>
                </StatItem>
                <StatItem>
                  <div className="label">Coins</div>
                  <div className="value">1,500</div>
                </StatItem>
                <StatItem>
                  <div className="label">NFTs</div>
                  <div className="value">3</div>
                </StatItem>
              </StatsGrid>
            </InfoCard>
          )}
        </AnimatePresence>
      </TopLeft>

      <TopRight>
        <InfoCard
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Controls</h3>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: '1.4' }}>
            <div>🖱️ Left Click: Rotate view</div>
            <div>🖱️ Right Click: Pan</div>
            <div>🎯 Scroll: Zoom</div>
            <div>🎮 Click objects to interact</div>
          </div>
        </InfoCard>
      </TopRight>

      <BottomLeft>
        <InfoCard
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ fontSize: '0.8rem', padding: '8px 12px' }}
            >
              Mint NFT
            </Button>
            <Button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ fontSize: '0.8rem', padding: '8px 12px' }}
            >
              Claim Tokens
            </Button>
          </div>
        </InfoCard>
      </BottomLeft>

      <BottomRight>
        <InfoCard
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Game Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#4ade80',
                animation: 'pulse 2s infinite'
              }}
            />
            <span style={{ fontSize: '0.9rem' }}>Connected to blockchain</span>
          </div>
        </InfoCard>
      </BottomRight>
    </UIOverlay>
  )
}


