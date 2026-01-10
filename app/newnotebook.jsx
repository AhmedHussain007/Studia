import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { addNotebook, updateNotebook } from "../notebooks"; // Import both functions

const COLORS = [
    "#1E3A8A", // Deep Blue
    "#7C3E1D", // Brown
    "#0F766E", // Teal
    "#5B3B8C", // Purple
    "#7C2D5A", // Maroon
    "#2563EB", // Bright Blue
];

const ICONS = ["book", "edit", "clipboard", "tool", "star", "file-text"];

export default function NewNotebook() {
    const router = useRouter();
    const params = useLocalSearchParams(); // Get params passed from notebooks.jsx

    // Check if we are in edit mode
    const isEditMode = params.editMode === "true";

    const [title, setTitle] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

    // Pre-fill values if we are editing
    useEffect(() => {
        if (isEditMode) {
            setTitle(params.initialTitle || "");
            setSelectedColor(params.initialColor || COLORS[0]);
            setSelectedIcon(params.initialIcon || ICONS[0]);
        }
    }, [isEditMode]);

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert("Error", "Please enter a title for your notebook.");
            return;
        }

        try {
            if (isEditMode) {
                // Update existing notebook in DB
                updateNotebook(params.id, title.trim(), selectedIcon, selectedColor);
            } else {
                // Create new notebook in DB
                addNotebook(title.trim(), selectedIcon, selectedColor);
            }
            router.back();
        } catch (error) {
            console.error("Failed to save notebook:", error);
            Alert.alert("Error", "Failed to save notebook. Please try again.");
        }
    };

    return (
        <LinearGradient colors={["#0B1220", "#0E1628"]} style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditMode ? "Edit Notebook" : "New Notebook"}</Text>
                <View style={{ width: 26 }} />
            </View>

            {/* Title Input */}
            <Text style={styles.label}>Notebook Title</Text>
            <TextInput
                placeholder="e.g. AI Lectures"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                autoFocus={!isEditMode} // Only autofocus on new notebooks
            />

            {/* Icon Picker */}
            <Text style={styles.label}>Choose Icon</Text>
            <View style={styles.row}>
                {ICONS.map((icon) => (
                    <TouchableOpacity
                        key={icon}
                        onPress={() => setSelectedIcon(icon)}
                        style={[
                            styles.iconBox,
                            selectedIcon === icon && styles.activeBox,
                        ]}
                    >
                        <Feather
                            name={icon}
                            size={22}
                            color={selectedIcon === icon ? "#fff" : "#94A3B8"}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Color Picker */}
            <Text style={styles.label}>Choose Color</Text>
            <View style={styles.row}>
                {COLORS.map((color) => (
                    <TouchableOpacity
                        key={color}
                        onPress={() => setSelectedColor(color)}
                        style={[
                            styles.colorDot,
                            { backgroundColor: color },
                            selectedColor === color && styles.activeDot,
                        ]}
                    />
                ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.createBtn, !title.trim() && { opacity: 0.6 }]}
                onPress={handleSave}
            >
                <Text style={styles.createText}>
                    {isEditMode ? "Update Changes" : "Create Notebook"}
                </Text>
            </TouchableOpacity>

        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    label: {
        color: "#CBD5E1",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        marginTop: 18,
    },
    input: {
        backgroundColor: "#1F2937",
        borderRadius: 14,
        padding: 16,
        color: "#fff",
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#374151",
    },
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 6,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#1F2937",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "transparent",
    },
    activeBox: {
        borderWidth: 2,
        borderColor: "#2563EB",
        backgroundColor: "#1E3A8A30",
    },
    colorDot: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 2,
        borderColor: "transparent",
    },
    activeDot: {
        borderColor: "#fff",
        transform: [{ scale: 1.1 }],
    },
    createBtn: {
        marginTop: 40,
        backgroundColor: "#2563EB",
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: "center",
        shadowColor: "#2563EB",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    createText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
