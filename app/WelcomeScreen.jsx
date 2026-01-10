import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store'; // 1. Import SecureStore
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkPassword, initDB } from "../users";

export default function WelcomeScreen() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Prevent flicker while checking session

    useEffect(() => {
        const prepareApp = async () => {
            initDB();
            // 2. Check if a session already exists
            const userSession = await SecureStore.getItemAsync('user_session');
            if (userSession === 'logged_in') {
                router.replace("/dashboard"); // Use replace so they can't go back to login
            }
            setIsLoading(false);
        };
        prepareApp();
    }, []);

    const handleLogin = async () => {
        if (checkPassword(password)) {
            // 3. Save the session
            await SecureStore.setItemAsync('user_session', 'logged_in');
            router.replace("/dashboard");
        } else {
            Alert.alert("Error", "Incorrect Password");
        }
    };

    if (isLoading) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.content}
            >
                <Text style={styles.title}>Welcome Back!</Text>

                <View style={styles.imageContainer}>
                    <Image
                        source={require("../assets/images/welcome-image.png")}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Enter Password"
                            placeholderTextColor="#777"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            style={styles.input}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={22}
                                color="#777"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={handleLogin}
                        style={styles.loginButton}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    content: { flex: 1, justifyContent: "space-around", paddingVertical: 20 },
    title: { color: "#fff", fontWeight: "bold", fontSize: 36, textAlign: "center", marginTop: 20 },
    imageContainer: { alignItems: "center", justifyContent: "center" },
    image: { width: 300, height: 300 },
    formContainer: { paddingHorizontal: 28, width: "100%" },

    // Wrapper to hold the input and the absolute eye icon
    inputWrapper: {
        position: 'relative',
        width: '100%',
        marginBottom: 20,
    },
    input: {
        backgroundColor: "#111",
        color: "#fff",
        paddingVertical: 15,
        paddingHorizontal: 20,
        paddingRight: 55, // Extra padding so text doesn't hide behind icon
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#333",
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: 0,
        height: '100%',
        justifyContent: 'center',
    },

    loginButton: {
        paddingVertical: 16,
        backgroundColor: "#1e3a8a",
        borderRadius: 12,
        shadowColor: "#1e3a8a",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 5,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        color: "#fff",
        letterSpacing: 1,
    },
});
