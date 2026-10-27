import React, { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  db, FormDropdown, FilterDropdown, COUNTRY_CODES, EDU_CATEGORIES, CLASSES, ISLAMIC_QUALS,
  SCHOOL_TYPES, COLLEGE_TYPES, GENDERS, BLOOD_GROUPS,
  NATIVE_PLACES, MARITAL_STATUS, MEDIUMS
} from './theme';
import { GoverningBodyWidget } from './MemberScreens';

export default function AdminDashboard({ currentUser, activeTab, onNavigate, onLogout, onViewReceipt }) {
  const isCore = currentUser?.is_core_admin;
  const perms = currentUser?.admin_permissions || '[]';
  const hasPerm = (p) => isCore || perms.includes('ALL') || perms.includes(p);

  const [directory, setDirectory] = useState([]);
  const [globalTxns, setGlobalTxns] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const logAdminEvent = async (action, details) => {
    try {
      await setDoc(doc(db, 'system_logs', `LOG_${Date.now()}`), {
        timestamp: new Date().toISOString(),
        admin_name: currentUser.full_name,
        action,
        details
      });
    } catch (e) {}
  };

  // Global Settings States
  const [subAmount, setSubAmount] = useState('100');
  const [primaryUpi, setPrimaryUpi] = useState('');
  const [secondaryUpi, setSecondaryUpi] = useState('');
  const [gpayNumber, setGpayNumber] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [allowPublicReg, setAllowPublicReg] = useState(false);
  const [subStartMonth, setSubStartMonth] = useState('');
  const [sliderImages, setSliderImages] = useState([]);
  const [showSliderModal, setShowSliderModal] = useState(false);

  const [configModal, setConfigModal] = useState(null);
  const [configModalPassword, setConfigModalPassword] = useState('');
  const [masterResetModal, setMasterResetModal] = useState(false);
  const [masterResetPassword, setMasterResetPassword] = useState('');

  // Directory & Detail States
  const [selectedDetailUser, setSelectedDetailUser] = useState(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedActionChoice, setSelectedActionChoice] = useState('');
  const [editFormData, setEditFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModal, setActionModal] = useState(null); // Controls the Action Selection Modal
  const [actionSearchQuery, setActionSearchQuery] = useState('');

  // Finance & Cash Modals
  const [finSearchQuery, setFinSearchQuery] = useState('');
  const [ledgerTab, setLedgerTab] = useState('INCOME');
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('OFFICE USE'); // New split
  const [showDuesModal, setShowDuesModal] = useState(false);
  const [showCumulativeModal, setShowCumulativeModal] = useState(false);

  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [campCashModalVisible, setCampCashModalVisible] = useState(false);
  const [cashUser, setCashUser] = useState(null);
  const [cashType, setCashType] = useState('SUBSCRIPTION');
  const [cashMonths, setCashMonths] = useState('1');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [cashCampId, setCashCampId] = useState('');

  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const [donationDonorType, setDonationDonorType] = useState('GUEST'); // 'GUEST' or 'MEMBER'
  const [selectedDonorMemberId, setSelectedDonorMemberId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Campaign & Mandatory Status Remarks Modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campTarget, setCampTarget] = useState('');
  const [campStatus, setCampStatus] = useState('ACTIVE');
  const [viewCampDonors, setViewCampDonors] = useState(null);
  const [viewClosedCamp, setViewClosedCamp] = useState(null);
  const [viewMemberContrib, setViewMemberContrib] = useState(null);

  const [statusRemarkModal, setStatusRemarkModal] = useState(null); // { camp, targetStatus }
  const [statusRemarkText, setStatusRemarkText] = useState('');

  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState({ MANAGE_USERS: false, MANAGE_FINANCE: false, MANAGE_CAMPAIGNS: false, REPORTS_CENTRAL: false });

  // Reports Filters
  const [repType, setRepType] = useState('DIRECTORY');
  const [repRole, setRepRole] = useState('');
  const [repStatus, setRepStatus] = useState('');
  const [repBlood, setRepBlood] = useState('');
  const [repGender, setRepGender] = useState('');
  const [repNative, setRepNative] = useState('');
  const [repEdu, setRepEdu] = useState('');
  const [repMarital, setRepMarital] = useState('');
  const [repFinType, setRepFinType] = useState('');
  const [repStartDate, setRepStartDate] = useState('');
  const [repEndDate, setRepEndDate] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const membersSnap = await getDocs(collection(db, 'members'));
      setDirectory(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const txnsSnap = await getDocs(collection(db, 'transactions'));
      setGlobalTxns(txnsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      if (settingsDoc.exists()) {
        const d = settingsDoc.data();
        setSubAmount(d.monthly_subscription_amount || '100');
        setPrimaryUpi(d.primary_upi || '');
        setSecondaryUpi(d.secondary_upi || '');
        setGpayNumber(d.gpay_phonepe_number || '');
        setInitialAmount(d.initial_amount || '0');
        setAllowPublicReg(d.allow_public_registration || false);
        setSubStartMonth(d.subscription_start_month || '');
        setSliderImages(d.slider_images || []);
      }

      const campSnap = await getDocs(collection(db, 'campaigns'));
      setCampaigns(campSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const logsSnap = await getDocs(collection(db, 'system_logs'));
      setSystemLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedDetailUser(null);
    setViewCampDonors(null);
    setViewClosedCamp(null);
    fetchData();
  }, [activeTab]);

  // EXECUTING ACTIONS FROM THE ACTIONS PAGE & MODALS
  const executeAdminAction = async (u, actionType) => {
    const uid = u.official_id;
    try {
      if (actionType === 'START_SUB') {
        await updateDoc(doc(db, 'members', uid), { subscription_started: true, subscription_start_date: new Date().toISOString() });
        logAdminEvent('Started Subscription', uid);
        alert(`Success: Subscription started for ${u.full_name}!`);
      } else if (actionType === 'RESET') {
        await updateDoc(doc(db, 'members', uid), { password: 'Hiywa@123' });
        logAdminEvent('Reset Password', uid);
        alert(`Success: Password reset to Hiywa@123 for ${u.full_name}`);
      } else if (actionType === 'DEACTIVATE' || actionType === 'ACTIVATE') {
        const nextStatus = actionType === 'ACTIVATE' ? 'ACTIVE' : 'INACTIVE';
        await updateDoc(doc(db, 'members', uid), { membership_status: nextStatus });
        logAdminEvent(`Status ${nextStatus}`, uid);
        alert(`Success: ${u.full_name} status updated to ${nextStatus}`);
      } else if (actionType === 'DECEASED') {
        await updateDoc(doc(db, 'members', uid), { membership_status: 'DECEASED' });
        logAdminEvent('Marked Deceased', uid);
        alert(`Success: ${u.full_name} marked as Deceased.`);
      } else if (actionType === 'UPGRADE') {
        await updateDoc(doc(db, 'members', uid), { role: 'MEMBER' });
        logAdminEvent('Upgraded Student', uid);
        alert(`Success: ${u.full_name} upgraded from Student to Member!`);
      }
      fetchData();
    } catch (e) { alert('Action failed: ' + e.message); }
  };

  // Financial & Dues Computations
  const allIncomes = globalTxns.filter(t => t.donation_type !== 'EXPENSE');
  const allExpenses = globalTxns.filter(t => t.donation_type === 'EXPENSE');
  const totalIncomeVal = allIncomes.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpenseVal = allExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const currentBalance = Number(initialAmount || 0) + totalIncomeVal - totalExpenseVal;

  const isFutureStart = subStartMonth && new Date(`${subStartMonth}-01`) > new Date();
  const isSubsDisabled = !subStartMonth || isFutureStart;

  const pendingDuesList = isSubsDisabled ? [] : directory
    .filter(u => !u.is_core_admin && (u.role === 'MEMBER' || u.role === 'ADMIN') && u.membership_status === 'ACTIVE')
    .map(u => {
      const joinDate = u.join_date ? new Date(u.join_date) : new Date();
      let startDate = joinDate;
      if (subStartMonth) {
        const systemStart = new Date(`${subStartMonth}-01`);
        if (systemStart > joinDate) startDate = systemStart;
      }
      const rawMonths = ((new Date().getFullYear() - startDate.getFullYear()) * 12) + (new Date().getMonth() - startDate.getMonth()) + 1;
      const dues = Math.max(0, Math.max(0, rawMonths) - (parseInt(u.total_months_paid) || 0));
      return { ...u, duesMonths: dues, duesAmount: dues * Number(subAmount || 0) };
    })
    .filter(u => u.duesMonths > 0)
    .sort((a, b) => b.duesMonths - a.duesMonths);

  const totalPendingDuesVal = pendingDuesList.reduce((s, u) => s + u.duesAmount, 0);

  // Filtered Lists
  const filteredDirectory = directory
    .filter(u => activeTab === 'STUDENTS' ? u.role === 'STUDENT' : (u.role === 'MEMBER' || u.role === 'ADMIN'))
    .filter(u => !searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.official_id?.toLowerCase().includes(searchQuery.toLowerCase()));

  const searchQ = finSearchQuery.toLowerCase();
  const searchFilter = (t) => !finSearchQuery || t.full_name?.toLowerCase().includes(searchQ) || String(t.transaction_id || '').toLowerCase().includes(searchQ) || t.reason?.toLowerCase().includes(searchQ);
  const filteredIncomes = allIncomes.filter(searchFilter).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  const filteredExpensesList = allExpenses.filter(searchFilter).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

  const filteredRepDir = directory
    .filter(u => !repRole || u.role === repRole)
    .filter(u => !repStatus || u.membership_status === repStatus)
    .filter(u => !repBlood || u.blood_group === repBlood)
    .filter(u => !repGender || u.gender === repGender)
    .filter(u => !repNative || u.native_place === repNative)
    .filter(u => !repEdu || u.educational_qualification === repEdu)
    .filter(u => !repMarital || u.marital_status === repMarital);

  const filteredRepFin = globalTxns
    .filter(t => !repFinType || t.donation_type === repFinType || (repFinType === 'FUND_RAISING' && t.donation_type === 'CAMPAIGN'))
    .filter(t => !repStartDate || new Date(t.transaction_date) >= new Date(repStartDate))
    .filter(t => { if (!repEndDate) return true; const end = new Date(repEndDate); end.setHours(23, 59, 59, 999); return new Date(t.transaction_date) <= end; })
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

  const downloadCSV = (csvString, filename) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // COMPLETE ALL-FIELDS EXCEL/CSV EXPORT
  const cleanCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const exportDirectory = () => {
    const headers = [
      "Official ID", "Full Name", "Father Name", "Mother Name", "Parents Status",
      "Role", "Membership Status", "Gender", "DOB", "Blood Group", "Marital Status",
      "Aadhaar Number", "Country Code", "Primary Mobile", "WhatsApp Number", "Student Mobile",
      "Email", "Native Place", "Current City", "Permanent Address",
      "Education Category", "Course / Specialization", "Occupation",
      "Class / Grade", "Institution Name", "Institution Type", "Institution Location", "Medium",
      "Islamic Studies", "Islamic Qualification", "Madrasa Name", "Madrasa Location",
      "Total Months Paid", "Join Date"
    ].join(",") + "\n";

    const rows = filteredRepDir.map(u => [
      u.official_id, u.full_name, u.father_name, u.mother_name, u.parents_status,
      u.role, u.membership_status, u.gender, u.dob, u.blood_group, u.marital_status,
      u.aadhaar_number, u.country_code || '+91', u.phone_number, u.whatsapp_number, u.student_mobile,
      u.email, u.native_place, u.current_location, u.address,
      u.educational_qualification, u.course_details, u.occupation,
      u.class_grade, u.school_name, u.school_type, u.school_location, u.medium_of_instruction,
      u.islamic_studies, u.islamic_qualification, u.madrasa_name, u.madrasa_location,
      u.total_months_paid || 0, u.join_date ? new Date(u.join_date).toLocaleDateString('en-GB') : ''
    ].map(cleanCSV).join(",")).join("\n");

    downloadCSV(headers + rows, "HIYWA_Complete_Directory_Report.csv");
  };

  const exportFinance = () => {
    const headers = [
      "Transaction ID", "Date", "Member ID", "Full Name", "Role",
      "Transaction Type", "Particulars / Reason", "Months Count",
      "Campaign ID", "Payment Mode", "Amount (INR)"
    ].join(",") + "\n";

    const rows = filteredRepFin.map(t => [
      t.transaction_id, new Date(t.transaction_date).toLocaleString('en-GB'),
      t.member_id || t.official_id, t.full_name, t.role || '',
      t.donation_type, t.reason, t.months_count || 0,
      t.campaign_id || '', t.payment_method, t.amount
    ].map(cleanCSV).join(",")).join("\n");

    downloadCSV(headers + rows, "HIYWA_Complete_Finance_Report.csv");
  };

  // MASTER DATABASE WIPE HANDLER
  const handleMasterDatabaseReset = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!masterResetPassword) return alert('Please enter your admin password.');
    setIsSubmitting(true);
    try {
      const adminSnap = await getDoc(doc(db, 'members', currentUser.official_id));
      if (!adminSnap.exists() || adminSnap.data().password !== masterResetPassword) {
        setIsSubmitting(false);
        return alert('Incorrect admin password! Wipe aborted.');
      }

      const membersSnap = await getDocs(collection(db, 'members'));
      let deletedMembers = 0;
      for (const dSnap of membersSnap.docs) {
        if (dSnap.data().is_core_admin === true) {
          await updateDoc(doc(db, 'members', dSnap.id), { total_months_paid: 0 });
          continue;
        }
        await deleteDoc(doc(db, 'members', dSnap.id));
        deletedMembers++;
      }

      const txnsSnap = await getDocs(collection(db, 'transactions'));
      let deletedTxns = 0;
      for (const dSnap of txnsSnap.docs) {
        await deleteDoc(doc(db, 'transactions', dSnap.id));
        deletedTxns++;
      }

      const campsSnap = await getDocs(collection(db, 'campaigns'));
      let deletedCamps = 0;
      for (const dSnap of campsSnap.docs) {
        await deleteDoc(doc(db, 'campaigns', dSnap.id));
        deletedCamps++;
      }

      const logsSnap = await getDocs(collection(db, 'system_logs'));
      for (const dSnap of logsSnap.docs) {
        await deleteDoc(doc(db, 'system_logs', dSnap.id));
      }

      setMasterResetModal(false);
      setMasterResetPassword('');
      alert(`Wipe Complete!\n• Deleted Members/Students: ${deletedMembers}\n• Deleted Transactions: ${deletedTxns}\n• Deleted Campaigns: ${deletedCamps}`);
      fetchData();
    } catch (err) {
      alert('Wipe failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitExpenseLog = async () => {
    if (!expenseAmount || Number(expenseAmount) <= 0 || !expenseReason) return alert('Enter valid amount and reason.');
    const txnId = `EXP_${Date.now()}`;
    const payload = { 
      transaction_date: new Date().toISOString(), 
      transaction_id: txnId, 
      member_id: currentUser.official_id, 
      full_name: currentUser.full_name, 
      amount: expenseAmount, 
      payment_method: 'CASH/BANK', 
      donation_type: 'EXPENSE', 
      expense_category: expenseCategory, // Adds Office Use / Charity
      reason: expenseReason.toUpperCase() 
    };
    await setDoc(doc(db, 'transactions', txnId), payload);
    logAdminEvent('Logged Expense', `₹${expenseAmount} for ${expenseReason.toUpperCase()} (${expenseCategory})`);
    alert('Expense logged!');
    setExpenseModalVisible(false); setExpenseAmount(''); setExpenseReason(''); setExpenseCategory('OFFICE USE'); fetchData();
  };

  const submitGuestCash = async () => {
    if (!cashAmount || Number(cashAmount) <= 0) return alert('Please enter a valid amount.');
    if (!cashReason.trim()) return alert('Please enter a reason / purpose.');

    let txnId = '';
    let payload = {};
    let receiptOfficialId = 'GUEST';

    if (donationDonorType === 'MEMBER') {
      if (!selectedDonorMemberId) return alert('Please select a member.');
      const mem = directory.find(m => m.official_id === selectedDonorMemberId);
      if (!mem) return alert('Selected member not found.');

      txnId = `CASH_${Date.now()}`;
      receiptOfficialId = mem.official_id;
      payload = {
        transaction_date: new Date().toISOString(),
        transaction_id: txnId,
        member_id: mem.official_id,
        full_name: mem.full_name,
        role: mem.role,
        amount: cashAmount,
        payment_method: 'CASH (OFFLINE)',
        donation_type: 'GENERAL',
        reason: cashReason.trim().toUpperCase(),
        months_count: 0
      };
      await setDoc(doc(db, 'transactions', txnId), payload);
      logAdminEvent('Logged Member Donation', `₹${cashAmount} from ${mem.full_name} (${mem.official_id})`);
    } else {
      if (!guestName.trim()) return alert('Guest full name is required.');
      txnId = `GUEST_${Date.now()}`;
      receiptOfficialId = 'GUEST';
      payload = {
        transaction_date: new Date().toISOString(),
        transaction_id: txnId,
        member_id: 'GUEST',
        full_name: `${guestName.trim().toUpperCase()} (GUEST)`,
        phone: guestPhone,
        amount: cashAmount,
        payment_method: 'CASH (OFFLINE)',
        donation_type: 'GENERAL',
        reason: cashReason.trim().toUpperCase()
      };
      await setDoc(doc(db, 'transactions', txnId), payload);
      logAdminEvent('Logged Guest Donation', `₹${cashAmount} from ${guestName.trim().toUpperCase()}`);
    }

    setGuestModalVisible(false);
    setGuestName('');
    setGuestPhone('');
    setSelectedDonorMemberId('');
    setCashAmount('');
    setCashReason('');
    fetchData();
    onViewReceipt({ ...payload, official_id: receiptOfficialId });
  };

  const submitCashPayment = async () => {
    if (!cashAmount || Number(cashAmount) <= 0) return alert('Enter valid amount.');
    if (cashType === 'SUBSCRIPTION' && isSubsDisabled) return alert('Subscriptions not yet active.');
    const txnId = `CASH_${Date.now()}`;
    let payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: cashUser.official_id, full_name: cashUser.full_name, role: cashUser.role, amount: cashAmount, payment_method: 'CASH (OFFLINE)' };
    if (cashType === 'SUBSCRIPTION') { payload.donation_type = 'SUBSCRIPTION'; payload.months_count = cashMonths; payload.reason = 'OFFLINE CASH SUBSCRIPTION'; }
    else if (cashType === 'GENERAL') { payload.donation_type = 'GENERAL'; payload.reason = cashReason.toUpperCase() || 'GENERAL'; }
    else {
      const cName = campaigns.find(c => c.campaign_id === cashCampId)?.title || 'Campaign';
      payload.campaign_id = cashCampId; payload.donation_type = 'FUND_RAISING'; payload.reason = `Cash Support: ${cName}`;
    }
    await setDoc(doc(db, 'transactions', txnId), payload);
    if (cashType === 'SUBSCRIPTION') {
      const newTotal = (parseInt(cashUser.total_months_paid) || 0) + parseInt(cashMonths || 1);
      await updateDoc(doc(db, 'members', cashUser.official_id), { total_months_paid: newTotal });
    }
    if (cashType === 'CAMPAIGN') {
      const cRef = doc(db, 'campaigns', cashCampId);
      const cSnap = await getDoc(cRef);
      const newRaised = (parseFloat(cSnap.data().raised_amount) || 0) + parseFloat(cashAmount);
      const target = parseFloat(cSnap.data().target_amount) || 1;
      let up = { raised_amount: newRaised };
      if (newRaised >= target) { up.status = 'STOPPED'; up.remarks = 'Goal Achieved'; }
      await updateDoc(cRef, up);
    }
    logAdminEvent('Logged Member Cash', `₹${cashAmount} for ${cashUser.official_id}`);
    setCashModalVisible(false); fetchData();
    onViewReceipt({ ...payload, official_id: cashUser.official_id });
  };

  const submitCampaignCash = async () => {
    if (!cashCampId) return alert('No campaign selected.');
    if (!selectedDonorMemberId) return alert('Please select a member.');
    if (!cashAmount || Number(cashAmount) <= 0) return alert('Please enter a valid amount.');

    const camp = campaigns.find(c => c.campaign_id === cashCampId);
    const mem = directory.find(m => m.official_id === selectedDonorMemberId);
    if (!camp || !mem) return alert('Invalid campaign or member selection.');

    const raised = parseFloat(camp.raised_amount) || 0;
    const target = parseFloat(camp.target_amount) || 1;
    const remaining = Math.max(0, target - raised);

    if (parseFloat(cashAmount) > remaining) {
      return alert(`Maximum remaining goal amount for this drive is ₹${remaining}`);
    }

    const txnId = `CASH_${Date.now()}`;
    const payload = {
      transaction_date: new Date().toISOString(),
      transaction_id: txnId,
      member_id: mem.official_id,
      full_name: mem.full_name,
      role: mem.role,
      amount: cashAmount,
      payment_method: 'CASH (OFFLINE)',
      donation_type: 'FUND_RAISING',
      campaign_id: camp.campaign_id,
      reason: `Cash Support: ${camp.title}`
    };

    await setDoc(doc(db, 'transactions', txnId), payload);

    const newRaised = raised + parseFloat(cashAmount);
    let up = { raised_amount: newRaised };
    if (newRaised >= target) {
      up.status = 'STOPPED';
      up.remarks = 'Goal Achieved';
    }
    await updateDoc(doc(db, 'campaigns', camp.campaign_id), up);

    logAdminEvent('Logged Campaign Cash', `₹${cashAmount} from ${mem.full_name} for ${camp.title}`);
    setCampCashModalVisible(false);
    setSelectedDonorMemberId('');
    setCashAmount('');
    fetchData();
    onViewReceipt({ ...payload, official_id: mem.official_id });
  };

  // MANDATORY REMARKS FOR PAUSE / STOP CAMPAIGN
  const handleStatusButtonClick = (camp, newStatus) => {
    if (newStatus === 'PAUSED' || newStatus === 'STOPPED') {
      setStatusRemarkModal({ camp, targetStatus: newStatus });
      setStatusRemarkText(camp.remarks || '');
    } else {
      updateDoc(doc(db, 'campaigns', camp.campaign_id), { status: 'ACTIVE', remarks: '' }).then(() => {
        logAdminEvent('Resumed Campaign', camp.title);
        fetchData();
      });
    }
  };

  const confirmMandatoryStatusRemark = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!statusRemarkText.trim()) return alert(`Mandatory remarks required to ${statusRemarkModal.targetStatus} this drive.`);
    try {
      await updateDoc(doc(db, 'campaigns', statusRemarkModal.camp.campaign_id), {
        status: statusRemarkModal.targetStatus,
        remarks: statusRemarkText.trim().toUpperCase()
      });
      logAdminEvent(`${statusRemarkModal.targetStatus} Campaign`, `${statusRemarkModal.camp.title} (${statusRemarkText.trim().toUpperCase()})`);
      setStatusRemarkModal(null);
      setStatusRemarkText('');
      fetchData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Top Grid Menu Button (9 Tabs - Admin Actions Removed & Moved Inside Member Profile)
  const AdminTabBtn = ({ id, icon, label, perm }) => {
    if (perm !== 'PUBLIC' && !hasPerm(perm) && !isCore) return null;
    if ((id === 'SETTINGS' || id === 'EVENTS' || id === 'ROLES') && !isCore) return null;
    const active = activeTab === id;
    return (
      <div onClick={() => onNavigate(`admin_${id.toLowerCase()}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '11px', backgroundColor: active ? '#1e3a8a' : '#f1f5f9', color: active ? '#fbbf24' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', transition: 'all 0.15s', border: active ? '1.5px solid #d97706' : '1px solid #e2e8f0' }}>
          {icon}
        </div>
        <span style={{ fontSize: '7.5px', fontWeight: '900', color: active ? '#1e3a8a' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px', textAlign: 'center' }}>{label}</span>
      </div>
    );
  };

  // Render Enhanced Campaign Card for Admin
  const renderAdminCampaignCard = (c, isCompact = false) => {
    const raised = parseFloat(c.raised_amount) || 0;
    const target = parseFloat(c.target_amount) || 1;
    const remaining = Math.max(0, target - raised);
    const progress = Math.min(Math.round((raised / target) * 100), 100);
    const goalAchieved = raised >= target;
    const isPaused = c.status === 'PAUSED';
    const isStopped = c.status === 'STOPPED' || goalAchieved;
    const donorCount = globalTxns.filter(t => t.campaign_id === c.campaign_id).length;

    // COMPACT LIST VIEW (Only Title shown for Completed / Stopped Drives)
    if (isCompact) {
      return (
        <div key={c.campaign_id} onClick={() => setViewClosedCamp(c)} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px 14px', border: '1px solid #cbd5e1', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{c.title}</h4>
          <span style={{ backgroundColor: goalAchieved ? '#dcfce7' : '#fee2e2', color: goalAchieved ? '#16a34a' : '#dc2626', padding: '3px 8px', borderRadius: '6px', fontSize: '8.5px', fontWeight: '900', textTransform: 'uppercase' }}>
            {goalAchieved ? '🎉 Goal Met' : '⏹️ Stopped'} →
          </span>
        </div>
      );
    }

    // FULL DETAILED CARD VIEW
    return (
      <div key={c.campaign_id} style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{c.title}</h4>
          <span style={{
            backgroundColor: goalAchieved ? '#dcfce7' : isPaused ? '#fef3c7' : isStopped ? '#fee2e2' : '#dbeafe',
            color: goalAchieved ? '#16a34a' : isPaused ? '#d97706' : isStopped ? '#dc2626' : '#1e3a8a',
            padding: '2px 7px', borderRadius: '6px', fontSize: '8.5px', fontWeight: '900', textTransform: 'uppercase'
          }}>
            {goalAchieved ? '🎉 Goal Achieved' : c.status}
          </span>
        </div>

        <p style={{ margin: '0 0 10px 0', fontSize: '10.5px', color: '#64748b', fontWeight: '600', lineHeight: '1.35' }}>{c.description}</p>
        {c.remarks && <p style={{ margin: '0 0 8px 0', fontSize: '9.5px', fontWeight: '800', color: '#991b1b', backgroundColor: '#fef2f2', padding: '5px 8px', borderRadius: '6px' }}>Remarks: {c.remarks}</p>}

        <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: goalAchieved ? '#10b981' : isPaused ? '#f59e0b' : '#1e3a8a' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '10px', marginBottom: '10px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
          <div>
            <span style={{ display: 'block', fontSize: '7.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Collected ({progress}%)</span>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#10b981' }}>₹{raised.toLocaleString()}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '7.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Remaining</span>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#d97706' }}>₹{remaining.toLocaleString()}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '7.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Goal</span>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a' }}>₹{target.toLocaleString()}</span>
          </div>
        </div>

        {/* PRIMARY ACTIONS ROW (Donors & Log Cash Separated) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button type="button" onClick={() => setViewCampDonors(c)} style={{ padding: '7px 12px', backgroundColor: '#0a192f', color: '#fbbf24', border: 'none', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>
            👥 Donors ({donorCount})
          </button>
          
          {!isStopped && c.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => {
                setCashCampId(c.campaign_id);
                setSelectedDonorMemberId('');
                setCashAmount('');
                setCampCashModalVisible(true);
              }}
              style={{ padding: '7px 12px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)' }}
            >
              💵 Log Cash
            </button>
          )}
        </div>

        {/* ADMIN MANAGEMENT CONTROLS ROW (Only visible if drive is not stopped) */}
        {!isStopped && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            {c.status === 'ACTIVE' && (
              <button type="button" onClick={() => handleStatusButtonClick(c, 'PAUSED')} style={{ flex: 1, padding: '7px', backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>⏸️ Pause</button>
            )}
            {c.status === 'PAUSED' && (
              <button type="button" onClick={() => handleStatusButtonClick(c, 'ACTIVE')} style={{ flex: 1, padding: '7px', backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>▶️ Resume</button>
            )}
            {c.status !== 'STOPPED' && (
              <button type="button" onClick={() => handleStatusButtonClick(c, 'STOPPED')} style={{ flex: 1, padding: '7px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>⏹️ Stop</button>
            )}
            <button
              type="button"
              onClick={() => {
                setCashCampId(c.campaign_id);
                setCampTitle(c.title);
                setCampDesc(c.description);
                setCampTarget(c.target_amount);
                setCashAmount(c.raised_amount);
                setCampStatus(c.status);
                setCashReason(c.remarks || '');
                setShowCampaignModal(true);
              }}
              style={{ flex: 1, padding: '7px', backgroundColor: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              ✏️ Edit
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render Full Member Detail & Embedded Admin Actions
  const renderSelectedMemberDetail = () => {
    const u = selectedDetailUser;
    const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editFormData.class_grade);
    const selectedCountry = COUNTRY_CODES.find(c => c.code === (editFormData.country_code || '+91')) || COUNTRY_CODES[0];
    const inp = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '11px', fontWeight: '700', boxSizing: 'border-box', marginBottom: '8px', textTransform: 'uppercase' };
    const lbl = { display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '2px' };

    const pickUserPhoto = async () => {
      let r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.1, width: 250, height: 250, base64: true });
      if (!r.canceled && r.assets[0].base64) {
        const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
        if (b64.length > 950000) return alert("Image too large. Max 1MB.");
        if (isEditingUser) {
          setEditFormData({ ...editFormData, profile_photo: b64 });
        } else {
          await updateDoc(doc(db, 'members', u.official_id), { profile_photo: b64 });
          setSelectedDetailUser({ ...u, profile_photo: b64 });
          fetchData();
        }
      }
    };

    const executeSelectedAdminAction = async () => {
      if (!selectedActionChoice) return alert('Please select an admin action first.');
      if (selectedActionChoice === 'EDIT_PROFILE') {
        setEditFormData(u);
        setIsEditingUser(true);
      } else if (selectedActionChoice === 'LOG_CASH') {
        setCashUser(u);
        setCashType(isSubsDisabled ? 'GENERAL' : 'SUBSCRIPTION');
        setCashMonths('1');
        setCashAmount(isSubsDisabled ? '' : String(subAmount));
        setCashModalVisible(true);
      } else if (selectedActionChoice === 'RESET_PASS') {
        await updateDoc(doc(db, 'members', u.official_id), { password: 'Hiywa@123' });
        logAdminEvent('Reset Password', u.official_id);
        alert('Password reset to default: Hiywa@123');
      } else if (selectedActionChoice === 'TOGGLE_STATUS') {
        const next = u.membership_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await updateDoc(doc(db, 'members', u.official_id), { membership_status: next });
        logAdminEvent(`Status ${next}`, u.official_id);
        alert(`Status changed to ${next}`);
        setSelectedDetailUser({ ...u, membership_status: next });
        fetchData();
      } else if (selectedActionChoice === 'MARK_DECEASED') {
        await updateDoc(doc(db, 'members', u.official_id), { membership_status: 'DECEASED' });
        logAdminEvent('Marked Deceased', u.official_id);
        setSelectedDetailUser({ ...u, membership_status: 'DECEASED' });
        fetchData();
      } else if (selectedActionChoice === 'PROMOTE_ADMIN') {
        setPromoteUserId(u.official_id);
        setPromoteModalVisible(true);
      } else if (selectedActionChoice === 'REVOKE_ADMIN') {
        await updateDoc(doc(db, 'members', u.official_id), { role: 'MEMBER', is_core_admin: false, admin_permissions: '[]' });
        logAdminEvent('Revoked Admin', u.official_id);
        alert('Admin rights revoked.');
        setSelectedDetailUser({ ...u, role: 'MEMBER' });
        fetchData();
      } else if (selectedActionChoice === 'UPGRADE_MEMBER') {
        await updateDoc(doc(db, 'members', u.official_id), { role: 'MEMBER' });
        logAdminEvent('Upgraded Student', u.official_id);
        alert('Upgraded to Member!');
        setSelectedDetailUser({ ...u, role: 'MEMBER' });
        fetchData();
      }
      setSelectedActionChoice('');
    };

    return (
      <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '16px', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <button onClick={() => { setSelectedDetailUser(null); setIsEditingUser(false); }} style={{ background: '#f1f5f9', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>← Back to List</button>
          
          {isEditingUser ? (
            <button onClick={() => setIsEditingUser(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>✕ Cancel Edit</button>
          ) : (
            <button
              onClick={() => { setEditFormData(u); setIsEditingUser(true); }}
              style={{ backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {isEditingUser ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div onClick={pickUserPhoto} style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', margin: '0 auto 4px auto', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed #1e3a8a' }}>
                {editFormData.profile_photo ? <img src={editFormData.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>📷</span>}
              </div>
              <span style={{ fontSize: '8px', color: '#1e3a8a', fontWeight: '900' }}>TAP PHOTO TO CHANGE</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ flex: '1 1 180px' }}><label style={lbl}>Full Name</label><input style={inp} value={editFormData.full_name || ''} onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value.toUpperCase() })} /></div>
              <div style={{ flex: '1 1 180px' }}><label style={lbl}>Father's Name</label><input style={inp} value={editFormData.father_name || ''} onChange={e => setEditFormData({ ...editFormData, father_name: e.target.value.toUpperCase() })} /></div>
              <div style={{ flex: '1 1 180px' }}><label style={lbl}>Mother's Name</label><input style={inp} value={editFormData.mother_name || ''} onChange={e => setEditFormData({ ...editFormData, mother_name: e.target.value.toUpperCase() })} /></div>
              <FormDropdown label="Parents Status" value={editFormData.parents_status} options={['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED']} onSelect={v => setEditFormData({ ...editFormData, parents_status: v })} />
              <FormDropdown label="Gender" value={editFormData.gender} options={GENDERS} onSelect={v => setEditFormData({ ...editFormData, gender: v })} />
              <div style={{ flex: '1 1 150px' }}><label style={lbl}>Date of Birth</label><input type="date" style={inp} value={editFormData.dob || ''} onChange={e => setEditFormData({ ...editFormData, dob: e.target.value })} /></div>
              <FormDropdown label="Blood Group" value={editFormData.blood_group} options={BLOOD_GROUPS} onSelect={v => setEditFormData({ ...editFormData, blood_group: v })} />
              <FormDropdown label="Marital Status" value={editFormData.marital_status} options={MARITAL_STATUS} onSelect={v => setEditFormData({ ...editFormData, marital_status: v })} />
              <div style={{ flex: '1 1 180px' }}>
                <label style={lbl}>Aadhaar Number (12-Digits)</label>
                <input type="tel" maxLength="12" placeholder="[Aadhaar Redacted / Enter 12 Digits]" style={inp} value={editFormData.aadhaar_number || ''} onChange={e => setEditFormData({ ...editFormData, aadhaar_number: e.target.value.replace(/\D/g, '') })} />
              </div>

              <div style={{ flex: '1 1 220px' }}>
                <label style={lbl}>Primary Mobile</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <select value={editFormData.country_code || '+91'} onChange={e => setEditFormData({ ...editFormData, country_code: e.target.value })} style={{ width: '78px', padding: '7px 3px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#eff6ff', fontSize: '9.5px', fontWeight: '900', color: '#1e3a8a', marginBottom: '8px' }}>
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
                  </select>
                  <input type="tel" maxLength={selectedCountry.max} style={{ ...inp, flex: 1 }} value={editFormData.phone_number || ''} onChange={e => setEditFormData({ ...editFormData, phone_number: e.target.value.replace(/\D/g, '') })} />
                </div>
              </div>
              <div style={{ flex: '1 1 180px' }}><label style={lbl}>WhatsApp Number</label><input type="tel" maxLength={selectedCountry.max} style={inp} value={editFormData.whatsapp_number || ''} onChange={e => setEditFormData({ ...editFormData, whatsapp_number: e.target.value.replace(/\D/g, '') })} /></div>
              <div style={{ flex: '1 1 180px' }}><label style={lbl}>Email</label><input style={{ ...inp, textTransform: 'none' }} value={editFormData.email || ''} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} /></div>
              <FormDropdown label="Native Place" value={editFormData.native_place} options={NATIVE_PLACES} onSelect={v => setEditFormData({ ...editFormData, native_place: v })} />
              <div style={{ flex: '1 1 180px' }}><label style={lbl}>Current Location</label><input style={inp} value={editFormData.current_location || ''} onChange={e => setEditFormData({ ...editFormData, current_location: e.target.value.toUpperCase() })} /></div>
              <div style={{ flex: '1 1 100%' }}><label style={lbl}>Permanent Address</label><input style={inp} value={editFormData.address || ''} onChange={e => setEditFormData({ ...editFormData, address: e.target.value.toUpperCase() })} /></div>

              {editFormData.role === 'STUDENT' ? (
                <>
                  <FormDropdown label="Class / Grade" value={editFormData.class_grade} options={CLASSES} onSelect={v => setEditFormData({ ...editFormData, class_grade: v })} />
                  <div style={{ flex: '1 1 180px' }}><label style={lbl}>Institution Name</label><input style={inp} value={editFormData.school_name || ''} onChange={e => setEditFormData({ ...editFormData, school_name: e.target.value.toUpperCase() })} /></div>
                  <FormDropdown label="Institution Type" value={editFormData.school_type} options={isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES} onSelect={v => setEditFormData({ ...editFormData, school_type: v })} />
                  <div style={{ flex: '1 1 180px' }}><label style={lbl}>Institution Location</label><input style={inp} value={editFormData.school_location || ''} onChange={e => setEditFormData({ ...editFormData, school_location: e.target.value.toUpperCase() })} /></div>
                  <FormDropdown label="Medium" value={editFormData.medium_of_instruction} options={MEDIUMS} onSelect={v => setEditFormData({ ...editFormData, medium_of_instruction: v })} />
                </>
              ) : (
                <>
                  <FormDropdown label="Education Category" value={editFormData.educational_qualification} options={EDU_CATEGORIES} onSelect={v => setEditFormData({ ...editFormData, educational_qualification: v })} />
                  <div style={{ flex: '1 1 180px' }}><label style={lbl}>Course / Major</label><input style={inp} value={editFormData.course_details || ''} onChange={e => setEditFormData({ ...editFormData, course_details: e.target.value.toUpperCase() })} /></div>
                  <div style={{ flex: '1 1 180px' }}><label style={lbl}>Occupation</label><input style={inp} value={editFormData.occupation || ''} onChange={e => setEditFormData({ ...editFormData, occupation: e.target.value.toUpperCase() })} /></div>
                </>
              )}

              <FormDropdown label="Islamic Studies" value={editFormData.islamic_studies} options={['YES', 'NO']} onSelect={v => setEditFormData({ ...editFormData, islamic_studies: v })} />
              {editFormData.islamic_studies === 'YES' && (
                <>
                  <FormDropdown label="Islamic Qualification" value={editFormData.islamic_qualification} options={ISLAMIC_QUALS} onSelect={v => setEditFormData({ ...editFormData, islamic_qualification: v })} />
                  <div style={{ flex: '1 1 180px' }}><label style={lbl}>Madrasa Name</label><input style={inp} value={editFormData.madrasa_name || ''} onChange={e => setEditFormData({ ...editFormData, madrasa_name: e.target.value.toUpperCase() })} /></div>
                  <div style={{ flex: '1 1 180px' }}><label style={lbl}>Madrasa Location</label><input style={inp} value={editFormData.madrasa_location || ''} onChange={e => setEditFormData({ ...editFormData, madrasa_location: e.target.value.toUpperCase() })} /></div>
                </>
              )}
            </div>

            <button
              onClick={async () => {
                const updatedUser = { ...u, ...editFormData };
                // INSTANT UI UPDATE
                setDirectory(prev => prev.map(m => m.official_id === u.official_id ? updatedUser : m));
                setSelectedDetailUser(updatedUser);
                setIsEditingUser(false);
                try {
                  await updateDoc(doc(db, 'members', u.official_id), editFormData);
                } catch (e) {}
              }}
              style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '6px' }}
            >
              💾 Save All Member Changes
            </button>
          </div>
        ) : (
          <div>
            {/* Profile Photo & Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px dashed #cbd5e1', marginBottom: '12px' }}>
              <div onClick={pickUserPhoto} style={{ cursor: 'pointer', position: 'relative' }}>
                {u.profile_photo ? (
                  <img src={u.profile_photo} alt="" style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', border: '2px solid #1e3a8a' }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#0a192f', color: '#fbbf24', fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{u.full_name?.charAt(0)}</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>{u.full_name}</h3>
                <p style={{ margin: '0 0 4px 0', fontSize: '9.5px', color: '#64748b', fontWeight: '800' }}>ID: {u.official_id} • S/O {u.father_name}</p>
                <span style={{ backgroundColor: u.membership_status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: u.membership_status === 'ACTIVE' ? '#16a34a' : '#dc2626', padding: '2px 7px', borderRadius: '5px', fontSize: '8px', fontWeight: '900' }}>{u.membership_status} • {u.role === 'ADMIN' ? 'MEMBER' : u.role}</span>
              </div>
            </div>

            {/* Full Member Details Table */}
            {[
              ['Mother Name', u.mother_name],
              ['Parents Status', u.parents_status],
              ['DOB & Gender', `${u.dob || 'N/A'} • ${u.gender || 'N/A'}`],
              ['Blood & Marital', `${u.blood_group || 'N/A'} • ${u.marital_status || 'N/A'}`],
              ['Aadhaar Number', u.aadhaar_number || 'N/A'],
              ['Primary Mobile', `${u.country_code || '+91'} ${u.phone_number || ''}`],
              ['WhatsApp', `${u.country_code || '+91'} ${u.whatsapp_number || ''}`],
              ['Email', u.email],
              ['Native Place', u.native_place],
              ['Current City', u.current_location],
              ['Education', `${u.educational_qualification || u.class_grade || 'N/A'} (${u.course_details || u.school_name || ''})`],
              ['Occupation', u.occupation],
              ['Islamic Studies', u.islamic_studies === 'YES' ? `${u.islamic_qualification} (${u.madrasa_name || ''})` : 'NO'],
              ['Subscription Active', u.subscription_started ? 'YES (TRACKED)' : 'NO (PAUSED)'],
              ['Address', u.address]
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc', fontSize: '10.5px' }}>
                <span style={{ color: '#64748b', fontWeight: '800', fontSize: '8.5px', textTransform: 'uppercase' }}>{k}</span>
                <span style={{ color: '#0f172a', fontWeight: '800', textAlign: 'right', maxWidth: '65%' }}>{v || 'N/A'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* DEDICATED ADMIN PAGE HEADER WITH BACK TO HOME BUTTON */}
      <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '14px 16px 48px 16px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 1px 0', fontSize: '8.5px', color: '#fbbf24', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Control • HIYWA</p>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>{activeTab}</h2>
          </div>
          <button onClick={() => onNavigate('home')} style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: '8px', color: '#ffffff', fontWeight: '900', fontSize: '9.5px', textTransform: 'uppercase', cursor: 'pointer' }}>
            ← Back to Home
          </button>
        </div>
      </div>

      <div style={{ padding: '0 14px', maxWidth: '600px', margin: '-30px auto 0 auto', position: 'relative', zIndex: 10 }}>
        {/* SELECTED USER DETAIL VIEW */}
        {selectedDetailUser ? renderSelectedMemberDetail() : (
          <>
            {/* 1. OVERVIEW STATS TAB (CATEGORY-WISE BREAKUP OF MEMBERS & STUDENTS ONLY — NO TRUST AMOUNT) */}
            {activeTab === 'STATS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Primary Count Summary */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '10px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Community Strength Breakdown</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#eff6ff', padding: '12px 6px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                      <span style={{ fontSize: '8px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase' }}>Members</span>
                      <h3 style={{ margin: '3px 0 0 0', fontSize: '18px', fontWeight: '900', color: '#0a192f' }}>{directory.filter(u => (u.role === 'MEMBER' || u.role === 'ADMIN') && u.membership_status === 'ACTIVE').length}</h3>
                    </div>
                    <div style={{ backgroundColor: '#fef3c7', padding: '12px 6px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                      <span style={{ fontSize: '8px', fontWeight: '900', color: '#b45309', textTransform: 'uppercase' }}>Students</span>
                      <h3 style={{ margin: '3px 0 0 0', fontSize: '18px', fontWeight: '900', color: '#d97706' }}>{directory.filter(u => u.role === 'STUDENT' && u.membership_status === 'ACTIVE').length}</h3>
                    </div>
                    <div style={{ backgroundColor: '#f0fdf4', padding: '12px 6px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                      <span style={{ fontSize: '8px', fontWeight: '900', color: '#16a34a', textTransform: 'uppercase' }}>Total Active</span>
                      <h3 style={{ margin: '3px 0 0 0', fontSize: '18px', fontWeight: '900', color: '#15803d' }}>{directory.filter(u => u.membership_status === 'ACTIVE').length}</h3>
                    </div>
                  </div>
                </div>

                {/* Native Place Breakdown */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '10px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Native Place Wise Count</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {NATIVE_PLACES.map(place => {
                      const memCount = directory.filter(u => u.native_place === place && u.role !== 'STUDENT').length;
                      const stuCount = directory.filter(u => u.native_place === place && u.role === 'STUDENT').length;
                      return (
                        <div key={place} style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '9.5px', fontWeight: '900', color: '#0f172a' }}>{place}</p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#64748b', fontWeight: '700' }}>Mem: {memCount} • Stu: {stuCount}</p>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '900', color: '#1e3a8a' }}>{memCount + stuCount}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Blood Group Breakdown */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '10px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Blood Group Wise Count</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                    {BLOOD_GROUPS.map(bg => (
                      <div key={bg} style={{ backgroundColor: '#fef2f2', padding: '8px 4px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#dc2626', display: 'block' }}>{bg}</span>
                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{directory.filter(u => u.blood_group === bg).length}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education Category Breakdown */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '10px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>4. Education & Islamic Studies Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {EDU_CATEGORIES.map(edu => {
                      const cnt = directory.filter(u => u.educational_qualification === edu).length;
                      if (cnt === 0) return null;
                      return (
                        <div key={edu} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '9.5px', fontWeight: '800' }}>
                          <span style={{ color: '#475569' }}>{edu}</span>
                          <span style={{ color: '#1e3a8a', fontWeight: '900' }}>{cnt}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900' }}>
                      <span style={{ color: '#1e3a8a' }}>ISLAMIC SCHOLARS (AALIM / HAAFIZH)</span>
                      <span style={{ color: '#1e3a8a' }}>{directory.filter(u => u.islamic_studies === 'YES').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MEMBER & STUDENT DIRECTORY */}
            {(activeTab === 'USERS' || activeTab === 'STUDENTS') && (
              <div>
                {/* Modern Total Count Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '14px', border: '1px solid #cbd5e1', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid #bfdbfe' }}>
                      {activeTab === 'USERS' ? '👥' : '🎓'}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 2px 0', fontSize: '9.5px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Total Registered {activeTab === 'USERS' ? 'Members' : 'Students'}
                      </h3>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e3a8a' }}>
                        {filteredDirectory.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  <input type="text" placeholder="Search Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '11px', fontWeight: '700', outline: 'none' }} />
                  <button onClick={() => onNavigate('adminRegister', activeTab === 'STUDENTS' ? 'STUDENT' : 'MEMBER')} style={{ backgroundColor: '#0a192f', color: '#fbbf24', border: 'none', padding: '0 14px', borderRadius: '10px', fontWeight: '900', fontSize: '9.5px', textTransform: 'uppercase', cursor: 'pointer' }}>+ Add</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filteredDirectory.map(m => {
                    const relPrefix = m.gender === 'FEMALE' ? 'D/O' : 'S/O';
                    return (
                      <div key={m.official_id} onClick={() => { setSelectedDetailUser(m); setIsEditingUser(false); }} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '9px 12px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        {m.profile_photo ? (
                          <img src={m.profile_photo} alt="" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#0a192f', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px' }}>{m.full_name?.charAt(0)}</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{m.full_name}</p>
                          <p style={{ margin: 0, fontSize: '9px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>{relPrefix} {m.father_name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2A. REVERSE FLOW ADMIN ACTIONS PAGE */}
            {activeTab === 'ACTIONS' && (
              <div>
                {/* TOP ACTION GRID */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Execute Action</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button onClick={() => setActionModal('START_SUB')} style={{ padding: '14px 8px', backgroundColor: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', borderRadius: '12px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '20px' }}>📅</span> Start Sub</button>
                    <button onClick={() => setActionModal('RESET')} style={{ padding: '14px 8px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '20px' }}>🔑</span> Reset Pass</button>
                    <button onClick={() => setActionModal('DEACTIVATE')} style={{ padding: '14px 8px', backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: '12px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '20px' }}>🚫</span> Deactivate</button>
                    <button onClick={() => setActionModal('UPGRADE')} style={{ padding: '14px 8px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '12px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '20px' }}>🎓</span> Upgrade</button>
                    <button onClick={() => setActionModal('DECEASED')} style={{ gridColumn: 'span 2', padding: '14px 8px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '20px' }}>⚰️</span> Mark Deceased</button>
                  </div>
                </div>

                {/* INACTIVE & DECEASED LISTS */}
                {['INACTIVE', 'DECEASED'].map(status => {
                  const list = directory.filter(u => u.membership_status === status);
                  if (list.length === 0) return null;
                  return (
                    <div key={status} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '14px', border: '1px solid #cbd5e1', marginBottom: '12px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '900', color: status === 'INACTIVE' ? '#c2410c' : '#475569', textTransform: 'uppercase' }}>{status === 'INACTIVE' ? '🚫 Deactivated Accounts' : '⚰️ Deceased Records'} ({list.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {list.map(u => (
                          <div key={u.official_id} onClick={() => {
                            if (window.confirm(`Re-activate ${u.full_name}?`)) executeAdminAction(u, 'ACTIVATE');
                          }} style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <div>
                              <p style={{ margin: '0 0 2px 0', fontSize: '11.5px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{u.full_name}</p>
                              <p style={{ margin: 0, fontSize: '8.5px', color: '#64748b', fontWeight: '800' }}>{u.official_id}</p>
                            </div>
                            <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', padding: '5px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>⚡ Activate</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2B. SUBSCRIPTION DUES PAGE (CLICK MEMBER TO LOG CASH DIRECTLY) */}
            {activeTab === 'SUBSCRIPTIONS' && (
              <div>
                {/* Modern Summary Banner */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '14px', border: '1px solid #cbd5e1', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', backgroundColor: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid #fecaca' }}>
                      ⏳
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 2px 0', fontSize: '9.5px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Total Pending Arrears
                      </h3>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#ef4444' }}>
                        ₹{totalPendingDuesVal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', paddingLeft: '12px', borderLeft: '1px solid #e2e8f0' }}>
                    <span style={{ display: 'block', fontSize: '8px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Members Due</span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>{pendingDuesList.length}</span>
                  </div>
                </div>

                {/* Search Bar for Due Members */}
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Search Due Member Name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '11px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <p style={{ margin: '6px 0 0 2px', fontSize: '9px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase' }}>Tap on a member below to log their payment</p>
                </div>

                {/* Due Members List */}
                {isSubsDisabled ? (
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '900', color: '#b45309' }}>
                      ⏳ Subscription tracking is not yet active or set to a future month.
                    </span>
                  </div>
                ) : pendingDuesList.length === 0 ? (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#16a34a', fontWeight: '900' }}>✅ All Clear! No pending subscription dues.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingDuesList
                      .filter(u => !searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(u => {
                        const relPrefix = u.gender === 'FEMALE' ? 'D/O' : 'S/O';
                        return (
                          <div
                            key={u.official_id}
                            onClick={() => {
                              setCashUser(u);
                              setCashType('SUBSCRIPTION');
                              setCashMonths(String(u.duesMonths));
                              setCashAmount(String(u.duesAmount));
                              setCashModalVisible(true);
                            }}
                            style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '10px 12px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              {u.profile_photo ? (
                                <img src={u.profile_photo} alt="" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0, border: '1px solid #fecaca' }}>
                                  {u.full_name?.charAt(0)}
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {u.full_name}
                                </p>
                                <p style={{ margin: 0, fontSize: '9px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>
                                  {relPrefix} {u.father_name} • Paid: {u.total_months_paid || 0}m
                                </p>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#ef4444' }}>₹{u.duesAmount}</span>
                              <span style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#64748b' }}>{u.duesMonths} Mo Due</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* 3. FINANCE LEDGER TAB */}
            {activeTab === 'FINANCE' && (() => {
              const incSub = allIncomes.filter(t => t.donation_type === 'SUBSCRIPTION').reduce((s, t) => s + Number(t.amount || 0), 0);
              const incCamp = allIncomes.filter(t => t.donation_type === 'FUND_RAISING' || t.donation_type === 'CAMPAIGN').reduce((s, t) => s + Number(t.amount || 0), 0);
              const incGen = allIncomes.filter(t => t.donation_type === 'GENERAL').reduce((s, t) => s + Number(t.amount || 0), 0);
              
              const expOffice = allExpenses.filter(t => t.expense_category === 'OFFICE USE').reduce((s, t) => s + Number(t.amount || 0), 0);
              const expCharity = allExpenses.filter(t => t.expense_category === 'CHARITY').reduce((s, t) => s + Number(t.amount || 0), 0);
              const expOther = allExpenses.filter(t => !t.expense_category).reduce((s, t) => s + Number(t.amount || 0), 0); // Legacy backwards compatibility

              return (
              <div>
                {/* 1. TOP PROMINENT NET BALANCE CARD */}
                <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0a192f 100%)', color: '#ffffff', borderRadius: '18px', padding: '18px', marginBottom: '10px', textAlign: 'center', boxShadow: '0 6px 16px rgba(10,25,47,0.15)', border: '1px solid #3b82f6' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: '#93c5fd' }}>Net Trust Balance</p>
                  <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '0.5px' }}>₹{currentBalance.toLocaleString()}</h2>
                </div>

                {/* 2. INCOME & EXPENSE (SIDE-BY-SIDE CARDS) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  
                  {/* INCOME CARD */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '14px 12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
                      <span style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Income</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}>₹{(totalIncomeVal + Number(initialAmount)).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '9px', fontWeight: '800', color: '#64748b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SUBS:</span> <span style={{ color: '#0f172a' }}>₹{incSub.toLocaleString()}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DRIVES:</span> <span style={{ color: '#0f172a' }}>₹{incCamp.toLocaleString()}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GEN / INIT:</span> <span style={{ color: '#0f172a' }}>₹{(incGen + Number(initialAmount)).toLocaleString()}</span></div>
                    </div>
                  </div>

                  {/* EXPENSE CARD */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '14px 12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
                      <span style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expense</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#ef4444' }}>₹{totalExpenseVal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '9px', fontWeight: '800', color: '#64748b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>OFFICE:</span> <span style={{ color: '#0f172a' }}>₹{(expOffice + expOther).toLocaleString()}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CHARITY:</span> <span style={{ color: '#0f172a' }}>₹{expCharity.toLocaleString()}</span></div>
                    </div>
                  </div>

                </div>

                {/* 3. LOG BUTTONS (MOVED BELOW BALANCE/STATS) */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button onClick={() => { setIsGuestDonation(true); setCashAmount(''); setCashReason(''); setGuestName(''); setDonationMember(''); setShowLogDonationModal(true); }} style={{ flex: 1, padding: '11px', backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 10px rgba(30,58,138,0.2)' }}>
                    + Log Donation
                  </button>
                  <button onClick={() => setExpenseModalVisible(true)} style={{ flex: 1, padding: '11px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 10px rgba(220,38,38,0.2)' }}>
                    + Log Expense
                  </button>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '10px', marginBottom: '10px' }}>
                  {['INCOME', 'EXPENSE'].map(t => (
                    <button key={t} onClick={() => setLedgerTab(t)} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '8px', backgroundColor: ledgerTab === t ? '#fff' : 'transparent', fontWeight: '900', fontSize: '9.5px', color: '#0f172a', cursor: 'pointer' }}>{t} LEDGER</button>
                  ))}
                </div>

                {/* Ledger Search Box */}
                <input
                  type="text"
                  placeholder={`Search ${ledgerTab} transactions...`}
                  value={finSearchQuery}
                  onChange={e => setFinSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '11px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }}
                />

                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '4px', border: '1px solid #cbd5e1' }}>
                  {(ledgerTab === 'INCOME' ? filteredIncomes : filteredExpensesList).length === 0 ? (
                    <p style={{ padding: '14px', textAlign: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: '700', margin: 0 }}>No matching transactions.</p>
                  ) : (ledgerTab === 'INCOME' ? filteredIncomes : filteredExpensesList).map((t, i) => (
                    <div key={t.transaction_id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <p style={{ margin: '0 0 1px 0', fontSize: '10.5px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                          {ledgerTab === 'INCOME' ? t.full_name : t.reason}
                        </p>
                        <p style={{ margin: 0, fontSize: '8.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                          {new Date(t.transaction_date).toLocaleDateString('en-GB')} 
                          {t.expense_category ? ` • ${t.expense_category}` : (ledgerTab === 'INCOME' && t.donation_type ? ` • ${t.donation_type}` : '')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '900', color: ledgerTab === 'INCOME' ? '#10b981' : '#ef4444' }}>{ledgerTab === 'INCOME' ? '+' : '-'}₹{t.amount}</span>
                        {ledgerTab === 'INCOME' && <button onClick={() => onViewReceipt(t)} style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', border: 'none', padding: '3px 7px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', cursor: 'pointer' }}>📄</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
            })()}

            {/* CONTRIBUTIONS (LEADERBOARD & SPLIT) */}
            {activeTab === 'CONTRIBUTIONS' && (() => {
              const allTrustTotal = allIncomes.reduce((s, t) => s + Number(t.amount || 0), 0);
              const allTrustSub = allIncomes.filter(t => t.donation_type === 'SUBSCRIPTION').reduce((s, t) => s + Number(t.amount || 0), 0);
              const allTrustCamp = allIncomes.filter(t => t.donation_type === 'FUND_RAISING' || t.donation_type === 'CAMPAIGN').reduce((s, t) => s + Number(t.amount || 0), 0);
              const allTrustGen = allIncomes.filter(t => t.donation_type === 'GENERAL').reduce((s, t) => s + Number(t.amount || 0), 0);

              let memberContribs = {};
              allIncomes.forEach(t => {
                const mid = t.member_id || 'UNKNOWN';
                if (!memberContribs[mid]) memberContribs[mid] = { official_id: mid, full_name: t.full_name || 'Guest', total: 0, sub: 0, camp: 0, gen: 0 };
                const amt = Number(t.amount || 0);
                memberContribs[mid].total += amt;
                if (t.donation_type === 'SUBSCRIPTION') memberContribs[mid].sub += amt;
                else if (t.donation_type === 'FUND_RAISING' || t.donation_type === 'CAMPAIGN') memberContribs[mid].camp += amt;
                else memberContribs[mid].gen += amt;
              });
              const memberContribList = Object.values(memberContribs).sort((a, b) => b.total - a.total);

              return (
                <div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '16px', border: '1px solid #cbd5e1', marginBottom: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Total Trust Collections</span>
                      <h2 style={{ margin: '4px 0 0 0', fontSize: '26px', fontWeight: '900', color: '#1e3a8a' }}>₹{allTrustTotal.toLocaleString()}</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                      <div><span style={{ display: 'block', fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Subscriptions</span><span style={{ fontSize: '13px', fontWeight: '900', color: '#10b981' }}>₹{allTrustSub.toLocaleString()}</span></div>
                      <div><span style={{ display: 'block', fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Fund Drives</span><span style={{ fontSize: '13px', fontWeight: '900', color: '#d97706' }}>₹{allTrustCamp.toLocaleString()}</span></div>
                      <div><span style={{ display: 'block', fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>General/Other</span><span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>₹{allTrustGen.toLocaleString()}</span></div>
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 8px 4px', fontSize: '11px', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>Member Leaderboard</h3>
                  <input type="text" placeholder="Search Member Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '11px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {memberContribList.filter(m => !searchQuery || m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())).map((m, idx) => (
                      <div key={m.official_id} onClick={() => setViewMemberContrib(m)} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '12px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>#{idx + 1}</div>
                          <div>
                            <p style={{ margin: '0 0 2px 0', fontSize: '11.5px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{m.full_name}</p>
                            <p style={{ margin: 0, fontSize: '8.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{m.official_id}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '900', color: '#10b981' }}>₹{m.total.toLocaleString()}</p>
                          <p style={{ margin: 0, fontSize: '8.5px', color: '#1e3a8a', fontWeight: '800', textTransform: 'uppercase' }}>View Split →</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* POPUP MODAL FOR INDIVIDUAL MEMBER CONTRIBUTION SPLIT */}
                  {viewMemberContrib && (
                    <div onClick={() => setViewMemberContrib(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)' }}>
                      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '300px', backgroundColor: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '18px 16px', textAlign: 'center', position: 'relative' }}>
                          <button onClick={() => setViewMemberContrib(null)} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', width: '26px', height: '26px', borderRadius: '50%', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>✕</button>
                          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.12)', color: '#fbbf24', fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', border: '1.5px solid #fbbf24' }}>
                            {viewMemberContrib.full_name?.charAt(0)}
                          </div>
                          <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>{viewMemberContrib.full_name}</h3>
                          <p style={{ margin: 0, fontSize: '9px', color: '#93c5fd', fontWeight: '700', textTransform: 'uppercase' }}>{viewMemberContrib.official_id}</p>
                        </div>
                        <div style={{ padding: '16px' }}>
                          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Total Contributed</span>
                            <h2 style={{ margin: '2px 0 0 0', fontSize: '24px', fontWeight: '900', color: '#10b981' }}>₹{viewMemberContrib.total.toLocaleString()}</h2>
                          </div>
                          {[
                            ['Subscriptions', viewMemberContrib.sub, '📅'],
                            ['Fund Drives', viewMemberContrib.camp, '📢'],
                            ['General / Other', viewMemberContrib.gen, '💖']
                          ].map(([k, v, icon]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                              <span style={{ color: '#475569', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase' }}>{icon} {k}</span>
                              <span style={{ color: '#0f172a', fontWeight: '900', fontSize: '11px' }}>₹{v.toLocaleString()}</span>
                            </div>
                          ))}
                          <button onClick={() => setViewMemberContrib(null)} style={{ width: '100%', marginTop: '16px', padding: '11px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Close</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 4. ENHANCED CAMPAIGNS CONTROL TAB */}
            {activeTab === 'CAMPAIGNS' && (
              <div>
                {viewCampDonors ? (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                      <button onClick={() => setViewCampDonors(null)} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: '7px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>← Back</button>
                      <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{viewCampDonors.title} • Donors</h4>
                    </div>
                    {globalTxns.filter(t => t.campaign_id === viewCampDonors.campaign_id).length === 0 ? (
                      <p style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: '800', padding: '16px 0' }}>No contributions recorded yet.</p>
                    ) : (
                      globalTxns
                        .filter(t => t.campaign_id === viewCampDonors.campaign_id)
                        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                        .map((txn, idx) => (
                          <div key={txn.transaction_id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 6px', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                              <p style={{ margin: '0 0 1px 0', fontSize: '11px', fontWeight: '900', color: '#0f172a' }}>{txn.full_name}</p>
                              <p style={{ margin: 0, fontSize: '8.5px', color: '#64748b', fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleDateString('en-GB')} • {txn.payment_method}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '900', color: '#10b981' }}>+₹{txn.amount}</span>
                              <button onClick={() => onViewReceipt(txn)} style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' }}>📄 Slip</button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                ) : viewClosedCamp ? (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                      <button onClick={() => setViewClosedCamp(null)} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: '7px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>← Back</button>
                      <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Closed Drive Details</h4>
                    </div>
                    {renderAdminCampaignCard(viewClosedCamp, false)}
                  </div>
                ) : (
                  <div>
                    <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '16px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                      <h3 style={{ margin: 0, fontSize: '11.5px', fontWeight: '900', textTransform: 'uppercase', color: '#0a192f' }}>📢 Live & Paused Drives</h3>
                      <button
                        onClick={() => { setCampTitle(''); setCampDesc(''); setCampTarget(''); setCashCampId(''); setCashAmount(''); setCampStatus('ACTIVE'); setCashReason(''); setShowCampaignModal(true); }}
                        style={{ backgroundColor: '#0a192f', color: '#fbbf24', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        + Launch Drive
                      </button>
                    </div>

                    {campaigns.filter(c => (c.status === 'ACTIVE' || c.status === 'PAUSED') && (parseFloat(c.raised_amount) || 0) < (parseFloat(c.target_amount) || 1)).map(c => renderAdminCampaignCard(c, false))}

                    <h3 style={{ margin: '16px 0 8px 0', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#475569' }}>Completed / Stopped Drives</h3>
                    {campaigns.filter(c => c.status === 'STOPPED' || (parseFloat(c.raised_amount) || 0) >= (parseFloat(c.target_amount) || 1)).map(c => renderAdminCampaignCard(c, true))}
                  </div>
                )}
              </div>
            )}

            {/* 5. REPORTS CENTRAL TAB (WITH FILTERS, LIVE PREVIEW & ALL-FIELDS CSV EXPORT) */}
            {activeTab === 'REPORTS' && (
              <div>
                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '10px', marginBottom: '10px' }}>
                  {['DIRECTORY', 'FINANCE'].map(t => (
                    <button key={t} onClick={() => setRepType(t)} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '8px', backgroundColor: repType === t ? '#fff' : 'transparent', fontWeight: '900', fontSize: '9.5px', cursor: 'pointer' }}>{t} REPORT</button>
                  ))}
                </div>

                {repType === 'DIRECTORY' ? (
                  <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '12px', border: '1px solid #cbd5e1', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      <FilterDropdown label="Role" value={repRole} options={['MEMBER', 'STUDENT', 'ADMIN']} onSelect={setRepRole} />
                      <FilterDropdown label="Status" value={repStatus} options={['ACTIVE', 'INACTIVE', 'DECEASED']} onSelect={setRepStatus} />
                      <FilterDropdown label="Blood" value={repBlood} options={BLOOD_GROUPS} onSelect={setRepBlood} />
                      <FilterDropdown label="Gender" value={repGender} options={GENDERS} onSelect={setRepGender} />
                      <FilterDropdown label="Native" value={repNative} options={NATIVE_PLACES} onSelect={setRepNative} />
                      <FilterDropdown label="Education" value={repEdu} options={EDU_CATEGORIES} onSelect={setRepEdu} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569' }}>Matched: {filteredRepDir.length} Records</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setRepRole(''); setRepStatus(''); setRepBlood(''); setRepGender(''); setRepNative(''); setRepEdu(''); setRepMarital(''); }} style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '7px', fontSize: '9px', fontWeight: '900', cursor: 'pointer' }}>Clear</button>
                        <button onClick={exportDirectory} style={{ padding: '6px 12px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>📥 Export All Fields CSV</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '12px', border: '1px solid #cbd5e1', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', alignItems: 'flex-end' }}>
                      <FilterDropdown label="Category" value={repFinType} options={['SUBSCRIPTION', 'GENERAL', 'EXPENSE', 'FUND_RAISING']} onSelect={setRepFinType} />
                      <div style={{ flex: '1 1 110px' }}>
                        <label style={{ display: 'block', fontSize: '8px', color: '#1e3a8a', fontWeight: '900', textTransform: 'uppercase', marginBottom: '2px' }}>Start Date</label>
                        <input type="date" value={repStartDate} onChange={e => setRepStartDate(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: '800', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: '1 1 110px' }}>
                        <label style={{ display: 'block', fontSize: '8px', color: '#1e3a8a', fontWeight: '900', textTransform: 'uppercase', marginBottom: '2px' }}>End Date</label>
                        <input type="date" value={repEndDate} onChange={e => setRepEndDate(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: '800', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569' }}>Matched: {filteredRepFin.length} Txns</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setRepFinType(''); setRepStartDate(''); setRepEndDate(''); }} style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '7px', fontSize: '9px', fontWeight: '900', cursor: 'pointer' }}>Clear</button>
                        <button onClick={exportFinance} style={{ padding: '6px 12px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>📥 Export All Fields CSV</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* LIVE REPORT PREVIEW TABLE */}
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <div style={{ backgroundColor: '#0a192f', padding: '8px 12px', color: '#fbbf24', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase' }}>
                    Live Report Preview (First 15 Rows)
                  </div>
                  <div style={{ overflowX: 'auto', padding: '8px' }}>
                    {repType === 'DIRECTORY' ? (
                      <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '9.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid #cbd5e1', color: '#475569', textTransform: 'uppercase' }}>
                            <th style={{ padding: '5px' }}>ID</th>
                            <th style={{ padding: '5px' }}>Name</th>
                            <th style={{ padding: '5px' }}>Father</th>
                            <th style={{ padding: '5px' }}>Role</th>
                            <th style={{ padding: '5px' }}>Blood</th>
                            <th style={{ padding: '5px' }}>Phone</th>
                            <th style={{ padding: '5px' }}>Native</th>
                            <th style={{ padding: '5px' }}>Education</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRepDir.slice(0, 15).map(u => (
                            <tr key={u.official_id} style={{ borderBottom: '1px solid #f1f5f9', fontWeight: '700', color: '#0f172a' }}>
                              <td style={{ padding: '5px', color: '#1e3a8a', fontWeight: '900' }}>{u.official_id}</td>
                              <td style={{ padding: '5px' }}>{u.full_name}</td>
                              <td style={{ padding: '5px' }}>{u.father_name}</td>
                              <td style={{ padding: '5px' }}>{u.role}</td>
                              <td style={{ padding: '5px' }}>{u.blood_group || '-'}</td>
                              <td style={{ padding: '5px' }}>{u.phone_number}</td>
                              <td style={{ padding: '5px' }}>{u.native_place || '-'}</td>
                              <td style={{ padding: '5px' }}>{u.educational_qualification || u.class_grade || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse', fontSize: '9.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid #cbd5e1', color: '#475569', textTransform: 'uppercase' }}>
                            <th style={{ padding: '5px' }}>Date</th>
                            <th style={{ padding: '5px' }}>Name / Reason</th>
                            <th style={{ padding: '5px' }}>Type</th>
                            <th style={{ padding: '5px' }}>Mode</th>
                            <th style={{ padding: '5px', textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRepFin.slice(0, 15).map((t, idx) => (
                            <tr key={t.transaction_id || idx} style={{ borderBottom: '1px solid #f1f5f9', fontWeight: '700', color: '#0f172a' }}>
                              <td style={{ padding: '5px' }}>{new Date(t.transaction_date).toLocaleDateString('en-GB')}</td>
                              <td style={{ padding: '5px' }}>{t.full_name || t.reason}</td>
                              <td style={{ padding: '5px' }}>{t.donation_type}</td>
                              <td style={{ padding: '5px' }}>{t.payment_method}</td>
                              <td style={{ padding: '5px', textAlign: 'right', fontWeight: '900', color: t.donation_type === 'EXPENSE' ? '#ef4444' : '#10b981' }}>{t.donation_type === 'EXPENSE' ? '-' : '+'}₹{t.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. ADMIN ROLES TAB (ADD ADMIN WITH PAGE SELECTION & DIRECT REVOKE) */}
            {activeTab === 'ROLES' && (
              <div style={{ backgroundColor: '#fff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>🛡️ Admin Rights & Roles</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Assign Page Access or Revoke Sub-Admins</p>
                  </div>
                  <button
                    onClick={() => {
                      setPromoteUserId('');
                      setSelectedPerms({ MANAGE_USERS: false, MANAGE_FINANCE: false, MANAGE_CAMPAIGNS: false, REPORTS_CENTRAL: false });
                      setPromoteModalVisible(true);
                    }}
                    style={{ backgroundColor: '#0a192f', color: '#fbbf24', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    + Add Admin
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {directory.filter(u => u.role === 'ADMIN').map(a => {
                    let parsedPerms = [];
                    try { parsedPerms = JSON.parse(a.admin_permissions || '[]'); } catch (e) {}
                    return (
                      <div key={a.official_id} style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px 0', fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                            {a.full_name} {a.is_core_admin ? '👑' : '⭐'}
                          </p>
                          <p style={{ margin: 0, fontSize: '9px', color: '#1e3a8a', fontWeight: '800', textTransform: 'uppercase' }}>
                            {a.is_core_admin ? 'CORE ADMIN • FULL SYSTEM ACCESS' : (parsedPerms.length > 0 ? parsedPerms.join(' • ') : 'NO PAGES ASSIGNED')}
                          </p>
                        </div>

                        {a.is_core_admin ? (
                          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '4px 8px', borderRadius: '6px', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase' }}>
                            Core Protected
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button
                              onClick={() => {
                                setPromoteUserId(a.official_id);
                                setSelectedPerms({
                                  MANAGE_USERS: parsedPerms.includes('MANAGE_USERS'),
                                  MANAGE_FINANCE: parsedPerms.includes('MANAGE_FINANCE'),
                                  MANAGE_CAMPAIGNS: parsedPerms.includes('MANAGE_CAMPAIGNS'),
                                  REPORTS_CENTRAL: parsedPerms.includes('REPORTS_CENTRAL')
                                });
                                setPromoteModalVisible(true);
                              }}
                              style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', padding: '6px 9px', borderRadius: '7px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
                            >
                              ✏️ Pages
                            </button>
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'members', a.official_id), { role: 'MEMBER', is_core_admin: false, admin_permissions: '[]' });
                                logAdminEvent('Revoked Admin', a.official_id);
                                alert(`Admin rights revoked for ${a.full_name}.`);
                                fetchData();
                              }}
                              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 9px', borderRadius: '7px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
                            >
                              ❌ Revoke
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. EVENT LOGS TAB */}
            {activeTab === 'EVENTS' && (
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>System Event Logs</h4>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[['', 'All'], ['ADMIN', 'Admin'], ['USER', 'Members']].map(([k, lbl]) => (
                      <button key={lbl} onClick={() => setEventFilter(k)} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', fontSize: '8.5px', fontWeight: '900', backgroundColor: eventFilter === k ? '#1e3a8a' : '#f1f5f9', color: eventFilter === k ? '#fff' : '#475569', cursor: 'pointer' }}>{lbl}</button>
                    ))}
                  </div>
                </div>
                {[
                  ...globalTxns.map(t => ({ date: t.transaction_date, name: t.full_name || 'Member', action: `Logged ${t.donation_type}`, target: `₹${t.amount}`, type: (t.payment_method && t.payment_method.includes('OFFLINE')) ? 'ADMIN' : 'USER' })),
                  ...systemLogs.map(s => ({ date: s.timestamp, name: s.admin_name, action: s.action, target: s.details, type: 'ADMIN' }))
                ]
                  .filter(l => !eventFilter || l.type === eventFilter)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 40)
                  .map((log, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: '9.5px' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '900', color: '#0f172a' }}>{log.action}</p>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: '700' }}>{log.target}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: '900', color: log.type === 'ADMIN' ? '#dc2626' : '#1e3a8a' }}>{log.name}</p>
                        <p style={{ margin: 0, fontSize: '8px', color: '#94a3b8' }}>{new Date(log.date).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 8. UNIFORM & COMPACT SETTINGS PAGE */}
            {activeTab === 'SETTINGS' && (
              <div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '12px', border: '1px solid #cbd5e1', marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Global Configuration</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      ['SUB_AMOUNT', '💰 Sub Rate', `₹${subAmount}`],
                      ['PRI_UPI', '⚡ Primary UPI', primaryUpi || 'Not Set'],
                      ['SEC_UPI', '🏦 Secondary UPI', secondaryUpi || 'Not Set'],
                      ['GPAY_NUM', '📱 GPay / PhonePe', gpayNumber || 'Not Set'],
                      ['SUB_START', '📅 Start Month', subStartMonth || 'Not Set'],
                      ['INIT_BAL', '💵 Opening Bal', `₹${initialAmount}`],
                      ['PUBLIC_REG', '🌐 Public Reg', allowPublicReg ? 'ACTIVE (ON)' : 'DISABLED (OFF)']
                    ].map(([key, title, sub]) => (
                      <button
                        key={key}
                        onClick={() => setConfigModal(key)}
                        style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '9px 10px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
                      >
                        <span style={{ fontSize: '9.5px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>{title}</span>
                        <span style={{ fontSize: '8.5px', fontWeight: '700', color: '#1e3a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{sub}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setShowSliderModal(true)}
                      style={{ gridColumn: 'span 2', backgroundColor: '#0a192f', border: '1px solid #1e3a8a', padding: '10px 12px', borderRadius: '10px', color: '#fbbf24', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>🖼️ Manage Home Slider Images</span>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '8.5px' }}>{sliderImages.length} Photos</span>
                    </button>
                  </div>
                </div>

                {/* Compact Danger Zone */}
                <div style={{ backgroundColor: '#fef2f2', borderRadius: '16px', padding: '12px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: '#991b1b', textTransform: 'uppercase' }}>Danger Zone</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '8.5px', color: '#b91c1c', fontWeight: '600' }}>Reset non-core members, txns & drives</p>
                  </div>
                  <button onClick={() => setMasterResetModal(true)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>
                    ⚠️ Wipe Data
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MANDATORY PAUSE / STOP REMARKS MODAL */}
      {statusRemarkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={confirmMandatoryStatusRemark} style={{ width: '100%', maxWidth: '310px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
              {statusRemarkModal.targetStatus === 'PAUSED' ? '⏸️ Pause Fund Drive' : '⏹️ Stop Fund Drive'}
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
              Please enter a mandatory remark/reason for {statusRemarkModal.targetStatus === 'PAUSED' ? 'pausing' : 'stopping'} <strong>{statusRemarkModal.camp.title}</strong>:
            </p>
            <input
              type="text"
              placeholder="ENTER MANDATORY REASON *"
              value={statusRemarkText}
              onChange={e => setStatusRemarkText(e.target.value.toUpperCase())}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '12px', fontSize: '11px', fontWeight: '800', boxSizing: 'border-box', textTransform: 'uppercase' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => { setStatusRemarkModal(null); setStatusRemarkText(''); }} style={{ flex: 1, padding: '9px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '9px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}>Confirm</button>
            </div>
          </form>
        </div>
      )}

      {/* MANAGE SLIDER IMAGES MODAL */}
      {showSliderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '330px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Manage Slider Images</h4>
              <button onClick={() => setShowSliderModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '26px', height: '26px', borderRadius: '50%', fontWeight: '900', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {sliderImages.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '10px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={async () => {
                      const newArray = sliderImages.filter((_, i) => i !== idx);
                      setSliderImages(newArray);
                      await setDoc(doc(db, 'settings', 'global'), { slider_images: newArray }, { merge: true });
                    }}
                    style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: '#ef4444', color: '#fff', border: 'none', width: '18px', height: '18px', borderRadius: '50%', fontSize: '9px', fontWeight: '900', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div
                onClick={async () => {
                  let r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.2, width: 600, height: 350, base64: true });
                  if (!r.canceled && r.assets[0].base64) {
                    const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
                    const newArray = [...sliderImages, b64];
                    setSliderImages(newArray);
                    await setDoc(doc(db, 'settings', 'global'), { slider_images: newArray }, { merge: true });
                  }
                }}
                style={{ width: '64px', height: '64px', borderRadius: '10px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', cursor: 'pointer', color: '#1e3a8a', fontWeight: '900', fontSize: '18px' }}
              >
                +
              </div>
            </div>
            <button onClick={() => setShowSliderModal(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#0a192f', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '10.5px', textTransform: 'uppercase', cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}

      {/* ACTION SELECTION MODAL */}
      {actionModal && (() => {
        let eligibleUsers = directory.filter(u => !u.is_core_admin);
        let title = '';
        if (actionModal === 'START_SUB') { title = 'Start Subscription'; eligibleUsers = eligibleUsers.filter(u => u.role !== 'STUDENT' && u.membership_status === 'ACTIVE' && !u.subscription_started); }
        else if (actionModal === 'RESET') { title = 'Reset Password'; eligibleUsers = eligibleUsers.filter(u => u.membership_status === 'ACTIVE'); }
        else if (actionModal === 'DEACTIVATE') { title = 'Deactivate Account'; eligibleUsers = eligibleUsers.filter(u => u.membership_status === 'ACTIVE'); }
        else if (actionModal === 'UPGRADE') { title = 'Upgrade Student'; eligibleUsers = eligibleUsers.filter(u => u.role === 'STUDENT' && u.membership_status === 'ACTIVE'); }
        else if (actionModal === 'DECEASED') { title = 'Mark Deceased'; eligibleUsers = eligibleUsers.filter(u => u.membership_status !== 'DECEASED'); }

        const filteredList = eligibleUsers.filter(u => !actionSearchQuery || u.full_name?.toLowerCase().includes(actionSearchQuery.toLowerCase()) || u.official_id?.toLowerCase().includes(actionSearchQuery.toLowerCase()));

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)', overflowY: 'auto' }}>
            <div style={{ width: '100%', maxWidth: '340px', backgroundColor: '#ffffff', borderRadius: '24px', padding: '18px', marginTop: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>{title}</h4>
                <button onClick={() => { setActionModal(null); setActionSearchQuery(''); }} style={{ background: '#f1f5f9', border: 'none', width: '28px', height: '28px', borderRadius: '50%', fontWeight: '900', cursor: 'pointer', color: '#475569' }}>✕</button>
              </div>
              <input type="text" placeholder="Search Member / Student..." value={actionSearchQuery} onChange={e => setActionSearchQuery(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '14px', fontSize: '11px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
              
              <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredList.length === 0 ? <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', fontWeight: '800', padding: '20px 0' }}>No eligible members found.</p> : filteredList.map(u => (
                  <div key={u.official_id} onClick={() => {
                    executeAdminAction(u, actionModal);
                    setActionModal(null);
                    setActionSearchQuery('');
                  }} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{u.full_name}</p>
                      <p style={{ margin: 0, fontSize: '8.5px', color: '#64748b', fontWeight: '800' }}>{u.official_id} • {u.role}</p>
                    </div>
                    <span style={{ backgroundColor: '#1e3a8a', color: '#fff', padding: '5px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>Select</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MASTER DATABASE WIPE MODAL */}
      {masterResetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '300px', backgroundColor: '#fff', borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#dc2626', fontWeight: '900', textTransform: 'uppercase' }}>⚠️ Confirm Full Wipe</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '10.5px', color: '#64748b', lineHeight: '1.4', fontWeight: '600' }}>
              Deletes all non-core members, students, transactions & drives.
            </p>
            <form onSubmit={handleMasterDatabaseReset} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="password"
                placeholder="Admin Password *"
                value={masterResetPassword}
                onChange={e => setMasterResetPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #fca5a5', fontSize: '12px', fontWeight: '900', textAlign: 'center', color: '#dc2626', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => { setMasterResetModal(false); setMasterResetPassword(''); }} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '10px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>
                  {isSubmitting ? 'Wiping...' : 'Wipe Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUMULATIVE LEDGER MODAL */}
      {showCumulativeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.8)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 10px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '540px', backgroundColor: '#fff', borderRadius: '18px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0a192f' }}>HIYWA CONNECT</h2>
                <p style={{ margin: 0, fontSize: '8.5px', color: '#d97706', fontWeight: '800', textTransform: 'uppercase' }}>Cumulative Member Ledger</p>
              </div>
              <button onClick={() => setShowCumulativeModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '26px', height: '26px', borderRadius: '50%', fontWeight: '900', cursor: 'pointer' }}>✕</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #cbd5e1', fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase' }}>
                  <th style={{ padding: '5px 4px' }}>Member</th>
                  <th style={{ padding: '5px 4px', textAlign: 'right' }}>Paid</th>
                  <th style={{ padding: '5px 4px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {directory.filter(u => u.role !== 'STUDENT').map((m, idx) => (
                  <tr key={m.official_id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc', fontSize: '9.5px', fontWeight: '800' }}>
                    <td style={{ padding: '5px 4px' }}>{m.full_name}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right', color: '#1e3a8a' }}>{m.total_months_paid || 0} Mo</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right', color: '#64748b' }}>{m.membership_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS PARAMETER MODAL (INCLUDING GPAY / PHONEPE NUMBER) */}
      {configModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '300px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>Update {configModal}</h4>
            {configModal !== 'PUBLIC_REG' && (
              <input
                type={configModal === 'SUB_START' ? 'month' : 'text'}
                placeholder={configModal === 'GPAY_NUM' ? 'Enter G-Pay / PhonePe Number' : ''}
                value={
                  configModal === 'SUB_AMOUNT' ? subAmount :
                  configModal === 'PRI_UPI' ? primaryUpi :
                  configModal === 'SEC_UPI' ? secondaryUpi :
                  configModal === 'GPAY_NUM' ? gpayNumber :
                  configModal === 'SUB_START' ? subStartMonth : initialAmount
                }
                onChange={e => {
                  const v = e.target.value;
                  if (configModal === 'SUB_AMOUNT') setSubAmount(v);
                  else if (configModal === 'PRI_UPI') setPrimaryUpi(v);
                  else if (configModal === 'SEC_UPI') setSecondaryUpi(v);
                  else if (configModal === 'GPAY_NUM') setGpayNumber(v);
                  else if (configModal === 'SUB_START') setSubStartMonth(v);
                  else setInitialAmount(v);
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '8px', fontSize: '12px', fontWeight: '800', boxSizing: 'border-box' }}
              />
            )}
            <input type="password" placeholder="Admin Password *" value={configModalPassword} onChange={e => setConfigModalPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #fca5a5', marginBottom: '10px', fontSize: '11px', fontWeight: '800', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setConfigModal(null); setConfigModalPassword(''); }} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                const adminSnap = await getDoc(doc(db, 'members', currentUser.official_id));
                if (!adminSnap.exists() || adminSnap.data().password !== configModalPassword) return alert('Incorrect admin password!');
                let up = {};
                if (configModal === 'SUB_AMOUNT') up.monthly_subscription_amount = subAmount;
                else if (configModal === 'PRI_UPI') up.primary_upi = primaryUpi;
                else if (configModal === 'SEC_UPI') up.secondary_upi = secondaryUpi;
                else if (configModal === 'GPAY_NUM') up.gpay_phonepe_number = gpayNumber;
                else if (configModal === 'SUB_START') up.subscription_start_month = subStartMonth;
                else if (configModal === 'PUBLIC_REG') up.allow_public_registration = !allowPublicReg;
                else up.initial_amount = initialAmount;
                await setDoc(doc(db, 'settings', 'global'), up, { merge: true });
                alert('Setting Saved!'); setConfigModal(null); setConfigModalPassword(''); fetchData();
              }} style={{ flex: 1, padding: '10px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSE, GUEST CASH, MEMBER CASH, CAMPAIGN & PROMOTE MODALS */}
      {expenseModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '300px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase' }}>Log Trust Expense</h4>
            
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '12px', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setExpenseCategory('OFFICE USE')}
                style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', backgroundColor: expenseCategory === 'OFFICE USE' ? '#0a192f' : 'transparent', color: expenseCategory === 'OFFICE USE' ? '#ffffff' : '#475569', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                🏢 Office
              </button>
              <button
                type="button"
                onClick={() => setExpenseCategory('CHARITY')}
                style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', backgroundColor: expenseCategory === 'CHARITY' ? '#0a192f' : 'transparent', color: expenseCategory === 'CHARITY' ? '#ffffff' : '#475569', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                🤝 Charity
              </button>
            </div>

            <input placeholder="Reason / Vendor / Beneficiary *" value={expenseReason} onChange={e => setExpenseReason(e.target.value.toUpperCase())} style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '8px', fontSize: '11px', fontWeight: '700', boxSizing: 'border-box' }} />
            <input type="number" placeholder="Amount (₹) *" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '14px', fontSize: '12px', fontWeight: '800', boxSizing: 'border-box' }} />
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setExpenseModalVisible(false); setExpenseCategory('OFFICE USE'); }} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', color: '#475569', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitExpenseLog} style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', textTransform: 'uppercase', cursor: 'pointer' }}>Save Expense</button>
            </div>
          </div>
        </div>
      )}

      {guestModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '320px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>💖 Log General Donation</h4>

            {/* GUEST OR MEMBER SELECTOR TOGGLE */}
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '12px', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setDonationDonorType('GUEST')}
                style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', backgroundColor: donationDonorType === 'GUEST' ? '#1e3a8a' : 'transparent', color: donationDonorType === 'GUEST' ? '#ffffff' : '#475569', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                🌐 Guest
              </button>
              <button
                type="button"
                onClick={() => setDonationDonorType('MEMBER')}
                style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', backgroundColor: donationDonorType === 'MEMBER' ? '#1e3a8a' : 'transparent', color: donationDonorType === 'MEMBER' ? '#ffffff' : '#475569', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                👤 Member
              </button>
            </div>

            {donationDonorType === 'GUEST' ? (
              <>
                <input
                  placeholder="Guest Full Name *"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '8px', fontSize: '11px', fontWeight: '700', boxSizing: 'border-box', textTransform: 'uppercase' }}
                />
                <input
                  type="tel"
                  placeholder="Guest Mobile (Optional)"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '8px', fontSize: '11px', fontWeight: '700', boxSizing: 'border-box' }}
                />
              </>
            ) : (
              <select
                value={selectedDonorMemberId}
                onChange={e => setSelectedDonorMemberId(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: '#0f172a', boxSizing: 'border-box' }}
              >
                <option value="">-- Select Member --</option>
                {directory
                  .filter(m => m.membership_status === 'ACTIVE')
                  .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
                  .map(m => (
                    <option key={m.official_id} value={m.official_id}>
                      {m.full_name} ({m.official_id})
                    </option>
                  ))}
              </select>
            )}

            <input
              placeholder="Reason / Purpose *"
              value={cashReason}
              onChange={e => setCashReason(e.target.value.toUpperCase())}
              style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '8px', fontSize: '11px', fontWeight: '700', boxSizing: 'border-box', textTransform: 'uppercase' }}
            />
            <input
              type="number"
              placeholder="Amount Collected (₹) *"
              value={cashAmount}
              onChange={e => setCashAmount(e.target.value)}
              style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '12px', fontSize: '12px', fontWeight: '800', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setGuestModalVisible(false)} style={{ flex: 1, padding: '9px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitGuestCash} style={{ flex: 1, padding: '9px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>Save Receipt</button>
            </div>
          </div>
        </div>
      )}

      {cashModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '310px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>📅 Log Subscription</h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', fontWeight: '800', color: '#1e3a8a' }}>{cashUser?.full_name} ({cashUser?.official_id})</p>
            
            <label style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '3px' }}>Number of Months *</label>
            <input type="number" placeholder="Months" value={cashMonths} onChange={e => { setCashMonths(e.target.value); setCashAmount(String(Number(e.target.value || 1) * Number(subAmount))); }} style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} />
            
            <label style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '3px' }}>Total Amount (₹) *</label>
            <input type="number" placeholder="Amount (₹)" value={cashAmount} onChange={e => setCashAmount(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '14px', boxSizing: 'border-box' }} />
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setCashModalVisible(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitCashPayment} style={{ flex: 1, padding: '10px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', textTransform: 'uppercase', cursor: 'pointer' }}>Save Receipt</button>
            </div>
          </div>
        </div>
      )}

      {campCashModalVisible && (() => {
        const selectedCamp = campaigns.find(c => c.campaign_id === cashCampId);
        const remGoal = selectedCamp ? Math.max(0, (parseFloat(selectedCamp.target_amount) || 1) - (parseFloat(selectedCamp.raised_amount) || 0)) : 0;
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ width: '100%', maxWidth: '320px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>💵 Log Drive Cash</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '10px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase' }}>
                {selectedCamp?.title} • Rem: ₹{remGoal.toLocaleString()}
              </p>

              <label style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '3px' }}>Select Member *</label>
              <select
                value={selectedDonorMemberId}
                onChange={e => setSelectedDonorMemberId(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', marginBottom: '10px', fontSize: '11px', fontWeight: '800', color: '#0f172a', boxSizing: 'border-box' }}
              >
                <option value="">-- Choose Member --</option>
                {directory
                  .filter(m => m.membership_status === 'ACTIVE')
                  .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
                  .map(m => (
                    <option key={m.official_id} value={m.official_id}>
                      {m.full_name} ({m.official_id})
                    </option>
                  ))}
              </select>

              <label style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '3px' }}>Amount Collected (₹) *</label>
              <input
                type="number"
                placeholder={`Max ₹${remGoal}`}
                value={cashAmount}
                onChange={e => setCashAmount(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '12px', fontSize: '12px', fontWeight: '800', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setCampCashModalVisible(false)} style={{ flex: 1, padding: '9px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={submitCampaignCash} style={{ flex: 1, padding: '9px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', textTransform: 'uppercase', cursor: 'pointer' }}>Save Receipt</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showCampaignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '320px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>{cashCampId ? 'Edit Fund Drive' : 'Launch Fund Drive'}</h4>
            <input placeholder="Campaign Title *" value={campTitle} onChange={e => setCampTitle(e.target.value.toUpperCase())} style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '8px', fontSize: '11px', fontWeight: '700', boxSizing: 'border-box' }} />
            <textarea rows="3" placeholder="Description *" value={campDesc} onChange={e => setCampDesc(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '8px', fontSize: '11px', fontWeight: '700', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="number" placeholder="Target Goal Amount (₹) *" value={campTarget} onChange={e => setCampTarget(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', marginBottom: '10px', fontSize: '11px', fontWeight: '800', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowCampaignModal(false)} style={{ flex: 1, padding: '9px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (!campTitle || !campDesc || !campTarget) return alert('Please fill all required fields.');
                const cId = cashCampId || `CAMP_${Date.now()}`;
                const payload = { campaign_id: cId, title: campTitle.toUpperCase(), description: campDesc, target_amount: campTarget, raised_amount: cashAmount || 0, status: campStatus || 'ACTIVE', remarks: cashReason || '' };
                if (!cashCampId) payload.created_at = new Date().toISOString();
                await setDoc(doc(db, 'campaigns', cId), payload, { merge: true });
                setShowCampaignModal(false); fetchData();
              }} style={{ flex: 1, padding: '9px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>
                {cashCampId ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '340px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>Pending Arrears (₹{totalPendingDuesVal})</h4>
              <button onClick={() => setShowDuesModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '26px', height: '26px', borderRadius: '50%', fontWeight: '900' }}>✕</button>
            </div>
            {pendingDuesList.length === 0 ? <p style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '800' }}>✅ All Clear! No pending dues.</p> : pendingDuesList.map(u => (
              <div key={u.official_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: '10.5px', fontWeight: '800' }}>
                <span>{u.full_name} ({u.duesMonths}m)</span>
                <span style={{ color: '#ef4444' }}>₹{u.duesAmount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {promoteModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '320px', backgroundColor: '#fff', borderRadius: '20px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>
              🛡️ Assign Sub-Admin & Pages
            </h4>

            <label style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
              Select Member *
            </label>
            <select
              value={promoteUserId || ''}
              onChange={e => setPromoteUserId(e.target.value)}
              style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', marginBottom: '12px', fontSize: '11px', fontWeight: '800', color: '#0f172a', boxSizing: 'border-box' }}
            >
              <option value="">-- Choose Member --</option>
              {directory
                .filter(m => !m.is_core_admin && m.role !== 'STUDENT' && m.membership_status === 'ACTIVE')
                .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
                .map(m => (
                  <option key={m.official_id} value={m.official_id}>
                    {m.full_name} ({m.official_id})
                  </option>
                ))}
            </select>

            <label style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
              Select Allowed Admin Pages *
            </label>
            {[
              ['MANAGE_USERS', '👥 Members & Students Directory'],
              ['MANAGE_FINANCE', '💵 Finance & Subscription Dues'],
              ['MANAGE_CAMPAIGNS', '📢 Cause Drives / Campaigns'],
              ['REPORTS_CENTRAL', '📑 Reports Central']
            ].map(([key, label]) => (
              <div
                key={key}
                onClick={() => setSelectedPerms({ ...selectedPerms, [key]: !selectedPerms[key] })}
                style={{ padding: '9px 10px', borderRadius: '9px', border: selectedPerms[key] ? '1px solid #93c5fd' : '1px solid #e2e8f0', backgroundColor: selectedPerms[key] ? '#eff6ff' : '#f8fafc', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10.5px', fontWeight: '800', color: '#0f172a' }}
              >
                <span>{label}</span>
                <span>{selectedPerms[key] ? '✅' : '⬜'}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setPromoteModalVisible(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={async () => {
                  if (!promoteUserId) return alert('Please select a member first.');
                  const arr = Object.keys(selectedPerms).filter(k => selectedPerms[k]);
                  if (arr.length === 0) return alert('Please select at least one page permission.');
                  await updateDoc(doc(db, 'members', promoteUserId), { role: 'ADMIN', admin_permissions: JSON.stringify(arr) });
                  logAdminEvent('Assigned Sub-Admin', `${promoteUserId} (${arr.join(', ')})`);
                  alert('Sub-Admin rights saved successfully!');
                  setPromoteModalVisible(false);
                  setSelectedDetailUser(null);
                  fetchData();
                }}
                style={{ flex: 1, padding: '10px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '900', fontSize: '10.5px', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Save Rights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}