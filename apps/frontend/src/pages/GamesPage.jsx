import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  Building2, HelpCircle, ClipboardList, BarChart3, FileText, Sparkles,
  Puzzle, Image, Search, Droplets, Keyboard, Wrench, Calculator,
  Route, Grid3x3, Snail, ShoppingBasket, Zap, Target, Bird, CircleDot,
  Gamepad2, Trophy, Brain, Flag, Boxes, Dices, Layers, TowerControl,
  Bomb, Shuffle, Scissors, Hand, Hammer, Building, Squircle, Rocket,
  ArrowRight, Frown, Volume2, CircleX, Crown, Car, Crosshair, Box, Copy, Trash2, Stethoscope
} from 'lucide-react'
import api from '../api'
import { useTheme } from './ThemeContext'
import { useAuth } from '../context/AuthContext'

const FONT_URL = `https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,300;9..144,600&display=swap`

const CATEGORY_META = {
  quiz:      { label:'Quiz',          bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#818CF8', icon:'🧠', desc:'Test knowledge with questions' },
  survey:    { label:'Survey',        bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)', dot:'#4ADE80', icon:'📋', desc:'Collect feedback & opinions' },
  poll:      { label:'Poll',          bg:'var(--chip-orange-bg)', fg:'var(--chip-orange-fg)', dot:'#FB923C', icon:'📊', desc:'Quick audience polls' },
  registration:{ label:'Registration',bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)', dot:'#22C55E', icon:'📝', desc:'Collect user registrations' },
  crossword: { label:'Crossword',     bg:'var(--chip-rose-bg)', fg:'var(--chip-rose-fg)', dot:'#EC4899', icon:'🔤', desc:'Word grid puzzle' },
  spin:      { label:'Spin Wheel',    bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)', dot:'#F59E0B', icon:'🎡', desc:'Spin to win prizes' },
  memory:    { label:'Memory Match',  bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#A78BFA', icon:'🃏', desc:'Match pairs of cards' },
  jigsaw:    { label:'Jigsaw Puzzle', bg:'var(--chip-rose-bg)', fg:'var(--chip-rose-fg)', dot:'#FB7185', icon:'🧩', desc:'Drag-drop image puzzle' },
  wordsearch:{ label:'Word Search',   bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)', dot:'#F59E0B', icon:'🔍', desc:'Find hidden words in grid' },
  pouring:   { label:'Pouring Water', bg:'var(--chip-blue-bg)', fg:'var(--chip-blue-fg)', dot:'#3B82F6', icon:'💧', desc:'Pour exact amount challenge' },
  typer:     { label:'Speed Typer',   bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)', dot:'#22C55E', icon:'⌨️', desc:'Type falling words fast' },
  screw:     { label:'Screw & Reveal',bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)', dot:'#D97706', icon:'🔩', desc:'Unscrew blocks to reveal' },
  math:      { label:'Math Game',     bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)', dot:'#22C55E', icon:'🔢', desc:'Solve math questions' },
  maze:      { label:'Maze Game',     bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#6366F1', icon:'🌀', desc:'Navigate the maze' },
  '2048':    { label:'2048',           bg:'var(--chip-orange-bg)', fg:'var(--chip-orange-fg)', dot:'#FB923C', icon:'🔢', desc:'Merge tiles to reach 2048' },
  snake:     { label:'Snake',          bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)', dot:'#22C55E', icon:'🐍', desc:'Classic snake game' },
  nagaraja:  { label:'Nagaraja',       bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#8B5CF6', icon:'🐍', desc:'Slither-style snake — eat gifts, dodge AI snakes' },
  catch:     { label:'Catch',          bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#A78BFA', icon:'🧺', desc:'Catch falling objects' },
  reaction:  { label:'Reaction',       bg:'var(--chip-rose-bg)', fg:'var(--chip-rose-fg)', dot:'#EC4899', icon:'⚡', desc:'Test reaction speed' },
  simon:     { label:'Simon Says',     bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#818CF8', icon:'🎯', desc:'Repeat the color sequence' },
  flappy:    { label:'Flappy Bird',    bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)', dot:'#F59E0B', icon:'🐦', desc:'Fly through the pipes' },
  bounce:    { label:'Bounce Ball',    bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)', dot:'#22C55E', icon:'🏀', desc:'Bounce ball through levels' },
  space:     { label:'Space Fighter',  bg:'var(--chip-blue-bg)', fg:'var(--chip-blue-fg)', dot:'#0EA5E9', icon:'🚀', desc:'Shoot enemies in space' },
  connect4:  { label:'Connect 4',      bg:'var(--chip-blue-bg)', fg:'var(--chip-blue-fg)', dot:'#3B82F6', icon:'🔴', desc:'Connect 4 in a row to win' },
  bejeweled: { label:'Bejeweled',      bg:'var(--chip-rose-bg)', fg:'var(--chip-rose-fg)', dot:'#EC4899', icon:'💎', desc:'Match gems in a grid' },
  tetris:    { label:'Tetris',         bg:'var(--chip-cyan-bg)', fg:'var(--chip-cyan-fg)', dot:'#00f0f0', icon:'🧱', desc:'Classic block-stacking puzzle' },
  stack:     { label:'Stack',          bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#818CF8', icon:'📦', desc:'Stack blocks as high as you can' },
  tower:     { label:'Tower',          bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)', dot:'#F59E0B', icon:'🗼', desc:'Build the tower block by block' },
  bowling:   { label:'Bowling',        bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)', dot:'#F59E0B', icon:'🎳', desc:'Roll strikes and spares' },
  sudoku:    { label:'Sudoku',         bg:'var(--chip-blue-bg)', fg:'var(--chip-blue-fg)', dot:'#3B82F6', icon:'🔢', desc:'Fill the grid with numbers' },
  minesweeper:{ label:'Minesweeper',   bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)', dot:'#22C55E', icon:'💣', desc:'Find all safe cells' },
  wordscramble:{ label:'Word Scramble', bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#8B5CF6', icon:'🔤', desc:'Unscramble the letters' },
  rps:       { label:'Rock Paper Scissors', bg:'var(--chip-red-bg)', fg:'var(--chip-red-fg)', dot:'#EF4444', icon:'✊', desc:'Beat the AI in RPS' },
  whackamole:{ label:'Whack a Mole',       bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)', dot:'#F59E0B', icon:'🔨', desc:'Whack moles in the grid' },
  hanoi:     { label:'Hanoi Tower',        bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#A78BFA', icon:'🗼', desc:'Move disks between pegs' },
  breakout:  { label:'Breakout',           bg:'var(--chip-rose-bg)', fg:'var(--chip-rose-fg)', dot:'#f43f5e', icon:'🧱', desc:'Break bricks with a ball' },
  bubbleshooter:{ label:'Bubble Shooter',  bg:'var(--chip-cyan-bg)', fg:'var(--chip-cyan-fg)', dot:'#06B6D4', icon:'🫧', desc:'Pop matching bubbles' },
  carlaunch:   { label:'Car Launch',       bg:'var(--chip-red-bg)', fg:'var(--chip-red-fg)', dot:'#ef4444', icon:'🏎️', desc:'3D car configurator + drag race' },
  arrowescape:{ label:'Arrow Escape',    bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)', dot:'#F59E0B', icon:'➡️', desc:'Guide arrows through mazes' },
  stressbuster:{ label:'Stress Buster',  bg:'var(--chip-red-bg)', fg:'var(--chip-red-fg)', dot:'#F87171', icon:'😤', desc:'Click-based stress relief game' },
  soundify:    { label:'Soundify',       bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#A78BFA', icon:'🔊', desc:'Sound-based interactive quiz' },
  tictactoe:   { label:'Tic Tac Toe',    bg:'var(--chip-blue-bg)', fg:'var(--chip-blue-fg)', dot:'#3B82F6', icon:'❌', desc:'Classic noughts and crosses' },
  chess:      { label:'Chess',          bg:'var(--chip-neutral-bg)', fg:'var(--chip-neutral-fg)', dot:'#6B7280', icon:'♟️', desc:'Two-player online chess' },
  blockblaster:{ label:'Block Blaster',  bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#8B5CF6', icon:'💥', desc:'Explosive block-clearing puzzle' },
  candyblast: { label:'Candy Blast',     bg:'var(--chip-rose-bg)', fg:'var(--chip-rose-fg)', dot:'#EC4899', icon:'🍬', desc:'Match and blast candy combos' },
  Carrom:      { label:'Carrom',          bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)', dot:'#F59E0B', icon:'🎯', desc:'Classic carrom board game' },
  classicmaze:{ label:'Classic Maze',    bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)', dot:'#22C55E', icon:'🏰', desc:'Navigate through the maze' },
  stickmaze: { label:'Stick Maze',       bg:'var(--chip-rose-bg)', fg:'var(--chip-rose-fg)', dot:'#EC4899', icon:'🪵', desc:'Navigate through the stick maze' },
  ludo:       { label:'Ludo',            bg:'var(--chip-blue-bg)', fg:'var(--chip-blue-fg)', dot:'#3B82F6', icon:'🎲', desc:'Classic Ludo board game' },
  snakeandladder:{ label:'Snake & Ladder', bg:'var(--chip-cyan-bg)', fg:'var(--chip-cyan-fg)', dot:'#06B6D4', icon:'🪜', desc:'Roll dice, climb the ladder' },
  tictactoemultiplayer:{ label:'Tic Tac Toe (Multi)', bg:'var(--chip-blue-bg)', fg:'var(--chip-blue-fg)', dot:'#3B82F6', icon:'🎮', desc:'Multiplayer noughts and crosses' },
  spotregistration: { label:'Spot Registration', bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)', dot:'#0EA5E9', icon:'🩺', desc:'QR-gated camp station data collection' },
}
const catMeta = (cat) => CATEGORY_META[cat] || { label: cat, bg:'var(--chip-neutral-bg)', fg:'var(--chip-neutral-fg)', dot:'var(--text3)' }

const CATEGORY_ICON = {
  quiz:'HelpCircle', survey:'ClipboardList', poll:'BarChart3', registration:'FileText',
  crossword:'Grid3x3', spin:'Sparkles', memory:'Puzzle', jigsaw:'Image', wordsearch:'Search',
  pouring:'Droplets', typer:'Keyboard', screw:'Wrench',   math:'Calculator', maze:'Route',
  '2048':'Grid3x3',   snake:'Snail', nagaraja:'Snail', catch:'ShoppingBasket', reaction:'Zap', simon:'Target',
  flappy:'Bird', bounce:'CircleDot', space:'Rocket', connect4:'CircleDot',   bejeweled:'Sparkles',
  tetris:'Layers', stack:'Layers', tower:'TowerControl', bowling:'Building', sudoku:'Grid3x3', minesweeper:'Bomb',
  wordscramble:'Shuffle', rps:'Hand', whackamole:'Hammer', hanoi:'TowerControl', breakout:'Boxes',
  bubbleshooter:'CircleDot', carlaunch:'Car', arrowescape:'ArrowRight', stressbuster:'Frown',
  soundify:'Volume2', tictactoe:'CircleX', chess:'Crown',
  spotregistration:'Stethoscope',
}
const ICONS = { HelpCircle, ClipboardList, BarChart3, FileText, Grid3x3, Sparkles, Puzzle, Image,
  Search, Droplets, Keyboard, Wrench, Calculator, Route, Snail, ShoppingBasket, Zap, Target, Bird,
  CircleDot, Rocket, Building, Layers, Bomb, Shuffle, Hand, Hammer, TowerControl, Boxes,
  CircleX, Crown, Car, ArrowRight, Frown, Volume2, Stethoscope }
const catIcon = (cat) => ICONS[CATEGORY_ICON[cat]] || Gamepad2
const catIconEl = (cat) => { const I = catIcon(cat); return <I size={11} strokeWidth={2.4} /> }

const CSS = `
@import url('${FONT_URL}');
.gp *,.gp *::before,.gp *::after{box-sizing:border-box;margin:0;padding:0}
.gp *::-webkit-scrollbar{display:none}
.gp *{-ms-overflow-style:none;scrollbar-width:none}
@media(max-width:820px){.gp [style*="column-count:4"]{column-count:3!important}}
@media(max-width:600px){.gp [style*="column-count:4"]{column-count:2!important}}
@media(max-width:440px){.gp [style*="column-count:4"]{column-count:1!important}}
.gp{font-family:'DM Sans',sans-serif;color: var(--text);background: var(--bg-secondary);min-height:100vh}
@keyframes gpFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes gpModalIn{from{opacity:0;transform:scale(0.96)translateY(6px)}to{opacity:1;transform:none}}
@keyframes gpToastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes gpSpin{to{transform:rotate(360deg)}}
@keyframes gpPulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes gpRowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* Inputs & selects */
.gp-input{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid  var(--border);font-size:14px;font-family:'DM Sans',sans-serif;color: var(--text);background: var(--surface2);outline:none;transition:border-color .15s,background .15s}
.gp-input:focus{border-color: var(--primary);background: var(--surface)}
.gp-select{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid  var(--border);font-size:14px;font-family:'DM Sans',sans-serif;color: var(--text);background: var(--surface2);outline:none;appearance:none;cursor:pointer;transition:border-color .15s}
.gp-select:focus{border-color: var(--primary)}
.gp-label{display:block;font-size:10.5px;font-weight:700;color: var(--text3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:6px}
.gp-field{margin-bottom:16px}

/* Buttons */
.gp-primary-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;border:none;background: var(--primary);color:#fff;font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;letter-spacing:.01em;transition:background .14s,transform .1s}
.gp-primary-btn:hover{background: var(--primary-hover)}
.gp-primary-btn:active{transform:scale(.98)}
.gp-primary-btn:disabled{opacity:.55;cursor:not-allowed}
.gp-ghost-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1.5px solid  var(--border);background: var(--surface);color: var(--text);font-size:12px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:background .13s,border-color .13s;white-space:nowrap}
.gp-ghost-btn:hover{background: var(--border-light);border-color: var(--border-light)}
.gp-icon-btn{width:30px;height:30px;border-radius:7px;border:1.5px solid  var(--border);background: var(--surface2);display:flex;align-items:center;justify-content:center;cursor:pointer;color: var(--text);transition:background .13s;flex-shrink:0}
.gp-icon-btn:hover{background: var(--border-light)}
.gp-icon-btn.del{border-color: var(--error-border);background: var(--error-bg);color: var(--error)}
.gp-icon-btn.del:hover{background: var(--error-border)}

/* Toggle */
.gp-toggle{width:34px;height:20px;border-radius:100px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;padding:0}
.gp-toggle::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background: var(--surface);transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.gp-toggle.on{background: var(--primary)}
.gp-toggle.on::after{transform:translateX(14px)}
.gp-toggle.off{background: var(--border-light)}

/* Table */
.gp-table-wrap{background: var(--surface);border-radius:16px;border:1.5px solid  var(--border);overflow:hidden;animation:gpFadeUp .3s ease both}
.gp-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif}
.gp-table thead tr{background: var(--surface2);border-bottom:1.5px solid  var(--border)}
.gp-table thead th{padding:11px 14px;text-align:center;font-size:11px;font-weight:700;color: var(--text2);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;user-select:none}
.gp-table tbody tr{border-bottom:1px solid  var(--border-light);transition:background .13s;animation:gpRowIn .25s ease both}
.gp-table tbody tr:last-child{border-bottom:none}
.gp-table tbody tr:hover{background: var(--surface2)}
.gp-table tbody tr.inactive-row{opacity:.7}
.gp-table tbody td{padding:13px 14px;font-size:13px;color: var(--text);vertical-align:middle;text-align:center}

/* Sort caret */
.gp-th-btn{background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color: var(--text2);text-transform:uppercase;letter-spacing:.08em;padding:0;font-family:'DM Sans',sans-serif}
.gp-th-btn:hover{color: var(--text)}

/* Tooltip toggle label */
.gp-toggle-wrap{display:flex;flex-direction:column;align-items:center;gap:3px}
.gp-toggle-label{font-size:10px;color: var(--text3);font-weight:500;white-space:nowrap}
`

const Ico = {
  plus:     () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  close:    () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>,
  search:   () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  wrench:   () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  chart:    () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  link:     () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  trash:    () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  question: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>,
  play:     () => <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  spin:     () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{animation:'gpSpin .75s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  globe:    () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  star:     () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  caretUp:  () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>,
  caretDn:  () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>,
  copy:     () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  qr:       () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="4" height="4"/><line x1="3" y1="18" x2="3" y2="21"/><line x1="7" y1="21" x2="7" y2="21"/><line x1="18" y1="14" x2="21" y2="14"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="18" y2="21"/><line x1="14" y1="21" x2="14" y2="21"/></svg>,
  download: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  const ok = type === 'success'
  return (
    <div style={{
      position:'fixed',bottom:28,right:28,zIndex:9999,
      background: ok ? ' #052E16' : ' #450A0A', color:' var(--surface)',
      padding:'13px 20px 13px 16px',borderRadius:12,fontSize:13.5,
      fontFamily:"'DM Sans',sans-serif",fontWeight:500,
      display:'flex',alignItems:'center',gap:10,
      boxShadow:'0 8px 32px rgba(0,0,0,.24)',
      borderLeft:`3px solid ${ok?' #22C55E':' #EF4444'}`,
      animation:'gpToastIn .28s cubic-bezier(.34,1.56,.64,1)',maxWidth:420,
    }}>
      {ok?'✓':'✕'} {msg}
    </div>
  )
}

// Inline toggle that calls API immediately
function FieldToggle({ gameId, field, value, label, onUpdated, onError }) {
  const [loading, setLoading] = useState(false)
  const toggle = async e => {
    e.stopPropagation()
    setLoading(true)
    try {
      await api.put(`/games/${gameId}`, { [field]: value ? 0 : 1 })
      onUpdated()
    } catch { onError('Failed to update') }
    finally { setLoading(false) }
  }
  return (
    <div className="gp-toggle-wrap">
      <button
        className={`gp-toggle ${value ? 'on' : 'off'}`}
        onClick={toggle}
        disabled={loading}
        title={`${value ? 'Disable' : 'Enable'} ${label}`}
        style={loading ? { opacity: 0.5 } : {}}
      />
      <span className="gp-toggle-label">{value ? 'On' : 'Off'}</span>
    </div>
  )
}

function QRCodeModal({ game, onClose, onError }) {
  const { isDark } = useTheme()
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrError, setQrError] = useState('')
  const host = typeof window !== 'undefined' ? window.location.origin : ''

  const handleClose = () => onClose?.()

  useEffect(() => {
    if (!game) {
      return
    }

    const slug = game.slug || ''
    const client_slug = game.client_slug || ''
    const isSpotReg = game.category === 'spotregistration'
    const base = isSpotReg ? '/play/spotreg' : '/play'
    const link = client_slug ? `${host}${base}/${slug}/${client_slug}` : `${host}${base}/${slug}`

    console.log('[QRCode] Generating QR for:', link, 'game:', slug, client_slug)

    if (!slug) {
      setQrError('Missing slug')
      onError?.('Missing slug')
      return
    }

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#1a1a2e'

    QRCode.toDataURL(link, {
      width: 260,
      margin: 2,
      color: { dark: textColor, light: '#FFFFFF' }
    })
      .then(setQrDataUrl)
      .catch((err) => {
        console.error('[QRCode] Failed to generate', err)
        setQrError('Failed to generate QR')
        onError?.('Failed to generate QR')
      })
  }, [game])

  const handleCopyQr = async () => {
    if (!qrDataUrl) return
    try {
      const res = await fetch(qrDataUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } catch {
      onError?.('Failed to copy QR image')
    }
  }

  const handleCopyLink = () => {
    const slug = game?.slug || ''
    const client_slug = game?.client_slug || ''
    const isSpotReg = game?.category === 'spotregistration'
    const base = isSpotReg ? '/play/spotreg' : '/play'
    const link = client_slug ? `${host}${base}/${slug}/${client_slug}` : `${host}${base}/${slug}`
    navigator.clipboard.writeText(link)
  }

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = game.name?.replace(/ /g, '-') + '-qr.png' || 'qr.png'
    a.click()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(8,8,18,.48)', backdropFilter: 'blur(5px)' }} onClick={handleClose}>
      <div style={{ position: 'relative', background: 'var(--surface)', borderRadius: 24, width: '100%', maxWidth: 400, padding: '34px 28px 28px', boxShadow: '0 24px 64px rgba(0,0,0,.22)', animation: 'gpModalIn .22s cubic-bezier(.22,1,.36,1)', fontFamily: "'DM Sans',sans-serif", textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <button className="gp-icon-btn" onClick={handleClose} style={{ position: 'absolute', top: 14, right: 14 }}><Ico.close /></button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
          <img src={isDark ? '/favicon2.png' : '/favicon3.png'} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{game.company_name || ''}</span>
        </div>
        {qrError ? (
          <div style={{ width: 200, height: 200, borderRadius: 16, margin: '0 auto 20px', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 14, padding: 12 }}>
            QR Error: {qrError}
          </div>
        ) : qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 16, margin: '0 auto 20px', display: 'block', padding: 12, background: 'var(--surface2)', border: '1px solid var(--border)' }} />
        ) : (
          <div style={{ width: 200, height: 200, borderRadius: 16, margin: '0 auto 20px', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}><Ico.spin /></div>
        )}
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{game.name || ''}</p>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 24, wordBreak: 'break-all' }}>{game.client_slug ? `${host}/play/${game.slug || ''}/${game.client_slug}` : `${host}/play/${game.slug || ''}`}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="gp-primary-btn" onClick={handleCopyQr} disabled={!qrDataUrl} style={{ justifyContent: 'center', padding: '11px 0', borderRadius: 10, fontSize: 13.5 }}><Ico.copy /> Copy QR Image</button>
          <button className="gp-ghost-btn" onClick={handleCopyLink} style={{ justifyContent: 'center', padding: '10px 0', borderRadius: 10, fontSize: 13 }}><Ico.link /> Copy Game Link</button>
        </div>
      </div>
    </div>
  )
}

function QuickAddClientModal({ onClose, onCreated, onError }) {
  const [form, setForm] = useState({company_name:'',contact_name:'',email:'',phone:''})
  const [submitting, setSubmitting] = useState(false)
  const set = k => e => setForm(f => ({...f,[k]:e.target.value}))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.company_name) return
    setSubmitting(true)
    try {
      const res = await api.post('/clients', form)
      onCreated(res.data.client)
      onClose()
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to create client')
      setSubmitting(false)
    }
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:700,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(8,8,18,.48)',backdropFilter:'blur(5px)'}}>
      <div style={{background:' var(--surface)',borderRadius:20,width:'100%',maxWidth:480,padding:'34px 30px',boxShadow:'0 24px 64px rgba(0,0,0,.22)',animation:'gpModalIn .22s cubic-bezier(.22,1,.36,1)',fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
          <div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:20,color:' var(--text)',letterSpacing:'-0.02em'}}>Add Client</h2>
            <p style={{color:' var(--text3)',fontSize:13,marginTop:4}}>Create a client to associate this game with.</p>
          </div>
          <button className="gp-icon-btn" onClick={onClose}><Ico.close/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="gp-field">
            <label className="gp-label">Company Name <span style={{color:' #EF4444'}}>*</span></label>
            <input className="gp-input" value={form.company_name} onChange={set('company_name')} placeholder="e.g. Acme Corp" required />
          </div>
          <div className="gp-field">
            <label className="gp-label">Contact Name</label>
            <input className="gp-input" value={form.contact_name} onChange={set('contact_name')} placeholder="Full name" />
          </div>
          <div className="gp-field">
            <label className="gp-label">Email</label>
            <input className="gp-input" type="email" value={form.email} onChange={set('email')} placeholder="contact@acme.com" />
          </div>
          <div className="gp-field" style={{marginBottom:26}}>
            <label className="gp-label">Phone</label>
            <input className="gp-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </div>
          <div style={{display:'flex',gap:10}}>
            <button type="button" className="gp-ghost-btn" onClick={onClose} style={{flex:1,justifyContent:'center',padding:'11px 0'}}>Cancel</button>
            <button type="submit" className="gp-primary-btn" disabled={submitting} style={{flex:2,justifyContent:'center',padding:'12px 0',borderRadius:10,fontSize:14}}>
              {submitting ? <><Ico.spin/> Adding…</> : 'Add Client & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateModal({ clients, onClose, onCreated, onError, onAddClient }) {
  const { isDark } = useTheme()
  const [form, setForm] = useState({client_id:'',name:'',category:'quiz',description:'',redirect_url:''})
  const [submitting, setSubmitting] = useState(false)
  const [gameTypeSearch, setGameTypeSearch] = useState('')
  const navigate = useNavigate()
  const set = k => e => setForm(f => ({...f,[k]:e.target.value}))

const handleSubmit = async e => {
  e.preventDefault()
  setSubmitting(true)

  try {
    const res = await api.post('/games', form)

    const game = res.data.game

    onCreated()
    onClose()

    if (game.category === 'crossword') {
      navigate(`/dashboard/games/${game.id}/crossword-builder`)
    } else if (game.category === 'spin') {
      navigate(`/dashboard/games/${game.id}/spin-builder`)
    } else if (game.category === 'memory') {
      navigate(`/dashboard/games/${game.id}/memory-builder`)
    } else if (game.category === 'jigsaw') {
      navigate(`/dashboard/games/${game.id}/jigsaw-builder`)
    } else if (game.category === 'wordsearch') {
      navigate(`/dashboard/games/${game.id}/wordsearch-builder`)
    } else if (game.category === 'pouring') {
      navigate(`/dashboard/games/${game.id}/pouring-builder`)
    } else if (game.category === 'typer') {
      navigate(`/dashboard/games/${game.id}/typer-builder`)
    } else if (game.category === 'math') {
      navigate(`/dashboard/games/${game.id}/math-builder`)
    } else if (game.category === 'maze') {
      navigate(`/dashboard/games/${game.id}/stickmaze-builder`)
    } else if (game.category === 'screw') {
      navigate(`/dashboard/games/${game.id}/screw-builder`)
    } else if (game.category === 'tower') {
      navigate(`/dashboard/games/${game.id}/tower-builder`)
    } else if (game.category === '2048') {
      navigate(`/dashboard/games/${game.id}/2048-builder`)
    } else if (game.category === 'snake') {
      navigate(`/dashboard/games/${game.id}/snake-builder`)
    } else if (game.category === 'nagaraja') {
      navigate(`/dashboard/games/${game.id}/nagaraja-builder`)
    } else if (game.category === 'catch') {
      navigate(`/dashboard/games/${game.id}/catch-builder`)
    } else if (game.category === 'reaction') {
      navigate(`/dashboard/games/${game.id}/reaction-builder`)
    } else if (game.category === 'simon') {
      navigate(`/dashboard/games/${game.id}/simon-builder`)
    } else if (game.category === 'flappy') {
      navigate(`/dashboard/games/${game.id}/flappy-builder`)
    } else if (game.category === 'bounce') {
      navigate(`/dashboard/games/${game.id}/bounce-builder`)
    } else if (game.category === 'space') {
      navigate(`/dashboard/games/${game.id}/space-builder`)
    } else if (game.category === 'connect4') {
      navigate(`/dashboard/games/${game.id}/connect4-builder`)
    } else if (game.category === 'bowling') {
      navigate(`/dashboard/games/${game.id}/bowling-builder`)
    } else if (game.category === 'sudoku') {
      navigate(`/dashboard/games/${game.id}/sudoku-builder`)
    } else if (game.category === 'minesweeper') {
      navigate(`/dashboard/games/${game.id}/minesweeper-builder`)
    } else if (game.category === 'wordscramble') {
      navigate(`/dashboard/games/${game.id}/wordscramble-builder`)
    } else if (game.category === 'rps') {
      navigate(`/dashboard/games/${game.id}/rps-builder`)
    } else if (game.category === 'arrowescape') {
      navigate(`/dashboard/games/${game.id}/arrowescape-builder`)
    } else if (game.category === 'bejeweled') {
      navigate(`/dashboard/games/${game.id}/bejeweled-builder`)
    } else if (game.category === 'tetris') {
      navigate(`/dashboard/games/${game.id}/tetris-builder`)
    } else if (game.category === 'stack') {
      navigate(`/dashboard/games/${game.id}/stack-builder`)
    } else if (game.category === 'whackamole') {
      navigate(`/dashboard/games/${game.id}/whackamole-builder`)
    } else if (game.category === 'hanoi') {
      navigate(`/dashboard/games/${game.id}/hanoi-builder`)
    } else if (game.category === 'breakout') {
      navigate(`/dashboard/games/${game.id}/breakout-builder`)
    } else if (game.category === 'bubbleshooter') {
      navigate(`/dashboard/games/${game.id}/bubbleshooter-builder`)
    } else if (game.category === 'carlaunch') {
      navigate(`/dashboard/games/${game.id}/carlaunch-builder`)
    } else if (game.category === 'frustration' || game.category === 'stressbuster') {
      navigate(`/dashboard/games/${game.id}/frustration-builder`)
    } else if (game.category === 'soundify') {
      navigate(`/dashboard/games/${game.id}/soundify-builder`)
    } else if (game.category === 'tictactoe') {
      navigate(`/dashboard/games/${game.id}/tictactoe-builder`)
    } else if (game.category === 'chess') {
      navigate(`/dashboard/games/${game.id}/chess-builder`)
    } else if (game.category === 'blockblaster') {
      navigate(`/dashboard/games/${game.id}/blockblaster-builder`)
    } else if (game.category === 'candyblast') {
      navigate(`/dashboard/games/${game.id}/candyblast-builder`)
    } else if (['Carrom', 'carrom'].includes(game.category)) {
      navigate(`/dashboard/games/${game.id}/Carrom-builder`)
    } else if (game.category === 'classicmaze') {
      navigate(`/dashboard/games/${game.id}/classicmaze-builder`)
    } else if (game.category === 'stickmaze') {
      navigate(`/dashboard/games/${game.id}/stickmaze-builder`)
    } else if (game.category === 'ludo') {
      navigate(`/dashboard/games/${game.id}/ludo-builder`)
    } else if (game.category === 'snakeandladder') {
      navigate(`/dashboard/games/${game.id}/snakeandladder-builder`)
    } else if (game.category === 'tictactoemultiplayer') {
      navigate(`/dashboard/games/${game.id}/tictactoemultiplayer-builder`)
    } else if (game.category === 'spotregistration') {
      navigate(`/dashboard/games/${game.id}/spotreg-builder`)
    } else {
      navigate(`/dashboard/games/${game.id}/builder`)
    }

  } catch (err) {
    onError(err.response?.data?.message || 'Error creating game')
    setSubmitting(false)
  }
}

  return (
    <div style={{position:'fixed',inset:0,zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(15,23,42,.65)',backdropFilter:'blur(20px) saturate(1.3)',WebkitBackdropFilter:'blur(20px) saturate(1.3)',animation:'gpFadeIn .3s ease'}}>
      {/* Decorative orbs */}
      <div style={{position:'fixed',top:'15%',left:'10%',width:350,height:350,borderRadius:'50%',background: isDark ? 'radial-gradient(circle, rgba(168,85,247,.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,.06) 0%, transparent 70%)',filter:'blur(70px)',pointerEvents:'none',animation:'gpOrbFloat 12s ease-in-out infinite'}} />
      <div style={{position:'fixed',bottom:'5%',right:'8%',width:280,height:280,borderRadius:'50%',background: isDark ? 'radial-gradient(circle, rgba(99,102,241,.10) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,.04) 0%, transparent 70%)',filter:'blur(60px)',pointerEvents:'none',animation:'gpOrbFloat 15s ease-in-out infinite reverse'}} />

      {/* ── Glass Modal ── */}
      <div className="gp-no-scrollbar" style={{
        background: isDark ? 'rgba(26,26,26,0.82)' : 'rgba(255,255,255,0.78)',
        backdropFilter:'blur(32px) saturate(1.5)',
        WebkitBackdropFilter:'blur(32px) saturate(1.5)',
        borderRadius:28,width:'85vw',maxWidth:1100,maxHeight:'92vh',overflow:'auto',
        padding:'0',
        border:'1px solid rgba(255,255,255,0.35)',
        boxShadow:'0 32px 80px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,0.5)',
        animation:'gpModalIn .35s cubic-bezier(.34,1.56,.64,1)',fontFamily:"'DM Sans',sans-serif",
        scrollbarWidth:'none',msOverflowStyle:'none',
      }}>
        {/* ── Header ── */}
        <div style={{
          padding:'28px 36px 18px',
          background:'rgba(255,255,255,0.5)',
          borderBottom:'1px solid rgba(0,0,0,0.06)',
          position:'sticky',top:0,zIndex:10,
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <span style={{fontSize:28}}>🎮</span>
              <div>
                <h2 style={{fontWeight:800,fontSize:22,color:'var(--text)',margin:0,lineHeight:1.2,letterSpacing:'-0.02em'}}>New Game</h2>
                <p style={{color:'var(--text2)',fontSize:13,marginTop:3}}>Choose a game type to get started</p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width:36,height:36,borderRadius:10,
              border:'1px solid rgba(0,0,0,0.1)',background:'rgba(255,255,255,0.6)',
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
              color:'var(--text3)',fontSize:16,transition:'all .15s',flexShrink:0,
            }} onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.9)';e.currentTarget.style.color='var(--text)'}} onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.6)';e.currentTarget.style.color='var(--text3)'}}><Ico.close/></button>
          </div>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} style={{padding:'24px 36px 32px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr minmax(260px, 30%)',gap:'28px',alignItems:'start'}}>

            {/* ── LEFT COLUMN (70%): game type picker ── */}
            <div style={{minWidth:0}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.05em'}}>Choose Game Type</label>
              <div style={{position:'relative',marginBottom:14}}>
                <svg style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text3)'}} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input
                  type="text"
                  placeholder="Search game types..."
                  value={gameTypeSearch}
                  onChange={e => setGameTypeSearch(e.target.value)}
                  style={{
                    width:'100%',padding:'10px 12px 10px 36px',borderRadius:8,
                    border:'1.5px solid rgba(0,0,0,0.08)',
                    background:'rgba(255,255,255,0.6)',
                    fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'var(--text)',outline:'none',
                    transition:'all .2s',
                  }}
                  onFocus={e=>{e.target.style.borderColor='#8B5CF6';e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)';e.target.style.background='rgba(255,255,255,0.9)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(0,0,0,0.08)';e.target.style.boxShadow='none';e.target.style.background='rgba(255,255,255,0.6)'}}
                />
                {gameTypeSearch && (
                  <button type="button" onClick={() => setGameTypeSearch('')} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:2,fontSize:14,lineHeight:1}}>×</button>
                )}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))',gap:12,maxHeight:'52vh',overflowY:'auto',paddingRight:4}}>
                {Object.entries(CATEGORY_META).sort((a, b) => a[1].label.localeCompare(b[1].label)).filter(([k,v]) => !gameTypeSearch || v.label.toLowerCase().includes(gameTypeSearch.toLowerCase()) || v.desc.toLowerCase().includes(gameTypeSearch.toLowerCase())).map(([k,v]) => {
                  const selected = form.category === k
                  return (
                    <button key={k} type="button"
                      onClick={() => setForm(f=>({...f,category:k}))}
                      onMouseOver={e=>{if(!selected){e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.1)'}}}
                      onMouseOut={e=>{if(!selected){e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}}
                      style={{
                        padding:'22px 12px 18px',borderRadius:16,
                        border:selected ? '2px solid #8B5CF6' : '1px solid rgba(0,0,0,0.06)',
                        background: selected ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.5)',
                        cursor:'pointer',transition:'all .25s cubic-bezier(.34,1.56,.64,1)',
                        display:'flex',flexDirection:'column',alignItems:'center',gap:6,
                        position:'relative',overflow:'hidden',
                        boxShadow: selected ? '0 4px 20px rgba(139,92,246,0.2), inset 0 0 0 1px rgba(139,92,246,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                        transform: selected ? 'scale(1.03)' : 'scale(1)',
                      }}>
                      {selected && <div style={{
                        position:'absolute',top:6,right:6,
                        width:18,height:18,borderRadius:'50%',
                        background:'#8B5CF6',color:'#fff',fontSize:10,fontWeight:800,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:'0 2px 8px rgba(139,92,246,0.4)',
                        animation:'gpBounceIn .3s ease',zIndex:2,
                      }}>✓</div>}
                      <span style={{fontSize:30,lineHeight:1}}>{v.icon}</span>
                      <span style={{fontSize:12,fontWeight:700,color:selected?'#6D28D9':'var(--text)',lineHeight:1.2}}>
                        {v.label}
                      </span>
                      <span style={{fontSize:9.5,color:selected?'var(--primary)':'var(--text3)',lineHeight:1.3,textAlign:'center'}}>
                        {v.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── RIGHT COLUMN (30%): form fields ── */}
            <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
              {/* Client */}
              <div style={{marginBottom:18}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.05em'}}>Client <span style={{color:'#EF4444'}}>*</span></label>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{position:'relative',flex:1}}>
                    <select value={form.client_id} onChange={set('client_id')} required style={{
                      width:'100%',padding:'9px 36px 9px 12px',borderRadius:8,
                      border:'1.5px solid rgba(0,0,0,0.08)',
                      background:'rgba(255,255,255,0.6)',
                      fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'var(--text)',outline:'none',
                      appearance:'none',cursor:'pointer',transition:'all .2s',
                    }} onFocus={e=>{e.target.style.borderColor='#8B5CF6';e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)';e.target.style.background='rgba(255,255,255,0.9)'}} onBlur={e=>{e.target.style.borderColor='rgba(0,0,0,0.08)';e.target.style.boxShadow='none';e.target.style.background='rgba(255,255,255,0.6)'}}>
                      <option value="">Select a client…</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                    <svg style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text3)'}} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  <button type="button" onClick={onAddClient} style={{
                    padding:'9px 12px',whiteSpace:'nowrap',fontSize:12,fontWeight:600,
                    borderRadius:8,border:'1.5px dashed rgba(0,0,0,0.12)',background:'rgba(255,255,255,0.4)',
                    color:'#8B5CF6',cursor:'pointer',transition:'all .15s',fontFamily:"'DM Sans',sans-serif",
                  }} onMouseOver={e=>{e.currentTarget.style.borderColor='#8B5CF6';e.currentTarget.style.background='rgba(139,92,246,0.08)'}} onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(0,0,0,0.12)';e.currentTarget.style.background='rgba(255,255,255,0.4)'}}>
                    + Add
                  </button>
                </div>
              </div>

              {/* Game Name */}
              <div style={{marginBottom:18}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.05em'}}>Game Name <span style={{color:'#EF4444'}}>*</span></label>
                <input value={form.name} onChange={set('name')} placeholder="e.g. Product Knowledge Quiz" required style={{
                  width:'100%',padding:'11px 14px',borderRadius:10,
                  border:'1.5px solid rgba(0,0,0,0.08)',
                  background:'rgba(255,255,255,0.6)',
                  fontSize:14,fontFamily:"'DM Sans',sans-serif",color:'var(--text)',outline:'none',
                  transition:'all .2s',
                }} onFocus={e=>{e.target.style.borderColor='#8B5CF6';e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)';e.target.style.background='rgba(255,255,255,0.9)'}} onBlur={e=>{e.target.style.borderColor='rgba(0,0,0,0.08)';e.target.style.boxShadow='none';e.target.style.background='rgba(255,255,255,0.6)'}} />
              </div>

              {/* Description */}
              <div style={{marginBottom:18}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.05em'}}>Description</label>
                <textarea rows={3} value={form.description} onChange={set('description')} placeholder="Optional game description" style={{
                  width:'100%',padding:'11px 14px',borderRadius:10,
                  border:'1.5px solid rgba(0,0,0,0.08)',
                  background:'rgba(255,255,255,0.6)',
                  fontSize:14,fontFamily:"'DM Sans',sans-serif",color:'var(--text)',outline:'none',
                  resize:'vertical',transition:'all .2s',
                }} onFocus={e=>{e.target.style.borderColor='#8B5CF6';e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)';e.target.style.background='rgba(255,255,255,0.9)'}} onBlur={e=>{e.target.style.borderColor='rgba(0,0,0,0.08)';e.target.style.boxShadow='none';e.target.style.background='rgba(255,255,255,0.6)'}} />
              </div>

              {/* Redirect URL */}
              <div style={{marginBottom:18}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.05em'}}>
                  Redirect URL <span style={{color:'var(--text3)',fontWeight:400,textTransform:'none',letterSpacing:0,fontSize:10}}>(after game ends)</span>
                </label>
                <input type="url" value={form.redirect_url} onChange={set('redirect_url')} placeholder="https://yoursite.com/thankyou" style={{
                  width:'100%',padding:'11px 14px',borderRadius:10,
                  border:'1.5px solid rgba(0,0,0,0.08)',
                  background:'rgba(255,255,255,0.6)',
                  fontSize:14,fontFamily:"'DM Sans',sans-serif",color:'var(--text)',outline:'none',
                  transition:'all .2s',
                }} onFocus={e=>{e.target.style.borderColor='#8B5CF6';e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)';e.target.style.background='rgba(255,255,255,0.9)'}} onBlur={e=>{e.target.style.borderColor='rgba(0,0,0,0.08)';e.target.style.boxShadow='none';e.target.style.background='rgba(255,255,255,0.6)'}} />
              </div>

              {/* Selected game type summary */}
              <div style={{
                marginBottom:18,padding:'12px 14px',borderRadius:10,
                background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.2)',
                display:'flex',alignItems:'center',gap:10,
              }}>
                <span style={{fontSize:24,lineHeight:1}}>{(CATEGORY_META[form.category]||{}).icon || '🎮'}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--primary)',textTransform:'uppercase',letterSpacing:'.05em'}}>Selected type</div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{(CATEGORY_META[form.category]||{}).label || 'Quiz'}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{display:'flex',gap:10,marginTop:'auto',borderTop:'1px solid rgba(0,0,0,0.06)',paddingTop:18}}>
                <button type="button" onClick={onClose} style={{
                  flex:1,justifyContent:'center',padding:'12px 0',fontSize:14,fontWeight:600,
                  borderRadius:10,border:'1.5px solid rgba(0,0,0,0.08)',background:'rgba(255,255,255,0.5)',
                  color:'var(--text2)',cursor:'pointer',transition:'all .15s',fontFamily:"'DM Sans',sans-serif",
                }} onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.8)';e.currentTarget.style.borderColor='rgba(0,0,0,0.12)'}} onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.5)';e.currentTarget.style.borderColor='rgba(0,0,0,0.08)'}}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{
                  flex:2,justifyContent:'center',padding:'12px 0',borderRadius:10,border:'none',
                  background:submitting ? 'rgba(0,0,0,0.15)' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  color:submitting?'var(--text3)':'var(--surface)',fontSize:14,fontWeight:700,
                  cursor:submitting?'not-allowed':'pointer',
                  fontFamily:"'DM Sans',sans-serif",transition:'all .2s',
                  boxShadow:submitting?'none':'0 4px 16px rgba(139,92,246,0.3)',
                }} onMouseOver={e=>{if(!submitting){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(139,92,246,0.4)'}}} onMouseOut={e=>{if(!submitting){e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 16px rgba(139,92,246,0.3)'}}}>
                  {submitting ? <><Ico.spin/> Creating…</> : '🚀 Create & Open Builder'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
      <style>{`
        @keyframes gpFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes gpBounceIn{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes gpOrbFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-20px)}}
        .gp-no-scrollbar::-webkit-scrollbar{display:none}
        .gp-no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}      </style>
    </div>
  )
}

/* ── Duplicate a game into any client (admin) ── */
function DuplicateGameModal({ game, clients, onClose, onCreated, onError }) {
  const { isDark } = useTheme()
  const [targetClientId, setTargetClientId] = useState(game?.client_id ? String(game.client_id) : '')
  const [duplicating, setDuplicating] = useState(false)

  const srcClient = clients.find(c => c.id === game?.client_id)

  const handleDuplicate = async () => {
    if (!game) return
    if (!targetClientId) return onError('Select a client to duplicate into')
    setDuplicating(true)
    try {
      const res = await api.post(`/games/${game.id}/duplicate`, { client_id: Number(targetClientId) })
      const target = clients.find(c=>c.id===Number(targetClientId))
      onCreated(res.data.game, target?.company_name || 'client')
    } catch (err) {
      onError(err.response?.data?.message || 'Duplicate failed')
    } finally {
      setDuplicating(false)
    }
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:700,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(8,8,18,.5)',backdropFilter:'blur(6px)',animation:'gpFadeIn .25s ease'}} onClick={onClose}>
      <div style={{
        width:440,maxWidth:'92vw',borderRadius:20,padding:24,
        background: isDark ? 'rgba(26,26,26,0.95)' : '#fff',
        border:'1px solid rgba(255,255,255,0.12)',
        boxShadow:'0 24px 60px rgba(0,0,0,.3)',
        fontFamily:"'DM Sans',sans-serif",
      }} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
           <h3 style={{margin:0,fontSize:18,fontWeight:800,color:'var(--text)'}}>Duplicate Game</h3>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text3)',fontSize:20,cursor:'pointer',lineHeight:1}}>✕</button>
        </div>

        <div style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>
          Source: <strong style={{color:'var(--text)'}}>{game?.name}</strong>
        </div>
        <div style={{fontSize:12,color:'var(--text3)',marginBottom:6}}>Originally under: <strong style={{color:'var(--text)'}}>{srcClient?.company_name || '—'}</strong></div>
        {!srcClient && <div style={{fontSize:11,color:'var(--text3)',marginBottom:10}}>This game isn't assigned to a client yet.</div>}

        <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--text)',margin:'16px 0 6px',textTransform:'uppercase',letterSpacing:'.05em'}}>
          Duplicate into client <span style={{color:'#EF4444'}}>*</span>
        </label>
        <div style={{position:'relative'}}>
          <select value={targetClientId} onChange={e=>setTargetClientId(e.target.value)} style={{
            width:'100%',padding:'10px 36px 10px 12px',borderRadius:10,
            border:'1.5px solid rgba(0,0,0,0.1)',background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
            fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'var(--text)',outline:'none',appearance:'none',cursor:'pointer',
          }}>
            <option value="">Select a client…</option>
            {clients.map(c => <option key={c.id} value={String(c.id)}>{c.company_name}</option>)}
          </select>
          <svg style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text3)'}} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
        </div>
        <p style={{fontSize:11,color:'var(--text3)',marginTop:8}}>
          Selecting the same client keeps the duplicate in the same client's workspace.
        </p>

        <div style={{display:'flex',gap:10,marginTop:18,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{
            padding:'10px 18px',borderRadius:10,border:'1px solid rgba(0,0,0,0.1)',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            color:'var(--text)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
          }}>Cancel</button>
          <button onClick={handleDuplicate} disabled={!targetClientId || duplicating} style={{
            padding:'10px 18px',borderRadius:10,border:'none',background:' #8B5CF6',color:'#fff',
            fontSize:13,fontWeight:700,cursor: targetClientId && !duplicating ? 'pointer' : 'not-allowed',
            opacity: targetClientId && !duplicating ? 1 : 0.5,fontFamily:"'DM Sans',sans-serif",
          }}>{duplicating ? 'Duplicating…' : 'Duplicate'}</button>
        </div>
      </div>
    </div>
  )
}

// Column definitions — order here = order in table
const STATUS_META = {
  development: { label:'Development', color:'var(--chip-amber-fg)', bg:'var(--chip-amber-bg)' },
  testing:     { label:'Testing',     color:'var(--chip-red-fg)', bg:'var(--chip-red-bg)' },
  live:        { label:'Live',        color:'var(--chip-green-fg)', bg:'var(--chip-green-bg)' },
}

const COLUMNS = [
  { key:'name',         label:'Game',          sortable:true  },
  { key:'category',     label:'Category',      sortable:false },
  { key:'qty_plays',    label:'Qty / Plays',   sortable:false, center:true },
  { key:'is_active',    label:'Active',        sortable:false, center:true },
  { key:'show_in_play_page', label:'Play Page', sortable:false, center:true },
  { key:'show_in_hero_page', label:'Hero',     sortable:false, center:true },
  { key:'status',       label:'Status',        sortable:false, center:true },
  { key:'created_edited', label:'Created / Edited', sortable:false },
  { key:'actions',      label:'Actions',       sortable:false, center:true },
  { key:'qr',           label:'QR',            sortable:false, center:true },
]

function SortTh({ col, sortKey, sortDir, onSort }) {
  const active = sortKey === col.key
  return (
    <th className={col.center ? 'center' : ''}>
      {col.sortable ? (
        <button className="gp-th-btn" onClick={() => onSort(col.key)}
          style={active ? {color:' var(--primary)'} : {}}>
          {col.label}
          <span style={{color: active ? ' var(--primary)' : ' var(--border-light)', marginLeft:2}}>
            {active && sortDir === 'asc' ? <Ico.caretUp/> : <Ico.caretDn/>}
          </span>
        </button>
      ) : (
        <span style={{fontSize:11,fontWeight:700,color:' var(--text2)',textTransform:'uppercase',letterSpacing:'.08em'}}>
          {col.label}
        </span>
      )}
    </th>
  )
}

/* ── Reusable game detail / control modal ── */
function GameDetailModal({ game, onClose, onBuilder, onResponses, onQr, onCopyLink, onToggle, onStatusToggle, onGameTypeToggle, onDuplicate, onDelete }) {
  if (!game) return null
  const cat = catMeta(game.category)
  return (
    <div style={{position:'fixed',inset:0,zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(8,8,18,.48)',backdropFilter:'blur(5px)'}} onClick={onClose}>
      <div className="gp-modal" style={{background:'var(--surface)',borderRadius:20,width:'100%',maxWidth:480,maxHeight:'90vh',overflow:'auto',padding:'28px 24px',boxShadow:'0 24px 64px rgba(0,0,0,.22)',fontFamily:"'DM Sans',sans-serif"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:20,color:'var(--text)',marginBottom:4}}>
              {game.name || game.location_name || game.branch_name || 'Untitled Game'}
              {game.location_name && game.name && <span style={{color:'var(--text2)',fontWeight:500,fontSize:14,marginLeft:8}}>- {game.location_name}</span>}
            </h2>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,background:cat.bg,color:cat.fg}}>{cat.label}</span>
              <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,background:game.is_active?'var(--chip-green-bg)':'var(--border-light)',color:game.is_active?'var(--chip-green-fg)':'var(--text3)'}}>{game.status||'Draft'}</span>
              {game.parent_game_id
                ? <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,background:'var(--chip-primary-bg)',color:'var(--chip-primary-fg)'}}>📍 Location{game.branch_name?` · ${game.branch_name}`:''}</span>
                : <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,background:'var(--chip-primary-bg)',color:'var(--chip-primary-fg)'}}>📦 Master</span>}
            </div>
          </div>
          <button onClick={onClose} style={{border:'none',background:'none',cursor:'pointer',color:'var(--text3)',padding:4}}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:16}}>
          <div style={{flex:1,background:'var(--chip-primary-bg)',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:'var(--chip-primary-fg)'}}>{game.question_count||0}</div>
            <div style={{fontSize:9,fontWeight:700,color:'var(--chip-primary-fg)',textTransform:'uppercase'}}>Questions</div>
          </div>
          <div style={{flex:1,background:'var(--chip-green-bg)',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:700,color:'var(--chip-green-fg)'}}>{game.play_count||0}</div>
            <div style={{fontSize:9,fontWeight:700,color:'var(--chip-green-fg)',textTransform:'uppercase'}}>Plays</div>
          </div>
          {game.branch_pincode && (
            <div style={{flex:1,background:'var(--chip-amber-bg)',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontSize:16,fontWeight:700,color:'var(--chip-amber-fg)'}}>{game.branch_pincode}</div>
              <div style={{fontSize:9,fontWeight:700,color:'var(--chip-amber-fg)',textTransform:'uppercase'}}>Pincode</div>
            </div>
          )}
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Quick Actions</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <button onClick={()=>{onBuilder(game);onClose()}} style={mBtn}>🔧 Open Builder</button>
            <button onClick={()=>{onResponses(game);onClose()}} style={mBtn}>📊 Responses</button>
            <button onClick={()=>{onQr(game);onClose()}} style={mBtn}>📱 Show QR</button>
            <button onClick={()=>{onCopyLink(game);onClose()}} style={mBtn}>🔗 Copy Link</button>
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Settings</div>
          {[
            {label:'Active',field:'is_active',disabled:game.status!=='live'},
            {label:'Show in Play Page',field:'show_in_play_page'},
            {label:'Show in Hero Page',field:'show_in_hero_page'},
          ].map(t => (
            <div key={t.field} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border-light)'}}>
              <span style={{fontSize:13,color:'var(--text)'}}>{t.label}</span>
              <button disabled={t.disabled} onClick={()=>onToggle(game,t.field)} style={{width:42,height:24,borderRadius:12,border:'none',cursor:t.disabled?'not-allowed':'pointer',background:game[t.field]?'var(--success)':'var(--border-light)',position:'relative',transition:'background .15s',opacity:t.disabled?0.4:1}}>
                <span style={{position:'absolute',top:3,left:game[t.field]?21:3,width:18,height:18,borderRadius:9,background:'var(--surface)',transition:'left .15s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}/>
              </button>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border-light)'}}>
            <span style={{fontSize:13,color:'var(--text)'}}>Game Type</span>
            <button onClick={()=>onGameTypeToggle(game)} style={{width:42,height:24,borderRadius:12,border:'none',cursor:'pointer',background:game.game_type==='branded'?'var(--success)':'var(--border-light)',position:'relative',transition:'background .15s'}}>
              <span style={{position:'absolute',top:3,left:game.game_type==='branded'?21:3,width:18,height:18,borderRadius:9,background:'var(--surface)',transition:'left .15s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}/>
            </button>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0'}}>
            <span style={{fontSize:13,color:'var(--text)'}}>Status</span>
            <button onClick={()=>onStatusToggle(game)} style={{padding:'3px 10px',borderRadius:6,border:'1.5px solid var(--border)',background:'var(--surface)',fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans',color:'var(--text2)'}}>Cycle →</button>
          </div>
        </div>

        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{onDuplicate(game.id);onClose()}} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--text)',fontFamily:'inherit'}}><Copy size={14} strokeWidth={2.2}/> Duplicate</button>
          <button onClick={()=>{if(confirm('Delete this game?')){onDelete(game.id);onClose()}}} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px',borderRadius:8,border:'1px solid var(--error-border)',background:'var(--error-bg)',cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--error)',fontFamily:'inherit'}}><Trash2 size={14} strokeWidth={2.2}/> Delete</button>
        </div>
      </div>
    </div>
  )
}

const mBtn = {padding:'10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--text)',fontFamily:'inherit',transition:'all .12s',textAlign:'center'}

/* ── Graphical client tree (timeline) ── */
function GraphNode({ x, y, w, h, game, kind, onClick, canvasRef, nodeKey, onDrag, onPersist, innerRef }) {
  const { isDark } = useTheme()
  const isClient = kind === 'client'
  const isLoc = kind === 'location'
  const Icon = isClient ? Building2 : catIcon(game.category)
  const meta = isClient ? { label:'Client', bg:'#7C3AED', fg:'var(--surface)', dot:'#A78BFA' }
    : catMeta(game.category)
  const accent = meta.dot
  const softBg = meta.bg
  const fg = meta.fg
  const titleColor = isClient ? 'var(--surface)' : (isDark ? 'var(--text)' : fg)
  const subColor = isClient ? 'rgba(255,255,255,.82)' : (isDark ? 'var(--text2)' : fg)
  const title = isClient ? game.name
    : (isLoc ? (game.branch_name || game.location_name || game.name) : game.name)
  const STATUS_META = {
    development: { label:'Development', bg:'var(--chip-neutral-bg)', fg:'var(--chip-neutral-fg)' },
    testing:     { label:'Testing',     bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)' },
    live:        { label:'Live',        bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)' },
  }
  const st = STATUS_META[game.status] || STATUS_META.development

  const onMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = e.clientX, sy = e.clientY
    const dx = sx - rect.left - x, dy = sy - rect.top - y
    let moved = false
    const move = (ev) => {
      const nx = Math.max(0, ev.clientX - rect.left - dx)
      const ny = Math.max(0, ev.clientY - rect.top - dy)
      if (Math.abs(ev.clientX - sx) > 3 || Math.abs(ev.clientY - sy) > 3) moved = true
      onDrag(nodeKey, nx, ny)
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      if (moved) onPersist()
      else if (!isClient && onClick) onClick(game)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  // client node: slim rectangular pill, auto width, single line
  if (isClient) {
    return (
      <div ref={innerRef} onMouseDown={onMouseDown}
        style={{
          position:'absolute', left:x, top:y, boxSizing:'border-box',
          display:'flex', alignItems:'center', gap:10,
          background:'linear-gradient(135deg, #7C3AED, #6366F1)',
          color:'#fff', padding:'14px 18px', borderRadius:16, cursor:'grab',
          minHeight:h, boxShadow:'0 6px 18px rgba(99,102,241,.35)',
          transition:'box-shadow .15s ease, transform .15s ease',
          userSelect:'none', whiteSpace:'nowrap',
        }}
        onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 12px 30px rgba(99,102,241,.5)'; e.currentTarget.style.transform='translateY(-2px)' }}
        onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 6px 18px rgba(99,102,241,.35)'; e.currentTarget.style.transform='translateY(0)' }}
      >
        <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Building2 size={20} strokeWidth={2.4} />
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',lineHeight:1.3}}>
          <div style={{fontWeight:700,fontSize:14}}>{title}</div>
          <div style={{fontSize:11,opacity:.85,fontWeight:500}}>{game._count||''}</div>
        </div>
      </div>
    )
  }

  // game node: liquid-glass square tile tinted with the category color (connectors show through)
  return (
    <div onMouseDown={onMouseDown}
      style={{
        position:'absolute', left:x, top:y, width:w, height:h, boxSizing:'border-box',
        background:`linear-gradient(135deg, ${accent}26, ${accent}0D 60%, ${isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)'})`,
        backdropFilter:'blur(14px) saturate(140%)', WebkitBackdropFilter:'blur(14px) saturate(140%)',
        border:`1px solid ${accent}66`,
        borderRadius:16, padding:'14px 12px', cursor:'grab', overflow:'hidden',
        display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
        boxShadow:`0 4px 16px ${accent}22, inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'}`,
        transition:'box-shadow .15s ease, transform .15s ease',
        userSelect:'none',
      }}
      onMouseEnter={e=>{ e.currentTarget.style.boxShadow=`0 12px 30px ${accent}55, inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)'}`; e.currentTarget.style.transform='translateY(-3px)' }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow=`0 4px 16px ${accent}22, inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'}`; e.currentTarget.style.transform='translateY(0)' }}
    >
      {/* icon chip */}
      <div style={{
        width:40, height:40, borderRadius:12, flexShrink:0,
        background:`${softBg}`, color: fg,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 1px 3px ${accent}33`, marginBottom:8,
      }}>
        <Icon size={20} strokeWidth={2.2} />
      </div>

      {/* game name */}
      <div style={{fontWeight:700,fontSize:13, color:titleColor, width:'100%', whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis', lineHeight:1.25}}>
        {title}
      </div>

      {/* type label (header) */}
      <div style={{fontSize:9.5,fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase',color:subColor,marginTop:3}}>
        {isLoc ? 'LOCATION' : meta.label}
      </div>

      {/* client name row */}
      <div style={{fontSize:10.5,color:subColor,marginTop:6,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%'}}>
        {game.company_name || '—'}
      </div>

      {/* spacer pushes stats + footer to bottom */}
      <div style={{flex:1}} />

      {/* plays / redemptions row */}
      <div style={{display:'flex',justifyContent:'center',gap:14,fontSize:10,color:subColor,fontWeight:600,width:'100%'}}>
        <span>{game.play_count||0} plays</span>
        <span>{game.redemption_count||0} redemptions</span>
      </div>

      {/* footer: status cycle + master/location */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:8,width:'100%'}}>
        <span style={{fontSize:8.5,fontWeight:700,padding:'3px 8px',borderRadius:100,background:st.bg,color:st.fg,whiteSpace:'nowrap'}}>{st.label}</span>
        <span style={{fontSize:8.5,fontWeight:700,padding:'3px 8px',borderRadius:100,background:isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.05)',color:isDark?'var(--text)':fg,whiteSpace:'nowrap'}}>
          {isLoc ? 'Location' : 'Master'}
        </span>
      </div>

      <span style={{position:'absolute',left:0,top:'50%',transform:'translateY(-50%)',width:4,height:26,background:accent,borderRadius:'0 4px 4px 0'}} />
    </div>
  )
}

function ClientGraph({ client, games, onSelect }) {
  const { isDark } = useTheme()
  const [clientW, setClientW] = useState(176)
  const canvasRef = useRef(null)
  const clientRef = useRef(null)
  const masters = games.filter(g => !g.parent_game_id && g.client_id === client.id)
    .sort((a,b)=> new Date(a.created_at) - new Date(b.created_at))
  const locationsOf = m => games.filter(g => g.parent_game_id === m.id)
    .sort((a,b)=> new Date(a.created_at) - new Date(b.created_at))

  if (masters.length === 0) return null

  const NW = 176, NH = 176
  // COLUMN-WISE layout: client on the left, masters stacked vertically,
  // each master's locations branch out to the right.
  const GAP_Y = 30          // vertical gap between stacked masters
  const GAP_X = 70          // horizontal gap between columns (client→master→locations)
  const PAD = 28
  // strict-column masters = those that have location children (keep readable tree)
  const strictMasters = masters.filter(m => locationsOf(m).length > 0)
  const looseMasters = masters.filter(m => locationsOf(m).length === 0)
  const SHUFFLE = masters.length > 5
  const strictMaxLocs = Math.max(0, ...strictMasters.map(m => locationsOf(m).length))
  const clientX = PAD
  const masterX = clientX + clientW + GAP_X
  const isClientH = NH

  const masterY = i => PAD + i * (NH + GAP_Y)
  const locX = j => masterX + NW + GAP_X + j * (NW + GAP_X)
  const colCount = SHUFFLE ? strictMasters.length : masters.length
  const clientY = masterY(Math.max(0, colCount - 1) / 2) + (NH - isClientH) / 2

  // deterministic pseudo-random scatter for childless masters (stable across reloads)
  const seedOf = id => { let s = 0; const str = String(id); for (let i=0;i<str.length;i++) s = (s*31 + str.charCodeAt(i)) >>> 0; return s }
  const rand = s => { const x = Math.sin(s * 999.13) * 43758.5453; return x - Math.floor(x) }

  const autoH = SHUFFLE
    ? Math.max(360, PAD + Math.ceil(looseMasters.length / 4) * (NH + GAP_Y) + (strictMasters.length * (NH + GAP_Y)))
    : Math.max(320, PAD + masters.length * (NH + GAP_Y))
  const autoW = SHUFFLE
    ? Math.max(700, PAD + 4 * (NW + GAP_X) + 40)
    : Math.max(640, masterX + NW + (strictMaxLocs > 0 ? strictMaxLocs * (NW + GAP_X) : 0) + PAD)

  // node key helpers
  const cKey = `client-${client.id}`
  const mKey = id => `game-${id}`
  const allKeys = [cKey, ...masters.map(m => mKey(m.id)), ...masters.flatMap(m => locationsOf(m).map(l => mKey(l.id)))]
  const defaultPos = key => {
    if (key === cKey) return { x: clientX, y: clientY }
    // column masters = all when not shuffling, else only strict (child-having) masters
    const colMasters = SHUFFLE ? strictMasters : masters
    for (let i = 0; i < colMasters.length; i++) {
      const m = colMasters[i]
      if (mKey(m.id) === key) return { x: masterX, y: masterY(i) }
      const j = locationsOf(m).findIndex(l => mKey(l.id) === key)
      if (j >= 0) return { x: locX(j), y: masterY(i) }
    }
    // loose (childless) masters → scattered grid with jitter (only when shuffling)
    const li = looseMasters.findIndex(m => mKey(m.id) === key)
    if (li >= 0) {
      const perRow = 4
      const col = li % perRow, row = Math.floor(li / perRow)
      const baseX = PAD + col * (NW + GAP_X)
      const baseY = PAD + strictMasters.length * (NH + GAP_Y) + row * (NH + GAP_Y)
      const s = seedOf(key)
      const jx = (rand(s) - 0.5) * 36
      const jy = (rand(s + 7) - 0.5) * 28
      return { x: baseX + jx, y: baseY + jy }
    }
    return { x: 40, y: 40 }
  }

  const [positions, setPositions] = useState({})
  const posRef = useRef({})
  const saveTimer = useRef(null)

  const fromSavedRef = useRef(false)
  useEffect(() => {
    let cancelled = false
    api.get(`/clients/${client.id}/canvas`).then(({data}) => {
      if (cancelled) return
      const saved = data.positions || {}
      fromSavedRef.current = Object.keys(saved).length > 0
      const init = {}
      allKeys.forEach(k => { init[k] = saved[k] || defaultPos(k) })
      posRef.current = init
      setPositions(init)
    }).catch(() => {
      fromSavedRef.current = false
      const init = {}
      allKeys.forEach(k => { init[k] = defaultPos(k) })
      posRef.current = init
      setPositions(init)
    })
    return () => { cancelled = true }
  }, [client.id])

  // measure client tile width so masters position to its right (column-wise layout)
  useEffect(() => {
    if (!clientRef.current) return
    setClientW(clientRef.current.offsetWidth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // descendants of a key (for moving subtree when a parent is dragged)
  const descendantsOf = key => {
    if (key === cKey) {
      // client: all masters + all locations
      return masters.flatMap(m => [mKey(m.id), ...locationsOf(m).map(l => mKey(l.id))])
    }
    // master: its locations
    const m = masters.find(mm => mKey(mm.id) === key)
    if (m) return locationsOf(m).map(l => mKey(l.id))
    return []
  }

  const persist = () => {
    api.put(`/clients/${client.id}/canvas`, { positions: posRef.current }).catch(() => {})
  }

  const resetLayout = () => {
    const init = {}
    allKeys.forEach(k => { init[k] = defaultPos(k) })
    posRef.current = init
    setPositions(init)
    api.delete(`/clients/${client.id}/canvas`).catch(() => {})
  }

  // drag a node: move node + its descendants by the same delta, keep latest in ref, debounce-save
  const onNodeDrag = (key, x, y) => {
    setPositions(p => {
      const prev = p[key] || defaultPos(key)
      const dx = x - prev.x, dy = y - prev.y
      const next = { ...p, [key]: { x, y } }
      descendantsOf(key).forEach(d => {
        if (next[d]) next[d] = { x: next[d].x + dx, y: next[d].y + dy }
      })
      posRef.current = next
      return next
    })
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(persist, 400)
  }

  // live bounds
  const keys = Object.keys(positions)
  const maxX = keys.length ? Math.max(...keys.map(k => positions[k].x + NW)) : autoW
  const maxY = keys.length ? Math.max(...keys.map(k => positions[k].y + NH)) : autoH
  const canvasW = Math.max(autoW, maxX + 40)
  const canvasH = Math.max(autoH, maxY + 40)
  const path = (x1,y1,x2,y2) => `M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}`
  const hpath = (x1,y1,x2,y2) => `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`
  const posOf = key => positions[key] || defaultPos(key)

  return (
    <div style={{marginBottom:36}}>
      <div style={{display:'flex',alignItems:'center',gap:10,margin:'0 0 14px 6px'}}>
        <div style={{width:30,height:30,borderRadius:9,background:'linear-gradient(135deg,#7C3AED,#6366F1)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,flexShrink:0}}>
          {client.company_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{client.company_name}</div>
        <div style={{fontSize:11,color:'var(--text3)'}}>{masters.length} master · {games.filter(g=>g.parent_game_id&&g.client_id===client.id).length} location · drag a node to move it and its subtree</div>
        <button onClick={resetLayout}
          style={{marginLeft:'auto',fontSize:11,fontWeight:600,color:'var(--primary)',background:'var(--primary-bg)',border:'1px solid var(--border)',borderRadius:8,padding:'6px 12px',cursor:'pointer'}}>
          ↺ Auto Layout
        </button>
      </div>
      <div ref={canvasRef} style={{position:'relative', width:'100%', height:canvasH, overflow:'hidden', borderRadius:14,
        background:'var(--surface)', backgroundImage:`radial-gradient(${isDark ? '#3a3a3a' : '#E3E6EF'} 1px, transparent 1px)`, backgroundSize:'22px 22px', border:'1px solid var(--border-light)'}}>
        <svg width={canvasW} height={canvasH} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
          {masters.map(m => {
            const cp = positions[cKey] || defaultPos(cKey)
            const mp = positions[mKey(m.id)] || defaultPos(mKey(m.id))
            const dot = catMeta(m.category).dot
            return (
              <g key={m.id}>
                <path d={hpath(cp.x+clientW, cp.y+NH/2, mp.x, mp.y+NH/2)} stroke={dot} strokeOpacity={isDark ? 0.85 : 0.55} strokeWidth="2" fill="none" />
                {locationsOf(m).map(loc => {
                  const lp = positions[mKey(loc.id)] || defaultPos(mKey(loc.id))
                  return <path key={loc.id} d={hpath(mp.x+NW, mp.y+NH/2, lp.x, lp.y+NH/2)} stroke={dot} strokeOpacity={isDark ? 0.7 : 0.4} strokeWidth="2" fill="none" />
                })}
              </g>
            )
          })}
        </svg>
        <GraphNode x={posOf(cKey).x} y={posOf(cKey).y} w={NW} h={NH} canvasRef={canvasRef} innerRef={clientRef}
          game={{ name: client.company_name, _count: `${masters.length} master · ${games.filter(g=>g.parent_game_id&&g.client_id===client.id).length} location` }}
          kind="client" nodeKey={cKey} onDrag={onNodeDrag} onPersist={persist} />
        {masters.map(m => (
          <div key={m.id}>
            <GraphNode x={posOf(mKey(m.id)).x} y={posOf(mKey(m.id)).y} w={NW} h={NH} canvasRef={canvasRef}
              game={m} kind="master" nodeKey={mKey(m.id)} onClick={onSelect} onDrag={onNodeDrag} onPersist={persist} />
            {locationsOf(m).map(loc => (
              <GraphNode key={loc.id} x={posOf(mKey(loc.id)).x} y={posOf(mKey(loc.id)).y} w={NW} h={NH} canvasRef={canvasRef}
                game={loc} kind="location" nodeKey={mKey(loc.id)} onClick={onSelect} onDrag={onNodeDrag} onPersist={persist} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function GraphView({ clients, games, onSelect }) {
  const withGames = clients.filter(c => games.some(g => g.client_id === c.id))
  const unassigned = games.filter(g => !g.client_id && !g.parent_game_id)
  return (
    <div style={{
      borderRadius:16, padding:'28px 20px', minHeight:420,
      background:'var(--surface)',
      border:'1px solid var(--border-light)',
    }}>
      {withGames.length === 0 && unassigned.length === 0 && (
        <div style={{textAlign:'center',padding:'60px 0',color:'var(--text3)',fontSize:14}}>No games to graph.</div>
      )}
      {withGames.map(c => <ClientGraph key={c.id} client={c} games={games} onSelect={onSelect} />)}
      {unassigned.length > 0 && (
        <ClientGraph client={{id:0, company_name:'Unassigned'}} games={unassigned} onSelect={onSelect} />
      )}
    </div>
  )
}

export default function GamesPage() {
  const [games, setGames] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)
  const [qrModalGame, setQrModalGame] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [viewMode, setViewMode] = useState('graph')
  const [selectedGame, setSelectedGame] = useState(null)
  const [dupTarget, setDupTarget] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [expandedParents, setExpandedParents] = useState({})
  const [graphClient, setGraphClient] = useState('all')
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const load = () =>
    Promise.all([api.get('/games'), api.get('/clients')])
      .then(([gr,cr]) => { setGames(gr.data.games||[]); setClients(cr.data.clients||[]) })
      .finally(() => setLoading(false))

  // re-sync the open modal's game with the freshly loaded list so updates show immediately
  const refreshSelected = () => setSelectedGame(s => s ? games.find(g => g.id === s.id) || s : s)
  useEffect(() => { if (selectedGame) refreshSelected() }, [games]) // eslint-disable-line

  useEffect(() => { load() }, [])

  const showToast = (msg, type='success') => setToast({msg, type})

  const handleDelete = async id => {
    if (!confirm('Delete this game and all its questions, images and sounds?')) return
    try { await api.delete(`/games/${id}`); showToast('Game deleted'); load() }
    catch { showToast('Delete failed','error') }
  }

  const toggleField = async (game, field) => {
    if (field === 'is_active' && game.status !== 'live') {
      showToast('Set status to Live first before activating','error')
      return
    }
    try {
      await api.put(`/games/${game.id}`, { [field]: game[field] ? 0 : 1 })
      load()
    } catch { showToast('Failed to update','error') }
  }

  const handleDuplicate = async id => {
    try {
      await api.post(`/games/${id}/duplicate`)
      showToast('Game duplicated')
      load()
    } catch { showToast('Duplicate failed','error') }
  }

  // Admin: open a client picker for the duplicate. Others: quick-duplicate to the same client.
  const handleDuplicateClick = (game) => {
    const g = typeof game === 'object' ? game : games.find(x => x.id === game)
    if (!g) return
    const changeClient = window.confirm('Do you want to change the client for the duplicate?')
    if (changeClient && clients.length > 0) { setDupTarget(g); return }
    handleDuplicate(g.id)
  }

  const handleDupCreated = (newGame, targetName) => {
    setDupTarget(null)
    showToast(`Game duplicated to ${targetName}`)
    load()
  }

  const STATUS_CYCLE = ['development', 'testing', 'live']

  const navigateBuilder = (game) => {
    const builders = {crossword:'crossword',spin:'spin',memory:'memory',jigsaw:'jigsaw',wordsearch:'wordsearch',pouring:'pouring',typer:'typer',screw:'screw',tower:'tower',math:'math',maze:'maze',classicmaze:'classicmaze',stickmaze:'stickmaze','2048':'2048',snake:'snake',catch:'catch',reaction:'reaction',simon:'simon',flappy:'flappy',bounce:'bounce',space:'space',connect4:'connect4',bejeweled:'bejeweled',tetris:'tetris',stack:'stack',bowling:'bowling',sudoku:'sudoku',minesweeper:'minesweeper',wordscramble:'wordscramble',rps:'rps',whackamole:'whackamole',hanoi:'hanoi',breakout:'breakout',bubbleshooter:'bubbleshooter',carlaunch:'carlaunch',arrowescape:'arrowescape',frustration:'frustration',stressbuster:'frustration',soundify:'soundify',tictactoe:'tictactoe',chess:'chess',snakeandladder:'snakeandladder',ludo:'ludo',Carrom:'Carrom',tictactoemultiplayer:'tictactoemultiplayer',spotregistration:'spotreg'}
    const slug = builders[game.category]
    navigate(`/dashboard/games/${game.id}${slug ? '/' + slug + '-builder' : '/builder'}`)
  }

  const handleStatusToggle = async (game, e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    const currentIndex = STATUS_CYCLE.indexOf(game.status)
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]
    try {
      await api.put(`/games/${game.id}/status`, { status: nextStatus })
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error')
    }
  }

  const handleGameTypeToggle = async (game, e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    const newType = game.game_type === 'branded' ? 'promogames' : 'branded'
    try {
      await api.put(`/games/${game.id}`, { game_type: newType })
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update game type','error')
    }
  }

  const copyLink = (game, e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    // location games play via their master (parent) template, scoped to the branch
    const parent = game.parent_game_id ? games.find(g => g.id === game.parent_game_id) : null
    const slug = parent?.slug || game.slug
    const clientSlug = parent?.client_slug || game.client_slug
    const host = window.location.origin
    const link = clientSlug ? `${host}/play/${slug}/${clientSlug}` : `${host}/play/${slug}`
    navigator.clipboard.writeText(link)
    if (!game.is_active) showToast('Link copied — game is currently inactive.','error')
    else showToast('Game link copied!')
  }

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // Filter
  const filtered = games.filter(g => {
    const matchSearch = !search || [g.name, g.company_name].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchCat = filterCat === 'all' || g.category === filterCat
    return matchSearch && matchCat
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey]
    if (sortKey === 'created_at') { av = new Date(av); bv = new Date(bv) }
    else if (typeof av === 'string') { av = av?.toLowerCase() || ''; bv = bv?.toLowerCase() || '' }
    else { av = av ?? 0; bv = bv ?? 0 }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const stats = {
    total: games.length,
    active: games.filter(g => g.is_active).length,
    plays: games.reduce((a,g) => a + (g.play_count||0), 0),
    onPlayPage: games.filter(g => g.show_in_play_page).length,
    onHero: games.filter(g => g.show_in_hero_page).length,
    branded: games.filter(g => g.game_type === 'branded').length,
    promogames: games.filter(g => g.game_type === 'promogames').length,
  }

  const fmtDate = dt => {
    if (!dt) return '—'
    const d = new Date(dt)
    return d.toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})
  }

  return (
    <div className="gp">
      <style>{CSS}</style>
      <div style={{padding:'36px 40px',maxWidth:1400,margin:'0 auto'}}>

        {/* Header — 3-col: Title | Search | Add Game */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr 1fr',alignItems:'center',marginBottom:28,gap:16}}>
          <h1 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:36,color:' var(--text)',letterSpacing:'-0.03em',lineHeight:1}}>
            Games
          </h1>
          {games.length > 0 && (
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{position:'relative',flex:1}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:' var(--text3)'}}><Ico.search/></span>
                <input className="gp-input" style={{paddingLeft:40,height:38,padding:'0 14px 0 40px',width:'100%'}} placeholder="Search games or client…" value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              {/* View toggle */}
              <div style={{display:'flex',background:'var(--border-light)',borderRadius:8,padding:3,gap:2}}>
                <button onClick={() => setViewMode('list')} style={{padding:'6px 10px',borderRadius:6,border:'none',background:viewMode==='list'?'var(--surface)':'transparent',cursor:'pointer',boxShadow:viewMode==='list'?'0 1px 3px rgba(0,0,0,0.1)':'none',transition:'all .15s',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,color:viewMode==='list'?'var(--primary)':'var(--text2)',fontFamily:'inherit'}}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                    List
                  </button>
                  <button onClick={() => setViewMode('tree')} style={{padding:'6px 10px',borderRadius:6,border:'none',background:viewMode==='tree'?'var(--surface)':'transparent',cursor:'pointer',boxShadow:viewMode==='tree'?'0 1px 3px rgba(0,0,0,0.1)':'none',transition:'all .15s',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,color:viewMode==='tree'?'var(--primary)':'var(--text2)',fontFamily:'inherit'}}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    Grid
                  </button>
                  <button onClick={() => setViewMode('graph')} style={{padding:'6px 10px',borderRadius:6,border:'none',background:viewMode==='graph'?'var(--surface)':'transparent',cursor:'pointer',boxShadow:viewMode==='graph'?'0 1px 3px rgba(0,0,0,0.1)':'none',transition:'all .15s',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,color:viewMode==='graph'?'var(--primary)':'var(--text2)',fontFamily:'inherit'}}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M5 8.5v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3M12 13.5V15.5"/></svg>
                    Graph
                  </button>
                  {viewMode === 'graph' && (
                    <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:8,paddingLeft:10,borderLeft:'1px solid var(--border)'}}>
                      <svg width="13" height="13" fill="none" stroke="var(--text3)" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
                      <select value={graphClient} onChange={e => setGraphClient(e.target.value)} style={{
                        border:'1px solid var(--border)',background:'var(--surface)',borderRadius:8,padding:'6px 28px 6px 10px',fontSize:11.5,fontWeight:600,color:'var(--text)',fontFamily:'inherit',cursor:'pointer',outline:'none',appearance:'none',
                        backgroundImage:'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'none\' stroke=\'%239CA3AF\' stroke-width=\'2\' viewBox=\'0 0 24 24\'><path d=\'m6 9 6 6 6-6\'/></svg>")',
                        backgroundRepeat:'no-repeat',backgroundPosition:'right 9px center',
                      }}>
                        <option value="all">All Clients</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
          )}
          <div style={{justifySelf:'end'}}>
            <button className="gp-primary-btn" onClick={() => setShowForm(true)}><Ico.plus/> Create Game</button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'80px 0',color:' var(--text3)',fontSize:14}}>
            <Ico.spin/> Loading games…
          </div>
        ) : games.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 0'}}>
            <div style={{width:72,height:72,borderRadius:18,background:' var(--chip-primary-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
              <svg width="30" height="30" fill="none" stroke=" var(--primary)" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4M15 12h.01M18 12h.01"/></svg>
            </div>
            <h3 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:20,color:' var(--text)',marginBottom:8}}>No games yet</h3>
            <p style={{color:' var(--text3)',fontSize:14,marginBottom:24}}>Create your first game to get started.</p>
            <button className="gp-primary-btn" onClick={()=>setShowForm(true)}><Ico.plus/> Create Game</button>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 0',color:' var(--text3)',fontSize:14}}>
            No games match your filters.
          </div>
        ) : viewMode === 'list' ? (
          <>
          <div className="gp-table-wrap" style={{overflowX:'auto'}}>
            <table className="gp-table">
              <thead>
                <tr>
                  {COLUMNS.map(col => (
                    <SortTh key={col.key} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  ))}
                 </tr>
              </thead>
              <tbody>
                {sorted.map((game, i) => {
                  const cat = catMeta(game.category)
                  return (
                    <tr
                      key={game.id}
                      className={game.is_active ? '' : 'inactive-row'}
                      style={{animationDelay:`${i*30}ms`, cursor:'pointer'}}
                      onClick={() => navigate(`/dashboard/games/${game.id}/responses`)}
                    >
                      {/* Game + Client */}
                      <td style={{minWidth:160}}>
                        <div style={{fontWeight:600,color:' var(--text)',fontSize:13.5,fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>
                          {game.name}
                        </div>
                        <div style={{fontSize:11.5,color:' var(--text2)',fontWeight:500}}>
                          {game.company_name || '—'}
                        </div>
                      </td>
                      {/* Category */}
                      <td style={{minWidth:90}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:5,background:cat.bg,color:cat.fg,fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:100,letterSpacing:'.01em'}}>
                          <span style={{width:5,height:5,borderRadius:'50%',background:cat.dot,flexShrink:0}} />
                          {cat.label}
                        </span>
                      </td>

                      {/* Qty / Plays */}
                      <td className="center" style={{minWidth:90}}>
                        <span style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,fontSize:12,color:' var(--text)'}}>
                          <span style={{display:'flex',alignItems:'center',gap:4,fontWeight:600}}><Ico.question/> {game.question_count||0}</span>
                          <span style={{display:'flex',alignItems:'center',gap:4,color:' var(--text2)'}}><Ico.play/> {(game.play_count||0).toLocaleString()}</span>
                        </span>
                      </td>

                      {/* Active toggle — only toggleable when status is live */}
                      <td className="center" style={{minWidth:72}} onClick={e => e.stopPropagation()}>
                        <div className="gp-toggle-wrap">
                          <button
                            className={`gp-toggle ${game.status === 'live' && game.is_active ? 'on' : 'off'}`}
                            disabled={game.status !== 'live'}
                            title={game.status !== 'live' ? 'Set status to Live first' : (game.is_active ? 'Deactivate game' : 'Activate game')}
                            onClick={e => { e.stopPropagation(); toggleField(game, 'is_active') }}
                            style={game.status !== 'live' ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                          />
                          <span className="gp-toggle-label">{game.status === 'live' ? (game.is_active ? 'On' : 'Off') : 'Off'}</span>
                        </div>
                      </td>

                      {/* Show in Play Page */}
                      <td className="center" style={{minWidth:80}} onClick={e => e.stopPropagation()}>
                        <div className="gp-toggle-wrap">
                          <button
                            className={`gp-toggle ${game.show_in_play_page ? 'on' : 'off'}`}
                            title={game.show_in_play_page ? 'Remove from play page' : 'Show on play page'}
                            onClick={e => { e.stopPropagation(); toggleField(game, 'show_in_play_page') }}
                          />
                          <span className="gp-toggle-label">{game.show_in_play_page ? 'On' : 'Off'}</span>
                        </div>
                      </td>

                      {/* Show in Hero Page */}
                      <td className="center" style={{minWidth:80}} onClick={e => e.stopPropagation()}>
                        <div className="gp-toggle-wrap">
                          <button
                            className={`gp-toggle ${game.show_in_hero_page ? 'on' : 'off'}`}
                            title={game.show_in_hero_page ? 'Remove from hero' : 'Feature on homepage hero'}
                            onClick={e => { e.stopPropagation(); toggleField(game, 'show_in_hero_page') }}
                          />
                           <span className="gp-toggle-label">{game.show_in_hero_page ? 'On' : 'Off'}</span>
                         </div>
                       </td>

                        {/* Game Type — combined: row 1 branded/promogames toggle, row 2 force-login toggle */}
                        <td className="center" style={{minWidth:115}} onClick={e => e.stopPropagation()}>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                            <div className="gp-toggle-wrap">
                              <button
                                className={`gp-toggle ${game.game_type === 'branded' ? 'on' : 'off'}`}
                                title={game.game_type === 'branded' ? 'Switch to PromoGames' : 'Switch to branded'}
                                onClick={e => { e.stopPropagation(); handleGameTypeToggle(game, e) }}
                              />
                              <span className="gp-toggle-label">{game.game_type === 'branded' ? 'Branded' : 'PromoGames'}</span>
                            </div>
                            <div className="gp-toggle-wrap">
                              <button
                                className={`gp-toggle ${game.force_login ? 'on' : 'off'}`}
                                title={game.force_login ? 'Require login to save progress' : 'Guests can finish without prompt'}
                                onClick={e => { e.stopPropagation(); toggleField(game, 'force_login') }}
                              />
                              <span className="gp-toggle-label">{game.force_login ? 'Login' : 'No-prompt'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                      <td className="center" style={{minWidth:80}} onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{
                            padding:'3px 10px', borderRadius:100, fontSize:10.5, fontWeight:700,
                            background: (STATUS_META[game.status]||STATUS_META.development).bg,
                            color: (STATUS_META[game.status]||STATUS_META.development).color,
                          }}>
                            {(STATUS_META[game.status]||STATUS_META.development).label}
                          </span>
                          <button
                            style={{
                              padding:'3px 8px', borderRadius:6, border:'1.5px solid var(--border)',
                              background:'var(--surface)', fontSize:10, fontWeight:600, cursor:'pointer',
                              fontFamily:'DM Sans', color:'var(--text2)', transition:'all .13s',
                            }}
                            onClick={e => handleStatusToggle(game, e)}
                            onMouseOver={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.color='var(--primary)'}}
                            onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}
                          >
                            Cycle →
                          </button>
                        </div>
                      </td>

                      {/* Created / Edited */}
                      <td style={{minWidth:130,fontSize:11.5,color:' var(--text3)',whiteSpace:'nowrap'}}>
                        <div>Created {fmtDate(game.created_at)}</div>
                        {game.updated_at && new Date(game.updated_at).getTime() !== new Date(game.created_at).getTime() && (
                          <div style={{color:' var(--text2)',marginTop:2}}>
                            Edited {fmtDate(game.updated_at)}
                            {game.updated_by_name && <span> by {game.updated_by_name}</span>}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="center" style={{minWidth:100}} onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
                          <div style={{display:'flex',alignItems:'center',gap:5}}>
                            <button className="gp-icon-btn" onClick={e => { e.stopPropagation(); handleDuplicateClick(game) }} title="Duplicate">
                              <Ico.copy/>
                            </button>
                            <button className="gp-ghost-btn" style={{background:' var(--text)',color:' var(--surface)',borderColor:' var(--text)',padding:'4px 10px',justifyContent:'center',fontSize:10.5,gap:3}}
                              onClick={() => {
                                if (game.category === 'crossword') navigate(`/dashboard/games/${game.id}/crossword-builder`)
                                else if (game.category === 'spin') navigate(`/dashboard/games/${game.id}/spin-builder`)
                                else if (game.category === 'memory') navigate(`/dashboard/games/${game.id}/memory-builder`)
                                else if (game.category === 'jigsaw') navigate(`/dashboard/games/${game.id}/jigsaw-builder`)
                                else if (game.category === 'wordsearch') navigate(`/dashboard/games/${game.id}/wordsearch-builder`)
                                else if (game.category === 'pouring') navigate(`/dashboard/games/${game.id}/pouring-builder`)
                                else if (game.category === 'typer') navigate(`/dashboard/games/${game.id}/typer-builder`)
                                else if (game.category === 'screw') navigate(`/dashboard/games/${game.id}/screw-builder`)
                                else if (game.category === 'tower') navigate(`/dashboard/games/${game.id}/tower-builder`)
                                else if (game.category === 'math') navigate(`/dashboard/games/${game.id}/math-builder`)
                                else if (game.category === 'maze') navigate(`/dashboard/games/${game.id}/maze-builder`)
                                else if (game.category === '2048') navigate(`/dashboard/games/${game.id}/2048-builder`)
                                else if (game.category === 'snake') navigate(`/dashboard/games/${game.id}/snake-builder`)
                                else if (game.category === 'nagaraja') navigate(`/dashboard/games/${game.id}/nagaraja-builder`)
                                else if (game.category === 'catch') navigate(`/dashboard/games/${game.id}/catch-builder`)
                                else if (game.category === 'reaction') navigate(`/dashboard/games/${game.id}/reaction-builder`)
                                else if (game.category === 'simon') navigate(`/dashboard/games/${game.id}/simon-builder`)
                                else if (game.category === 'flappy') navigate(`/dashboard/games/${game.id}/flappy-builder`)
                                else if (game.category === 'bounce') navigate(`/dashboard/games/${game.id}/bounce-builder`)
                                else if (game.category === 'space') navigate(`/dashboard/games/${game.id}/space-builder`)
                                else if (game.category === 'connect4') navigate(`/dashboard/games/${game.id}/connect4-builder`)
                                else if (game.category === 'bejeweled') navigate(`/dashboard/games/${game.id}/bejeweled-builder`)
                                else if (game.category === 'tetris') navigate(`/dashboard/games/${game.id}/tetris-builder`)
                                else if (game.category === 'stack') navigate(`/dashboard/games/${game.id}/stack-builder`)
                                else if (game.category === 'bowling') navigate(`/dashboard/games/${game.id}/bowling-builder`)
                                else if (game.category === 'sudoku') navigate(`/dashboard/games/${game.id}/sudoku-builder`)
                                else if (game.category === 'minesweeper') navigate(`/dashboard/games/${game.id}/minesweeper-builder`)
                                else if (game.category === 'wordscramble') navigate(`/dashboard/games/${game.id}/wordscramble-builder`)
                                else if (game.category === 'rps') navigate(`/dashboard/games/${game.id}/rps-builder`)
                                else if (game.category === 'whackamole') navigate(`/dashboard/games/${game.id}/whackamole-builder`)
                                else if (game.category === 'hanoi') navigate(`/dashboard/games/${game.id}/hanoi-builder`)
                                else if (game.category === 'breakout') navigate(`/dashboard/games/${game.id}/breakout-builder`)
                                else if (game.category === 'bubbleshooter') navigate(`/dashboard/games/${game.id}/bubbleshooter-builder`)
                                else if (game.category === 'carlaunch') navigate(`/dashboard/games/${game.id}/carlaunch-builder`)
                                else if (game.category === 'arrowescape') navigate(`/dashboard/games/${game.id}/arrowescape-builder`)
                                else if (game.category === 'frustration' || game.category === 'stressbuster') navigate(`/dashboard/games/${game.id}/frustration-builder`)
                                else if (game.category === 'soundify') navigate(`/dashboard/games/${game.id}/soundify-builder`)
                                else if (game.category === 'tictactoe') navigate(`/dashboard/games/${game.id}/tictactoe-builder`)
                                else if (game.category === 'chess') navigate(`/dashboard/games/${game.id}/chess-builder`)
                                else if (game.category === 'snakeandladder') navigate(`/dashboard/games/${game.id}/snakeandladder-builder`)
                                else if (game.category === 'ludo') navigate(`/dashboard/games/${game.id}/ludo-builder`)
                                else if (['Carrom', 'carrom'].includes(game.category)) navigate(`/dashboard/games/${game.id}/Carrom-builder`)
                                else if (game.category === 'classicmaze') navigate(`/dashboard/games/${game.id}/classicmaze-builder`)
                                else if (game.category === 'stickmaze') navigate(`/dashboard/games/${game.id}/stickmaze-builder`)
                                else if (game.category === 'tictactoemultiplayer') navigate(`/dashboard/games/${game.id}/tictactoemultiplayer-builder`)
                                else if (game.category === 'spotregistration') navigate(`/dashboard/games/${game.id}/spotreg-builder`)
                                else navigate(`/dashboard/games/${game.id}/builder`)
                              }} title="Builder">
                              <Ico.wrench/> Builder
                            </button>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:5}}>
                            <button className="gp-icon-btn" onClick={() => navigate(`/dashboard/games/${game.id}/responses`)} title="Responses">
                              <Ico.chart/>
                            </button>
                            <button className="gp-icon-btn" onClick={e => copyLink(game, e)} title="Copy link">
                              <Ico.link/>
                            </button>
                            <button className="gp-icon-btn del" onClick={e => { e.stopPropagation(); handleDelete(game.id) }} title="Delete">
                              <Ico.trash/>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* QR */}
                      <td className="center" style={{minWidth:50}} onClick={e => e.stopPropagation()}>
                        <button className="gp-icon-btn" onClick={() => setQrModalGame(game)} title="Show QR Code">
                          <Ico.qr/>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Table footer */}
            <div style={{padding:'12px 16px',borderTop:'1px solid  var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between',background:' var(--surface2)'}}>
              <span style={{fontSize:12,color:' var(--text3)'}}>
                Showing {sorted.length} of {games.length} game{games.length!==1?'s':''}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:16,marginTop:20}}>
            {[
              { label:'Active Games', value: stats.active, color:' var(--primary)' },
              { label:'On Play Page', value: stats.onPlayPage, color:' var(--success)' },
              { label:'On Hero', value: stats.onHero, color:' var(--warning)' },
              { label:'Total Plays', value: stats.plays.toLocaleString(), color:' var(--text)' },
              { label:'Branded', value: stats.branded, color:' var(--success)' },
              { label:'PromoGames', value: stats.promogames, color:' var(--warning)' },
              { label:'Live', value: games.filter(g=>g.status==='live').length, color:' var(--success)' },
            ].map(s => (
              <div key={s.label} style={{background:' var(--surface)',borderRadius:12,border:'1.5px solid  var(--border)',padding:'16px 20px'}}>
                <div style={{fontSize:11,fontWeight:700,color:' var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:22,fontWeight:700,color:s.color,fontFamily:"'Fraunces',serif"}}>{s.value}</div>
              </div>
            ))}
          </div>
          </>
        ) : viewMode === 'graph' ? (
          /* ─── GRAPHICAL TIMELINE TREE ─── */
          <GraphView
            clients={graphClient === 'all' ? clients : clients.filter(c => c.id === Number(graphClient))}
            games={sorted}
            onSelect={(g) => setSelectedGame(g)}
          />
        ) : (
          /* ─── TREE VIEW (Masonry Grid by Client) ─── */
          <div style={{columnCount:4,columnGap:16}}>
            {clients.filter(c => sorted.some(g => g.client_id === c.id) || sorted.some(g => !g.client_id)).map((client, ci) => {
              const clientGames = sorted.filter(g => g.client_id === client.id)
              const templates = clientGames.filter(g => !g.parent_game_id)
              const locations = clientGames.filter(g => g.parent_game_id)
              if (clientGames.length === 0) return null
              return (
                <div key={client.id} style={{breakInside:'avoid',marginBottom:16,background:'var(--surface)',borderRadius:16,border:'1.5px solid var(--border)',overflow:'hidden',animation:`crmFadeUp .3s ease ${ci*40}ms both`}}>
                  {/* Client header */}
                  <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border-light)',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:36,height:36,borderRadius:8,background:'linear-gradient(135deg,#6366f1,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14,fontWeight:700,flexShrink:0}}>
                      {client.company_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{client.company_name}</div>
                       <div style={{fontSize:10,color:'var(--text3)',marginTop:1}}>{templates.length} master game{templates.length!==1?'s':''} · {locations.length} location{locations.length!==1?'s':''}</div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div style={{padding:'8px 12px',display:'flex',gap:6,borderBottom:'1px solid var(--border-light)'}}>
                    <button onClick={() => navigate(`/dashboard/games/${templates[0]?.id}/responses`)} style={{flex:1,padding:'6px 0',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',fontSize:10,fontWeight:600,cursor:'pointer',color:'var(--text)',fontFamily:'inherit'}}>
                      📊 Responses
                    </button>
                    <button onClick={() => setSelectedClient(selectedClient?.id===client.id?null:client)} style={{flex:1,padding:'6px 0',borderRadius:6,border:`1px solid ${selectedClient?.id===client.id?'var(--primary)':'var(--border)'}`,background:selectedClient?.id===client.id?'var(--primary-bg)':'var(--surface)',fontSize:10,fontWeight:600,cursor:'pointer',color:selectedClient?.id===client.id?'var(--primary)':'var(--text)',fontFamily:'inherit'}}>
                      {selectedClient?.id===client.id?'▾ Expanded':'▸ Expand'}
                    </button>
                  </div>
                  {/* Game list - hidden until expanded */}
                  {selectedClient?.id === client.id && (
                  <div style={{padding:'6px 10px'}}>
                    {templates.map(g => {
                      const isExpanded = expandedParents[g.id]
                      const childLocs = locations.filter(l => l.parent_game_id === g.id)
                      return (
                        <div key={g.id}>
                          <div onClick={() => childLocs.length > 0 ? setExpandedParents(p => ({...p,[g.id]:!p[g.id]})) : setSelectedGame(g)}
                            style={{padding:'7px 8px',borderRadius:6,marginBottom:3,cursor:'pointer',border:'1px solid var(--border-light)',background:'var(--surface2)',transition:'all .12s'}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.background='var(--primary-bg)'}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.background='var(--surface2)'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <div style={{fontWeight:700,fontSize:11,color:'var(--text)',display:'flex',alignItems:'center',gap:4}}>
                                {childLocs.length > 0 && <span style={{fontSize:8,color:'var(--text3)',transition:'transform .2s',transform:isExpanded?'rotate(90deg)':'rotate(0deg)',display:'inline-block'}}>▶</span>}
                                {g.name}
                              </div>
                              <span style={{fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:3,background:g.is_active?'var(--chip-green-bg)':'var(--border-light)',color:g.is_active?'var(--chip-green-fg)':'var(--text3)'}}>{g.status||'Draft'}</span>
                            </div>
                            <div style={{fontSize:9,color:'var(--text2)',marginTop:1}}>{g.category} · {g.question_count||0}q · {g.play_count||0}p</div>
                          </div>
                          {isExpanded && childLocs.map(loc => (
                            <div key={loc.id} onClick={() => setSelectedGame(loc)}
                              style={{marginLeft:12,marginBottom:3,padding:'5px 8px',borderRadius:5,border:'1px solid var(--border-light)',background:'var(--surface2)',cursor:'pointer',transition:'all .12s'}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.background='var(--primary-bg)'}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.background='var(--surface2)'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <div style={{fontSize:10,fontWeight:600,color:'var(--text)'}}>↳ {loc.location_name||loc.name}</div>
                                <span style={{fontSize:7,fontWeight:700,padding:'1px 4px',borderRadius:3,background:loc.is_active?'var(--chip-green-bg)':'var(--border-light)',color:loc.is_active?'var(--chip-green-fg)':'var(--text3)'}}>{loc.status||'Draft'}</span>
                              </div>
                              <div style={{fontSize:8,color:'var(--text3)',marginTop:1}}>{loc.question_count||0}q · {loc.play_count||0}p</div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                    {templates.length === 0 && (
                      <div style={{fontSize:10,color:'var(--text3)',padding:'8px 0',textAlign:'center'}}>No games</div>
                    )}
                  </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Game Detail / Control Modal (reused by table, tree & graph) */}
      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onBuilder={navigateBuilder}
          onResponses={(g) => navigate(`/dashboard/games/${g.id}/responses`)}
          onQr={(g) => setQrModalGame(g)}
          onCopyLink={copyLink}
          onToggle={toggleField}
          onStatusToggle={handleStatusToggle}
          onGameTypeToggle={handleGameTypeToggle}
          onDuplicate={handleDuplicateClick}
          onDelete={handleDelete}
        />
      )}

      {/* Duplicate into client modal (admin) */}
      {dupTarget && (
        <DuplicateGameModal
          game={dupTarget}
          clients={clients}
          onClose={() => setDupTarget(null)}
          onCreated={handleDupCreated}
          onError={msg => showToast(msg,'error')}
        />
      )}

      {showForm && !showClientForm && (
        <CreateModal
          clients={clients}
          onClose={() => setShowForm(false)}
          onCreated={load}
          onError={msg => showToast(msg,'error')}
          onAddClient={() => setShowClientForm(true)}
        />
      )}
      {showClientForm && (
        <QuickAddClientModal
          onClose={() => setShowClientForm(false)}
          onCreated={client => {
            setShowClientForm(false)
            setClients(prev => [client, ...prev])
          }}
          onError={msg => showToast(msg,'error')}
        />
      )}
      {qrModalGame && (
        <QRCodeModal game={qrModalGame} onClose={() => setQrModalGame(null)} onError={msg => showToast(msg,'error')} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}