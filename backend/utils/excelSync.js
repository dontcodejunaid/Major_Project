const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 28 College Miscellaneous Fee Heads from official Ghousia document
const MISC_FEE_HEADS = [
  'College Admission Regn. Fee',
  'Admission Application Fee',
  'Internal Examination Fee',
  'College Maintenance Fee',
  'ERP Software fee',
  'College Sports Fee',
  'Department Association Fee',
  'Reading Room Fee',
  'Medical Fee',
  'Magazine Fee',
  'Identity Card Fee',
  'Library Fee',
  'College Day Fee',
  'Laboratory Equipment Maintenance Fee',
  'Computer Facilities Fee',
  'Internet Facility Fee',
  'Students Group Insurance Fee',
  'H.R. Fee',
  'Innovation Centre Fee',
  'Hand Book',
  'Bank & University processing fee',
  'Co-operative Society Shares',
  'ISTE Students Chapter Fee',
  'AICTE Activity Fee',
  'Teachers Day Flag',
  'Alumni Association Fee',
  'Course Completion Certificate',
  'Gruaduation Day Fee'
];

// University Fee Heads
const UNIV_FEE_HEADS = [
  'University Registration Fee',
  'Renewal of Registration Fee',
  'Eligibility Fee-(Karnataka Students)',
  'E-Resource Consortium Fee',
  'E-Learning Fee',
  'University Sports fee',
  'University sports development fee',
  'University career guidance',
  'University students / teachers Devt.',
  'University development fund',
  'University cultural activities fee',
  'Red Cross Membership Fee',
  'Women Cell Fee',
  'NSS Fee'
];

// Excel Day Book Path in backend/data/
const DAYBOOK_EXCEL_PATH = path.join(__dirname, '..', 'data', 'DAY_BOOK_2026-27.xlsx');

/**
 * Sync or Append a payment transaction into the official DAY BOOK Excel sheet
 */
const syncDayBookExcel = (payments = [], students = []) => {
  try {
    const studentMap = {};
    students.forEach(s => {
      studentMap[s._id] = s;
    });

    // Structure rows for DAY BOOK
    // Columns match the Ghousia Day Book layout from the accounts computer
    const dataRows = payments.map((p, idx) => {
      const student = studentMap[p.studentId] || {};
      const dateStr = p.date ? p.date.split('T')[0] : '';
      const breakdown = p.breakdown || {};

      const row = {
        'SL': idx + 1,
        'DATE': dateStr,
        'NAME OF THE STUDENTS': `${student.name || 'Unknown'} (${student.quota || ''} ${student.branch || ''})`,
        'REG NO': student.usn || 'N/A',
        'Sem': student.semester || 'N/A',
        'Receipt No': p.receiptNo || `REC-${idx + 1}`,
        'Total Amount': Number(p.amount) || 0,
        'Payment Mode': p.mode || 'Cash',
        'Ref / UTR No': p.referenceNo || 'N/A',
        'Tuition Fee': Number(breakdown['Tuition Fee'] || 0),
        'Total University Fee': Number(breakdown['Total University Fee'] || 0),
        'Total Misc. Fee': Number(breakdown['Total College Misc. Fee'] || 0)
      };

      // Populate each of the 28 Misc heads
      MISC_FEE_HEADS.forEach(head => {
        row[head] = Number(breakdown[head] || 0);
      });

      // Populate University heads
      UNIV_FEE_HEADS.forEach(head => {
        row[head] = Number(breakdown[head] || 0);
      });

      row['Collector Remarks'] = p.remarks || '';
      row['Collected By'] = p.collectedBy || 'Accounts Staff';

      return row;
    });

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Daily Transactions Day Book
    const wsDayBook = XLSX.utils.json_to_sheet(dataRows);
    XLSX.utils.book_append_sheet(wb, wsDayBook, 'DAY BOOK 2026-27');

    // Sheet 2: College Misc 28 Particulars Schedule
    const miscParticulars = MISC_FEE_HEADS.map((name, i) => ({
      'Sl.': i + 1,
      'Particulars of Fee': name,
      'I Year B.E': 0,
      'II Year (D.L.E)': 0,
      'II Year B.E': 0,
      'III Year B.E': 0,
      'IV Year B.E': 0,
      'I Year M.Tech': 0,
      'II Year M.Tech': 0
    }));
    const wsMisc = XLSX.utils.json_to_sheet(miscParticulars);
    XLSX.utils.book_append_sheet(wb, wsMisc, 'College Misc Fee (28 Heads)');

    // Write file to disk
    XLSX.writeFile(wb, DAYBOOK_EXCEL_PATH);
    console.log(`Excel Day Book synced successfully at: ${DAYBOOK_EXCEL_PATH}`);

    return DAYBOOK_EXCEL_PATH;
  } catch (err) {
    console.error('Error generating Day Book Excel:', err);
    return null;
  }
};

module.exports = {
  MISC_FEE_HEADS,
  UNIV_FEE_HEADS,
  DAYBOOK_EXCEL_PATH,
  syncDayBookExcel
};
