import React from 'react'

export type VoteRecord = { voterId: string; voterName: string; targetId: string; targetName: string }

export function VotingPanel({ voteRecords, round }: { voteRecords: VoteRecord[]; round: number }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8, color: '#fff' }}>
      <div style={{ fontWeight: 700 }}>Round {round} — Votes</div>
      <ul style={{ margin: 0, paddingLeft: 12 }}>
        {voteRecords.map((v, i) => (
          <li key={i} style={{ fontSize: 13 }}>{v.voterName} → {v.targetName}</li>
        ))}
      </ul>
    </div>
  )
}

export default VotingPanel
