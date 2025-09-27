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

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) setInitialRoute("HomePage");
    };
    checkToken();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
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
