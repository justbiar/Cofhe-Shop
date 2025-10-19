import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Card from './Card';
import { useAccount, useNetwork, usePublicClient, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
const makePlayers = (meAddress) => [
    { id: meAddress || 'you', name: 'You', isBot: false, cardId: null, eliminated: false, hasVoted: false, playerId: 0 }, // Assign playerId
    { id: 'bot1', name: 'Alice', isBot: true, cardId: null, eliminated: false, hasVoted: false, playerId: 1 }, // Assign playerId
    { id: 'bot2', name: 'Bob', isBot: true, cardId: null, eliminated: false, hasVoted: false, playerId: 2 }, // Assign playerId
    { id: 'bot3', name: 'Charlie', isBot: true, cardId: null, eliminated: false, hasVoted: false, playerId: 3 }, // Assign playerId
    { id: 'bot4', name: 'Diana', isBot: true, cardId: null, eliminated: false, hasVoted: false, playerId: 4 }, // Assign playerId
];
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
import useGameNFT from '../hooks/useGameNFT';
import useLocalNFTs from '../hooks/useLocalNFTs';
import { VotingPanel } from './VotingPanel';
import addresses from '../contracts/addresses.json';
import { useNavigate } from 'react-router-dom';
export default function GameTable({ meAddress }) {
    const navigate = useNavigate();
    const [players, setPlayers] = useState(() => makePlayers(meAddress));
    const [phase, setPhase] = useState('day');
    const [messages, setMessages] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [started, setStarted] = useState(false);
    const [voteTimer, setVoteTimer] = useState(0);
    const timerRef = useRef(null);
    const [gossipMode, setGossipMode] = useState(false);
    const [round, setRound] = useState(1);
    const [votes, setVotes] = useState({});
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [gameMode, setGameMode] = useState('normal'); // 'fhe' modu henüz tam entegre değil
    const [voteRecords, setVoteRecords] = useState([]);
    // deck card ids mapped to images: assume 1 = gossip (black), others are good
    const [isVoting, setIsVoting] = useState(false);
    const [showPublicDataWarning, setShowPublicDataWarning] = useState(true);
    const [transaction, setTransaction] = useState(null);
    const { chain } = useNetwork();
    const isVotingRef = useRef(false); // Oylama kilidi için ref
    const blockExplorerUrl = useMemo(() => {
        return chain?.blockExplorers?.default.url;
    }, [chain]);
    const deck = useMemo(() => [1, 2, 3, 4, 5], []);
    const contractAddress = addresses.GameNFT;
    const { owners, uris, images, names } = useGameNFT(contractAddress, [1, 2, 3, 4, 5]);
    const { names: localNames, images: localImages } = useLocalNFTs([1, 2, 3, 4, 5]);
    const [showDebug, setShowDebug] = useState(false);
    const { address: connectedAddress } = useAccount();
    const publicClient = usePublicClient();
    const votingAddress = addresses.Voting;
    const votingAbi = [
        {
            name: 'castVote',
            type: 'function',
            inputs: [{ internalType: 'uint256', name: 'round', type: 'uint256' }, { internalType: 'uint256', name: 'targetId', type: 'uint256' }]
        },
        { name: 'getVotes', type: 'function', inputs: [{ internalType: 'uint256', name: 'round', type: 'uint256' }, { internalType: 'uint256', name: 'targetId', type: 'uint256' }], outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }] }
    ];
    const { data: walletClient } = useWalletClient();
    const [onChainVotes, setOnChainVotes] = useState({});
    const fetchOnChainVotes = async (roundToRead = round) => {
        if (!votingAddress)
            return {};
        const map = {};
        // Iterate through all possible playerIds (0 to 4 in this case)
        for (const id of [0, 1, 2, 3, 4]) { // Use playerIds instead of cardIds
            try {
                const v = await publicClient.readContract({ address: votingAddress, abi: votingAbi, functionName: 'getVotes', args: [BigInt(roundToRead), BigInt(id)] });
                map[id] = Number(v);
            }
            catch (e) {
                map[id] = 0;
            }
        }
        setOnChainVotes(map);
        return map;
    };
    // small toast helper
    const pushToast = (text) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts(t => [...t, { id, text }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
    };
    // card descriptions to show on start overlay
    const cardDescriptions = {
        1: { title: 'Gossip (Black Card)', story: 'A master of whispers. Uses rumors to sow distrust and eliminate a player at night by spreading a poisonous gossip.' },
        2: { title: 'Consumer', story: 'A social butterfly who gathers intel in the marketplace. Tries to find the black card by voting and steering the group.' },
        3: { title: 'Developer', story: 'Analytical and suspicious. Looks for patterns and anomalies among behaviors to unmask the liar.' },
        4: { title: 'CEO', story: 'A confident leader who can influence opinions. Uses charisma during the day to guide votes.' },
        5: { title: 'CoFHE Agent', story: 'A stealthy observer working behind the scenes. Quiet, but decisive when choosing whom to trust.' },
    };
    useEffect(() => {
        // if on-chain owners are present, assign tokens to players according to owner mapping
        const shuffled = shuffle(deck);
        setPlayers(prev => prev.map((p, idx) => ({ ...p, cardId: shuffled[idx], eliminated: false, hasVoted: false })));
        setMessages([`Round 1: Cards dealt.`]);
        setPhase('day');
        setRound(1);
    }, [meAddress]);
    // ensure the first player's id follows meAddress so faceUp logic works when wallet connects
    useEffect(() => {
        if (!meAddress)
            return;
        setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, id: meAddress } : p));
    }, [meAddress]);
    useEffect(() => {
        // when entering day, reset votes and simulate bot voting
        if (phase === 'day') {
            setPlayers(prev => prev.map(p => ({ ...p, hasVoted: false })));
            setMessages(m => [...m, `Day ${round}: Discuss and vote to find the black card.`]);
            pushToast(`Day ${round} started — discuss and vote!`);
            setVoteRecords([]); // Reset votes here.
            setVotes({}); // Also reset vote counts.
            // start 30s voting timer
            setVoteTimer(30);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            timerRef.current = window.setInterval(() => {
                setVoteTimer(t => {
                    if (t <= 1) {
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                            timerRef.current = null;
                        }
                        pushToast('Voting time ended — tallying votes.');
                        // setPlayers'ın callback formunu kullanarak en güncel state ile evaluateDay'i çağır.
                        // Bu, "stale state" sorununu çözer.
                        setPlayers(currentPlayers => { evaluateDay(currentPlayers); return currentPlayers; });
                    }
                    return t - 1;
                });
            }, 1000);
            // bots will vote after a short random delay
            players.forEach(p => {
                if (p.isBot && !p.eliminated) {
                    const delay = 500 + Math.random() * 1500;
                    setTimeout(() => {
                        botVote(p.id);
                    }, delay);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);
    const addMessage = (txt) => setMessages(m => [...m, txt]);
    const botVote = (botId) => {
        // Oyuncunun zaten oy kullanıp kullanmadığını kontrol et
        const hasVoted = players.find(p => p.id === botId)?.hasVoted;
        if (hasVoted) {
            return; // Zaten oy kullandıysa tekrar oy kullanmasını engelle
        }
        setPlayers(prev => {
            const alive = prev.filter(x => !x.eliminated);
            // bot picks a random alive target that's not itself
            const choices = alive.filter(x => x.id !== botId);
            if (choices.length === 0)
                return prev;
            const target = choices[Math.floor(Math.random() * choices.length)];
            const voter = prev.find(p => p.id === botId);
            if (!voter)
                return prev;
            setVoteRecords(records => [
                ...records,
                { voterId: voter.id, voterName: voter.name, targetId: target.id, targetName: target.name }
            ]);
            addMessage(`${botId} voted for ${target.name}`);
            // mark bot as hasVoted and tally vote
            setVotes(v => ({ ...v, [target.playerId]: (v[target.playerId] || 0) + 1 }));
            const nextPlayers = prev.map(p => (p.id === botId ? { ...p, hasVoted: true } : p));
            checkAllVotes(nextPlayers);
            return nextPlayers;
        });
    };
    const checkAllVotes = (currentPlayers) => {
        // if all alive players have hasVoted true, evaluate votes
        const alive = currentPlayers.filter(p => !p.eliminated);
        const allVoted = alive.every(p => p.hasVoted);
        if (allVoted) {
            // Stop timer and set to 0
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setVoteTimer(0);
            setTimeout(() => evaluateDay(currentPlayers), 300); // Short delay before evaluation
        }
    };
    const userVote = useCallback(async (targetId) => {
        // Kilit zaten fonksiyon çağrılmadan önce (onClick içinde) ayarlandı.
        // Sadece temel kontrolleri yapalım.
        if (phase !== 'day' || gameOver || voteTimer <= 0)
            return;
        const me = players.find(p => p.id === meAddress);
        if (me?.hasVoted) {
            pushToast('Bu turda zaten oy kullandınız.');
            return;
        }
        const target = players.find(p => p.id === targetId);
        if (!target)
            return;
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
        addMessage(`Submitting vote for ${target.name}...`);
        pushToast('You voted — awaiting wallet confirmation');
        try {
            setTransaction(null); // Clear previous transaction
            const targetPlayerId = target.playerId ?? 0;
            const txHash = await walletClient.writeContract({ address: votingAddress, abi: votingAbi, functionName: 'castVote', args: [BigInt(round), BigInt(targetPlayerId)] });
            // wait for confirmation by polling for receipt
            let receipt = null;
            for (let i = 0; i < 30; i++) {
                // eslint-disable-next-line no-await-in-loop
                receipt = await publicClient.getTransactionReceipt({ hash: txHash }).catch(() => null);
                setTransaction({ hash: txHash, status: 'pending' });
                if (receipt && receipt.blockNumber)
                    break;
                // eslint-disable-next-line no-await-in-loop
                await new Promise(r => setTimeout(r, 1000));
            }
            if (receipt && receipt.blockNumber) {
                addMessage('Vote recorded on-chain.');
                pushToast('Vote recorded on-chain');
                setTransaction({ hash: txHash, status: 'confirmed' });
                console.log('[GameTable] vote tx confirmed', { txHash, round, target: targetPlayerId });
                // best-effort: refresh on-chain votes after confirmation
                try {
                    await fetchOnChainVotes();
                }
                catch (e) {
                    console.error('Failed to refresh on-chain votes', e);
                }
                // mark user voted and tally
                setPlayers(prev => {
                    const nextPlayers = prev.map(p => (p.id === meAddress ? { ...p, hasVoted: true } : p));
                    checkAllVotes(nextPlayers);
                    return nextPlayers;
                });
            }
            else {
                addMessage('Transaction not confirmed yet.');
                pushToast('Transaction not confirmed. Vote not counted.');
                setTransaction({ hash: txHash, status: 'failed' });
            }
        }
        catch (err) {
            // user likely rejected the signature or tx failed
            console.error('[GameTable] vote error', err);
            addMessage('On-chain vote failed or rejected: ' + (err?.message ?? String(err)));
            if (transaction)
                setTransaction(t => t ? { ...t, status: 'failed' } : null);
            pushToast('Vote rejected or failed — please retry');
        }
        finally {
            isVotingRef.current = false;
            setIsVoting(false); // Oylama işlemi bittiğinde (başarılı veya başarısız) kilidi kaldır
        }
    }, [phase, gameOver, players, walletClient, connectedAddress, addMessage, pushToast, round, votingAddress, votingAbi, publicClient, meAddress, checkAllVotes, fetchOnChainVotes, transaction]);
    const combineVotes = (localVotes, chainVotes) => {
        // Start with a fresh copy of on-chain votes
        const combined = { ...chainVotes };
        // Add only bot votes from local state
        for (const [playerIdStr, count] of Object.entries(localVotes)) {
            const playerId = Number(playerIdStr);
            // We assume local `votes` state only contains bot votes now.
            combined[playerId] = (combined[playerId] || 0) + count;
        }
        return combined;
    };
    const determineEliminatedPlayer = (currentPlayers, combinedVotes) => {
        const alive = currentPlayers.filter(p => !p.eliminated);
        if (alive.length === 0)
            return undefined;
        const alivePlayerIds = new Set(alive.map(p => p.playerId));
        const [topPlayerIdStr] = Object.entries(combinedVotes)
            .filter(([playerId]) => alivePlayerIds.has(Number(playerId)))
            .reduce(([maxPlayer, maxVotes], [currentPlayer, currentVotes]) => currentVotes > maxVotes ? [currentPlayer, currentVotes] : [maxPlayer, maxVotes], [null, -1]);
        let topPlayerId = topPlayerIdStr ? Number(topPlayerIdStr) : null;
        if (topPlayerId === null) {
            const candidates = alive.map(a => a.playerId);
            topPlayerId = candidates[Math.floor(Math.random() * candidates.length)];
        }
        return currentPlayers.find(p => p.playerId === topPlayerId);
    };
    const evaluateDay = async (currentPlayers = players) => {
        // stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        const onChain = await fetchOnChainVotes(); // Ensure we have the latest on-chain votes and receive the map
        const combined = combineVotes(votes, onChain || onChainVotes); // `votes` should only contain bot votes
        const accused = determineEliminatedPlayer(currentPlayers, combined);
        if (!accused)
            return;
        setPlayers(prev => {
            const nextPlayers = prev.map(p => (p.id === accused.id ? { ...p, eliminated: true } : p));
            if (accused.cardId === 1) {
                // Gossip card found -> Blacks win
                addMessage(`The Gossip has been revealed! ${accused.name} was the black card.`);
                setGameOver(true);
                setWinner('blacks');
                return nextPlayers; // Stop further execution
            }
            else {
                // eliminate accused
                addMessage(`Vote failed: ${accused.name} was not the black card.`);
                // check victory: if only 1 white left and black
                const aliveAfter = nextPlayers.filter(p => !p.eliminated);
                const whiteAlive = aliveAfter.filter(a => a.cardId !== 1);
                const blackAlive = aliveAfter.filter(a => a.cardId === 1);
                if (whiteAlive.length <= 1 && blackAlive.length >= 1) {
                    setGameOver(true);
                    setWinner('blacks');
                    addMessage('Blacks have prevailed.');
                }
                else {
                    // proceed to night if not game over
                    setPhase('night');
                }
            }
            return nextPlayers;
        });
    };
    const handleElimination = (targetId, eliminatorName) => {
        setPlayers(prev => {
            const target = prev.find(p => p.id === targetId);
            if (!target)
                return prev;
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
        if (gameOver)
            return;
        const alive = players.filter(p => !p.eliminated);
        const black = alive.find(p => p.cardId === 1);
        if (!black) {
            addMessage('No black card alive. Skipping night.');
            setPhase('day');
            return;
        }
        // black chooses target (not itself)
        // if black is a bot, auto-choose
        const choices = alive.filter(p => p.id !== black.id);
        if (choices.length === 0)
            return;
        if (black.isBot) {
            const target = choices[Math.floor(Math.random() * choices.length)];
            handleElimination(target.id, `Black card (${black.name})`);
        }
        else {
            // if human black card, enable gossip mode so they can choose
            setGossipMode(true);
            pushToast('You are the Gossip. Choose someone to eliminate.');
            return;
        }
        // next round
        setRound(r => r + 1);
        // small delay then new day
        setTimeout(() => {
            if (!gameOver) {
                setPhase('day');
                // reset votes for next round
                setPlayers(prev => prev.map(p => ({ ...p, hasVoted: false })));
                setVotes({});
                addMessage(`Day ${round + 1}: Cards remain.`);
            }
        }, 800);
    };
    // side-effect: when phase switches to night, run night actions automatically
    useEffect(() => {
        if (phase === 'night') {
            setTimeout(() => runNight(), 800);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);
    const manualReveal = (id) => {
        // reveal a player's card by turning it faceUp for everyone in the UI (for demo)
        setPlayers(prev => prev.map(p => (p.id === id ? { ...p, eliminated: p.eliminated } : p)));
    };
    const resetGameState = useCallback((autoStart = false) => {
        setGameOver(false);
        setWinner(null);
        setVotes({});
        setVoteRecords([]); // Oylama tablosunu sıfırla
        setPlayers(makePlayers(meAddress));
        const shuffled = shuffle(deck);
        setPlayers(prev => prev.map((p, idx) => ({ ...p, cardId: shuffled[idx], eliminated: false, hasVoted: false })));
        setRound(1);
        setPhase('day');
        setVoteTimer(0);
        setShowPublicDataWarning(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (autoStart) {
            setStarted(true);
            pushToast('Game restarted');
        }
        else {
            setStarted(false);
        }
    }, [deck, meAddress, pushToast]);
    return (_jsxs("div", { style: {
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
        }, children: [!started && (_jsx("div", { style: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 60 }, children: _jsxs("div", { style: { background: '#111827', color: '#fff', padding: 28, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', textAlign: 'center', width: 640, border: '1px solid rgba(255,255,255,0.2)' }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Start Game" }), _jsx("p", { children: "You'll play against 4 bots. Day: everyone votes. Night: the Gossip (black card) can spread a rumor to eliminate someone." }), _jsxs("div", { style: { margin: '20px 0', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '10px', display: 'inline-flex' }, children: [_jsx("button", { onClick: () => setGameMode('normal'), style: { background: gameMode === 'normal' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }, children: "Normal Mode" }), _jsx("button", { onClick: () => setGameMode('fhe'), style: { background: gameMode === 'fhe' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }, children: "FHE Mode (Private Votes)" })] }), _jsx("p", { style: { fontSize: 13, opacity: 0.8, marginTop: 0 }, children: gameMode === 'normal' ? 'All votes are public on-chain.' : 'Votes are encrypted. Only the final tally is revealed.' }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, textAlign: 'left', marginTop: 10, maxHeight: 200, overflowY: 'auto' }, children: Object.entries(cardDescriptions).map(([id, info]) => (_jsxs("div", { style: { padding: 8, borderRadius: 8, background: phase === 'day' ? '#f6fbff' : '#071028' }, children: [_jsx("strong", { children: info.title }), _jsx("div", { style: { fontSize: 13, opacity: 0.9, marginTop: 6 }, children: info.story })] }, id))) }), _jsx("div", { style: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }, children: _jsx("button", { onClick: () => {
                                    setStarted(true);
                                    // initial deal
                                    const shuffled = shuffle(deck);
                                    setPlayers(prev => prev.map((p, idx) => ({ ...p, cardId: shuffled[idx], eliminated: false, hasVoted: false })));
                                    setMessages([`Round 1: Cards dealt.`]);
                                    setPhase('day');
                                    setRound(1);
                                    setShowPublicDataWarning(true);
                                    setVoteRecords([]); // Oylama tablosunu sıfırla
                                    pushToast(`Game started in ${gameMode.toUpperCase()} Mode!`);
                                }, children: "Start Game" }) })] }) })), _jsxs("div", { style: {
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
                }, children: [_jsx("h2", { style: { color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', margin: 0 }, children: "CoFHE Shop - Table" }), _jsx("div", { style: { display: 'flex', gap: 16, alignItems: 'center', color: 'white' } })] }), _jsxs("div", { style: {
                    paddingTop: 120, // Adjust this value based on the height of your fixed header
                    display: 'flex',
                    flexDirection: 'column', // Changed to column for vertical alignment
                    justifyContent: 'space-between', // Pushes bots to top, player to bottom
                    alignItems: 'center',
                    width: '100%',
                    height: 'calc(100vh - 120px)', // Adjusted height
                    position: 'relative',
                }, children: [_jsx("div", { style: {
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '40px', // Spacing between bot cards
                            width: '100%',
                            padding: '20px 0',
                        }, children: players.filter(p => p.id !== meAddress).map((p) => (_jsxs("div", { style: {
                                textAlign: 'center',
                                opacity: p.eliminated ? 0.4 : 1,
                                color: 'white',
                                textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
                            }, children: [_jsxs("div", { style: { marginBottom: 8 }, children: [p.name, p.eliminated ? ' (eliminated)' : ''] }), _jsx(Card, { faceUp: p.id === meAddress || !!p.eliminated, image: localImages[p.cardId ?? 0] || images[p.cardId ?? 0] || uris[p.cardId ?? 0] || `/nfts/${p.cardId}.png`, label: localNames[p.cardId ?? 0] || names[p.cardId ?? 0] || `Card ${p.cardId}` }), _jsx("div", { style: { marginTop: 8 }, children: phase === 'day' ? (!connectedAddress ? (_jsx(ConnectButton.Custom, { children: ({ openConnectModal }) => (_jsx("button", { onClick: openConnectModal, type: "button", children: "Oy i\u00E7in C\u00FCzdan Ba\u011Fla" })) })) : (_jsx("button", { disabled: p.eliminated || isVoting || players.find(pl => pl.id === meAddress)?.hasVoted || voteTimer <= 0, onClick: () => {
                                            if (isVotingRef.current)
                                                return; // Çift tıklamayı engellemek için ek kontrol
                                            isVotingRef.current = true;
                                            setIsVoting(true);
                                            userVote(p.id);
                                        }, children: players.find(pl => pl.id === meAddress)?.hasVoted ? 'Oylandı' : isVoting ? 'Oylanıyor...' : 'Oy Ver' }))) : (p.cardId === 1 && p.id === meAddress && !p.eliminated ? (_jsx("button", { onClick: () => setGossipMode(true), children: "Gossip" })) : (_jsx("button", { disabled: true, children: p.eliminated ? '—' : 'Waiting' }))) }), p.eliminated && (_jsxs("div", { style: { marginTop: 8, fontSize: 12, color: '#fff' }, children: ["Had: Card ", p.cardId] }))] }, p.id))) }), phase === 'day' && started && !gameOver && (_jsx("div", { style: { position: 'absolute', bottom: '100px', left: '24px', zIndex: 70 }, children: _jsx(VotingPanel, { voteRecords: voteRecords, round: round }) })), _jsx("div", { style: {
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            padding: '20px 0',
                        }, children: players.filter(p => p.id === meAddress).map(p => (_jsxs("div", { style: {
                                textAlign: 'center',
                                opacity: p.eliminated ? 0.4 : 1,
                                color: 'white',
                                textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
                            }, children: [_jsxs("div", { style: { marginBottom: 8 }, children: [p.name, p.eliminated ? ' (eliminated)' : ''] }), _jsx(Card, { faceUp: p.id === meAddress || !!p.eliminated, image: localImages[p.cardId ?? 0] || images[p.cardId ?? 0] || uris[p.cardId ?? 0] || `/nfts/${p.cardId}.png`, label: localNames[p.cardId ?? 0] || names[p.cardId ?? 0] || `Card ${p.cardId}` }), _jsx("div", { style: { marginTop: 8 }, children: phase === 'day' ? (_jsx("button", { disabled: true, children: p.eliminated ? 'Elendi' : 'Kendine Oy Veremezsin' })) : (p.cardId === 1 && p.id === meAddress && !p.eliminated ? (_jsx("button", { onClick: () => setGossipMode(true), children: "Gossip" })) : (_jsx("button", { disabled: true, children: p.eliminated ? '—' : 'Waiting' }))) })] }, p.id))) })] }), _jsx("div", { style: {
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
                }, children: _jsxs("div", { style: { display: 'flex', gap: 16, alignItems: 'center' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8 }, children: [_jsxs("div", { style: { fontWeight: 700 }, children: ["Phase: ", phase.toUpperCase()] }), _jsxs("div", { children: ["Round: ", round] }), phase === 'day' && started && (_jsxs("div", { style: { marginLeft: 8, padding: '4px 8px', background: 'rgba(255,255,255,0.9)', borderRadius: 6, color: '#111' }, children: [voteTimer, "s"] })), Object.keys(onChainVotes).length > 0 && (_jsxs("div", { style: { marginLeft: 12, fontSize: 13, color: '#d1d5db' }, children: ["On-chain: ", Object.entries(onChainVotes).map(([pid, cnt]) => `${pid}:${cnt}`).join(' | ')] }))] }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx("button", { onClick: () => setPhase(p => (p === 'day' ? 'night' : 'day')), children: phase === 'day' ? 'Switch to Night' : 'Switch to Day' }), _jsx("button", { onClick: () => {
                                        const shuffled = shuffle(deck);
                                        setPlayers(prev => prev.map((p, idx) => ({ ...p, cardId: shuffled[idx], eliminated: false, hasVoted: false })));
                                        setRound(1);
                                        setPhase('day');
                                        setMessages([`New deal: Round 1.`]);
                                    }, children: "Redeal" })] })] }) }), gossipMode && (_jsx("div", { style: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 90 }, children: _jsxs("div", { style: { background: '#111827', color: '#fff', padding: 20, borderRadius: 10, width: 520 }, children: [_jsx("h3", { children: "Gossip \u2014 choose someone to eliminate" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }, children: players.filter(p => !p.eliminated && p.id !== meAddress).map(p => (_jsx("button", { onClick: () => {
                                    handleElimination(p.id, 'You (as Gossip)');
                                    setGossipMode(false);
                                    setRound(r => r + 1);
                                    setPhase('day');
                                }, style: { textAlign: 'left', padding: '8px 10px' }, children: p.name }, p.id))) }), _jsx("div", { style: { marginTop: 12, textAlign: 'right' }, children: _jsx("button", { onClick: () => setGossipMode(false), style: { opacity: 0.8 }, children: "Cancel" }) })] }) })), _jsx("div", { style: { position: 'fixed', right: 20, top: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 80 }, children: toasts.map(t => (_jsx("div", { style: { background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '10px 14px', borderRadius: 8, minWidth: 160, boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }, children: t.text }, t.id))) }), gameOver && (_jsx("div", { style: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 120 }, children: _jsxs("div", { style: { background: '#fff', color: '#111', padding: 28, borderRadius: 12, width: 520, textAlign: 'center' }, children: [_jsx("h2", { style: { marginTop: 0 }, children: winner === 'whites' ? 'Whites Win!' : 'Blacks Win!' }), _jsxs("p", { children: ["Game over \u2014 ", winner === 'whites' ? 'The white team successfully eliminated the Gossip.' : 'The Gossip team has won!'] }), _jsxs("div", { style: { display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }, children: [_jsx("button", { onClick: () => resetGameState(true), children: "Replay" }), _jsx("button", { onClick: () => { resetGameState(false); navigate('/'); }, children: "Exit to Menu" }), _jsx("button", { onClick: () => navigate('/marketplace'), children: "How to play" })] })] }) })), started && gameMode === 'normal' && showPublicDataWarning && (_jsxs("div", { style: {
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
                }, children: [_jsx("h4", { style: { marginTop: 0, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 8, color: '#fde047' }, children: "\u26A0\uFE0F Public Data on Blockchain" }), _jsxs("p", { style: { fontSize: 13, margin: '0 0 12px 0', lineHeight: 1.5, opacity: 0.9 }, children: ["You are playing in ", _jsx("strong", { children: "Normal Mode" }), ". Your actions are recorded on a public blockchain and can be seen by anyone using a block explorer."] }), _jsxs("ul", { style: { fontSize: 13, paddingLeft: 20, margin: 0, listStyleType: '"- "' }, children: [_jsxs("li", { style: { marginBottom: 6 }, children: [_jsx("strong", { children: "Your Vote:" }), " Who you vote for is publicly visible."] }), _jsxs("li", { style: { marginBottom: 6 }, children: [_jsx("strong", { children: "Your Address:" }), " Your wallet address is linked to your in-game actions."] }), _jsxs("li", { children: [_jsx("strong", { children: "Timing:" }), " The exact time of your vote is recorded."] })] }), _jsxs("p", { style: { fontSize: 12, marginTop: 14, opacity: 0.7, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }, children: ["For a private game where your votes are encrypted, restart and choose ", _jsx("strong", { children: "FHE Mode" }), "."] }), _jsx("button", { onClick: () => setShowPublicDataWarning(false), style: { marginTop: 12, width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px', borderRadius: 6, cursor: 'pointer' }, children: "Close" })] })), transaction && (_jsxs("div", { style: {
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
                }, children: [_jsx("h4", { style: { marginTop: 0, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 8 }, children: "Transaction Tracker" }), _jsxs("div", { style: { fontSize: 13, wordBreak: 'break-all' }, children: [_jsxs("div", { style: { marginBottom: 8 }, children: [_jsx("strong", { children: "Status:" }), " ", _jsx("span", { style: { color: transaction.status === 'confirmed' ? '#4ade80' : transaction.status === 'pending' ? '#facc15' : '#f87171' }, children: transaction.status.toUpperCase() })] }), _jsxs("div", { children: [_jsx("strong", { children: "Hash:" }), " ", transaction.hash.slice(0, 10), "...", transaction.hash.slice(-8)] }), blockExplorerUrl && (_jsx("a", { href: `${blockExplorerUrl}/tx/${transaction.hash}`, target: "_blank", rel: "noopener noreferrer", style: { color: '#818cf8', textDecoration: 'underline', marginTop: 8, display: 'inline-block' }, children: "View on Explorer" }))] })] }))] }));
}
