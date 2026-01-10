import * as SQLite from 'expo-sqlite';

// We export 'db' as a named constant
export const db = SQLite.openDatabaseSync('studyApp.db');
