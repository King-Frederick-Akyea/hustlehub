import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    icon: 'rocket',
    secondaryIcon: 'flash',
    tertiaryIcon: 'sparkles',
    title: 'Get Tasks Done',
    subtitle: 'Fast & Easy',
    description:
      'Post any task you need help with — grocery runs, laundry, documents. Verified students are ready to help!',
    bgColor: '#0052CC',
    accentColor: '#4C9AFF',
  },
  {
    id: '2',
    icon: 'wallet',
    secondaryIcon: 'trending-up',
    tertiaryIcon: 'cash',
    title: 'Earn Money',
    subtitle: 'While You Study',
    description:
      'Browse tasks, place bids, and earn money helping fellow students. Turn your free time into income.',
    bgColor: '#36B37E',
    accentColor: '#57D9A3',
  },
  {
    id: '3',
    icon: 'swap-horizontal',
    secondaryIcon: 'heart',
    tertiaryIcon: 'people',
    title: 'Barter & Trade',
    subtitle: 'No Cash Needed',
    description:
      "Exchange services with students. Cook a meal for laundry pickup — the campus sharing economy!",
    bgColor: '#FF8B00',
    accentColor: '#FFB366',
  },
  {
    id: '4',
    icon: 'cube',
    secondaryIcon: 'grid',
    tertiaryIcon: 'pricetag',
    title: 'Rent Items',
    subtitle: 'Share & Save',
    description:
      'Need something temporarily? Rent electronics, books, tools from students. List yours to earn!',
    bgColor: '#6554C0',
    accentColor: '#998DD9',
  },
  {
    id: '5',
    icon: 'shield-checkmark',
    secondaryIcon: 'finger-print',
    tertiaryIcon: 'checkmark-circle',
    title: 'Safe & Verified',
    subtitle: '100% Students Only',
    description:
      'Every user is verified with student email, ID, and face recognition. Your safety comes first.',
    bgColor: '#0052CC',
    accentColor: '#4C9AFF',
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    onComplete();
  };

  const renderIllustration = (item) => (
    <View style={[styles.illustrationContainer, { backgroundColor: item.bgColor }]}>
      {/* Background decorative circles */}
      <View style={[styles.bgCircle, styles.bgCircle1, { backgroundColor: item.accentColor }]} />
      <View style={[styles.bgCircle, styles.bgCircle2, { backgroundColor: item.accentColor }]} />
      <View style={[styles.bgCircle, styles.bgCircle3, { backgroundColor: `${item.accentColor}40` }]} />
      
      {/* Floating icons */}
      <View style={[styles.floatingIcon, styles.floatingIcon1]}>
        <Ionicons name={item.secondaryIcon} size={32} color="rgba(255,255,255,0.6)" />
      </View>
      <View style={[styles.floatingIcon, styles.floatingIcon2]}>
        <Ionicons name={item.tertiaryIcon} size={28} color="rgba(255,255,255,0.5)" />
      </View>
      <View style={[styles.floatingIcon, styles.floatingIcon3]}>
        <Ionicons name={item.secondaryIcon} size={24} color="rgba(255,255,255,0.4)" />
      </View>
      
      {/* Main icon */}
      <View style={styles.mainIconContainer}>
        <View style={[styles.mainIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name={item.icon} size={80} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={styles.slide}>
      {renderIllustration(item)}
      
      <View style={styles.contentContainer}>
        <Text style={[styles.subtitle, { color: item.bgColor }]}>{item.subtitle}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((item, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 28, 8],
          extrapolate: 'clamp',
        });
        
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              { 
                width: dotWidth,
                opacity,
                backgroundColor: item.bgColor,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === onboardingData.length - 1;
  const currentSlide = onboardingData[currentIndex];

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {!isLastSlide && (
        <TouchableOpacity 
          style={[styles.skipButton, { top: insets.top + 16 }]} 
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + spacing.lg }]}>
        {renderDots()}
        
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: currentSlide.bgColor }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          <View style={styles.nextButtonIcon}>
            <Ionicons 
              name={isLastSlide ? 'arrow-forward' : 'chevron-forward'} 
              size={20} 
              color={currentSlide.bgColor} 
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semiBold,
  },
  slide: {
    width,
    flex: 1,
  },
  illustrationContainer: {
    height: height * 0.5,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },
  bgCircle1: {
    width: 300,
    height: 300,
    top: -50,
    right: -80,
  },
  bgCircle2: {
    width: 200,
    height: 200,
    bottom: -30,
    left: -60,
  },
  bgCircle3: {
    width: 150,
    height: 150,
    top: '30%',
    left: '60%',
  },
  floatingIcon: {
    position: 'absolute',
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  floatingIcon1: {
    top: '20%',
    left: '15%',
  },
  floatingIcon2: {
    top: '35%',
    right: '12%',
  },
  floatingIcon3: {
    bottom: '25%',
    left: '20%',
  },
  mainIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainIconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    alignItems: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginRight: spacing.sm,
  },
  nextButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OnboardingScreen;
