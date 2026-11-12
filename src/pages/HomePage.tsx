import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
    const { login } = useGame();
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState(''); // Placeholder for now

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = username.trim();
        if (!trimmed) return;

        const userId = trimmed.toLowerCase().replace(/\s/g, '_');
        login(userId);
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className="flex justify-center mb-4">
                    {/* SVG Drill Icon (Inline for now or component) */}
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                </div>
                <h1 className={styles.heroTitle}>DeepMine</h1>
                <p className={styles.motto}>"Go down, find the revelation"</p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            className={styles.input}
                            placeholder="Captain Name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className={styles.input}
                            placeholder="Secret Code"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className={styles.buttonPrimary}>
                        {isRegistering ? 'Start Operation' : 'Resume Mining'}
                    </button>
                </form>

                <p className={styles.toggleText}>
                    {isRegistering ? "Already have a permit? " : "New to the core? "}
                    <button
                        className={styles.toggleLink}
                        onClick={() => setIsRegistering(!isRegistering)}
                    >
                        {isRegistering ? 'Login' : 'Register'}
                    </button>
                </p>
            </div>
        </div>
    );
};
