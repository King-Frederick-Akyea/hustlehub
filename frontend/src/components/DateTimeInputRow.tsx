// A tappable "Due Date"/"Due Time" field. On native it opens the platform's modal date/time
// picker (unchanged, caller-driven via onPressNative). @react-native-community/datetimepicker
// has no web implementation at all (it renders null and logs a warning there - confirmed in
// node_modules/@react-native-community/datetimepicker/src/datetimepicker.js), so on web this
// renders a real HTML date/time input instead, via react-native-web's unstable_createElement -
// there's no supported way to get a DOM <input> through plain RN JSX/types in this project.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { unstable_createElement } from 'react-native-web';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface DateTimeInputRowProps {
  label: string;
  icon: IconName;
  mode: 'date' | 'time';
  value: Date;
  formattedValue: string;
  onPressNative: () => void;
  onChangeWeb: (next: Date) => void;
}

const pad2 = (n: number) => n.toString().padStart(2, '0');

const toDateInputValue = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toTimeInputValue = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const DateTimeInputRow = ({ label, icon, mode, value, formattedValue, onPressNative, onChangeWeb }: DateTimeInputRowProps) => {
  if (Platform.OS === 'web') {
    const handleChange = (event: { target: { value: string } }) => {
      const raw = event.target.value;
      if (!raw) return;
      const next = new Date(value);
      if (mode === 'date') {
        const [year, month, day] = raw.split('-').map(Number);
        next.setFullYear(year, month - 1, day);
      } else {
        const [hours, minutes] = raw.split(':').map(Number);
        next.setHours(hours, minutes, 0, 0);
      }
      onChangeWeb(next);
    };

    return (
      <View style={styles.pickerFullButton}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.inputContainer}>
          <Ionicons name={icon} size={18} color={colors.textSecondary} style={styles.inputIcon} />
          {unstable_createElement('input', {
            type: mode,
            value: mode === 'date' ? toDateInputValue(value) : toTimeInputValue(value),
            onChange: handleChange,
            style: {
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: typography.fontSize.base,
              color: colors.textPrimary,
              fontFamily: 'inherit',
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              paddingLeft: 0,
              paddingRight: 0,
            },
          })}
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.pickerFullButton} onPress={onPressNative}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} style={styles.inputIcon} />
        <Text style={styles.pickerText}>{formattedValue}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pickerFullButton: { marginBottom: spacing.sm },
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
  pickerText: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
});

export default DateTimeInputRow;
