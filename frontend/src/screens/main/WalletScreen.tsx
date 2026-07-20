import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { Loading, EmptyState } from '../../components/Shared';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { formatRelativeTime } from '../../utils/taskDisplay';
import { parseApiError } from '../../api/errors';
import {
  getBalance,
  getTransactions,
  initializeTopup,
  verifyTopup,
  withdraw,
  WalletBalance,
  WalletTransaction,
  WalletTransactionType,
  MobileMoneyProvider,
} from '../../services/walletService';
import type { ScreenProps } from '../../navigation/types';

const FALLBACK_DESCRIPTIONS: Record<WalletTransactionType, string> = {
  DEPOSIT: 'Wallet Top-up',
  WITHDRAWAL: 'Withdrawal',
  TASK_PAYMENT: 'Task Payment',
  RENTAL_PAYMENT: 'Rental Payment',
};

const QUICK_AMOUNTS = ['10', '20', '50', '100'];
const COLLAPSED_TRANSACTION_COUNT = 5;

const PROVIDERS: { id: MobileMoneyProvider; label: string; color: string }[] = [
  { id: 'MTN', label: 'MTN', color: '#FFCC08' },
  { id: 'VODAFONE', label: 'Vodafone', color: '#E60000' },
  { id: 'AIRTELTIGO', label: 'AirtelTigo', color: '#0033A0' },
];

const EMPTY_BALANCE: WalletBalance = { available: 0, pending: 0, held: 0 };

