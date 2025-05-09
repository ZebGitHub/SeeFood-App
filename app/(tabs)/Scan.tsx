import {CameraView, CameraType, useCameraPermissions, BarcodeScanningResult,} from "expo-camera";
import { useState, useRef } from "react";
import {Button, StyleSheet,Text, TouchableOpacity, View, ActivityIndicator,} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";

export default function Scan() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const hasScanned = useRef(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    //camera permissions are still loading
    return (
      <View>
        <Text>Camera permissions are loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  // * Function to handle barcode scanning
  async function onBarcodeScanned({ data }: BarcodeScanningResult) {
    if (hasScanned.current) return;

    hasScanned.current = true;
    setLoading(true);

    try {
      // Normalize scanned barcode
      const scannedBarcode = data.trim().toString();

      // Connecting to DB using API
      const url = `https://p4lbsrtoee.execute-api.us-east-1.amazonaws.com/main/query?limit=100`;
      const response = await fetch(url);
      const products = await response.json();

      // Check if the response is an array
      if (!Array.isArray(products)) {
        console.error("Unexpected data structure:", products);
        alert("Failed to load products.");
        return;
      }

      // Finds product and matches using barcode
      const product = products.find((item: any) => {
        const itemBarcode = item.barcode?.toString().trim();
        return (
          itemBarcode?.includes(scannedBarcode) ||
          scannedBarcode.includes(itemBarcode)
        );
      });

      // Navigate to ProductDetail and pass the product, with small delay
      if (product) {
        setTimeout(() => {
          navigation.navigate("ProductDetail", {
            productId: scannedBarcode,
            product,
          });
        }, 100);
      } else {
        alert(`Product with barcode ${scannedBarcode} not found.`);
      }
    } catch (error) {
      // * Handle fetch or parsing errors
      console.error("Error fetching product:", error);
      alert("Failed to fetch product data.");
    } finally {
      setLoading(false);
      // * Enable scan again after short delay
      setTimeout(() => {
        hasScanned.current = false;
      }, 3000);
    }
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Fetching product...</Text>
        </View>
      )}
      <CameraView
        style={styles.camera}
        facing={facing}
        //* Set barcode type: EAN-13 and UPC-A
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "upc_a", "qr"] }}
        onBarcodeScanned={onBarcodeScanned}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => navigation.navigate("SearchBySKU")}>
        <Text style={styles.searchButtonText}>Search by SKU</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 18,
  },
  searchButton: {
    backgroundColor: "#F86400",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});