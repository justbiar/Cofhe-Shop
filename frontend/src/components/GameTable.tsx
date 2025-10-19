import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Card from './Card'
import { useAccount, useNetwork, usePublicClient, useWalletClient } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

type Player = {
  id: string
  name: string
  isBot: boolean
  cardId: number | null
  eliminated?: boolean
  hasVoted?: boolean
  playerId?: number // Add playerId field
}

const makePlayers = (meAddress: string): Player[] => [
  { id: meAddress || 'you', name: 'You', isBot: false, cardId: null, eliminated: false, hasVoted: false, playerId: 0 }, // Assign playerId
  { id: 'bot1', name: 'Alice', isBot: true, cardId: null, eliminated: false, hasVoted: false, playerId: 1 }, // Assign playerId
  { id: 'bot2', name: 'Bob', isBot: true, cardId: null, eliminated: false, hasVoted: false, playerId: 2 }, // Assign playerId
  { id: 'bot3', name: 'Charlie', isBot: true, cardId: null, eliminated: false, hasVoted: false, playerId: 3 }, // Assign playerId
  { id: 'bot4', name: 'Diana', isBot: true, cardId: null, eliminated: false, hasVoted: false, playerId: 4 }, // Assign playerId
]

function shuffle<T>(arr: T[]) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

import useGameNFT from '../hooks/useGameNFT'
import useLocalNFTs from '../hooks/useLocalNFTs'
import { VotingPanel, VoteRecord } from './VotingPanel'
import addresses from '../contracts/addresses.json'
import { useNavigate } from 'react-router-dom'

