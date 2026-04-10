import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { useAuthStore } from '../../store/auth.store';

interface Profile {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  bio: string | null;
  language: string;
  nsfwEnabled: boolean;
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState('en');
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => apiService.getProfile(),
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
      setUsername(profile.username ?? '');
      setBio(profile.bio ?? '');
      setLanguage(profile.language ?? 'en');
      setNsfwEnabled(profile.nsfwEnabled ?? false);
    }
  }, [profile]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveButton}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isSaving, firstName, lastName, username, bio, language, nsfwEnabled]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await apiService.updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const initial = (username || user?.email || 'U').charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {profile?.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form fields */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={username}
            editable={false}
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.fieldHint}>Username cannot be changed</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Language */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Language</Text>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[
                styles.langOption,
                language === 'en' && styles.langOptionActive,
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text
                style={[
                  styles.langOptionText,
                  language === 'en' && styles.langOptionTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langOption,
                language === 'az' && styles.langOptionActive,
              ]}
              onPress={() => setLanguage('az')}
            >
              <Text
                style={[
                  styles.langOptionText,
                  language === 'az' && styles.langOptionTextActive,
                ]}
              >
                Azerbaijani
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NSFW Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>NSFW Content</Text>
            <Text style={styles.toggleHint}>
              Enable mature content in conversations
            </Text>
          </View>
          <Switch
            value={nsfwEnabled}
            onValueChange={setNsfwEnabled}
            trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },

  // Save button (header)
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  changePhotoBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Fields
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  fieldHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Language
  languageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  langOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  langOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  langOptionTextActive: {
    color: '#8B5CF6',
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  toggleHint: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
