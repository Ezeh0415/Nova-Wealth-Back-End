const mongoose = require('mongoose');
const InvestmentService = require('./investment');

// lightweight in-memory DB
const db = { users: [], wallets: [], investments: [], transactions: [], adminTransactions: [], notifications: [], plans: [] };
const makeId = () => new mongoose.Types.ObjectId();

// Mock Models
class UserModel { static async findById(id) { const sid = id && id.toString ? id.toString() : String(id); return db.users.find(u => u._id.toString() === sid) || null; } }

class WalletModel {
  static async findOne(query) { const sid = query.userId && query.userId.toString ? query.userId.toString() : String(query.userId); return db.wallets.find(w => w.userId.toString() === sid) || null; }
  static async updateOne(query, update) { const sid = query.userId && query.userId.toString ? query.userId.toString() : String(query.userId); const w = db.wallets.find(w => w.userId.toString() === sid); if (!w) return { matchedCount: 0 }; if (update.$inc) { for (const k of Object.keys(update.$inc)) w[k] = (w[k] || 0) + update.$inc[k]; } return { matchedCount: 1 }; }
}

class InvestmentModel {
  constructor(data) { Object.assign(this, data); this._id = makeId(); }
  async save() { const idx = db.investments.findIndex(i => i._id && i._id.toString() === (this._id && this._id.toString())); if (idx === -1) db.investments.push(this); else db.investments[idx] = this; }
  static async find(query) { if (!query) return db.investments.slice(); return db.investments.filter(i => { for (const k of Object.keys(query)) { if (i[k] && query[k] && i[k].toString && query[k].toString) { if (i[k].toString() !== query[k].toString()) return false; } else if (i[k] !== query[k]) return false; } return true; }); }
  static async findById(id) { const sid = id && id.toString ? id.toString() : String(id); return db.investments.find(i => i._id.toString() === sid) || null; }
}

class TransactionModel {
  constructor(data) { Object.assign(this, data); this._id = makeId(); }
  async save() { db.transactions.push(this); }
  static async create(data) { const t = new TransactionModel(data); db.transactions.push(t); return t; }
  static async find(query) { if (!query) return db.transactions.slice(); return db.transactions.filter(tr => { for (const k of Object.keys(query)) { if (tr[k] && query[k] && tr[k].toString && query[k].toString) { if (tr[k].toString() !== query[k].toString()) return false; } else if (tr[k] !== query[k]) return false; } return true; }); }
  static async updateOne(query, update) { const found = await TransactionModel.find(query); if (!found || found.length === 0) return { matchedCount: 0 }; const t = found[0]; for (const k of Object.keys(update)) t[k] = update[k]; return { matchedCount: 1 }; }
  static async updateMany(query, update) { const found = await TransactionModel.find(query); for (const t of found) { for (const k of Object.keys(update)) t[k] = update[k]; } return { modifiedCount: found.length }; }
}

class AdminTransactionModel { constructor(data) { Object.assign(this, data); this._id = makeId(); } async save() { db.adminTransactions.push(this); } static async create(data) { const a = new AdminTransactionModel(data); db.adminTransactions.push(a); return a; } static async findById(id) { const sid = id && id.toString ? id.toString() : String(id); return db.adminTransactions.find(a => a._id.toString() === sid) || null; } static async updateOne(query, update) { const found = db.adminTransactions.find(a => a.transactionId && query.transactionId && a.transactionId.toString() === query.transactionId.toString()); if (!found) return { matchedCount: 0 }; for (const k of Object.keys(update)) found[k] = update[k]; return { matchedCount: 1 }; } }

class NotificationModel { constructor(data) { Object.assign(this, data); this._id = makeId(); } async save() { db.notifications.push(this); } static async create(data) { const n = new NotificationModel(data); db.notifications.push(n); return n; } }

class InvestmentPlanModel { static async findOne(query) { return db.plans.find(p => p.planId === query.planId && (query.isActive === undefined || p.isActive === query.isActive)) || null; } }

// Seed fixtures
const userId = makeId(); db.users.push({ _id: userId, fullName: 'Alice', userName: 'alice', email: 'alice@example.com' });
db.plans.push({ planId: 'basic', name: 'Basic', roi: 2, duration: 30, minAmount: 10, maxAmount: 10000, isActive: true });
db.wallets.push({ userId, balance: 1000 * 100, pendingInvestment: 0, invBalance: 0, totalReturn: 0, save: async function() { const idx = db.wallets.findIndex(w => w.userId.toString() === userId.toString()); db.wallets[idx] = this; } });
async function run() {
  try {
    const svc = new InvestmentService({
      userModels: UserModel,
      AdminTransactionModel,
      InvestmentModel,
      WalletModel,
      TransactionModel,
      NotificationModel,
      InvestmentPlanModel,
    });

    console.log('\n--- invest() ---');
    const res = await svc.invest(userId.toString(), 100, 'basic');
    console.log('invest ->', res.message);

    const investmentId = res.investment.id;
    console.log('created investment id ->', investmentId.toString());

    console.log('\n--- confirmInvestment() ---');
    const conf = await svc.confirmInvestment(investmentId);
    console.log('confirmInvestment ->', conf.message || 'ok');

    // make investment eligible for ROI by moving lastRoiAt back
    const inv = await InvestmentModel.findById(investmentId);
    inv.lastRoiAt = new Date(Date.now() - 1000 * 60 * 60 * 25);
    inv.investmentStartDate = inv.lastRoiAt;
    inv.investmentStatus = 'active';
    await inv.save();

    console.log('\n--- processDailyROI() ---');
    await svc.processDailyROI();
    console.log('Wallet after ROI:', db.wallets[0]);
    console.log('Transactions count:', db.transactions.length);

    console.log('\n--- completeInvestment() ---');
    const comp = await svc.completeInvestment(investmentId);
    console.log('completeInvestment ->', comp.summary || comp);
    console.log('Wallet after completion:', db.wallets[0]);

    console.log('\n--- Notifications ---');
    console.log(db.notifications.map(n => ({ title: n.title, message: n.message })));

    console.log('\n--- Mock test finished successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Mock test failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();
