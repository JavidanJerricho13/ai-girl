import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS = 'your_ios_api_key';
const REVENUECAT_API_KEY_ANDROID = 'your_android_api_key';

export interface CreditPackage {
  id: string;
  identifier: string;
  title: string;
  description: string;
  credits: number;
  price: string;
  priceString: string;
  package: PurchasesPackage;
}

class RevenueCatService {
  private isInitialized = false;

  async initialize(userId: string) {
    if (this.isInitialized) {
      return;
    }

    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
      
      // Configure SDK
      await Purchases.configure({ apiKey });
      
      // Set log level for debugging
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Identify user
      await Purchases.logIn(userId);
      
      this.isInitialized = true;
      console.log('✅ RevenueCat initialized');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<CreditPackage[]> {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (!offerings.current || !offerings.current.availablePackages) {
        return [];
      }

      // Map packages to our credit packages format
      return offerings.current.availablePackages.map((pkg) => {
        // Extract credits from package metadata
        const credits = this.extractCreditsFromPackage(pkg);
        
        return {
          id: pkg.identifier,
          identifier: pkg.identifier,
          title: pkg.product.title,
          description: pkg.product.description,
          credits,
          price: pkg.product.price.toString(),
          priceString: pkg.product.priceString,
          package: pkg,
        };
      });
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return [];
    }
  }

  private extractCreditsFromPackage(pkg: PurchasesPackage): number {
    // Try to extract credits from identifier (e.g., "credits_100", "credits_500")
    const match = pkg.identifier.match(/credits_(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Default credit amounts based on package type
    const defaultCredits: { [key: string]: number } = {
      '$rc_monthly': 100,
      '$rc_annual': 1200,
      'starter': 50,
      'basic': 100,
      'pro': 500,
      'premium': 1000,
    };

    return defaultCredits[pkg.identifier] || 100;
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<{ customerInfo: CustomerInfo; success: boolean }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return { customerInfo, success: true };
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
        return { customerInfo: error.customerInfo, success: false };
      }
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async logOut() {
    try {
      await Purchases.logOut();
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to log out from RevenueCat:', error);
    }
  }

  // Check if user has active subscription
  hasActiveSubscription(customerInfo: CustomerInfo): boolean {
    return Object.keys(customerInfo.entitlements.active).length > 0;
  }

  // Get active subscription info
  getActiveSubscription(customerInfo: CustomerInfo) {
    const activeEntitlements = customerInfo.entitlements.active;
    const entitlementKeys = Object.keys(activeEntitlements);
    
    if (entitlementKeys.length === 0) {
      return null;
    }

    const entitlement = activeEntitlements[entitlementKeys[0]];
    return {
      identifier: entitlement.identifier,
      productIdentifier: entitlement.productIdentifier,
      expirationDate: entitlement.expirationDate,
      willRenew: entitlement.willRenew,
    };
  }
}

export const revenueCatService = new RevenueCatService();
