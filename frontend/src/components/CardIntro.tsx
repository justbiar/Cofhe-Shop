import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const Container = styled.div`
  padding: 100px 20px;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
  justify-content: center;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
`

const CardBox = styled(motion.div)`
  padding: 14px;
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  color: white;
  min-height: 120px;
  display: flex;
  gap: 12px;
  align-items: center;
`

const Img = styled.img`
  width: 84px;
  height: 84px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
`

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export default function CardIntro() {
  const cards = [
    { id: 1, title: 'Gossip (Black Card)', story: 'A master of whispers. Uses rumors to sow distrust and eliminate a player at night by spreading a poisonous gossip.' },
    { id: 2, title: 'Consumer', story: 'A social butterfly who gathers intel in the marketplace. Tries to find the black card by voting and steering the group.' },
    { id: 3, title: 'Developer', story: 'Analytical and suspicious. Looks for patterns and anomalies among behaviors to unmask the liar.' },
    { id: 4, title: 'CEO', story: 'A confident leader who can influence opinions. Uses charisma during the day to guide votes.' },
    { id: 5, title: 'CoFHE Agent', story: 'A stealthy observer working behind the scenes. Quiet, but decisive when choosing whom to trust.' }
  ]

  return (
    <Container>
      <motion.h1 initial={{y: -10, opacity:0}} animate={{y:0, opacity:1}}>Cards & Gameplay</motion.h1>
      <p style={{ maxWidth: 800, textAlign: 'center' }}>
        Welcome to the CoFHE Table. Each round has a Day (voting) and Night (gossip) phase. Your goal is to find the Gossip (black card) during the day by voting. The Gossip tries to eliminate players at night using rumors.
      </p>

      <Grid>
        {cards.map(c => (
          <CardBox key={c.id} whileHover={{ scale: 1.02 }}>
            <Img src={`/nfts/${c.id}.png`} alt={c.title} onError={(e:any)=>{ e.currentTarget.src = '/nfts/metadata-1.json' }} />
            <Meta>
              <strong>{c.title}</strong>
              <div style={{ marginTop: 4, fontSize: 14 }}>{c.story}</div>
            </Meta>
          </CardBox>
        ))}
      </Grid>

      {/* Open Table button removed per request */}
    </Container>
  )
}
