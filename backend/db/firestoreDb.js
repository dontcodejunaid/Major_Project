const admin = require('firebase-admin');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
let db = null;

try {
  let serviceAccount = null;
  const keyPath = path.join(__dirname, '../serviceAccountKey.json');

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (fs.existsSync(keyPath)) {
    serviceAccount = require(keyPath);
  }

  if (serviceAccount) {
    const apps = getApps();
    let app;
    if (apps.length === 0) {
      app = initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      app = apps[0];
    }
    db = getFirestore(app);
    console.log(`🔥 Firebase Firestore initialized successfully for project: ${serviceAccount.project_id}`);
  } else {
    console.warn('⚠️ No Firebase service account credentials found. Falling back to local mode if configured.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Firestore:', error);
}

class FirestoreModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  get collection() {
    if (!db) {
      throw new Error('Firestore is not initialized. Check serviceAccountKey.json');
    }
    return db.collection(this.collectionName);
  }

  async find(query = {}) {
    const snapshot = await this.collection.get();
    const results = [];
    snapshot.forEach(doc => {
      results.push({ _id: doc.id, ...doc.data() });
    });

    if (!query || Object.keys(query).length === 0) {
      return results;
    }

    return results.filter(item => {
      for (const key in query) {
        if (query[key] === undefined) continue;

        // Support OR conditions: { $or: [{ usn: /xxx/ }, { name: /xxx/ }] }
        if (key === '$or' && Array.isArray(query.$or)) {
          const matchedOr = query.$or.some(subQuery => {
            return Object.keys(subQuery).every(subKey => {
              const val = item[subKey] || '';
              const target = subQuery[subKey];
              if (target instanceof RegExp) {
                return target.test(val);
              }
              if (typeof target === 'object' && target !== null && target.$regex) {
                const regex = new RegExp(target.$regex, target.$options || 'i');
                return regex.test(val);
              }
              return val === target;
            });
          });
          if (!matchedOr) return false;
          continue;
        }

        const val = item[key];
        const target = query[key];

        if (target instanceof RegExp) {
          if (!target.test(val || '')) return false;
        } else if (typeof target === 'object' && target !== null) {
          if (target.$regex) {
            const regex = new RegExp(target.$regex, target.$options || 'i');
            if (!regex.test(val || '')) return false;
          }
          if (target.$ne !== undefined) {
            if (val === target.$ne) return false;
          }
          if (target.$in !== undefined && Array.isArray(target.$in)) {
            if (!target.$in.includes(val)) return false;
          }
          if (target.$gte !== undefined) {
            if (!(val >= target.$gte)) return false;
          }
          if (target.$lte !== undefined) {
            if (!(val <= target.$lte)) return false;
          }
        } else {
          if (val !== target) return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const list = await this.find(query);
    return list.length > 0 ? list[0] : null;
  }

  async findById(id) {
    if (!id) return null;
    const docRef = this.collection.doc(String(id));
    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }
    return { _id: doc.id, ...doc.data() };
  }

  async create(data) {
    const now = new Date().toISOString();
    const docData = {
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };

    let docRef;
    if (data._id) {
      const customId = String(data._id);
      delete docData._id;
      docRef = this.collection.doc(customId);
      await docRef.set(docData);
      return { _id: customId, ...docData };
    } else {
      docRef = await this.collection.add(docData);
      return { _id: docRef.id, ...docData };
    }
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    if (!id) return null;
    const docRef = this.collection.doc(String(id));
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const existing = doc.data();
    const merged = {
      ...existing,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    delete merged._id;

    await docRef.set(merged, { merge: true });
    return { _id: String(id), ...merged };
  }

  async findByIdAndDelete(id) {
    if (!id) return null;
    const docRef = this.collection.doc(String(id));
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const existing = { _id: doc.id, ...doc.data() };
    await docRef.delete();
    return existing;
  }

  async deleteMany(query = {}) {
    const docs = await this.find(query);
    const batch = db.batch();
    for (const doc of docs) {
      batch.delete(this.collection.doc(doc._id));
    }
    await batch.commit();
    return { deletedCount: docs.length };
  }

  async countDocuments(query = {}) {
    const list = await this.find(query);
    return list.length;
  }
}

module.exports = { FirestoreModel, admin, getFirestoreDb: () => db };
