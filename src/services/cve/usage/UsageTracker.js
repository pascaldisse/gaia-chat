/**
 * Usage Tracker for CVE Scanner
 * Implements startup-friendly pricing and usage tracking
 */

class UsageTracker {
  constructor(db) {
    this.db = db; // IndexedDB instance
    this.plans = {
      free: {
        name: 'Free',
        scansPerMonth: 10,
        price: 0,
        features: ['Basic scanning', 'JSON reports']
      },
      startup: {
        name: 'Startup',
        scansPerMonth: 100,
        price: 9,
        features: ['All report formats', 'API access', 'Email alerts']
      },
      growth: {
        name: 'Growth',
        scansPerMonth: 500,
        price: 29,
        features: ['Priority scanning', 'Webhook integration', 'Custom rules']
      },
      enterprise: {
        name: 'Enterprise',
        scansPerMonth: -1, // Unlimited
        price: 99,
        features: ['Unlimited scans', 'SLA support', 'Custom integrations']
      }
    };
  }

  async initialize() {
    // Create usage store if not exists
    const stores = await this.db.getAllStoreNames();
    if (!stores.includes('usage')) {
      await this.db.createObjectStore('usage', { keyPath: 'id' });
    }
    if (!stores.includes('subscriptions')) {
      await this.db.createObjectStore('subscriptions', { keyPath: 'userId' });
    }
  }

  async trackScan(userId, scanData) {
    const usage = {
      id: `${userId}_${Date.now()}`,
      userId,
      timestamp: new Date().toISOString(),
      type: 'scan',
      details: {
        projectType: scanData.projectType,
        dependencyCount: scanData.dependencyCount,
        vulnerabilityCount: scanData.vulnerabilityCount
      }
    };

    await this.db.put('usage', usage);
    
    // Check if user exceeded limit
    const limit = await this.checkUsageLimit(userId);
    if (limit.exceeded) {
      throw new Error(`Usage limit exceeded. ${limit.message}`);
    }

    return usage;
  }

  async checkUsageLimit(userId) {
    const subscription = await this.getUserSubscription(userId);
    const plan = this.plans[subscription.plan || 'free'];
    
    if (plan.scansPerMonth === -1) {
      return { exceeded: false, remaining: -1 };
    }

    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyUsage = await this.getMonthlyUsage(userId, currentMonth);
    
    const used = monthlyUsage.length;
    const limit = plan.scansPerMonth;
    const remaining = limit - used;

    if (remaining <= 0) {
      return {
        exceeded: true,
        message: `You've used all ${limit} scans for this month. Upgrade to ${this.getNextPlan(subscription.plan).name} for more scans.`,
        used,
        limit,
        remaining: 0
      };
    }

    return {
      exceeded: false,
      used,
      limit,
      remaining
    };
  }

  async getMonthlyUsage(userId, month) {
    const allUsage = await this.db.getAll('usage');
    return allUsage.filter(u => 
      u.userId === userId && 
      u.timestamp.startsWith(month) &&
      u.type === 'scan'
    );
  }

  async getUserSubscription(userId) {
    const subscription = await this.db.get('subscriptions', userId);
    
    if (!subscription) {
      // Create free subscription
      const newSubscription = {
        userId,
        plan: 'free',
        startDate: new Date().toISOString(),
        status: 'active'
      };
      await this.db.put('subscriptions', newSubscription);
      return newSubscription;
    }

    return subscription;
  }

  async updateSubscription(userId, plan, paymentInfo = {}) {
    const validPlans = Object.keys(this.plans);
    if (!validPlans.includes(plan)) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const subscription = {
      userId,
      plan,
      startDate: new Date().toISOString(),
      status: 'active',
      payment: {
        ...paymentInfo,
        amount: this.plans[plan].price,
        currency: 'USD',
        interval: 'monthly'
      }
    };

    await this.db.put('subscriptions', subscription);
    
    // Log subscription change
    await this.trackEvent(userId, 'subscription_changed', { 
      oldPlan: (await this.getUserSubscription(userId)).plan,
      newPlan: plan 
    });

    return subscription;
  }

