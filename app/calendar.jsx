import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from '../database'; // Import db to fetch monthly stats
import { getEventsByDate, getEventsByMonth } from '../events';

const TODAY = new Date().toISOString().split('T')[0];

const categoryColors = {
    'Career': '#4CAF50',      // Green
    'FYP': '#9C27B0',         // Purple
    'Freelancing': '#FF9800', // Orange
    'Uni': '#2196F3',         // Blue
    'All': '#2979ff'          // Default
};

export default function ProductivityCalendar() {
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(TODAY);
    const [activeTab, setActiveTab] = useState('Today');
    const [activeFilter, setActiveFilter] = useState('All');

    const [dayEvents, setDayEvents] = useState([]);
    const [monthEvents, setMonthEvents] = useState([]);
    const [monthStudyStats, setMonthStudyStats] = useState({});

    const categories = ['All', 'Career', 'Uni', 'FYP', 'Freelancing'];

    // Helper for 6-min = 0.1 logic
    const calculateDecimalHours = (totalSeconds) => {
        if (!totalSeconds || totalSeconds < 360) return "0";
        return (Math.floor(totalSeconds / 360) / 10).toFixed(1);
    };

    useFocusEffect(
        useCallback(() => {
            const loadData = () => {
                // 1. Fetch Events
                const dayData = getEventsByDate(selectedDate);
                setDayEvents(dayData || []);

                const [year, month] = selectedDate.split('-');
                const monthData = getEventsByMonth(parseInt(year), parseInt(month));
                setMonthEvents(monthData || []);

                // 2. Fetch Live Study Hours for the entire month
                try {
                    const stats = db.getAllSync(
                        `SELECT date, total_daily_seconds FROM study_hours WHERE year = ? AND month = ?`,
                        [parseInt(year), parseInt(month)]
                    );

                    // Convert array to a lookup object { "2026-01-01": 3600 }
                    const statsMap = {};
                    stats.forEach(row => {
                        statsMap[row.date] = calculateDecimalHours(row.total_daily_seconds);
                    });
                    setMonthStudyStats(statsMap);
                } catch (e) {
                    console.error("Fetch monthly stats error", e);
                }
            };
            loadData();
        }, [selectedDate])
    );

    const displayEvents = useMemo(() => {
        let baseList = activeTab === 'Today' ? dayEvents : monthEvents;
        if (activeFilter !== 'All') {
            baseList = baseList.filter(e => e.category === activeFilter);
        }
        return baseList;
    }, [activeTab, activeFilter, dayEvents, monthEvents]);

    const markedDates = useMemo(() => {
        let marks = {};

        // Add dots for events
        monthEvents.forEach(event => {
            if (!marks[event.date]) marks[event.date] = { dots: [] };
            if (marks[event.date].dots.length < 3) {
                const dotColor = categoryColors[event.category] || '#717E95';
                marks[event.date].dots.push({ color: dotColor });
                // marks[event.date].dots.push({ color: event.color || '#2979ff' });
            }
        });

        // Highlight selected date
        marks[selectedDate] = {
            ...marks[selectedDate],
            selected: true,
            selectedColor: 'rgba(41, 121, 255, 0.2)'
        };
        return marks;
    }, [monthEvents, selectedDate]);

    const renderCustomDay = ({ date, state }) => {
        const isSelected = date.dateString === selectedDate;
        // Fetch real hours from our state map
        const studiedHours = monthStudyStats[date.dateString] || '0.0';
        const goalHours = '10h'; // Set to 10h for everyone as requested

        return (
            <TouchableOpacity
                onPress={() => setSelectedDate(date.dateString)}
                style={[styles.dayContainer, isSelected && styles.selectedDayBorder]}
            >
                <Text style={styles.studiedText}>{studiedHours}h</Text>
                <Text style={[
                    styles.dayText,
                    state === 'disabled' ? { color: '#444' } : { color: 'white' },
                    isSelected && { color: '#2979ff' }
                ]}>
                    {date.day}
                </Text>
                <Text style={styles.goalText}>{goalHours}</Text>

                {/* Dot markers for events */}
                <View style={styles.dotRow}>
                    {markedDates[date.dateString]?.dots?.map((dot, index) => (
                        <View key={index} style={[styles.miniDot, { backgroundColor: dot.color }]} />
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    const renderEvent = ({ item }) => {
        const dayNum = item.date.split('-')[2];
        const monthName = new Date(item.date).toLocaleString('default', { month: 'short' }).toUpperCase();
        const timeDisplay = (item.end_time && item.end_time !== '00:00')
            ? `${item.time} - ${item.end_time}`
            : item.time;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push({
                    pathname: '/displayevent',
                    params: { id: item.id }
                })}>
                <View style={styles.eventCard}>
                    <View style={styles.dateBadge}>
                        <Text style={styles.badgeMonth}>{monthName}</Text>
                        <Text style={styles.badgeDay}>{dayNum}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text style={styles.eventSubText}>{timeDisplay} {item.location ? `• ${item.location}` : ''}</Text>
                    </View>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: categoryColors[item.category] || '#717E95' }
                    ]} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerFixedContainer}>
                <Calendar
                    current={selectedDate}
                    onDayPress={day => setSelectedDate(day.dateString)}
                    dayComponent={renderCustomDay}
                    markedDates={markedDates}
                    theme={{
                        calendarBackground: 'transparent',
                        textSectionTitleColor: '#717E95',
                        monthTextColor: 'white',
                        textMonthFontWeight: 'bold',
                        textMonthFontSize: 20,
                        arrowColor: 'white',
                    }}
                />

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'Today' && styles.activeTabButton]}
                        onPress={() => setActiveTab('Today')}
                    >
                        <Text style={[styles.tabText, activeTab === 'Today' && styles.activeTabText]}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'Upcoming' && styles.activeTabButton]}
                        onPress={() => setActiveTab('Upcoming')}
                    >
                        <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>Upcoming</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}
                    contentContainerStyle={styles.chipScrollContent}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.chip, activeFilter === cat && styles.activeChip]}
                            onPress={() => setActiveFilter(cat)}
                        >
                            <Text style={[styles.chipText, activeFilter === cat && { color: 'white' }]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={displayEvents}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={renderEvent}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={50} color="#1C222E" />
                        <Text style={styles.emptyText}>No {activeFilter === 'All' ? '' : activeFilter} events found.</Text>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity onPress={() => router.push("dashboard")}>
                    <Ionicons name="home" size={24} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity >
                    <Ionicons name="calendar" size={24} color="#3B82F6" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.fab} onPress={() => { router.push("/addevent") }}>
                    <Ionicons name="add" size={32} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/weeklystats")}>
                    <Ionicons name="bar-chart" size={24} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/notebooks')}>
                    <Ionicons name="flag" size={24} color="#64748B" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0F1D' },
    headerFixedContainer: { backgroundColor: '#0A0F1D', zIndex: 10, paddingBottom: 5 },
    dayContainer: { alignItems: 'center', justifyContent: 'center', height: 65, width: 45 },
    selectedDayBorder: { borderWidth: 1, borderColor: '#2979ff', borderRadius: 8, backgroundColor: 'rgba(41, 121, 255, 0.05)' },
    studiedText: { fontSize: 9, color: '#4CAF50', fontWeight: 'bold' }, // Green for studied hours
    dayText: { fontSize: 16, fontWeight: 'bold' },
    goalText: { fontSize: 9, color: '#717E95', fontWeight: '600' },
    dotRow: { flexDirection: 'row', height: 4, marginTop: 2 },
    miniDot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 1 },
    tabContainer: { flexDirection: 'row', backgroundColor: '#161B28', marginHorizontal: 20, borderRadius: 12, padding: 4, marginTop: 10 },
    tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    activeTabButton: { backgroundColor: '#2979ff' },
    tabText: { color: '#717E95', fontWeight: 'bold' },
    activeTabText: { color: 'white' },
    chipScroll: { marginVertical: 10, paddingLeft: 20, paddingRight: 30 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1C222E', marginRight: 10, borderWidth: 1, borderColor: '#333' },
    activeChip: { backgroundColor: '#2979ff', borderColor: '#2979ff' },
    chipText: { color: '#717E95', fontWeight: '600' },
    eventCard: { flexDirection: 'row', backgroundColor: '#161B28', marginHorizontal: 20, marginBottom: 12, padding: 12, borderRadius: 16, alignItems: 'center' },
    dateBadge: { backgroundColor: '#222938', padding: 8, borderRadius: 10, alignItems: 'center', minWidth: 50 },
    badgeMonth: { color: '#FF8C00', fontSize: 10, fontWeight: 'bold' },
    badgeDay: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    eventInfo: { flex: 1, marginLeft: 15 },
    eventTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
    eventSubText: { color: '#717E95', fontSize: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#717E95', marginTop: 10 },
    listContent: { paddingBottom: 120 },
    chipScrollContent: { paddingRight: 30 },
    bottomNav: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: "#0B1220",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#1F2937",
        paddingBottom: 20
    },
    fab: {
        backgroundColor: '#2563EB',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -50,
        elevation: 10
    },
    navActiveItem: { alignItems: 'center' },
    fab: { backgroundColor: '#2979ff', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: -40, elevation: 5 },
});
