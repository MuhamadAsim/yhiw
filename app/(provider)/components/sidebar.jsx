import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75; // 75% of screen width

const Sidebar = ({ visible, onClose }) => {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigation = (route) => {
    onClose();
    setTimeout(() => {
      router.push(route);
    }, 300);
  };

  const menuItems = [
    {
      id: 1,
      title: 'Home',
      icon: 'home',
      route: '/',
    },
    {
      id: 2,
      title: 'Cancel Request',
      icon: 'file-text',
      route: '/CancelRequestScreen',
    },
    {
      id: 3,
      title: 'RejectRequest',
      icon: 'briefcase',
      route: '/RejectRequestScreen',
    },
    {
      id: 4,
      title: 'NavigateToCustomer',
      icon: 'dollar-sign',
      route: '/NavigateToCustomerScreen',
    },
    {
      id: 5,
      title: 'ServiceInProgress',
      icon: 'calendar',
      route: '/ServiceInProgressScreen',
    },
    {
      id: 6,
      title: 'MarkServiceComplete',
      icon: 'settings',
      route: '/MarkServiceCompletedScreen',
    },
    {
      id: 7,
      title: 'NoProvidersAvailable',
      icon: 'help-circle',
      route: '/NoProvidersAvailableScreen',
    },
    {
      id: 8,
      title: 'NoRequestAvailable',
      icon: 'help-circle',
      route: '/NoRequestAvailable',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Drawer - Now on the LEFT */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.drawerContent}>
            <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
            
            {/* Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.profileSection}>
                <View style={styles.drawerAvatar}>
                  <Feather name="user" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>AHMED AL-KHALIFA</Text>
                  <Text style={styles.profileId}>PRV-001234</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>ONLINE</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleNavigation(item.route)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.iconContainer}>
                      <Feather name={item.icon} size={22} color="#87CEFA" />
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.logoutButton}>
                <Feather name="log-out" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>LOGOUT</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Backdrop - Now on the RIGHT */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContent: {
    flex: 1,
  },

  // Header
  drawerHeader: {
    backgroundColor: '#111827',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#87CEFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  profileId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Menu Section
  menuSection: {
    flex: 1,
    paddingTop: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1.77,
    borderBottomColor: '#374151',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Footer
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#374151',
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  versionText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default Sidebar;