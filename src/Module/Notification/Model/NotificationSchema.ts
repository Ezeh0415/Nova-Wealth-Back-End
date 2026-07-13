import mongoose, { Schema, Document, model, Model } from "mongoose";

// ==================== ENUMS ====================
export enum NotificationType {
    REFERRAL = "referral",
    TRANSACTION = "transaction",
    SUCCESS = "success",
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    INVESTMENT = "investment",
    WITHDRAWAL_REQUEST = "withdrawal_request",
    BONUS = "bonus",
    SYSTEM = "system",
    SECURITY = "security",
    PROMOTION = "promotion",
    ACCOUNT = "account",
    SIGNUP = "signup",
    KYC = "kyc"
}

export enum NotificationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}

// ==================== INTERFACES ====================
export interface INotification extends Document {
    user: string | mongoose.Types.ObjectId;
    transactionId: string | mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, any>;
    isRead: boolean;
    priority: NotificationPriority;
    category: NotificationType;
    actionUrl?: string | null;
    icon: string;
    path: string;
    expiresAt: Date;
    createdAt: Date;
    readAt?: Date | null;
    updatedAt: Date;
}

// ==================== SCHEMA ====================
const NotificationSchema = new Schema<INotification>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        transactionId: {
            type: Schema.Types.ObjectId,
            index: true,
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        data: {
            type: Schema.Types.Mixed,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        priority: {
            type: String,
            enum: Object.values(NotificationPriority),
            default: NotificationPriority.MEDIUM,
        },
        category: {
            type: String,
            enum: Object.values(NotificationType),
            default: NotificationType.SYSTEM,
        },
        actionUrl: {
            type: String,
            default: null,
        },
        icon: {
            type: String,
            default: "bell",
        },
        path: {
            type: String,
            default: "",
        },
        expiresAt: {
            type: Date,
            default: function () {
                return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            },
            index: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ==================== INDEXES ====================

// Single field indexes
NotificationSchema.index({ user: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ createdAt: -1 });

// Compound indexes for common queries
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, priority: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1, type: 1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, expiresAt: 1 });

// ==================== VIRTUALS ====================

NotificationSchema.virtual('timeAgo').get(function (this: INotification) {
    const diff = Date.now() - this.createdAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return this.createdAt.toLocaleDateString();
});

NotificationSchema.virtual('isUrgent').get(function (this: INotification) {
    return this.priority === NotificationPriority.HIGH ||
        this.priority === NotificationPriority.URGENT;
});

NotificationSchema.virtual('isExpired').get(function (this: INotification) {
    return new Date() > this.expiresAt;
});

NotificationSchema.virtual('typeLabel').get(function (this: INotification) {
    const labels: Record<NotificationType, string> = {
        [NotificationType.REFERRAL]: 'Referral',
        [NotificationType.TRANSACTION]: 'Transaction',
        [NotificationType.SUCCESS]: 'Success',
        [NotificationType.DEPOSIT]: 'Deposit',
        [NotificationType.WITHDRAWAL]: 'Withdrawal',
        [NotificationType.INVESTMENT]: 'Investment',
        [NotificationType.WITHDRAWAL_REQUEST]: 'Withdrawal Request',
        [NotificationType.BONUS]: 'Bonus',
        [NotificationType.SYSTEM]: 'System',
        [NotificationType.SECURITY]: 'Security',
        [NotificationType.PROMOTION]: 'Promotion',
        [NotificationType.ACCOUNT]: 'Account',
        [NotificationType.SIGNUP]: 'Signup',
        [NotificationType.KYC]: 'KYC',
    };
    return labels[this.type] || this.type;
});

// ==================== METHODS ====================

NotificationSchema.methods.markAsRead = async function (this: INotification): Promise<INotification> {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
    return this;
};

NotificationSchema.methods.markAsUnread = async function (this: INotification): Promise<INotification> {
    this.isRead = false;
    this.readAt = null;
    await this.save();
    return this;
};

NotificationSchema.methods.extendExpiry = async function (this: INotification, days: number = 30): Promise<INotification> {
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.save();
    return this;
};

// ==================== STATICS ====================

interface INotificationModel extends Model<INotification> {
    findByUser(userId: string, options?: { limit?: number; offset?: number }): Promise<INotification[]>;
    findUnreadByUser(userId: string, options?: { limit?: number }): Promise<INotification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAllAsRead(userId: string): Promise<any>;
    createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        data?: Record<string, any>,
        options?: { priority?: NotificationPriority; icon?: string; actionUrl?: string }
    ): Promise<INotification>;
    deleteExpired(): Promise<any>;
    getNotificationStats(userId: string): Promise<{
        total: number;
        unread: number;
        read: number;
        byType: Record<NotificationType, number>;
        byPriority: Record<NotificationPriority, number>;
    }>;
}

