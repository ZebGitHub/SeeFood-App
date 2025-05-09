import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity, LayoutAnimation, } from "react-native";
import { auth, db } from "../../services/FirebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import DropDownPicker from "react-native-dropdown-picker";
import { signOut } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/navigation";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';


type UserScreenNavigationProp = StackNavigationProp<RootStackParamList, "User">;

const User = () => {
    const navigation = useNavigation<UserScreenNavigationProp>();
    const user = auth.currentUser;
    const [email, setEmail] = useState(user?.email || "");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [allergyOpen, setAllergyOpen] = useState(false);
    const [sensitiveOpen, setSensitiveOpen] = useState(false);
    const [allergyValue, setAllergyValue] = useState<string[]>([]);
    const [sensitiveValue, setSensitiveValue] = useState<string[]>([]);
    // Created a drop down menu of simple allergies and sensitivities that are available in the drop down
    const [dropdownItems, setDropdownItems] = useState([
        { label: "Peanuts", value: "Peanuts" },
        { label: "Nuts", value: "Nuts" },
        { label: "Dairy", value: "Dairy" },
        { label: "Gluten", value: "Gluten" },
        { label: "Chicken", value: "Chicken" },
        { label: "Beef", value: "Beef" },
        { label: "Shellfish", value: "Shellfish" },
        { label: "Xanthan Gum", value: "Xanthan Gum" },
        { label: "Agar", value: "Agar" },
        { label: "Soy", value: "Soy" },
        { label: "Egg", value: "Egg"},
        { label: "Almonds", value: "Almonds" },
    ]);

    const userRef = user ? doc(db, "users", user.uid) : null;
    
    //Helps user signout and previous user input values
    const handleSignOut = async () => {
        try {
            setFirstName("");
            setLastName("");
            setEmail("");
            setAllergyValue([]);
            setSensitiveValue([]);
            await signOut(auth);
            navigation.navigate("Login");
        } catch (error: any) {
            alert("Error signing out: " + error.message);
        }
    };
    
//import user data
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                const ref = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(ref);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFirstName(data.firstName || "");
                    setLastName(data.lastName || "");
                    setEmail(data.email || "");
                    setAllergyValue(data.allergies || []);
                    setSensitiveValue(data.sensitive || []);
                } else {
                    setFirstName("");
                    setLastName("");
                    setEmail(currentUser.email || "");
                    setAllergyValue([]);
                    setSensitiveValue([]);
                }
            }
        });
    
        return unsubscribe;
    }, []);
    
    
    //allergy and sensitivity tags
    const handleRemoveTag = (tagToRemove: string, type: "allergy" | "sensitive") => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
        if (type === "allergy") {
            setAllergyValue((prev) => prev.filter((tag) => tag !== tagToRemove));
        } else if (type === "sensitive") {
            setSensitiveValue((prev) => prev.filter((tag) => tag !== tagToRemove));
        }
    };
    
//User can save updates to their account
    const handleSave = async () => {
        if (user) {
            await setDoc(doc(db, "users", user.uid), {
                firstName,
                lastName,
                email,
                allergies: allergyValue,
                sensitive: sensitiveValue,
            });
            
            alert("Profile updated!");
        }
    };
    
    
    return (
            <View style={styles.container}>
                <KeyboardAwareScrollView contentContainerStyle={styles.scrollContainer} extraScrollHeight={20}>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.title}>Your Profile</Text>
        
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
                        value={email}
                        editable={false}
                        placeholder="Email"
                    />
        
                    <Text style={styles.labelH}>Allergies:</Text>
                    <DropDownPicker
                        open={allergyOpen}
                        value={allergyValue}
                        items={dropdownItems}
                        setOpen={setAllergyOpen}
                        setValue={setAllergyValue}
                        setItems={setDropdownItems}
                        multiple={true}
                        min={0}
                        max={10}
                        placeholder="Choose Your Allergy"
                        style={{ marginBottom: allergyOpen ? 150 : 10 }}
                        listMode="SCROLLVIEW"
                    />
        
                    <View style={styles.allergySection}>
                        <Text style={styles.allergyLabel}>Your Allergies:</Text>
                        <View style={styles.tagsContainer}>
                            {allergyValue.map((tag) => (
                                <TouchableOpacity
                                    key={tag}
                                    style={styles.tagBubble}
                                    onPress={() => handleRemoveTag(tag, "allergy")}
                                >
                                    <Text style={styles.tagText}>{tag} ✕</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
        
                    <Text style={styles.labelH}>Sensitive Ingredients:</Text>
                    <DropDownPicker
                        open={sensitiveOpen}
                        value={sensitiveValue}
                        items={dropdownItems}
                        setOpen={setSensitiveOpen}
                        setValue={setSensitiveValue}
                        setItems={setDropdownItems}
                        multiple={true}
                        min={0}
                        max={10}
                        placeholder="Choose Your Ingredient Sensitivity"
                        style={{ marginBottom: sensitiveOpen ? 150 : 10 }}
                        listMode="SCROLLVIEW"
                    />
        
                    <View style={styles.allergySection}>
                        <Text style={styles.allergyLabel}>Your Sensitivities:</Text>
                        <View style={styles.tagsContainer}>
                            {sensitiveValue.map((tag) => (
                                <TouchableOpacity
                                    key={tag}
                                    style={styles.tagBubble}
                                    onPress={() => handleRemoveTag(tag, "sensitive")}
                                >
                                    <Text style={styles.tagText}>{tag} ✕</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
        
                    <TouchableOpacity style={styles.button} onPress={handleSave}>
                        <Text style={styles.saveText}>Save Profile</Text>
                    </TouchableOpacity>
                </KeyboardAwareScrollView>
            </View>
        );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 20,
        backgroundColor: "#FAF3E3" 
    },

    title: { 
        fontSize: 24, 
        fontWeight: "bold", 
        marginTop: 10,
        marginBottom: 20 
    },

    label: { 
        marginTop: 20, 
        fontWeight: "600" 
    },

    input: {
        borderWidth: 1,
        borderColor: "black",
        backgroundColor: "#fff",
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,

    },
    button:{
        backgroundColor: "#F86400",
        marginTop:5,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10, 
        alignSelf: "center",
    },
    saveText:{
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },

    allergySection: {
        borderWidth: 3,
        borderColor: "grey",
        borderRadius: 20,
        padding: 10,
        backgroundColor: "#fff",
        marginTop: 10,
        marginBottom: 20,
    },
    
    allergyLabel: {
        fontWeight: "bold",
        marginBottom: 8,
        fontSize: 16,
    },
    
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    
    tagBubble: {
        backgroundColor: "#F86400",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        margin: 4,
    },
    
    tagText: {
        color: "#fff",
        fontWeight: "600",
    },  
    
    labelH:{
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 8,
        fontSize: 16,
    },

    signOutButton: {
        backgroundColor: "#F86400",
        marginTop: 40,
        marginBottom:20,
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 30,
        alignSelf: "flex-start",
    },
    signOutText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    scrollContainer: {
        paddingBottom: 70,
    },    

    logo: {
        width: 250,
        height: 150,
        resizeMode: "contain",
        alignSelf: "center",
    },
});

export default User;
