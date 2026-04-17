import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<any> = {
  prefixes: [prefix, 'ethereal://', 'https://ethereal.app'],
  config: {
    screens: {
      Main: {
        screens: {
          MainTabs: {
            screens: {
              Discover: 'discover',
              Conversations: 'conversations',
              Gallery: 'gallery',
              Profile: 'profile',
            },
          },
          CharacterDetail: 'character/:id',
          Chat: 'chat/:conversationId',
          Subscription: 'subscribe',
          EditProfile: 'profile/edit',
          TransactionHistory: 'profile/transactions',
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
    },
  },
};
