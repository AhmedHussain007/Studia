import { Stack } from "expo-router";
import { useEffect } from "react";
import { initEventDB } from '../events';
import { getMeta, initMetaTable, setMeta } from '../meta';
import { initNotebookTables } from "../notebooks";
import { initStudyHoursTable, initYearRows } from '../studyHours';
import { initTaskTable } from "../tasks";
import { initTimetableDB } from "../timetable";

export default function RootLayout() {

    useEffect(() => {
        const boot = () => {
            initEventDB();
            initTaskTable();
            initMetaTable();
            initTimetableDB();
            initNotebookTables();
            initStudyHoursTable();

            const currentYear = new Date().getFullYear();
            const initializedYear = getMeta('study_hours_year');

            if (parseInt(initializedYear) !== currentYear) {
                initYearRows(currentYear);
                setMeta('study_hours_year', currentYear);
            }
        };

        boot();
    }, []);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
    );
}
