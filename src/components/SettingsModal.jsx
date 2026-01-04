import React, { useState, useEffect } from 'react';
import styles from './SettingsModal.module.css';
import { resetAllData } from '../utils/storage';

const SettingsModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('data');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleReset = async () => {
        try {
            await resetAllData();
            setShowResetConfirm(false);
            // Close settings modal after successful reset
            onClose();
            // Reload the page to reflect the reset state
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset data:', error);
        }
    };

    // Handle keyboard events for reset confirmation
    useEffect(() => {
        if (!showResetConfirm) return;

        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleReset();
            } else if (e.key === 'Escape') {
                setShowResetConfirm(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showResetConfirm]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !showResetConfirm) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose, showResetConfirm]);

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>×</button>

                <div className={styles.header}>
                    <h2>⚙️ Settings</h2>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={activeTab === 'data' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('data')}
                    >
                        Data Management
                    </button>
                    {/* Future tabs can be added here */}
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'data' && (
                        <div className={styles.dataSection}>
                            <div className={styles.dangerZone}>
                                <h3>⚠️ Danger Zone</h3>
                                <p className={styles.dangerDescription}>
                                    Permanently delete all your typing history, statistics, and saved replays.
                                    This action cannot be undone.
                                </p>
                                <button
                                    className={styles.dangerButton}
                                    onClick={() => setShowResetConfirm(true)}
                                >
                                    🗑️ Reset All Stats
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reset Confirmation Dialog */}
                {showResetConfirm && (
                    <div className={styles.confirmOverlay}>
                        <div className={styles.confirmDialog}>
                            <h3 className={styles.confirmTitle}>⚠️ Confirm Reset</h3>
                            <p className={styles.confirmText}>
                                This will permanently delete all your typing history, stats, and replays.
                                This action cannot be undone.
                            </p>
                            <div className={styles.confirmButtons}>
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => setShowResetConfirm(false)}
                                >
                                    Cancel <span className={styles.shortcut}>(Esc)</span>
                                </button>
                                <button
                                    className={styles.confirmButton}
                                    onClick={handleReset}
                                >
                                    Yes, Reset Everything <span className={styles.shortcut}>(Enter)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;
