import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
// Ensure these are exported in your notebooks.js
import { deleteNote, deleteNotebook, getNotebooks, getNotesByNotebook } from "../../notebooks";

export default function NotesListScreen() {
    const router = useRouter();
    // Use notebookId to match your file name [notebookId].jsx
    const { notebookId, title: paramTitle } = useLocalSearchParams();

    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentNotebook, setCurrentNotebook] = useState(null);

    // Menu States
    const [noteMenuVisible, setNoteMenuVisible] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [notebookMenuVisible, setNotebookMenuVisible] = useState(false);

    const loadData = useCallback(() => {
        if (!notebookId) return;

        try {
            // 1. Fetch Notes
            const data = getNotesByNotebook(notebookId);
            setNotes(data || []); // Fallback to empty array if null

            // 2. Fetch Notebook Details for the header
            const allNotebooks = getNotebooks();
            const found = allNotebooks.find(n => n.id.toString() === notebookId.toString());
            if (found) setCurrentNotebook(found);
        } catch (error) {
            console.error("Load Data Error:", error);
        }
    }, [notebookId]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    // Added a safety check (n?.title) to prevent "property of null" errors
    const filteredNotes = notes.filter(n =>
        n?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Note Actions ---
    const openNoteMenu = (item) => {
        setSelectedNote(item);
        setNoteMenuVisible(true);
    };

    const handleDeleteNote = () => {
        if (!selectedNote) return;
        Alert.alert("Delete Note", `Delete "${selectedNote.title}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => {
                deleteNote(selectedNote.id);
                setNoteMenuVisible(false);
                loadData();
            }}
        ]);
    };

    const handleEditNote = () => {
        if (!selectedNote) return;
        setNoteMenuVisible(false);
        router.push({
            pathname: "/newnote",
            params: {
                editMode: "true",
                noteId: selectedNote.id,
                initialTitle: selectedNote.title,
                initialContent: selectedNote.content,
                notebookId: notebookId
            }
        });
    };

    // --- Notebook Actions (Top Bar) ---
    const handleDeleteNotebook = () => {
        setNotebookMenuVisible(false);
        Alert.alert("Delete Notebook", `Are you sure? This will delete "${currentNotebook?.title || paramTitle}" and all its notes.`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => {
                deleteNotebook(notebookId);
                router.replace("/notebooks");
            }}
        ]);
    };

    const handleEditNotebook = () => {
        setNotebookMenuVisible(false);
        if (!currentNotebook) return;
        router.push({
            pathname: "/newnotebook",
            params: {
                editMode: "true",
                id: currentNotebook.id,
                initialTitle: currentNotebook.title,
                initialIcon: currentNotebook.icon,
                initialColor: currentNotebook.color
            }
        });
    };

    return (
        <LinearGradient colors={["#070C16", "#0B1220"]} style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>{currentNotebook?.title || paramTitle || "Notes"}</Text>

                <TouchableOpacity onPress={() => setNotebookMenuVisible(true)}>
                    <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                    placeholder="Search titles..."
                    placeholderTextColor="#9CA3AF"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Notes List */}
            <FlatList
                data={filteredNotes}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 120 }}
                ListEmptyComponent={<Text style={styles.emptyText}>No notes found.</Text>}
                renderItem={({ item }) => (
                    <View style={styles.noteCardContainer}>
                        <TouchableOpacity
                            style={styles.noteCardMain}
                            onPress={() => router.push({ pathname: `/note/${item.id}`, params: { title: item.title } })}
                        >
                            <View style={styles.noteHeader}>
                                <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.noteDate}>{item.date}</Text>
                            </View>
                            {/* Guarded with || to prevent null content crash */}
                            <Text style={styles.notePreview} numberOfLines={2}>
                                {item.content || "No content provided."}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openNoteMenu(item)} style={styles.threeDots}>
                            <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* MODAL 1: Individual Note Actions */}
            <Modal visible={noteMenuVisible} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setNoteMenuVisible(false)}>
                    <View style={styles.actionSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Note: {selectedNote?.title}</Text>
                        <TouchableOpacity style={styles.sheetOption} onPress={handleEditNote}>
                            <Ionicons name="create-outline" size={24} color="#FACC15" />
                            <Text style={styles.sheetOptionText}>Edit Note</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetOption} onPress={handleDeleteNote}>
                            <Ionicons name="trash-outline" size={24} color="#EF4444" />
                            <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Delete Note</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* MODAL 2: Notebook Settings */}
            <Modal visible={notebookMenuVisible} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setNotebookMenuVisible(false)}>
                    <View style={styles.actionSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Notebook Settings</Text>
                        <TouchableOpacity style={styles.sheetOption} onPress={handleEditNotebook}>
                            <Ionicons name="settings-outline" size={24} color="#3B82F6" />
                            <Text style={styles.sheetOptionText}>Edit Notebook Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetOption} onPress={handleDeleteNotebook}>
                            <Ionicons name="trash-outline" size={24} color="#EF4444" />
                            <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Delete Entire Notebook</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => router.push({ pathname: "/newnote", params: { notebookId: notebookId } })}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#111827", borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 20, borderWidth: 1, borderColor: '#1F2937' },
    searchInput: { flex: 1, marginLeft: 10, color: "#fff", fontSize: 14 },
    noteCardContainer: { flexDirection: 'row', backgroundColor: "#111827", borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1F2937', alignItems: 'center' },
    noteCardMain: { flex: 1, padding: 18 },
    noteHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 8 },
    noteTitle: { fontSize: 16, fontWeight: "700", color: "#fff", flex: 1, paddingRight: 10 },
    noteDate: { fontSize: 11, color: "#64748B", fontWeight: '600' },
    notePreview: { fontSize: 14, color: "#9CA3AF", lineHeight: 20 },
    threeDots: { padding: 15 },
    emptyText: { color: '#475569', textAlign: 'center', marginTop: 40, fontSize: 15 },
    fab: { position: "absolute", right: 24, bottom: 40, width: 64, height: 64, borderRadius: 32, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center", elevation: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    actionSheet: { backgroundColor: '#111827', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40 },
    sheetHandle: { width: 40, height: 5, backgroundColor: '#334155', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
    sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 15, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    sheetOptionText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});
