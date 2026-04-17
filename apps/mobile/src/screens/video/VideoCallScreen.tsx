import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AudioPlayer, setAudioModeAsync } from 'expo-audio';
import { websocketService, VideoState } from '../../services/websocket.service';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../services/api.service';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  conversationId: string;
  characterName?: string;
  characterAvatar?: string;
}

export default function VideoCallScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as RouteParams;
  const { conversationId, characterName, characterAvatar } = params;

  const [isInCall, setIsInCall] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoState, setVideoState] = useState<VideoState>({
    isInCall: false,
    cameraEnabled: false,
    micEnabled: true,
    emotion: 'neutral',
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [characterEmotion, setCharacterEmotion] = useState('neutral');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sound, setSound] = useState<AudioPlayer | null>(null);

  useEffect(() => {
    // Set up WebSocket event handler for video state updates
    const unsubscribeVideoState = websocketService.onVideoState((state) => {
      setVideoState(state);
      setCharacterEmotion(state.emotion || 'neutral');
      
      // Handle audio playback from character
      if (state.isInCall) {
        // In a real implementation, you'd receive audio chunks and play them
      }
    });

    // Initialize audio session
    initializeAudio();

    return () => {
      unsubscribeVideoState();
      endCall();
      if (sound) {
        sound.remove();
      }
    };
  }, [conversationId]);

  const initializeAudio = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const startCall = async () => {
    try {
      setIsConnecting(true);

      // Join conversation via WebSocket
      websocketService.joinConversation(conversationId);

      // Update video state to start call
      await websocketService.updateVideoState(conversationId, {
        isInCall: true,
        cameraEnabled: cameraEnabled,
        micEnabled: micEnabled,
        emotion: 'neutral',
      });

      setIsInCall(true);
      setIsConnecting(false);
    } catch (error) {
      console.error('Failed to start call:', error);
      Alert.alert('Error', 'Failed to start video call');
      setIsConnecting(false);
    }
  };

  const endCall = async () => {
    try {
      if (isInCall) {
        await websocketService.updateVideoState(conversationId, {
          isInCall: false,
          cameraEnabled: false,
          micEnabled: false,
          emotion: 'neutral',
        });
        websocketService.leaveConversation(conversationId);
      }
      setIsInCall(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const toggleCamera = async () => {
    const newCameraState = !cameraEnabled;
    setCameraEnabled(newCameraState);
    
    if (isInCall) {
      await websocketService.updateVideoState(conversationId, {
        cameraEnabled: newCameraState,
      });
    }
  };

  const toggleMic = async () => {
    const newMicState = !micEnabled;
    setMicEnabled(newMicState);
    
    if (isInCall) {
      await websocketService.updateVideoState(conversationId, {
        micEnabled: newMicState,
      });
    }
  };

  const getEmotionDisplay = (emotion: string) => {
    const emotions: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      neutral: '😐',
      loving: '😍',
      excited: '🤩',
    };
    return emotions[emotion] || emotions.neutral;
  };

  const renderPreCallScreen = () => (
    <View style={styles.preCallContainer}>
      <View style={styles.characterPreview}>
        {characterAvatar ? (
          <Image
            source={{ uri: characterAvatar }}
            style={styles.characterAvatarLarge}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Text style={styles.placeholderText}>👤</Text>
          </View>
        )}
        <Text style={styles.characterName}>{characterName || 'AI Character'}</Text>
        <Text style={styles.callStatus}>Ready to start video call</Text>
      </View>

      <View style={styles.preCallControls}>
        <TouchableOpacity
          style={[styles.controlButton, cameraEnabled && styles.controlButtonActive]}
          onPress={toggleCamera}
        >
          <Text style={styles.controlIcon}>{cameraEnabled ? '📹' : '📷'}</Text>
          <Text style={styles.controlLabel}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, micEnabled && styles.controlButtonActive]}
          onPress={toggleMic}
        >
          <Text style={styles.controlIcon}>{micEnabled ? '🎤' : '🔇'}</Text>
          <Text style={styles.controlLabel}>Mic</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.startCallButton}
        onPress={startCall}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.startCallIcon}>📞</Text>
            <Text style={styles.startCallText}>Start Video Call</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInCallScreen = () => (
    <View style={styles.inCallContainer}>
      {/* Character Video Feed */}
      <View style={styles.characterVideoContainer}>
        {characterAvatar ? (
          <Image
            source={{ uri: characterAvatar }}
            style={styles.characterVideo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>📹</Text>
          </View>
        )}
        
        {/* Emotion indicator overlay */}
        <View style={styles.emotionOverlay}>
          <View style={styles.emotionBadge}>
            <Text style={styles.emotionIcon}>
              {getEmotionDisplay(characterEmotion)}
            </Text>
            <Text style={styles.emotionText}>{characterEmotion}</Text>
          </View>
        </View>

        {/* Character name overlay */}
        <View style={styles.nameOverlay}>
          <Text style={styles.nameText}>{characterName}</Text>
        </View>
      </View>

      {/* User's camera preview (small overlay) */}
      {cameraEnabled && (
        <View style={styles.userVideoPreview}>
          <View style={styles.userVideoPlaceholder}>
            <Text style={styles.userVideoText}>You</Text>
          </View>
        </View>
      )}

      {/* Call controls */}
      <View style={styles.callControls}>
        <TouchableOpacity
          style={[styles.callControlButton, !micEnabled && styles.callControlButtonInactive]}
          onPress={toggleMic}
        >
          <Text style={styles.callControlIcon}>{micEnabled ? '🎤' : '🔇'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
          <Text style={styles.endCallIcon}>📞</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.callControlButton, !cameraEnabled && styles.callControlButtonInactive]}
          onPress={toggleCamera}
        >
          <Text style={styles.callControlIcon}>{cameraEnabled ? '📹' : '📷'}</Text>
        </TouchableOpacity>
      </View>

      {/* Call duration */}
      <View style={styles.callDuration}>
        <View style={styles.recordingIndicator} />
        <Text style={styles.callDurationText}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'bottom']}>
    <View style={styles.container}>
      {!isInCall ? renderPreCallScreen() : renderInCallScreen()}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  preCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  characterPreview: {
    alignItems: 'center',
    marginBottom: 60,
  },
  characterAvatarLarge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#8B5CF6',
  },
  placeholderAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderText: {
    fontSize: 64,
  },
  characterName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  preCallControls: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  controlIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  controlLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  startCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 30,
    minWidth: 200,
    gap: 12,
  },
  startCallIcon: {
    fontSize: 24,
  },
  startCallText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  inCallContainer: {
    flex: 1,
  },
  characterVideoContainer: {
    width: width,
    height: height,
    backgroundColor: '#1F2937',
  },
  characterVideo: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  videoPlaceholderText: {
    fontSize: 80,
  },
  emotionOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  emotionIcon: {
    fontSize: 20,
  },
  emotionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userVideoPreview: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  userVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userVideoText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  callControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  callControlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callControlButtonInactive: {
    backgroundColor: '#EF4444',
  },
  callControlIcon: {
    fontSize: 24,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  endCallIcon: {
    fontSize: 28,
  },
  callDuration: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  callDurationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
