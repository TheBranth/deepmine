import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
    const { addPlayer, login } = useGame();
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState(''); // Placeholder for now

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) return;

        // Simulate login/register by adding a player and setting current user
        // In a real app, this would talk to Supabase
        const newPlayer = {
            id: username.toLowerCase().replace(/\s/g, '_'),
            name: username,
            resources: { water: 0, food: 0, energy: 0, fuel: 0, credits: 500 },
            inventory: { soil: 0, rock: 0, mineral: 100, bananium: 0 },
            crew: [
                {
                    id: `c-${Date.now()}-1`,
                    name: 'Chief Drill',
                    type: 'miner' as const,
                    state: 'idle' as const,
                    currentTileId: null,
                    stats: { digSpeed: 1.5, prospectiveSpeed: 1.0 },
                },
                {
                    id: `c-${Date.now()}-2`,
                    name: 'Scout Bob',
                    type: 'scientist' as const,
                    state: 'idle' as const,
                    currentTileId: null,
                    stats: { digSpeed: 1.0, prospectiveSpeed: 1.5 },
                },
            ],
        };

        addPlayer(newPlayer);
        login(newPlayer.id);
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
