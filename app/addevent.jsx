import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from '../database';
import { addEvent, updateEvent } from '../events';

const CATEGORIES = [
    { label: 'Uni', color: '#2563EB' },
    { label: 'Career', color: '#22C55E' },
    { label: 'FYP', color: '#A78BFA' },
    { label: 'Freelancing', color: '#F59E0B' },
];

export default function AddEventScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const isEditing = !!id;

    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Uni');
    const [eventType, setEventType] = useState('Specific Date');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(null);
    const [showPicker, setShowPicker] = useState(null);

    const parseTimeString = (timeStr) => {
        if (!timeStr || timeStr === '00:00') return new Date();
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        const d = new Date();
        d.setHours(parseInt(hours, 10));
        d.setMinutes(parseInt(minutes, 10));
        return d;
    };

    useEffect(() => {
        if (isEditing) {
            const result = db.getFirstSync(`SELECT * FROM events WHERE id = ?`, [id]);
            if (result) {
                setTitle(result.title);
                setSelectedCategory(result.category);
                setEventType(result.type === 'day' ? 'Specific Date' : 'Whole Month');
                setLocation(result.location || '');
                setDescription(result.description || '');
                setDate(new Date(result.date));
                setStartTime(parseTimeString(result.time));
                if (result.end_time && result.end_time !== '00:00') {
                    setEndTime(parseTimeString(result.end_time));
                }
            }
        }
    }, [id]);

    // --- NEW LOGIC FOR AUTOMATIC DEFAULTS ---
    const handleTypeChange = (type) => {
        setEventType(type);
        if (!isEditing && type === 'Whole Month') {
            const firstDay = new Date();
            firstDay.setDate(1);
            setDate(firstDay);

            const tenAM = new Date();
            tenAM.setHours(10, 0, 0, 0);
            setStartTime(tenAM);
        }
    };

    const onPickerChange = (event, selectedValue) => {
        setShowPicker(null);
        if (event.type === "set" && selectedValue) {
            if (showPicker === 'date') setDate(selectedValue);
            if (showPicker === 'start') setStartTime(selectedValue);
            if (showPicker === 'end') setEndTime(selectedValue);
        }
    };

    const formatTimeDisplay = (timeObj) => {
        if (!timeObj) return "00:00";
        return timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const handleSave = () => {
        if (!title) {
            alert('Please enter a title');
            return;
        }

        const eventData = {
            title,
            date: date.toISOString().split('T')[0],
            type: eventType === 'Specific Date' ? 'day' : 'month',
            time: formatTimeDisplay(startTime),
            end_time: endTime ? formatTimeDisplay(endTime) : '00:00',
            location,
            category: selectedCategory,
            description
        };

        if (isEditing) {
            updateEvent(id, eventData);
        } else {
            addEvent(eventData);
        }
        router.dismissAll();
        router.push('/calendar');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isEditing ? 'Edit Event' : 'Add Event'}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.label}>Event Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Advanced Calculus Study"
                        placeholderTextColor="#4B5563"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.label}
                                style={[styles.catChip, selectedCategory === cat.label && styles.catChipActive]}
                                onPress={() => setSelectedCategory(cat.label)}
                            >
                                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                                <Text style={[styles.catText, selectedCategory === cat.label && styles.catTextActive]}>{cat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Event Type</Text>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, eventType === 'Specific Date' && styles.toggleBtnActive]}
                            onPress={() => handleTypeChange('Specific Date')}
                        >
                            <Text style={[styles.toggleText, eventType === 'Specific Date' && styles.toggleTextActive]}>Specific Date</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, eventType === 'Whole Month' && styles.toggleBtnActive]}
                            onPress={() => handleTypeChange('Whole Month')}
                        >
                            <Text style={[styles.toggleText, eventType === 'Whole Month' && styles.toggleTextActive]}>Whole Month</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.row, { marginTop: 20 }]}>
                        <View style={{ flex: 1.2, marginRight: 6 }}>
                            <Text style={styles.compactLabel}>Date</Text>
                            <TouchableOpacity style={styles.compactDateTimeInput} onPress={() => setShowPicker('date')}>
                                <Text style={styles.compactDateTimeText}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, marginRight: 6 }}>
                            <Text style={styles.compactLabel}>Start</Text>
                            <TouchableOpacity style={styles.compactDateTimeInput} onPress={() => setShowPicker('start')}>
                                <Text style={styles.compactDateTimeText}>{formatTimeDisplay(startTime).split(' ')[0]}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.compactLabel}>End</Text>
                            <TouchableOpacity style={styles.compactDateTimeInput} onPress={() => setShowPicker('end')}>
                                <Text style={styles.compactDateTimeText}>{endTime ? formatTimeDisplay(endTime).split(' ')[0] : '00:00'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showPicker && (
                        <DateTimePicker
                            value={showPicker === 'date' ? date : (showPicker === 'start' ? startTime : (endTime || new Date()))}
                            mode={showPicker === 'date' ? 'date' : 'time'}
                            is24Hour={false}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onPickerChange}
                        />
                    )}

                    <Text style={styles.label}>Location <Text style={{ color: '#4B5563' }}>(Optional)</Text></Text>
                    <View style={styles.inputWithIcon}>
                        <Ionicons name="location-outline" size={18} color="#94A3B8" />
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Add location"
                            placeholderTextColor="#4B5563"
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Add details about your study"
                        placeholderTextColor="#4B5563"
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>{isEditing ? 'Update Event' : 'Save Event'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070C16' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    label: { color: '#94A3B8', fontSize: 14, marginBottom: 8, marginTop: 20 },
    compactLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 6 },
    input: { backgroundColor: '#111827', borderRadius: 12, padding: 16, color: 'white', fontSize: 16 },
    catScroll: { flexDirection: 'row', marginBottom: 5 },
    catChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#1F2937' },
    catChipActive: { borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.1)' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    catText: { color: '#94A3B8', fontWeight: '600' },
    catTextActive: { color: '#2563EB' },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 12, padding: 4 },
    toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    toggleBtnActive: { backgroundColor: '#1E293B' },
    toggleText: { color: '#4B5563', fontWeight: '600' },
    toggleTextActive: { color: '#3B82F6' },
    row: { flexDirection: 'row', alignItems: 'flex-end' },
    compactDateTimeInput: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', borderRadius: 12, paddingVertical: 18, minHeight: 55 },
    compactDateTimeText: { color: 'white', fontSize: 15, fontWeight: '600' },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, paddingHorizontal: 16 },
    flexInput: { flex: 1, paddingVertical: 16, color: 'white', marginLeft: 10 },
    textArea: { height: 100, textAlignVertical: 'top' },
    footer: { padding: 20, backgroundColor: '#070C16' },
    saveBtn: { backgroundColor: '#2563EB', borderRadius: 15, paddingVertical: 16, alignItems: 'center' },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    cancelBtn: { marginTop: 20, alignItems: 'center' },
    cancelText: { color: '#94A3B8', fontSize: 16 }
});
