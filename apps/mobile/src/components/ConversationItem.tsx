import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

export interface ConversationData {
  id: string;
  lastMessageAt: string | null;
  messageCount: number;
  character: {
    id: string;
    name: string;
    displayName: string;
    media: Array<{ url: string }>;
  };
  messages: Array<{
    content: string;
    role: string;
    createdAt: string;
  }>;
}

interface ConversationItemProps {
  conversation: ConversationData;
  onPress: (conversation: ConversationData) => void;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const { character, messages, lastMessageAt } = conversation;
  const avatarUrl = character.media?.[0]?.url;
  const lastMessage = messages?.[0];
  const initial = (character.displayName || character.name).charAt(0).toUpperCase();
  const timeStr = formatRelativeTime(lastMessageAt || lastMessage?.createdAt || null);

  const preview = lastMessage
    ? lastMessage.role === 'user'
      ? `You: ${lastMessage.content}`
      : lastMessage.content
    : 'No messages yet';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(conversation)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {character.displayName || character.name}
          </Text>
          {timeStr !== '' && <Text style={styles.time}>{timeStr}</Text>}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  avatarFallback: {
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  preview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
