import { db } from './database';

// ENSURE THE NAME MATCHES: initTimetableDB (small 't')
export const initTimetableDB = () => {
    try {
        // Table for the Template Names (e.g., "Eid Timetable")
        db.execSync(`
            CREATE TABLE IF NOT EXISTS timetables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
        `);
        // Table for the 24-hour slots
        db.execSync(`
            CREATE TABLE IF NOT EXISTS timetable_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timetable_id INTEGER,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                activity TEXT NOT NULL,
                FOREIGN KEY(timetable_id) REFERENCES timetables(id) ON DELETE CASCADE
            );
        `);
        console.log("Timetable database initialized.");
    } catch (error) {
        console.error("Timetable DB Init Error:", error);
    }
};

export const getTimetables = () => {
    try {
        return db.getAllSync(`SELECT * FROM timetables ORDER BY id DESC`);
    } catch (e) { return []; }
};

export const addTimetable = (name) => {
    try {
        db.runSync(`INSERT INTO timetables (name) VALUES (?)`, [name]);
    } catch (e) { console.error(e); }
};

export const deleteTimetable = (id) => {
    try {
        db.runSync(`DELETE FROM timetables WHERE id = ?`, [id]);
    } catch (e) { console.error(e); }
};

export const getSlotsByTimetable = (timetableId) => {
    try {
        return db.getAllSync(`SELECT * FROM timetable_slots WHERE timetable_id = ? ORDER BY start_time ASC`, [timetableId]);
    } catch (e) { return []; }
};

export const addSlot = (timetableId, start, end, activity) => {
    try {
        db.runSync(`INSERT INTO timetable_slots (timetable_id, start_time, end_time, activity) VALUES (?, ?, ?, ?)`,
        [timetableId, start, end, activity]);
    } catch (e) { console.error(e); }
};

export const deleteSlot = (id) => {
    try {
        db.runSync(`DELETE FROM timetable_slots WHERE id = ?`, [id]);
    } catch (e) { console.error(e); }
};
