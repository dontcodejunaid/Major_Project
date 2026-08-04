const JsonModel = require('./jsonDb');

console.log('Database initialized in Local JSON File Mode (CWD: data/).');

module.exports = {
  User: new JsonModel('users'),
  Student: new JsonModel('students'),
  FeeStructure: new JsonModel('feeStructures'),
  Payment: new JsonModel('payments'),
  Receipt: new JsonModel('receipts'),
  Deadline: new JsonModel('deadlines'),
  AuditLog: new JsonModel('auditLogs')
};
