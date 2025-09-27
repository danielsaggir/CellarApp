import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "./src/screens/Login";
import RegisterScreen from "./src/screens/Register";
import HomePage from "./src/screens/HomePage";
import MyCellarScreen from "./src/screens/MyCellar";
import PairingScreen from "./src/screens/Pairing";
import WineForm from "./src/screens/WineForm";
import config from "./src/screens/config";  // 👈 ייבוא ה־API_URL

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  HomePage: undefined;
  MyCellar: undefined;
  Pairing: undefined;
  WineForm: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>("Login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          // ✅ שימוש ב־config.API_URL במקום localhost
          const res = await fetch(`${config.API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            setInitialRoute("HomePage"); // אם הטוקן תקף → נכנס ישר
          } else {
            setInitialRoute("Login"); // אם לא תקף → חוזר ל־Login
          }
        } else {
          setInitialRoute("Login");
        }
      } catch (err) {
        console.error("Auth check failed", err);
        setInitialRoute("Login");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return null; // אפשר לשים כאן Splash או Loader
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="MyCellar" component={MyCellarScreen} />
        <Stack.Screen name="Pairing" component={PairingScreen} />
        <Stack.Screen name="WineForm" component={WineForm} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
