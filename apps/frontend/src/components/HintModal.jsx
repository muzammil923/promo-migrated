import React from 'react';

const HintModal = ({ isOpen, onClose, words, numberMap, color }) => {
  if (!isOpen) return null;

  // Group words by direction
  const acrossWords = words.filter(w => w.direction === 'across').sort((a, b) => {
    if (a.start_row !== b.start_row) return a.start_row - b.start_row;
    return a.start_col - b.start_col;
  });

  const downWords = words.filter(w => w.direction === 'down').sort((a, b) => {
    if (a.start_row !== b.start_row) return a.start_row - b.start_row;
    return a.start_col - b.start_col;
  });

  const getNumber = (word) => {
    const key = `${word.start_row},${word.start_col}`;
    return numberMap[key] || '';
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000,
        padding: '20px',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '32px 28px',
          animation: 'fadeIn 0.3s ease',
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💡</div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', color: '#1a1a2e', letterSpacing: '-0.02em' }}>
            Crossword Clues
          </h2>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
            All clues to help you solve the puzzle
          </p>
        </div>

        {/* Across Clues */}
        {acrossWords.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 800, 
              color: color || '#7c3aed', 
              marginBottom: '16px',
              borderBottom: `3px solid ${color || '#7c3aed'}`,
              paddingBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              ➡️ Across
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {acrossWords.map((word) => (
                <div 
                  key={word.id} 
                  style={{
                    background: '#f8f9fa',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${color || '#7c3aed'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ 
                      fontWeight: 900, 
                      fontSize: '16px', 
                      color: color || '#7c3aed',
                      minWidth: '32px',
                      textAlign: 'center',
                      background: 'rgba(124, 58, 237, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}>
                      {getNumber(word)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontSize: '15px', 
                        color: '#1a1a2e', 
                        lineHeight: 1.5,
                        margin: 0,
                        fontWeight: 500
                      }}>
                        {word.clue_text || word.hint_text || 'No clue provided'}
                      </p>
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#999', 
                        marginTop: '6px',
                        fontWeight: 600
                      }}>
                        {word.word_text?.length || 0} letters
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Down Clues */}
        {downWords.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 800, 
              color: color || '#7c3aed', 
              marginBottom: '16px',
              borderBottom: `3px solid ${color || '#7c3aed'}`,
              paddingBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              ⬇️ Down
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {downWords.map((word) => (
                <div 
                  key={word.id} 
                  style={{
                    background: '#f8f9fa',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${color || '#7c3aed'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ 
                      fontWeight: 900, 
                      fontSize: '16px', 
                      color: color || '#7c3aed',
                      minWidth: '32px',
                      textAlign: 'center',
                      background: 'rgba(124, 58, 237, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}>
                      {getNumber(word)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontSize: '15px', 
                        color: '#1a1a2e', 
                        lineHeight: 1.5,
                        margin: 0,
                        fontWeight: 500
                      }}>
                        {word.clue_text || word.hint_text || 'No clue provided'}
                      </p>
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#999', 
                        marginTop: '6px',
                        fontWeight: 600
                      }}>
                        {word.word_text?.length || 0} letters
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: '14px',
            border: 'none',
            background: `linear-gradient(135deg, ${color || '#7c3aed'}, ${color ? color + 'dd' : '#a855f7'})`,
            color: '#fff',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(124, 58, 237, 0.4)',
            transition: 'transform 0.2s ease',
            marginTop: '8px'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default HintModal;
