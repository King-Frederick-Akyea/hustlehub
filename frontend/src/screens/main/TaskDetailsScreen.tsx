// src/screens/main/TaskDetailsScreen.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Share,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { categoryMeta, formatRelativeTime, resolveAvatarUrl } from '../../utils/taskDisplay';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../api/errors';
import {
  getTask,
  getBidsForTask,
  acceptTask,
  placeBid,
  acceptBid,
  startConversationWith,
  bookmarkTask,
  unbookmarkTask,
  getBookmarkStatus,
  TaskItem,
  BidItem,
} from '../../services/taskService';
import { Loading } from '../../components/Shared';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import type { ScreenProps } from '../../navigation/types';

const { width, height } = Dimensions.get('window');

// Sheet heights
const SHEET_MIN_HEIGHT = height * 0.38;
const SHEET_MID_HEIGHT = height * 0.58;
const SHEET_MAX_HEIGHT = height * 0.85;

type LatLng = { latitude: number; longitude: number };

// Modern map style
const mapStyle: any[] = [];

const defaultOrigin = { latitude: 5.6520, longitude: -0.1870 };
const defaultDestination = { latitude: 5.6580, longitude: -0.1920 };

const BID_STATUS_BADGE: Record<string, { label: string; variant: any }> = {
  pending: { label: 'Pending', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  withdrawn: { label: 'Withdrawn', variant: 'default' },
};

const TaskDetailsScreen = ({ navigation, route }: ScreenProps<'TaskDetails'>) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);
  const { user } = useAuth();

  const taskId: string | undefined = route.params?.taskId;

  const [task, setTask] = useState<TaskItem | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loadingTask, setLoadingTask] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [canScroll, setCanScroll] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Negotiate modal states
  const [negotiateModalVisible, setNegotiateModalVisible] = useState(false);
  const [proposedAmount, setProposedAmount] = useState('');
  const [negotiateMessage, setNegotiateMessage] = useState('');

  // Custom alert modal states
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Sheet animation
  const sheetPosition = useRef(new Animated.Value(0)).current;
  const currentPosition = useRef(0);
  const scrollOffset = useRef(0);

  const SNAP_COLLAPSED = 0;
  const SNAP_MID = -(SHEET_MID_HEIGHT - SHEET_MIN_HEIGHT);
  const SNAP_EXPANDED = -(SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT);

  const isPoster = !!(task && user && task.poster.id === user.id);
  const meta = task ? categoryMeta(task.category) : null;

  const origin = task?.locationLat != null && task?.locationLng != null
    ? { latitude: task.locationLat, longitude: task.locationLng }
    : defaultOrigin;
  const destination = task?.isDelivery && task?.dropoffLat != null && task?.dropoffLng != null
    ? { latitude: task.dropoffLat, longitude: task.dropoffLng }
    : defaultDestination;

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    setLoadingTask(true);
    setLoadError('');
    try {
      const fetched = await getTask(taskId);
      setTask(fetched);
      if (user && fetched.poster.id === user.id) {
        const fetchedBids = await getBidsForTask(taskId);
        setBids(fetchedBids);
      }
    } catch (error) {
      setLoadError(parseApiError(error).message);
    } finally {
      setLoadingTask(false);
    }
  }, [taskId, user]);

  useFocusEffect(
    useCallback(() => {
      loadTask();
    }, [loadTask])
  );

  useEffect(() => {
    if (!taskId) return;
    getBookmarkStatus(taskId).then(setIsBookmarked).catch(() => {});
  }, [taskId]);

  // Once a task is assigned (self-accept, bid accept, or reached via a stale/deep link),
  // both poster and tasker track it on the Active Task screen instead of here.
  useEffect(() => {
    if (task && (task.status === 'in_progress' || task.status === 'completed')) {
      navigation.replace('ActiveTask', { taskId: task.id });
    }
  }, [task, navigation]);

  // Snap functions (unchanged)
  const snapToPosition = useCallback((toValue: number, velocity = 0) => {
    Animated.spring(sheetPosition, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
      velocity,
    }).start();
    currentPosition.current = toValue;
    setCanScroll(toValue === SNAP_EXPANDED);
  }, [sheetPosition]);

  const getClosestSnapPoint = (value: number) => {
    const points = [SNAP_COLLAPSED, SNAP_MID, SNAP_EXPANDED];
    return points.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  };

  // Pan responder (unchanged)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (currentPosition.current === SNAP_EXPANDED && scrollOffset.current > 0 && gestureState.dy > 0) {
          return false;
        }
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        sheetPosition.setOffset(currentPosition.current);
        sheetPosition.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = Math.max(SNAP_EXPANDED, Math.min(SNAP_COLLAPSED, gestureState.dy));
        sheetPosition.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        sheetPosition.flattenOffset();
        const velocity = gestureState.vy;
        const currentValue = currentPosition.current + gestureState.dy;
        let snapTo;
        if (velocity < -0.5) {
          snapTo = currentValue > SNAP_MID ? SNAP_MID : SNAP_EXPANDED;
        } else if (velocity > 0.5) {
          snapTo = currentValue < SNAP_MID ? SNAP_MID : SNAP_COLLAPSED;
        } else {
          snapTo = getClosestSnapPoint(currentValue);
        }
        snapToPosition(snapTo, velocity);
      },
    })
  ).current;

  // Location & route (unchanged logic, now driven by real task coordinates)
  useEffect(() => {
    if (!task) return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(userLoc);
        calculateRoute(userLoc, origin);
      }
    })();
  }, [task]);

  const calculateRoute = (from: LatLng, to: LatLng) => {
    const points: LatLng[] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      points.push({
        latitude: from.latitude + (to.latitude - from.latitude) * (i / steps),
        longitude: from.longitude + (to.longitude - from.longitude) * (i / steps),
      });
    }
    setRouteCoordinates(points);
    const distance = getDistanceFromLatLonInKm(
      from.latitude, from.longitude,
      to.latitude, to.longitude
    );
    setCalculatedDistance(distance.toFixed(1));
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  useEffect(() => {
    if (mapRef.current && userLocation && task) {
      const coordinates = [
        userLocation,
        origin,
        ...(task.isDelivery ? [destination] : []),
      ];
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: SHEET_MIN_HEIGHT + 50, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [userLocation, task]);

  // Handlers
  // A request can succeed on the server but still error out client-side (timeout, dropped
  // connection) — before telling the user an accept failed, re-fetch to check whether it
  // actually went through, so we don't strand them on a stale "Accept Task" button.
  const tryRecoverAfterAcceptError = async (): Promise<boolean> => {
    if (!task) return false;
    try {
      const refreshed = await getTask(task.id);
      const iAmInvolved = refreshed.poster.id === user?.id || refreshed.assignedTasker?.id === user?.id;
      if (iAmInvolved && refreshed.status !== 'open') {
        navigation.replace('ActiveTask', { taskId: refreshed.id });
        return true;
      }
    } catch {
      // fall through — caller shows the original error
    }
    return false;
  };

  const handleAcceptTask = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      const updated = await acceptTask(task.id);
      navigation.replace('ActiveTask', { taskId: updated.id });
    } catch (error) {
      if (await tryRecoverAfterAcceptError()) return;
      setAlertTitle('Could not accept task');
      setAlertMessage(parseApiError(error).message);
      setAlertModalVisible(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNegotiate = () => {
    setNegotiateModalVisible(true);
  };

  const handleToggleBookmark = async () => {
    if (!task || bookmarkLoading) return;
    const next = !isBookmarked;
    setIsBookmarked(next);
    setBookmarkLoading(true);
    try {
      if (next) {
        await bookmarkTask(task.id);
      } else {
        await unbookmarkTask(task.id);
      }
    } catch (error) {
      setIsBookmarked(!next);
      setAlertTitle('Could not update bookmark');
      setAlertMessage(parseApiError(error).message);
      setAlertModalVisible(true);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = async () => {
    if (!task) return;
    try {
      await Share.share({
        message: `${task.title} — GH₵ ${task.budget} on HustleHub\n${task.location}\n\n${task.description}`,
        title: task.title,
      });
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

  const handleMessage = async () => {
    if (!task) return;
    try {
      const conversation = await startConversationWith(task.poster.id, task.id);
      navigation.navigate('ChatDetail', { conversationId: conversation.id });
    } catch (error) {
      setAlertTitle('Could not start conversation');
      setAlertMessage(parseApiError(error).message);
      setAlertModalVisible(true);
    }
  };

  const handleMessageBidder = async (bidderId: string) => {
    if (!task) return;
    try {
      const conversation = await startConversationWith(bidderId, task.id);
      navigation.navigate('ChatDetail', { conversationId: conversation.id });
    } catch (error) {
      setAlertTitle('Could not start conversation');
      setAlertMessage(parseApiError(error).message);
      setAlertModalVisible(true);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    setActionLoading(true);
    try {
      const updated = await acceptBid(bidId);
      navigation.replace('ActiveTask', { taskId: updated.id });
    } catch (error) {
      if (await tryRecoverAfterAcceptError()) return;
      setAlertTitle('Could not accept offer');
      setAlertMessage(parseApiError(error).message);
      setAlertModalVisible(true);
    } finally {
      setActionLoading(false);
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  };

  // Negotiate modal actions
  const sendNegotiationOffer = async () => {
    if (!task) return;
    const offer = parseFloat(proposedAmount) || task.budget;
    setActionLoading(true);
    try {
      await placeBid(task.id, {
        amount: offer,
        message: negotiateMessage || undefined,
      });
      setAlertTitle('Offer Sent!');
      setAlertMessage(`You offered GH₵${offer}${negotiateMessage ? ` with message: "${negotiateMessage}"` : ''}`);
      setAlertModalVisible(true);
      setNegotiateModalVisible(false);
      setProposedAmount('');
      setNegotiateMessage('');
      loadTask();
    } catch (error) {
      setNegotiateModalVisible(false);
      setAlertTitle('Could not send offer');
      setAlertMessage(parseApiError(error).message);
      setAlertModalVisible(true);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick amount chips
  const quickAddAmounts = [5, 10, 15, 20];
  const addQuickAmount = (add: number) => {
    const current = parseFloat(proposedAmount) || (task?.budget ?? 0);
    const newAmount = current + add;
    setProposedAmount(newAmount.toString());
  };

  // Custom Alert Modal dismiss
  const closeAlert = () => {
    setAlertModalVisible(false);
  };

  // Custom marker (unchanged)
  const CustomMarker = ({ type, label }: { type: 'user' | 'origin' | 'destination'; label?: string }) => (
    <View style={styles.customMarker}>
      <View style={[
        styles.markerContainer,
        type === 'user' && styles.markerUser,
        type === 'origin' && styles.markerOrigin,
        type === 'destination' && styles.markerDestination,
      ]}>
        <Ionicons
          name={type === 'user' ? 'person' : type === 'origin' ? 'location' : 'flag'}
          size={18}
          color="#FFFFFF"
        />
      </View>
      {label && (
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText}>{label}</Text>
        </View>
      )}
    </View>
  );

  if (loadingTask && !task) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Loading text="Loading task..." />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: spacing.xl }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {loadError || 'This task could not be found.'}
        </Text>
        <TouchableOpacity style={[styles.acceptButton, { marginTop: spacing.lg, flex: 0, paddingHorizontal: spacing.xl }]} onPress={() => navigation.goBack()}>
          <Text style={styles.acceptButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={mapStyle}
          initialRegion={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {userLocation && (
            <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 1 }}>
              <CustomMarker type="user" label="You" />
            </Marker>
          )}
          <Marker coordinate={origin} anchor={{ x: 0.5, y: 1 }}>
            <CustomMarker type="origin" label={task.isDelivery ? 'Pickup' : 'Task'} />
          </Marker>
          {task.isDelivery && (
            <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }}>
              <CustomMarker type="destination" label="Dropoff" />
            </Marker>
          )}
          {userLocation && routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={colors.primary}
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}
          {task.isDelivery && (
            <Polyline
              coordinates={[origin, destination]}
              strokeColor="#4CAF50"
              strokeWidth={4}
              lineDashPattern={[10, 5]}
            />
          )}
        </MapView>

        {/* Header & map controls (unchanged) */}
        <View style={[styles.headerOverlay, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleToggleBookmark} disabled={bookmarkLoading}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isBookmarked ? colors.primary : colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {calculatedDistance && (
          <Animated.View
            style={[
              styles.distanceBadge,
              {
                bottom: SHEET_MIN_HEIGHT + 20,
                transform: [{ translateY: sheetPosition }],
              },
            ]}
          >
            <Ionicons name="navigate" size={16} color={colors.primary} />
            <Text style={styles.distanceBadgeText}>{calculatedDistance} km away</Text>
          </Animated.View>
        )}
        {userLocation && (
          <Animated.View
            style={[
              styles.centerButton,
              {
                bottom: SHEET_MIN_HEIGHT + 20,
                transform: [{ translateY: sheetPosition }],
              },
            ]}
          >
            <TouchableOpacity onPress={centerOnUser} style={styles.centerButtonInner}>
              <Ionicons name="locate" size={22} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: sheetPosition }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={canScroll}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.sheetScrollContent}
        >
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: `${meta.color}15` }]}>
              <Ionicons name={meta.icon as any} size={16} color={meta.color} />
              <Text style={[styles.categoryText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {task.isUrgent && (
              <View style={styles.urgentBadge}>
                <Ionicons name="flash" size={14} color="#FF6B6B" />
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="cash" size={18} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Budget</Text>
                <Text style={styles.infoValue}>GH₵ {task.budget}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="time" size={18} color="#FF9800" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Posted</Text>
                <Text style={styles.infoValue}>{formatRelativeTime(task.createdAt)}</Text>
              </View>
            </View>
            {calculatedDistance && (
              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="navigate" size={18} color="#2196F3" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Distance</Text>
                  <Text style={styles.infoValue}>{calculatedDistance} km</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.locationCards}>
            <View style={styles.locationCard}>
              <View style={[styles.locationDot, { backgroundColor: colors.primary }]} />
              <View style={styles.locationCardContent}>
                <Text style={styles.locationCardLabel}>{task.isDelivery ? 'Pickup' : 'Location'}</Text>
                <Text style={styles.locationCardName}>{task.isDelivery ? task.pickupLocation : task.location}</Text>
              </View>
            </View>
            {task.isDelivery && (
              <>
                <View style={styles.locationLine} />
                <View style={styles.locationCard}>
                  <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
                  <View style={styles.locationCardContent}>
                    <Text style={styles.locationCardLabel}>Dropoff</Text>
                    <Text style={styles.locationCardName}>{task.dropoffLocation}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.posterCard} activeOpacity={isPoster ? 1 : 0.7}>
            <Avatar source={resolveAvatarUrl(task.poster.avatarUrl)} name={task.poster.fullName} size="md" />
            <View style={styles.posterInfo}>
              <Text style={styles.posterName}>{isPoster ? 'You' : task.poster.fullName}</Text>
              <View style={styles.posterMeta}>
                {task.poster.verified && (
                  <>
                    <Ionicons name="checkmark-circle" size={14} color={colors.verified} />
                    <Text style={styles.posterTasks}> Verified</Text>
                  </>
                )}
              </View>
            </View>
            {!isPoster && (
              <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{task.description}</Text>
          </View>

          {isPoster && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Offers {bids.length > 0 ? `(${bids.length})` : ''}
              </Text>
              {bids.length === 0 ? (
                <Text style={styles.description}>No offers yet.</Text>
              ) : (
                bids.map((bid) => {
                  const badge = BID_STATUS_BADGE[bid.status] ?? { label: bid.status, variant: 'default' };
                  return (
                    <View key={bid.id} style={styles.bidRow}>
                      <Avatar source={resolveAvatarUrl(bid.tasker.avatarUrl)} name={bid.tasker.fullName} size="sm" />
                      <View style={styles.bidInfo}>
                        <Text style={styles.posterName}>{bid.tasker.fullName}</Text>
                        <Text style={styles.description}>GH₵ {bid.amount}{bid.message ? ` · ${bid.message}` : ''}</Text>
                      </View>
                      <Badge label={badge.label} variant={badge.variant} size="sm" />
                      {bid.status === 'pending' && task.status === 'open' && (
                        <View style={{ flexDirection: 'row', gap: spacing.xs, marginLeft: spacing.sm }}>
                          <TouchableOpacity onPress={() => handleMessageBidder(bid.tasker.id)} style={styles.bidIconButton}>
                            <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleAcceptBid(bid.id)}
                            disabled={actionLoading}
                            style={[styles.bidIconButton, { backgroundColor: colors.primary }]}
                          >
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing.md }]}>
          {isPoster ? (
            task.status === 'open' ? (
              <View style={styles.acceptedContainer}>
                <Text style={styles.acceptedSubtext}>Waiting for offers or review them above.</Text>
              </View>
            ) : (
              <View style={styles.acceptedContainer}>
                <View style={styles.acceptedBadge}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <Text style={styles.acceptedText}>
                    {task.status === 'completed' ? 'Task Completed' : 'Task Assigned'}
                  </Text>
                </View>
                {task.assignedTasker && (
                  <Text style={styles.acceptedSubtext}>Assigned to {task.assignedTasker.fullName}</Text>
                )}
              </View>
            )
          ) : task.status !== 'open' ? (
            <View style={styles.acceptedContainer}>
              <View style={styles.acceptedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={styles.acceptedText}>
                  {task.assignedTasker?.id === user?.id ? 'Task Accepted!' : 'No Longer Available'}
                </Text>
              </View>
              {task.assignedTasker?.id === user?.id && (
                <Text style={styles.acceptedSubtext}>
                  Contact {task.poster.fullName} to coordinate
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.negotiateButton}
                onPress={handleNegotiate}
                activeOpacity={0.8}
                disabled={actionLoading}
              >
                <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
                <Text style={styles.negotiateButtonText}>
                  {task.myBidStatus === 'pending' ? 'Update Offer' : 'Negotiate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptTask}
                activeOpacity={0.8}
                disabled={actionLoading}
              >
                <Text style={styles.acceptButtonText}>{actionLoading ? 'Accepting...' : 'Accept Task'}</Text>
                <View style={styles.budgetChip}>
                  <Text style={styles.budgetChipText}>GH₵ {task.budget}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>

      {/* ---------- NEGOTIATE MODAL (with tap-away fix) ---------- */}
      <Modal
        transparent
        visible={negotiateModalVisible}
        animationType="slide"
        onRequestClose={() => setNegotiateModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setNegotiateModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Negotiate Price</Text>

                <View style={styles.currentBudgetContainer}>
                  <Text style={styles.currentBudgetLabel}>Original Budget</Text>
                  <Text style={styles.currentBudgetValue}>GH₵ {task.budget}</Text>
                </View>

                <View style={styles.quickChipsContainer}>
                  <Text style={styles.quickChipsLabel}>Add to budget:</Text>
                  <View style={styles.quickChipsRow}>
                    {quickAddAmounts.map((add) => (
                      <TouchableOpacity
                        key={add}
                        style={styles.quickChip}
                        onPress={() => addQuickAmount(add)}
                      >
                        <Text style={styles.quickChipText}>+{add}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.amountInputContainer}>
                  <Text style={styles.amountInputLabel}>Your offer</Text>
                  <View style={styles.amountInputWrapper}>
                    <Text style={styles.amountPrefix}>GH₵</Text>
                    <TextInput
                      style={styles.amountInput}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                      placeholderTextColor={colors.textTertiary}
                      value={proposedAmount}
                      onChangeText={setProposedAmount}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  {parseFloat(proposedAmount) > 0 && (
                    <Text style={styles.amountHint}>
                      {parseFloat(proposedAmount) > task.budget
                        ? '⬆ You\'re offering more than the budget'
                        : parseFloat(proposedAmount) < task.budget
                        ? '⬇ You\'re offering less than the budget'
                        : '⚖️ Equal to budget'}
                    </Text>
                  )}
                </View>

                <View style={styles.messageInputContainer}>
                  <Text style={styles.messageInputLabel}>Message (optional)</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Add a note to your offer..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                    value={negotiateMessage}
                    onChangeText={setNegotiateMessage}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setNegotiateModalVisible(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.sendButton]}
                    onPress={sendNegotiationOffer}
                    disabled={actionLoading}
                  >
                    <Text style={styles.sendButtonText}>{actionLoading ? 'Sending...' : 'Send Offer'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ---------- CUSTOM ALERT MODAL ---------- */}
      <Modal
        transparent
        visible={alertModalVisible}
        animationType="fade"
        onRequestClose={closeAlert}
      >
        <TouchableWithoutFeedback onPress={closeAlert}>
          <View style={styles.alertOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.alertContent}>
                <View style={styles.alertIconContainer}>
                  <Ionicons name="checkmark-circle" size={50} color={colors.success} />
                </View>
                <Text style={styles.alertTitle}>{alertTitle}</Text>
                <Text style={styles.alertMessage}>{alertMessage}</Text>
                <TouchableOpacity style={styles.alertButton} onPress={closeAlert}>
                  <Text style={styles.alertButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EFFA',
  },
  mapContainer: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceBadge: {
    position: 'absolute',
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 5,
  },
  distanceBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  centerButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 5,
  },
  centerButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  customMarker: {
    alignItems: 'center',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerUser: {
    backgroundColor: '#2196F3',
  },
  markerOrigin: {
    backgroundColor: colors.primary,
  },
  markerDestination: {
    backgroundColor: '#4CAF50',
  },
  markerLabel: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -(SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT),
    height: SHEET_MAX_HEIGHT,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  dragHandleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  sheetScrollContent: {
    paddingHorizontal: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  urgentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
    lineHeight: 28,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationCards: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: spacing.md,
  },
  locationCardContent: {
    flex: 1,
  },
  locationCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationCardName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  locationCardAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 5,
    marginVertical: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  posterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  posterInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  posterName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  posterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posterTasks: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  bidInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  bidIconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  negotiateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}12`,
    borderRadius: 14,
    paddingVertical: 16,
    gap: spacing.xs,
  },
  negotiateButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: spacing.sm,
  },
  acceptButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  budgetChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  budgetChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  acceptedContainer: {
    alignItems: 'center',
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  acceptedText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.success,
  },
  acceptedSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: height * 0.8,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  currentBudgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  currentBudgetLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  currentBudgetValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  quickChipsContainer: {
    marginBottom: spacing.md,
  },
  quickChipsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickChip: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  quickChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  amountInputContainer: {
    marginBottom: spacing.md,
  },
  amountInputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
  },
  amountHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  messageInputContainer: {
    marginBottom: spacing.md,
  },
  messageInputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  messageInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
  sendButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
   alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  alertContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  alertButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TaskDetailsScreen;