export default function GameTable({ meAddress }: { meAddress: string }) {
  const navigate = useNavigate()
  const [players, setPlayers] = useState<Player[]>(() => makePlayers(meAddress))
  const [phase, setPhase] = useState<'day' | 'night'>('day')
  const [messages, setMessages] = useState<string[]>([])
  const [toasts, setToasts] = useState<Array<{ id: number, text: string }>>([])
  const [started, setStarted] = useState(false)
  const [voteTimer, setVoteTimer] = useState(0)
  const timerRef = useRef<number | null>(null)
  const [gossipMode, setGossipMode] = useState(false)
  const [round, setRound] = useState(1)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<'whites' | 'blacks' | null>(null)
  const [gameMode, setGameMode] = useState<'normal' | 'fhe'>('normal') // 'fhe' modu henüz tam entegre değil
  const [voteRecords, setVoteRecords] = useState<VoteRecord[]>([])
  // deck card ids mapped to images: assume 1 = gossip (black), others are good
  const [isVoting, setIsVoting] = useState(false)
  const [showPublicDataWarning, setShowPublicDataWarning] = useState(true)
  const [transaction, setTransaction] = useState<{ hash: string; status: 'pending' | 'confirmed' | 'failed' } | null>(null)
  const { chain } = useNetwork()
  const isVotingRef = useRef(false) // Oylama kilidi için ref
  const blockExplorerUrl = useMemo(() => {
    return chain?.blockExplorers?.default.url
  }, [chain])

  const deck = useMemo(() => [1, 2, 3, 4, 5], [])
  const contractAddress = addresses.GameNFT
  const { owners, uris, images, names } = useGameNFT(contractAddress as any, [1, 2, 3, 4, 5])
  const { names: localNames, images: localImages } = useLocalNFTs([1,2,3,4,5])
  const [showDebug, setShowDebug] = useState(false)
  const { address: connectedAddress } = useAccount()
  const publicClient = usePublicClient()
  const votingAddress = addresses.Voting

  const votingAbi = [
    {
      name: 'castVote',
      type: 'function',
      inputs: [ { internalType: 'uint256', name: 'round', type: 'uint256' }, { internalType: 'uint256', name: 'targetId', type: 'uint256' } ]
    },
    { name: 'getVotes', type: 'function', inputs: [ { internalType: 'uint256', name: 'round', type: 'uint256' }, { internalType: 'uint256', name: 'targetId', type: 'uint256' } ], outputs: [ { internalType: 'uint256', name: '', type: 'uint256' } ] }
  ]

  const { data: walletClient } = useWalletClient()
  const [onChainVotes, setOnChainVotes] = useState<Record<number, number>>({})

  const fetchOnChainVotes = async (roundToRead = round) => {
    if (!votingAddress) return {}
    const map: Record<number, number> = {}
    // Iterate through all possible playerIds (0 to 4 in this case)
    for (const id of [0, 1, 2, 3, 4]) { // Use playerIds instead of cardIds
      try {
        const v = await publicClient.readContract({ address: votingAddress as any, abi: votingAbi as any, functionName: 'getVotes', args: [BigInt(roundToRead), BigInt(id)] })
        map[id] = Number(v)
      } catch (e) {
        map[id] = 0
      }
    }
    setOnChainVotes(map)
    return map
  }

  // small toast helper
  const pushToast = (text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts(t => [...t, { id, text }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500)
  }

  // card descriptions to show on start overlay
  const cardDescriptions: Record<number, { title: string; story: string }> = {
    1: { title: 'Gossip (Black Card)', story: 'A master of whispers. Uses rumors to sow distrust and eliminate a player at night by spreading a poisonous gossip.' },
    2: { title: 'Consumer', story: 'A social butterfly who gathers intel in the marketplace. Tries to find the black card by voting and steering the group.' },
    3: { title: 'Developer', story: 'Analytical and suspicious. Looks for patterns and anomalies among behaviors to unmask the liar.' },
    4: { title: 'CEO', story: 'A confident leader who can influence opinions. Uses charisma during the day to guide votes.' },
    5: { title: 'CoFHE Agent', story: 'A stealthy observer working behind the scenes. Quiet, but decisive when choosing whom to trust.' },
  }

  useEffect(() => {
    // if on-chain owners are present, assign tokens to players according to owner mapping
    const shuffled = shuffle(deck)
    setPlayers(prev => prev.map((p, idx) => ({ ...p, cardId: shuffled[idx], eliminated: false, hasVoted: false })))
    setMessages([`Round 1: Cards dealt.`])
    setPhase('day')
    setRound(1)
  }, [meAddress])

  // ensure the first player's id follows meAddress so faceUp logic works when wallet connects
  useEffect(() => {
    if (!meAddress) return
    setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, id: meAddress } : p))
  }, [meAddress])

  useEffect(() => {
    // when entering day, reset votes and simulate bot voting
    if (phase === 'day') {
      setPlayers(prev => prev.map(p => ({ ...p, hasVoted: false })))
      setMessages(m => [...m, `Day ${round}: Discuss and vote to find the black card.`])
      pushToast(`Day ${round} started — discuss and vote!`)
      setVoteRecords([]) // Reset votes here.
      setVotes({}) // Also reset vote counts.
      // start 30s voting timer
      setVoteTimer(30)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      timerRef.current = window.setInterval(() => {
        setVoteTimer(t => {
          if (t <= 1) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            pushToast('Voting time ended — tallying votes.');
            // setPlayers'ın callback formunu kullanarak en güncel state ile evaluateDay'i çağır.
            // Bu, "stale state" sorununu çözer.
            setPlayers(currentPlayers => { evaluateDay(currentPlayers); return currentPlayers; });
          }
          return t - 1
        })
      }, 1000)

      // bots will vote after a short random delay
      players.forEach(p => {
        if (p.isBot && !p.eliminated) {
          const delay = 500 + Math.random() * 1500
          setTimeout(() => {
            botVote(p.id)
          }, delay)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const addMessage = (txt: string) => setMessages(m => [...m, txt])

  const botVote = (botId: string) => {
    // Oyuncunun zaten oy kullanıp kullanmadığını kontrol et
    const hasVoted = players.find(p => p.id === botId)?.hasVoted;
    if (hasVoted) {
      return; // Zaten oy kullandıysa tekrar oy kullanmasını engelle
    }

    setPlayers(prev => {
      const alive = prev.filter(x => !x.eliminated)
      // bot picks a random alive target that's not itself
      const choices = alive.filter(x => x.id !== botId)
      if (choices.length === 0) return prev
      const target = choices[Math.floor(Math.random() * choices.length)]
      const voter = prev.find(p => p.id === botId)
      if (!voter) return prev;

      setVoteRecords(records => [
        ...records,
        { voterId: voter.id, voterName: voter.name, targetId: target.id, targetName: target.name }
      ])


      addMessage(`${botId} voted for ${target.name}`)
      // mark bot as hasVoted and tally vote
      setVotes(v => ({ ...v, [target.playerId!]: (v[target.playerId!] || 0) + 1 }))
      const nextPlayers = prev.map(p => (p.id === botId ? { ...p, hasVoted: true } : p));
      checkAllVotes(nextPlayers);
      return nextPlayers;
    })
  }

  const checkAllVotes = (currentPlayers: Player[]) => {
    // if all alive players have hasVoted true, evaluate votes
    const alive = currentPlayers.filter(p => !p.eliminated)
    const allVoted = alive.every(p => p.hasVoted)

    if (allVoted) {
      // Stop timer and set to 0
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setVoteTimer(0)
      setTimeout(() => evaluateDay(currentPlayers), 300); // Short delay before evaluation
    }
  }

  const userVote = useCallback(async (targetId: string) => {
    // Kilit zaten fonksiyon çağrılmadan önce (onClick içinde) ayarlandı.
    // Sadece temel kontrolleri yapalım.
    if (phase !== 'day' || gameOver || voteTimer <= 0) return
    
    const me = players.find(p => p.id === meAddress);
    if (me?.hasVoted) {
      pushToast('Bu turda zaten oy kullandınız.');
      return;
    }
    const target = players.find(p => p.id === targetId)
    if (!target) return
    
    // require wallet and wallet signing to count vote
    if (!walletClient) { // Sadece walletClient kontrolü yeterli
      return; // Buton mantığı zaten cüzdan bağlı değilse ConnectButton gösterecek
    }

    const voter = players.find(p => p.id === meAddress);
    if (!voter) {
      isVotingRef.current = false;
      setIsVoting(false);
      return;
    }
    
    setVoteRecords(records => [
      ...records,
      { voterId: meAddress, voterName: voter.name, targetId: target.id, targetName: target.name }
    ]);
    addMessage(`Submitting vote for ${target.name}...`)
    pushToast('You voted — awaiting wallet confirmation')

    try {
      setTransaction(null) // Clear previous transaction
      const targetPlayerId = target.playerId ?? 0
      const txHash = await (walletClient as any).writeContract({ address: votingAddress as any, abi: votingAbi as any, functionName: 'castVote', args: [BigInt(round), BigInt(targetPlayerId)] })
      // wait for confirmation by polling for receipt
      let receipt = null
      for (let i = 0; i < 30; i++) {
        // eslint-disable-next-line no-await-in-loop
        receipt = await publicClient.getTransactionReceipt({ hash: txHash as any }).catch(() => null)
        setTransaction({ hash: txHash, status: 'pending' })
        if (receipt && (receipt as any).blockNumber) break
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 1000))
      }
      if (receipt && (receipt as any).blockNumber) {
        addMessage('Vote recorded on-chain.')
        pushToast('Vote recorded on-chain')
        setTransaction({ hash: txHash, status: 'confirmed' })
        console.log('[GameTable] vote tx confirmed', { txHash, round, target: targetPlayerId })
        // best-effort: refresh on-chain votes after confirmation
        try {
          await fetchOnChainVotes()
        } catch (e) {
          console.error('Failed to refresh on-chain votes', e)
        }
        // mark user voted and tally
        setPlayers(prev => {
          const nextPlayers = prev.map(p => (p.id === meAddress ? { ...p, hasVoted: true } : p));
          checkAllVotes(nextPlayers);
          return nextPlayers;
        })
      } else {
        addMessage('Transaction not confirmed yet.')
        pushToast('Transaction not confirmed. Vote not counted.')
        setTransaction({ hash: txHash, status: 'failed' })
      }
    } catch (err: any) {
      // user likely rejected the signature or tx failed
      console.error('[GameTable] vote error', err)
      addMessage('On-chain vote failed or rejected: ' + (err?.message ?? String(err)))
      if (transaction) setTransaction(t => t ? { ...t, status: 'failed' } : null)
      pushToast('Vote rejected or failed — please retry')
    } finally {
      isVotingRef.current = false;
      setIsVoting(false); // Oylama işlemi bittiğinde (başarılı veya başarısız) kilidi kaldır
    }
  }, [phase, gameOver, players, walletClient, connectedAddress, addMessage, pushToast, round, votingAddress, votingAbi, publicClient, meAddress, checkAllVotes, fetchOnChainVotes, transaction]);

  const combineVotes = (localVotes: Record<string, number>, chainVotes: Record<number, number>): Record<number, number> => {
    // Start with a fresh copy of on-chain votes
    const combined: Record<number, number> = { ...chainVotes }; 
    // Add only bot votes from local state
    for (const [playerIdStr, count] of Object.entries(localVotes)) {
      const playerId = Number(playerIdStr);
      // We assume local `votes` state only contains bot votes now.
      combined[playerId] = (combined[playerId] || 0) + count; 
    }
    return combined;
  };

  const determineEliminatedPlayer = (currentPlayers: Player[], combinedVotes: Record<number, number>): Player | undefined => {
    const alive = currentPlayers.filter(p => !p.eliminated);
    if (alive.length === 0) return undefined;

    const alivePlayerIds = new Set(alive.map(p => p.playerId));
    const [topPlayerIdStr] = Object.entries(combinedVotes)
      .filter(([playerId]) => alivePlayerIds.has(Number(playerId)))
      .reduce(([maxPlayer, maxVotes], [currentPlayer, currentVotes]) =>
        currentVotes > maxVotes ? [currentPlayer, currentVotes] : [maxPlayer, maxVotes], [null, -1]);

    let topPlayerId = topPlayerIdStr ? Number(topPlayerIdStr) : null;

    if (topPlayerId === null) {
      const candidates = alive.map(a => a.playerId);
      topPlayerId = candidates[Math.floor(Math.random() * candidates.length)]!;
    }
    return currentPlayers.find(p => p.playerId === topPlayerId);
  };

  const evaluateDay = async (currentPlayers = players) => {
    // stop timer
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

  const onChain = await fetchOnChainVotes(); // Ensure we have the latest on-chain votes and receive the map

  const combined = combineVotes(votes, onChain || onChainVotes); // `votes` should only contain bot votes
    const accused = determineEliminatedPlayer(currentPlayers, combined);
    if (!accused) return

    setPlayers(prev => {
        const nextPlayers = prev.map(p => (p.id === accused.id ? { ...p, eliminated: true } : p));

        if (accused.cardId === 1) {
            // Gossip card found -> Blacks win
            addMessage(`The Gossip has been revealed! ${accused.name} was the black card.`)
            setGameOver(true)
            setWinner('blacks')
            return nextPlayers; // Stop further execution
        } else {
            // eliminate accused
            addMessage(`Vote failed: ${accused.name} was not the black card.`)
            // check victory: if only 1 white left and black
            const aliveAfter = nextPlayers.filter(p => !p.eliminated);
            const whiteAlive = aliveAfter.filter(a => a.cardId !== 1)
            const blackAlive = aliveAfter.filter(a => a.cardId === 1)
            if (whiteAlive.length <= 1 && blackAlive.length >= 1) {
                setGameOver(true)
                setWinner('blacks')
                addMessage('Blacks have prevailed.')
            } else {
                 // proceed to night if not game over
                setPhase('night')
            }
        }
        return nextPlayers;
    });
  }

  const handleElimination = (targetId: string, eliminatorName: string) => {
    setPlayers(prev => {
      const target = prev.find(p => p.id === targetId);
      if (!target) return prev;

      const nextPlayers = prev.map(p => (p.id === targetId ? { ...p, eliminated: true } : p));
      addMessage(`Night: ${eliminatorName} eliminated ${target.name}.`);

      const aliveAfter = nextPlayers.filter(p => !p.eliminated);
      const whiteAlive = aliveAfter.filter(a => a.cardId !== 1);
      if (whiteAlive.length <= 1) {
        setGameOver(true);
        setWinner('blacks');
        addMessage('Blacks have prevailed.');
      }
      return nextPlayers;
    });
    pushToast(`${(players.find(p => p.id === targetId))?.name} was eliminated.`);
  };

  const runNight = () => {
    if (gameOver) return
    const alive = players.filter(p => !p.eliminated)
    const black = alive.find(p => p.cardId === 1)
    if (!black) {
      addMessage('No black card alive. Skipping night.')
      setPhase('day')
      return
    }
    // black chooses target (not itself)
    // if black is a bot, auto-choose
    const choices = alive.filter(p => p.id !== black.id)
    if (choices.length === 0) return
    if (black.isBot) {
      const target = choices[Math.floor(Math.random() * choices.length)];
      handleElimination(target.id, `Black card (${black.name})`);
    } else {
      // if human black card, enable gossip mode so they can choose
      setGossipMode(true)
      pushToast('You are the Gossip. Choose someone to eliminate.')
      return
    }
    // next round
    setRound(r => r + 1)
    // small delay then new day
    setTimeout(() => {
      if (!gameOver) {
        setPhase('day')
        // reset votes for next round
        setPlayers(prev => prev.map(p => ({ ...p, hasVoted: false })))
        setVotes({})
        addMessage(`Day ${round + 1}: Cards remain.`)
      }
    }, 800)
  }

  // side-effect: when phase switches to night, run night actions automatically
  useEffect(() => {
    if (phase === 'night') {
      setTimeout(() => runNight(), 800)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const manualReveal = (id: string) => {
    // reveal a player's card by turning it faceUp for everyone in the UI (for demo)
    setPlayers(prev => prev.map(p => (p.id === id ? { ...p, eliminated: p.eliminated } : p)))
  }

  const resetGameState = useCallback((autoStart = false) => {
    setGameOver(false)
    setWinner(null)
    setVotes({})
    setVoteRecords([]) // Oylama tablosunu sıfırla
    setPlayers(makePlayers(meAddress))
    const shuffled = shuffle(deck)
    setPlayers(prev => prev.map((p, idx) => ({ ...p, cardId: shuffled[idx], eliminated: false, hasVoted: false })))
    setRound(1)
    setPhase('day')
    setVoteTimer(0)
    setShowPublicDataWarning(true)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (autoStart) {
      setStarted(true)
      pushToast('Game restarted')
    } else {
      setStarted(false)
    }
  }, [deck, meAddress, pushToast]);

  return (
    <div style={{
      padding: 24,
      minHeight: '100vh',
      transition: 'background 600ms ease',
      backgroundImage: `url('/table_bg.png')`, // Use a table background image
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
    }}>
      {/* Start overlay */}
      {!started && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 60 }}>
          <div style={{ background: '#111827', color: '#fff', padding: 28, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', textAlign: 'center', width: 640, border: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 style={{ marginTop: 0 }}>Start Game</h2>
            <p>You'll play against 4 bots. Day: everyone votes. Night: the Gossip (black card) can spread a rumor to eliminate someone.</p>
            
            {/* Game Mode Selector */}
            <div style={{ margin: '20px 0', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '10px', display: 'inline-flex' }}>
              <button onClick={() => setGameMode('normal')} style={{ background: gameMode === 'normal' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                Normal Mode
              </button>
              <button onClick={() => setGameMode('fhe')} style={{ background: gameMode === 'fhe' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                FHE Mode (Private Votes)
              </button>
            </div>
            <p style={{ fontSize: 13, opacity: 0.8, marginTop: 0 }}>{gameMode === 'normal' ? 'All votes are public on-chain.' : 'Votes are encrypted. Only the final tally is revealed.'}</p>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, textAlign: 'left', marginTop: 10, maxHeight: 200, overflowY: 'auto' }}>
              {Object.entries(cardDescriptions).map(([id, info]) => (
                <div key={id} style={{ padding: 8, borderRadius: 8, background: phase === 'day' ? '#f6fbff' : '#071028' }}>
                  <strong>{info.title}</strong>
                  <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>{info.story}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
              <button onClick={() => {
                setStarted(true)
                // initial deal
                const shuffled = shuffle(deck)
                setPlayers(prev => prev.map((p, idx) => ({ ...p, cardId: shuffled[idx], eliminated: false, hasVoted: false })))
                setMessages([`Round 1: Cards dealt.`])
                setPhase('day')
                setRound(1)
                setShowPublicDataWarning(true)
                setVoteRecords([]) // Oylama tablosunu sıfırla
                pushToast(`Game started in ${gameMode.toUpperCase()} Mode!`)
              }}>Start Game</button>
            </div>
          </div>
        </div>
      )}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      }}>
        <h2 style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', margin: 0 }}>CoFHE Shop - Table</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', color: 'white' }}>
          {/* Game status moved to bottom bar */}
        </div>
      </div>

      {/* Add padding to the main content to prevent overlap with the fixed header */}
      <div style={{
        paddingTop: 120, // Adjust this value based on the height of your fixed header
        display: 'flex',
        flexDirection: 'column', // Changed to column for vertical alignment
        justifyContent: 'space-between', // Pushes bots to top, player to bottom
        alignItems: 'center',
        width: '100%',
        height: 'calc(100vh - 120px)', // Adjusted height
        position: 'relative',
      }}>
        {/* Top row for bots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px', // Spacing between bot cards
          width: '100%',
          padding: '20px 0',
        }}>
          {players.filter(p => p.id !== meAddress).map((p) => (
            <div key={p.id} style={{
              textAlign: 'center',
              opacity: p.eliminated ? 0.4 : 1,
              color: 'white',
              textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
            }}>
              <div style={{ marginBottom: 8 }}>{p.name}{p.eliminated ? ' (eliminated)' : ''}</div>
              <Card faceUp={p.id === meAddress || !!p.eliminated} image={localImages[p.cardId ?? 0] || images[p.cardId ?? 0] || uris[p.cardId ?? 0] || `/nfts/${p.cardId}.png`} label={localNames[p.cardId ?? 0] || names[p.cardId ?? 0] || `Card ${p.cardId}`} />
              <div style={{ marginTop: 8 }}>
                {phase === 'day' ? (
                  !connectedAddress ? (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button onClick={openConnectModal} type="button">
                          Oy için Cüzdan Bağla
                        </button>
                      )}
                    </ConnectButton.Custom>
                  ) : (
                    <button disabled={p.eliminated || isVoting || players.find(pl => pl.id === meAddress)?.hasVoted || voteTimer <= 0} onClick={() => {
                      if (isVotingRef.current) return; // Çift tıklamayı engellemek için ek kontrol
                      isVotingRef.current = true;
                      setIsVoting(true);
                      userVote(p.id);
                    }}>
                      {players.find(pl => pl.id === meAddress)?.hasVoted ? 'Oylandı' : isVoting ? 'Oylanıyor...' : 'Oy Ver'}
                    </button>
                  )
                ) : (
                  p.cardId === 1 && p.id === meAddress && !p.eliminated ? (
                    <button onClick={() => setGossipMode(true)}>Gossip</button>
                  ) : (
                    <button disabled>{p.eliminated ? '—' : 'Waiting'}</button>
                  )
                )}
              </div>
              {p.eliminated && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#fff' }}>Had: Card {p.cardId}</div>
              )}
            </div>
          ))}
        </div>

        {/* Oylama Paneli - Oyun sırasında gösterilir */}
        {phase === 'day' && started && !gameOver && (
          <div style={{ position: 'absolute', bottom: '100px', left: '24px', zIndex: 70 }}>
            <VotingPanel voteRecords={voteRecords} round={round} />
          </div>
        )}

        {/* Bottom row for the current player */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          padding: '20px 0',
        }}>
          {players.filter(p => p.id === meAddress).map(p => (
            <div key={p.id} style={{
              textAlign: 'center',
              opacity: p.eliminated ? 0.4 : 1,
              color: 'white',
              textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
            }}>
              <div style={{ marginBottom: 8 }}>{p.name}{p.eliminated ? ' (eliminated)' : ''}</div>
              <Card faceUp={p.id === meAddress || !!p.eliminated} image={localImages[p.cardId ?? 0] || images[p.cardId ?? 0] || uris[p.cardId ?? 0] || `/nfts/${p.cardId}.png`} label={localNames[p.cardId ?? 0] || names[p.cardId ?? 0] || `Card ${p.cardId}`} />
              <div style={{ marginTop: 8 }}>
                {phase === 'day' ? (
                  <button disabled>{p.eliminated ? 'Elendi' : 'Kendine Oy Veremezsin'}</button>
                ) : (
                  p.cardId === 1 && p.id === meAddress && !p.eliminated ? (
                    <button onClick={() => setGossipMode(true)}>Gossip</button>
                  ) : (
                    <button disabled>{p.eliminated ? '—' : 'Waiting'}</button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Game Status Bar at the bottom */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.5)',
        color: 'white',
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Combined HUD elements: Phase, Round, and Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8 }}>
            <div style={{ fontWeight: 700 }}>Phase: {phase.toUpperCase()}</div>
            <div>Round: {round}</div>
            {phase === 'day' && started && (
              <div style={{ marginLeft: 8, padding: '4px 8px', background: 'rgba(255,255,255,0.9)', borderRadius: 6, color: '#111' }}>{voteTimer}s</div>
            )}
            {/* On-chain votes quick view */}
            {Object.keys(onChainVotes).length > 0 && (
              <div style={{ marginLeft: 12, fontSize: 13, color: '#d1d5db' }}>
                On-chain: {Object.entries(onChainVotes).map(([pid, cnt]) => `${pid}:${cnt}`).join(' | ')}
              </div>
            )}
          </div>
          {/* Existing buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setPhase(p => (p === 'day' ? 'night' : 'day'))}>{phase === 'day' ? 'Switch to Night' : 'Switch to Day'}</button>
            <button onClick={() => {
              const shuffled = shuffle(deck)
              setPlayers(prev => prev.map((p, idx) => ({ ...p, cardId: shuffled[idx], eliminated: false, hasVoted: false })))
              setRound(1)
              setPhase('day')
              setMessages([`New deal: Round 1.`])
            }}>Redeal</button>
          </div>
        </div>
      </div>

      {/* Gossip modal (visible to human black card during night) */}
      {gossipMode && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 90 }}>
          <div style={{ background: '#111827', color: '#fff', padding: 20, borderRadius: 10, width: 520 }}>
            <h3>Gossip — choose someone to eliminate</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {players.filter(p => !p.eliminated && p.id !== meAddress).map(p => (
                <button key={p.id} onClick={() => {
                  handleElimination(p.id, 'You (as Gossip)');
                  setGossipMode(false);
                  setRound(r => r + 1);
                  setPhase('day');
                }} style={{ textAlign: 'left', padding: '8px 10px' }}>{p.name}</button>
              ))}
            </div>
            <div style={{ marginTop: 12, textAlign: 'right' }}><button onClick={() => setGossipMode(false)} style={{ opacity: 0.8 }}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* messages panel removed per request; only game UI remains */}

      {/* Toasts */}
      <div style={{ position: 'fixed', right: 20, top: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 80 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '10px 14px', borderRadius: 8, minWidth: 160, boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }}>{t.text}</div>
        ))}
      </div>
      {/* Game Over overlay */}
      {gameOver && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 120 }}>
          <div style={{ background: '#fff', color: '#111', padding: 28, borderRadius: 12, width: 520, textAlign: 'center' }}>
            <h2 style={{ marginTop: 0 }}>{winner === 'whites' ? 'Whites Win!' : 'Blacks Win!'}</h2>
            <p>Game over — {winner === 'whites' ? 'The white team successfully eliminated the Gossip.' : 'The Gossip team has won!'}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
              <button onClick={() => resetGameState(true)}>Replay</button>
              <button onClick={() => { resetGameState(false); navigate('/'); }}>Exit to Menu</button>
              <button onClick={() => navigate('/marketplace')}>How to play</button>
            </div>
          </div>
        </div>
      )}

      {/* Public Data Info Panel (Visible in Normal Mode) */}
      {started && gameMode === 'normal' && showPublicDataWarning && (
        <div style={{
          position: 'fixed',
          right: 24,
          top: 120, // Positioned below the header
          width: 320,
          background: 'rgba(255, 199, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          padding: '16px',
          borderRadius: 12,
          boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
          zIndex: 84,
          border: '1px solid rgba(255, 199, 0, 0.4)'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 8, color: '#fde047' }}>
            ⚠️ Public Data on Blockchain
          </h4>
          <p style={{ fontSize: 13, margin: '0 0 12px 0', lineHeight: 1.5, opacity: 0.9 }}>
            You are playing in <strong>Normal Mode</strong>. Your actions are recorded on a public blockchain and can be seen by anyone using a block explorer.
          </p>
          <ul style={{ fontSize: 13, paddingLeft: 20, margin: 0, listStyleType: '"- "' }}>
            <li style={{ marginBottom: 6 }}>
              <strong>Your Vote:</strong> Who you vote for is publicly visible.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Your Address:</strong> Your wallet address is linked to your in-game actions.
            </li>
            <li>
              <strong>Timing:</strong> The exact time of your vote is recorded.
            </li>
          </ul>
          <p style={{ fontSize: 12, marginTop: 14, opacity: 0.7, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>For a private game where your votes are encrypted, restart and choose <strong>FHE Mode</strong>.</p>
          <button onClick={() => setShowPublicDataWarning(false)} style={{ marginTop: 12, width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px', borderRadius: 6, cursor: 'pointer' }}>Close</button>
        </div>
      )}

      {/* Transaction Tracker */}
      {transaction && (
        <div style={{
          position: 'fixed',
          right: 24,
          bottom: 100, // Positioned above the bottom bar
          width: 320,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          padding: '16px',
          borderRadius: 12,
          boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
          zIndex: 85,
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 8 }}>Transaction Tracker</h4>
          <div style={{ fontSize: 13, wordBreak: 'break-all' }}>
            <div style={{ marginBottom: 8 }}><strong>Status:</strong> <span style={{ color: transaction.status === 'confirmed' ? '#4ade80' : transaction.status === 'pending' ? '#facc15' : '#f87171' }}>{transaction.status.toUpperCase()}</span></div>
            <div><strong>Hash:</strong> {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}</div>
            {blockExplorerUrl && (
              <a href={`${blockExplorerUrl}/tx/${transaction.hash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'underline', marginTop: 8, display: 'inline-block' }}>
                View on Explorer
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
