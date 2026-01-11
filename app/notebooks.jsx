import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { deleteNotebook, getNotebooks } from "../notebooks";

export default function NotebooksScreen() {
    const router = useRouter();
    const [notebooks, setNotebooks] = useState([]);
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedNotebook, setSelectedNotebook] = useState(null);

    useFocusEffect(
        useCallback(() => {
            setNotebooks(getNotebooks());
        }, [])
    );

    const openMenu = (item) => {
        setSelectedNotebook(item);
        setMenuVisible(true);
    };

    const handleDelete = () => {
        if (!selectedNotebook) return;

        Alert.alert(
            "Delete Notebook",
            `Delete "${selectedNotebook.title}" and all its notes?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: () => {
                        deleteNotebook(selectedNotebook.id);
                        setMenuVisible(false);
                        setNotebooks(getNotebooks());
                        setSelectedNotebook(null);
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        if (!selectedNotebook) return;
        setMenuVisible(false);
        router.push({
            pathname: "/newnotebook",
            params: {
                editMode: "true",
                id: selectedNotebook.id,
                initialTitle: selectedNotebook.title,
                initialIcon: selectedNotebook.icon,
                initialColor: selectedNotebook.color
            }
        });
    };

    return (
        <LinearGradient colors={["#0B1220", "#0E1628"]} style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Notebooks</Text>
                    <Text style={styles.subtitle}>Organize your study notes</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="search" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={notebooks}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 140 }}
                renderItem={({ item }) => (
                    <View style={styles.cardContainer}>
                        <TouchableOpacity
                            style={styles.cardMain}
                            onPress={() => router.push({
                                pathname: `/notes/${item.id}`,
                                params: { notebookId: item.id, title: item.title },
                            })}
                        >
                            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                                <Feather name={item.icon} size={22} color="#fff" />
                            </View>
                            <View style={styles.cardText}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardSubtitle}>{item.noteCount || 0} Notes</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openMenu(item)} style={styles.threeDots}>
                            <MaterialIcons name="more-vert" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Bottom Sheet Action Menu */}
            <Modal visible={menuVisible} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
                    <View style={styles.actionSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>{selectedNotebook?.title}</Text>
                        <TouchableOpacity style={styles.sheetOption} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={24} color="#FACC15" />
                            <Text style={styles.sheetOptionText}>Edit Notebook</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetOption} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={24} color="#EF4444" />
                            <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Delete Notebook</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* FIXED FAB - Now positioned absolutely above the nav bar */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push("/newnotebook")}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            <View style={styles.bottomNav}>
                <TouchableOpacity onPress={() => router.push("dashboard")}><Ionicons name="home" size={24} color="#64748B" /></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/calendar")}><Ionicons name="calendar" size={24} color="#64748B" /></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/weeklystats")}><Ionicons name="bar-chart" size={24} color="#64748B" /></TouchableOpacity>
                <TouchableOpacity><Ionicons name="flag" size={24} color="#3B82F6" /></TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
    title: { fontSize: 32, fontWeight: "700", color: "#fff" },
    subtitle: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
    cardContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", borderRadius: 18, marginBottom: 15, paddingRight: 5 },
    cardMain: { flex: 1, flexDirection: "row", alignItems: "center", padding: 18 },
    iconBox: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 15 },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
    cardSubtitle: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
    threeDots: { padding: 15 },

    // THE FIXED FAB STYLE
    fab: {
        position: "absolute",
        right: 25,
        bottom: 100, // Positioned higher to clear the bottomNav (which is 80 height)
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#2563EB",
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 999 // Ensure it stays on top
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    actionSheet: { backgroundColor: '#111827', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 25, paddingBottom: 45 },
    sheetHandle: { width: 40, height: 5, backgroundColor: '#374151', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 25, textAlign: 'center' },
    sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 15, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    sheetOptionText: { color: '#fff', fontSize: 16, fontWeight: '600' },

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
});
