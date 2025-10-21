import React from 'react'

type Props = {
  faceUp: boolean
  image?: string
  label?: string
}

export default function Card({ faceUp, image, label }: Props) {
  return (
    <div style={{ width: 120, textAlign: 'center' }}>
      <div style={{ width: 120, height: 140, borderRadius: 8, overflow: 'hidden', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {faceUp && image ? (
          <img src={image} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ color: '#aaa', fontWeight: 700 }}>{faceUp ? label : 'CARD'}</div>
        )}
      </div>
      {label && <div style={{ marginTop: 8, fontSize: 13 }}>{label}</div>}
    </div>
  )
}
