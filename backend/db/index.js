const { FirestoreModel, getFirestoreDb } = require('./firestoreDb');
const JsonModel = require('./jsonDb');

// Check if Firestore is active, otherwise fallback to local JSON
const useFirestore = Boolean(getFirestoreDb());

let ModelClass = JsonModel;
if (useFirestore) {
  console.log('📦 Database initialized in Cloud Firebase Firestore Mode.');
  ModelClass = FirestoreModel;
} else {
  console.log('📁 Database initialized in Local JSON File Mode (CWD: data/).');
  ModelClass = JsonModel;
}

module.exports = {
  User: new ModelClass('users'),
  Student: new ModelClass('students'),
  FeeStructure: new ModelClass('feeStructures'),
  Payment: new ModelClass('payments'),
  Receipt: new ModelClass('receipts'),
  Deadline: new ModelClass('deadlines'),
  AuditLog: new ModelClass('auditLogs')
};
