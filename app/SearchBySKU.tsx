import React, { useState } from "react";
import {View,Text,TextInput,Button,StyleSheet,Alert,TouchableOpacity,Image,} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";


const SearchBySKU = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!sku) {
      Alert.alert("Error", "Please enter a SKU to search!");
      return;
    }

    setLoading(true);

    try {
      const url = `https://p4lbsrtoee.execute-api.us-east-1.amazonaws.com/main/query?limit=100`;
      const response = await fetch(url);
      const products = await response.json();

      if (!Array.isArray(products)) {
        console.error("Unexpected data structure:", products);
        Alert.alert("Error", "Failed to load products.");
        return;
      }

      const product = products.find((item: any) => {
        const itemSku = item.barcode?.toString().trim();
        return itemSku?.includes(sku) || sku?.includes(itemSku);
      });

      if (product) {
        navigation.navigate("ProductDetail", { productId: sku, product });
      } else {
        Alert.alert("Not Found", `Product with SKU ${sku} not found.`);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      Alert.alert("Error", "Failed to fetch product data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.navigate("(tabs)", { screen: "Scan" })}>
      <Text style={styles.backButtonText}>Go Back</Text>
    </TouchableOpacity>
  
    <View style={styles.header}>
      <Image source={require("../assets/images/SeeFood-O.png")} style={styles.logo} />
      <Text style={styles.title}>Search Product By SKU</Text>
    </View>
  
    <View style={styles.centeredSection}>
      <TextInput
        style={styles.input}
        placeholder="Enter SKU"
        value={sku}
        onChangeText={setSku}
        />
    </View>

    <TouchableOpacity
      style={styles.button}
      onPress={handleSearch}
      disabled={loading}
    >
    <Text style={styles.buttonText}>
      {loading ? "Searching..." : "Search"}
    </Text>
    </TouchableOpacity>

  </View>
  
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FAF3E3",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "black",
    alignSelf: "center",
    marginTop:50,
  },
  input: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 3,
    borderColor: "grey",
    backgroundColor: "white",
    marginBottom: 20,
    borderRadius: 10,
    color: "black",
  },
  backButton: {
    backgroundColor: "#F86400",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 40,
    marginBottom: 60,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  centeredSection: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  logo: {
    width: 250,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  button:{
    backgroundColor: "#F86400",
    paddingVertical: 11,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

});

export default SearchBySKU;