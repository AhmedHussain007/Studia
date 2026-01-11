import { db } from './database';

export const initDB = () => {
    try {
        db.execSync(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                password TEXT NOT NULL,
                total_seconds INTEGER NOT NULL DEFAULT 12960000
            );
        `);

        // 3600 hours = 12,960,000 seconds
        db.runSync(
            `INSERT OR IGNORE INTO users (id, password, total_seconds) VALUES (?, ?, ?);`,
            [1, "Ahmed32104&", 12960000]
        );
        console.log("DB Initialized with 3600 Hours (in seconds).");
    } catch (error) {
        console.error("DB Init Error:", error);
    }
};


/**
 * Persists the updated time to the database.
 * @param {number} newSeconds - The new remaining seconds to save.
 */
export const updateSecondsInDB = (newSeconds) => {
    try {
        db.runSync(
            `UPDATE users SET total_seconds = ? WHERE id = 1;`,
            [newSeconds]
        );
        // Optional: console.log("Progress saved to DB:", newSeconds);
    } catch (error) {
        console.error("Error updating seconds in DB:", error);
    }
};

export const getTotalSeconds = () => {
    try {
        const row = db.getFirstSync(`SELECT total_seconds FROM users WHERE id = 1;`);
        return row ? row.total_seconds : 12960000;
    } catch (error) {
        return 12960000;
    }
};

export const checkPassword = (inputPassword) => {
    try {
        const row = db.getFirstSync(`SELECT password FROM users WHERE id = 1;`);
        return row && row.password === inputPassword;
    } catch (error) {
        return false;
    }
};

export const adjustSecondsInDB = (deltaSeconds) => {
    try {
        db.runSync(
            `UPDATE users SET total_seconds = total_seconds + ? WHERE id = 1;`,
            [deltaSeconds]
        );
    } catch (error) {
        console.error("Error adjusting seconds in DB:", error);
    }
};
