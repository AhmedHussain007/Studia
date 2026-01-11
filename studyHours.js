import { db } from './database';

export const initStudyHoursTable = () => {
    try {
        db.execSync(`
            CREATE TABLE IF NOT EXISTS study_hours (
                date TEXT PRIMARY KEY,      -- YYYY-MM-DD
                year INTEGER,
                month INTEGER,
                daily_goal_seconds INTEGER DEFAULT 36000, -- Default 7h
                fyp_seconds INTEGER DEFAULT 0,
                freelancing_seconds INTEGER DEFAULT 0,
                uni_seconds INTEGER DEFAULT 0,
                career_seconds INTEGER DEFAULT 0,
                total_daily_seconds INTEGER DEFAULT 0
            );
        `);
    } catch (err) {
        console.error("StudyHours table error:", err);
    }
};

export const getTodayStats = (date) => {
    try {
        let row = db.getFirstSync(`SELECT * FROM study_hours WHERE date = ?`, [date]);
        if (!row) {
            const d = new Date(date);
            db.runSync(
                `INSERT INTO study_hours (date, year, month, daily_goal_seconds) VALUES (?, ?, ?, ?)`,
                [date, d.getFullYear(), d.getMonth() + 1, 36000]
            );
            row = db.getFirstSync(`SELECT * FROM study_hours WHERE date = ?`, [date]);
        }
        return row;
    } catch (error) {
        return null;
    }
};

export const incrementStudyTime = (date, category, seconds) => {
    const columnMap = {
        'FYP': 'fyp_seconds',
        'Freelancing': 'freelancing_seconds',
        'Uni': 'uni_seconds',
        'Career': 'career_seconds'
    };
    const column = columnMap[category] || 'uni_seconds';

    try {
        db.runSync(`
            UPDATE study_hours
            SET ${column} = ${column} + ?,
                total_daily_seconds = total_daily_seconds + ?
            WHERE date = ?`,
            [seconds, seconds, date]
        );
    } catch (error) {
        console.error("Update Daily Stats Error:", error);
    }
};

export const getWeeklyStats = () => {
    try {
        // Gets last 7 entries
        return db.getAllSync(`SELECT * FROM study_hours ORDER BY date DESC LIMIT 7`);
    } catch (error) {
        return [];
    }
};

// Add this to studyHours.js
export const getMonthlyAvg = (year, month) => {
    try {
        const row = db.getFirstSync(
            `SELECT AVG(total_daily_seconds) as avg_seconds
             FROM study_hours
             WHERE year = ? AND month = ? AND total_daily_seconds > 0`,
            [year, month]
        );
        return row ? row.avg_seconds : 0;
    } catch (e) { return 0; }
};

export const initYearRows = (year) => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    db.execSync('BEGIN TRANSACTION');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        db.runSync(
            `INSERT OR IGNORE INTO study_hours (date, year, month)
             VALUES (?, ?, ?)`,
            [dateStr, year, d.getMonth() + 1]
        );
    }

    db.execSync('COMMIT');
};

/**
 * Fetches stats for a specific date range (inclusive)
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
export const getStatsForRange = (startDate, endDate) => {
    try {
        return db.getAllSync(
            `SELECT * FROM study_hours
             WHERE date BETWEEN ? AND ?
             ORDER BY date ASC`,
            [startDate, endDate]
        );
    } catch (error) {
        console.error("Range Fetch Error:", error);
        return [];
    }
};


export const adjustDailySeconds = (date, deltaSeconds) => {
    try {
        db.runSync(
            `UPDATE study_hours SET total_daily_seconds = total_daily_seconds + ? WHERE date = ?`,
            [deltaSeconds, date]
        );
    } catch (error) {
        console.error("Update Daily Stats Error:", error);
    }
};
