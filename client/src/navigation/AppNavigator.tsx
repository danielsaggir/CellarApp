import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../types";
import { colors } from "../theme";

import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import HomePage from "../screens/HomePage";
import MyCellarScreen from "../screens/MyCellar";
import PairingScreen from "../screens/Pairing";
import WineForm from "../screens/WineForm";

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>("Login");

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) setInitialRoute("HomePage");
    };
    checkToken();
  }, []);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background, shadowColor: "transparent", elevation: 0 },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: "bold", color: colors.primary },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HomePage" component={HomePage} options={{ headerShown: false }} />
      <Stack.Screen name="MyCellar" component={MyCellarScreen} options={{ title: "My Cellar" }} />
      <Stack.Screen name="Pairing" component={PairingScreen} options={{ title: "Wine Pairing" }} />
      <Stack.Screen name="WineForm" component={WineForm} options={{ title: "Wine Details" }} />
    </Stack.Navigator>
  );
}
