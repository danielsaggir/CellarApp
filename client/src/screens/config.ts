import { Platform } from "react-native";

let API_URL = "";

// ⚡ ל־iOS Simulator → IP של המחשב
if (Platform.OS === "ios") {
  API_URL = "http://192.168.1.193:4000";  // 👈 עדכן ל־IP האמיתי שלך
}

// ⚡ ל־Android Emulator → 10.0.2.2
else if (Platform.OS === "android") {
  API_URL = "http://10.0.2.2:4000";
}

// ⚡ fallback למכשיר אמיתי (גם פה נשים את ה־IP של המחשב שלך)
else {
  API_URL = "http://192.168.1.193:4000";
}

export default {
  API_URL,
};
