import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

// ✅ נקודת הכניסה של React Native
AppRegistry.registerComponent(appName, () => App);
