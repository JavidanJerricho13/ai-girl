import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useChatStore } from '../../store/chat.store';
import { useAuthStore } from '../../store/auth.store';
import { websocketService, Message } from '../../services/websocket.service';
import { apiService } from '../../services/api.service';

interface RouteParams {
  conversationId: string;
  characterName?: string;
  characterAvatar?: string;
}

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as RouteParams;
  const { conversationId, characterName, characterAvatar } = params;

  const { messages, currentStreamingMessage, isTyping, addMessage, setMessages, appendStreamChunk, finishStream, setTyping } = useChatStore();
  const { updateCredits } = useAuthStore();
  
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const conversationMessages = messages[conversationId] || [];

  // Load conversation history
  useEffect(() => {
    loadConversationHistory();
    websocketService.joinConversation(conversationId);

    // Set up WebSocket event handlers
    const unsubscribeMessage = websocketService.onMessage((message) => {
      if (message.conversationId === conversationId) {
        addMessage(conversationId, message);
        scrollToBottom();
      }
    });

    const unsubscribeChunk = websocketService.onMessageChunk((chunk) => {
      if (chunk) {
        appendStreamChunk(chunk);
      }
    });

    const unsubscribeTyping = websocketService.onTyping((typing) => {
      setTyping(typing);
    });

    return () => {
      websocketService.leaveConversation(conversationId);
      unsubscribeMessage();
      unsubscribeChunk();
      unsubscribeTyping();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [conversationId]);

  const loadConversationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const conversation = await apiService.getConversation(conversationId);
      if (conversation.messages) {
        setMessages(conversationId, conversation.messages);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      Alert.alert('Error', 'Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        role: 'user',
        content: messageContent,
        createdAt: new Date().toISOString(),
      };
      addMessage(conversationId, userMessage);
      scrollToBottom();

      // Send message via WebSocket
      websocketService.sendMessage(conversationId, messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    websocketService.sendTyping(conversationId, text.length > 0);
  };

  const playAudio = async (audioUrl: string, messageId: string) => {
    try {
      // Stop currently playing audio
      if (sound && playingAudioId) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        if (playingAudioId === messageId) {
          setPlayingAudioId(null);
          return;
        }
      }

      // Play new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingAudioId(messageId);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudioId(null);
          newSound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const requestImageGeneration = async () => {
    Alert.alert(
      'Generate Image',
      'Enter a prompt for image generation',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              const response = await apiService.generateImage({
                prompt: inputText || 'Generate an image',
                imageSize: 'portrait',
              });
              
              if (response.imageUrl) {
                const imageMessage: Message = {
                  id: `temp-${Date.now()}`,
                  conversationId,
                  role: 'assistant',
                  content: 'Here\'s your generated image!',
                  imageUrl: response.imageUrl,
                  createdAt: new Date().toISOString(),
                };
                addMessage(conversationId, imageMessage);
                updateCredits(response.creditsRemaining);
                scrollToBottom();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to generate image');
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    const isLastMessage = index === conversationMessages.length - 1;

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
        {!isUser && characterAvatar && (
          <Image source={{ uri: characterAvatar }} style={styles.avatar} />
        )}
        
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          
          {item.content && (
            <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
              {item.content}
            </Text>
          )}

          {item.audioUrl && (
            <TouchableOpacity
              style={styles.audioButton}
              onPress={() => playAudio(item.audioUrl!, item.id)}
            >
              <Text style={styles.audioButtonText}>
                {playingAudioId === item.id ? '⏸️ Pause' : '▶️ Play Audio'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderStreamingMessage = () => {
    if (!currentStreamingMessage) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessageContainer]}>
        {characterAvatar && (
          <Image source={{ uri: characterAvatar }} style={styles.avatar} />
        )}
        <View style={[styles.messageBubble, styles.aiBubble]}>
          <Text style={styles.aiMessageText}>{currentStreamingMessage}</Text>
          <View style={styles.streamingIndicator}>
            <ActivityIndicator size="small" color="#8B5CF6" />
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessageContainer]}>
        {characterAvatar && (
          <Image source={{ uri: characterAvatar }} style={styles.avatar} />
        )}
        <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </View>
    );
  };

  if (isLoadingHistory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        {characterAvatar && (
          <Image source={{ uri: characterAvatar }} style={styles.headerAvatar} />
        )}
        <Text style={styles.headerTitle}>{characterName || 'Chat'}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={conversationMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={() => (
          <>
            {renderStreamingMessage()}
            {renderTypingIndicator()}
          </>
        )}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={requestImageGeneration}>
          <Text style={styles.iconButtonText}>🖼️</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={handleTyping}
          multiline
          maxLength={2000}
          editable={!isSending}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: '#8B5CF6',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  audioButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  audioButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#E9D5FF',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  streamingIndicator: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    fontSize: 15,
    color: '#1F2937',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});
