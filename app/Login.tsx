import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { auth } from "../services/FirebaseConfig";
import { RootStackParamList } from "../types/navigation";

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Login">;

const Login = () => {const navigation = useNavigation<LoginScreenNavigationProp>();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    //Allows user to login if information is in the authentication database
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter your email and password!");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            Alert.alert("Success", "Login successful!");
            navigation.navigate("(tabs)", { screen: "User" });
        } catch (error: any) {
            Alert.alert("Error", "Login failed: " + error.message);
        }
    };

    // If User forgets password they get an email to help reset it
    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email to reset your password.");
            return;
        }
    
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert("Success", "Password reset email sent!");
        } catch (error: any) {
            Alert.alert("Error", "Failed to send reset email: " + error.message);
        }
    };
    

    return (
        <View style={styles.container}>
            
            <Image source={require("../assets/images/SeeFood-O.png")}
            style={styles.logo}
            />

            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Enter Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <View style={styles.row}>
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
            </View>

            <Text
                style={styles.registerLink}
            >
                Don't have an account?
            </Text>

            <TouchableOpacity style={styles.buttonRegister} onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerText}>Register Now</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#FAF3E3",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        color: "black",
        alignSelf: "flex-start", 
    },
    input: {
        width: "100%",
        padding: 10,
        borderWidth: 1,
        borderColor: "black",
        backgroundColor: "white",
        marginBottom: 10,
        borderRadius: 5,
        color: "black",
    },
    
    button: {
        backgroundColor: "#F86400",
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 10, 
        alignSelf: "flex-start",
    },

    buttonRegister: {
        backgroundColor: "#F86400",
        marginTop:5,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10, 
        alignSelf: "center",

    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginTop: 5,
        marginBottom: 20,
    },
    forgotPasswordContainer: {
        marginLeft: 10,
    },
      forgotPasswordText: {
        color: "#3E424B",
        textAlign: "right",
        fontWeight:"bold",
        marginBottom: 15,
        alignSelf:"flex-end",
    },
    registerText:{   
        color: "white",
        fontWeight:"bold",
        fontSize: 15,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
      },      
    registerLink: {
        marginTop: 30,
        color: "black",
        textAlign: "center",
    },

    logo: {
        width: 250,
        height: 150,
        resizeMode: "contain",
        alignSelf: "center",
    },
    
});

export default Login;
