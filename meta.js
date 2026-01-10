// meta.js
import { db } from './database';

export const initMetaTable = () => {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS app_meta (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);
};

export const getMeta = (key) => {
    const row = db.getFirstSync(
        `SELECT value FROM app_meta WHERE key = ?`,
        [key]
    );
    return row ? row.value : null;
};

export const setMeta = (key, value) => {
    db.runSync(
        `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`,
        [key, value.toString()]
    );
};