NotificationSchema.statics.findByUser = async function (
    userId: string,
    options: { limit?: number; offset?: number } = {}
): Promise<INotification[]> {
    const { limit = 50, offset = 0 } = options;
    return this.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
};

NotificationSchema.statics.findUnreadByUser = async function (
    userId: string,
    options: { limit?: number } = {}
): Promise<INotification[]> {
    const { limit = 50 } = options;
    return this.find({ user: userId, isRead: false })
        .sort({ createdAt: -1 })
        .limit(limit);
};

NotificationSchema.statics.getUnreadCount = async function (userId: string): Promise<number> {
    return this.countDocuments({ user: userId, isRead: false });
};

NotificationSchema.statics.markAllAsRead = async function (userId: string) {
    return this.updateMany(
        { user: userId, isRead: false },
        {
            $set: {
                isRead: true,
                readAt: new Date()
            }
        }
    );
};

NotificationSchema.statics.createNotification = async function (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {},
    options: {
        priority?: NotificationPriority;
        icon?: string;
        actionUrl?: string;
        category?: NotificationType;
    } = {}
): Promise<INotification> {
    const notification = new this({
        user: userId,
        type,
        title,
        message,
        data,
        category: options.category || type,
        priority: options.priority || NotificationPriority.MEDIUM,
        icon: options.icon || "bell",
        actionUrl: options.actionUrl || null,
    });

    return notification.save();
};

NotificationSchema.statics.deleteExpired = async function () {
    return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

NotificationSchema.statics.getNotificationStats = async function (userId: string) {
    const stats = await this.aggregate([
        {
            $match: { user: new mongoose.Types.ObjectId(userId) }
        },
        {
            $facet: {
                total: [{ $count: "count" }],
                unread: [
                    { $match: { isRead: false } },
                    { $count: "count" }
                ],
                read: [
                    { $match: { isRead: true } },
                    { $count: "count" }
                ],
                byType: [
                    {
                        $group: {
                            _id: "$type",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            types: {
                                $push: {
                                    k: "$_id",
                                    v: "$count"
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            types: { $arrayToObject: "$types" }
                        }
                    }
                ],
                byPriority: [
                    {
                        $group: {
                            _id: "$priority",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            priorities: {
                                $push: {
                                    k: "$_id",
                                    v: "$count"
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            priorities: { $arrayToObject: "$priorities" }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
                unread: { $ifNull: [{ $arrayElemAt: ["$unread.count", 0] }, 0] },
                read: { $ifNull: [{ $arrayElemAt: ["$read.count", 0] }, 0] },
                byType: { $ifNull: [{ $arrayElemAt: ["$byType.types", 0] }, {}] },
                byPriority: { $ifNull: [{ $arrayElemAt: ["$byPriority.priorities", 0] }, {}] }
            }
        }
    ]);

    const result = stats[0] || {
        total: 0,
        unread: 0,
        read: 0,
        byType: {},
        byPriority: {}
    };

    // Ensure all enum values are present in byType
    const allTypes = Object.values(NotificationType);
    allTypes.forEach(type => {
        if (!result.byType[type]) {
            result.byType[type] = 0;
        }
    });

    // Ensure all enum values are present in byPriority
    const allPriorities = Object.values(NotificationPriority);
    allPriorities.forEach(priority => {
        if (!result.byPriority[priority]) {
            result.byPriority[priority] = 0;
        }
    });

    return result;
};


// ==================== MODEL ====================

export const NotificationModel = model<INotification, INotificationModel>("Notification", NotificationSchema);