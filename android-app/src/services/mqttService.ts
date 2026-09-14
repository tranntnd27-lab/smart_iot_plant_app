import mqtt, { MqttClient } from 'mqtt';
import { SensorData, MQTTConnectionStatus, PumpControlPayload } from '../types/plant';

const MQTT_BROKER_URL = 'ws://broker.hivemq.com:8000/mqtt';
const TOPIC_DATA = 'smartfarm_dung/data';
const TOPIC_CONTROL = 'smartfarm_dung/control';

export class MQTTService {
  private client: MqttClient | null = null;
  private onDataCallback: ((data: SensorData) => void) | null = null;
  private onStatusCallback: ((status: MQTTConnectionStatus) => void) | null = null;

  public connect(
    onDataReceived: (data: SensorData) => void,
    onStatusChange: (status: MQTTConnectionStatus) => void
  ): void {
    this.onDataCallback = onDataReceived;
    this.onStatusCallback = onStatusChange;

    this.onStatusCallback('CONNECTING');

    const clientId = `react-native-android-${Math.random().toString(16).substring(2, 8)}`;

    try {
      this.client = mqtt.connect(MQTT_BROKER_URL, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
      });

      this.client.on('connect', () => {
        console.log('[MQTT] Connected to HiveMQ Broker');
        if (this.onStatusCallback) this.onStatusCallback('CONNECTED');

        this.client?.subscribe(TOPIC_DATA, (err) => {
          if (!err) {
            console.log(`[MQTT] Subscribed to topic: ${TOPIC_DATA}`);
          } else {
            console.error('[MQTT] Subscription error:', err);
          }
        });
      });

      this.client.on('message', (topic: string, message: Buffer) => {
        if (topic === TOPIC_DATA) {
          try {
            const parsedData: SensorData = JSON.parse(message.toString());
            if (this.onDataCallback) {
              this.onDataCallback(parsedData);
            }
          } catch (error) {
            console.error('[MQTT] JSON parse error:', error);
          }
        }
      });

      this.client.on('offline', () => {
        if (this.onStatusCallback) this.onStatusCallback('DISCONNECTED');
      });

      this.client.on('error', (error) => {
        console.error('[MQTT] Connection error:', error);
        if (this.onStatusCallback) this.onStatusCallback('ERROR');
      });
    } catch (err) {
      console.error('[MQTT] Initialize error:', err);
      if (this.onStatusCallback) this.onStatusCallback('ERROR');
    }
  }

  public publishPumpControl(state: 0 | 1): boolean {
    if (!this.client || !this.client.connected) {
      console.warn('[MQTT] Cannot publish - client disconnected');
      return false;
    }

    const payload: PumpControlPayload = { pump: state };
    const messageStr = JSON.stringify(payload);

    this.client.publish(TOPIC_CONTROL, messageStr, (err) => {
      if (!err) {
        console.log(`[MQTT Publish] Published to ${TOPIC_CONTROL}: ${messageStr}`);
      } else {
        console.error('[MQTT Publish Error]:', err);
      }
    });

    return true;
  }

  public publishLedControl(state: 0 | 1): boolean {
    if (!this.client || !this.client.connected) {
      console.warn('[MQTT] Cannot publish - client disconnected');
      return false;
    }

    const payload = { led: state };
    const messageStr = JSON.stringify(payload);

    this.client.publish(TOPIC_CONTROL, messageStr, (err) => {
      if (!err) {
        console.log(`[MQTT Publish] Published to ${TOPIC_CONTROL}: ${messageStr}`);
      } else {
        console.error('[MQTT Publish Error]:', err);
      }
    });

    return true;
  }

  public disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

export const mqttService = new MQTTService();
