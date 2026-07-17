import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof RNTextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof RNTextInput>['autoCapitalize'];
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onRightIconPress?: () => void;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  containerStyle,
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border;
  };
  
  const getBackgroundColor = () => {
    if (!editable) return colors.surfaceSecondary;
    return colors.surface;
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
          },
          multiline && styles.multilineContainer,
          style,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <RNTextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.base,
    minHeight: 52,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIconButton: {
    padding: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    color: colors.error,
  },
});

export default Input;
