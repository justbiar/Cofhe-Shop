import React, { useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';

export type VoteRecord = {
  voterId: string;
  voterName: string;
  targetId: string;
  targetName: string;
};
interface VotingPanelProps {
  voteRecords: VoteRecord[];
  round: number;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;
const PanelContainer = styled.div`
  background: rgba(30, 41, 59, 0.8); // Yarı saydam koyu arkaplan
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 320px; // Daha dar bir kutu
  animation: ${fadeIn} 0.5s ease-out;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  font-size: 1.2rem; // Daha küçük başlık
  font-weight: 600;
  color: #fff;
  margin-top: 0;
  margin-bottom: 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 12px;
`;

const VoteList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 200px; // Yüksekliği azalttık
  overflow-y: auto;
  padding-right: 8px; // Kaydırma çubuğu için boşluk

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const VoteItem = styled.li`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0; // Daha az padding
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'Inter', sans-serif;
  font-size: 1rem;

  &:last-child {
    border-bottom: none;
  }
`;

const VoterName = styled.span`
  font-weight: bold;
  color: #a0aec0; // Açık gri
`;

const TargetName = styled.span`
  font-weight: bold;
  color: #cbd5e0; // Daha açık gri
`;

const Arrow = styled.span`
  margin: 0 12px;
  color: #718096; // Ok rengi
`;

export const VotingPanel: React.FC<VotingPanelProps> = ({ voteRecords, round }) => {
  const listRef = useRef<HTMLUListElement>(null);

  // Her yeni oy eklendiğinde listenin en altına kaydır
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [voteRecords]);

  return (
    <PanelContainer>
      {/* Başlığı "Oylama" olarak değiştirdik */}
      <Title>Oylama</Title>
      <VoteList ref={listRef}>
        {voteRecords && voteRecords.length > 0 ? (
          voteRecords.map((vote, index) => (
            <VoteItem key={index}>
              <VoterName>{vote.voterName}</VoterName>
              <Arrow>→</Arrow>
              <TargetName>{vote.targetName}</TargetName>
            </VoteItem>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#a0aec0' }}>Bu turda oy kullanılmadı.</p>
        )}
      </VoteList>
    </PanelContainer>
  );
};