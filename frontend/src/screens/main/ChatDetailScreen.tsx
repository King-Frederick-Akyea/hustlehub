// src/screens/main/ChatDetailScreen.tsx
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import {
  getConversation,
  getMessages,
  sendMessage as sendMessageRequest,
  sendImageMessage,
  markAsRead,
  Conversation,
  ChatMessage,
} from '../../services/messageService';
import { parseApiError } from '../../api/errors';
import { Loading } from '../../components/Shared';
import Avatar from '../../components/Avatar';
import { getAccessToken } from '../../api/client';
import type { ScreenProps } from '../../navigation/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const POLL_INTERVAL_MS = 3500;

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatDetailScreen = ({ navigation, route }: ScreenProps<'ChatDetail'>) => {
  const insets = useSafeAreaInsets();
  const conversationId: string | undefined = route.params?.conversationId;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      if (!conversationId) {
        setError('This conversation could not be found.');
        setLoading(false);
        return;
      }

      let isActive = true;

      (async () => {
        setLoading(true);
        try {
          const [conv, msgs] = await Promise.all([
            getConversation(conversationId),
            getMessages(conversationId),
          ]);
          if (!isActive) return;
          setConversation(conv);
          setMessages(msgs);
          setError('');
          markAsRead(conversationId).catch(() => {});
        } catch (err) {
          if (isActive) setError(parseApiError(err).message);
        } finally {
          if (isActive) setLoading(false);
        }
      })();

      const interval = setInterval(() => {
        getMessages(conversationId)
          .then((msgs) => {
            if (!isActive) return;
            setMessages(msgs);
            markAsRead(conversationId).catch(() => {});
          })
          .catch(() => {
            // Silent failure on background polling — don't interrupt the user with a poll error.
          });
      }, POLL_INTERVAL_MS);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [conversationId])
  );

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !conversationId) return;

    setInputText('');
    setSending(true);
    try {
      const message = await sendMessageRequest(conversationId, text);
      setMessages((prev) => [...prev, message]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      setError(parseApiError(err).message);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const sendPickedImage = async (uri: string) => {
    if (!conversationId) return;
    setSendingImage(true);
    try {
      const caption = inputText.trim();
      const message = await sendImageMessage(conversationId, uri, caption || undefined);
      setMessages((prev) => [...prev, message]);
      setInputText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      Alert.alert('Could not send photo', parseApiError(err).message);
    } finally {
      setSendingImage(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to send an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      await sendPickedImage(result.assets[0].uri);
    }
  };

  const takePhotoForMessage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera to send an image.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      await sendPickedImage(result.assets[0].uri);
    }
  };

  const handleAttach = () => {
    Alert.alert('Send a Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhotoForMessage },
      { text: 'Choose from Gallery', onPress: pickImageFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openImage = (imageUrl: string) => {
    const token = getAccessToken();
    navigation.navigate('ImageViewer', {
      imageUrl,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.isMine;
    const token = getAccessToken();
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}>
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther, item.imageUrl && styles.messageBubbleImage]}>
          {item.imageUrl && (
            <TouchableOpacity onPress={() => openImage(item.imageUrl!)} activeOpacity={0.9}>
              <Image
                source={{
                  uri: `${API_URL}${item.imageUrl}`,
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          {item.text ? (
            <Text
              style={[
                styles.messageText,
                isMe ? styles.messageTextMe : styles.messageTextOther,
                item.imageUrl ? styles.messageCaption : undefined,
              ]}
            >
              {item.text}
            </Text>
          ) : null}
          <Text style={[styles.messageTime, item.imageUrl && !item.text && styles.messageTimeOnImage]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const otherUser = conversation?.otherUser;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          activeOpacity={otherUser ? 0.7 : 1}
          onPress={() => otherUser && navigation.navigate('UserProfile', { userId: otherUser.id })}
        >
          <Avatar
            source={otherUser?.avatarUrl ? `${API_URL}${otherUser.avatarUrl}` : undefined}
            name={otherUser?.fullName}
            size="sm"
          />
          <Text style={styles.headerName}>{otherUser?.fullName ?? 'Chat'}</Text>
        </TouchableOpacity>
        <View style={{ width: 44 }} />
      </View>

      {loading && messages.length === 0 ? (
        <Loading text="Loading conversation..." />
      ) : error && messages.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttach}
            disabled={sendingImage || !conversationId}
          >
            {sendingImage ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!!conversationId}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  messageRow: {
    marginBottom: spacing.md,
  },
  messageRowLeft: {
    alignItems: 'flex-start',
  },
  messageRowRight: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  messageBubbleImage: {
    padding: 6,
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  messageCaption: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  messageTimeOnImage: {
    marginHorizontal: spacing.xs,
    marginTop: 4,
  },
  messageBubbleOther: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 0,
  },
  messageBubbleMe: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 0,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  messageTextOther: {
    color: colors.textPrimary,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatDetailScreen;
