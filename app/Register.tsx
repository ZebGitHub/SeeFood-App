import React, { useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet,Image } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/FirebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { StackNavigationProp } from "@react-navigation/stack";
import { doc, setDoc } from "firebase/firestore";

type RegistrationScreenNavigationProp = StackNavigationProp<RootStackParamList, "Register">;

const Register = () => {
    const navigation = useNavigation<RegistrationScreenNavigationProp>();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    //Password requirements (needs to be 8 digits, one uppercase letter, have numbers and special characters for security)
    const isValidPassword = (password: string) => {
        return (
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password)
        );
    };

    // Password needs to be valid otherwise error message
    const handleRegister = async () => {
        if (!isValidPassword(password)) {
            Alert.alert("Error", "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }

        // When account is created, populates user information in both authentication and user/allergy documents (Firestore)
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                firstName,
                lastName,
                email: user.email,
            });

            Alert.alert("Success", "Registration successful!");
            navigation.navigate("Login");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require("../assets/images/SeeFood-O.png")}
            style={styles.logo}
            />
            <Text style={styles.title}>Register</Text>
            <TextInput 
                style={styles.input} 
                placeholder="First Name" 
                value={firstName} 
                onChangeText={setFirstName} 
            />
            <TextInput 
                style={styles.input} 
                placeholder="Last Name" 
                value={lastName} 
                onChangeText={setLastName} 
            />
            <TextInput 
                style={styles.input} 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
            />
            <TextInput 
                style={styles.input} 
                placeholder="Password" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
            />
            <TextInput 
                style={styles.input} 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry 
            />
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>

            <Text style={styles.loginLink}>Already have an account?</Text>
            <TouchableOpacity style={styles.buttonLogin} onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginText}>Login Here</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#FAF3E3",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        alignSelf: "flex-start", 
        marginBottom: 20,
        color: "black",
    },
    input: {
        width: "100%",
        padding: 10,
        borderWidth: 1,
        borderColor: "black",
        marginBottom: 10,
        borderRadius: 5,
        backgroundColor: "white",

    },
    button: {
        backgroundColor: "#F86400",
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 10, 
        alignSelf: "flex-start",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    buttonLogin: {
        backgroundColor: "#F86400",
        marginTop: 5,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10, 
        alignSelf: "center",
    },
    loginText: {   
        color: "white",
        fontWeight: "bold",
        fontSize: 15,
    },
    loginLink: {
        marginTop: 30,
        color: "black",
    },
    logo: {
        width: 250,
        height: 150,
        resizeMode: "contain",
        alignSelf: "center",
    },
});

export default Register;
