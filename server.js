import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE = "https://savpac-server.onrender.com";

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Autorisation caméra requise</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.text}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePictureAndSend = async () => {
    if (!cameraRef.current) return;

    try {
      setLoading(true);

      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
      });

      const formData = new FormData();
      formData.append("image", {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("text", text);

      const response = await fetch(`${API_BASE}/analyze-photo`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erreur serveur");
      }

      Alert.alert("Diagnostic IA", data.diagnostic);

      // ✅ Navigation PROPRE (sans erreur rouge)
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert(
        "Erreur",
        e?.message || "Impossible d'envoyer la photo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Décris le problème (optionnel)"
          value={text}
          onChangeText={setText}
        />

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              setFacing((f) => (f === "back" ? "front" : "back"))
            }
          >
            <Text style={styles.text}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.capture}
            onPress={takePictureAndSend}
            disabled={loading}
          >
            <Text style={styles.text}>
              {loading ? "..." : "📸"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.text}>⬅</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    padding: 14,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  capture: {
    padding: 20,
    backgroundColor: "#1e90ff",
    borderRadius: 50,
  },
  text: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
});