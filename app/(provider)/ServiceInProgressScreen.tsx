import Feather from '@expo/vector-icons/Feather';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import { providerWebSocket } from '../../services/websocket.service';

// ─── Timer Hook ───────────────────────────────────────────────────────────────

const useTimer = (initialSeconds: number = 0) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [paused, setPaused] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setStartTime(now);
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [paused]);

  const format = (s: number): string => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const getStartTimeString = (): string => {
    if (!startTime) return 'Just now';
    return startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return { 
    display: format(seconds), 
    paused, 
    setPaused,
    startTimeString: getStartTimeString(),
    elapsedSeconds: seconds
  };
};

// ─── Checklist Items ──────────────────────────────────────────────────────────

const CHECKLIST: string[] = [
  'Inspect vehicle condition',
  'Secure vehicle on flatbed',
  'Document pre-service photos',
  'Check for personal items',
  'Verify drop-off location',
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ServiceInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { display, paused, setPaused, startTimeString, elapsedSeconds } = useTimer(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [serviceNotes, setServiceNotes] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  // Get data from params (passed from NavigateToCustomerScreen)
  const jobId = params.jobId as string;
  const bookingId = params.bookingId as string;
  const customerName = params.customerName as string || 'Mohammed A.';
  const customerPhone = params.customerPhone as string || '+973 3XXX XXXX';
  const serviceType = params.serviceType as string || 'Towing Service';
  const vehicleType = params.vehicleType as string || 'Sedan';
  const licensePlate = params.licensePlate as string || 'ABC 1234';
  const vehicleModel = params.vehicleModel as string || 'Toyota Camry 2020';
  const price = params.price as string || '81';
  const requestId = params.requestId as string || 'REQ-7891';
  const pickupLocation = params.pickupLocation as string || 'Main Street, Manama';

  // ─── WebSocket Setup ────────────────────────────────────────────────────────

  useEffect(() => {
    console.log('🔌 Setting up WebSocket for ServiceInProgress');
    console.log('Job ID:', jobId);
    console.log('Booking ID:', bookingId);

    // Check initial connection
    setWsConnected(providerWebSocket.isConnected());

    // Listen for connection changes
    providerWebSocket.onConnectionChange((connected) => {
      console.log('WebSocket connection changed:', connected);
      setWsConnected(connected);
      
      // Re-join room if connection restored
      if (connected && jobId && !hasJoinedRoom) {
        joinJobRoom();
      }
    });

    // Join job room and notify service started
    if (jobId) {
      joinJobRoom();
    }

    // Cleanup on unmount
    return () => {
      // No need to leave room as service is completing
    };
  }, []);

  const joinJobRoom = () => {
    if (!jobId || hasJoinedRoom) return;

    console.log('🚪 Joining job room:', jobId);
    providerWebSocket.send('join_job_room', {
      jobId,
      role: 'provider'
    });
    
    // Notify that service has started
    console.log('▶️ Notifying service started');
    providerWebSocket.send('start_service', {
      jobId,
      bookingId,
      timestamp: new Date().toISOString()
    });
    
    setHasJoinedRoom(true);
  };

  const notifyServiceCompleted = () => {
    if (providerWebSocket.isConnected()) {
      console.log('✅ Notifying service completed');
      providerWebSocket.send('complete_service', {
        jobId,
        bookingId,
        completedAt: new Date().toISOString(),
        duration: elapsedSeconds,
        notes: serviceNotes,
        completedItems: completedItems.length
      });
    }
  };

  const notifyTimeAdded = (minutes: number) => {
    if (providerWebSocket.isConnected()) {
      providerWebSocket.send('service_time_updated', {
        jobId,
        bookingId,
        additionalMinutes: minutes,
        newTotal: elapsedSeconds + (minutes * 60),
        timestamp: new Date().toISOString()
      });
    }
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCall = () => {
    if (customerPhone) {
      Alert.alert('Call', `Calling ${customerName} at ${customerPhone}...`);
    } else {
      Alert.alert('Call', `Calling ${customerName}...`);
    }
  };
  
  const handleMessage = () => {
    router.push({
      pathname: '/(provider)/Chat',
      params: {
        customerName,
        jobId,
        bookingId,
      }
    });
  };
  
  const handleAddPhoto = () => {
    Alert.alert('Photo', 'Opening camera to take photos...');
  };
  
  const handleAddTime = () => {
    Alert.alert(
      'Add Extra Time',
      'Select additional time for this service:',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: '15 minutes',
          onPress: () => {
            notifyTimeAdded(15);
            Alert.alert('Success', '15 minutes added to service time');
          }
        },
        {
          text: '30 minutes',
          onPress: () => {
            notifyTimeAdded(30);
            Alert.alert('Success', '30 minutes added to service time');
          }
        },
        {
          text: '45 minutes',
          onPress: () => {
            notifyTimeAdded(45);
            Alert.alert('Success', '45 minutes added to service time');
          }
        }
      ]
    );
  };
  
  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Opening report form...');
  };

  const toggleChecklistItem = (index: number) => {
    if (completedItems.includes(index)) {
      setCompletedItems(completedItems.filter(item => item !== index));
    } else {
      setCompletedItems([...completedItems, index]);
    }
  };

  const handleComplete = () => {
    // First confirmation
    Alert.alert(
      'Complete Service',
      'Are you sure you want to complete this service?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Continue',
          onPress: () => {
            // Check if checklist is incomplete
            if (completedItems.length < CHECKLIST.length) {
              // Show warning about incomplete checklist
              Alert.alert(
                'Incomplete Checklist',
                `You have completed ${completedItems.length} out of ${CHECKLIST.length} items. Complete anyway?`,
                [
                  {
                    text: 'Go Back',
                    style: 'cancel'
                  },
                  {
                    text: 'Complete Service',
                    onPress: () => {
                      // ✅ Notify via WebSocket
                      notifyServiceCompleted();
                      
                      // Navigate to Service Complete screen with ALL data
                      router.push({
                        pathname: '/ServiceCompletedScreen',
                        params: {
                          // Timer data
                          serviceTime: display,
                          elapsedSeconds: elapsedSeconds.toString(),
                          startTime: startTimeString,
                          
                          // Job data
                          jobId: jobId,
                          bookingId: bookingId,
                          customerName: customerName,
                          
                          // Earnings
                          earnings: price,
                          
                          // Checklist data
                          completedItems: JSON.stringify(completedItems),
                          totalItems: CHECKLIST.length.toString(),
                          
                          // Service notes
                          serviceNotes: serviceNotes,
                          
                          // Request info
                          requestId: requestId,
                          serviceType: serviceType,
                          pickupLocation: pickupLocation
                        }
                      });
                    },
                    style: 'destructive'
                  }
                ]
              );
            } else {
              // Checklist complete - go straight to completion
              // ✅ Notify via WebSocket
              notifyServiceCompleted();
              
              router.push({
                pathname: '/ServiceCompletedScreen',
                params: {
                  serviceTime: display,
                  elapsedSeconds: elapsedSeconds.toString(),
                  startTime: startTimeString,
                  jobId: jobId,
                  bookingId: bookingId,
                  customerName: customerName,
                  earnings: price,
                  completedItems: JSON.stringify(completedItems),
                  totalItems: CHECKLIST.length.toString(),
                  serviceNotes: serviceNotes,
                  requestId: requestId,
                  serviceType: serviceType,
                  pickupLocation: pickupLocation
                }
              });
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => {
            Alert.alert(
              'Exit Service',
              'Are you sure you want to exit? Service in progress will be lost.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', onPress: () => router.back() }
              ]
            );
          }} 
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={25} color="#1e2939" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Service In Progress</Text>
          <Text style={styles.headerSub}>{requestId}</Text>
        </View>
        <View style={styles.headerRight}>
          {/* WebSocket Status Indicator */}
          {wsConnected && hasJoinedRoom && (
            <View style={styles.wsIndicator}>
              <View style={styles.wsDot} />
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SERVICE ACTIVE BADGE ── */}
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>Service Active</Text>
          {wsConnected && hasJoinedRoom && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* ── TIMER CARD ── */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>SERVICE DURATION</Text>
          <Text style={styles.timerDisplay}>{display}</Text>
          <Text style={styles.timerStarted}>Started at {startTimeString}</Text>
          <View style={styles.timerBtnRow}>
            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={() => setPaused(p => !p)}
              activeOpacity={0.8}
            >
              <Feather name={paused ? 'play' : 'pause'} size={15} color="#C8960C" />
              <Text style={styles.pauseBtnText}>{paused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addTimeBtn} onPress={handleAddTime} activeOpacity={0.8}>
              <Feather name="clock" size={15} color="#1A1A2E" />
              <Text style={styles.addTimeBtnText}>Add Time</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SERVICE DETAILS ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>SERVICE DETAILS</Text>
          <View style={styles.detailsDivider} />
          {[
            { label: 'Service Type:', value: serviceType },
            { label: 'Vehicle:', value: vehicleType },
            { label: 'License Plate:', value: licensePlate },
            { label: 'Model:', value: vehicleModel },
            { label: 'Pickup:', value: pickupLocation },
          ].map((item, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* ── CUSTOMER CONTACT ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>CUSTOMER CONTACT</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatarCircle}>
              <Feather name="user" size={24} color="#9dd7fb" />
            </View>
            <View style={styles.customerText}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerPhone}>{customerPhone}</Text>
            </View>
          </View>
          <View style={styles.contactBtnRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={handleCall} activeOpacity={0.7}>
              <Feather name="phone" size={15} color="#9dd7fb" />
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>
            <View style={styles.contactBtnSep} />
            <TouchableOpacity style={styles.contactBtn} onPress={handleMessage} activeOpacity={0.7}>
              <Feather name="message-square" size={15} color="#9dd7fb" />
              <Text style={styles.contactBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PHOTO DOCUMENTATION ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>PHOTO DOCUMENTATION</Text>
          <TouchableOpacity style={styles.photoAddBox} onPress={handleAddPhoto} activeOpacity={0.7}>
            <Feather name="camera" size={28} color="#AAAAAA" />
            <Text style={styles.photoAddText}>Add Photos</Text>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Photos will be saved with service record (0 photos added)</Text>
        </View>

        {/* ── SERVICE NOTES ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>SERVICE NOTES</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about the service..."
            value={serviceNotes}
            onChangeText={setServiceNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── SERVICE CHECKLIST ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>SERVICE CHECKLIST</Text>
          <Text style={styles.checklistProgress}>
            Completed: {completedItems.length}/{CHECKLIST.length}
          </Text>
          {CHECKLIST.map((item, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.checkRow} 
              onPress={() => toggleChecklistItem(i)}
              activeOpacity={0.7}
            >
              <View style={styles.checkIconWrap}>
                <Feather 
                  name={completedItems.includes(i) ? "check-circle" : "circle"} 
                  size={20} 
                  color={completedItems.includes(i) ? "#00C853" : "#87cefa"} 
                />
              </View>
              <Text style={[
                styles.checkText,
                completedItems.includes(i) && styles.checkTextCompleted
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── EARNINGS CARD ── */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View>
              <Text style={styles.earningsLabel}>Estimated Earnings</Text>
              <Text style={styles.earningsValue}>{price} BHD</Text>
            </View>
            <View>
              <Text style={styles.earningsStatusLabel}>Status</Text>
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressBadgeText}>In Progress</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── REPORT ISSUE ── */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Feather name="alert-triangle" size={18} color="#d08700" style={{ marginRight: 8 }} />
            <Text style={styles.reportTitle}>Report an Issue</Text>
          </View>
          <Text style={styles.reportSubText}>
            Found a problem? Report it before completing the service.
          </Text>
          <TouchableOpacity style={styles.reportBtn} onPress={handleReportIssue} activeOpacity={0.8}>
            <Text style={styles.reportBtnText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        {/* ── COMPLETE BUTTON ── */}
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85}>
          <Feather name="check-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.completeBtnText}>Complete Service</Text>
        </TouchableOpacity>

        <Text style={styles.completeHint}>
          {completedItems.length === CHECKLIST.length 
            ? '✓ All checklist items completed' 
            : `⚠ ${CHECKLIST.length - completedItems.length} checklist items remaining`}
        </Text>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 29,
    borderBottomWidth: 1.77,
    borderBottomColor: '#d1d5dc',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1e2939',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerSub: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  wsIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  wsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },

  // ── Active Badge ──
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00C853',
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    gap: 8,
    position: 'relative',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C853',
  },
  activeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  liveBadge: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Timer Card ──
  timerCard: {
    backgroundColor: '#EBF5FD',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a7282',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '800',
    color: '#87cefa',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerStarted: {
    fontSize: 12,
    color: '#6a7282',
    marginTop: 6,
    marginBottom: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timerBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#f0b100',
    backgroundColor: '#eff6ff',
  },
  pauseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0b100',
    letterSpacing: 0.5,
  },
  addTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#1A1A2E',
    backgroundColor: '#eff6ff',
  },
  addTimeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f0f10',
    letterSpacing: 0.5,
  },

  // ── Generic Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 16,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // ── Service Details ──
  detailsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#555f6f',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: 0.2,
  },

  // ── Customer Contact ──
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EBF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BDE0F5',
  },
  customerText: { flex: 1 },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  customerPhone: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
    fontWeight: '600',
  },
  contactBtnRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 7,
  },
  contactBtnSep: {
    width: 1,
    backgroundColor: '#E8E8E8',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9dd7fb',
    letterSpacing: 0.3,
  },

  // ── Photo Documentation ──
  photoAddBox: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
    gap: 4,
  },
  photoAddText: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // ── Service Notes ──
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#1A1A2E',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // ── Checklist ──
  checklistProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6a7282',
    marginBottom: 10,
    textAlign: 'right',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingVertical: 2,
  },
  checkIconWrap: {},
  checkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
    flex: 1,
  },
  checkTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#888888',
  },

  // ── Earnings Card ──
  earningsCard: {
    backgroundColor: '#F0FBF0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00C853',
    padding: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: 0.5,
  },
  earningsStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
    marginBottom: 6,
    textAlign: 'right',
  },
  inProgressBadge: {
    backgroundColor: '#00C853',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  inProgressBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Report Issue ──
  reportCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d08700',
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#d08700',
    letterSpacing: 0.3,
  },
  reportSubText: {
    fontSize: 12,
    color: '#d08700',
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  reportBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d08700',
    backgroundColor: 'transparent',
  },
  reportBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#d08700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Complete Button ──
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 17,
    backgroundColor: '#2e9dd9',
    shadowColor: '#2e9dd9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 4,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  completeHint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#737a8a',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 4,
  },
});