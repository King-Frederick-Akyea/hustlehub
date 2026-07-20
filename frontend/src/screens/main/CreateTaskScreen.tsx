// src/screens/main/PostTaskScreen.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { TASK_CATEGORIES } from '../../constants';
import { createTask } from '../../services/taskService';
import { parseApiError } from '../../api/errors';
import type { ScreenProps } from '../../navigation/types';

const { height } = Dimensions.get('window');

// Delivery-style categories need a separate pickup + dropoff location instead of one location.
const CATEGORIES_REQUIRING_TWO_LOCATIONS = ['delivery', 'moving'];

type TaskCategory = (typeof TASK_CATEGORIES)[number];
type LocationField = 'main' | 'pickup' | 'dropoff';

interface LocationSuggestion {
  placeId: string | number;
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lon: number;
}

const STEPS = [
  { id: 0, title: 'What do you need?', subtitle: 'Choose a category' },
  { id: 1, title: 'Describe it', subtitle: 'Be clear and detailed' },
  { id: 2, title: 'When?', subtitle: 'Set your due date & time' },
  { id: 3, title: 'Where?', subtitle: 'Set the task location' },
  { id: 4, title: 'Budget', subtitle: 'Set your price' },
  { id: 5, title: 'Review & post', subtitle: 'Check everything is correct' },
];

interface LocationInputRowProps {
  label: string;
  value: string;
  onChangeText: (text: string, field: LocationField) => void;
  placeholder: string;
  field: LocationField;
  activeField: string;
  onFocusField: (field: LocationField, currentValue: string) => void;
  onBlurField: (field: LocationField) => void;
  suggestions: LocationSuggestion[];
  onSelectSuggestion: (item: LocationSuggestion, field: LocationField) => void;
  isSearchingLocation: boolean;
  isGettingLocation: boolean;
  onUseCurrentLocation: (field: LocationField) => void;
}

