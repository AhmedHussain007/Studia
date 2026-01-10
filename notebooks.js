import { db } from './database';

export const initNotebookTables = () => {
    try {
        // Table for Notebooks
        db.execSync(`
            CREATE TABLE IF NOT EXISTS notebooks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                icon TEXT NOT NULL,
                color TEXT NOT NULL,
                createdAt TEXT NOT NULL
            );
        `);
        // Table for Notes
        db.execSync(`
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                notebook_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                date TEXT NOT NULL,
                FOREIGN KEY (notebook_id) REFERENCES notebooks (id) ON DELETE CASCADE
            );
        `);
    } catch (error) {
        console.error("Notebook DB Init Error:", error);
    }
};

// --- Notebook Operations ---
export const getNotebooks = () => {
    try {
        // This query also counts how many notes are in each notebook
        return db.getAllSync(`
            SELECT n.*, COUNT(nt.id) as noteCount
            FROM notebooks n
            LEFT JOIN notes nt ON n.id = nt.notebook_id
            GROUP BY n.id
            ORDER BY n.id DESC
        `);
    } catch (error) {
        return [];
    }
};

export const addNotebook = (title, icon, color) => {
    const now = new Date().toISOString();
    db.runSync(
        `INSERT INTO notebooks (title, icon, color, createdAt) VALUES (?, ?, ?, ?)`,
        [title, icon, color, now]
    );
};

export const deleteNotebook = (id) => {
    try {
        // This will automatically delete all notes in this notebook due to ON DELETE CASCADE
        db.runSync(`DELETE FROM notebooks WHERE id = ?`, [id]);
    } catch (error) {
        console.error("Delete Notebook Error:", error);
    }
};

export const updateNotebook = (id, title, icon, color) => {
    try {
        db.runSync(
            `UPDATE notebooks SET title = ?, icon = ?, color = ? WHERE id = ?`,
            [title, icon, color, id]
        );
    } catch (error) {
        console.error("Update Notebook Error:", error);
    }
};

// --- Note Operations ---
export const getNotesByNotebook = (notebookId) => {
    return db.getAllSync(`SELECT * FROM notes WHERE notebook_id = ? ORDER BY id DESC`, [notebookId]);
};

export const getNoteById = (noteId) => {
    return db.getFirstSync(`SELECT * FROM notes WHERE id = ?`, [noteId]);
};

export const addNote = (notebookId, title, content) => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // e.g. 12 Jan
    db.runSync(
        `INSERT INTO notes (notebook_id, title, content, date) VALUES (?, ?, ?, ?)`,
        [notebookId, title, content, today]
    );
};

export const deleteNote = (id) => {
    db.runSync(`DELETE FROM notes WHERE id = ?`, [id]);
};

export const updateNote = (id, title, content) => {
    try {
        db.runSync(
            `UPDATE notes SET title = ?, content = ? WHERE id = ?`,
            [title, content, id]
        );
    } catch (error) {
        console.error("Update Note Error:", error);
    }
};
