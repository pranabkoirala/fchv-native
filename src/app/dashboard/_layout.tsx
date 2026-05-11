import { View } from "react-native";
import { Drawer } from "expo-router/drawer";
import "../../global.css";
import CustomDrawer from "@/components/navigation/CustomDrawer";
import BottomNavigation from "@/components/navigation/BottomNavigation";

export default function DashboardLayout() {
  return (
    <View className="flex-1">
      <Drawer
        drawerContent={(props: any) => <CustomDrawer {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            width: "75%",
          },
          drawerPosition: "left",
          swipeEdgeWidth: 0,
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerItemStyle: { display: "none" },
            title: "Dashboard",
          }}
        />
        <Drawer.Screen
          name="child"
          options={{
            title: "Children (0-5)",
            drawerItemStyle: { display: "none" },
          }}
        />
        <Drawer.Screen
          name="change-language"
          options={{
            title: "Change Language",
            drawerItemStyle: { display: "none" },
          }}
        />
        <Drawer.Screen
          name="guidelines"
          options={{
            title: "Learn & Resources",
            drawerItemStyle: { display: "none" },
          }}
        />

        <Drawer.Screen
          name="settings"
          options={{
            title: "My Profile",
            drawerItemStyle: { display: "none" },
          }}
        />
        <Drawer.Screen
          name="mother-list"
          options={{
            title: "Mother List",
            drawerItemStyle: { display: "none" },
          }}
        />

        <Drawer.Screen
          name="mother-profile"
          options={{
            title: "Mother Profile",
            drawerItemStyle: { display: "none" },
          }}
        />
        <Drawer.Screen
          name="report"
          options={{
            title: "Reports",
            drawerItemStyle: { display: "none" },
          }}
        />
      </Drawer>
      <BottomNavigation />
    </View>
  );
}
