import { db } from './database';

export const initTaskTable = () => {
    try {
        db.execSync(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                priority TEXT DEFAULT 'Medium',
                purpose TEXT,
                description TEXT,
                status INTEGER DEFAULT 0,
                date TEXT NOT NULL
            );
        `);
    } catch (error) {
        console.error("Task DB Init Error:", error);
    }
};

export const getTasksByDate = (date) => {
    try {
        // Sorting by status ASC (0 first, then 1) and id DESC (newest first)
        return db.getAllSync(`SELECT * FROM tasks WHERE date = ? ORDER BY status ASC, id DESC`, [date]);
    } catch (error) {
        return [];
    }
};

export const addTask = (task) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        db.runSync(
            `INSERT INTO tasks (title, priority, purpose, description, date, status) VALUES (?, ?, ?, ?, ?, 0)`,
            [task.title, task.priority, task.purpose, task.description, today]
        );
    } catch (error) {
        console.error("Add Task Error:", error);
    }
};

export const updateTask = (id, task) => {
    try {
        db.runSync(
            `UPDATE tasks SET title = ?, priority = ?, purpose = ?, description = ? WHERE id = ?`,
            [task.title, task.priority, task.purpose, task.description, id]
        );
    } catch (error) {
        console.error("Update Task Error:", error);
    }
};

export const deleteTask = (id) => {
    try {
        db.runSync(`DELETE FROM tasks WHERE id = ?`, [id]);
    } catch (error) {
        console.error("Delete Task Error:", error);
    }
};

export const toggleTaskStatus = (id, currentStatus) => {
    try {
        const newStatus = currentStatus === 0 ? 1 : 0;
        db.runSync(`UPDATE tasks SET status = ? WHERE id = ?`, [newStatus, id]);
    } catch (error) {
        console.error("Toggle Task Error:", error);
    }
};
