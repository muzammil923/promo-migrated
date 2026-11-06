export const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

  :root {
    --glass-bg: rgba(255, 255, 255, 0.06);
    --glass-border: rgba(255, 255, 255, 0.1);
    --neon-purple: #a855f7;
    --neon-glow: 0 8px 32px rgba(139, 92, 246, 0.25);
    --deep-bg: #0f0720;
  }

  body {
    background: var(--deep-bg);
    font-family: 'Outfit', sans-serif;
    color: #fff;
    margin: 0;
    overflow-x: hidden;
  }

  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    box-shadow: var(--neon-glow);
  }

  .neon-text {
    color: var(--neon-purple);
    text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  }

  .btn-premium {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: #fff;
    border: none;
    border-radius: 16px;
    padding: 12px 24px;
    font-weight: 700;
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn-premium:active {
    transform: scale(0.95);
  }

  .capsule-nav-container {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 40px);
    max-width: 400px;
    height: 72px;
    background: rgba(15, 7, 32, 0.3);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 100px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0 10px;
    z-index: 2000;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.15);
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: rgba(255, 255, 255, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
    font-size: 10px;
    font-weight: 700;
    flex: 1;
    cursor: pointer;
    position: relative;
  }

  .nav-item.active {
    color: #fff;
  }

  .nav-item.active .nav-icon {
    color: var(--neon-purple);
    transform: translateY(-4px);
    filter: drop-shadow(0 0 8px var(--neon-purple));
  }

  .nav-item.active span {
    color: #fff;
    text-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
  }

  .nav-item:not(.active):hover .nav-icon {
    color: rgba(255, 255, 255, 0.8);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 0 20px 24px;
  }

  @media (min-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
  }

  @media (min-width: 1024px) {
    .btn-desktop-auto {
      width: auto !important;
      min-width: 200px;
      margin: 24px auto 0 !important;
      padding: 12px 32px !important;
    }
  }

  .challenges-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  @media (min-width: 1024px) {
    .challenges-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 0 20px 24px;
    }
    .challenges-grid > div {
      margin: 0 !important;
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }

  @keyframes rotate-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .animate-float { animation: float 3s ease-in-out infinite; }
  .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
  .animate-rotate { animation: rotate-slow 20s linear infinite; }

  .game-card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 40px;
  }

  @media (min-width: 768px) {
    .game-card-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
  }

  .premium-game-card {
    width: 100%;
    aspect-ratio: 280 / 420;
    height: auto;
    background: rgba(15, 7, 32, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(168, 85, 247, 0.3);
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 768px) {
    .premium-game-card {
      width: 280px;
      height: 420px;
      aspect-ratio: auto;
      border-radius: 24px;
    }
  }

  .premium-game-card:hover {
    transform: translateY(-8px);
    border-color: #a855f7;
    box-shadow: 0 15px 45px rgba(139, 92, 246, 0.3), 0 0 20px rgba(168, 85, 247, 0.2);
  }

  .premium-game-card .image-container {
    height: 65%;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .premium-game-card .image-container.logo-container {
    width: auto;
    margin: 20px 20px 0;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.92);
    border-radius: 18px;
    box-sizing: border-box;
  }

  .premium-game-card .game-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .premium-game-card .game-image.logo-image {
    object-fit: contain;
  }

  .premium-game-card:hover .game-image {
    transform: scale(1.08);
  }

  .premium-game-card .card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 20%, rgba(15, 7, 32, 0.95) 100%);
  }

  .premium-game-card .reward-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(34, 197, 94, 0.9);
    color: #fff;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 800;
    backdrop-filter: blur(4px);
    z-index: 2;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  }

  @media (min-width: 768px) {
    .premium-game-card .reward-badge {
      top: 16px;
      right: 16px;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
    }
  }

  .premium-game-card .category-pill {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(168, 85, 247, 0.8);
    color: #fff;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    z-index: 2;
    backdrop-filter: blur(4px);
  }

  @media (min-width: 768px) {
    .premium-game-card .category-pill {
      top: 16px;
      left: 16px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 10px;
      letter-spacing: 1px;
    }
  }

  .premium-game-card .content {
    padding: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    position: relative;
    z-index: 2;
  }

  @media (min-width: 768px) {
    .premium-game-card .content {
      padding: 20px;
    }
  }

  .premium-game-card .game-title {
    font-size: 14px;
    font-weight: 800;
    margin-bottom: 4px;
    line-height: 1.2;
    background: linear-gradient(to right, #fff, rgba(255,255,255,0.7));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (min-width: 768px) {
    .premium-game-card .game-title {
      font-size: 20px;
      margin-bottom: 8px;
    }
  }

  .premium-game-card .metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 9px;
    color: rgba(255,255,255,0.5);
    font-weight: 600;
  }

  @media (min-width: 768px) {
    .premium-game-card .metadata {
      gap: 12px;
      font-size: 11px;
    }
  }

  .premium-game-card .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .premium-game-card .card-index-number {
    position: absolute;
    bottom: -15px;
    right: -5px;
    font-size: 100px;
    font-weight: 900;
    line-height: 1;
    color: rgba(255, 255, 255, 0.05);
    z-index: 1;
    pointer-events: none;
    font-family: 'Outfit', sans-serif;
    transition: all 0.4s ease;
  }

  .premium-game-card:hover .card-index-number {
    color: rgba(168, 85, 247, 0.15);
    transform: scale(1.1) translateX(-10px);
  }

  .premium-game-card .share-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: none;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(6px);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity .2s ease;
  }
  .premium-game-card:hover .share-btn {
    opacity: 1;
  }
  .premium-game-card .share-btn:hover {
    background: rgba(168, 85, 247, 0.45);
  }

  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
