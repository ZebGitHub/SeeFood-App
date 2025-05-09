import React, { useEffect, useState } from "react";
import {View,Text,FlatList,StyleSheet,ActivityIndicator,TouchableOpacity,TextInput} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "react-native";
import { RootStackParamList } from "../../types/navigation";
import { auth, db } from "../../services/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import productImages from "../../constants/ProductImages";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Product">;

const LIMIT = 10; // sets limit to 10

const Product = () => {
  const navigation = useNavigation<NavigationProp>();

  const [data, setData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]); // Full 100 items
  const [filteredData, setFilteredData] = useState<any[]>([]); // Search results
  const [pageData, setPageData] = useState<any[]>([]); // What's shown on screen
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userSensitivities, setUserSensitivities] = useState<string[]>([]);

  const fetchUserPreferences = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setUserAllergies(
          data.allergies?.map((a: string) => a.toLowerCase()) || []
        );
        setUserSensitivities(
          data.sensitive?.map((s: string) => s.toLowerCase()) || []
        );
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    }
  };

  // connects db and app, fetches in all 100 items and then slices it into pages
  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `https://p4lbsrtoee.execute-api.us-east-1.amazonaws.com/main/query?limit=100`;
      const response = await fetch(url);
      const json = await response.json();
      setAllData(json);
      setFilteredData(json);
      setTotalPages(Math.ceil(json.length / LIMIT));
      updatePageData(json, 1); // Show page 1 initially
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePageData = (sourceData: any[], pageNumber: number) => {
    const start = (pageNumber - 1) * LIMIT;
    const end = start + LIMIT;
    setPageData(sourceData.slice(start, end));
    setPage(pageNumber);
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserPreferences();
    }, [])
  );

  // fetches product from the db
  useEffect(() => {
    fetchData();
  }, []);

  //Search bar, filters through each item on db
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();

    const filtered = allData.filter((item) =>
      item.description?.toLowerCase().includes(lowerQuery)
    );

    setFilteredData(filtered);
    setTotalPages(Math.ceil(filtered.length / LIMIT));
    updatePageData(filtered, 1); // Resets to first page after search
  };

  //Safety Tags, (loose search parameters since Ingredients are one big string)
  const getSafetyTag = (ingredients: string) => {
    const normalizedIngredients =
      typeof ingredients === "string"
        ? ingredients
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s|,|;/)
            .map((i) => i.trim())
            .filter((i) => i.length > 0)
        : [];

    const looseMatch = (ingredientList: string[], keywords: string[]) =>
      ingredientList.some((ingredient) =>
        keywords.some(
          (keyword) =>
            ingredient.includes(keyword) ||
            ingredient.includes(keyword + "s") ||
            ingredient.replace(/s$/, "") === keyword
        )
      );

    const hasAllergy = looseMatch(normalizedIngredients, userAllergies);
    const hasSensitivity = looseMatch(normalizedIngredients, userSensitivities);

    if (hasAllergy) return { text: "Unsafe allergy", color: "#FF4C4C" };
    if (hasSensitivity)
      return { text: "Sensitive ingredient detected", color: "#F5B227" };
    return { text: "Safe", color: "#4CAF50" };
  };

  const renderItem = ({ item }: { item: any }) => {
    const ingredients = item.ingredients || [];
    const tag = getSafetyTag(ingredients);

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate("ProductDetail", { productId: item.barcode })
        }>
          
        <Text style={styles.itemTitle}>
          {item.description || "No Description"}
        </Text>

        <Image
          source={
            productImages[item.barcode] ||
            require("../../assets/product-images/ProductNotFound.jpg") // Fallback image
          }
          style={{ width: 100, height: 100, resizeMode: "contain", alignSelf:"center", marginTop: 10, }}
        />

        <View style={[styles.safetyTag, { backgroundColor: tag.color }]}>
          <Text style={styles.safetyTagText}>{tag.text}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Different Pages setup
  const renderPagination = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <View style={styles.paginationContainer}>
        {pages.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.pageButton, page === p && styles.pageButtonActive]}
            onPress={() => updatePageData(filteredData, p)} // uses filtered data now
          >
            <Text style={page === p ? styles.pageTextActive : styles.pageText}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#ccc" />
      ) : (
        <>
          <FlatList
            data={pageData}
            keyExtractor={(item) => item.barcode.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          {renderPagination()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#FAF3E3",
  },
  searchBar: {
    height: 50,
    backgroundColor: "#fff",
    borderColor: "grey",
    borderWidth: 3,
    borderRadius: 30,
    marginTop: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    elevation: 10,
  },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 10,
    elevation: 2,
    borderWidth: 3,
    borderColor: "grey",
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 18,
    alignSelf:"center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    flexWrap: "wrap",
    gap: 8,
  },
  pageButton: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    backgroundColor: "#ddd",
    borderRadius: 5,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  pageButtonActive: {
    backgroundColor: "#F86400",
  },
  pageText: {
    fontSize: 14,
    color: "#333",
  },
  pageTextActive: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  image: {
    fontSize: 16,
  },
  safetyTag: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 10,
    marginBottom:5,
  },
  safetyTagText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});

export default Product;