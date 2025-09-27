import { Platform } from "react-native";

let API_URL = "";

// ⚡ ל־iOS Simulator → 127.0.0.1
if (Platform.OS === "ios") {
  API_URL = "http://127.0.0.1:4000";
}

// ⚡ ל־Android Emulator → 10.0.2.2
else if (Platform.OS === "android") {
  API_URL = "http://10.0.2.2:4000";
}

// ⚡ fallback למכשיר אמיתי (צריך לשים IP של המחשב שלך)
else {
  API_URL = "192.168.1.193"; // 👈 עדכן ל־IP של המחשב שלך
}

export default {
  API_URL,
};
