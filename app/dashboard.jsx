import { Ionicons } from "@expo/vector-icons";
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    AppState,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTodayStats, incrementStudyTime } from "../studyHours";
import { addTask, deleteTask, getTasksByDate, toggleTaskStatus, updateTask } from "../tasks";
import { adjustSecondsInDB, getTotalSeconds, updateSecondsInDB } from "../users";

export default function Dashboard() {
    const router = useRouter();
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);

    // Adjustment Modal State
    const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);

    // --- REFS (The Logical Engine) ---
    const sessionStartRef = useRef(null);
    const secondsAtStartRef = useRef(0);
    const lastAutoSaveRef = useRef(0);
    const appState = useRef(AppState.currentState);
    const timerRef = useRef(null);

    // Task & UI States
    const [tasks, setTasks] = useState([]);
    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskForm, setTaskForm] = useState({ title: '', priority: 'Medium', purpose: 'Uni', description: '' });
    const [viewTask, setViewTask] = useState(null);
    const [actionMenuVisible, setActionMenuVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [userName, setUserName] = useState("Ahmed Hussain");
    const [userId, setUserId] = useState("SP23-BAI-007");
    const [profileImage, setProfileImage] = useState(null);
    const [greeting, setGreeting] = useState("Good Evening,");
    const [todayData, setTodayData] = useState(null);
    const [avgGoalData, setAvgGoalData] = useState({ current: "0.0", target: "10.0" });
    const [pendingMinutes, setPendingMinutes] = useState(null);

    const categories = [
        { id: 'Uni', icon: 'school-outline', color: '#3B82F6' },
        { id: 'FYP', icon: 'flask-outline', color: '#EF4444' },
        { id: 'Freelancing', icon: 'briefcase-outline', color: '#F59E0B' },
        { id: 'Career', icon: 'trending-up-outline', color: '#10B981' }
    ];
    const priorityColors = { High: '#EF4444', Medium: '#FACC15', Low: '#22C55E' };

    // --- LOGIC: BACKGROUND SYNC ---
    useEffect(() => {
        const subscription = AppState.addEventListener("change", nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === "active") {
                if (isActive && sessionStartRef.current) syncTimerDisplay();
            }
            appState.current = nextAppState;
        });
        return () => subscription.remove();
    }, [isActive]);

    const syncTimerDisplay = () => {
        if (!sessionStartRef.current) return;
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - sessionStartRef.current) / 1000);
        const newSecondsLeft = Math.max(secondsAtStartRef.current - elapsedSinceStart, 0);

        setSecondsLeft(newSecondsLeft);

        if (elapsedSinceStart - lastAutoSaveRef.current >= 300) {
            updateSecondsInDB(newSecondsLeft);
            lastAutoSaveRef.current = elapsedSinceStart;
        }

        if (newSecondsLeft <= 0 && isActive) stopSession();
    };

    useEffect(() => {
        if (isActive) {
            activateKeepAwake();
            timerRef.current = setInterval(syncTimerDisplay, 1000);
        } else {
            deactivateKeepAwake();
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            deactivateKeepAwake();
        };
    }, [isActive]);

    const loadDashboardData = async () => {
        const hour = new Date().getHours();
        setGreeting(hour < 12 ? "Good Morning," : hour < 17 ? "Good Afternoon," : hour < 21 ? "Good Evening," : "Good Night,");

        const [savedName, savedId] = await Promise.all([
            SecureStore.getItemAsync('user_profile_name'),
            SecureStore.getItemAsync('user_profile_id')
        ]);
        if (savedName) setUserName(savedName);
        if (savedId) setUserId(savedId);

        const todayStr = new Date().toISOString().split('T')[0];
        const savedSecondsTotal = getTotalSeconds();
        const stats = getTodayStats(todayStr);
        const dailyTasks = getTasksByDate(todayStr);

        if (!isActive) setSecondsLeft(savedSecondsTotal);

        setTodayData(stats);
        setTasks(dailyTasks);

        const todayProg = (Math.floor((stats?.total_daily_seconds || 0) / 360) / 10).toFixed(1);
        const diffDays = Math.ceil((new Date(new Date().getFullYear(), 11, 31) - new Date()) / 86400000) || 1;
        const reqTarget = (savedSecondsTotal / diffDays / 3600).toFixed(1);
        setAvgGoalData({ current: todayProg, target: reqTarget });
    };

    useFocusEffect(useCallback(() => {
        const syncImage = async () => {
            const img = await SecureStore.getItemAsync('user_profile_image');
            if (img) setProfileImage(img);
        };
        syncImage();
        loadDashboardData();
    }, [isActive]));

    // --- LOGIC: TIME ADJUSTMENT (Manual Study & Penalty) ---
    const handleAdjustTime = (minutes, isPenalty, category = null) => {
        const adjustmentSeconds = minutes * 60;
        const todayStr = new Date().toISOString().split('T')[0];

        if (isPenalty) {
            adjustSecondsInDB(adjustmentSeconds);

            setAdjustmentModalVisible(false);
            loadDashboardData();
            Alert.alert("Success", `Penalty of ${minutes}m added to yearly total.`);
        } else {
            adjustSecondsInDB(-adjustmentSeconds);
            if (category) {
                incrementStudyTime(todayStr, category, adjustmentSeconds);
            }

            setPendingMinutes(null);
            setAdjustmentModalVisible(false);
            loadDashboardData();
            Alert.alert("Success", `Added ${minutes}m to ${category} (Yearly debt reduced).`);
        }
    };

    // --- SESSION CONTROL ---
    const startWithCategory = (catId) => {
        if (isActive) return;
        setActiveCategory(catId);
        setShowCategoryModal(false);
        secondsAtStartRef.current = getTotalSeconds();
        sessionStartRef.current = Date.now();
        lastAutoSaveRef.current = 0;
        setIsActive(true);
    };

    const stopSession = () => {
        if (!sessionStartRef.current) return;
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        const todayStr = new Date().toISOString().split('T')[0];
        const finalSeconds = Math.max(secondsAtStartRef.current - elapsed, 0);

        updateSecondsInDB(finalSeconds);
        incrementStudyTime(todayStr, activeCategory, elapsed);

        sessionStartRef.current = null;
        setIsActive(false);
        setActiveCategory(null);
        loadDashboardData();
    };

    const handleLogout = () => setLogoutModalVisible(true);
    const confirmLogout = async () => {
        setLogoutModalVisible(false);
        await SecureStore.deleteItemAsync('user_session');
        router.replace("/");
    };

    const handleSaveTask = () => {
        if (!taskForm.title) return Alert.alert("Error", "Title required");
        editingTask ? updateTask(editingTask.id, taskForm) : addTask(taskForm);
        setTaskModalVisible(false); setEditingTask(null);
        setTaskForm({ title: '', priority: 'Medium', purpose: 'Uni', description: '' });
        loadDashboardData();
    };

    const time = {
        hrs: String(Math.floor(secondsLeft / 3600)).padStart(2, '0'),
        mins: String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0'),
        secs: String(secondsLeft % 60).padStart(2, '0')
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.fixedTop}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push("/profile")} style={styles.profile} activeOpacity={0.7}>
                        <Image key={profileImage} source={profileImage ? { uri: profileImage } : require("../assets/profile.jpg")} style={styles.avatar} resizeMode="cover" />
                        <View><Text style={styles.greeting}>{greeting}</Text><Text style={styles.name}>{userName}</Text></View>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        {/* MANUAL ADJUSTMENT BUTTON - Disabled when session is active */}
                        <TouchableOpacity
                            onPress={() => setAdjustmentModalVisible(true)}
                            disabled={isActive}
                            style={{ opacity: isActive ? 0.3 : 1 }}
                        >
                            <Ionicons name="options-outline" size={26} color="#3B82F6" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={28} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.focusHeader}>
                        <Text style={styles.energy}>{activeCategory ? `STUDYING ${activeCategory.toUpperCase()}` : "YEARLY TIME REMAINING"}</Text>
                        {isActive && <Text style={{ color: '#22C55E', fontWeight: 'bold' }}>● LIVE</Text>}
                    </View>
                    <View style={styles.timerRow}>
                        <View style={styles.timerBox}><Text style={styles.timerValue}>{time.hrs}</Text><Text style={styles.timerLabel}>HRS</Text></View>
                        <View style={styles.timerBox}><Text style={[styles.timerValue, { color: '#3B82F6' }]}>{time.mins}</Text><Text style={styles.timerLabel}>MIN</Text></View>
                        <View style={styles.timerBox}><Text style={styles.timerValue}>{time.secs}</Text><Text style={styles.timerLabel}>SEC</Text></View>
                    </View>
                    <TouchableOpacity style={[styles.startBtn, isActive && { backgroundColor: '#EF4444' }]} onPress={() => isActive ? stopSession() : setShowCategoryModal(true)}>
                        <Ionicons name={isActive ? "stop" : "play"} size={18} color="#fff" />
                        <Text style={styles.startText}>{isActive ? "Stop Session" : "Start Session"}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { borderLeftColor: '#22C55E' }]}>
                        <View style={styles.statIconHeader}><Ionicons name="trophy-outline" size={16} color="#22C55E" /><Text style={styles.statLabel}>DAILY GOAL</Text></View>
                        <View style={styles.statValueContainer}><Text style={styles.statMainValue}>{(Math.floor((todayData?.total_daily_seconds || 0) / 360) / 10).toFixed(1)}</Text><Text style={styles.statSubValue}>/ 10.0h</Text></View>
                        <View style={styles.fullProgressBg}><View style={[styles.fullProgressFill, { width: `${Math.min(((todayData?.total_daily_seconds || 0) / 36000) * 100, 100)}%`, backgroundColor: '#22C55E' }]} /></View>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
                        <View style={styles.statIconHeader}><Ionicons name="analytics-outline" size={16} color="#3B82F6" /><Text style={styles.statLabel}>REQUIRED AVG</Text></View>
                        <View style={styles.statValueContainer}><Text style={styles.statMainValue}>{avgGoalData.current}</Text><Text style={styles.statSubValue}>/ {avgGoalData.target}h</Text></View>
                        <View style={styles.fullProgressBg}><View style={[styles.fullProgressFill, { width: `${Math.min((parseFloat(avgGoalData.current) / parseFloat(avgGoalData.target)) * 100, 100)}%`, backgroundColor: '#3B82F6' }]} /></View>
                    </View>
                </View>

                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Today's Plan</Text><TouchableOpacity onPress={() => setTaskModalVisible(true)}><Ionicons name="add-circle" size={34} color="#3B82F6" /></TouchableOpacity></View>
            </View>

            <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
                {tasks.map((item) => (
                    <View key={item.id} style={[styles.task, item.status === 1 && { opacity: 0.5 }]}>
                        <TouchableOpacity style={styles.taskMain} onPress={() => setViewTask(item)}>
                            <View style={styles.taskInfo}>
                                <Text style={[styles.taskTitle, item.status === 1 && styles.taskDone]}>{item.title}</Text>
                                <View style={styles.tagRow}><View style={[styles.priorityDot, { backgroundColor: priorityColors[item.priority] }]} /><Text style={[styles.taskSub, { color: priorityColors[item.priority] }]}>{item.priority} • {item.purpose}</Text></View>
                            </View>
                            <TouchableOpacity onPress={() => { setSelectedTask(item); setActionMenuVisible(true); }} style={styles.threeDots}><Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" /></TouchableOpacity>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            {/* --- NEW: TIME ADJUSTMENT MODAL --- */}
            <Modal visible={adjustmentModalVisible} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => { setAdjustmentModalVisible(false); setPendingMinutes(null); }}>
                    <View style={styles.actionSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Manual Adjustments</Text>

                        {!pendingMinutes ? (
                            <>
                                <Text style={styles.adjLabel}>Add Study Time (Laptop)</Text>
                                <View style={styles.adjRow}>
                                    {[5, 10, 30, 60].map(m => (
                                        <TouchableOpacity key={m} style={styles.adjBtnStudy} onPress={() => setPendingMinutes(m)}>
                                            <Text style={styles.adjBtnText}>{m}m</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.adjLabel, { marginTop: 20 }]}>Penalty (Add to Remaining)</Text>
                                <View style={styles.adjRow}>
                                    {[5, 10, 30, 60].map(m => (
                                        <TouchableOpacity key={m} style={styles.adjBtnPenalty} onPress={() => handleAdjustTime(m, true)}>
                                            <Text style={styles.adjBtnText}>{m}m</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        ) : (
                            <View>
                                <Text style={[styles.sheetTitle, { fontSize: 16, color: '#3B82F6' }]}>
                                    Assign {pendingMinutes}m to which category?
                                </Text>
                                <View style={styles.categoryGrid}>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={styles.categoryItem}
                                            onPress={() => handleAdjustTime(pendingMinutes, false, cat.id)}
                                        >
                                            <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
                                                <Ionicons name={cat.icon} size={24} color={cat.color} />
                                            </View>
                                            <Text style={styles.categoryLabel}>{cat.id}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }} onPress={() => setPendingMinutes(null)}>
                                    <Text style={styles.cancelText}>Back to Minutes</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity style={{ marginTop: 30, alignSelf: 'center' }} onPress={() => { setAdjustmentModalVisible(false); setPendingMinutes(null); }}>
                            <Text style={styles.cancelText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* MODALS: Logout, Task actions, Add task, Category selector */}
            <Modal visible={logoutModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.logoutCard}>
                        <View style={styles.logoutIconCircle}><Ionicons name="log-out" size={32} color="#EF4444" /></View>
                        <Text style={styles.logoutTitle}>Logging Out?</Text>
                        <Text style={styles.logoutMessage}>Are you sure you want to end your session?</Text>
                        <View style={styles.logoutButtonRow}>
                            <TouchableOpacity style={styles.logoutCancelBtn} onPress={() => setLogoutModalVisible(false)}><Text style={styles.logoutCancelText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.logoutConfirmBtn} onPress={confirmLogout}><Text style={styles.logoutConfirmText}>Logout</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={actionMenuVisible} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setActionMenuVisible(false)}>
                    <View style={styles.actionSheet}>
                        <View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{selectedTask?.title}</Text>
                        <TouchableOpacity style={styles.sheetOption} onPress={() => { toggleTaskStatus(selectedTask.id, selectedTask.status); setActionMenuVisible(false); loadDashboardData(); }}><Ionicons name={selectedTask?.status === 1 ? "refresh-circle" : "checkmark-circle"} size={24} color="#3B82F6" /><Text style={styles.sheetOptionText}>{selectedTask?.status === 1 ? "Mark Pending" : "Mark Completed"}</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.sheetOption} onPress={() => { setEditingTask(selectedTask); setTaskForm({ title: selectedTask.title, priority: selectedTask.priority, purpose: selectedTask.purpose, description: selectedTask.description }); setActionMenuVisible(false); setTaskModalVisible(true); }}><Ionicons name="create-outline" size={24} color="#FACC15" /><Text style={styles.sheetOptionText}>Edit Task</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.sheetOption} onPress={() => Alert.alert("Delete", "Are you sure?", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => { deleteTask(selectedTask.id); setActionMenuVisible(false); loadDashboardData(); } }])}><Ionicons name="trash-outline" size={24} color="#EF4444" /><Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Delete Task</Text></TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            <Modal visible={taskModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingTask ? "Edit Task" : "New Task"}</Text>
                        <TextInput style={styles.input} placeholder="Task Title" placeholderTextColor="#64748B" value={taskForm.title} onChangeText={(t) => setTaskForm({ ...taskForm, title: t })} />
                        <View style={styles.pickerRow}>{['High', 'Medium', 'Low'].map(p => (<TouchableOpacity key={p} style={[styles.pickerChip, taskForm.priority === p && { backgroundColor: priorityColors[p], borderColor: priorityColors[p] }]} onPress={() => setTaskForm({ ...taskForm, priority: p })}><Text style={styles.chipText}>{p}</Text></TouchableOpacity>))}</View>
                        <View style={styles.pickerRow}>{['Uni', 'FYP', 'Freelancing', 'Career'].map(p => (<TouchableOpacity key={p} style={[styles.pickerChip, taskForm.purpose === p && styles.activeChip]} onPress={() => setTaskForm({ ...taskForm, purpose: p })}><Text style={styles.chipText}>{p}</Text></TouchableOpacity>))}</View>
                        <TextInput style={[styles.input, { height: 80 }]} placeholder="Description" placeholderTextColor="#64748B" multiline value={taskForm.description} onChangeText={(t) => setTaskForm({ ...taskForm, description: t })} />
                        <View style={styles.modalButtons}><TouchableOpacity style={styles.saveBtnTask} onPress={handleSaveTask}><Text style={styles.startText}>Save Task</Text></TouchableOpacity><TouchableOpacity onPress={() => setTaskModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity></View>
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={showCategoryModal} animationType="fade">
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        <View style={styles.categoryGrid}>
                            {categories.map((cat) => (
                                <TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => startWithCategory(cat.id)}>
                                    <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}><Ionicons name={cat.icon} size={24} color={cat.color} /></View>
                                    <Text style={styles.categoryLabel}>{cat.id}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setShowCategoryModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.bottomNav}>
                <TouchableOpacity><Ionicons name="home" size={24} color="#3B82F6" /></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/calendar")}><Ionicons name="calendar" size={24} color="#64748B" /></TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={() => { setEditingTask(null); setTaskForm({ title: '', priority: 'Medium', purpose: 'Uni', description: '' }); setTaskModalVisible(true); }}><Ionicons name="add" size={32} color="white" /></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/weeklystats")}><Ionicons name="bar-chart" size={24} color="#64748B" /></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/notebooks')}><Ionicons name="flag" size={24} color="#64748B" /></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070C16' },
    fixedTop: { paddingHorizontal: 20, paddingTop: 10 },
    scrollArea: { flex: 1, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
    greeting: { color: '#94A3B8', fontSize: 12 },
    name: { color: '#fff', fontSize: 18, fontWeight: '700' },
    card: { backgroundColor: '#111827', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    focusHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    energy: { color: '#3B82F6', fontWeight: '700', fontSize: 10, letterSpacing: 1.2 },
    timerRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    timerBox: { alignItems: 'center', backgroundColor: '#0B1220', paddingVertical: 14, borderRadius: 16, width: '30%', borderWidth: 1, borderColor: '#1F2937' },
    timerValue: { fontSize: 26, color: '#fff', fontWeight: '800' },
    timerLabel: { color: '#64748B', fontSize: 9, marginTop: 2, fontWeight: '600' },
    startBtn: { flexDirection: 'row', backgroundColor: '#2563EB', padding: 14, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8 },
    startText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: '#111827', borderRadius: 20, padding: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: '#1F2937' },
    statIconHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    statLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    statValueContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
    statMainValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
    statSubValue: { color: '#64748B', fontSize: 12, fontWeight: '600', marginLeft: 2 },
    fullProgressBg: { height: 6, backgroundColor: '#0B1220', borderRadius: 10, overflow: 'hidden' },
    fullProgressFill: { height: '100%', borderRadius: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    task: { backgroundColor: '#111827', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#1F2937' },
    taskMain: { flexDirection: 'row', alignItems: 'center' },
    taskInfo: { flex: 1 },
    taskTitle: { color: '#3B82F6', fontWeight: '700', fontSize: 17 },
    taskDone: { textDecorationLine: 'line-through', color: '#475569' },
    tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    priorityDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 8 },
    taskSub: { fontSize: 13, fontWeight: '600' },
    threeDots: { padding: 5 },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyTasks: { color: '#475569', textAlign: 'center', marginTop: 10, fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    logoutCard: { width: '85%', backgroundColor: '#111827', borderRadius: 28, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
    logoutIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    logoutTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 10 },
    logoutMessage: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    logoutButtonRow: { flexDirection: 'row', gap: 15, width: '100%' },
    logoutCancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: '#1F2937', alignItems: 'center' },
    logoutCancelText: { color: '#fff', fontWeight: '700' },
    logoutConfirmBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center' },
    logoutConfirmText: { color: '#fff', fontWeight: '700' },
    actionSheet: { backgroundColor: '#111827', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40 },
    sheetHandle: { width: 40, height: 5, backgroundColor: '#334155', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
    sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 15, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    sheetOptionText: { color: '#fff', fontSize: 16, fontWeight: '500' },
    modalContent: { width: '90%', backgroundColor: '#111827', borderRadius: 24, padding: 24 },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#070C16', borderRadius: 12, padding: 15, color: '#fff', marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    pickerRow: { flexDirection: 'row', gap: 8, marginBottom: 15, flexWrap: 'wrap', justifyContent: 'center' },
    pickerChip: { backgroundColor: '#070C16', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#1F2937' },
    activeChip: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    chipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    modalButtons: { marginTop: 10, alignItems: 'center', gap: 15 },
    saveBtnTask: { width: '100%', backgroundColor: '#2563EB', padding: 15, borderRadius: 12, alignItems: 'center' },
    cancelText: { color: '#EF4444', fontWeight: '600' },
    bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80, backgroundColor: "#0B1220", flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 1, borderTopColor: "#1F2937", paddingBottom: 20 },
    fab: { backgroundColor: '#2563EB', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginTop: -50, elevation: 10 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
    categoryItem: { width: 80, alignItems: 'center', gap: 8 },
    iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    categoryLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
    // ADJUSTMENT STYLES
    adjLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700', marginBottom: 10 },
    adjRow: { flexDirection: 'row', justifyContent: 'space-between' },
    adjBtnStudy: { backgroundColor: '#1D4ED8', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 10 },
    adjBtnPenalty: { backgroundColor: '#B91C1C', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 10 },
    adjBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
});
