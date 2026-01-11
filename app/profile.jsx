import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from "react";
import {
    Dimensions, Image, Modal, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteEvent, getAllEvents, updateEvent } from "../events";
import { getTasksByDate } from "../tasks";
// --- NEW IMPORT ---
import { addSlot, addTimetable, deleteSlot, getSlotsByTimetable, getTimetables } from "../timetable";

const { width } = Dimensions.get('window');

const categoryColors = {
    'Career': '#4CAF50', 'FYP': '#9C27B0', 'Freelancing': '#FF9800', 'Uni': '#2196F3', 'All': '#2979ff'
};

export default function Profile() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('events'); // events, tasks, plan
    const [events, setEvents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [profileImage, setProfileImage] = useState(null);
    const [userName, setUserName] = useState("Ahmed Hussain");
    const [userId, setUserId] = useState("SP23-BAI-007");

    // Time Table States
    const [timetables, setTimetables] = useState([]);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [currentSlots, setCurrentSlots] = useState([]);
    const [isNewTableModal, setIsNewTableModal] = useState(false);
    const [isNewSlotModal, setIsNewSlotModal] = useState(false);
    const [newTableName, setNewTableName] = useState("");
    const [newSlotForm, setNewSlotForm] = useState({ start: "08:00:00", end: "09:00:00", activity: "" });

    // Existing Modal States
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditModal, setIsEditModal] = useState(false);
    const [isDeleteModal, setIsDeleteModal] = useState(false);
    const [isProfileModal, setIsProfileModal] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [profileForm, setProfileForm] = useState({ name: "", id: "" });

    const loadData = async () => {
        const savedImage = await SecureStore.getItemAsync('user_profile_image');
        const savedName = await SecureStore.getItemAsync('user_profile_name');
        const savedId = await SecureStore.getItemAsync('user_profile_id');
        if (savedImage) setProfileImage(savedImage);
        if (savedName) setUserName(savedName);
        if (savedId) setUserId(savedId);

        setEvents(getAllEvents() || []);
        setTasks(getTasksByDate(new Date().toISOString().split('T')[0]) || []);

        // Load Time Tables
        const tbs = getTimetables();
        setTimetables(tbs);
        if (tbs.length > 0 && !selectedTableId) {
            setSelectedTableId(tbs[0].id);
            setCurrentSlots(getSlotsByTimetable(tbs[0].id));
        } else if (selectedTableId) {
            setCurrentSlots(getSlotsByTimetable(selectedTableId));
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, [selectedTableId]));

    // --- Time Table Actions ---
    const handleAddTable = () => {
        if (!newTableName) return;
        addTimetable(newTableName);
        setNewTableName("");
        setIsNewTableModal(false);
        loadData();
    };

    const handleAddSlot = () => {
        if (!newSlotForm.activity) return;
        addSlot(selectedTableId, newSlotForm.start, newSlotForm.end, newSlotForm.activity);
        setIsNewSlotModal(false);
        setNewSlotForm({ start: "08:00:00", end: "09:00:00", activity: "" });
        loadData();
    };

    // --- Profile & Event Logic --- (Your existing logic kept exactly the same)
    const handleOpenProfileEdit = () => { setProfileForm({ name: userName, id: userId }); setIsProfileModal(true); };
    const saveProfileInfo = async () => {
        await SecureStore.setItemAsync('user_profile_name', profileForm.name);
        await SecureStore.setItemAsync('user_profile_id', profileForm.id);
        setUserName(profileForm.name); setUserId(profileForm.id); setIsProfileModal(false);
    };
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        let result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
            await SecureStore.setItemAsync('user_profile_image', result.assets[0].uri);
        }
    };
    const handleOpenEdit = (event) => { setEditForm({ ...event }); setIsEditModal(true); };
    const confirmDelete = () => { if (selectedEvent?.id) { deleteEvent(selectedEvent.id); setIsDeleteModal(false); loadData(); } };
    const handleUpdate = () => { if (editForm?.id) { updateEvent(editForm.id, editForm); setIsEditModal(false); loadData(); } };

    return (
        <SafeAreaView style={styles.container}>
            {/* FIXED TOP: IMAGE AND HEADER */}
            <View style={styles.fixedHeader}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={28} color="#fff" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile Settings</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image source={profileImage ? { uri: profileImage } : require("../assets/profile.jpg")} style={styles.bigAvatar} />
                        <TouchableOpacity style={styles.editBadge} onPress={pickImage}><Ionicons name="camera" size={18} color="#fff" /></TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleOpenProfileEdit} style={styles.nameContainer}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Ionicons name="pencil" size={16} color="#3B82F6" style={{ marginTop: 15 }} />
                    </TouchableOpacity>
                    <Text style={styles.userId}>ID: {userId}</Text>
                </View>

                <View style={styles.tabContainer}>
                    {['events', 'tasks', 'plan'].map(tab => (
                        <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* SCROLLABLE BOTTOM */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.contentList}>
                    {activeTab === 'events' && events.map(item => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={[styles.colorBar, { backgroundColor: categoryColors[item.category] || categoryColors['All'] }]} />
                            <View style={styles.itemInfo}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemSub}>{item.date} • {item.time}</Text></View>
                            <View style={styles.actionIcons}>
                                <TouchableOpacity onPress={() => handleOpenEdit(item)}><Ionicons name="create-outline" size={20} color="#3B82F6" /></TouchableOpacity>
                                <TouchableOpacity onPress={() => { setSelectedEvent(item); setIsDeleteModal(true); }}><Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginLeft: 10 }} /></TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {activeTab === 'tasks' && tasks.map(item => (
                        <View key={item.id} style={styles.itemCard}>
                            <Ionicons name={item.status === 1 ? "checkmark-circle" : "ellipse-outline"} size={24} color={item.status === 1 ? "#22C55E" : "#475569"} />
                            <View style={[styles.itemInfo, { marginLeft: 12 }]}><Text style={[styles.itemTitle, item.status === 1 && styles.textDone]}>{item.title}</Text><Text style={styles.itemSub}>{item.purpose} • {item.priority}</Text></View>
                        </View>
                    ))}

                    {activeTab === 'plan' && (
                        <View>
                            <View style={styles.planHeader}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                                    {timetables.map(tb => (
                                        <TouchableOpacity key={tb.id}
                                            style={[styles.tbChip, selectedTableId === tb.id && styles.tbChipActive]}
                                            onPress={() => setSelectedTableId(tb.id)}>
                                            <Text style={styles.tbChipText}>{tb.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => setIsNewTableModal(true)}><Ionicons name="add-circle" size={32} color="#3B82F6" /></TouchableOpacity>
                            </View>

                            {selectedTableId && (
                                <View style={styles.timelineContainer}>
                                    <TouchableOpacity style={styles.addSlotBtn} onPress={() => setIsNewSlotModal(true)}>
                                        <Text style={styles.addSlotBtnText}>+ Add Time Slot</Text>
                                    </TouchableOpacity>
                                    {currentSlots.map(slot => (
                                        <View key={slot.id} style={styles.slotCard}>
                                            {/* Change this section inside currentSlots.map */}
                                            <View style={styles.slotTimeHorizontal}>
                                                <Text style={styles.timeText}>
                                                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                                </Text>
                                            </View>
                                            <View style={styles.slotActivity}>
                                                <Text style={styles.activityText}>{slot.activity}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => { deleteSlot(slot.id); loadData(); }}>
                                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* --- MODALS --- */}
            {/* New Table Modal */}
            <Modal visible={isNewTableModal} transparent animationType="fade">
                <View style={styles.modalOverlay}><View style={styles.editCard}>
                    <Text style={styles.editTitle}>Name Timetable</Text>
                    <TextInput style={styles.input} placeholder="e.g. Eid Timetable" placeholderTextColor="#444" value={newTableName} onChangeText={setNewTableName} />
                    <TouchableOpacity style={styles.saveBtn} onPress={handleAddTable}><Text style={styles.confirmText}>Create</Text></TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setIsNewTableModal(false)}><Text style={{ color: '#EF4444', textAlign: 'center' }}>Cancel</Text></TouchableOpacity>
                </View></View>
            </Modal>

            {/* New Slot Modal */}
            <Modal visible={isNewSlotModal} transparent animationType="slide">
                <View style={styles.modalOverlay}><View style={styles.editCard}>
                    <Text style={styles.editTitle}>Add Slot</Text>
                    <TextInput style={styles.input} placeholder="Activity (e.g. Maths Study)" placeholderTextColor="#444" onChangeText={t => setNewSlotForm({ ...newSlotForm, activity: t })} />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Start HH:mm" placeholderTextColor="#444" onChangeText={t => setNewSlotForm({ ...newSlotForm, start: t })} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="End HH:mm" placeholderTextColor="#444" onChangeText={t => setNewSlotForm({ ...newSlotForm, end: t })} />
                    </View>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleAddSlot}><Text style={styles.confirmText}>Save Slot</Text></TouchableOpacity>
                </View></View>
            </Modal>

            {/* Include your existing Event/Profile Modals here... */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070C16' },
    fixedHeader: { backgroundColor: '#070C16', zIndex: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    backBtn: { padding: 5 },
    profileSection: { alignItems: 'center', marginBottom: 20 },
    avatarContainer: { position: 'relative' },
    bigAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#1E293B' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#070C16' },
    nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    userName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 15 },
    userId: { color: '#64748B', fontSize: 13, fontWeight: '600', marginTop: 4 },
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#111827', borderRadius: 15, padding: 5, marginBottom: 15 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    activeTab: { backgroundColor: '#1E293B' },
    tabText: { color: '#64748B', fontWeight: '700', fontSize: 12 },
    activeTabText: { color: '#fff' },
    contentList: { paddingHorizontal: 20 },
    itemCard: { backgroundColor: '#111827', borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
    colorBar: { width: 4, height: 30, borderRadius: 2, marginRight: 15 },
    itemInfo: { flex: 1 },
    itemTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
    itemSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
    actionIcons: { flexDirection: 'row' },
    // Plan Specific Styles
    planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
    tbChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1F2937', marginRight: 8 },
    tbChipActive: { backgroundColor: '#3B82F6' },
    tbChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    timelineContainer: { borderLeftWidth: 2, borderLeftColor: '#1F2937', marginLeft: 10, paddingLeft: 15 },
    addSlotBtn: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 10, borderRadius: 10, marginBottom: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#3B82F6' },
    addSlotBtnText: { color: '#3B82F6', fontWeight: 'bold' },
    slotCard: {
        backgroundColor: '#111827',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center'
    },
    slotTimeHorizontal: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B', // Optional: subtle background to make time stand out
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    slotTime: { width: 60, alignItems: 'center' },
    timeText: {
        color: '#3B82F6',
        fontSize: 13, // Slightly larger for readability
        fontWeight: 'bold'
    },
    timeLine: { width: 2, height: 15, backgroundColor: '#1F2937', marginVertical: 4 },
    slotActivity: {
        flex: 1,
        marginLeft: 15
    },
    activityText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    editCard: { width: '90%', backgroundColor: '#111827', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#1F2937' },
    editTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 15 },
    input: { backgroundColor: '#070C16', borderRadius: 10, padding: 12, color: '#fff', marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    saveBtn: { backgroundColor: '#3B82F6', padding: 15, borderRadius: 12, alignItems: 'center' },
    confirmText: { color: '#fff', fontWeight: '700' }
});
