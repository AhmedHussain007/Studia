import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteNote, getNoteById } from '../../notebooks'; // Ensure path is correct

export default function ViewNote() {
    const router = useRouter();
    const { note } = useLocalSearchParams(); // This is the ID from the filename [note].js
    const [noteData, setNoteData] = useState(null);

    useEffect(() => {
        if (note) {
            const data = getNoteById(note);
            if (data) {
                setNoteData(data);
            }
        }
    }, [note]);

    const confirmDelete = () => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to delete this note?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteNote(note);
                        router.back();
                    }
                }
            ]
        );
    };

    if (!noteData) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerSubtitle}>NOTE</Text>
                    <Text style={styles.headerTitle} numberOfLines={1}>{noteData.title}</Text>
                </View>

                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={confirmDelete}>
                        <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.noteTitle}>{noteData.title}</Text>

                    <View style={styles.editedRow}>
                        <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                        <Text style={styles.editedText}>
                            Created on {noteData.date}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Note Body */}
                    <Text style={styles.paragraph}>
                        {noteData.content || "No content in this note."}
                    </Text>
                </View>
            </ScrollView>

            {/* Floating Edit Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push({
                    pathname: "/newnote",
                    params: {
                        editMode: true,
                        noteId: noteData.id,
                        initialTitle: noteData.title,
                        initialContent: noteData.content,
                        notebookId: noteData.notebook_id
                    }
                })}
            >
                <Ionicons name="pencil" size={22} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0F14',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 10,
    },
    headerSubtitle: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 16,
    },
    scroll: {
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#1A2028',
        margin: 14,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    noteTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
        lineHeight: 32,
    },
    editedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    editedText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#2D3748',
        marginVertical: 18,
    },
    paragraph: {
        color: '#E2E8F0',
        fontSize: 16,
        lineHeight: 26,
        marginBottom: 14,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 30,
        backgroundColor: '#2563EB',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#2563EB',
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
});
