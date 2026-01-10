import { db } from './database';

const categoryColors = {
    'FYP': 'red',
    'Freelancing': 'orange',
    'Career': 'blue',
    'Uni': 'blue'
};

// Initialize Events Table
export const initEventDB = () => {
    try {
        db.execSync(`
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'day',
                time TEXT,      -- This acts as Start Time
                end_time TEXT,  -- Changed from duration to end_time
                location TEXT,
                category TEXT,
                description TEXT,
                color TEXT
            );
        `);
        console.log("Events table initialized with end_time field.");
    } catch (error) {
        console.error("Event DB Init Error:", error);
    }
};

export const getEventsByMonth = (year, month) => {
    try {
        // Use a local date string to avoid timezone shifts (e.g., 2026-01-09)
        const today = new Date().toLocaleDateString('en-CA');

        const monthStr = month.toString().padStart(2, '0');
        const monthStart = `${year}-${monthStr}-01`;
        const monthEnd = `${year}-${monthStr}-31`;

        // We REMOVED the db.runSync(DELETE...) line to preserve history.

        // FETCH STEP:
        // For 'day' type: We only get events where date >= today AND date <= end of month.
        // For 'month' type: We get them if they belong to this month.
        return db.getAllSync(
            `
            SELECT * FROM events
            WHERE (
                (type = 'day' AND date >= ? AND date <= ?)
                OR
                (type = 'month' AND date = ?)
            )
            ORDER BY date ASC, time ASC;
            `,
            [today, monthEnd, monthStart]
        );
    } catch (error) {
        console.error("Get Events By Month Error:", error);
        return [];
    }
};

// Add a new event with end_time
export const addEvent = ({ title, date, type = 'day', time = '', end_time = '', location = '', category = '', description = '' }) => {
    try {
        if (type === 'month') {
            const [year, month] = date.split('-');
            date = `${year}-${month}-01`;
        }
        const color = categoryColors[category] || 'blue';

        // SAFE PARAMETERIZED QUERY including end_time
        db.runSync(
            `INSERT INTO events (title, date, type, time, end_time, location, category, description, color)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [title, date, type, time || '10:00', end_time || '00:00', location, category, description, color]
        );

        console.log("Event added successfully with end_time:", title);
    } catch (error) {
        console.error("Add Event Error:", error);
    }
};

// Fetch events for a specific day (Today Tab)
export const getEventsByDate = (date) => {
    try {
        return db.getAllSync(
            `
            SELECT * FROM events
            WHERE (type = 'day' AND date = ?)
               OR (type = 'month' AND date = ?)
            ORDER BY time;
            `,
            [date, date.substring(0, 7) + '-01']
        );
    } catch (error) {
        console.error("Get Events By Date Error:", error);
        return [];
    }
};

// Delete event
export const deleteEvent = (id) => {
    try {
        db.runSync(`DELETE FROM events WHERE id = ?;`, [id]);
        console.log("Event deleted:", id);
    } catch (error) {
        console.error("Delete Event Error:", error);
    }
};


// Update event
export const updateEvent = (id, eventData) => {
    try {
        db.runSync(
            `UPDATE events SET title=?, date=?, type=?, time=?, end_time=?, location=?, category=?, description=? WHERE id=?`,
            [
                eventData.title,
                eventData.date,
                eventData.type,
                eventData.time,
                eventData.end_time,
                eventData.location,
                eventData.category,
                eventData.description,
                id
            ]
        );
        console.log("Event updated successfully");
    } catch (error) {
        console.error("Update error:", error);
    }
};


// Add this to your events.js
export const getAllEvents = () => {
    try {
        return db.getAllSync(`SELECT * FROM events ORDER BY date DESC, time DESC`);
    } catch (error) {
        console.error("Get All Events Error:", error);
        return [];
    }
};