// --- Location Input Row ---
const LocationInputRow = ({
  label,
  value,
  onChangeText,
  placeholder,
  field,
  activeField,
  onFocusField,
  onBlurField,
  suggestions,
  onSelectSuggestion,
  isSearchingLocation,
  isGettingLocation,
  onUseCurrentLocation,
}: LocationInputRowProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFocus = () => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    setShowSuggestions(true);
    onFocusField(field, value);
  };

  const handleBlur = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    blurTimeout.current = setTimeout(() => {
      setShowSuggestions(false);
      onBlurField(field);
    }, 300);
  };

  const handleSuggestionPress = (item: LocationSuggestion) => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    onSelectSuggestion(item, field);
    setShowSuggestions(false);
  };

  React.useEffect(() => {
    if (activeField === field) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [activeField, field]);

  return (
    <View style={styles.locationGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.locationInputRow}>
        <TextInput
          style={[styles.input, styles.locationInput]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={(text) => onChangeText(text, field)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <TouchableOpacity
          style={styles.locationIcon}
          onPress={() => onUseCurrentLocation(field)}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            style={styles.suggestionsScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {suggestions.map((item: LocationSuggestion) => (
              <TouchableOpacity
                key={item.placeId?.toString() || item.description}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.textSecondary}
                  style={styles.suggestionIcon}
                />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionMain}>{item.mainText}</Text>
                  {item.secondaryText && (
                    <Text style={styles.suggestionSecondary} numberOfLines={1}>
                      {item.secondaryText}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isSearchingLocation && showSuggestions && (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
      )}
    </View>
  );
};

const PostTaskScreen = ({ navigation }: ScreenProps<'CreateTask'>) => {
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<TaskCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [budget, setBudget] = useState('');

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [postError, setPostError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [activeField, setActiveField] = useState<LocationField | ''>('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const totalSteps = STEPS.length;
  const requiresTwoLocations = category ? CATEGORIES_REQUIRING_TWO_LOCATIONS.includes(category.id) : false;
  const isPickerOpen = showDatePicker || showTimePicker;

  const parsedBudgetValue = parseFloat(budget);
  const parsedBudget = budget !== '' && !isNaN(parsedBudgetValue) && parsedBudgetValue > 0 ? parsedBudgetValue : null;
  const formatMoney = (value: number) => value.toFixed(2);

  const isInsufficientBalanceError = postError.toLowerCase().includes('insufficient wallet balance');

  const changeStep = (newStep: number) => {
    if (newStep < 0 || newStep >= totalSteps) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(newStep);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => changeStep(currentStep + 1);
  const goBack = () => changeStep(currentStep - 1);

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return category !== null;
      case 1: return title.trim().length >= 2 && description.trim().length >= 10;
      case 2: return !!dueDate && !!dueTime;
      case 3:
        if (requiresTwoLocations) {
          return pickupLocation.trim() !== '' && dropoffLocation.trim() !== '';
        }
        return location.trim() !== '';
      case 4: return budget !== '' && parseFloat(budget) > 0;
      case 5: return true;
      default: return false;
    }
  };

  // Typing (see handleLocationChange) clears out any previously-picked coordinates, so a poster
  // who types an address but never taps a suggestion would otherwise post a task with no lat/lng —
  // which silently breaks "tasks near you" distance sorting for that task everywhere in the app.
  // Best-effort geocode the raw text as a fallback right before submitting.
  const geocodeAddress = async (query: string): Promise<{ lat: number; lon: number } | null> => {
    if (!query) return null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=gh&format=json&limit=1`,
        { headers: { 'User-Agent': 'HustleHub/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.warn('Geocode fallback failed:', error);
    }
    return null;
  };

  const handlePost = async () => {
    if (!isStepValid()) return;
    setLoading(true);
    setPostError('');
    try {
      const deadline = new Date(
        dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(),
        dueTime.getHours(), dueTime.getMinutes(), 0, 0
      );

      let finalLocationLat = locationLat, finalLocationLng = locationLng;
      let finalPickupLat = pickupLat, finalPickupLng = pickupLng;
      let finalDropoffLat = dropoffLat, finalDropoffLng = dropoffLng;

      if (requiresTwoLocations) {
        if (finalPickupLat == null || finalPickupLng == null) {
          const geo = await geocodeAddress(pickupLocation.trim());
          if (geo) { finalPickupLat = geo.lat; finalPickupLng = geo.lon; }
        }
        if (finalDropoffLat == null || finalDropoffLng == null) {
          const geo = await geocodeAddress(dropoffLocation.trim());
          if (geo) { finalDropoffLat = geo.lat; finalDropoffLng = geo.lon; }
        }
      } else if (finalLocationLat == null || finalLocationLng == null) {
        const geo = await geocodeAddress(location.trim());
        if (geo) { finalLocationLat = geo.lat; finalLocationLng = geo.lon; }
      }

      await createTask({
        title: title.trim(),
        description: description.trim(),
        category: category.id,
        budget: parseFloat(budget),
        location: requiresTwoLocations ? pickupLocation.trim() : location.trim(),
        locationLat: requiresTwoLocations ? finalPickupLat : finalLocationLat,
        locationLng: requiresTwoLocations ? finalPickupLng : finalLocationLng,
        isDelivery: requiresTwoLocations,
        pickupLocation: requiresTwoLocations ? pickupLocation.trim() : undefined,
        pickupLat: requiresTwoLocations ? finalPickupLat : undefined,
        pickupLng: requiresTwoLocations ? finalPickupLng : undefined,
        dropoffLocation: requiresTwoLocations ? dropoffLocation.trim() : undefined,
        dropoffLat: requiresTwoLocations ? finalDropoffLat : undefined,
        dropoffLng: requiresTwoLocations ? finalDropoffLng : undefined,
        deadline: deadline.toISOString(),
        isUrgent: false,
      });
      setSuccessModalVisible(true);
    } catch (err) {
      setPostError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // --- Location Search ---
  const searchLocations = useCallback(async (query: string, field: LocationField) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    setIsSearchingLocation(true);
    setActiveField(field);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&countrycodes=gh&format=json&addressdetails=1&limit=8`,
        { headers: { 'User-Agent': 'HustleHub/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const suggestions = data.map((place: any) => ({
          placeId: place.place_id,
          description: place.display_name,
          mainText: place.display_name.split(',')[0] || place.name,
          secondaryText: place.display_name.split(',').slice(1).join(',').trim(),
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
        }));
        setLocationSuggestions(suggestions);
      } else {
        const fallback = [
          { placeId: 'unity', description: 'Unity Hall, University of Ghana', mainText: 'Unity Hall', secondaryText: 'University of Ghana, Legon', lat: 5.6505, lon: -0.1862 },
          { placeId: 'pentagon', description: 'Pentagon Hall, University of Ghana', mainText: 'Pentagon Hall', secondaryText: 'University of Ghana, Legon', lat: 5.6515, lon: -0.1855 },
          { placeId: 'akuafo', description: 'Akuafo Hall, University of Ghana', mainText: 'Akuafo Hall', secondaryText: 'University of Ghana, Legon', lat: 5.6488, lon: -0.1872 },
          { placeId: 'legon', description: 'Legon Hall, University of Ghana', mainText: 'Legon Hall', secondaryText: 'University of Ghana, Legon', lat: 5.6498, lon: -0.1868 },
          { placeId: 'volta', description: 'Volta Hall, University of Ghana', mainText: 'Volta Hall', secondaryText: 'University of Ghana, Legon', lat: 5.6495, lon: -0.1858 },
          { placeId: 'balme', description: 'Balme Library, University of Ghana', mainText: 'Balme Library', secondaryText: 'University of Ghana, Legon', lat: 5.6502, lon: -0.1875 },
          { placeId: 'nightmarket', description: 'Night Market, University of Ghana', mainText: 'Night Market', secondaryText: 'University of Ghana, Legon', lat: 5.6510, lon: -0.1880 },
        ].filter(
          (loc) =>
            loc.mainText.toLowerCase().includes(query.toLowerCase()) ||
            loc.description.toLowerCase().includes(query.toLowerCase())
        );
        setLocationSuggestions(fallback);
      }
    } catch (error) {
      console.warn('Location search error:', error);
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocation(false);
    }
  }, []);

  const handleLocationChange = useCallback(
    (text: string, field: LocationField) => {
      // Manual typing invalidates any previously-selected coordinates for this field.
      if (field === 'main') { setLocation(text); setLocationLat(null); setLocationLng(null); }
      else if (field === 'pickup') { setPickupLocation(text); setPickupLat(null); setPickupLng(null); }
      else if (field === 'dropoff') { setDropoffLocation(text); setDropoffLat(null); setDropoffLng(null); }

      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        searchLocations(text, field);
      }, 400);
    },
    [searchLocations]
  );

  const handleFocusField = useCallback(
    (field: LocationField, currentValue: string) => {
      setActiveField(field);
      if (currentValue && currentValue.length >= 3) searchLocations(currentValue, field);
    },
    [searchLocations]
  );

  const handleBlurField = useCallback((field: LocationField) => {
    setTimeout(() => {
      setActiveField((prev) => (prev === field ? '' : prev));
    }, 350);
  }, []);

  const selectSuggestion = useCallback((item: LocationSuggestion, field: LocationField) => {
    const address = item.description;
    if (field === 'main') { setLocation(address); setLocationLat(item.lat); setLocationLng(item.lon); }
    else if (field === 'pickup') { setPickupLocation(address); setPickupLat(item.lat); setPickupLng(item.lon); }
    else if (field === 'dropoff') { setDropoffLocation(address); setDropoffLat(item.lat); setDropoffLng(item.lon); }
    setLocationSuggestions([]);
    setActiveField('');
    Keyboard.dismiss();
  }, []);

  const getCurrentLocation = useCallback(async (field: LocationField) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }
    setIsGettingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const reverse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&zoom=18`
      );
      const data = await reverse.json();
      if (data.display_name) {
        const address = data.display_name;
        const { latitude, longitude } = loc.coords;
        if (field === 'main') { setLocation(address); setLocationLat(latitude); setLocationLng(longitude); }
        else if (field === 'pickup') { setPickupLocation(address); setPickupLat(latitude); setPickupLng(longitude); }
        else if (field === 'dropoff') { setDropoffLocation(address); setDropoffLat(latitude); setDropoffLng(longitude); }
        setLocationSuggestions([]);
        setActiveField('');
      }
    } catch (error) {
      console.warn('Reverse geocode error:', error);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  // --- Render steps ---
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[0].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[0].subtitle}</Text>
            <View style={styles.typeGrid}>
              {TASK_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.typeCard, category?.id === cat.id && styles.typeCardActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={28}
                    color={category?.id === cat.id ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.typeLabel, category?.id === cat.id && styles.typeLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[1].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[1].subtitle}</Text>
            <Text style={styles.fieldLabel}>Title</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Grocery pickup from Shoprite"
                placeholderTextColor={colors.placeholder}
                value={title}
                onChangeText={setTitle}
                maxLength={150}
              />
            </View>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your task in detail..."
              placeholderTextColor={colors.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {description.length > 0 && description.length < 10 && (
              <Text style={styles.hintText}>Minimum 10 characters</Text>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[2].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[2].subtitle}</Text>
            <TouchableOpacity style={styles.pickerFullButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.fieldLabel}>Due Date</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <Text style={styles.pickerText}>{formatDate(dueDate)}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerFullButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.fieldLabel}>Due Time</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <Text style={styles.pickerText}>{formatTime(dueTime)}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[3].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[3].subtitle}</Text>
            {requiresTwoLocations ? (
              <>
                <LocationInputRow
                  label="Pickup Location"
                  value={pickupLocation}
                  onChangeText={handleLocationChange}
                  placeholder="Enter pickup address"
                  field="pickup"
                  activeField={activeField}
                  onFocusField={handleFocusField}
                  onBlurField={handleBlurField}
                  suggestions={locationSuggestions}
                  onSelectSuggestion={selectSuggestion}
                  isSearchingLocation={isSearchingLocation}
                  isGettingLocation={isGettingLocation}
                  onUseCurrentLocation={getCurrentLocation}
                />
                <LocationInputRow
                  label="Dropoff Location"
                  value={dropoffLocation}
                  onChangeText={handleLocationChange}
                  placeholder="Enter dropoff address"
                  field="dropoff"
                  activeField={activeField}
                  onFocusField={handleFocusField}
                  onBlurField={handleBlurField}
                  suggestions={locationSuggestions}
                  onSelectSuggestion={selectSuggestion}
                  isSearchingLocation={isSearchingLocation}
                  isGettingLocation={isGettingLocation}
                  onUseCurrentLocation={getCurrentLocation}
                />
              </>
            ) : (
              <LocationInputRow
                label="Location"
                value={location}
                onChangeText={handleLocationChange}
                placeholder="Enter location"
                field="main"
                activeField={activeField}
                onFocusField={handleFocusField}
                onBlurField={handleBlurField}
                suggestions={locationSuggestions}
                onSelectSuggestion={selectSuggestion}
                isSearchingLocation={isSearchingLocation}
                isGettingLocation={isGettingLocation}
                onUseCurrentLocation={getCurrentLocation}
              />
            )}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[4].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[4].subtitle}</Text>
            <Text style={styles.fieldLabel}>Budget (GH¢)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>GH¢</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
              />
            </View>
            {parsedBudget != null && (
              <Text style={styles.holdNoticeText}>
                GH₵{formatMoney(parsedBudget)} will be held from your wallet when you post this task.
              </Text>
            )}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{STEPS[5].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[5].subtitle}</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Ionicons name="pricetag-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Category</Text>
                  <Text style={styles.summaryValue}>{category?.label || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="create-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Title</Text>
                  <Text style={styles.summaryValue}>{title}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Description</Text>
                  <Text style={styles.summaryValue}>{description}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Due</Text>
                  <Text style={styles.summaryValue}>{formatDate(dueDate)} at {formatTime(dueTime)}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="location-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Location</Text>
                  <Text style={styles.summaryValue}>
                    {requiresTwoLocations
                      ? `Pickup: ${pickupLocation}\nDropoff: ${dropoffLocation}`
                      : location}
                  </Text>
                </View>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <Ionicons name="cash-outline" size={20} color={colors.primary} style={styles.summaryIcon} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Budget</Text>
                  <Text style={[styles.summaryValue, styles.budgetValue]}>GH¢ {budget || '0.00'}</Text>
                </View>
              </View>
            </View>
            {parsedBudget != null && (
              <Text style={styles.holdNoticeText}>
                GH₵{formatMoney(parsedBudget)} will be held from your wallet when you post this task.
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Task</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentStep + 1) / totalSteps) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentStep + 1} of {totalSteps}</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
          >
            {renderStepContent(currentStep)}
          </ScrollView>
        </Animated.View>

        {!isPickerOpen && postError ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Text style={styles.hintText}>{postError}</Text>
            {isInsufficientBalanceError && (
              <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
                <Text style={styles.topUpLinkText}>Top Up Wallet</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {!isPickerOpen && (
          <View style={[styles.footer, { paddingBottom: (insets.bottom || spacing.sm) }]}>
            {currentStep > 0 && currentStep < totalSteps - 1 && (
              <TouchableOpacity style={styles.backFooterButton} onPress={goBack}>
                <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
                <Text style={styles.backFooterText}>Back</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {currentStep < totalSteps - 1 ? (
              <TouchableOpacity
                style={[styles.nextButton, !isStepValid() && styles.nextButtonDisabled]}
                onPress={goNext}
                disabled={!isStepValid()}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.postButton, (!isStepValid() || loading) && styles.postButtonDisabled]}
                onPress={handlePost}
                disabled={!isStepValid() || loading}
              >
                <Text style={styles.postButtonText}>{loading ? 'Posting...' : 'Post Task'}</Text>
                {!loading && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
              </TouchableOpacity>
            )}
          </View>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDueDate(selectedDate);
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={dueTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setDueTime(selectedTime);
            }}
          />
        )}

        {/* Success Modal */}
        <Modal
          transparent
          visible={successModalVisible}
          animationType="fade"
          onRequestClose={() => {
            setSuccessModalVisible(false);
            navigation.goBack();
          }}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="checkmark-circle" size={50} color={colors.success} />
                  </View>
                  <Text style={styles.modalTitle}>Task Posted! </Text>
                  <Text style={styles.modalMessage}>
                    Your task has been posted successfully. It will be reviewed and accepted by taskers soon.
                  </Text>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setSuccessModalVisible(false);
                      navigation.goBack();
                    }}
                  >
                    <Text style={styles.modalButtonText}>View Task</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => {
                      setSuccessModalVisible(false);
                      navigation.goBack();
                    }}
                  >
                    <Text style={styles.modalButtonSecondaryText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  stepContainer: { flex: 1, paddingTop: spacing.md },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.xs,
  },
  typeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  typeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  typeLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 150,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  holdNoticeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  topUpLinkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSecondary,
  },
  inputIcon: { marginRight: spacing.sm },
  currencyPrefix: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  pickerFullButton: { marginBottom: spacing.sm },
  pickerText: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  locationGroup: { marginBottom: spacing.md },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    backgroundColor: colors.surfaceSecondary,
  },
  locationInput: {
    paddingVertical: spacing.md,
    borderWidth: 0,
    marginBottom: 0,
    flex: 1,
  },
  locationIcon: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestionsContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    maxHeight: 150,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionsScroll: { maxHeight: 150 },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionIcon: { marginRight: spacing.sm },
  suggestionTextContainer: { flex: 1 },
  suggestionMain: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  suggestionSecondary: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  loadingIndicator: { marginVertical: spacing.xs },

  // Summary card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryIcon: {
    marginRight: spacing.md,
    width: 24,
    textAlign: 'center',
    marginTop: 2,
  },
  summaryContent: {
    flex: 1,
    flexShrink: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flexWrap: 'wrap',
  },
  budgetValue: {
    fontWeight: '700',
    color: colors.primary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  backFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  backFooterText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Success modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.base,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonSecondaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default PostTaskScreen;