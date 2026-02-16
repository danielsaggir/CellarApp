import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../types";

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
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="HomePage" component={HomePage} />
      <Stack.Screen name="MyCellar" component={MyCellarScreen} />
      <Stack.Screen name="Pairing" component={PairingScreen} />
      <Stack.Screen name="WineForm" component={WineForm} />
    </Stack.Navigator>
  );
}