  async getUsageStats(userId, period = 'month') {
    const usage = await this.db.getAll('usage');
    const userUsage = usage.filter(u => u.userId === userId);
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const periodUsage = userUsage.filter(u => 
      new Date(u.timestamp) >= startDate
    );

    const stats = {
      period,
      totalScans: periodUsage.filter(u => u.type === 'scan').length,
      totalVulnerabilities: periodUsage.reduce((sum, u) => 
        sum + (u.details?.vulnerabilityCount || 0), 0
      ),
      averageVulnerabilitiesPerScan: 0,
      mostScannedProjectType: this.getMostFrequent(
        periodUsage.map(u => u.details?.projectType).filter(Boolean)
      )
    };

    if (stats.totalScans > 0) {
      stats.averageVulnerabilitiesPerScan = 
        Math.round(stats.totalVulnerabilities / stats.totalScans * 10) / 10;
    }

    return stats;
  }

  async generateInvoice(userId, month) {
    const subscription = await this.getUserSubscription(userId);
    const usage = await this.getMonthlyUsage(userId, month);
    const plan = this.plans[subscription.plan];

    const invoice = {
      invoiceId: `INV-${userId}-${month}`,
      userId,
      month,
      plan: subscription.plan,
      items: [
        {
          description: `${plan.name} Plan - Monthly Subscription`,
          quantity: 1,
          unitPrice: plan.price,
          total: plan.price
        }
    ],
      usage: {
        scansUsed: usage.length,
        scansIncluded: plan.scansPerMonth === -1 ? 'Unlimited' : plan.scansPerMonth
      },
      subtotal: plan.price,
      tax: 0, // Calculate based on location
      total: plan.price,
      status: 'paid',
      generatedAt: new Date().toISOString()
    };

    // Add overage charges for pay-per-scan if implemented
    const overage = usage.length - (plan.scansPerMonth || 0);
    if (overage > 0 && plan.overageRate) {
      invoice.items.push({
        description: `Additional scans (${overage} @ $${plan.overageRate}/scan)`,
        quantity: overage,
        unitPrice: plan.overageRate,
        total: overage * plan.overageRate
      });
      invoice.subtotal += overage * plan.overageRate;
      invoice.total = invoice.subtotal + invoice.tax;
    }

    return invoice;
  }

  async trackEvent(userId, eventType, details = {}) {
    const event = {
      id: `${userId}_${Date.now()}_${eventType}`,
      userId,
      timestamp: new Date().toISOString(),
      type: eventType,
      details
    };

    await this.db.put('usage', event);
    return event;
  }

  getNextPlan(currentPlan) {
    const planOrder = ['free', 'startup', 'growth', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan);
    
    if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
      return this.plans.enterprise;
    }

    const nextPlanKey = planOrder[currentIndex + 1];
    return { name: this.plans[nextPlanKey].name, key: nextPlanKey };
  }

  getMostFrequent(arr) {
    if (!arr.length) return null;
    
    const counts = {};
    let maxCount = 0;
    let mostFrequent = null;

    for (const item of arr) {
      counts[item] = (counts[item] || 0) + 1;
      if (counts[item] > maxCount) {
        maxCount = counts[item];
        mostFrequent = item;
      }
    }

    return mostFrequent;
  }

  // API Key Management
  async generateApiKey(userId) {
    const subscription = await this.getUserSubscription(userId);
    
    // Only allow API keys for paid plans
    if (subscription.plan === 'free') {
      throw new Error('API access requires a paid plan. Upgrade to Startup or higher.');
    }

    const apiKey = this.generateSecureToken();
    const keyData = {
      userId,
      apiKey,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      status: 'active'
    };

    await this.db.put('apiKeys', keyData);
    return apiKey;
  }

  generateSecureToken() {
    // In production, use crypto.randomBytes or similar
    return 'gaia_' + Math.random().toString(36).substring(2) + 
           Date.now().toString(36);
  }

  async validateApiKey(apiKey) {
    const keyData = await this.db.get('apiKeys', apiKey);
    
    if (!keyData || keyData.status !== 'active') {
      return { valid: false };
    }

    // Update last used
    keyData.lastUsed = new Date().toISOString();
    await this.db.put('apiKeys', keyData);

    // Check user's subscription
    const subscription = await this.getUserSubscription(keyData.userId);
    
    return {
      valid: true,
      userId: keyData.userId,
      plan: subscription.plan,
      rateLimit: this.getRateLimit(subscription.plan)
    };
  }

  getRateLimit(plan) {
    const limits = {
      free: 10,      // 10 requests per hour
      startup: 100,  // 100 requests per hour
      growth: 500,   // 500 requests per hour
      enterprise: -1 // Unlimited
    };
    
    return limits[plan] || limits.free;
  }
}

export default UsageTracker;