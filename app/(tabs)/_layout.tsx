import { Tabs } from "expo-router";
import React from "react";
import { Platform, Image } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "../../context/authcontext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();

  const getTabIcon = (iconFile: any) => ({ color }: { color: string }) => (
    <Image
      source={iconFile}
      style={{ width: 25, height: 24, tintColor: color }}
      resizeMode="contain"
    />
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#F86400",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: !isAuthenticated
          ? { display: "none" }
          : Platform.select({
              ios: { position: "absolute" },
              default: {},
            }),
      }}
    >
      <Tabs.Screen
        name="User"
        options={{
          title: "User",
          tabBarIcon: getTabIcon(require("@/assets/images/User.png")),
        }}
      />
      <Tabs.Screen
        name="Scan"
        options={{
          title: "Scan",
          tabBarIcon: getTabIcon(require("@/assets/images/Scan.png")),
        }}
      />
      <Tabs.Screen
        name="Product"
        options={{
          title: "Product",
          tabBarIcon: getTabIcon(require("@/assets/images/Product.png")),
        }}
      />
    </Tabs>
  );
}
