#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define WIFI_SSID     "Scwud"
#define WIFI_PASSWORD "14015353"
#define MQTT_SERVER   "192.168.144.94"   
#define MQTT_PORT     1884
#define MQTT_USER     "scwud"
#define MQTT_PASSWORD "Abc@1234"
// Topic
#define TOPIC_SENSOR  "dataSensor"
#define TOPIC_CONTROL "controlLED"   

#define DHTPIN 25
#define DHTTYPE DHT11
#define FAN_PIN 18
#define AIR_CONDITIONER_PIN 19
#define LED_PIN 21
#define LIGHT_SENSOR_PIN 36

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastRead = 0;
unsigned long lastAliveSignal = 0;
bool firstConnection = true;

// =====================
// Kết nối WiFi
// =====================
void setup_wifi() {
  Serial.print("Đang kết nối WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi đã kết nối, IP:");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Không thể kết nối WiFi!");
  }
}

// =====================
// Callback xử lý khi có message MQTT
// =====================

void callback(char* topic, byte* message, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) msg += (char)message[i];
  Serial.print("📩 Nhận lệnh trên topic [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(msg);

  // Kiểm tra tên thiết bị
  if (msg.startsWith("FAN_")) {
    digitalWrite(FAN_PIN, msg.endsWith("ON") ? HIGH : LOW);
    Serial.println(msg.endsWith("ON") ? "🌀 FAN BẬT" : "🌀 FAN TẮT");
  }
  else if (msg.startsWith("AIR_CONDITIONER_")) {
    digitalWrite(AIR_CONDITIONER_PIN, msg.endsWith("ON") ? HIGH : LOW);
    Serial.println(msg.endsWith("ON") ? "❄️ AC BẬT" : "❄️ AC TẮT");
  }
  else if (msg.startsWith("LED_")) {
    digitalWrite(LED_PIN, msg.endsWith("ON") ? HIGH : LOW);
    Serial.println(msg.endsWith("ON") ? "💡 LED BẬT" : "💡 LED TẮT");
  }
}

// =====================
// Kết nối lại MQTT
// =====================
void reconnect() {
  while (!client.connected()) {
    Serial.print("🔄 Kết nối MQTT...");
    if (client.connect("ESP32Client", MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("✅ Thành công");
      client.subscribe(TOPIC_CONTROL);
      
      // 📢 GỬI TÍN HIỆU ONLINE LẦN ĐẦU KẾT NỐI
      Serial.println("📢 Gửi tín hiệu ONLINE đến server...");
      client.publish(TOPIC_SENSOR, "{\"status\":\"ONLINE\"}");
      delay(500);
      
      // Yêu cầu trạng thái hiện tại
      client.publish(TOPIC_CONTROL, "GET_STATE");
      Serial.println("🔄 Yêu cầu trạng thái thiết bị từ server");
      
      firstConnection = true;
      lastAliveSignal = millis();
    } else {
      Serial.print("❌ Lỗi, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  dht.begin();

  pinMode(FAN_PIN, OUTPUT);
  pinMode(AIR_CONDITIONER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Tắt tất cả thiết bị khi khởi động
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(AIR_CONDITIONER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  setup_wifi();
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
  analogSetAttenuation(ADC_11db);
  
  Serial.println("\n🚀 ESP32 IoT Ready!\n");
}

// =====================
// Loop
// =====================
void loop() {
  // Kiểm tra WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi mất kết nối, đang kết nối lại...");
    setup_wifi();
    return;
  }
  // Kiểm tra MQTT
  if (!client.connected()) {
    reconnect();
    return;
  }
  client.loop();
  unsigned long now = millis();
  // 📊 Gửi dữ liệu cảm biến mỗi 2 giây
  if (now - lastRead >= 2000) {
    lastRead = now;

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int lightValue = analogRead(LIGHT_SENSOR_PIN);

    if (isnan(h) || isnan(t)) {
      Serial.println("⚠️ Lỗi đọc DHT11!");
      return;
    }
    char payload[200];
    snprintf(payload, sizeof(payload),
             "{\"temp\":%.1f,\"humidity\":%.1f,\"light\":%d,\"status\":\"ALIVE\"}", 
             t, h, lightValue);
    client.publish(TOPIC_SENSOR, payload);
    Serial.print("📤 [Sensor] ");
    Serial.println(payload);
    
    lastAliveSignal = now;
  }
  // 💓 Gửi heartbeat mỗi 5 giây (để server biết ESP32 vẫn online)
  if (now - lastAliveSignal >= 5000 && !firstConnection) {
    client.publish(TOPIC_SENSOR, "{\"status\":\"ALIVE\"}");
    Serial.println("💓 [Heartbeat] ESP32 vẫn online");
    lastAliveSignal = now;
  }
}
