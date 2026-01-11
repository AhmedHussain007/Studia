import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStatsForRange } from '../studyHours';

export default function WeeklyProgress() {
    const router = useRouter();

    // 1. STATE
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [referenceDate, setReferenceDate] = useState(new Date()); // Used to determine which week to show
    const [weekData, setWeekData] = useState([]);
    const [totals, setTotals] = useState({ totalSeconds: 0, categorySums: {} });

    const categories = [
        { id: 'Uni', color: '#3B82F6', column: 'uni_seconds' },
        { id: 'FYP', color: '#F43F5E', column: 'fyp_seconds' },
        { id: 'Freelancing', color: '#F59E0B', column: 'freelancing_seconds' },
        { id: 'Career', color: '#10B981', column: 'career_seconds' }
    ];

    // 2. LOGIC: Calculate Week Range (Monday to Sunday)
    const getWeekRange = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const start = new Date(d.setDate(diff));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            display: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        };
    };

    const currentRange = getWeekRange(referenceDate);

    // 3. DATA FETCHING
    const loadData = useCallback(() => {
        const rows = getStatsForRange(currentRange.start, currentRange.end);

        // Map database rows to a 7-day array to ensure chart always has 7 bars
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const start = new Date(currentRange.start);

        let grandTotal = 0;
        let categorySums = { Uni: 0, FYP: 0, Freelancing: 0, Career: 0 };

        const formattedDays = daysOfWeek.map((label, index) => {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + index);
            const dateStr = currentDate.toISOString().split('T')[0];

            const dbRow = rows.find(r => r.date === dateStr);

            // Sum category totals for the chips
            if (dbRow) {
                categorySums.Uni += dbRow.uni_seconds || 0;
                categorySums.FYP += dbRow.fyp_seconds || 0;
                categorySums.Freelancing += dbRow.freelancing_seconds || 0;
                categorySums.Career += dbRow.career_seconds || 0;
            }

            // Calculate value for the chart based on active filter
            let val = 0;
            if (dbRow) {
                if (selectedCategory === 'All') val = dbRow.total_daily_seconds;
                else if (selectedCategory === 'Uni') val = dbRow.uni_seconds;
                else if (selectedCategory === 'FYP') val = dbRow.fyp_seconds;
                else if (selectedCategory === 'Freelancing') val = dbRow.freelancing_seconds;
                else if (selectedCategory === 'Career') val = dbRow.career_seconds;
            }

            grandTotal += val;
            return { label, value: val, isToday: dateStr === new Date().toISOString().split('T')[0] };
        });

        setWeekData(formattedDays);
        setTotals({ totalSeconds: grandTotal, categorySums });
    }, [referenceDate, selectedCategory]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    // 4. HELPERS
    const changeWeek = (direction) => {
        const newDate = new Date(referenceDate);
        newDate.setDate(referenceDate.getDate() + (direction * 7));
        setReferenceDate(newDate);
    };

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        return { h, m };
    };

    const time = formatTime(totals.totalSeconds);
    const maxVal = Math.max(...weekData.map(d => d.value), 3600); // Max for chart scaling

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/dashboard')}>
                    <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Weekly Progress</Text>
                <TouchableOpacity onPress={() => { setReferenceDate(new Date()); setSelectedCategory('All'); }}>
                    <Ionicons name="refresh-outline" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Week Selector */}
                <View style={styles.weekPicker}>
                    <TouchableOpacity onPress={() => changeWeek(-1)}>
                        <Ionicons name="chevron-back" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                    <View style={styles.weekLabelContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                        <Text style={styles.weekLabel}>{currentRange.display}</Text>
                    </View>
                    <TouchableOpacity onPress={() => changeWeek(1)}>
                        <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {/* Summary */}
                <View style={styles.summary}>
                    <Text style={styles.timeLabel}>
                        {time.h}<Text style={styles.unit}>h</Text>
                        <Text style={styles.timeLabel}> {time.m}</Text>
                        <Text style={styles.unit}>m</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        {selectedCategory === 'All' ? 'Total Study Time' : `${selectedCategory} Time`}
                    </Text>
                </View>

                {/* Chart Card */}
                <View style={styles.card}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.cardTitle}>Daily Activity</Text>
                        <Text style={styles.avgText}>{(totals.totalSeconds / 3600).toFixed(1)}h Total</Text>
                    </View>

                    <View style={styles.chart}>
                        {weekData.map((d, i) => (
                            <View key={i} style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: (d.value / maxVal) * 150 + 2,
                                            backgroundColor: d.isToday ? '#FFFFFF' : (selectedCategory === 'All' ? '#3B82F6' : categories.find(c => c.id === selectedCategory).color)
                                        }
                                    ]}
                                />
                                <Text style={[styles.dayLabel, d.isToday && { color: '#FFF', fontWeight: 'bold' }]}>{d.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Category Filters */}
                <View style={styles.filterSection}>
                    <View style={styles.filterHeader}>
                        <Text style={styles.filterTitle}>Filter by Category</Text>
                        <TouchableOpacity onPress={() => setSelectedCategory('All')}>
                            <Text style={styles.resetText}>Reset</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}
                        contentContainerStyle={styles.filterScrollContent}>
                        <TouchableOpacity
                            onPress={() => setSelectedCategory('All')}
                            style={[styles.chip, selectedCategory === 'All' && styles.activeChip]}
                        >
                            <Text style={styles.chipText}>All</Text>
                        </TouchableOpacity>

                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategory(cat.id)}
                                style={[
                                    styles.chip,
                                    selectedCategory === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color }
                                ]}
                            >
                                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                                <Text style={styles.chipText}>{cat.id}</Text>
                                <Text style={styles.chipVal}> {Math.floor(totals.categorySums[cat.id] / 3600)}h</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="stats-chart" size={22} color="#FACC15" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoTitle}>Analysis</Text>
                        <Text style={styles.infoText}>
                            You studied an average of {((totals.totalSeconds / 3600) / 7).toFixed(1)} hours per day this week.
                        </Text>
                    </View>
                </View>

            </ScrollView >

            {/* Bottom Nav */}
            < View style={styles.bottomNav} >
                <TouchableOpacity onPress={() => router.push('/dashboard')}>
                    <Ionicons name="home" size={24} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/calendar')}>
                    <Ionicons name="calendar" size={24} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity >
                    <Ionicons name="bar-chart" size={24} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/notebooks')}>
                    <Ionicons name="flag" size={24} color="#64748B" />
                </TouchableOpacity>
            </View >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070C16' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    weekPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', margin: 16, padding: 12, borderRadius: 12 },
    weekLabelContainer: { flexDirection: 'row', alignItems: 'center' },
    weekLabel: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    summary: { alignItems: 'center', marginVertical: 10 },
    timeLabel: { color: '#FFF', fontSize: 42, fontWeight: '800' },
    unit: { fontSize: 20, color: '#94A3B8' },
    subtitle: { color: '#94A3B8', marginTop: 4, fontSize: 14 },
    card: { backgroundColor: '#111827', margin: 16, borderRadius: 24, padding: 20 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    avgText: { color: '#3B82F6', fontWeight: '600' },
    chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180 },
    barWrapper: { alignItems: 'center', flex: 1 },
    bar: { width: 38, borderRadius: 4 },
    dayLabel: { color: '#64748B', fontSize: 11, marginTop: 10 },
    filterSection: { marginTop: 10 },
    filterHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
    filterTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    resetText: { color: '#3B82F6', fontWeight: '600' },
    filterScroll: { marginTop: 10 },
    filterScrollContent: {
        paddingLeft: 20,  // Re-add the left space here
        paddingRight: 10, // THIS FIXES THE RIGHT-SIDE CUTOFF
    },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#1F2937' },
    activeChip: { borderColor: '#3B82F6', backgroundColor: '#1E293B' },
    chipText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
    chipVal: { color: '#94A3B8', fontSize: 12 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    infoCard: { flexDirection: 'row', backgroundColor: '#1E1B4B', margin: 16, padding: 16, borderRadius: 20, alignItems: 'center', gap: 15 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#312E81', justifyContent: 'center', alignItems: 'center' },
    infoTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    infoText: { color: '#CBD5E1', fontSize: 13, marginTop: 2 },
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
});
