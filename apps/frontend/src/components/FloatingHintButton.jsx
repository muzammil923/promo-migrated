import React from 'react';

const FloatingHintButton = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        border: 'none',
        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.5)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        zIndex: 10000,
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s ease',
        animation: 'floatHint 3s ease-in-out infinite',
      }}
    >
      <span style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        lineHeight: 1,
      }}>
        💡
      </span>
      <style>{`
        @keyframes floatHint {
          0%, 100% { 
            transform: translateY(0px);
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
          }
          50% { 
            transform: translateY(-12px);
            box-shadow: 0 18px 35px rgba(139, 92, 246, 0.7);
          }
        }
      `}</style>
    </button>
  );
};

export default FloatingHintButton;
