import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../database';
import { deleteEvent } from '../events';

export default function EventDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Gets the event ID from navigation
    const [event, setEvent] = useState(null);

    useEffect(() => {
        if (id) {
            loadEventDetails();
        }
    }, [id]);

    const loadEventDetails = () => {
        try {
            // Fetch single event details from DB
            const result = db.getFirstSync(`SELECT * FROM events WHERE id = ?`, [id]);
            if (result) {
                setEvent(result);
            }
        } catch (error) {
            console.error("Error loading event details:", error);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Event",
            "Are you sure you want to remove this event?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteEvent(id);
                        router.back(); // Return to calendar
                    }
                }
            ]
        );
    };

    if (!event) return null;

    // Logic to show "Start - End" or just "Start"
    const timeDisplay = (event.end_time && event.end_time !== '00:00')
        ? `${event.time} - ${event.end_time}`
        : event.time;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Area */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Event Details</Text>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Top Card: Title & Badge */}
                <View style={styles.mainCard}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.categoryBadge, { backgroundColor: 'rgba(37, 99, 235, 0.2)' }]}>
                            <Text style={styles.categoryText}>{event.category?.toUpperCase() || 'UNIVERSITY'}</Text>
                        </View>
                        <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
                    </View>
                    <Text style={styles.titleText}>{event.title}</Text>
                    <Text style={styles.subTitleText}>Prepare for upcoming mid-terms</Text>
                </View>

                {/* Details Section */}
                <View style={styles.detailsSection}>
                    {/* Date Row */}
                    <View style={styles.infoRow}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
                            <MaterialCommunityIcons name="calendar-month" size={22} color="#3B82F6" />
                        </View>
                        <View style={styles.infoTextColumn}>
                            <Text style={styles.infoLabel}>DATE</Text>
                            <Text style={styles.infoValue}>{event.date}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Time Row */}
                    <View style={styles.infoRow}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                            <Ionicons name="time" size={22} color="#A78BFA" />
                        </View>
                        <View style={styles.infoTextColumn}>
                            <Text style={styles.infoLabel}>TIME</Text>
                            <Text style={styles.infoValue}>{timeDisplay}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Location Row */}
                    <View style={styles.infoRow}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                            <Ionicons name="location" size={22} color="#22C55E" />
                        </View>
                        <View style={styles.infoTextColumn}>
                            <Text style={styles.infoLabel}>LOCATION</Text>
                            <Text style={styles.infoValue}>{event.location || 'Not Specified'}</Text>
                        </View>
                    </View>
                </View>

                {/* Description Section */}
                <View style={styles.descriptionCard}>
                    <View style={styles.descriptionHeader}>
                        <Ionicons name="document-text" size={20} color="#94A3B8" />
                        <Text style={styles.descriptionTitle}>Description</Text>
                    </View>
                    <Text style={styles.descriptionText}>
                        {event.description || "No additional details provided for this study session."}
                    </Text>
                </View>

                {/* Categories/Tags at bottom */}
                <View style={styles.tagRow}>
                    <View style={styles.tag}>
                        <View style={[styles.tagDot, { backgroundColor: event.color }]} />
                        <Text style={styles.tagText}>Study Session</Text>
                    </View>
                    <View style={styles.tag}>
                        <Ionicons name="people" size={14} color="#94A3B8" />
                        <Text style={styles.tagText}>Group</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Fixed Action Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => router.push({
                        pathname: '/addevent',
                        params: { id: event.id } // Pass the ID here
                    })}
                >
                    <Ionicons name="pencil" size={18} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.editBtnText}>Edit Event Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteBtnText}>Delete Event</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070C16' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 150 },

    // Main Title Card
    mainCard: {
        backgroundColor: '#111827',
        borderRadius: 24,
        padding: 24,
        paddingVertical: 18,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#1F2937'
    },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    categoryText: { color: '#3B82F6', fontSize: 12, fontWeight: 'bold' },
    titleText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    subTitleText: { color: '#94A3B8', fontSize: 16 },

    // Middle Details Section
    detailsSection: {
        backgroundColor: '#111827',
        borderRadius: 24,
        marginTop: 10,
        padding: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#1F2937'
    },
    infoRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    infoTextColumn: { marginLeft: 16 },
    infoLabel: { color: '#64748B', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    infoValue: { color: 'white', fontSize: 18, fontWeight: '600', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#1F2937', marginHorizontal: 15 },

    // Description Section
    descriptionCard: {
        backgroundColor: '#111827',
        borderRadius: 24,
        marginTop: 10,
        padding: 24,
        paddingVertical: 18,
        borderWidth: 1,
        borderColor: '#1F2937'
    },
    descriptionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    descriptionTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginLeft: 10 },
    descriptionText: { color: '#94A3B8', fontSize: 16, lineHeight: 24 },

    tagRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    tagDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    tagText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginLeft: 4 },

    // Footer Buttons
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#070C16',
        paddingBottom: 40
    },
    editBtn: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    editBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    deleteBtn: {
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1F2937'
    },
    deleteBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' }
});
