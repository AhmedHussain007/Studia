import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addNote, updateNote } from '../notebooks'; // Path to notebooks.js

export default function NewNote() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // notebookId is required for new notes
    // editMode, noteId, initialTitle, initialContent come from ViewNote screen
    const { notebookId, editMode, noteId, initialTitle, initialContent } = params;

    const [title, setTitle] = useState(initialTitle || '');
    const [description, setDescription] = useState(initialContent || '');

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert("Error", "Please enter a title for your note.");
            return;
        }

        try {
            if (editMode) {
                // Update existing note
                updateNote(noteId, title.trim(), description.trim());
            } else {
                // Add new note
                if (!notebookId) {
                    Alert.alert("Error", "Notebook reference missing.");
                    return;
                }
                addNote(notebookId, title.trim(), description.trim());
            }

            router.back();
        } catch (error) {
            console.error("Save Note Error:", error);
            Alert.alert("Error", "Failed to save note.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editMode ? "Edit Note" : "New Note"}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close-outline" size={26} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Note Card */}
            <View style={styles.card}>
                <View style={styles.lastEditedRow}>
                    <Text style={styles.lastEditedLabel}>STATUS</Text>
                    <Text style={styles.lastEditedDate}>
                        {editMode ? "Editing Note..." : "Drafting New Note"}
                    </Text>
                </View>

                {/* Title Input */}
                <TextInput
                    placeholder="Enter note title"
                    placeholderTextColor="#4B5563"
                    style={styles.titleInput}
                    value={title}
                    onChangeText={setTitle}
                    autoFocus={!editMode}
                />

                <View style={styles.divider} />

                {/* Description Input */}
                <TextInput
                    placeholder="Start writing your note..."
                    placeholderTextColor="#4B5563"
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    textAlignVertical="top"
                />
            </View>

            {/* Fixed Toolbar */}
            <View style={styles.toolbar}>
                <TouchableOpacity><Text style={styles.toolbarText}>B</Text></TouchableOpacity>
                <TouchableOpacity><Text style={[styles.toolbarText, styles.italic]}>I</Text></TouchableOpacity>
                <Ionicons name="list" size={22} color="#9CA3AF" />
                <Ionicons name="checkbox-outline" size={22} color="#9CA3AF" />
                <Ionicons name="image-outline" size={22} color="#9CA3AF" />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                    {editMode ? "Update Note" : "Save Note"}
                </Text>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    card: {
        backgroundColor: '#1A2028',
        marginHorizontal: 14,
        marginTop: 10,
        borderRadius: 22,
        padding: 20,
        flex: 1,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    lastEditedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    lastEditedLabel: {
        color: '#3B82F6',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    lastEditedDate: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },
    titleInput: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        paddingVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#2D3748',
        marginVertical: 16,
    },
    descriptionInput: {
        flex: 1,
        fontSize: 17,
        color: '#CBD5E1',
        lineHeight: 24,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderColor: '#1F2937',
        backgroundColor: '#0B0F14',
    },
    toolbarText: {
        color: '#9CA3AF',
        fontSize: 18,
        fontWeight: '800',
    },
    italic: {
        fontStyle: 'italic',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#2563EB',
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
