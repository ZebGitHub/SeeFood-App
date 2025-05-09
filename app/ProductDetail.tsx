import React, { useEffect, useState } from "react";
import {View,Text,TextInput,Button,StyleSheet,ActivityIndicator,Image,TouchableOpacity,ScrollView,} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { getAuth } from "firebase/auth";
import {collection,addDoc,getDocs,query,where,Timestamp,updateDoc,doc,getDoc,} from "firebase/firestore";
import { db } from "../services/FirebaseConfig";
import productImages from "../constants/ProductImages";

const eyeFilled = require("../assets/images/eye-filled.png");
const eyeOutline = require("../assets/images/eye-shadow.png");

type ProductDetailRouteProp = RouteProp<RootStackParamList, "ProductDetail">;

const ProductDetail = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const { productId, product: passedProduct } = route.params as {
    productId: string;
    product?: any;
  };
  const navigation = useNavigation();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userSensitivities, setUserSensitivities] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);

  const auth = getAuth();
  const user = auth.currentUser;

  //Get product Details
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

  //Safety Tags
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

  useEffect(() => {
    // Fetches Product info, from both navigation params/API either or
    const fetchProduct = async () => {
      if (passedProduct) {
        setProduct(passedProduct);
        setLoading(false);
        return;
      }

      try {
        const url = `https://p4lbsrtoee.execute-api.us-east-1.amazonaws.com/main/query?limit=100`;
        const response = await fetch(url);
        const data = await response.json();
        const foundProduct = data.find(
          (item: any) => item.barcode === productId
        );
        setProduct(foundProduct);
      } catch (error) {
        console.error("Error fetching product detail:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetches comments based off product
    const fetchComments = async () => {
      try {
        const resolvedProductId = passedProduct?.barcode || productId;
        const q = query(
          collection(db, "comments"),
          where("productId", "==", resolvedProductId)
        );
        const querySnapshot = await getDocs(q);
        const commentList: any[] = [];
        querySnapshot.forEach((doc) => {
          commentList.push({ id: doc.id, ...doc.data() });
        });
        commentList.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
        setComments(commentList);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    //Fetches ratings and calculates the average
    const fetchRatings = async () => {
      try {
        const resolvedProductId = passedProduct?.barcode || productId;
        const q = query(
          collection(db, "ratings"),
          where("productId", "==", resolvedProductId)
        );
        const snapshot = await getDocs(q);
        let total = 0;
        let count = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          total += data.rating;
          count++;
          //sets user rating if it exists
          if (user && data.userId === user.uid) {
            setUserRating(data.rating);
          }
        });
        setAverageRating(count > 0 ? total / count : 0);
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
    };

    fetchProduct();
    fetchComments();
    fetchRatings();
    fetchUserPreferences();
  }, [productId, user]);

  if (loading || !product) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ccc" />
      </View>
    );
  }

  const tag = getSafetyTag(product.ingredients || "");

  //Recommend Alternatives to users
  const fetchRecommendedProducts = async (
    tagText: string,
    baseProduct: any
  ) => {
    if (!baseProduct) return;

    try {
      const response = await fetch(
        "https://p4lbsrtoee.execute-api.us-east-1.amazonaws.com/main/query?limit=100"
      );
      const data = await response.json();

      //Filters product words to find similar names
      const productNameKeywords = (baseProduct.description || "")
        .toLowerCase()
        .split(/\s+/);

      const filtered = data.filter((item: any) => {
        if (item.barcode === baseProduct.barcode) return false;

        const itemName = (item.description || "").toLowerCase();
        const hasMatch = productNameKeywords.some((word: string) =>
          itemName.includes(word)
        );

        const tagCheck = getSafetyTag(item.ingredients || "");

        //Recommends products only if safe
        return hasMatch && tagCheck.text === "Safe";
      });

      setRecommended(filtered.slice(0, 5));
    } catch (err) {
      console.error("Error fetching recommended products:", err);
    }
  };

  if (product) {
    const tag = getSafetyTag(product.ingredients || "");
    fetchRecommendedProducts(tag.text, product);
  }

  //Allows user to create a new comment (must be logged in)
  const handleCommentSubmit = async () => {
    if (!user) {
      alert("You must be logged in to leave a comment and rating.");
      return;
    }

    if (!comment.trim()) return;

    try {
      const newComment = {
        userId: user.uid,
        userEmail: user.email,
        productId: product?.barcode || productId,
        comment,
        timestamp: Timestamp.now(),
      };
      await addDoc(collection(db, "comments"), newComment);
      setComment("");
      const q = query(
        collection(db, "comments"),
        where("productId", "==", product?.barcode || productId)
      );
      const querySnapshot = await getDocs(q);
      const commentList: any[] = [];
      querySnapshot.forEach((doc) => {
        commentList.push({ id: doc.id, ...doc.data() });
      });
      commentList.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
      setComments(commentList);
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  //Submit/Update user rating
  const handleRatingSubmit = async (ratingValue: number) => {
    if (!user) {
      alert("You must be logged in to rate.");
      return;
    }

    try {
      // Check if user rated already
      const resolvedProductId = product?.barcode || productId;
      const q = query(
        collection(db, "ratings"),
        where("productId", "==", resolvedProductId),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Updates existing rating
        const ratingDoc = snapshot.docs[0];
        await updateDoc(ratingDoc.ref, {
          rating: ratingValue,
          timestamp: Timestamp.now(),
        });
      } else {
        // Creates new rating
        const newRating = {
          userId: user.uid,
          userEmail: user.email,
          productId: resolvedProductId,
          rating: ratingValue,
          timestamp: Timestamp.now(),
        };
        await addDoc(collection(db, "ratings"), newRating);
      }

      setUserRating(ratingValue);

      // Refreshes products average rating
      const ratingsSnapshot = await getDocs(
        query(
          collection(db, "ratings"),
          where("productId", "==", resolvedProductId)
        )
      );
      let total = 0;
      let count = 0;
      ratingsSnapshot.forEach((doc) => {
        total += doc.data().rating;
        count++;
      });
      setAverageRating(count > 0 ? total / count : 0);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  //Renders user comment
  const renderCommentItem = ({ item }: { item: any }) => (
    <View key={item.id} style={styles.commentItem}>
      <Text style={styles.commentUser}>Anonymous User</Text>
      <Text>{item.comment}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {product.description || "No Description"}
      </Text>

      {/* Display Product Image */}
      <Image
        source={
          productImages[product.barcode] ||
          require("../assets/product-images/ProductNotFound.jpg") // Fallback image
        }
        style={{
          width: 200,
          height: 200,
          alignSelf: "center",
          marginBottom: 20,
          resizeMode: "contain",
          borderWidth: 1,
          borderColor: "grey",

        }}
      />

      <Text style={styles.details}>{product.ingredients || "N/A"}</Text>

      <View style={[styles.safetyTag, { backgroundColor: tag.color }]}>
        <Text style={styles.safetyTagText}>{tag.text}</Text>
      </View>

      {recommended.length > 0 && (
        <>
          <Text style={styles.recommendationHeader}>
            Recommended Alternatives:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.recommendationScroll}>
            {recommended.map((item) => {
              const safety = getSafetyTag(item.ingredients || "");
              return (
                <TouchableOpacity
                  key={item.barcode}
                  style={styles.recommendationItem}
                  onPress={() =>
                    navigation.navigate("ProductDetail", {
                      productId: item.barcode,
                      product: item,
                    })
                  }>
                  <Text numberOfLines={2} style={styles.recommendationTitle}>
                    {item.description || "No Description"}
                  </Text>
                  <Text
                    style={[
                      styles.recommendationTag,
                      { color: safety.color, fontWeight: "bold" },
                    ]}>
                    {safety.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      <Text style={styles.commentHeader}>Average Rating:</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 10,
        }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Image
            key={i}
            source={i <= Math.round(averageRating) ? eyeFilled : eyeOutline}
            style={{ width: 24, height: 24, marginRight: 3 }}
          />
        ))}
        <Text style={{ marginLeft: 8 }}>({averageRating.toFixed(1)})</Text>
      </View>

      {user && (
        <>
          <Text style={styles.commentHeader}>Your Rating:</Text>
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => handleRatingSubmit(i)}>
                <Image
                  source={
                    userRating > 0 && i <= userRating ? eyeFilled : eyeOutline
                  }
                  style={{ width: 30, height: 30, marginRight: 5 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.commentHeader}>Comments:</Text>
      {comments.length > 0 ? (
        comments.map((item) => renderCommentItem({ item }))
      ) : (
        <Text>No comments for this product yet.</Text>
      )}

      {user ? (
        <View style={styles.commentBox}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Leave a comment..."
            style={styles.commentInput}
            multiline
          />
          <Button
            title="Post Comment"
            onPress={handleCommentSubmit}
            color="#F86400"
          />
        </View>
      ) : (
        <Text style={styles.loginNotice}>
          Please log in to leave a comment and rating.
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F0",
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginTop: 20,
    fontWeight: "bold",
    fontFamily: "sans-serif-condensed",
    marginBottom: 10,
    color: "black",
  },
  details: {
    fontSize: 16,
    marginTop: 5,
    color: "#555",
    fontWeight: "bold",
  },
  backText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#F86400",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 40,
  },
  commentHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  commentBox: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    elevation: 3,
  },
  commentInput: {
    borderWidth: 3,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  loginNotice: {
    fontStyle: "italic",
    marginTop: 20,
    color: "#777",
  },
  commentItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: "grey",
    borderWidth: 2,
  },
  commentUser: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  safetyTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 10,
  },
  safetyTagText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  scrollContainer: {
    padding: 20,
    backgroundColor: "#FFF9F0",
  },
  recommendationHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  recommendationScroll: {
    flexDirection: "row",
  },
  recommendationItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    width: 200,
    borderColor: "#ccc",
    borderWidth: 1,
    justifyContent: "space-between",
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  recommendationTag: {
    fontSize: 12,
    color: "#666",
  },
});
export default ProductDetail;