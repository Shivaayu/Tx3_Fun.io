import { useEffect, useMemo, useState } from 'react'

const MODES = [
  { id: 'classic', name: 'Classic 3×3', desc: 'The original. Three in a row wins.', size: 3, target: 3, kind: 'standard', tag: 'CLASSIC' },
  { id: 'misere', name: 'Reverse', desc: 'Make a line and you lose.', size: 3, target: 3, kind: 'misere', tag: 'TWISTED' },
  { id: 'four', name: 'Grid 4×4', desc: 'Four marks in a row to win.', size: 4, target: 4, kind: 'standard', tag: 'STRATEGY' },
  { id: 'five', name: 'Grid 5×5', desc: 'Five marks in a row to win.', size: 5, target: 5, kind: 'standard', tag: 'BIG BOARD' },
  { id: 'sliding', name: 'Sliding 3', desc: 'Three marks each. Oldest mark moves out.', size: 3, target: 3, kind: 'sliding', tag: 'EXPERIMENTAL' }
]
const ACHIEVEMENTS = [
  { id: 'first', title: 'First Steps', desc: 'Finish your first match', reward: 50 },
  { id: 'five', title: 'Getting Serious', desc: 'Finish 5 matches', reward: 100 },
  { id: 'win3', title: 'On a Roll', desc: 'Win 3 matches', reward: 150 },
  { id: 'explorer', title: 'Mode Explorer', desc: 'Play 3 different modes', reward: 120 },
  { id: 'perfect', title: 'Clean Sweep', desc: 'Win without letting the opponent score', reward: 100 }
]
const SKINS = [
  { id: 'classic', name: 'Classic', price: 0, x: '#8be9fd', o: '#ff8a9b' },
  { id: 'sunset', name: 'Sunset', price: 180, x: '#ffb86c', o: '#ff79c6' },
  { id: 'toxic', name: 'Toxic', price: 260, x: '#b8f36b', o: '#c792ea' },
  { id: 'ice', name: 'Ice', price: 350, x: '#80d8ff', o: '#b39ddb' }
]
const fresh = { xp: 0, coins: 100, matches: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, unlocked: ['classic'], equipped: 'classic', achievements: [], modesPlayed: [], sound: true, theme: 'midnight' }
const readSave = () => { try { return { ...fresh, ...JSON.parse(localStorage.getItem('tttu-save') || '{}') } } catch { return fresh } }
const linesFor = (n, k) => {
  const lines = []
  for (let r=0;r<n;r++) for (let c=0;c<=n-k;c++) lines.push(Array.from({length:k},(_,i)=>r*n+c+i))
  for (let c=0;c<n;c++) for (let r=0;r<=n-k;r++) lines.push(Array.from({length:k},(_,i)=>(r+i)*n+c))
  for (let r=0;r<=n-k;r++) for (let c=0;c<=n-k;c++) lines.push(Array.from({length:k},(_,i)=>(r+i)*n+c+i))
  for (let r=0;r<=n-k;r++) for (let c=k-1;c<n;c++) lines.push(Array.from({length:k},(_,i)=>(r+i)*n+c-i))
  return lines
}
const resultOf = (board, mode) => {
  const win = linesFor(mode.size, mode.target).find(line => line.every(i => board[i] && board[i] === board[line[0]]))
  if (win) return { winner: mode.kind === 'misere' ? (board[win[0]] === 'X' ? 'O' : 'X') : board[win[0]], line: win }
  if (board.every(Boolean)) return { winner: 'draw', line: [] }
  return null
}
const bestClassicMove = (board, player='O') => {
  const score = (b, turn, depth) => {
    const res = resultOf(b, MODES[0])
    if (res) return res.winner === 'O' ? 10-depth : res.winner === 'X' ? depth-10 : 0
    let best = turn === 'O' ? -Infinity : Infinity
    for (let i=0;i<9;i++) if (!b[i]) {
      b[i]=turn
      const s=score(b, turn==='O'?'X':'O', depth+1)
      b[i]=null
      best=turn==='O'?Math.max(best,s):Math.min(best,s)
    }
    return best
  }
  let best=-Infinity, move=-1
  for(let i=0;i<9;i++) if(!board[i]) {
    board[i]='O'; const s=score(board,'X',0); board[i]=null
    if(s>best){best=s;move=i}
  }
  return move
}
function App() {
  const [profile,setProfile] = useState(readSave)
  const [page,setPage] = useState('home')
  const [modeId,setModeId] = useState('classic')
  const [opponent,setOpponent] = useState('ai')
  const [difficulty,setDifficulty] = useState('smart')
  const [board,setBoard] = useState(Array(9).fill(null))
  const [turn,setTurn] = useState('X')
  const [outcome,setOutcome] = useState(null)
  const [history,setHistory] = useState({X:[],O:[]})
  const [soundOn,setSoundOn] = useState(profile.sound)
  const [toast,setToast] = useState('')
  const [playerName,setPlayerName] = useState(localStorage.getItem('tttu-name') || 'Player One')
  const mode = MODES.find(m=>m.id===modeId) || MODES[0]
  const total = mode.size*mode.size
  const skin = SKINS.find(s=>s.id===profile.equipped) || SKINS[0]
  const [aiThinking,setAiThinking] = useState(false)

  useEffect(()=>{ localStorage.setItem('tttu-save',JSON.stringify(profile)) },[profile])
  useEffect(()=>{ document.documentElement.dataset.theme=profile.theme },[profile.theme])
  useEffect(()=>{ localStorage.setItem('tttu-name',playerName) },[playerName])
  const notify = (msg) => { setToast(msg); setTimeout(()=>setToast(''),2200) }
  const beep = (freq=520,duration=.07) => {
    if(!soundOn) return
    try { const ctx=new (window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.frequency.value=freq; osc.type='sine'; gain.gain.value=.045; osc.connect(gain); gain.connect(ctx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration); osc.stop(ctx.currentTime+duration); osc.onended=()=>ctx.close() } catch {}
  }
  const startGame = (id=modeId,opp=opponent) => {
    const m=MODES.find(x=>x.id===id)||MODES[0]
    setModeId(id); setOpponent(opp); setBoard(Array(m.size*m.size).fill(null)); setTurn('X'); setOutcome(null); setHistory({X:[],O:[]}); setPage('game'); setAiThinking(false)
  }
  const award = (result, boardBefore) => {
    const nextMatches=profile.matches+1
    const nextWins=profile.wins+(result.winner==='X'?1:0)
    const nextStreak=result.winner==='X'?profile.streak+1:0
    const base={...profile,matches:nextMatches,wins:nextWins,losses:profile.losses+(result.winner==='O'?1:0),draws:profile.draws+(result.winner==='draw'?1:0),streak:nextStreak,bestStreak:Math.max(profile.bestStreak,nextStreak),xp:profile.xp+ (result.winner==='X'?35:result.winner==='draw'?15:10),coins:profile.coins+(result.winner==='X'?25:result.winner==='draw'?10:5),modesPlayed:[...new Set([...profile.modesPlayed,modeId])]}
    const unlocked=[...base.achievements]
    const earned=[]
    const checks={first:nextMatches>=1,five:nextMatches>=5,win3:nextStreak>=3,explorer:base.modesPlayed.length>=3,perfect:result.winner==='X' && boardBefore.filter(v=>v==='O').length===0}
    for(const a of ACHIEVEMENTS) if(checks[a.id]&&!unlocked.includes(a.id)){unlocked.push(a.id);base.coins+=a.reward;earned.push(a.title)}
    base.achievements=unlocked
    setProfile(base)
    if(earned.length) notify('Achievement unlocked: '+earned.join(', '))
  }
  const playAt = (idx, isAI=false) => {
    if(board[idx]||outcome||aiThinking) return
    let next=[...board], hist={X:[...history.X],O:[...history.O]}
    if(mode.kind==='sliding') {
      hist[turn].push(idx)
      if(hist[turn].length>3){const old=hist[turn].shift();next[old]=null}
    }
    next[idx]=turn
    const res=resultOf(next,mode)
    setBoard(next); setHistory(hist); beep(turn==='X'?560:430)
    if(res){setOutcome(res);award(res,next);beep(res.winner==='X'?820:260,.22)}
    else setTurn(turn==='X'?'O':'X')
  }
  useEffect(()=>{
    if(page!=='game'||opponent!=='ai'||turn!=='O'||outcome) return
    setAiThinking(true)
    const timer=setTimeout(()=>{
      let move=-1
      if(modeId==='classic' && difficulty==='smart') move=bestClassicMove([...board])
      else {
        const empty=board.map((v,i)=>v?null:i).filter(v=>v!==null)
        const winTry=(mark)=>{for(const i of empty){const b=[...board];b[i]=mark;if(resultOf(b,mode))return i}return -1}
        move=winTry('O'); if(move<0)move=winTry('X')
        if(move<0) move=empty[Math.floor(Math.random()*empty.length)] ?? -1
      }
      if(move>=0) playAt(move,true)
      setAiThinking(false)
    },450)
    return ()=>clearTimeout(timer)
  },[page,opponent,turn,outcome,board,modeId,difficulty])
  const reset = () => {setBoard(Array(total).fill(null));setTurn('X');setOutcome(null);setHistory({X:[],O:[]});setAiThinking(false)}
  const themeNames={midnight:'Midnight',aurora:'Aurora',ember:'Ember',light:'Light'}
  const nav=[['home','⌂','Home'],['modes','▦','Game modes'],['challenges','✦','Challenges'],['rewards','◇','Rewards'],['profile','◎','Profile'],['settings','⚙','Settings']]
  const winLine=outcome?.line||[]
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">T<span>×</span></div><div><b>TTT UNIVERSE</b><small>A universe of strategy</small></div></div>
      <div className="nav-label">MENU</div>
      {nav.map(([id,icon,label])=><button key={id} className={'nav-item '+(page===id?'active':'')} onClick={()=>setPage(id)}><span>{icon}</span>{label}</button>)}
      <div className="sidebar-bottom"><div className="mini-profile"><div className="avatar">✦</div><div><b>{playerName}</b><small>Level {Math.floor(profile.xp/250)+1}</small></div></div><small className="muted">v0.1 · Early access</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">UNIVERSE <span>/</span> {page.toUpperCase()}</div><div className="top-actions"><div className="currency">◈ {profile.coins}</div><div className="level-pill">LVL {Math.floor(profile.xp/250)+1}</div><button className="icon-button" title="Settings" onClick={()=>setPage('settings')}>⚙</button></div></header>
      {page==='home' && <section className="content">
        <div className="hero"><div className="hero-copy"><div className="eyebrow"><span className="live-dot"></span> YOUR NEXT MOVE STARTS HERE</div><h1>Think ahead.<br/><em>Own the board.</em></h1><p>A familiar game. An entirely new universe. Challenge yourself, collect rewards and discover new ways to play.</p><button className="primary-btn" onClick={()=>startGame('classic','ai')}>▶ PLAY NOW <span>↗</span></button><button className="text-btn" onClick={()=>setPage('modes')}>Explore game modes →</button></div><div className="hero-art"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="hero-board">{['X','','O','','X','','O','','X'].map((v,i)=><div key={i} className={'hero-cell '+(v?v.toLowerCase():'')}>{v}</div>)}</div><div className="floating-chip chip-one">✦ STRATEGY</div><div className="floating-chip chip-two">3 IN A ROW</div></div></div>
        <div className="section-heading"><div><div className="eyebrow">PICK YOUR EXPERIENCE</div><h2>Game modes</h2></div><button className="text-btn" onClick={()=>setPage('modes')}>View all →</button></div>
        <div className="mode-grid">{MODES.slice(0,3).map((m,i)=><ModeCard key={m.id} mode={m} index={i} onClick={()=>startGame(m.id,'ai')}/>)}</div>
        <div className="dashboard-grid"><div className="panel"><div className="section-heading compact"><div><div className="eyebrow">YOUR JOURNEY</div><h2>Player progress</h2></div><span className="level-pill">LVL {Math.floor(profile.xp/250)+1}</span></div><div className="xp-row"><b>{profile.xp} XP</b><span>{250-profile.xp%250} XP to next level</span></div><div className="progress"><i style={{width:(profile.xp%250)/2.5+'%'}}/></div><div className="stat-row"><Stat label="Matches" value={profile.matches}/><Stat label="Wins" value={profile.wins}/><Stat label="Win rate" value={profile.matches?Math.round(profile.wins/profile.matches*100)+'%':'—'}/></div></div><div className="panel daily"><div className="eyebrow">DAILY FOCUS</div><h2>Make your mark.</h2><p>Play a match today and earn XP. Your next achievement is waiting.</p><button className="secondary-btn" onClick={()=>setPage('challenges')}>View challenges ↗</button></div></div>
      </section>}
      {page==='modes' && <section className="content"><PageTitle eyebrow="THE ARCADE" title="Choose your game" desc="Every board has a different story. Find your strategy."/><div className="mode-grid all-modes">{MODES.map((m,i)=><ModeCard key={m.id} mode={m} index={i} onClick={()=>{setModeId(m.id);setPage('setup')}}/>)}</div></section>}
      {page==='setup' && <section className="content narrow"><PageTitle eyebrow="MATCH CONFIGURATION" title="Set the rules" desc="Choose how you want to play."/><div className="panel setup-panel"><label>GAME MODE</label><select value={modeId} onChange={e=>setModeId(e.target.value)}>{MODES.map(m=><option value={m.id}>{m.name}</option>)}</select><label>OPPONENT</label><div className="choice-row"><button className={opponent==='ai'?'selected':''} onClick={()=>setOpponent('ai')}>◈ Computer</button><button className={opponent==='local'?'selected':''} onClick={()=>setOpponent('local')}>♟ Local friend</button></div>{opponent==='ai'&&<><label>AI LEVEL</label><div className="choice-row">{[['easy','Easy'],['smart','Smart'],['master','Master']].map(([id,n])=><button className={difficulty===id?'selected':''} onClick={()=>setDifficulty(id)}>{n}</button>)}</div></>}<button className="primary-btn full" onClick={()=>startGame(modeId,opponent)}>START MATCH ↗</button></div></section>}
      {page==='game' && <section className="content game-content"><div className="game-head"><div><div className="eyebrow">MATCH IN PROGRESS · {mode.tag}</div><h1>{mode.name}</h1><p>{opponent==='ai'?'You vs Universe AI':'Pass & play · Two players'}</p></div><button className="secondary-btn" onClick={()=>setPage('modes')}>Exit match</button></div><div className="game-layout"><div className="board-panel"><div className="players"><div className={'player-tag '+(turn==='X'&&!outcome?'current':'')}><span className="symbol x">X</span><div><b>{playerName}</b><small>PLAYER 1</small></div></div><div className="vs">VS</div><div className={'player-tag '+(turn==='O'&&!outcome?'current':'')}><span className="symbol o">O</span><div><b>{opponent==='ai'?'Universe AI':'Player Two'}</b><small>PLAYER 2</small></div></div></div><div className="board" style={{'--n':mode.size,'--x':skin.x,'--o':skin.o}}>{board.map((v,i)=><button key={i} className={'cell '+(v?v.toLowerCase():'')+(winLine.includes(i)?' winning':'')} onClick={()=>playAt(i)} disabled={!!v||!!outcome||aiThinking||(opponent==='ai'&&turn==='O')}>{v||<span className="cell-hover">+</span>}</button>)}</div>{outcome?<div className="result-banner"><b>{outcome.winner==='draw'?'IT’S A DRAW':outcome.winner==='X'?'VICTORY!':'MATCH OVER'}</b><span>{outcome.winner==='X'?'+35 XP · +25 coins':outcome.winner==='draw'?'+15 XP · +10 coins':'+10 XP · +5 coins'}</span><button className="primary-btn" onClick={reset}>PLAY AGAIN ↻</button></div>:<div className="turn-status">{aiThinking?'AI IS THINKING…':`${turn==='X'?playerName:opponent==='ai'?'UNIVERSE AI':'PLAYER TWO'}’S TURN`}<span className="live-dot"/></div>}</div><div className="game-side"><div className="panel"><div className="eyebrow">MATCH TOOLS</div><h3>Make it count.</h3><p>Take your time. Look for patterns, block threats and plan your next move.</p><button className="secondary-btn full" onClick={reset}>↻ Restart match</button><button className="secondary-btn full" onClick={()=>{setOpponent('local');notify('Local mode is selected for your next match.')}}>♟ Local play next</button></div><div className="panel"><div className="eyebrow">QUICK STATS</div><Stat label="Total wins" value={profile.wins}/><Stat label="Current streak" value={profile.streak}/><Stat label="Best streak" value={profile.bestStreak}/></div></div></div></section>}
      {page==='challenges' && <section className="content"><PageTitle eyebrow="QUEST BOARD" title="Challenges" desc="Small goals. Big brain energy."/><div className="challenge-grid">{[{name:'Warm-up round',desc:'Finish any match',xp:30,progress:profile.matches?1:0},{name:'Win something',desc:'Win your first match',xp:60,progress:profile.wins?1:0},{name:'Try something new',desc:'Play 3 different modes',xp:90,progress:Math.min(3,profile.modesPlayed.length),max:3},{name:'Keep the streak',desc:'Reach a 3-win streak',xp:100,progress:Math.min(3,profile.bestStreak),max:3}].map(c=><div className="panel challenge"><div className="challenge-icon">✦</div><div><h3>{c.name}</h3><p>{c.desc}</p><div className="progress"><i style={{width:((c.progress||0)/(c.max||1))*100+'%'}}/></div><small>{c.progress||0}/{c.max||1} complete</small></div><b>+{c.xp} XP</b></div>)}</div><p className="muted note">Challenge progress is tracked locally in this early build. Claimable daily and weekly rewards are planned for a later phase.</p></section>}
      {page==='rewards' && <section className="content"><PageTitle eyebrow="THE COLLECTION" title="Rewards & skins" desc="Earn coins through matches and personalize your board."/><div className="wallet panel"><span>YOUR BALANCE</span><strong>◈ {profile.coins}</strong><small>Earn coins by playing matches and unlocking achievements.</small></div><div className="skin-grid">{SKINS.map(s=><div className="panel skin-card"><div className="skin-preview" style={{'--x':s.x,'--o':s.o}}><span>X</span><span>O</span><span>X</span><span>O</span></div><h3>{s.name}</h3><p>{s.id===profile.equipped?'Currently equipped':profile.unlocked.includes(s.id)?'Unlocked':`◈ ${s.price}`}</p><button className={profile.equipped===s.id?'secondary-btn':'primary-btn'} onClick={()=>{if(profile.unlocked.includes(s.id)){setProfile(p=>({...p,equipped:s.id}));notify('Skin equipped')}else if(profile.coins>=s.price){setProfile(p=>({...p,coins:p.coins-s.price,unlocked:[...p.unlocked,s.id],equipped:s.id}));notify('New skin unlocked!')}else notify('Not enough coins yet')}}>{profile.equipped===s.id?'EQUIPPED':profile.unlocked.includes(s.id)?'EQUIP':'UNLOCK'}</button></div>)}</div><div className="section-heading"><div><div className="eyebrow">MILESTONES</div><h2>Achievements</h2></div></div><div className="achievement-grid">{ACHIEVEMENTS.map(a=><div className={'panel achievement '+(profile.achievements.includes(a.id)?'earned':'')}><div className="achievement-medal">{profile.achievements.includes(a.id)?'✦':'◇'}</div><div><b>{a.title}</b><p>{a.desc}</p><small>{profile.achievements.includes(a.id)?'UNLOCKED':`REWARD · ${a.reward} COINS`}</small></div></div>)}</div></section>}
      {page==='profile' && <section className="content narrow"><PageTitle eyebrow="PLAYER IDENTITY" title="Your profile" desc="Your journey, your record."/><div className="panel profile-card"><div className="profile-avatar">✦</div><input value={playerName} maxLength={18} onChange={e=>setPlayerName(e.target.value)} aria-label="Player name"/><div className="level-pill">LEVEL {Math.floor(profile.xp/250)+1}</div><div className="progress"><i style={{width:(profile.xp%250)/2.5+'%'}}/></div><span className="muted">{profile.xp} total XP</span></div><div className="stats-grid">{[['Matches',profile.matches],['Wins',profile.wins],['Losses',profile.losses],['Draws',profile.draws],['Best streak',profile.bestStreak],['Win rate',profile.matches?Math.round(profile.wins/profile.matches*100)+'%':'—']].map(([l,v])=><div className="panel stat-card"><small>{l}</small><strong>{v}</strong></div>)}</div><button className="secondary-btn" onClick={()=>{if(confirm('Reset all local progress? This cannot be undone.')){localStorage.removeItem('tttu-save');setProfile(fresh);notify('Local progress reset')}}}>Reset local progress</button></section>}
      {page==='settings' && <section className="content narrow"><PageTitle eyebrow="PREFERENCES" title="Settings" desc="Make the universe feel like yours."/><div className="panel settings-panel"><label>APPEARANCE</label><div className="theme-grid">{[['midnight','Midnight'],['aurora','Aurora'],['ember','Ember'],['light','Light']].map(([id,n])=><button className={'theme-choice '+(profile.theme===id?'selected':'')} onClick={()=>setProfile(p=>({...p,theme:id}))}><span className={'theme-swatch '+id}/>{n}</button>)}</div><label>AUDIO</label><div className="setting-row"><div><b>Sound effects</b><small>Button and game feedback sounds</small></div><button className={'toggle '+(soundOn?'on':'')} onClick={()=>{setSoundOn(v=>!v);setProfile(p=>({...p,sound:!soundOn}))}}>{soundOn?'ON':'OFF'}</button></div><label>DATA</label><div className="setting-row"><div><b>Local save</b><small>Your progress is stored in this browser.</small></div><span className="status-ok">● ACTIVE</span></div><p className="muted note">Online accounts, cloud sync, ranked matchmaking and cross-device saves will be connected in a later development phase.</p></div></section>}
      {toast&&<div className="toast">✦ {toast}</div>}
      <footer>TTT UNIVERSE <span>·</span> BUILT FOR THE LOVE OF THE GAME <span>·</span> v0.1</footer>
    </main>
  </div>
}
function PageTitle({eyebrow,title,desc}){return <div className="page-title"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{desc}</p></div>}
function ModeCard({mode,index,onClick}){return <button className="mode-card" onClick={onClick}><div className={'mode-art art-'+index}><div className="mini-grid">{Array.from({length:mode.size===5?9:9},(_,i)=><span className={i%4===0?'lit':''}>{i%4===0?'X':i%5===0?'O':''}</span>)}</div><span className="mode-tag">{mode.tag}</span></div><div className="mode-info"><h3>{mode.name}</h3><p>{mode.desc}</p><span>PLAY MODE ↗</span></div></button>}
function Stat({label,value}){return <div className="stat"><small>{label}</small><b>{value}</b></div>}
