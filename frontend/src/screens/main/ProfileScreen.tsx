// src/screens/main/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { useRole } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { fixedRole, currentRole, setCurrentRole, canSwitch } = useRole();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (!user) {
    return <View style={[styles.container, { paddingTop: insets.top }]} />;
  }

  const memberSinceYear = new Date(user.createdAt).getFullYear();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  interface MenuItemProps {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }

  const MenuItem = ({ icon, label, onPress, rightElement, danger }: MenuItemProps) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarContainer}>
              <Avatar
                source={user.avatarUrl ? `${API_URL}${user.avatarUrl}` : undefined}
                name={user.fullName}
                size="lg"
              />
              {user.emailVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{memberSinceYear}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.completedTasksCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{`GH₵ ${user.totalEarnings.toFixed(2)}`}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>
        </View>

        {/* Role Switcher - only show if fixedRole === 'both' */}
        {canSwitch && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Role</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleOption, currentRole === 'poster' && styles.roleOptionActive]}
                onPress={() => setCurrentRole('poster')}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={currentRole === 'poster' ? '#FFFFFF' : colors.textSecondary}
                />
                <Text style={[styles.roleText, currentRole === 'poster' && styles.roleTextActive]}>
                  Poster
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, currentRole === 'tasker' && styles.roleOptionActive]}
                onPress={() => setCurrentRole('tasker')}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={currentRole === 'tasker' ? '#FFFFFF' : colors.textSecondary}
                />
                <Text style={[styles.roleText, currentRole === 'tasker' && styles.roleTextActive]}>
                  Tasker
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.roleHint}>
              {currentRole === 'poster'
                ? 'You can post tasks and manage them.'
                : 'You can accept tasks and work on them.'}
            </Text>
          </View>
        )}

        {/* Settings Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: `${colors.primary}50` }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
          <MenuItem
            icon="wallet-outline"
            label="Wallet"
            onPress={() => navigation.navigate('Wallet')}
          />
          <MenuItem
            icon="swap-horizontal-outline"
            label="Barter & Rentals"
            onPress={() => navigation.navigate('Rentals')}
          />
          <MenuItem
            icon="bookmark-outline"
            label="Saved Tasks"
            onPress={() => navigation.navigate('Bookmarks')}
          />
          <MenuItem icon="lock-closed-outline" label="Privacy & Security" />
          <MenuItem icon="help-circle-outline" label="Help Center" />
          <MenuItem icon="document-text-outline" label="Terms of Service" />
          <View style={styles.menuSpacer} />
          <MenuItem icon="log-out-outline" label="Log Out" danger onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: spacing.sm,
  },
  profileCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.surface,
    borderRadius: 11,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    gap: spacing.xs,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
  },
  roleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  roleHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuIconDanger: {
    backgroundColor: `${colors.error}12`,
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  menuLabelDanger: {
    color: colors.error,
  },
  menuSpacer: {
    height: spacing.md,
  },
});

export default ProfileScreen;