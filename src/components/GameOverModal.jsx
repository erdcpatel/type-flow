import React, { useEffect } from 'react';

const GameOverModal = ({ onRestart }) => {
    // Handle Enter key press
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                onRestart();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onRestart]);

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(50, 0, 0, 0.8)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: '#2a0000', border: '2px solid #ff4444',
                padding: '2rem', borderRadius: '16px', textAlign: 'center',
                color: '#ff4444'
            }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💀 GAME OVER</h2>
                <p style={{ marginBottom: '2rem', color: '#ffaaaa' }}>Sudden Death Mode: One mistake ends it all.</p>
                <button
                    onClick={onRestart}
                    style={{
                        padding: '0.75rem 2rem', background: '#ff4444', color: 'white',
                        border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    Try Again <span style={{ opacity: 0.7, fontSize: '0.85em' }}>(Press Enter)</span>
                </button>
            </div>
        </div>
    );
};

export default GameOverModal;