const WalletScreen = ({ navigation }: ScreenProps<'Wallet'>) => {
  const insets = useSafeAreaInsets();

  const [balance, setBalance] = useState<WalletBalance>(EMPTY_BALANCE);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addFundsLoading, setAddFundsLoading] = useState(false);
  const [addFundsError, setAddFundsError] = useState('');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [provider, setProvider] = useState<MobileMoneyProvider | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const loadWalletData = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    setLoadError('');
    try {
      const [balanceResult, transactionsResult] = await Promise.all([getBalance(), getTransactions()]);
      setBalance(balanceResult);
      setTransactions(transactionsResult);
    } catch (error) {
      setLoadError(parseApiError(error).message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWalletData(true);
      setShowAllTransactions(false);
    }, [loadWalletData])
  );

  const resetAddFundsForm = () => {
    setAddFundsAmount('');
    setAddFundsError('');
  };

  const resetWithdrawForm = () => {
    setWithdrawAmount('');
    setMobileMoneyNumber('');
    setProvider(null);
    setWithdrawError('');
  };

  const handleAddFundsSubmit = async () => {
    const amt = parseFloat(addFundsAmount);
    if (!amt || amt <= 0) {
      setAddFundsError('Enter a valid amount');
      return;
    }

    setAddFundsError('');
    setAddFundsLoading(true);

    let reference: string;
    try {
      const redirectUrl = Linking.createURL('payment-callback');
      const initResult = await initializeTopup(amt, redirectUrl);
      reference = initResult.reference;
      // result.type ('success' | 'cancel' | 'dismiss') is intentionally not branched on below —
      // the user may have completed payment on Paystack's page and simply closed the browser
      // manually before any redirect fired, so we always verify with the backend regardless
      // of how this session resolved.
      await WebBrowser.openAuthSessionAsync(initResult.authorizationUrl, redirectUrl);
    } catch (error) {
      // Failed before we ever got an authorizationUrl (or the browser itself errored) — nothing
      // to verify yet.
      setAddFundsLoading(false);
      setAddFundsError(parseApiError(error).message);
      return;
    }

    try {
      await verifyTopup(reference);
      setShowAddFundsModal(false);
      resetAddFundsForm();
      showAlert('Add Funds', 'Your wallet balance has been updated.');
    } catch (error) {
      setAddFundsError(parseApiError(error).message);
    } finally {
      setAddFundsLoading(false);
      // Always re-fetch from the server — never trust the client-side flow result, the deposit
      // may have failed even if the browser session looked like it succeeded (or vice versa).
      loadWalletData(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawError('Enter a valid amount');
      return;
    }
    if (amt > balance.available) {
      setWithdrawError('Amount exceeds your available balance');
      return;
    }
    if (!mobileMoneyNumber.trim()) {
      setWithdrawError('Enter a mobile money number');
      return;
    }
    if (!provider) {
      setWithdrawError('Select a mobile money provider');
      return;
    }

    setWithdrawError('');
    setWithdrawLoading(true);
    try {
      await withdraw({ amount: amt, mobileMoneyNumber: mobileMoneyNumber.trim(), provider });
      setShowWithdrawModal(false);
      resetWithdrawForm();
      showAlert('Withdrawal Requested', 'Your withdrawal is being processed.');
      loadWalletData(false);
    } catch (error) {
      setWithdrawError(parseApiError(error).message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const closeAddFundsModal = () => {
    if (addFundsLoading) return;
    setShowAddFundsModal(false);
    resetAddFundsForm();
  };

  const closeWithdrawModal = () => {
    if (withdrawLoading) return;
    setShowWithdrawModal(false);
    resetWithdrawForm();
  };

  const closeAlert = () => setAlertVisible(false);

  const visibleTransactions = useMemo(
    () => (showAllTransactions ? transactions : transactions.slice(0, COLLAPSED_TRANSACTION_COUNT)),
    [transactions, showAllTransactions]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <Loading text="Loading wallet..." />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        >
          {loadError ? <Text style={styles.loadErrorText}>{loadError}</Text> : null}

          {/* Balance Card */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>GH₵{balance.available.toFixed(2)}</Text>

            {(balance.pending > 0 || balance.held > 0) && (
              <View style={styles.balanceChipsRow}>
                {balance.pending > 0 && (
                  <View style={styles.balanceChip}>
                    <Ionicons name="hourglass-outline" size={13} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.balanceChipText}>GH₵{balance.pending.toFixed(2)} pending</Text>
                  </View>
                )}
                {balance.held > 0 && (
                  <View style={styles.balanceChip}>
                    <Ionicons name="lock-closed-outline" size={13} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.balanceChipText}>GH₵{balance.held.toFixed(2)} held</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButtonPrimary}
                onPress={() => setShowAddFundsModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={20} color={colors.primary} />
                <Text style={styles.actionButtonPrimaryText}>Add Funds</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonSecondary}
                onPress={() => setShowWithdrawModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-up-circle-outline" size={20} color={colors.textInverse} />
                <Text style={styles.actionButtonSecondaryText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transactions</Text>
              {transactions.length > COLLAPSED_TRANSACTION_COUNT && (
                <TouchableOpacity onPress={() => setShowAllTransactions((v) => !v)}>
                  <Text style={styles.viewAllText}>
                    {showAllTransactions ? 'Show Less' : `View All (${transactions.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {transactions.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="No transactions yet"
                description="Your deposits, withdrawals, and payments will show up here."
                style={styles.emptyTransactions}
              />
            ) : (
              visibleTransactions.map((transaction) => {
                const isCredit = transaction.direction === 'CREDIT';
                const color = isCredit ? colors.moneyIn : colors.moneyOut;
                const description = transaction.description || FALLBACK_DESCRIPTIONS[transaction.type];

                return (
                  <View key={transaction.id} style={styles.transactionCard}>
                    <View style={[styles.transactionIcon, { backgroundColor: `${color}15` }]}>
                      <Ionicons
                        name={isCredit ? 'arrow-down-circle' : 'arrow-up-circle'}
                        size={22}
                        color={color}
                      />
                    </View>

                    <View style={styles.transactionInfo}>
                      <View style={styles.transactionTitleRow}>
                        <Text style={styles.transactionDescription} numberOfLines={1}>
                          {description}
                        </Text>
                        {transaction.status === 'PENDING' && (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                          </View>
                        )}
                        {transaction.status === 'FAILED' && (
                          <View style={styles.failedBadge}>
                            <Text style={styles.failedBadgeText}>Failed</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.transactionDate}>{formatRelativeTime(transaction.createdAt)}</Text>
                    </View>

                    <Text style={[styles.transactionAmount, { color }]}>
                      {isCredit ? '+' : '-'}GH₵{transaction.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Payment Info */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Info</Text>

            <View style={styles.paymentInfoCard}>
              <View style={styles.paymentMethodIcon}>
                <Ionicons name="phone-portrait" size={22} color={colors.primary} />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>Mobile Money Withdrawals</Text>
                <Text style={styles.paymentMethodDescription}>
                  Withdrawals go to the mobile money number you enter each time you withdraw.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Add Funds Modal */}
      <Modal
        visible={showAddFundsModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddFundsModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeAddFundsModal}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderSpacer} />
              <Text style={styles.modalTitle}>Add Funds</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeAddFundsModal}
                disabled={addFundsLoading}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Top up your wallet securely via Paystack</Text>

            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>GH₵</Text>
              <TextInput
                style={styles.amountInputField}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
                value={addFundsAmount}
                onChangeText={setAddFundsAmount}
                keyboardType="decimal-pad"
                editable={!addFundsLoading}
                autoFocus
              />
            </View>

            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((amt) => {
                const active = addFundsAmount === amt;
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.quickAmountButton, active && styles.quickAmountButtonActive]}
                    onPress={() => setAddFundsAmount(amt)}
                    disabled={addFundsLoading}
                  >
                    <Text style={[styles.quickAmountText, active && styles.quickAmountTextActive]}>
                      GH¢{amt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.secureNote}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.secureNoteText}>
                You'll be redirected to Paystack's secure checkout to complete this payment.
              </Text>
            </View>

            {addFundsError ? <Text style={styles.modalErrorText}>{addFundsError}</Text> : null}

            <Button
              title="Add Funds"
              onPress={handleAddFundsSubmit}
              loading={addFundsLoading}
              icon="arrow-forward"
              iconPosition="right"
              size="lg"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={closeWithdrawModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeWithdrawModal}
          />
          <ScrollView
            style={styles.modalSheetOuter}
            contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHandle} />
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderSpacer} />
                <Text style={styles.modalTitle}>Withdraw Funds</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeWithdrawModal}
                  disabled={withdrawLoading}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>Send funds to your mobile money account</Text>

              <View style={styles.amountLabelRow}>
                <Text style={styles.inputLabel}>Amount</Text>
                <View style={styles.availablePill}>
                  <Text style={styles.availablePillText}>
                    Available GH₵{balance.available.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencyPrefix}>GH₵</Text>
                <TextInput
                  style={styles.amountInputField}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="decimal-pad"
                  editable={!withdrawLoading}
                />
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={() => setWithdrawAmount(balance.available.toFixed(2))}
                  disabled={withdrawLoading || balance.available <= 0}
                >
                  <Text style={styles.maxButtonText}>MAX</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Mobile Money Number"
                placeholder="e.g. 0244123456"
                value={mobileMoneyNumber}
                onChangeText={setMobileMoneyNumber}
                keyboardType="phone-pad"
                editable={!withdrawLoading}
                leftIcon="call-outline"
              />

              <Text style={styles.inputLabel}>Provider</Text>
              <View style={styles.providerRow}>
                {PROVIDERS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.providerChip, provider === p.id && styles.providerChipActive]}
                    onPress={() => setProvider(p.id)}
                    disabled={withdrawLoading}
                  >
                    <View style={[styles.providerDot, { backgroundColor: p.color }]} />
                    <Text
                      style={[
                        styles.providerChipText,
                        provider === p.id && styles.providerChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {withdrawError ? <Text style={styles.modalErrorText}>{withdrawError}</Text> : null}

              <Button
                title="Withdraw"
                onPress={handleWithdrawSubmit}
                loading={withdrawLoading}
                icon="arrow-up-circle-outline"
                size="lg"
                style={{ marginTop: spacing.sm }}
              />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        transparent
        visible={alertVisible}
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
                <Button title="OK" onPress={closeAlert} size="lg" />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
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
  loadErrorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  balanceCard: {
    marginHorizontal: spacing.lg,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  balanceLabel: {
    fontSize: typography.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  balanceChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 5,
  },
  balanceChipText: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.fontWeight.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
    width: '100%',
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textInverse,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  actionButtonPrimaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    gap: spacing.xs,
  },
  actionButtonSecondaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semiBold,
  },
  transactionsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  emptyTransactions: {
    paddingVertical: spacing.xl,
    flex: 0,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDescription: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: 2,
    flexShrink: 1,
  },
  pendingBadge: {
    backgroundColor: `${colors.warning}20`,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    marginLeft: spacing.xs,
  },
  pendingBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.warning,
  },
  failedBadge: {
    backgroundColor: `${colors.error}20`,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    marginLeft: spacing.xs,
  },
  failedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.error,
  },
  transactionDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  transactionAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  paymentSection: {
    paddingHorizontal: spacing.lg,
  },
  paymentInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentMethodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  paymentMethodDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalSheetOuter: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '88%',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modalHeaderSpacer: {
    width: 32,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  amountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availablePill: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  availablePillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  currencyPrefix: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
    marginRight: spacing.xs,
  },
  amountInputField: {
    flex: 1,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  maxButton: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  maxButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickAmountButtonActive: {
    backgroundColor: `${colors.primary}12`,
    borderColor: colors.primary,
  },
  quickAmountText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  quickAmountTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.base,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  secureNoteText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  providerChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  providerChipActive: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
  providerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  providerChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  providerChipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  modalErrorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
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
});

export default WalletScreen;
