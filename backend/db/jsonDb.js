const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonModel {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
  }

  _read() {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch (e) {
      console.error(`Error reading database file: ${this.filePath}`, e);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error(`Error writing database file: ${this.filePath}`, e);
    }
  }

  async find(query = {}) {
    const data = this._read();
    return data.filter(item => {
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

        // Standard comparison
        const val = item[key];
        const target = query[key];

        if (target instanceof RegExp) {
          if (!target.test(val || '')) return false;
        } else if (typeof target === 'object' && target !== null) {
          if (target.$regex) {
            const regex = new RegExp(target.$regex, target.$options || 'i');
            if (!regex.test(val || '')) return false;
          }
          if (target.$in && Array.isArray(target.$in)) {
            if (!target.$in.includes(val)) return false;
          }
        } else {
          if (val !== target) return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items[0] || null;
  }

  async findById(id) {
    const data = this._read();
    return data.find(item => item._id === id) || null;
  }

  async create(doc) {
    const data = this._read();
    const newDoc = {
      _id: crypto.randomUUID(),
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newDoc);
    this._write(data);
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const data = this._read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;

    const updatedDoc = {
      ...data[index],
      ...update,
      updatedAt: new Date().toISOString()
    };
    data[index] = updatedDoc;
    this._write(data);
    return updatedDoc;
  }

  async findByIdAndDelete(id) {
    const data = this._read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;

    const deleted = data.splice(index, 1)[0];
    this._write(data);
    return deleted;
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

module.exports = JsonModel;
