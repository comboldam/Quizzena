import React from 'react';

/**
 * Flags Quiz Card - Floating Circular Design
 * Matches Premier League and Champions League card style
 * 
 * Usage: <FlagsCard image="https://your-uizard-url.png" />
 */

const styles = {
  // Card container
  CardTopic: {
    width: '130px',
    height: '165px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '10px',
    position: 'relative',
    cursor: 'pointer',
  },
  
  // Green glow behind circle
  CardGlow: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '110px',
    height: '110px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, rgba(52, 211, 153, 0.3) 40%, transparent 70%)',
    filter: 'blur(15px)',
    borderRadius: '50%',
    animation: 'floatingGlow 3s ease-in-out infinite',
    zIndex: 0,
  },
  
  // Circular image container
  CardCircle: {
    width: '106px',
    height: '106px',
    borderRadius: '50%',
    position: 'relative',
    zIndex: 1,
    background: 'linear-gradient(135deg, #34d399 0%, #059669 50%, #10b981 100%)',
    boxShadow: '0 0 15px rgba(52, 211, 153, 0.4), 0 0 30px rgba(5, 150, 105, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  
  // Image inside circle
  CardImage: {
    width: '130%',
    height: '130%',
    objectFit: 'cover',
    objectPosition: 'center 40%',
    borderRadius: '50%',
  },
  
  // Title below circle
  CardTitle: {
    color: '#34d399',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '0.65rem',
    fontWeight: 700,
    marginTop: '12px',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textShadow: '0 0 10px rgba(52, 211, 153, 0.5)',
  },
};

// Default Uizard placeholder - replace with your generated image
const defaultProps = {
  image: 'https://assets.api.uizard.io/api/cdn/stream/YOUR_FLAGS_IMAGE_ID.png',
};

const FlagsCard = (props) => {
  return (
    <button style={styles.CardTopic}>
      <div style={styles.CardGlow} />
      <div style={styles.CardCircle}>
        <img 
          src={props.image ?? defaultProps.image} 
          alt="Flags"
          style={styles.CardImage}
        />
      </div>
      <div style={styles.CardTitle}>Flags</div>
    </button>
  );
};

export default FlagsCard;


/**
 * CSS Animation (add to your global CSS):
 * 
 * @keyframes floatingGlow {
 *   0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
 *   50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
 * }
 */




