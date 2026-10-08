import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, BackHandler, KeyboardAvoidingView } from 'react-native';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBK8-yEDwHb1G7AkKMQPu9ptxYB1zmiEDI",
  authDomain: "hiywa-27651.firebaseapp.com",
  projectId: "hiywa-27651",
  storageBucket: "hiywa-27651.firebasestorage.app",
  messagingSenderId: "596413315692",
  appId: "1:596413315692:web:177ddba0ffa9fc5eea3649"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function MainApp() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [registerRole, setRegisterRole] = useState('MEMBER');
  const [splashUser, setSplashUser] = useState(null);

  // --- HARDWARE BACK BUTTON LOGIC WITH EXIT ALERT ---
  useEffect(() => {
    const backAction = () => {
      // 1. Logged out screens
      if (currentView === 'register') {
        setCurrentView('login');
        return true;
      }
      
      // 2. Admin specific screens
      if (currentView === 'adminRegister') {
        setCurrentView('adminDashboard');
        return true;
      }

      // 3. Sub-screens for users
      if (currentView === 'donate' || currentView === 'subscription' || currentView === 'fundraising') {
        setCurrentView('dashboard');
        return true;
      }

      // 4. Deep sub-screens
      if (currentView === 'campaignDetail') {
        setCurrentView('fundraising');
        return true;
      }

      // 5. Receipt screen
      if (currentView === 'receipt') {
        setCurrentView(currentUser?.role === 'ADMIN' ? 'adminDashboard' : 'dashboard');
        return true;
      }

      // 6. Admin viewing User Dashboard
      if (currentView === 'dashboard' && currentUser?.role === 'ADMIN') {
        setCurrentView('adminDashboard');
        return true;
      }

      // 7. MAIN ROOT SCREENS - SHOW EXIT CONFIRMATION
      if (currentView === 'login' || currentView === 'adminDashboard' || currentView === 'dashboard') {
        Alert.alert(
          "Exit HIYWA App",
          "Are you sure you want to exit?",
          [
            { text: "Cancel", onPress: () => null, style: "cancel" },
            { text: "YES, EXIT", onPress: () => BackHandler.exitApp() }
          ]
        );
        return true; // We handled it by showing the popup, don't close yet!
      }

      return false; 
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentView, currentUser]);

  if (splashUser) {
    return (
      <LoginSplashScreen user={splashUser} onFinish={() => {
          setCurrentUser(splashUser);
          if (splashUser.role === 'ADMIN') setCurrentView('adminDashboard');
          else setCurrentView('dashboard');
          setSplashUser(null);
        }} 
      />
    );
  }

  if (currentView === 'login') return <LoginScreen onNavigate={setCurrentView} onLogin={setSplashUser} />;
  if (currentView === 'adminDashboard') return <AdminDashboard currentUser={currentUser} onLogout={() => { setCurrentUser(null); setCurrentView('login'); }} onNavigate={(view, role) => { if(role) setRegisterRole(role); setCurrentView(view); }} onViewReceipt={(txn) => { setSelectedReceipt(txn); setCurrentView('receipt'); }} />;
  if (currentView === 'adminRegister') return <RegisterScreen defaultRole={registerRole} isAdminAuth={true} onBack={() => setCurrentView('adminDashboard')} />;
  if (currentView === 'register') return <RegisterScreen defaultRole="MEMBER" isAdminAuth={false} onBack={() => setCurrentView('login')} />;
  if (currentView === 'donate') return <DonationPortal onBack={() => setCurrentView('dashboard')} currentUser={currentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setCurrentView('receipt'); }} />;
  if (currentView === 'subscription') return <SubscriptionScreen onBack={() => setCurrentView('dashboard')} currentUser={currentUser} setCurrentUser={setCurrentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setCurrentView('receipt'); }} />;
  if (currentView === 'fundraising') return <FundraisingListScreen onBack={() => setCurrentView('dashboard')} onSelectCampaign={(camp) => { setSelectedCampaign(camp); setCurrentView('campaignDetail'); }} />;
  if (currentView === 'campaignDetail') return <CampaignDetailScreen campaign={selectedCampaign} currentUser={currentUser} onBack={() => setCurrentView('fundraising')} onViewReceipt={(txn) => { setSelectedReceipt(txn); setCurrentView('receipt'); }} />;
  if (currentView === 'receipt') return <ReceiptPage receipt={selectedReceipt} currentUser={currentUser} onBack={() => setCurrentView(currentUser?.role === 'ADMIN' ? 'adminDashboard' : 'dashboard')} />;
  
  return <UserDashboard onNavigate={setCurrentView} onLogout={() => { setCurrentUser(null); setCurrentView('login'); }} currentUser={currentUser} setCurrentUser={setCurrentUser} />;
}

// --// --- LOGIN SCREEN ---
function LoginScreen({ onNavigate, onLogin }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forcePassUser, setForcePassUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = async () => {
    if (!loginId || !password) return alert('Please enter your Official Login ID and password');
    setIsSubmitting(true);
    try {
      // 1. Point directly to the 'members' collection and look for the document matching their ID
      const userRef = doc(db, 'members', loginId.toUpperCase());
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // 2. Check if the passwords match
        if (userData.password === password) {
          if (password === 'Hiywa@123') setForcePassUser(userData);
          else onLogin(userData);
        } else {
          alert('Login Failed: Incorrect Password');
        }
      } else {
        alert('Login Failed: Official ID not found in the database');
      }
    } catch (error) { 
      alert('Login error: ' + error.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 6) return alert('Password must be at least 6 characters long.');
    if (newPassword !== confirmPassword) return alert('Passwords do not match!');
    if (newPassword === 'Hiywa@123') return alert('Choose a different password.');
    setIsSubmitting(true);
    try {
      // 1. Point to the specific user's document
      const userRef = doc(db, 'members', forcePassUser.official_id);
      
      // 2. Update just the password field in Firestore
      await updateDoc(userRef, { password: newPassword });
      
      alert('Password updated successfully!'); 
      onLogin({ ...forcePassUser, password: newPassword }); 
    } catch (error) { 
      alert('Failed to update password: ' + error.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (forcePassUser) {
    return (
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: '#004085' }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }} keyboardShouldPersistTaps="handled">
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>Update Required</Text>
            <Text style={styles.authSubtitle}>You must change your default password to continue.</Text>
            
            <Text style={styles.label}>New Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showNewPassword} value={newPassword} onChangeText={setNewPassword} />
              <TouchableOpacity style={{ position: 'absolute', right: 15, top: 12, zIndex: 1 }} onPress={() => setShowNewPassword(!showNewPassword)}>
                <Text style={{ fontSize: 18 }}>{showNewPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
              <TouchableOpacity style={{ position: 'absolute', right: 15, top: 12, zIndex: 1 }} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text style={{ fontSize: 18 }}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.button} onPress={submitNewPassword} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save & Login</Text>}</TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#004085' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }} keyboardShouldPersistTaps="handled">
        <View style={styles.authCard}>
          <View style={{ alignItems: 'center', marginBottom: 15 }}><Image source={require('./hiywalogo.jpeg')} style={{ width: 80, height: 80, borderRadius: 10 }} resizeMode="contain" /></View>
          <Text style={styles.authTitle}>HIYWA Connect</Text>
          <Text style={styles.authSubtitle}>Secure Member Portal</Text>
          
          <Text style={styles.label}>Official Login ID</Text>
          <TextInput style={styles.input} autoCapitalize="characters" value={loginId} onChangeText={(t) => setLoginId(t.replace(/\s/g, ''))} />
          
          <Text style={styles.label}>Password</Text>
          <View style={{ position: 'relative' }}>
            <TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
            <TouchableOpacity style={{ position: 'absolute', right: 15, top: 12, zIndex: 1 }} onPress={() => setShowPassword(!showPassword)}>
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Secure Login</Text>}</TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => onNavigate('register')}><Text style={{ color: '#007bff', fontWeight: 'bold' }}>New Member? Register Here</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- ADMIN DASHBOARD ---
function AdminDashboard({ currentUser, onLogout, onNavigate, onViewReceipt }) {
  const isCore = currentUser?.is_core_admin;
  const perms = currentUser?.admin_permissions || '[]';
  const hasPerm = (p) => isCore || perms.includes('ALL') || perms.includes(p);

  const defaultTab = isCore ? 'STATS' : (hasPerm('MANAGE_USERS') ? 'USERS' : hasPerm('MANAGE_FINANCE') ? 'FINANCE' : 'CAMPAIGNS');
  const [mainTab, setMainTab] = useState(defaultTab); 
  const [userTab, setUserTab] = useState('MEMBER'); 
  const [viewCampDonors, setViewCampDonors] = useState(null);
  const [financeTab, setFinanceTab] = useState('LEDGER'); 
  
  const [directory, setDirectory] = useState([]);
  const [globalTxns, setGlobalTxns] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [subAmount, setSubAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campTarget, setCampTarget] = useState('');

  const [selectedDetailUser, setSelectedDetailUser] = useState(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);

  const [editParentsDrop, setEditParentsDrop] = useState(false);
  const [editGenderDrop, setEditGenderDrop] = useState(false);
  const [editBloodDrop, setEditBloodDrop] = useState(false);
  const [editMaritalDrop, setEditMaritalDrop] = useState(false);
  const [editNativeDrop, setEditNativeDrop] = useState(false);
  const [editEduDrop, setEditEduDrop] = useState(false);
  const [editClassDrop, setEditClassDrop] = useState(false);
  const [editSchoolTypeDrop, setEditSchoolTypeDrop] = useState(false);
  const [editMediumDrop, setEditMediumDrop] = useState(false);
  const [editIslamicDrop, setEditIslamicDrop] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ blood: '', edu: '', gender: '', native: '', marital: '', status: '', islamic: '' });

  const [showFinFilters, setShowFinFilters] = useState(false);
  const [finSearchQuery, setFinSearchQuery] = useState('');
  const [finTypeFilter, setFinTypeFilter] = useState('');
  const [finStartDate, setFinStartDate] = useState('');
  const [finEndDate, setFinEndDate] = useState('');

  const [subModalVisible, setSubModalVisible] = useState(false);
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);

  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [cashUser, setCashUser] = useState(null);
  const [cashType, setCashType] = useState('SUBSCRIPTION'); 
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [cashMonths, setCashMonths] = useState('1');
  const [cashCampId, setCashCampId] = useState('');

  const [promoteUserId, setPromoteUserId] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState({ MANAGE_USERS: false, MANAGE_FINANCE: false, MANAGE_CAMPAIGNS: false });

  const EDU_CATEGORIES = ['MEDICAL', 'ENGINEERING & IT', 'ARTS & SCIENCE', 'COMMERCE & MANAGEMENT', 'LAW', 'AGRICULTURE', 'DIPLOMA / ITI', 'SCHOOL LEVEL', 'PHD / DOCTORATE', 'OTHERS'];
  const CLASSES = ['1ST STD', '2ND STD', '3RD STD', '4TH STD', '5TH STD', '6TH STD', '7TH STD', '8TH STD', '9TH STD', '10TH STD', '11TH STD', '12TH STD', 'UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'];
  const ISLAMIC_QUALS = ['AALIM', 'HAAFIZH', 'OTHERS'];
  const SCHOOL_TYPES = ['GOVERNMENT SCHOOL', 'GOVERNMENT AIDED SCHOOL', 'PRIVATE SCHOOL'];
  const COLLEGE_TYPES = ['GOVERNMENT COLLEGE', 'PRIVATE COLLEGE', 'GOVT AIDED COLLEGE', 'OTHERS'];
  const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const NATIVE_PLACES = ['MAHARAJAPURAM', 'THAMBIPATTI', 'KRISHNAPURAM', 'OTHERS'];
  const MARITAL_STATUS = ['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'];
  const MEDIUMS = ['TAMIL', 'ENGLISH', 'OTHERS'];

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all registered members directly from Firestore
      if (hasPerm('MANAGE_USERS') || isCore) {
        const membersSnap = await getDocs(collection(db, 'members'));
        const membersList = membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDirectory(membersList);
      }

      // 2. Fetch global transactions and settings from Firestore
      if (hasPerm('MANAGE_FINANCE')) {
        const txnsSnap = await getDocs(collection(db, 'transactions'));
        const txnsList = txnsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGlobalTxns(txnsList);

        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setSubAmount(settingsDoc.data().monthly_subscription_amount || '100');
        }
      }

      // 3. Fetch active fundraising campaigns from Firestore
      if (hasPerm('MANAGE_CAMPAIGNS')) {
        const campSnap = await getDocs(collection(db, 'campaigns'));
        const campList = campSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCampaigns(campList);
      }
    } catch (e) {
      console.error('Firestore Fetch Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleStatus = async (id, currentStatus, overrideTarget = null) => {
    const targetStatus = overrideTarget || (currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    
    const executeToggle = async () => {
      try {
        await secureFetch('/api/admin/toggle-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: id, status: targetStatus }) });
        alert(`Status updated to ${targetStatus}`); setSelectedDetailUser(null); fetchData();
      } catch (error) { alert('Failed to modify status.'); }
    };

    if (overrideTarget === 'DECEASED') {
      Alert.alert(
        "Confirm Deceased Status",
        "Are you sure you want to mark this member as Deceased?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", style: "destructive", onPress: executeToggle }
        ]
      );
    } else {
      executeToggle();
    }
  };

  const handleDemoteAdmin = (id) => {
    Alert.alert(
      "Revoke Admin Rights",
      "Revoke administrative access privileges for this user?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Revoke Access", 
          style: "destructive", 
          onPress: async () => {
            try { await secureFetch('/api/admin/demote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: id }) }); setSelectedDetailUser(null); fetchData(); } catch (e) { alert('Failed to revoke.'); }
          }
        }
      ]
    );
  };

  const handleConvertStudent = (id) => {
    Alert.alert(
      "Upgrade Student",
      "Upgrade this student registration to a full operational Member profile?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Upgrade Profile", 
          onPress: async () => {
            try { const res = await secureFetch('/api/admin/convert-student', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: id }) }); alert((await res.json()).message); setSelectedDetailUser(null); fetchData(); } catch (e) { alert('Failed to convert.'); }
          }
        }
      ]
    );
  };

  const openPromoteModal = (id) => { setPromoteUserId(id); setSelectedPerms({ MANAGE_USERS: false, MANAGE_FINANCE: false, MANAGE_CAMPAIGNS: false }); setPromoteModalVisible(true); };

  const submitPromotion = async () => {
    const permsArray = [];
    if (selectedPerms.MANAGE_USERS) permsArray.push("MANAGE_USERS");
    if (selectedPerms.MANAGE_FINANCE) permsArray.push("MANAGE_FINANCE");
    if (selectedPerms.MANAGE_CAMPAIGNS) permsArray.push("MANAGE_CAMPAIGNS");
    if (permsArray.length === 0) return alert("Select at least one permission.");
    try {
      await secureFetch('/api/admin/promote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: promoteUserId, permissions: JSON.stringify(permsArray) }) });
      alert('Promoted to Sub-Admin successfully!'); setPromoteModalVisible(false); setSelectedDetailUser(null); fetchData();
    } catch (e) { alert('Failed to promote.'); }
  };

  

  const saveEditedUser = async () => {
    try {
      const userRef = doc(db, 'members', selectedDetailUser.official_id);
      await updateDoc(userRef, editFormData);
      alert('Details updated in Firebase!');
      setIsEditingUser(false);
      setSelectedDetailUser(null);
      fetchData();
    } catch (e) {
      alert('Error updating user: ' + e.message);
    }
  };

  const resetUserPasswordAdmin = async () => {
    try {
      const response = await secureFetch('/api/update-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: selectedDetailUser.member_id, new_password: 'Hiywa@123' }) });
      if (response.ok) { alert('User Password reset successfully to default: Hiywa@123'); setResetModalVisible(false); } else alert('Failed to reset password.');
    } catch (error) { alert('Connection error.'); }
  };

  const uploadPhotoForUser = async (id) => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (!result.canceled) {
      const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try { await secureFetch('/api/update-profile-photo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: id, profile_photo: b64 }) }); alert('Photo uploaded!'); setSelectedDetailUser({...selectedDetailUser, profile_photo: b64}); fetchData(); } catch (e) { alert('Error saving photo.'); }
    }
  };

  const openCashModal = (user) => { setCashUser(user); setCashType('SUBSCRIPTION'); setCashMonths('1'); setCashAmount(String(1 * Number(subAmount || 0))); setCashReason(''); setCashCampId(''); setCashModalVisible(true); };
  const handleCashTypeChange = (type) => { setCashType(type); if(type === 'SUBSCRIPTION') setCashAmount(String(Number(cashMonths || 1) * Number(subAmount || 0))); else setCashAmount(''); };
  const handleCashMonthsChange = (val) => { setCashMonths(val); if(cashType === 'SUBSCRIPTION') setCashAmount(String(Number(val || 0) * Number(subAmount || 0))); };

  const submitCashPayment = async () => {
    if (!cashAmount || isNaN(cashAmount) || Number(cashAmount) <= 0) return alert('Enter valid amount.');
    const endpoint = cashType === 'CAMPAIGN' ? '/api/donate-campaign' : '/api/donate';
    const txnId = `CASH_${Date.now()}`;
    let payload = { member_id: cashUser.member_id, amount: cashAmount, payment_method: 'CASH (OFFLINE)', gateway_txn_id: txnId };

    if (cashType === 'SUBSCRIPTION') { payload.donation_type = 'SUBSCRIPTION'; payload.months_count = cashMonths; payload.reason = 'OFFLINE CASH SUBSCRIPTION'; } 
    else if (cashType === 'GENERAL') { if (!cashReason) return alert('Reason is required.'); payload.donation_type = 'GENERAL'; payload.reason = cashReason; payload.months_count = 0; } 
    else if (cashType === 'CAMPAIGN') { if (!cashCampId) return alert('Select campaign ID.'); const cName = campaigns.find(c=>c.campaign_id == cashCampId)?.title || 'Campaign'; payload.campaign_id = cashCampId; payload.reason = `Cash Support: ${cName}`; payload.donation_type = 'FUND_RAISING'; }

    try {
      const res = await fetch(`https://hiywa-api.onrender.com${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { alert('Offline cash payment logged successfully! Generating Receipt...'); setCashModalVisible(false); fetchData(); onViewReceipt({ transaction_date: new Date().toISOString(), transaction_id: txnId, donation_type: payload.donation_type, amount: payload.amount, reason: payload.reason, months_count: payload.months_count || 0, payment_method: 'CASH (OFFLINE)', official_id: cashUser.official_id, full_name: cashUser.full_name }); } else alert('Failed to log payment.');
    } catch (e) { alert('Connection error.'); }
  };

  const updateSubAmount = async () => {
    try { await secureFetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: subAmount }) }); alert('Monthly Subscription Target Updated!'); setSubModalVisible(false); fetchData(); } catch (e) { alert('Failed to update settings.'); }
  };

  const handleCreateCampaign = async () => {
    if (!campTitle || !campDesc || !campTarget) return alert('All campaign fields required.');
    try { await secureFetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: campTitle.toUpperCase(), description: campDesc, target_amount: campTarget }) }); alert('Campaign Published!'); setCampTitle(''); setCampDesc(''); setCampTarget(''); fetchData(); } catch (e) { alert('Failed to create campaign.'); }
  };

  const downloadCSV = async (csvString, filename) => {
    if (Platform.OS === 'web') {
      try { const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } else window.open(encodeURI("data:text/csv;charset=utf-8," + csvString)); } catch (e) { alert("Browser blocked the download."); }
    } else {
      try { const uri = FileSystem.documentDirectory + filename; await FileSystem.writeAsStringAsync(uri, csvString, { encoding: FileSystem.EncodingType.UTF8 }); await Sharing.shareAsync(uri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' }); } catch (e) { alert("Export failed on mobile."); }
    }
  };

  const printIDCard = async (user) => {
    const age = user.dob ? (new Date().getFullYear() - new Date(user.dob).getFullYear()) : 'N/A';
    const photoSrc = user.profile_photo || 'https://via.placeholder.com/150';

    let logoUrl = '';
    
    try {
      // 1. Grab the local image
      const asset = Asset.fromModule(require('./hiywalogo.jpeg'));
      await asset.downloadAsync();
      
      // 2. Read the image and convert it to Base64 data
      const base64Logo = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // 3. Format it for the HTML string
      logoUrl = `data:image/jpeg;base64,${base64Logo}`;
    } catch (error) {
      console.log("Could not load local logo for ID Card PDF", error);
      logoUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; 
    }

    const html = `<html><head><style>body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; background: #f0f2f5; padding: 20px;} .card { width: 320px; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.2); text-align: center; border: 2px solid #004085; position: relative;} .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; width: 250px; z-index: 0; pointer-events: none;} .content-layer { position: relative; z-index: 1;} .header { background: #004085; color: white; padding: 15px 10px; } .header-title { font-size: 26px; font-weight: bold; letter-spacing: 1px; margin-bottom: 3px;} .header-sub { font-size: 11px; font-weight: bold;} .photo { width: 120px; height: 120px; border-radius: 50%; border: 4px solid #ffc107; margin: 20px auto 10px auto; object-fit: cover; } .name { font-size: 22px; font-weight: bold; color: #333; margin-bottom: 5px; text-transform: uppercase;} .id { font-size: 18px; color: #004085; font-weight: bold; margin-bottom: 15px;} .details { text-align: left; padding: 0 20px 20px 20px; font-size: 14px; color: #555;} .details div { padding: 5px 0; border-bottom: 1px solid #eee; }</style></head><body><div class="card" id="ic-card"><img src="${logoUrl}" class="watermark" /><div class="content-layer"><div class="header"><div class="header-title">HIYWA</div><div class="header-sub">Hidhayathul Islam Youth Welfare Trust</div></div><img src="${photoSrc}" class="photo" /><div class="name">${user.full_name}</div><div class="id">${user.official_id}</div><div class="details"><div><b>Role:</b> ${user.role}</div><div><b>Age / Blood Group:</b> ${age} / ${user.blood_group || 'N/A'}</div><div><b>Phone:</b> ${user.phone_number}</div><div><b>Native:</b> ${user.native_place}</div></div></div></div></body></html>`;    
    
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html); printWindow.document.close(); printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch(e) { alert("Failed to generate PDF"); }
  };

  const stats = { roles: {}, bloodGroups: {}, marital: {}, education: {}, native: {}, gender: {} };
  const incrementStat = (cat, val, role) => { if (!val) return; if (!stats[cat][val]) stats[cat][val] = { total: 0, M: 0, S: 0 }; stats[cat][val].total += 1; if (role === 'STUDENT') stats[cat][val].S += 1; else stats[cat][val].M += 1; };
  directory.filter(u => !u.is_core_admin).forEach(u => { stats.roles[u.role] = (stats.roles[u.role] || 0) + 1; incrementStat('bloodGroups', u.blood_group, u.role); incrementStat('marital', u.marital_status, u.role); incrementStat('education', u.educational_qualification, u.role); incrementStat('native', u.native_place, u.role); incrementStat('gender', u.gender, u.role); });

  const renderSplitBlocks = (statObj) => Object.entries(statObj).sort((a,b)=>b[1].total-a[1].total).map(([key, val]) => (
    <View key={key} style={[styles.statChip, { flexDirection: 'column', alignItems: 'flex-start' }]}><View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}><Text style={styles.statChipKey} numberOfLines={1}>{key}</Text><Text style={styles.statChipVal}>{val.total}</Text></View><Text style={{ fontSize: 10, color: '#666', marginTop: 4, fontWeight: 'bold' }}>Members: {val.M} | Students: {val.S}</Text></View>
  ));

  const filteredDirectory = directory.filter(u => {
    if (userTab === 'MEMBER') return u.role === 'MEMBER' || (u.role === 'ADMIN' && !u.is_core_admin); 
    if (userTab === 'STUDENT') return u.role === 'STUDENT';
    if (userTab === 'ADMIN') return u.role === 'ADMIN'; return true;
  }).filter(u => !searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.official_id?.toLowerCase().includes(searchQuery.toLowerCase()))
  .filter(u => !filters.status || u.membership_status === filters.status).filter(u => !filters.blood || u.blood_group === filters.blood).filter(u => !filters.gender || u.gender === filters.gender).filter(u => !filters.edu || u.educational_qualification === filters.edu).filter(u => !filters.islamic || u.islamic_qualification === filters.islamic).filter(u => !filters.native || u.native_place === filters.native).filter(u => !filters.marital || u.marital_status === filters.marital);

  const filteredTxns = globalTxns.filter(t => {
    if (finStartDate && new Date(t.transaction_date).getTime() < new Date(finStartDate).getTime()) return false;
    if (finEndDate && new Date(t.transaction_date).getTime() > new Date(finEndDate).getTime() + 86400000) return false;
    if (finTypeFilter) { if (finTypeFilter === 'FUND_RAISING' && t.donation_type !== 'FUND_RAISING' && t.donation_type !== 'CAMPAIGN') return false; if (finTypeFilter !== 'FUND_RAISING' && t.donation_type !== finTypeFilter) return false; }
    if (finSearchQuery) { const q = finSearchQuery.toLowerCase(); const strTxnId = t.transaction_id ? String(t.transaction_id) : ''; if (!t.full_name?.toLowerCase().includes(q) && !strTxnId.toLowerCase().includes(q) && !t.reason?.toLowerCase().includes(q)) return false; }
    return true;
  });

  const pendingDuesList = directory.filter(u => !u.is_core_admin && (u.role === 'MEMBER' || u.role === 'ADMIN') && u.membership_status === 'ACTIVE').map(u => {
    const joinDate = u.join_date ? new Date(u.join_date) : new Date(); const currentDate = new Date();
    const monthsSinceJoined = ((currentDate.getFullYear() - joinDate.getFullYear()) * 12) + (currentDate.getMonth() - joinDate.getMonth()) + 1; 
    const totalPaid = parseInt(u.total_months_paid) || 0; const dues = monthsSinceJoined - totalPaid;
    return { ...u, duesMonths: dues, duesAmount: dues * Number(subAmount || 0) };
  }).filter(u => u.duesMonths > 0).sort((a,b) => b.duesMonths - a.duesMonths);

  const totalFinSubs = filteredTxns.filter(t=>t.donation_type==='SUBSCRIPTION').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalFinGen = filteredTxns.filter(t=>t.donation_type==='GENERAL').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalFinCamp = filteredTxns.filter(t=>t.donation_type==='FUND_RAISING' || t.donation_type==='CAMPAIGN').reduce((sum, t) => sum + Number(t.amount), 0);

  let cashDuesText = ''; let cashDuesColor = '#333';
  if (cashUser) {
    const jDate = cashUser.join_date ? new Date(cashUser.join_date) : new Date(); const currDate = new Date();
    const mJoined = ((currDate.getFullYear() - jDate.getFullYear()) * 12) + (currDate.getMonth() - jDate.getMonth()) + 1; 
    const tPaid = parseInt(cashUser.total_months_paid) || 0; const adv = tPaid - mJoined;
    let nDate = new Date(jDate); nDate.setMonth(nDate.getMonth() + tPaid); const nDateStr = nDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (adv < 0) { cashDuesText = `⚠️ Pending Dues: ${Math.abs(adv)} Month(s)`; cashDuesColor = '#dc3545'; } 
    else if (adv === 0) { cashDuesText = `✅ Up to date (Next due: ${nDateStr})`; cashDuesColor = '#28a745'; } 
    else { cashDuesText = `🌟 Paid in Advance: ${adv} Month(s) (Valid till: ${nDateStr})`; cashDuesColor = '#17a2b8'; }
  }

  const exportDirectoryBtn = () => {
    try {
      const header = "Official ID,Role,Status,Full Name,Phone,Gender,Blood Group,Native Place,Education,Marital Status,Job\n";
      const rows = filteredDirectory.map(u => `"${u.official_id || ''}","${u.role || ''}","${u.membership_status || ''}","${u.full_name || ''}","${u.phone_number || ''}","${u.gender || ''}","${u.blood_group || ''}","${u.native_place || ''}","${u.educational_qualification || ''}","${u.marital_status || ''}","${u.occupation || ''}"`).join("\n");
      downloadCSV(header + rows, "HIYWA_Directory.csv");
    } catch(e) { alert("Error preparing Directory Data."); }
  };

  const exportLedgerBtn = () => {
    try {
      if (filteredTxns.length === 0) return alert("No transactions to export for this period.");
      const header = "Date,Txn ID,Member Name,Role,Type,Amount,Method,Reason\n";
      const rows = filteredTxns.map(t => {
        const dateStr = t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "N/A";
        return `"${dateStr}","${t.transaction_id || ''}","${t.full_name || ''}","${t.role || ''}","${t.donation_type || ''}","${t.amount || '0'}","${t.payment_method || ''}","${t.reason || ''}"`;
      }).join("\n");
      downloadCSV(header + rows, "HIYWA_Finance_Ledger.csv");
    } catch(e) { alert("Error preparing Finance Data: " + e.message); }
  };

  const exportDuesBtn = () => {
    try {
      const header = "Official ID,Full Name,Phone,Native Place,Months Pending,Total Dues (INR)\n";
      const rows = pendingDuesList.map(u => `"${u.official_id || ''}","${u.full_name || ''}","${u.phone_number || ''}","${u.native_place || ''}","${u.duesMonths || '0'}","${u.duesAmount || '0'}"`).join("\n");
      downloadCSV(header + rows, "HIYWA_Pending_Dues.csv");
    } catch(e) { alert("Error preparing Dues Data."); }
  };

  const renderUserDetail = () => {
    const u = selectedDetailUser;
    const isPromotedSubAdmin = u.role === 'ADMIN' && !u.is_core_admin;
    const age = u.dob ? (new Date().getFullYear() - new Date(u.dob).getFullYear()) : 'Unknown';
    const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editFormData.class_grade);

    if (showIdCardModal) {
      return (
        <View style={{alignItems: 'center', marginBottom: 20}}>
          <TouchableOpacity style={[styles.neatBtnDark, {alignSelf: 'flex-start', marginBottom: 20}]} onPress={() => setShowIdCardModal(false)}><Text style={styles.neatBtnText}>← Back to Profile</Text></TouchableOpacity>
          <View style={styles.idCardContainer}>
             <View style={{zIndex: 1}}>
                 <View style={styles.idCardHeader}>
                    <Image source={require('./hiywalogo.jpeg')} style={{ width: 45, height: 45, position: 'absolute', top: 12, right: 10, borderRadius: 8 }} resizeMode="contain" />
                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 22, textAlign: 'center', letterSpacing: 1, marginBottom: 2}}>HIYWA</Text>
                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11, textAlign: 'center'}}>Hidhayathul Islam Youth Welfare Trust</Text>
                 </View>
                 <View style={{padding: 20, alignItems: 'center'}}>
                    {u.profile_photo ? <Image source={{uri: u.profile_photo}} style={styles.idCardPhoto} /> : <View style={[styles.idCardPhoto, {backgroundColor: '#ccc', justifyContent:'center', alignItems:'center'}]}><Text style={{fontSize:40}}>👤</Text></View>}
                    <Text style={{fontSize: 22, fontWeight: 'bold', color: '#004085', marginTop: 10}}>{u.full_name}</Text>
                    <Text style={{fontSize: 16, color: '#333', fontWeight: 'bold', marginTop: 5}}>ID: {u.official_id}</Text>
                    <View style={{marginTop: 15, width: '100%', alignItems: 'flex-start'}}>
                       <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Role:</b> {u.role}</Text>
                       <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Age / Blood:</b> {age} / {u.blood_group || 'N/A'}</Text>
                       <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Phone:</b> {u.phone_number}</Text>
                    </View>
                 </View>
             </View>
          </View>
          <TouchableOpacity style={[styles.button, {marginTop: 20, width: 320}]} onPress={() => printIDCard(u)}><Text style={styles.buttonText}>🖨️ Download / Share</Text></TouchableOpacity>
        </View>
      );
    }

    if (isEditingUser) {
      const formattedDob = editFormData.dob ? (() => { try { const d = new Date(editFormData.dob); return isNaN(d) ? editFormData.dob : d.toISOString().split('T')[0]; } catch(e){ return editFormData.dob; }})() : '';
      const displayAadhaar = editFormData.aadhaar_number || editFormData.aadhar_number || '';

      return (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit Details for {u.full_name}</Text>
          
          <Text style={styles.label}>Personal Details</Text>
          <Text style={styles.filterLabel}>Full Name</Text>
          <TextInput style={styles.input} value={editFormData.full_name || ''} onChangeText={t=>setEditFormData({...editFormData, full_name: t})} placeholder="Full Name" />
          <Text style={styles.filterLabel}>Father's Name</Text>
          <TextInput style={styles.input} value={editFormData.father_name || ''} onChangeText={t=>setEditFormData({...editFormData, father_name: t})} placeholder="Father's Name" />
          
          <Text style={styles.label}>Mother's Name</Text>
          <TextInput style={styles.input} autoCapitalize="characters" value={editFormData.mother_name} onChangeText={(t) => setEditFormData({...editFormData, mother_name: t})} />

          <Text style={styles.label}>Parents Status (Admin Edit)</Text>
          <Text style={styles.label}>Parents Status</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditParentsDrop(!editParentsDrop)}>
            <Text style={styles.dropdownBtnText}>{editFormData.parents_status || 'SELECT STATUS'}</Text>
          </TouchableOpacity>
          {editParentsDrop && (
            <View style={styles.dropdownList}>
              {['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED'].map((s) => (
                <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => { setEditFormData({...editFormData, parents_status: s}); setEditParentsDrop(false); }}>
                  <Text style={styles.dropdownItemText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <Text style={styles.filterLabel}>Gender</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditGenderDrop(!editGenderDrop)}><Text style={styles.dropdownBtnText}>{editFormData.gender || 'Select Gender'}</Text></TouchableOpacity>
          {editGenderDrop && <View style={styles.dropdownList}>{GENDERS.map(g => <TouchableOpacity key={g} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, gender: g}); setEditGenderDrop(false);}}><Text style={styles.dropdownItemText}>{g}</Text></TouchableOpacity>)}</View>}
          
          <Text style={styles.filterLabel}>Date of Birth</Text>
          {Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formattedDob} onChange={(e) => setEditFormData({...editFormData, dob: e.target.value})} /> : <TextInput style={styles.input} value={formattedDob} onChangeText={t=>setEditFormData({...editFormData, dob: t})} placeholder="DOB (YYYY-MM-DD)" />}
          
          <Text style={styles.filterLabel}>Blood Group</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditBloodDrop(!editBloodDrop)}><Text style={styles.dropdownBtnText}>{editFormData.blood_group || 'Select Blood Group'}</Text></TouchableOpacity>
          {editBloodDrop && <View style={styles.dropdownList}>{BLOOD_GROUPS.map(bg => <TouchableOpacity key={bg} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, blood_group: bg}); setEditBloodDrop(false);}}><Text style={styles.dropdownItemText}>{bg}</Text></TouchableOpacity>)}</View>}
          
          <Text style={styles.filterLabel}>Marital Status</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditMaritalDrop(!editMaritalDrop)}><Text style={styles.dropdownBtnText}>{editFormData.marital_status || 'Select Marital Status'}</Text></TouchableOpacity>
          {editMaritalDrop && <View style={styles.dropdownList}>{MARITAL_STATUS.map(ms => <TouchableOpacity key={ms} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, marital_status: ms}); setEditMaritalDrop(false);}}><Text style={styles.dropdownItemText}>{ms}</Text></TouchableOpacity>)}</View>}

          <Text style={styles.filterLabel}>Aadhaar Number (12 Digits)</Text>
          <TextInput style={styles.input} value={displayAadhaar} onChangeText={t=>setEditFormData({...editFormData, aadhaar_number: t})} keyboardType="numeric" maxLength={12} placeholder="Aadhaar Number" />

          <Text style={styles.label}>Contact & Location</Text>
          <Text style={styles.filterLabel}>Phone Number</Text>
          <TextInput style={styles.input} value={editFormData.phone_number || ''} onChangeText={t=>setEditFormData({...editFormData, phone_number: t})} keyboardType="numeric" placeholder="Phone Number" />
          <Text style={styles.filterLabel}>WhatsApp Number</Text>
          <TextInput style={styles.input} value={editFormData.whatsapp_number || ''} onChangeText={t=>setEditFormData({...editFormData, whatsapp_number: t})} keyboardType="numeric" placeholder="WhatsApp Number" />
          <Text style={styles.filterLabel}>Email</Text>
          <TextInput style={styles.input} value={editFormData.email || ''} onChangeText={t=>setEditFormData({...editFormData, email: t})} placeholder="Email" />
          <Text style={styles.filterLabel}>Native Place</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditNativeDrop(!editNativeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.native_place || 'Select Native Place'}</Text></TouchableOpacity>
          {editNativeDrop && <View style={styles.dropdownList}>{NATIVE_PLACES.map(np => <TouchableOpacity key={np} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, native_place: np}); setEditNativeDrop(false);}}><Text style={styles.dropdownItemText}>{np}</Text></TouchableOpacity>)}</View>}
          <Text style={styles.filterLabel}>Current Location</Text>
          <TextInput style={styles.input} value={editFormData.current_location || ''} onChangeText={t=>setEditFormData({...editFormData, current_location: t})} placeholder="Current Location" />
          <Text style={styles.filterLabel}>Full Address</Text>
          <TextInput style={[styles.input, {height: 60}]} multiline value={editFormData.address || ''} onChangeText={t=>setEditFormData({...editFormData, address: t})} placeholder="Full Address" />
          
          <Text style={styles.label}>Education & Occupation</Text>
          {u.role === 'MEMBER' && (
             <View>
               <Text style={styles.filterLabel}>Education Category</Text>
               <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'Select Education'}</Text></TouchableOpacity>
               {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, educational_qualification: el}); setEditEduDrop(false);}}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
               <Text style={styles.filterLabel}>Course / Major</Text>
               <TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} placeholder="Course / Major" />
               <Text style={styles.filterLabel}>Occupation / Job</Text>
               <TextInput style={styles.input} value={editFormData.occupation || ''} onChangeText={t=>setEditFormData({...editFormData, occupation: t})} placeholder="Occupation / Job" />
             </View>
          )}
          {u.role === 'STUDENT' && (
             <View>
               <Text style={styles.filterLabel}>Class / Grade</Text>
               <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditClassDrop(!editClassDrop)}><Text style={styles.dropdownBtnText}>{editFormData.class_grade || 'Select Class / Grade'}</Text></TouchableOpacity>
               {editClassDrop && <View style={styles.dropdownList}><ScrollView nestedScrollEnabled style={{maxHeight: 200}}>{CLASSES.map(c => <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, class_grade: c}); setEditClassDrop(false);}}><Text style={styles.dropdownItemText}>{c}</Text></TouchableOpacity>)}</ScrollView></View>}
               
               <Text style={styles.filterLabel}>School / College Name</Text>
               <TextInput style={styles.input} value={editFormData.school_name || ''} onChangeText={t=>setEditFormData({...editFormData, school_name: t})} placeholder="Institution Name" />
               
               <Text style={styles.filterLabel}>Institution Type</Text>
               <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditSchoolTypeDrop(!editSchoolTypeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.school_type || 'Select Institution Type'}</Text></TouchableOpacity>
               {editSchoolTypeDrop && <View style={styles.dropdownList}>{(isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES).map(st => <TouchableOpacity key={st} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, school_type: st}); setEditSchoolTypeDrop(false);}}><Text style={styles.dropdownItemText}>{st}</Text></TouchableOpacity>)}</View>}
               
               <Text style={styles.filterLabel}>Institution Location</Text>
               <TextInput style={styles.input} value={editFormData.school_location || ''} onChangeText={t=>setEditFormData({...editFormData, school_location: t})} placeholder="Institution Location" />
               
               <Text style={styles.filterLabel}>Medium of Instruction</Text>
               <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditMediumDrop(!editMediumDrop)}><Text style={styles.dropdownBtnText}>{editFormData.medium_of_instruction || 'Select Medium'}</Text></TouchableOpacity>
               {editMediumDrop && <View style={styles.dropdownList}>{MEDIUMS.map(md => <TouchableOpacity key={md} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, medium_of_instruction: md}); setEditMediumDrop(false);}}><Text style={styles.dropdownItemText}>{md}</Text></TouchableOpacity>)}</View>}

               {isCollegeEdit && (
                 <View>
                   <Text style={styles.filterLabel}>Education Category</Text>
                   <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'Select Category'}</Text></TouchableOpacity>
                   {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, educational_qualification: el}); setEditEduDrop(false);}}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
                   <Text style={styles.filterLabel}>Course / Major Details</Text>
                   <TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} placeholder="Course / Major" />
                 </View>
               )}
             </View>
          )}

          <Text style={styles.label}>Islamic Studies</Text>
          <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
             <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='YES' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'YES'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='YES' && {color:'white'}]}>Yes</Text></TouchableOpacity>
             <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='NO' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'NO'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='NO' && {color:'white'}]}>No</Text></TouchableOpacity>
          </View>
          {editFormData.islamic_studies === 'YES' && (
            <View style={{padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 15}}>
              <Text style={styles.filterLabel}>Qualification</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditIslamicDrop(!editIslamicDrop)}><Text style={styles.dropdownBtnText}>{editFormData.islamic_qualification || 'Select Qualification'}</Text></TouchableOpacity>
              {editIslamicDrop && <View style={styles.dropdownList}>{ISLAMIC_QUALS.map(iq => <TouchableOpacity key={iq} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, islamic_qualification: iq}); setEditIslamicDrop(false);}}><Text style={styles.dropdownItemText}>{iq}</Text></TouchableOpacity>)}</View>}
              
              {editFormData.islamic_qualification === 'OTHERS' && (
                <View>
                  <Text style={styles.filterLabel}>Specify Other Qualification</Text>
                  <TextInput style={styles.input} value={editFormData.islamic_qualification || ''} onChangeText={t=>setEditFormData({...editFormData, islamic_qualification: t})} placeholder="Specify Other" />
                </View>
              )}
              
              <Text style={styles.filterLabel}>Madrasa Name</Text>
              <TextInput style={styles.input} value={editFormData.madrasa_name || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_name: t})} placeholder="Madrasa Name" />
              <Text style={styles.filterLabel}>Madrasa Location</Text>
              <TextInput style={styles.input} value={editFormData.madrasa_location || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_location: t})} placeholder="Madrasa Location" />
            </View>
          )}

          <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 10}}>
             <TouchableOpacity style={styles.neatBtnDark} onPress={() => setIsEditingUser(false)}><Text style={styles.neatBtnText}>Cancel</Text></TouchableOpacity>
             <TouchableOpacity style={styles.neatBtnSuccess} onPress={saveEditedUser}><Text style={styles.neatBtnText}>💾 Save All Details</Text></TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.formCard}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
          <TouchableOpacity style={styles.neatBtnDark} onPress={() => setSelectedDetailUser(null)}><Text style={styles.neatBtnText}>← Back to List</Text></TouchableOpacity>
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setShowIdCardModal(true)}><Text style={styles.neatBtnText}>🪪 ID Card</Text></TouchableOpacity>
            <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => {setEditFormData(u); setIsEditingUser(true);}}><Text style={styles.neatBtnText}>✏️ Edit Profile</Text></TouchableOpacity>
          </View>
        </View>

        <View style={{flexDirection: 'row', gap: 20, flexWrap: 'wrap'}}>
          <View style={{alignItems: 'center', marginBottom: 15}}>
             {u.profile_photo ? (
               <Image source={{uri: u.profile_photo}} style={{width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: '#004085'}} />
             ) : (
               <View style={{width: 150, height: 150, borderRadius: 75, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center'}}><Text style={{fontSize: 50}}>👤</Text></View>
             )}
             <TouchableOpacity style={{marginTop: 10}} onPress={() => uploadPhotoForUser(u.member_id)}><Text style={{color: '#007bff', fontWeight: 'bold'}}>Change Photo</Text></TouchableOpacity>
          </View>

          <View style={{flex: 1, minWidth: 250}}>
             <Text style={{fontSize: 26, fontWeight: 'bold', color: '#004085'}}>{u.full_name} {u.is_core_admin && '👑'} {isPromotedSubAdmin && '⭐'}</Text>
             <Text style={{fontSize: 16, color: '#555', marginBottom: 10}}>Official ID: <Text style={{fontWeight: 'bold', color: '#000'}}>{u.official_id}</Text></Text>
             
             <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 15}}>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Status: {u.membership_status}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Age: {age}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Blood: {u.blood_group || 'N/A'}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Role: {u.role}</Text></View>
             </View>

             <View style={{backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#eee'}}>
                <Text style={{fontWeight: 'bold', marginBottom: 5}}>Contact & Background</Text>
                <Text style={styles.detailTxt}>📞 Phone: {u.phone_number} / {u.whatsapp_number}</Text>
                <Text style={styles.detailTxt}>📍 Native: {u.native_place}</Text>
                <Text style={styles.detailTxt}>🏠 Address: {u.address}</Text>
                {u.role === 'MEMBER' && <Text style={styles.detailTxt}>💼 Job: {u.occupation}</Text>}
                {u.role === 'STUDENT' && <Text style={styles.detailTxt}>🎓 Class: {u.class_grade} ({u.school_name})</Text>}
                
                {u.islamic_studies === 'YES' && (
                  <View style={{marginTop: 10, padding: 10, backgroundColor: '#e2e3e5', borderRadius: 5}}>
                    <Text style={{fontWeight: 'bold', color: '#383d41'}}>Islamic Studies Background</Text>
                    <Text style={styles.detailTxt}>Qualification: {u.islamic_qualification}</Text>
                    <Text style={styles.detailTxt}>Madrasa: {u.madrasa_name} ({u.madrasa_location})</Text>
                  </View>
                )}
             </View>
          </View>
        </View>

        <View style={{marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee'}}>
           <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 15}}>Administrative Actions</Text>
           <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
             
             {hasPerm('MANAGE_FINANCE') && u.role !== 'STUDENT' && u.membership_status === 'ACTIVE' && (
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#ffc107', paddingVertical: 10}]} onPress={() => openCashModal(u)}><Text style={[styles.actionBtnText, {color: '#000', fontSize: 15}]}>💵 Log Cash Payment</Text></TouchableOpacity>
             )}

             {isCore && !u.is_core_admin && (
                <>
                  <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#dc3545', paddingVertical: 10}]} onPress={() => setResetModalVisible(true)}><Text style={[styles.actionBtnText, {color: 'white', fontSize: 15}]}>🔑 Reset Password</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, {backgroundColor: u.membership_status === 'ACTIVE' ? '#fd7e14' : '#28a745', paddingVertical: 10}]} onPress={() => handleToggleStatus(u.member_id, u.membership_status)}>
                    <Text style={[styles.actionBtnText, {color: 'white', fontSize: 15}]}>{u.membership_status === 'ACTIVE' ? '🚫 Deactivate' : '⚡ Activate'}</Text>
                  </TouchableOpacity>

                  {u.role === 'MEMBER' && !isPromotedSubAdmin && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#17a2b8', paddingVertical: 10}]} onPress={() => openPromoteModal(u.member_id)}>
                      <Text style={[styles.actionBtnText, {color: 'white', fontSize: 15}]}>⭐ Promote to Admin</Text>
                    </TouchableOpacity>
                  )}
                  {isPromotedSubAdmin && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#dc3545', paddingVertical: 10}]} onPress={() => handleDemoteAdmin(u.member_id)}>
                      <Text style={[styles.actionBtnText, {color: 'white', fontSize: 15}]}>❌ Revoke Admin</Text>
                    </TouchableOpacity>
                  )}
                  {u.role === 'STUDENT' && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#004085', paddingVertical: 10}]} onPress={() => handleConvertStudent(u.member_id)}>
                      <Text style={[styles.actionBtnText, {color: 'white', fontSize: 15}]}>🎓 Convert to Member</Text>
                    </TouchableOpacity>
                  )}
                </>
             )}
           </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#004085', padding: 15, paddingTop: Platform.OS === 'ios' ? 40 : 15, elevation: 4 }}>
        
        {/* SMALL BUTTONS ON THE LEFT */}
        <View style={{ flexDirection: 'row', marginRight: 15 }}>
          <TouchableOpacity onPress={onLogout} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#dc3545', borderRadius: 6, marginRight: 8 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>🚪 Logout</Text>
          </TouchableOpacity>
          
          {!isCore && (
            <TouchableOpacity onPress={() => onNavigate('dashboard')} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#28a745', borderRadius: 6 }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>👤 Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TITLE */}
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', flex: 1 }} numberOfLines={1}>HIYWA Admin Control Panel</Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: '#002752' }}>
        {isCore && <TouchableOpacity style={{ flex: 1, paddingVertical: 15, paddingHorizontal: 5, borderBottomWidth: 3, borderBottomColor: mainTab === 'STATS' ? '#28a745' : 'transparent' }} onPress={() => {setMainTab('STATS'); setSelectedDetailUser(null);}}><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 11 }}>DASHBOARD</Text></TouchableOpacity>}
        {hasPerm('MANAGE_USERS') && <TouchableOpacity style={{ flex: 1, paddingVertical: 15, paddingHorizontal: 5, borderBottomWidth: 3, borderBottomColor: mainTab === 'USERS' ? '#28a745' : 'transparent' }} onPress={() => {setMainTab('USERS'); setSelectedDetailUser(null);}}><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 11 }}>USERS</Text></TouchableOpacity>}
        {hasPerm('MANAGE_FINANCE') && <TouchableOpacity style={{ flex: 1, paddingVertical: 15, paddingHorizontal: 5, borderBottomWidth: 3, borderBottomColor: mainTab === 'FINANCE' ? '#28a745' : 'transparent' }} onPress={() => {setMainTab('FINANCE'); setSelectedDetailUser(null);}}><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 11 }}>FINANCE</Text></TouchableOpacity>}
        {hasPerm('MANAGE_CAMPAIGNS') && <TouchableOpacity style={{ flex: 1, paddingVertical: 15, paddingHorizontal: 5, borderBottomWidth: 3, borderBottomColor: mainTab === 'CAMPAIGNS' ? '#28a745' : 'transparent' }} onPress={() => {setMainTab('CAMPAIGNS'); setSelectedDetailUser(null);}}><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 11 }}>CAMPAIGNS</Text></TouchableOpacity>}
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {selectedDetailUser ? renderUserDetail() : (
          <>
            {/* ================= STATS TAB ================= */}
            {mainTab === 'STATS' && isCore && (
              <View>
                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>Segregation Overview</Text>
                  <View style={styles.statGrid}>
                    <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>{(directory.filter(u=>(u.role==='MEMBER'||u.role==='ADMIN') && !u.is_core_admin).length)}</Text><Text style={styles.statLargeKey}>Total Members</Text></View>
                    <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>{directory.filter(u=>u.role==='STUDENT').length}</Text><Text style={styles.statLargeKey}>Total Students</Text></View>
                    <View style={[styles.statBoxLarge, { backgroundColor: '#28a745' }]}><Text style={styles.statLargeVal}>{directory.filter(u=>!u.is_core_admin).length}</Text><Text style={styles.statLargeKey}>Grand Total</Text></View>
                  </View>
                </View>
                <View style={styles.formCard}><Text style={styles.sectionTitle}>Native Place Distribution</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.native)}</View></View>
                <View style={styles.formCard}><Text style={styles.sectionTitle}>Gender Distribution</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.gender)}</View></View>
                <View style={styles.formCard}><Text style={styles.sectionTitle}>Blood Groups</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.bloodGroups)}</View></View>
                <View style={styles.formCard}><Text style={styles.sectionTitle}>Educational Qualifications</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.education)}</View></View>
                <View style={styles.formCard}><Text style={styles.sectionTitle}>Marital Status</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.marital)}</View></View>
              </View>
            )}

            {/* ================= USERS TAB ================= */}
            {mainTab === 'USERS' && (
              <>
                <View style={styles.tabContainer}>
                  <TouchableOpacity style={[styles.tabBtn, userTab === 'MEMBER' && styles.tabBtnActive]} onPress={() => setUserTab('MEMBER')}><Text style={[styles.tabBtnText, userTab === 'MEMBER' && styles.tabBtnTextActive]}>Members</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.tabBtn, userTab === 'STUDENT' && styles.tabBtnActive]} onPress={() => setUserTab('STUDENT')}><Text style={[styles.tabBtnText, userTab === 'STUDENT' && styles.tabBtnTextActive]}>Students</Text></TouchableOpacity>
                  {isCore && <TouchableOpacity style={[styles.tabBtn, userTab === 'ADMIN' && styles.tabBtnActive]} onPress={() => setUserTab('ADMIN')}><Text style={[styles.tabBtnText, userTab === 'ADMIN' && styles.tabBtnTextActive]}>Admins</Text></TouchableOpacity>}
                </View>

                {userTab !== 'ADMIN' && (
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15, gap: 8 }}>
                    <TouchableOpacity style={styles.neatBtnSuccess} onPress={() => onNavigate('adminRegister', userTab === 'STUDENT' ? 'STUDENT' : 'MEMBER')}><Text style={styles.neatBtnText}>+ Add {userTab === 'STUDENT' ? 'Student' : 'Member'}</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setShowFilters(!showFilters)}><Text style={styles.neatBtnText}>🔍 Filter</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.neatBtnDark} onPress={exportDirectoryBtn}><Text style={styles.neatBtnText}>📥 Export List</Text></TouchableOpacity>
                  </View>
                )}

                {showFilters && userTab !== 'ADMIN' && (
                  <View style={styles.formCard}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 10, color: '#004085' }}>Search & Filter Directory</Text>
                    <TextInput style={[styles.input, {marginBottom: 10}]} placeholder="Search Name or Official ID..." value={searchQuery} onChangeText={setSearchQuery} />
                    
                    <Text style={styles.filterLabel}>Status</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipRow}>
                      {['', 'ACTIVE', 'INACTIVE'].map(st => (<TouchableOpacity key={st} style={[styles.filterChip, filters.status === st && styles.filterChipActive]} onPress={() => setFilters({...filters, status: st})}><Text style={[styles.filterChipText, filters.status === st && {color:'white'}]}>{st || 'All'}</Text></TouchableOpacity>))}
                    </ScrollView>

                    <Text style={styles.filterLabel}>Education</Text>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8}}>
                      {['', ...EDU_CATEGORIES].map(ed => (<TouchableOpacity key={ed} style={[styles.filterChip, {marginBottom: 8}, filters.edu === ed && styles.filterChipActive]} onPress={() => setFilters({...filters, edu: ed})}><Text style={[styles.filterChipText, filters.edu === ed && {color:'white'}]}>{ed || 'All'}</Text></TouchableOpacity>))}
                    </View>

                    <Text style={styles.filterLabel}>Islamic Qualification</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipRow}>
                      {['', ...ISLAMIC_QUALS].map(is => (<TouchableOpacity key={is} style={[styles.filterChip, filters.islamic === is && styles.filterChipActive]} onPress={() => setFilters({...filters, islamic: is})}><Text style={[styles.filterChipText, filters.islamic === is && {color:'white'}]}>{is || 'All'}</Text></TouchableOpacity>))}
                    </ScrollView>

                    <Text style={styles.filterLabel}>Blood Group</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipRow}>
                      {['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (<TouchableOpacity key={bg} style={[styles.filterChip, filters.blood === bg && styles.filterChipActive]} onPress={() => setFilters({...filters, blood: bg})}><Text style={[styles.filterChipText, filters.blood === bg && {color:'white'}]}>{bg || 'All'}</Text></TouchableOpacity>))}
                    </ScrollView>

                    <Text style={styles.filterLabel}>Native Place</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipRow}>
                      {['', 'MAHARAJAPURAM', 'THAMBIPATTI', 'KRISHNAPURAM', 'OTHERS'].map(np => (<TouchableOpacity key={np} style={[styles.filterChip, filters.native === np && styles.filterChipActive]} onPress={() => setFilters({...filters, native: np})}><Text style={[styles.filterChipText, filters.native === np && {color:'white'}]}>{np || 'All'}</Text></TouchableOpacity>))}
                    </ScrollView>

                    <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 10 }} onPress={() => {setFilters({ blood:'', edu:'', gender:'', native:'', marital:'', status: '', islamic: '' }); setSearchQuery('');}}><Text style={{ color: '#dc3545', fontWeight: 'bold' }}>Reset All Filters</Text></TouchableOpacity>
                  </View>
                )}

                {loading ? <ActivityIndicator size="large" /> : filteredDirectory.map((item) => {
                  const isPromotedSubAdmin = item.role === 'ADMIN' && !item.is_core_admin;
                  return (
                    <TouchableOpacity key={item.member_id} style={[styles.adminCard, item.is_core_admin && {opacity: 0.8}]} onPress={() => { if(!item.is_core_admin) setSelectedDetailUser(item); }} disabled={item.is_core_admin}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         {item.profile_photo ? <Image source={{uri: item.profile_photo}} style={{width: 50, height: 50, borderRadius: 25, marginRight: 15}} /> : <View style={{width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 15}}><Text style={{fontSize: 20}}>👤</Text></View>}
                         <View style={{ flex: 1 }}>
                           <Text style={styles.adminCardTitle}>{item.full_name} {item.is_core_admin && '👑'} {isPromotedSubAdmin && '⭐'}</Text>
                           <Text style={styles.adminCardMeta}>ID: {item.official_id}  |  📞 {item.phone_number}</Text>
                         </View>
                         <View style={[styles.statusBadge, { backgroundColor: item.membership_status === 'ACTIVE' ? '#28a745' : item.membership_status === 'DECEASED' ? '#343a40' : '#dc3545' }]}>
                           <Text style={styles.badgeText}>{item.membership_status}</Text>
                         </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ================= FINANCE TAB ================= */}
            {mainTab === 'FINANCE' && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <Text style={styles.sectionTitle}>Finance Dashboard</Text>
                  <View style={{flexDirection: 'row', gap: 10}}>
                     <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setShowFinFilters(!showFinFilters)}><Text style={styles.neatBtnText}>🔍 Filter</Text></TouchableOpacity>
                     <TouchableOpacity style={styles.neatBtnDark} onPress={() => setSubModalVisible(true)}><Text style={styles.neatBtnText}>⚙️ Set Monthly Sub.</Text></TouchableOpacity>
                  </View>
                </View>

                <View style={styles.statGrid}>
                  <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>₹{totalFinSubs}</Text><Text style={styles.statLargeKey}>Total Subs.</Text></View>
                  <View style={[styles.statBoxLarge, {backgroundColor: '#17a2b8'}]}><Text style={styles.statLargeVal}>₹{totalFinGen}</Text><Text style={styles.statLargeKey}>Total General</Text></View>
                  <View style={[styles.statBoxLarge, {backgroundColor: '#6f42c1'}]}><Text style={styles.statLargeVal}>₹{totalFinCamp}</Text><Text style={styles.statLargeKey}>Total Campaign</Text></View>
                </View>

                {showFinFilters && (
                  <View style={[styles.formCard, {marginTop: 20}]}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 10, color: '#004085' }}>Search & Filter Ledger</Text>
                    <TextInput style={[styles.input, {marginBottom: 10}]} placeholder="Search Name, ID, or Reason..." value={finSearchQuery} onChangeText={setFinSearchQuery} />
                    <Text style={styles.filterLabel}>Transaction Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipRow}>
                      {['', 'SUBSCRIPTION', 'GENERAL', 'FUND_RAISING'].map(type => (
                        <TouchableOpacity key={type} style={[styles.filterChip, finTypeFilter === type && styles.filterChipActive]} onPress={() => setFinTypeFilter(type)}><Text style={[styles.filterChipText, finTypeFilter === type && {color:'white'}]}>{type === '' ? 'All Types' : type === 'FUND_RAISING' ? 'Campaign' : type === 'GENERAL' ? 'General' : 'Subscription'}</Text></TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={[styles.filterLabel, {marginTop: 10}]}>Filter Period (YYYY-MM-DD)</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: 5 }}><Text style={styles.label}>Start Date</Text>{Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={finStartDate} onChange={e => setFinStartDate(e.target.value)} /> : <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={finStartDate} onChangeText={setFinStartDate} />}</View>
                      <View style={{ flex: 1, marginLeft: 5 }}><Text style={styles.label}>End Date</Text>{Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={finEndDate} onChange={e => setFinEndDate(e.target.value)} /> : <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={finEndDate} onChangeText={setFinEndDate} />}</View>
                    </View>
                    <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: -5 }} onPress={() => {setFinStartDate(''); setFinEndDate(''); setFinTypeFilter(''); setFinSearchQuery('');}}><Text style={{ color: '#dc3545', fontWeight: 'bold' }}>Clear Finance Filters</Text></TouchableOpacity>
                  </View>
                )}

                <View style={[styles.tabContainer, {marginTop: 20}]}>
                  <TouchableOpacity style={[styles.tabBtn, financeTab === 'LEDGER' && styles.tabBtnActive]} onPress={() => setFinanceTab('LEDGER')}><Text style={[styles.tabBtnText, financeTab === 'LEDGER' && styles.tabBtnTextActive]}>Transaction Ledger</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.tabBtn, financeTab === 'DUES' && styles.tabBtnActive]} onPress={() => setFinanceTab('DUES')}><Text style={[styles.tabBtnText, financeTab === 'DUES' && styles.tabBtnTextActive]}>Pending Dues</Text></TouchableOpacity>
                </View>

                {financeTab === 'LEDGER' && (
                  <View style={styles.formCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                      <Text style={styles.sectionTitle}>Transaction Log</Text>
                      <TouchableOpacity style={styles.neatBtnSuccess} onPress={exportLedgerBtn}><Text style={styles.neatBtnText}>📥 Export Ledger</Text></TouchableOpacity>
                    </View>
                    {loading ? <ActivityIndicator /> : filteredTxns.length === 0 ? <Text style={{textAlign:'center', color:'#777'}}>No records match this filter.</Text> : filteredTxns.map((txn, index) => (
                      <View key={index} style={styles.historyRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={{ fontWeight: 'bold', color: '#004085' }}>{txn.full_name} ({txn.official_id || txn.role})</Text>
                          <Text style={styles.historyDetails}>{txn.donation_type}: {txn.reason}</Text>
                          <Text style={{ fontSize: 12, color: '#777' }}>{new Date(txn.transaction_date).toLocaleDateString()} | {txn.payment_method}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#28a745', marginBottom: 5 }}>+ ₹{txn.amount}</Text>
                          <TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {financeTab === 'DUES' && (
                  <View style={styles.formCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                      <Text style={styles.sectionTitle}>Active Members Owing Dues</Text>
                      <TouchableOpacity style={styles.neatBtnDark} onPress={exportDuesBtn}><Text style={styles.neatBtnText}>📥 Export Dues List</Text></TouchableOpacity>
                    </View>
                    {pendingDuesList.length === 0 ? <Text style={{textAlign:'center', color:'#28a745', fontWeight:'bold'}}>All members are completely paid up!</Text> : pendingDuesList.map((u) => (
                      <View key={u.member_id} style={styles.historyRow}>
                        <View><Text style={{ fontWeight: 'bold', color: '#dc3545' }}>{u.full_name} ({u.official_id})</Text><Text style={{ fontSize: 12, color: '#777' }}>📞 {u.phone_number} | 📍 {u.native_place}</Text></View>
                        <View style={{alignItems: 'flex-end'}}><Text style={{ fontSize: 16, fontWeight: 'bold', color: '#dc3545' }}>Owes ₹{u.duesAmount}</Text><Text style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>{u.duesMonths} Month(s) Pending</Text></View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* ================= CAMPAIGNS TAB ================= */}
            {mainTab === 'CAMPAIGNS' && (
              <View>
                {viewCampDonors ? (
                  <View style={styles.formCard}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                      <TouchableOpacity style={styles.neatBtnDark} onPress={() => setViewCampDonors(null)}><Text style={styles.neatBtnText}>← Back</Text></TouchableOpacity>
                      <Text style={[styles.sectionTitle, {flex: 1, textAlign: 'right', marginBottom: 0}]} numberOfLines={1}>{viewCampDonors.title} Donors</Text>
                    </View>
                    
                    {globalTxns.filter(t => t.campaign_id === viewCampDonors.campaign_id).length === 0 ? (
                       <Text style={{textAlign: 'center', color: '#777'}}>No donations recorded for this campaign yet.</Text>
                    ) : globalTxns.filter(t => t.campaign_id === viewCampDonors.campaign_id).map((txn, idx) => (
                       <View key={idx} style={styles.historyRow}>
                         <View style={{ flex: 1, paddingRight: 10 }}>
                           <Text style={{ fontWeight: 'bold', color: '#004085' }}>{txn.full_name}</Text>
                           <Text style={{ fontSize: 12, color: '#777' }}>{new Date(txn.transaction_date).toLocaleDateString()} | {txn.payment_method}</Text>
                         </View>
                         <View style={{ alignItems: 'flex-end' }}>
                           <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#28a745', marginBottom: 5 }}>+ ₹{txn.amount}</Text>
                           <TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity>
                         </View>
                       </View>
                    ))}
                  </View>
                ) : (
                  <View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                      <Text style={styles.sectionTitle}>Campaign Drives</Text>
                      <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setShowCampaignModal(true)}>
                        <Text style={styles.neatBtnText}>+ Launch Fundraiser</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.formCard}>
                      <Text style={styles.sectionTitle}>Live Drives</Text>
                      {loading ? <ActivityIndicator /> : campaigns.filter(c => c.status === 'ACTIVE').map(camp => {
                        const raised = parseFloat(camp.raised_amount) || 0;
                        const target = parseFloat(camp.target_amount) || 1;
                        const progress = Math.min(Math.round((raised / target) * 100), 100);
                        
                        return (
                          <View key={camp.campaign_id} style={styles.adminCard}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5}}>
                              <Text style={[styles.adminCardTitle, { flex: 1, marginRight: 10, fontSize: 16 }]} numberOfLines={1}>{camp.title}</Text>
                              <View style={[styles.statusBadge, { backgroundColor: '#28a745' }]}><Text style={styles.badgeText}>ACTIVE</Text></View>
                            </View>
                            
                            <Text style={{ color: '#555', marginBottom: 15 }} numberOfLines={2}>{camp.description}</Text>
                            
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                              <Text style={{ fontWeight: 'bold', color: '#004085' }}>Raised: {'\u20B9'}{raised}</Text>
                              <Text style={{ color: '#777' }}>Target: {'\u20B9'}{target}</Text>
                            </View>

                            <View style={{ height: 10, backgroundColor: '#e9ecef', borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
                              <View style={{ width: `${progress}%`, backgroundColor: '#28a745', height: '100%' }} />
                            </View>

                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                              <TouchableOpacity style={styles.neatBtnSuccess} onPress={() => setViewCampDonors(camp)}><Text style={styles.neatBtnText}>👥 View Donors</Text></TouchableOpacity>
                              <Text style={{ textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#28a745' }}>{progress}% Funded</Text>
                            </View>
                          </View>
                        );
                      })}
                      {campaigns.filter(c => c.status === 'ACTIVE').length === 0 && <Text style={{color: '#777'}}>No active drives.</Text>}
                    </View>

                    <View style={styles.formCard}>
                      <Text style={styles.sectionTitle}>Completed Drives</Text>
                      {loading ? <ActivityIndicator /> : campaigns.filter(c => c.status !== 'ACTIVE').map(camp => {
                        const raised = parseFloat(camp.raised_amount) || 0;
                        const target = parseFloat(camp.target_amount) || 1;
                        const progress = Math.min(Math.round((raised / target) * 100), 100);
                        
                        return (
                          <View key={camp.campaign_id} style={styles.adminCard}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5}}>
                              <Text style={[styles.adminCardTitle, { flex: 1, marginRight: 10, fontSize: 16 }]} numberOfLines={1}>{camp.title}</Text>
                              <View style={[styles.statusBadge, { backgroundColor: '#dc3545' }]}><Text style={styles.badgeText}>CLOSED</Text></View>
                            </View>

                            <Text style={{ color: '#555', marginBottom: 15 }} numberOfLines={2}>{camp.description}</Text>
                            
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                              <Text style={{ fontWeight: 'bold', color: '#004085' }}>Raised: {'\u20B9'}{raised}</Text>
                              <Text style={{ color: '#777' }}>Target: {'\u20B9'}{target}</Text>
                            </View>

                            <View style={{ height: 10, backgroundColor: '#e9ecef', borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
                              <View style={{ width: `${progress}%`, backgroundColor: '#28a745', height: '100%' }} />
                            </View>

                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                              <TouchableOpacity style={styles.neatBtnDark} onPress={() => setViewCampDonors(camp)}><Text style={styles.neatBtnText}>👥 View Donors</Text></TouchableOpacity>
                              <Text style={{ textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#28a745' }}>{progress}% Funded</Text>
                            </View>
                          </View>
                        );
                      })}
                      {campaigns.filter(c => c.status !== 'ACTIVE').length === 0 && <Text style={{color: '#777'}}>No closed drives.</Text>}
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ================= MODALS ================= */}
      {subModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#004085', marginBottom: 15 }}>Global Finance Settings</Text>
            <Text style={styles.label}>Set Standard Monthly Subscription Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={subAmount} onChangeText={setSubAmount} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity style={{ padding: 12, marginRight: 15 }} onPress={() => setSubModalVisible(false)}><Text style={{ color: '#777', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: '#28a745', padding: 12, borderRadius: 5 }} onPress={updateSubAmount}><Text style={{ color: 'white', fontWeight: 'bold' }}>Save Amount</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {cashModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#004085', marginBottom: 5 }}>Log Cash Receipt</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>Recording payment for: {cashUser?.full_name}</Text>
            
            {cashType === 'SUBSCRIPTION' && cashDuesText ? (
              <Text style={{fontSize: 13, fontWeight: 'bold', color: cashDuesColor, marginBottom: 15}}>{cashDuesText}</Text>
            ) : null}
            
            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
              <TouchableOpacity style={[styles.quickBtn, cashType === 'SUBSCRIPTION' && styles.quickBtnActive, {marginRight: 5}]} onPress={()=>handleCashTypeChange('SUBSCRIPTION')}>
                <Text style={[styles.quickBtnText, cashType === 'SUBSCRIPTION' && styles.quickBtnTextActive, {fontSize: 11}]}>Subs.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickBtn, cashType === 'GENERAL' && styles.quickBtnActive, {marginRight: 5}]} onPress={()=>handleCashTypeChange('GENERAL')}>
                <Text style={[styles.quickBtnText, cashType === 'GENERAL' && styles.quickBtnTextActive, {fontSize: 11}]}>General</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickBtn, cashType === 'CAMPAIGN' && styles.quickBtnActive]} onPress={()=>handleCashTypeChange('CAMPAIGN')}>
                <Text style={[styles.quickBtnText, cashType === 'CAMPAIGN' && styles.quickBtnTextActive, {fontSize: 11}]}>Campaign</Text>
              </TouchableOpacity>
            </View>

            {cashType === 'SUBSCRIPTION' && (
              <View>
                <Text style={styles.label}>Number of Months (Auto-Calculates ₹)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={cashMonths} onChangeText={handleCashMonthsChange} />
              </View>
            )}

            {cashType === 'GENERAL' && (
              <View>
                <Text style={styles.label}>Reason / Category</Text>
                <TextInput style={styles.input} placeholder="e.g., General Support" autoCapitalize="characters" value={cashReason} onChangeText={t => setCashReason(t.toUpperCase())} />
              </View>
            )}

            {cashType === 'CAMPAIGN' && (
              <View>
                <Text style={styles.label}>Select Active Campaign</Text>
                {campaigns.filter(c => c.status === 'ACTIVE').length === 0 ? (
                  <Text style={{color: '#dc3545', fontWeight: 'bold', marginBottom: 15}}>No active campaigns available. Cash logging disabled.</Text>
                ) : (
                  <ScrollView style={{maxHeight: 150, marginBottom: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 5}}>
                    {campaigns.filter(c => c.status === 'ACTIVE').map(c => (
                       <TouchableOpacity key={c.campaign_id} style={{padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: cashCampId === c.campaign_id ? '#cce5ff' : 'white'}} onPress={() => setCashCampId(c.campaign_id)}>
                         <Text style={{color: '#004085', fontWeight: cashCampId === c.campaign_id ? 'bold' : 'normal'}}>{c.title}</Text>
                       </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            <Text style={styles.label}>Cash Amount Collected (Rs.) *</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={cashAmount} onChangeText={setCashAmount} />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity style={{ padding: 12, marginRight: 15 }} onPress={() => setCashModalVisible(false)}>
                <Text style={{ color: '#777', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: '#28a745', padding: 12, borderRadius: 5 }} onPress={submitCashPayment}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Generate Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {promoteModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#004085', marginBottom: 20 }}>Select Admin Rights</Text>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, MANAGE_USERS: !selectedPerms.MANAGE_USERS})}><View style={[styles.checkbox, selectedPerms.MANAGE_USERS && styles.checkboxActive]}>{selectedPerms.MANAGE_USERS && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 16, color: '#333' }}>Register Members / Students</Text></TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, MANAGE_FINANCE: !selectedPerms.MANAGE_FINANCE})}><View style={[styles.checkbox, selectedPerms.MANAGE_FINANCE && styles.checkboxActive]}>{selectedPerms.MANAGE_FINANCE && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 16, color: '#333' }}>Set Subscription & View Finances</Text></TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, MANAGE_CAMPAIGNS: !selectedPerms.MANAGE_CAMPAIGNS})}><View style={[styles.checkbox, selectedPerms.MANAGE_CAMPAIGNS && styles.checkboxActive]}>{selectedPerms.MANAGE_CAMPAIGNS && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 16, color: '#333' }}>Create Fund Raising Campaigns</Text></TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25 }}>
              <TouchableOpacity style={{ padding: 12, marginRight: 15 }} onPress={() => setPromoteModalVisible(false)}><Text style={{ color: '#777', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: '#28a745', padding: 12, borderRadius: 5 }} onPress={submitPromotion}><Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm Promotion</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {resetModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
             <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#004085', marginBottom: 15 }}>Reset User Password</Text>
             <Text style={{ fontSize: 14, color: '#333', marginBottom: 20, lineHeight: 22 }}>Are you sure you want to completely reset <Text style={{fontWeight: 'bold'}}>{selectedDetailUser?.full_name}</Text>'s password to the system default (<Text style={{fontWeight: 'bold'}}>Hiywa@123</Text>)?</Text>
             <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 }}>
               <TouchableOpacity style={{ padding: 12, marginRight: 15 }} onPress={() => setResetModalVisible(false)}><Text style={{ color: '#777', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={{ backgroundColor: '#dc3545', padding: 12, borderRadius: 5 }} onPress={resetUserPasswordAdmin}><Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm Reset</Text></TouchableOpacity>
             </View>
          </View>
        </View>
      )}

      {showCampaignModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#004085', marginBottom: 15 }}>Launch New Fundraiser</Text>
            <Text style={styles.label}>Campaign Title</Text>
            <TextInput style={styles.input} value={campTitle} onChangeText={setCampTitle} />
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={campDesc} onChangeText={setCampDesc} />
            <Text style={styles.label}>Target Amount (Rs.)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={campTarget} onChangeText={setCampTarget} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity style={{ padding: 12, marginRight: 15 }} onPress={() => setShowCampaignModal(false)}><Text style={{ color: '#777', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: '#28a745', padding: 12, borderRadius: 5 }} onPress={() => { handleCreateCampaign(); setShowCampaignModal(false); }}><Text style={{ color: 'white', fontWeight: 'bold' }}>Publish Drive</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// --- DYNAMIC REGISTRATION WIZARD (3-STEP WITH IC CARD) ---
function RegisterScreen({ onBack, defaultRole = 'MEMBER', isAdminAuth = false }) {
  const [role, setRole] = useState(defaultRole); 
  const [step, setStep] = useState(1);
  const [registeredUser, setRegisteredUser] = useState(null); 
  
  const [formData, setFormData] = useState({
    full_name: '', father_name: '', mother_name: '', parents_status: '', gender: '', dob: '', blood_group: '', native_place: '', 
    phone_number: '', email: '', address: '', password: '', whatsapp_number: '', aadhaar_number: '', 
    current_location: '', occupation: '', educational_qualification: '', course_details: '', marital_status: '', 
    student_mobile: '', class_grade: '', school_name: '', medium_of_instruction: '', school_type: '', 
    school_location: '', mode_of_transportation: '', special_talents: '', profile_photo: null,
    islamic_studies: 'NO', islamic_qualification: '', madrasa_name: '', madrasa_location: ''
  });
  
  const [age, setAge] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [customNative, setCustomNative] = useState('');
  const [customIslamic, setCustomIslamic] = useState('');
  
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showBloodDropdown, setShowBloodDropdown] = useState(false);
  const [showNativeDropdown, setShowNativeDropdown] = useState(false);
  const [showMaritalDropdown, setShowMaritalDropdown] = useState(false);
  const [showEduDropdown, setShowEduDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showMediumDropdown, setShowMediumDropdown] = useState(false);
  const [showSchoolTypeDropdown, setShowSchoolTypeDropdown] = useState(false);
  const [showIslamicDrop, setShowIslamicDrop] = useState(false);
  const [showParentsDrop, setShowParentsDrop] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(formData.class_grade);

  const EDU_CATEGORIES = ['MEDICAL', 'ENGINEERING & IT', 'ARTS & SCIENCE', 'COMMERCE & MANAGEMENT', 'LAW', 'AGRICULTURE', 'DIPLOMA / ITI', 'SCHOOL LEVEL', 'PHD / DOCTORATE', 'OTHERS'];
  const CLASSES = ['1ST STD', '2ND STD', '3RD STD', '4TH STD', '5TH STD', '6TH STD', '7TH STD', '8TH STD', '9TH STD', '10TH STD', '11TH STD', '12TH STD', 'UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'];
  const ISLAMIC_QUALS = ['AALIM', 'HAAFIZH', 'OTHERS'];
  const SCHOOL_TYPES = ['GOVERNMENT SCHOOL', 'GOVERNMENT AIDED SCHOOL', 'PRIVATE SCHOOL'];
  const COLLEGE_TYPES = ['GOVERNMENT COLLEGE', 'PRIVATE COLLEGE', 'GOVT AIDED COLLEGE', 'OTHERS'];
  const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const NATIVE_PLACES = ['MAHARAJAPURAM', 'THAMBIPATTI', 'KRISHNAPURAM', 'OTHERS'];
  const MARITAL_STATUS = ['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'];
  const MEDIUMS = ['TAMIL', 'ENGLISH', 'OTHERS'];

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDobDate(selectedDate);
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      setFormData({...formData, dob: `${year}-${month}-${day}`});
      setAge((new Date().getFullYear() - year).toString());
    }
  };

  const handleWebDateChange = (e) => {
    const val = e.target.value; 
    setFormData({...formData, dob: val});
    if(val) setAge((new Date().getFullYear() - new Date(val).getFullYear()).toString());
  };

  const handleSameMobileToggle = () => {
    setSameAsMobile(!sameAsMobile);
    if (!sameAsMobile) setFormData({ ...formData, whatsapp_number: formData.phone_number });
    else setFormData({ ...formData, whatsapp_number: '' });
  };

  const pickImage = () => {
    Alert.alert("Upload Photo", "Choose an option", [
      {
        text: "Take Photo (Camera)",
        onPress: async () => {
          const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
          if (permissionResult.granted === false) return alert("Camera permission is required!");
          let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true });
          if (!result.canceled) {
            const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
            // If in RegisterScreen use: setFormData({...formData, profile_photo: b64});
            // If in UserDashboard use: updateProfilePhotoFunction(b64);
          }
        }
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true });
          if (!result.canceled) {
            const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
            // If in RegisterScreen use: setFormData({...formData, profile_photo: b64});
            // If in UserDashboard use: updateProfilePhotoFunction(b64);
          }
        }
      },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.father_name || !formData.mother_name || !formData.parents_status || !formData.gender || !formData.dob || !formData.aadhaar_number) {
      return alert('Please fill all mandatory (*) fields in Step 1.');
    }
    if (formData.aadhaar_number.length !== 12) return alert('Aadhaar must be exactly 12 digits.');
    if (role === 'MEMBER' && !formData.phone_number) return alert('Primary mobile number is required.');
    if (role === 'STUDENT' && !formData.phone_number) return alert('Parent mobile number is required.');

    setIsSubmitting(true);

    // --- FORCE UPPERCASE FILTER ---
    const finalData = { ...formData };
    for (let key in finalData) {
      if (typeof finalData[key] === 'string' && key !== 'profile_photo' && key !== 'password' && key !== 'email') {
        finalData[key] = finalData[key].toUpperCase();
      }
    }
    
    if (finalData.native_place === 'OTHERS') finalData.native_place = customNative.toUpperCase();
    if (finalData.islamic_qualification === 'OTHERS') finalData.islamic_qualification = customIslamic.toUpperCase();
    // ------------------------------

    try {
      // 1. Count current users to generate the new Official ID
      const membersSnap = await getDocs(collection(db, 'members'));
      const newIdNumber = membersSnap.size + 1;
      
      // Use padStart(4, '0') to make it 4 digits (e.g., HIYWA0001)
      const officialId = `HIYWA${String(newIdNumber).padStart(4, '0')}`;
      
      finalData.official_id = officialId;
      finalData.membership_status = 'ACTIVE';
      finalData.join_date = new Date().toISOString();
      finalData.total_months_paid = 0; 
      
      // 2. AUTOMATIC CORE ADMIN LOGIC
      // If this is the very first user (HIYWA0001), force them to be the Core Admin!
      if (newIdNumber === 1) {
        finalData.role = 'ADMIN';
        finalData.is_core_admin = true;
        finalData.admin_permissions = JSON.stringify(['ALL']);
      } else {
        // Otherwise, they get whatever role they selected (MEMBER or STUDENT)
        finalData.role = role;
        finalData.is_core_admin = false;
      }

      if (isAdminAuth) finalData.password = 'Hiywa@123';

      // 3. Save to Firestore using the ID as the document name
      await setDoc(doc(db, 'members', officialId), finalData);
      
      // 4. Show success screen
      setRegisteredUser(finalData);
    } catch (error) { 
      alert('Registration Failed: ' + error.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const generateIDCardHTML = (u) => {
  const calcAge = u.dob ? (new Date().getFullYear() - new Date(u.dob).getFullYear()) : 'N/A';
  const photoSrc = u.profile_photo || 'https://via.placeholder.com/150';

  return `
    <html>
      <head>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #e2e8f0; }
          .badge-card {
            width: 350px;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0,39,82,0.15);
            border: 1px solid #cbd5e1;
            position: relative;
          }
          .badge-top {
            background: linear-gradient(135deg, #002752 0%, #004085 100%);
            color: #ffffff;
            padding: 22px 16px 45px 16px;
            text-align: center;
          }
          .org-title { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
          .org-sub { font-size: 10px; font-weight: 600; opacity: 0.85; margin-top: 3px; letter-spacing: 0.5px; }
          .photo-wrapper {
            width: 110px;
            height: 110px;
            margin: -55px auto 12px auto;
            border-radius: 55px;
            border: 4px solid #ffffff;
            overflow: hidden;
            background: #f8fafc;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .photo-wrapper img { width: 100%; height: 100%; object-fit: cover; }
          .name { font-size: 19px; font-weight: 700; color: #0f172a; text-align: center; text-transform: uppercase; }
          .role-chip {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 12px;
            border-radius: 20px;
            margin: 6px auto 14px auto;
            text-align: center;
          }
          .id-strip {
            background: #f8fafc;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 700;
            color: #334155;
            text-align: center;
            border-top: 1px dashed #e2e8f0;
            border-bottom: 1px dashed #e2e8f0;
          }
          .meta-table { width: 100%; padding: 14px 20px 20px 20px; font-size: 13px; color: #475569; }
          .meta-table tr td { padding: 5px 0; }
          .meta-table tr td:first-child { font-weight: 600; color: #64748b; width: 40%; }
          .meta-table tr td:last-child { font-weight: 700; color: #1e293b; text-align: right; }
          .footer-strip {
            background: #002752;
            color: #ffffff;
            font-size: 10px;
            text-align: center;
            padding: 8px;
            font-weight: 500;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="badge-card">
          <div class="badge-top">
            <div class="org-title">HIYWA</div>
            <div class="org-sub">HIDHAYATHUL ISLAM YOUTH WELFARE TRUST</div>
          </div>
          <div class="photo-wrapper">
            <img src="${photoSrc}" />
          </div>
          <div class="name">${u.full_name}</div>
          <div style="text-align: center;"><span class="role-chip">${u.role}</span></div>
          <div class="id-strip">OFFICIAL ID: ${u.official_id}</div>
          <table class="meta-table">
            <tr><td>Native Place</td><td>${u.native_place || 'N/A'}</td></tr>
            <tr><td>Blood Group</td><td>${u.blood_group || 'N/A'}</td></tr>
            <tr><td>Age</td><td>${calcAge} Years</td></tr>
            <tr><td>Contact</td><td>${u.phone_number || 'N/A'}</td></tr>
          </table>
          <div class="footer-strip">COMMITTED TO SERVICE & COMMUNITY WELFARE</div>
        </div>
      </body>
    </html>
  `;
};

  const handleShareCredentials = async () => {
    const html = generateIDCardHTML(registeredUser);
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html); printWindow.document.close(); printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch(e) { alert("Failed to generate PDF"); }
  };

  if (registeredUser) {
    const displayAge = registeredUser.dob ? (new Date().getFullYear() - new Date(registeredUser.dob).getFullYear()) : 'N/A';
    
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
         <View style={styles.idCardContainer}>
             <View style={{zIndex: 1}}>
                 <View style={styles.idCardHeader}>
                    <Image source={require('./hiywalogo.jpeg')} style={{ width: 45, height: 45, position: 'absolute', top: 12, right: 10, borderRadius: 8 }} resizeMode="contain" />
                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 22, textAlign: 'center', letterSpacing: 1, marginBottom: 2}}>HIYWA</Text>
                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11, textAlign: 'center'}}>Hidhayathul Islam Youth Welfare Trust</Text>
                 </View>
                 <View style={{padding: 20, alignItems: 'center'}}>
                    {registeredUser.profile_photo ? <Image source={{uri: registeredUser.profile_photo}} style={styles.idCardPhoto} /> : <View style={[styles.idCardPhoto, {backgroundColor: '#ccc', justifyContent:'center', alignItems:'center'}]}><Text style={{fontSize:40}}>👤</Text></View>}
                    <Text style={{fontSize: 22, fontWeight: 'bold', color: '#004085', marginTop: 10}}>{registeredUser.full_name}</Text>
                    <Text style={{fontSize: 16, color: '#333', fontWeight: 'bold', marginTop: 5}}>ID: {registeredUser.official_id}</Text>
                    <View style={{marginTop: 15, width: '100%', alignItems: 'flex-start'}}>
                       <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Role:</b> {registeredUser.role}</Text>
                       <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Age / Blood:</b> {displayAge} / {registeredUser.blood_group || 'N/A'}</Text>
                       <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Phone:</b> {registeredUser.phone_number}</Text>
                    </View>
                 </View>
             </View>
          </View>
         <Text style={{textAlign: 'center', color: '#dc3545', marginVertical: 20, fontWeight: 'bold'}}>
           {isAdminAuth ? `Default Password Set: ${registeredUser.password}\nUser will be forced to change this on their first login.` : 'Please log in with the password you created.'}
         </Text>
         <TouchableOpacity style={[styles.button, {width: 250, marginBottom: 10, backgroundColor: '#28a745'}]} onPress={handleShareCredentials}><Text style={styles.buttonText}>🔗 Download / Share</Text></TouchableOpacity>
         <TouchableOpacity style={[styles.button, {width: 250, backgroundColor: '#6c757d'}]} onPress={onBack}><Text style={styles.buttonText}>Return Home</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* --- NEW PROFESSIONAL LOADING OVERLAY --- */}
      {isSubmitting && (
        <View style={[styles.modalOverlay, { zIndex: 9999, elevation: 10 }]}>
          <View style={{ backgroundColor: 'white', padding: 30, borderRadius: 12, alignItems: 'center', width: '85%', maxWidth: 350, elevation: 5 }}>
            <ActivityIndicator size="large" color="#004085" style={{ transform: [{ scale: 1.5 }], marginBottom: 25, marginTop: 10 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#004085', marginBottom: 10, textAlign: 'center' }}>Creating Profile...</Text>
            <Text style={{ fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20 }}>Securely generating your Official ID and saving your data to the Trust registry. Please wait.</Text>
          </View>
        </View>
      )}
      {/* ---------------------------------------- */}

      <View style={styles.headerCentered}>
        <View style={styles.headerTopRightControls}>
          <TouchableOpacity onPress={onBack} style={styles.headerNeatBtn}>
            <Text style={styles.headerNeatBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTextCentered}>Registration Wizard</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 15 }}>
            
        {!isAdminAuth && (
          <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: '#e9ecef', borderRadius: 8, padding: 5 }}>
            <TouchableOpacity style={[styles.roleBtn, role === 'MEMBER' && styles.roleBtnActive]} onPress={() => setRole('MEMBER')}><Text style={[styles.roleBtnText, role === 'MEMBER' && styles.roleBtnTextActive]}>HIYWA Member</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.roleBtn, role === 'STUDENT' && styles.roleBtnActive]} onPress={() => setRole('STUDENT')}><Text style={[styles.roleBtnText, role === 'STUDENT' && styles.roleBtnTextActive]}>Student</Text></TouchableOpacity>
          </View>
        )}

        <View style={styles.wizardProgress}>
          <Text style={{fontWeight: 'bold', color: step === 1 ? '#004085' : '#ccc'}}>1. Personal</Text>
          <Text style={{fontWeight: 'bold', color: step === 2 ? '#004085' : '#ccc'}}>2. Education</Text>
          <Text style={{fontWeight: 'bold', color: step === 3 ? '#004085' : '#ccc'}}>3. Contact</Text>
        </View>

        <View style={styles.formCard}>
          
          <View style={[styles.alertBox, { backgroundColor: '#d4edda', borderColor: '#c3e6cb', marginBottom: 20, padding: 10 }]}>
            <Text style={[styles.alertText, { color: '#155724', fontSize: 12 }]}>
                Note: The official ID will be auto-generated upon successful registration.
            </Text>
          </View>

          {step === 1 && (
            <>
              <TouchableOpacity onPress={pickImage} style={{alignItems: 'center', marginBottom: 20}}>
                {formData.profile_photo ? <Image source={{uri: formData.profile_photo}} style={{width: 100, height: 100, borderRadius: 50}} /> : <View style={{width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center'}}><Text>📷 Upload Photo</Text></View>}
              </TouchableOpacity>
              
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} autoCapitalize="characters" value={formData.full_name} onChangeText={(t) => setFormData({...formData, full_name: t})} />
              
              <Text style={styles.label}>Father's / Guardian's Name *</Text>
              <TextInput style={styles.input} autoCapitalize="characters" value={formData.father_name} onChangeText={(t) => setFormData({...formData, father_name: t})} />

              <Text style={styles.label}>Mother's Name *</Text>
              <TextInput style={styles.input} autoCapitalize="characters" value={formData.mother_name} onChangeText={(t) => setFormData({...formData, mother_name: t})} />
              
              <Text style={styles.label}>Parents Status (For Support Eligibility) *</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowParentsDrop(!showParentsDrop)}><Text style={styles.dropdownBtnText}>{formData.parents_status || 'SELECT STATUS'}</Text></TouchableOpacity>
              {showParentsDrop && (
                <View style={styles.dropdownList}>
                  {['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED'].map((s) => (
                    <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => { setFormData({...formData, parents_status: s}); setShowParentsDrop(false); }}><Text style={styles.dropdownItemText}>{s}</Text></TouchableOpacity>
                  ))}
                </View>
              )}
              
              <Text style={styles.label}>Gender *</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowGenderDropdown(!showGenderDropdown)}><Text style={styles.dropdownBtnText}>{formData.gender || 'SELECT GENDER'}</Text></TouchableOpacity>
              {showGenderDropdown && <View style={styles.dropdownList}>{GENDERS.map((g) => (<TouchableOpacity key={g} style={styles.dropdownItem} onPress={() => { setFormData({...formData, gender: g}); setShowGenderDropdown(false); }}><Text style={styles.dropdownItemText}>{g}</Text></TouchableOpacity>))}</View>}

              <Text style={styles.label}>Date of Birth *</Text>
              {Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formData.dob} onChange={handleWebDateChange} /> : <View><TouchableOpacity onPress={() => setShowDatePicker(true)}><View style={{ pointerEvents: 'none' }}><TextInput style={styles.input} placeholder="YYYY-MM-DD" value={formData.dob} editable={false} /></View></TouchableOpacity>{showDatePicker && <DateTimePicker value={dobDate} mode="date" display="default" onChange={handleDateChange} />}</View>}

              <Text style={styles.label}>Calculated Age (Auto-Fills)</Text>
              <TextInput style={[styles.input, { backgroundColor: '#e9ecef', color: '#666' }]} value={age} editable={false} placeholder="Select DOB first" />

              <Text style={styles.label}>Blood Group</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowBloodDropdown(!showBloodDropdown)}><Text style={styles.dropdownBtnText}>{formData.blood_group || 'SELECT BLOOD GROUP'}</Text></TouchableOpacity>
              {showBloodDropdown && <View style={styles.dropdownList}>{BLOOD_GROUPS.map((bg) => (<TouchableOpacity key={bg} style={styles.dropdownItem} onPress={() => { setFormData({...formData, blood_group: bg}); setShowBloodDropdown(false); }}><Text style={styles.dropdownItemText}>{bg}</Text></TouchableOpacity>))}</View>}

              {role === 'MEMBER' && (
                <>
                  <Text style={styles.label}>Marital Status</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowMaritalDropdown(!showMaritalDropdown)}><Text style={styles.dropdownBtnText}>{formData.marital_status || 'SELECT STATUS'}</Text></TouchableOpacity>
                  {showMaritalDropdown && <View style={styles.dropdownList}>{MARITAL_STATUS.map((ms) => (<TouchableOpacity key={ms} style={styles.dropdownItem} onPress={() => { setFormData({...formData, marital_status: ms}); setShowMaritalDropdown(false); }}><Text style={styles.dropdownItemText}>{ms}</Text></TouchableOpacity>))}</View>}
                </>
              )}

              <Text style={styles.label}>Aadhaar Number (12-Digits) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" maxLength={12} value={formData.aadhaar_number} onChangeText={(t) => setFormData({...formData, aadhaar_number: t})} />
            </>
          )}

          {step === 2 && (
            <>
              {role === 'MEMBER' && (
                <>
                  <Text style={styles.label}>Educational Category</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowEduDropdown(!showEduDropdown)}><Text style={styles.dropdownBtnText}>{formData.educational_qualification || 'SELECT CATEGORY'}</Text></TouchableOpacity>
                  {showEduDropdown && <View style={styles.dropdownList}>{EDU_CATEGORIES.map((el) => (<TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => { setFormData({...formData, educational_qualification: el}); setShowEduDropdown(false); }}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>))}</View>}
                  <Text style={styles.label}>Course / Major Specialization</Text>
                  <TextInput style={styles.input} autoCapitalize="characters" value={formData.course_details} onChangeText={(t) => setFormData({...formData, course_details: t})} />
                  <Text style={styles.label}>Occupation / Job Title</Text>
                  <TextInput style={styles.input} autoCapitalize="characters" value={formData.occupation} onChangeText={(t) => setFormData({...formData, occupation: t})} />
                </>
              )}

              {role === 'STUDENT' && (
                <>
                  <Text style={styles.label}>Class / Grade</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowClassDropdown(!showClassDropdown)}><Text style={styles.dropdownBtnText}>{formData.class_grade || 'SELECT CLASS / GRADE'}</Text></TouchableOpacity>
                  {showClassDropdown && <View style={styles.dropdownList}><ScrollView nestedScrollEnabled style={{maxHeight: 200}}>{CLASSES.map((c) => (<TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setFormData({...formData, class_grade: c}); setShowClassDropdown(false); }}><Text style={styles.dropdownItemText}>{c}</Text></TouchableOpacity>))}</ScrollView></View>}
                  
                  {isCollegeEdit && (
                    <>
                      <Text style={styles.label}>Educational Category</Text>
                      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowEduDropdown(!showEduDropdown)}><Text style={styles.dropdownBtnText}>{formData.educational_qualification || 'SELECT CATEGORY'}</Text></TouchableOpacity>
                      {showEduDropdown && <View style={styles.dropdownList}>{EDU_CATEGORIES.map((el) => (<TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => { setFormData({...formData, educational_qualification: el}); setShowEduDropdown(false); }}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>))}</View>}
                      <Text style={styles.label}>Course / Major Details</Text>
                      <TextInput style={styles.input} autoCapitalize="characters" value={formData.course_details} onChangeText={(t) => setFormData({...formData, course_details: t})} />
                    </>
                  )}

                  <Text style={styles.label}>Institution Name</Text>
                  <TextInput style={styles.input} autoCapitalize="characters" value={formData.school_name} onChangeText={(t) => setFormData({...formData, school_name: t})} />
                  
                  <Text style={styles.label}>{isCollegeEdit ? 'College Type' : 'School Type'}</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowSchoolTypeDropdown(!showSchoolTypeDropdown)}><Text style={styles.dropdownBtnText}>{formData.school_type || 'SELECT TYPE'}</Text></TouchableOpacity>
                  {showSchoolTypeDropdown && <View style={styles.dropdownList}>{(isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES).map((st) => (<TouchableOpacity key={st} style={styles.dropdownItem} onPress={() => { setFormData({...formData, school_type: st}); setShowSchoolTypeDropdown(false); }}><Text style={styles.dropdownItemText}>{st}</Text></TouchableOpacity>))}</View>}
                  
                  <Text style={styles.label}>Institution Location / Village</Text>
                  <TextInput style={styles.input} autoCapitalize="characters" value={formData.school_location} onChangeText={(t) => setFormData({...formData, school_location: t})} />
                  
                  <Text style={styles.label}>Medium of Instruction</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowMediumDropdown(!showMediumDropdown)}><Text style={styles.dropdownBtnText}>{formData.medium_of_instruction || 'SELECT MEDIUM'}</Text></TouchableOpacity>
                  {showMediumDropdown && <View style={styles.dropdownList}>{MEDIUMS.map((md) => (<TouchableOpacity key={md} style={styles.dropdownItem} onPress={() => { setFormData({...formData, medium_of_instruction: md}); setShowMediumDropdown(false); }}><Text style={styles.dropdownItemText}>{md}</Text></TouchableOpacity>))}</View>}
                </>
              )}

              <Text style={styles.label}>{role === 'MEMBER' ? 'Completed Islamic Studies?' : 'Pursuing Islamic Studies?'}</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                <TouchableOpacity style={[styles.filterChip, formData.islamic_studies==='YES' && styles.filterChipActive]} onPress={()=>setFormData({...formData, islamic_studies: 'YES'})}><Text style={[styles.filterChipText, formData.islamic_studies==='YES' && {color:'white'}]}>Yes</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.filterChip, formData.islamic_studies==='NO' && styles.filterChipActive]} onPress={()=>setFormData({...formData, islamic_studies: 'NO'})}><Text style={[styles.filterChipText, formData.islamic_studies==='NO' && {color:'white'}]}>No</Text></TouchableOpacity>
              </View>

              {formData.islamic_studies === 'YES' && (
                <View style={{padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#eee'}}>
                  <Text style={styles.label}>Islamic Qualification</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowIslamicDrop(!showIslamicDrop)}><Text style={styles.dropdownBtnText}>{formData.islamic_qualification || 'SELECT QUALIFICATION'}</Text></TouchableOpacity>
                  {showIslamicDrop && <View style={styles.dropdownList}>{ISLAMIC_QUALS.map((iq) => (<TouchableOpacity key={iq} style={styles.dropdownItem} onPress={() => { setFormData({...formData, islamic_qualification: iq}); setShowIslamicDrop(false); }}><Text style={styles.dropdownItemText}>{iq}</Text></TouchableOpacity>))}</View>}
                  {formData.islamic_qualification === 'OTHERS' && (
                    <>
                        <Text style={styles.label}>Specify Islamic Qualification</Text>
                        <TextInput style={styles.input} autoCapitalize="characters" value={customIslamic} onChangeText={t => setCustomIslamic(t)} />
                    </>
                  )}
                  <Text style={styles.label}>Madrasa Name</Text>
                  <TextInput style={styles.input} autoCapitalize="characters" value={formData.madrasa_name} onChangeText={t => setFormData({...formData, madrasa_name: t})} />
                  <Text style={styles.label}>Madrasa Location</Text>
                  <TextInput style={styles.input} autoCapitalize="characters" value={formData.madrasa_location} onChangeText={t => setFormData({...formData, madrasa_location: t})} />
                </View>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {role === 'STUDENT' && (
                <>
                  <Text style={styles.label}>Student Mobile Number</Text>
                  <TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={formData.student_mobile} onChangeText={(t) => setFormData({...formData, student_mobile: t})} />
                </>
              )}
              
              <Text style={styles.label}>{role === 'MEMBER' ? 'Primary Mobile Number *' : "Parent's Mobile Number *"}</Text>
              <TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={formData.phone_number} onChangeText={(t) => { setFormData({...formData, phone_number: t}); if(sameAsMobile) setFormData({...formData, phone_number: t, whatsapp_number: t}); }} />

              {role === 'MEMBER' && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={styles.label}>WhatsApp Number</Text>
                    <TouchableOpacity onPress={handleSameMobileToggle} style={{ marginLeft: 15, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 16, height: 16, borderWidth: 1, borderColor: '#004085', marginRight: 5, backgroundColor: sameAsMobile ? '#004085' : 'white' }} />
                      <Text style={{ fontSize: 12, color: '#555' }}>Same as Mobile</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={formData.whatsapp_number} editable={!sameAsMobile} onChangeText={(t) => setFormData({...formData, whatsapp_number: t})} />
                </>
              )}

              <Text style={styles.label}>Native Place</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowNativeDropdown(!showNativeDropdown)}><Text style={styles.dropdownBtnText}>{formData.native_place || 'SELECT NATIVE PLACE'}</Text></TouchableOpacity>
              {showNativeDropdown && <View style={styles.dropdownList}>{NATIVE_PLACES.map((place) => (<TouchableOpacity key={place} style={styles.dropdownItem} onPress={() => { setFormData({...formData, native_place: place}); setShowNativeDropdown(false); }}><Text style={styles.dropdownItemText}>{place}</Text></TouchableOpacity>))}</View>}
              {formData.native_place === 'OTHERS' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Specify Native Place</Text>
                  <TextInput style={styles.input} autoCapitalize="characters" value={customNative} onChangeText={(t) => setCustomNative(t)} />
                </View>
              )}

              <Text style={styles.label}>Current Location (City/Town)</Text>
              <TextInput style={styles.input} autoCapitalize="characters" value={formData.current_location} onChangeText={(t) => setFormData({...formData, current_location: t})} />
              
              <Text style={styles.label}>Full Permanent Address</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} multiline={true} autoCapitalize="characters" value={formData.address} onChangeText={(t) => setFormData({...formData, address: t})} />
              
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} autoCapitalize="characters" keyboardType="email-address" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} />

              {!isAdminAuth && (
                <>
                  <Text style={styles.label}>Create Portal Password *</Text>
                  <TextInput style={styles.input} secureTextEntry={true} value={formData.password} onChangeText={(t) => setFormData({...formData, password: t})} />
                </>
              )}
            </>
          )}

          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
            {step > 1 ? (
              <TouchableOpacity style={[styles.button, {flex: 1, marginRight: 5, backgroundColor: '#6c757d'}]} onPress={() => setStep(step-1)}><Text style={styles.buttonText}>Previous</Text></TouchableOpacity>
            ) : <View style={{flex: 1}} />}
            
            {step < 3 ? (
              <TouchableOpacity style={[styles.button, {flex: 1, marginLeft: 5}]} onPress={() => setStep(step+1)}><Text style={styles.buttonText}>Next Step</Text></TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.button, {flex: 1, marginLeft: 5, backgroundColor: '#28a745', flexDirection: 'row', justifyContent: 'center'}]} onPress={handleRegister} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="white" style={{marginRight: 10}} /> : null}
                <Text style={styles.buttonText}>{isSubmitting ? 'Processing...' : 'Submit Data'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- USER DASHBOARD ---
function UserDashboard({ onNavigate, onLogout, currentUser, setCurrentUser }) {
  const [profileImage, setProfileImage] = useState(currentUser?.profile_photo || null);
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editParentsDrop, setEditParentsDrop] = useState(false);
  const [editBloodDrop, setEditBloodDrop] = useState(false);
  const [editNativeDrop, setEditNativeDrop] = useState(false);
  const [editClassDrop, setEditClassDrop] = useState(false);
  const [editSchoolTypeDrop, setEditSchoolTypeDrop] = useState(false);
  const [editMediumDrop, setEditMediumDrop] = useState(false);
  const [editEduDrop, setEditEduDrop] = useState(false);
  const [editIslamicDrop, setEditIslamicDrop] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudent = currentUser?.role === 'STUDENT';
  const isAdmin = currentUser?.role === 'ADMIN';

  const joinDate = currentUser?.join_date ? new Date(currentUser.join_date) : new Date();
  const currentDate = new Date();
  const monthsSinceJoined = ((currentDate.getFullYear() - joinDate.getFullYear()) * 12) + (currentDate.getMonth() - joinDate.getMonth()) + 1; 
  const totalPaid = parseInt(currentUser?.total_months_paid) || 0;
  const advanceMonths = totalPaid - monthsSinceJoined;
  const isSubscriptionPending = totalPaid > 0 && advanceMonths < 0 && !isStudent; 

  const EDU_CATEGORIES = ['MEDICAL', 'ENGINEERING & IT', 'ARTS & SCIENCE', 'COMMERCE & MANAGEMENT', 'LAW', 'AGRICULTURE', 'DIPLOMA / ITI', 'SCHOOL LEVEL', 'PHD / DOCTORATE', 'OTHERS'];
  const CLASSES = ['1ST STD', '2ND STD', '3RD STD', '4TH STD', '5TH STD', '6TH STD', '7TH STD', '8TH STD', '9TH STD', '10TH STD', '11TH STD', '12TH STD', 'UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'];
  const ISLAMIC_QUALS = ['AALIM', 'HAAFIZH', 'OTHERS'];
  const SCHOOL_TYPES = ['GOVERNMENT SCHOOL', 'GOVERNMENT AIDED SCHOOL', 'PRIVATE SCHOOL'];
  const COLLEGE_TYPES = ['GOVERNMENT COLLEGE', 'PRIVATE COLLEGE', 'GOVT AIDED COLLEGE', 'OTHERS'];
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const NATIVE_PLACES = ['MAHARAJAPURAM', 'THAMBIPATTI', 'KRISHNAPURAM', 'OTHERS'];
  const MEDIUMS = ['TAMIL', 'ENGLISH', 'OTHERS'];

  useEffect(() => {
    secureFetch('/api/campaigns').then((res) => res.json()).then((json) => { if (json.data) setActiveCampaigns(json.data.filter(c => c.status === 'ACTIVE')); }).catch((err) => console.error(err));
  }, []);

  const pickImage = () => {
    Alert.alert("Upload Photo", "Choose an option", [
      {
        text: "Take Photo (Camera)",
        onPress: async () => {
          const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
          if (permissionResult.granted === false) return alert("Camera permission is required!");
          let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true });
          if (!result.canceled) {
            const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
            // If in RegisterScreen use: setFormData({...formData, profile_photo: b64});
            // If in UserDashboard use: updateProfilePhotoFunction(b64);
          }
        }
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true });
          if (!result.canceled) {
            const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
            // If in RegisterScreen use: setFormData({...formData, profile_photo: b64});
            // If in UserDashboard use: updateProfilePhotoFunction(b64);
          }
        }
      },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const saveEditedProfile = async () => {
    setIsSubmitting(true);
    try {
      const res = await secureFetch('/api/admin/edit-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: currentUser.member_id, ...editFormData }) });
      if (res.ok) { alert('Profile Updated Successfully!'); setCurrentUser({...currentUser, ...editFormData}); setIsEditingProfile(false); } else alert('Save failed');
    } catch (e) { alert('Error saving.'); } finally { setIsSubmitting(false); }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 6) return alert('Password must be at least 6 characters long.');
    if (newPassword !== confirmPassword) return alert('Passwords do not match!');
    setIsSubmitting(true);
    try {
      const response = await secureFetch('/api/update-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: currentUser.member_id, new_password: newPassword }), });
      if (response.ok) { alert('Password updated successfully!'); setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); } else alert('Failed to update password.');
    } catch (error) { alert('Connection error.'); } finally { setIsSubmitting(false); }
  };

  const generateIDCardHTML = (user) => {
    const age = user.dob ? (new Date().getFullYear() - new Date(user.dob).getFullYear()) : 'N/A';
    const photoSrc = user.profile_photo || 'https://via.placeholder.com/150';
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; background: #f0f2f5; padding: 20px;}
            .card { width: 320px; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.2); text-align: center; border: 2px solid #004085; position: relative;}
            .content-layer { position: relative; z-index: 1;}
            .header { background: #004085; color: white; padding: 15px 10px; position: relative; }
            .header-logo { position: absolute; right: 15px; top: 12px; width: 45px; height: 45px; border-radius: 8px; }
            .header-title { font-size: 26px; font-weight: bold; letter-spacing: 1px; margin-bottom: 3px;}
            .header-sub { font-size: 11px; font-weight: bold;}
            .photo { width: 120px; height: 120px; border-radius: 50%; border: 4px solid #ffc107; margin: 20px auto 10px auto; object-fit: cover; }
            .name { font-size: 22px; font-weight: bold; color: #333; margin-bottom: 5px; text-transform: uppercase;}
            .id { font-size: 18px; color: #004085; font-weight: bold; margin-bottom: 15px;}
            .details { text-align: left; padding: 0 20px 20px 20px; font-size: 14px; color: #555;}
            .details div { padding: 5px 0; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="card" id="ic-card">
            <div class="content-layer">
              <div class="header">
                 <img src="./hiywalogo.jpeg" class="header-logo" />
                 <div class="header-title">HIYWA</div>
                 <div class="header-sub">Hidhayathul Islam Youth Welfare Trust</div>
              </div>
              <img src="${photoSrc}" class="photo" />
              <div class="name">${user.full_name}</div>
              <div class="id">${user.official_id}</div>
              <div class="details">
                <div><b>Role:</b> ${user.role}</div>
                <div><b>Age / Blood Group:</b> ${age} / ${user.blood_group || 'N/A'}</div>
                <div><b>Phone:</b> ${user.phone_number}</div>
                <div><b>Native:</b> ${user.native_place}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const printMyIDCard = async () => {
    const html = generateIDCardHTML(currentUser);
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        const scriptInject = `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script><script>setTimeout(()=>{html2canvas(document.getElementById('ic-card'), {scale: 2}).then(canvas=>{let a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='HIYWA_ID_${currentUser.official_id}.png';a.click(); setTimeout(()=>window.close(), 1000);})}, 800);</script>`;
        printWindow.document.write(html + scriptInject); printWindow.document.close(); printWindow.focus();
      } else {
        const { uri } = await Print.printToFileAsync({ html }); await Sharing.shareAsync(uri);
      }
    } catch(e) { alert("Failed to generate ID Card"); }
  };

  if (showIdCardModal) {
    const age = currentUser.dob ? (new Date().getFullYear() - new Date(currentUser.dob).getFullYear()) : 'N/A';
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
         <TouchableOpacity style={[styles.neatBtnDark, {alignSelf: 'flex-start', marginLeft: 20, marginBottom: 20, marginTop: 40}]} onPress={() => setShowIdCardModal(false)}><Text style={styles.neatBtnText}>← Back to Dashboard</Text></TouchableOpacity>
         <View style={styles.idCardContainer}>
            <View style={{zIndex: 1}}>
                <View style={styles.idCardHeader}>
                   <Image source={require('./hiywalogo.jpeg')} style={{ width: 45, height: 45, position: 'absolute', top: 12, right: 10, borderRadius: 8 }} resizeMode="contain" />
                   <Text style={{color: 'white', fontWeight: 'bold', fontSize: 22, textAlign: 'center', letterSpacing: 1, marginBottom: 2}}>HIYWA</Text>
                   <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11, textAlign: 'center'}}>Hidhayathul Islam Youth Welfare Trust</Text>
                </View>
                <View style={{padding: 20, alignItems: 'center'}}>
                   {profileImage ? <Image source={{uri: profileImage}} style={styles.idCardPhoto} /> : <View style={[styles.idCardPhoto, {backgroundColor: '#ccc', justifyContent:'center', alignItems:'center'}]}><Text style={{fontSize:40}}>👤</Text></View>}
                   <Text style={{fontSize: 22, fontWeight: 'bold', color: '#004085', marginTop: 10}}>{currentUser.full_name}</Text>
                   <Text style={{fontSize: 16, color: '#333', fontWeight: 'bold', marginTop: 5}}>ID: {currentUser.official_id}</Text>
                   <View style={{marginTop: 15, width: '100%', alignItems: 'flex-start'}}>
                      <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Role:</b> {currentUser.role}</Text>
                      <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Age / Blood:</b> {age} / {currentUser.blood_group || 'N/A'}</Text>
                      <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Phone:</b> {currentUser.phone_number}</Text>
                      <Text style={{fontSize: 13, color: '#555', marginBottom: 4}}><b>Native:</b> {currentUser.native_place}</Text>
                   </View>
                </View>
            </View>
         </View>
         <TouchableOpacity style={[styles.button, {marginTop: 20, width: 320}]} onPress={printMyIDCard}><Text style={styles.buttonText}>🖨️ Download / Share</Text></TouchableOpacity>
      </View>
    );
  }

  if (isEditingProfile) {
    const formattedDob = editFormData.dob ? (() => { try { const d = new Date(editFormData.dob); return isNaN(d) ? editFormData.dob : d.toISOString().split('T')[0]; } catch(e){ return editFormData.dob; }})() : '';
    const displayAadhaar = editFormData.aadhaar_number || editFormData.aadhar_number || '';
    const isCollegeEditUser = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editFormData.class_grade);

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerCentered}><Text style={styles.headerTextCentered}>Edit My Profile</Text></View>
        <ScrollView contentContainerStyle={{ padding: 15 }}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Edit Details</Text>
            
            <Text style={styles.filterLabel}>Full Name</Text>
            <TextInput style={styles.input} value={editFormData.full_name || ''} onChangeText={t=>setEditFormData({...editFormData, full_name: t})} placeholder="Full Name" />
            
            <Text style={styles.filterLabel}>Father's Name</Text>
            <TextInput style={styles.input} value={editFormData.father_name || ''} onChangeText={t=>setEditFormData({...editFormData, father_name: t})} placeholder="Father's Name" />
            
            <Text style={styles.label}>Mother's Name</Text>
            <TextInput style={styles.input} autoCapitalize="characters" value={editFormData.mother_name} onChangeText={(t) => setEditFormData({...editFormData, mother_name: t})} />

            <Text style={styles.label}>Parents Status</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditParentsDrop(!editParentsDrop)}><Text style={styles.dropdownBtnText}>{editFormData.parents_status || 'SELECT STATUS'}</Text></TouchableOpacity>
            {editParentsDrop && <View style={styles.dropdownList}>{['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED'].map(s => <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, parents_status: s}); setEditParentsDrop(false);}}><Text style={styles.dropdownItemText}>{s}</Text></TouchableOpacity>)}</View>}

            <Text style={styles.filterLabel}>Date of Birth (YYYY-MM-DD)</Text>
            {Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formattedDob} onChange={(e) => setEditFormData({...editFormData, dob: e.target.value})} /> : <TextInput style={styles.input} value={formattedDob} onChangeText={t=>setEditFormData({...editFormData, dob: t})} placeholder="DOB (YYYY-MM-DD)" />}
            
            <Text style={styles.filterLabel}>Blood Group</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditBloodDrop(!editBloodDrop)}><Text style={styles.dropdownBtnText}>{editFormData.blood_group || 'Select Blood Group'}</Text></TouchableOpacity>
            {editBloodDrop && <View style={styles.dropdownList}>{BLOOD_GROUPS.map(bg => <TouchableOpacity key={bg} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, blood_group: bg}); setEditBloodDrop(false);}}><Text style={styles.dropdownItemText}>{bg}</Text></TouchableOpacity>)}</View>}

            <Text style={styles.filterLabel}>Aadhaar Number (12 Digits)</Text>
            <TextInput style={styles.input} value={displayAadhaar} onChangeText={t=>setEditFormData({...editFormData, aadhaar_number: t})} keyboardType="numeric" maxLength={12} placeholder="12-Digit Aadhaar" />
            
            <Text style={styles.filterLabel}>Phone Number</Text>
            <TextInput style={styles.input} value={editFormData.phone_number || ''} onChangeText={t=>setEditFormData({...editFormData, phone_number: t})} keyboardType="numeric" placeholder="Phone Number" />
            
            <Text style={styles.filterLabel}>WhatsApp Number</Text>
            <TextInput style={styles.input} value={editFormData.whatsapp_number || ''} onChangeText={t=>setEditFormData({...editFormData, whatsapp_number: t})} keyboardType="numeric" placeholder="WhatsApp Number" />
            
            <Text style={styles.filterLabel}>Email</Text>
            <TextInput style={styles.input} value={editFormData.email || ''} onChangeText={t=>setEditFormData({...editFormData, email: t})} placeholder="Email" />
            
            <Text style={styles.filterLabel}>Native Place</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditNativeDrop(!editNativeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.native_place || 'Select Native Place'}</Text></TouchableOpacity>
            {editNativeDrop && <View style={styles.dropdownList}>{NATIVE_PLACES.map(np => <TouchableOpacity key={np} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, native_place: np}); setEditNativeDrop(false);}}><Text style={styles.dropdownItemText}>{np}</Text></TouchableOpacity>)}</View>}

            <Text style={styles.filterLabel}>Current Location</Text>
            <TextInput style={styles.input} value={editFormData.current_location || ''} onChangeText={t=>setEditFormData({...editFormData, current_location: t})} placeholder="Current Location" />
            
            <Text style={styles.filterLabel}>Full Address</Text>
            <TextInput style={[styles.input, {height: 60}]} multiline value={editFormData.address || ''} onChangeText={t=>setEditFormData({...editFormData, address: t})} placeholder="Full Address" />
            
            <Text style={styles.label}>Education & Occupation</Text>
            {currentUser.role === 'MEMBER' && (
               <View>
                 <Text style={styles.filterLabel}>Education Category</Text>
                 <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'Select Education'}</Text></TouchableOpacity>
                 {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, educational_qualification: el}); setEditEduDrop(false);}}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
                 <Text style={styles.filterLabel}>Course / Major Details</Text>
                 <TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} placeholder="Course / Major" />
                 <Text style={styles.filterLabel}>Occupation / Job</Text>
                 <TextInput style={styles.input} value={editFormData.occupation || ''} onChangeText={t=>setEditFormData({...editFormData, occupation: t})} placeholder="Occupation / Job" />
               </View>
            )}

            {currentUser.role === 'STUDENT' && (
               <View>
                 <Text style={styles.filterLabel}>Class / Grade</Text>
                 <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditClassDrop(!editClassDrop)}><Text style={styles.dropdownBtnText}>{editFormData.class_grade || 'Select Class'}</Text></TouchableOpacity>
                 {editClassDrop && <View style={styles.dropdownList}><ScrollView nestedScrollEnabled style={{maxHeight: 200}}>{CLASSES.map(c => <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, class_grade: c}); setEditClassDrop(false);}}><Text style={styles.dropdownItemText}>{c}</Text></TouchableOpacity>)}</ScrollView></View>}

                 <Text style={styles.filterLabel}>School / College Name</Text>
                 <TextInput style={styles.input} value={editFormData.school_name || ''} onChangeText={t=>setEditFormData({...editFormData, school_name: t})} placeholder="School Name" />
                 
                 <Text style={styles.filterLabel}>Institution Type</Text>
                 <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditSchoolTypeDrop(!editSchoolTypeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.school_type || 'Select Type'}</Text></TouchableOpacity>
                 {editSchoolTypeDrop && <View style={styles.dropdownList}>{(isCollegeEditUser ? COLLEGE_TYPES : SCHOOL_TYPES).map(st => <TouchableOpacity key={st} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, school_type: st}); setEditSchoolTypeDrop(false);}}><Text style={styles.dropdownItemText}>{st}</Text></TouchableOpacity>)}</View>}
                 
                 <Text style={styles.filterLabel}>Medium of Instruction</Text>
                 <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditMediumDrop(!editMediumDrop)}><Text style={styles.dropdownBtnText}>{editFormData.medium_of_instruction || 'Select Medium'}</Text></TouchableOpacity>
                 {editMediumDrop && <View style={styles.dropdownList}>{MEDIUMS.map(md => <TouchableOpacity key={md} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, medium_of_instruction: md}); setEditMediumDrop(false);}}><Text style={styles.dropdownItemText}>{md}</Text></TouchableOpacity>)}</View>}
                 
                 {isCollegeEditUser && (
                   <View>
                     <Text style={styles.filterLabel}>Educational Category</Text>
                     <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'Select Education'}</Text></TouchableOpacity>
                     {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, educational_qualification: el}); setEditEduDrop(false);}}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
                     <Text style={styles.filterLabel}>Course / Major Details</Text>
                     <TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} placeholder="Course / Major" />
                   </View>
                 )}
               </View>
            )}

            <Text style={styles.label}>Islamic Studies</Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
               <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='YES' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'YES'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='YES' && {color:'white'}]}>Yes</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='NO' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'NO'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='NO' && {color:'white'}]}>No</Text></TouchableOpacity>
            </View>
            
            {editFormData.islamic_studies === 'YES' && (
              <View style={{padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 15}}>
                <Text style={styles.filterLabel}>Islamic Qualification</Text>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditIslamicDrop(!editIslamicDrop)}><Text style={styles.dropdownBtnText}>{editFormData.islamic_qualification || 'Select Qualification'}</Text></TouchableOpacity>
                {editIslamicDrop && <View style={styles.dropdownList}>{ISLAMIC_QUALS.map(iq => <TouchableOpacity key={iq} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, islamic_qualification: iq}); setEditIslamicDrop(false);}}><Text style={styles.dropdownItemText}>{iq}</Text></TouchableOpacity>)}</View>}
                <Text style={styles.filterLabel}>Madrasa Name</Text>
                <TextInput style={styles.input} value={editFormData.madrasa_name || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_name: t})} placeholder="Madrasa Name" />
                <Text style={styles.filterLabel}>Madrasa Location</Text>
                <TextInput style={styles.input} value={editFormData.madrasa_location || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_location: t})} placeholder="Madrasa Location" />
              </View>
            )}

            <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15}}>
               <TouchableOpacity style={styles.neatBtnDark} onPress={() => setIsEditingProfile(false)}><Text style={styles.neatBtnText}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={styles.neatBtnSuccess} onPress={saveEditedProfile} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.neatBtnText}>💾 Save All Details</Text>}</TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#004085', padding: 15, paddingTop: Platform.OS === 'ios' ? 40 : 15, elevation: 4 }}>
        
        {/* SMALL BUTTONS ON THE LEFT */}
        <View style={{ flexDirection: 'row', marginRight: 15 }}>
          <TouchableOpacity onPress={onLogout} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#dc3545', borderRadius: 6, marginRight: isAdmin ? 8 : 0 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>🚪 Logout</Text>
          </TouchableOpacity>
          
          {isAdmin && (
            <TouchableOpacity onPress={() => onNavigate('adminDashboard')} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#ffc107', borderRadius: 6 }}>
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>⚙️ Admin</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TITLE */}
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', flex: 1 }} numberOfLines={1}>{isStudent ? 'Student Dashboard' : 'My Profile Dashboard'}</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {profileImage ? <Image source={{ uri: profileImage }} style={styles.profileImage} /> : <View style={styles.imagePlaceholder}><Text style={{ color: '#fff', fontSize: 40 }}>👤</Text><View style={styles.editBadge}><Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>EDIT</Text></View></View>}
          </TouchableOpacity>
          <Text style={styles.profileName}>{currentUser?.full_name}</Text>
          <Text style={styles.profileDetails}>ID: {currentUser?.official_id}  |  Blood: {currentUser?.blood_group}</Text>
          <Text style={styles.profileDetails}>📞 {currentUser?.phone_number}  |  📍 {currentUser?.native_place}</Text>
          
          <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 10}}>
            <TouchableOpacity style={[styles.neatBtnPrimary, {paddingVertical: 10, paddingHorizontal: 20}]} onPress={() => setShowIdCardModal(true)}><Text style={styles.neatBtnText}>🪪 View ID Card</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.neatBtnDark, {paddingVertical: 10, paddingHorizontal: 20}]} onPress={() => {setEditFormData(currentUser); setIsEditingProfile(true);}}><Text style={styles.neatBtnText}>✏️ Edit Profile</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.neatBtnDark, {paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#dc3545'}]} onPress={() => setShowPasswordModal(true)}><Text style={styles.neatBtnText}>🔑 Change Password</Text></TouchableOpacity>
          </View>

          {isStudent && <View style={{ marginTop: 10, backgroundColor: '#e9ecef', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 }}><Text style={{ fontSize: 12, fontWeight: 'bold', color: '#004085' }}>Registered Student</Text></View>}
        </View>

        {activeCampaigns.map((camp) => (
          <TouchableOpacity key={camp.campaign_id} style={styles.alertRedBox} onPress={() => onNavigate('fundraising')}><Text style={styles.alertRedText}>🚨 URGENT ACTIVE DRIVE: {camp.title} — Tap here to support this cause!</Text></TouchableOpacity>
        ))}

        {isSubscriptionPending && <TouchableOpacity style={styles.alertBox} onPress={() => onNavigate('subscription')}><Text style={styles.alertText}>⚠️ You have pending monthly subscriptions. Tap to pay now.</Text></TouchableOpacity>}

        <Text style={styles.sectionTitle}>Charitable Trust Services</Text>

        <View style={styles.gridContainer}>
          
          {!isStudent && (
             <TouchableOpacity style={[styles.gridItem, { width: '100%' }]} onPress={() => onNavigate('subscription')}>
               <Text style={styles.gridIcon}>📅</Text>
               <Text style={styles.gridText}>My Monthly Subscriptions</Text>
             </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('donate')}>
            <Text style={styles.gridIcon}>💖</Text>
            <Text style={styles.gridText}>General Donation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('fundraising')}>
            <Text style={styles.gridIcon}>📢</Text>
            <Text style={styles.gridText}>Fund Raising Drives</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.gridItem} onPress={() => alert('Competitions screen coming soon!')}>
            <Text style={styles.gridIcon}>🏆</Text>
            <Text style={styles.gridText}>Events & Competitions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => alert('Transparency screen coming soon!')}>
            <Text style={styles.gridIcon}>📊</Text>
            <Text style={styles.gridText}>Transparency Reports</Text>
          </TouchableOpacity>
        </View>

        {isStudent && (
           <View style={{ marginTop: 10, padding: 15, alignItems: 'center' }}>
             <Text style={{ textAlign: 'center', color: '#6c757d', fontSize: 13 }}>
               Monthly Subscriptions are disabled for student accounts. You can still participate in General Donations and Fund Raising.
             </Text>
           </View>
        )}
      </ScrollView>

      {showPasswordModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
             <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#004085', marginBottom: 15 }}>Change My Password</Text>
             <TextInput style={styles.input} secureTextEntry={true} value={newPassword} onChangeText={setNewPassword} placeholder="Enter New Password" />
             <TextInput style={styles.input} secureTextEntry={true} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" />
             <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 }}>
               <TouchableOpacity style={{ padding: 12, marginRight: 15 }} onPress={() => setShowPasswordModal(false)}><Text style={{ color: '#777', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={{ backgroundColor: '#dc3545', padding: 12, borderRadius: 5 }} onPress={submitNewPassword} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Update Password</Text>}</TouchableOpacity>
             </View>
          </View>
        </View>
      )}
    </View>
  );
}

// --- FUNDRAISING LIST SCREEN (USER) ---
function FundraisingListScreen({ onBack, onSelectCampaign }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    secureFetch('/api/campaigns')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setCampaigns(json.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerCentered}>
        <View style={styles.headerTopRightControls}>
          <TouchableOpacity onPress={onBack} style={styles.headerNeatBtn}>
            <Text style={styles.headerNeatBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTextCentered}>Fundraising Drives</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#004085" style={{ marginTop: 40 }} />
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Live Drives</Text>
            {campaigns.filter(c => c.status === 'ACTIVE').length === 0 ? (
               <Text style={{ textAlign: 'center', color: '#777', marginVertical: 20 }}>No active fundraising campaigns available.</Text>
            ) : campaigns.filter(c => c.status === 'ACTIVE').map((camp) => {
              const raised = parseFloat(camp.raised_amount) || 0;
              const target = parseFloat(camp.target_amount) || 1;
              const progress = Math.min(Math.round((raised / target) * 100), 100);

              return (
                <TouchableOpacity key={camp.campaign_id} style={styles.formCard} onPress={() => onSelectCampaign(camp)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={styles.sectionTitle}>{camp.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#28a745' }]}>
                      <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>ACTIVE</Text>
                    </View>
                  </View>

                  <Text style={{ color: '#555', marginBottom: 15 }} numberOfLines={2}>{camp.description}</Text>
                  
                  {camp.target_date && (
                    <Text style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Target Date: {new Date(camp.target_date).toLocaleDateString()}</Text>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontWeight: 'bold', color: '#004085' }}>Raised: Rs. {raised}</Text>
                    <Text style={{ color: '#777' }}>Target: Rs. {target}</Text>
                  </View>

                  <View style={{ height: 10, backgroundColor: '#e9ecef', borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
                    <View style={{ width: `${progress}%`, backgroundColor: '#28a745', height: '100%' }} />
                  </View>

                  <Text style={{ textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#28a745' }}>{progress}% Funded</Text>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.sectionTitle, {marginTop: 20}]}>Completed Drives</Text>
            {campaigns.filter(c => c.status !== 'ACTIVE').length === 0 ? (
               <Text style={{ textAlign: 'center', color: '#777', marginVertical: 20 }}>No closed fundraising campaigns.</Text>
            ) : campaigns.filter(c => c.status !== 'ACTIVE').map((camp) => {
              const raised = parseFloat(camp.raised_amount) || 0;
              const target = parseFloat(camp.target_amount) || 1;
              const progress = Math.min(Math.round((raised / target) * 100), 100);

              return (
                <TouchableOpacity key={camp.campaign_id} style={[styles.formCard, { opacity: 0.8 }]} onPress={() => onSelectCampaign(camp)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={styles.sectionTitle}>{camp.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#dc3545' }]}>
                      <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>CLOSED</Text>
                    </View>
                  </View>

                  <Text style={{ color: '#555', marginBottom: 15 }} numberOfLines={2}>{camp.description}</Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontWeight: 'bold', color: '#004085' }}>Raised: Rs. {raised}</Text>
                    <Text style={{ color: '#777' }}>Target: Rs. {target}</Text>
                  </View>

                  <View style={{ height: 10, backgroundColor: '#e9ecef', borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
                    <View style={{ width: `${progress}%`, backgroundColor: '#28a745', height: '100%' }} />
                  </View>

                  <Text style={{ textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#28a745' }}>{progress}% Funded</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// --- CAMPAIGN DETAIL ---
function CampaignDetailScreen({ campaign, currentUser, onBack, onViewReceipt }) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myContribution, setMyContribution] = useState(0);
  const isClosed = campaign.status === 'CLOSED';

  useEffect(() => {
    // Check how much this specific user has paid for this specific campaign
    secureFetch('/api/transactions')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          const total = json.data
            .filter(t => t.campaign_id === campaign.campaign_id && t.member_id === currentUser.member_id && t.payment_status === 'SUCCESS')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          setMyContribution(total);
        }
      }).catch(err => console.error(err));
  }, [campaign]);

  const handleUPIPayment = async () => {
    if (isClosed) return alert('This campaign is closed.');
    if (!amount || parseFloat(amount) <= 0) return alert('Enter valid amount');
    const upiUrl = `upi://pay?pa=trust@bank&pn=HIYWA%20Trust&am=${amount}&cu=INR&tn=${encodeURIComponent(campaign.title)}`;
    setIsSubmitting(true);
    if (Platform.OS === 'web') { alert(`Simulating campaign contribution of ₹${amount}`); recordDonation(); } 
    else { try { await Linking.openURL(upiUrl); recordDonation(); } catch (err) { alert('No UPI App found on your phone.'); setIsSubmitting(false); } }
  };

  const recordDonation = async () => {
    try {
      const response = await secureFetch('/api/donate-campaign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: currentUser.member_id, amount: amount, campaign_id: campaign.campaign_id, reason: `Campaign: ${campaign.title}` }) });
      const json = await response.json(); 
      if (response.ok) { alert('Thank you! Contribution recorded.'); onViewReceipt({ ...json.data, amount: amount, reason: `Campaign Support: ${campaign.title}`, official_id: currentUser.official_id, full_name: currentUser.full_name }); } 
      else alert('Database Error: ' + (json.error || 'Unknown Error'));
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerCentered}><View style={styles.headerTopRightControls}><TouchableOpacity onPress={onBack} style={styles.headerNeatBtn}><Text style={styles.headerNeatBtnText}>← Back</Text></TouchableOpacity></View><Text style={styles.headerTextCentered}>Campaign Details</Text></View>
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        <View style={styles.formCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><Text style={{ fontSize: 20, fontWeight: 'bold', color: '#004085', flex: 1, marginRight: 10 }}>{campaign.title}</Text><View style={[styles.statusBadge, { backgroundColor: isClosed ? '#dc3545' : '#28a745' }]}><Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{isClosed ? 'CLOSED' : 'ACTIVE'}</Text></View></View>
          <Text style={{ color: '#495057', fontSize: 15, lineHeight: 22, marginBottom: 20 }}>{campaign.description}</Text>
          <View style={{ backgroundColor: '#f8f9fa', padding: 15, borderRadius: 6, marginBottom: 20, borderWidth: 1, borderColor: '#dee2e6' }}><Text style={{ fontSize: 15, color: '#333', marginBottom: 5 }}>Target Goal: <Text style={{ fontWeight: 'bold' }}>₹{campaign.target_amount}</Text></Text><Text style={{ fontSize: 15, color: '#28a745', marginBottom: 5 }}>Amount Raised: <Text style={{ fontWeight: 'bold' }}>₹{campaign.raised_amount}</Text></Text>{campaign.target_date && <Text style={{ fontSize: 15, color: '#666' }}>Target Date: <Text style={{ fontWeight: 'bold' }}>{new Date(campaign.target_date).toLocaleDateString()}</Text></Text>}</View>
          {myContribution > 0 && (
            <View style={[styles.alertBox, { backgroundColor: '#d1ecf1', borderColor: '#bee5eb', marginBottom: 20 }]}>
              <Text style={[styles.alertText, { color: '#0c5460' }]}>
                🌟 You have already contributed ₹{myContribution} to this drive. Would you like to contribute more?
              </Text>
            </View>
          )}
          {isClosed ? <View style={[styles.alertBox, { backgroundColor: '#f8d7da', borderColor: '#f5c6cb' }]}><Text style={[styles.alertText, { color: '#721c24' }]}>This fundraising campaign has been closed.</Text></View> : <View><Text style={styles.label}>Contribution Amount (₹) *</Text><TextInput style={styles.input} placeholder="E.G. 500" keyboardType="numeric" value={amount} onChangeText={setAmount} /><TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Contribute via UPI</Text>}</TouchableOpacity></View>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- SUBSCRIPTION SCREEN ---
function SubscriptionScreen({ onBack, currentUser, setCurrentUser, onViewReceipt }) {
  const [monthlyRate, setMonthlyRate] = useState(0);
  const [monthsCount, setMonthsCount] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  const joinDateString = currentUser?.join_date;
  const joinDate = joinDateString ? new Date(joinDateString) : new Date();
  const currentDate = new Date();
  
  const yearsDiff = currentDate.getFullYear() - joinDate.getFullYear();
  const monthsDiff = currentDate.getMonth() - joinDate.getMonth();
  const monthsSinceJoined = (yearsDiff * 12) + monthsDiff + 1; 
  
  const totalPaid = parseInt(currentUser?.total_months_paid) || 0;
  const advanceMonths = totalPaid - monthsSinceJoined;
  
  const isPending = totalPaid > 0 && advanceMonths < 0;
  const isUpToDate = totalPaid > 0 && advanceMonths === 0;
  const isAdvance = totalPaid > 0 && advanceMonths > 0;
  
  let nextDueDate = new Date(joinDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + totalPaid);
  const nextDueMonth = nextDueDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const [optedIn, setOptedIn] = useState(false);
  const totalAmount = monthlyRate * (parseInt(monthsCount) || 1);

  const totalSubscriptionAmount = paymentHistory.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);

  useEffect(() => {
    secureFetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.monthly_subscription_amount) {
          setMonthlyRate(json.data.monthly_subscription_amount);
        }
      })
      .catch((err) => console.error(err));

    secureFetch('/api/transactions')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          const myHistory = json.data.filter(t => t.member_id === currentUser.member_id && t.donation_type === 'SUBSCRIPTION');
          setPaymentHistory(myHistory);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleUPIPayment = async () => {
    if (totalAmount <= 0) return alert('Invalid amount calculation.');
    
    const upiId = 'trust@bank'; 
    const upiUrl = `upi://pay?pa=${upiId}&pn=HIYWA%20Trust&am=${totalAmount}&cu=INR&tn=Monthly%20Subscription`;
    
    setIsSubmitting(true);
    
    if (Platform.OS === 'web') {
      alert(`Simulating payment of ₹${totalAmount} for Chrome testing.`);
      recordDonationInDatabase();
    } else {
      try {
        await Linking.openURL(upiUrl);
        recordDonationInDatabase();
      } catch (err) {
        alert('No UPI App found on your phone.');
        setIsSubmitting(false);
      }
    }
  };

  const recordDonationInDatabase = async () => {
    try {
      const response = await secureFetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: currentUser.member_id,
          amount: totalAmount, 
          donation_type: 'SUBSCRIPTION',
          payment_method: 'UPI',
          gateway_txn_id: 'UPI_REDIRECT_TEST',
          reason: 'MONTHLY SUBSCRIPTION',
          months_count: monthsCount,
          campaign_id: null
        }),
      });
      const json = await response.json(); 

      if (response.ok) {
        alert('Subscription Processed Successfully! Thank you for your support.');
        
        const parsedMonths = parseInt(monthsCount) || 1;
        const newTotalPaid = totalPaid + parsedMonths;
        
        setCurrentUser({
          ...currentUser,
          total_months_paid: newTotalPaid
        });

        onViewReceipt({
          ...json.data,
          amount: totalAmount,
          months_count: parsedMonths,
          official_id: currentUser.official_id,
          full_name: currentUser.full_name
        });
      } else {
        alert('Database Error: ' + (json.error || 'Unknown Error')); 
      }
    } catch (error) {
      console.error(error);
      alert('Connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!optedIn && totalPaid === 0) {
    return (
      <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerCentered}>
          <View style={styles.headerTopRightControls}>
            <TouchableOpacity onPress={onBack} style={styles.headerNeatBtn}>
              <Text style={styles.headerNeatBtnText}>← Back</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTextCentered}>Monthly Subscription</Text>
        </View>
        <View style={styles.formCard}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#004085' }}>
             Welcome! Are you willing to subscribe to the Trust for ₹{monthlyRate} per month?
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => setOptedIn(true)}>
             <Text style={styles.buttonText}>Yes, I am willing to subscribe</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    > 
      <View style={styles.headerCentered}>
        <View style={styles.headerTopRightControls}>
          <TouchableOpacity onPress={onBack} style={styles.headerNeatBtn}>
            <Text style={styles.headerNeatBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTextCentered}>Subscription Manager</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        
        {optedIn && totalPaid === 0 && (
          <View style={[styles.alertBox, { backgroundColor: '#d4edda', borderColor: '#c3e6cb', marginBottom: 20 }]}>
             <Text style={[styles.alertText, { color: '#155724' }]}>Thank you for your generous decision to support the Trust!</Text>
          </View>
        )}

        {isAdvance && (
          <View style={styles.statusCard}>
             <Text style={styles.statusTitle}>🌟 Up To Date & In Advance</Text>
             <Text style={styles.statusText}>Thank you! You have paid {advanceMonths} month(s) in advance.</Text>
             <View style={styles.dueDateBadge}>
               <Text style={styles.dueDateText}>Valid Until: {nextDueMonth}</Text>
             </View>
          </View>
        )}

        {isUpToDate && totalPaid > 0 && (
          <View style={styles.statusCard}>
             <Text style={styles.statusTitle}>✅ Perfectly Up To Date</Text>
             <Text style={styles.statusText}>Thank you for maintaining your regular support.</Text>
             <View style={styles.dueDateBadge}>
               <Text style={styles.dueDateText}>Next Due: {nextDueMonth}</Text>
             </View>
          </View>
        )}

        {isPending && totalPaid > 0 && (
          <View style={[styles.statusCard, { borderLeftColor: '#dc3545' }]}>
             <Text style={[styles.statusTitle, { color: '#dc3545' }]}>⚠️ Pending Subscriptions</Text>
             <Text style={styles.statusText}>You have {Math.abs(advanceMonths)} month(s) of pending subscriptions.</Text>
             <Text style={[styles.statusText, { fontWeight: 'bold' }]}>Please clear your dues to stay active.</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Pay Advance / Clear Dues</Text>
          
          <Text style={styles.label}>Quick Select Months</Text>
          <View style={styles.quickSelectContainer}>
             <TouchableOpacity style={[styles.quickBtn, monthsCount === '1' && styles.quickBtnActive]} onPress={() => setMonthsCount('1')}>
               <Text style={[styles.quickBtnText, monthsCount === '1' && styles.quickBtnTextActive]}>1 Mo</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.quickBtn, monthsCount === '3' && styles.quickBtnActive]} onPress={() => setMonthsCount('3')}>
               <Text style={[styles.quickBtnText, monthsCount === '3' && styles.quickBtnTextActive]}>3 Mo</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.quickBtn, monthsCount === '6' && styles.quickBtnActive]} onPress={() => setMonthsCount('6')}>
               <Text style={[styles.quickBtnText, monthsCount === '6' && styles.quickBtnTextActive]}>6 Mo</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.quickBtn, monthsCount === '12' && styles.quickBtnActive]} onPress={() => setMonthsCount('12')}>
               <Text style={[styles.quickBtnText, monthsCount === '12' && styles.quickBtnTextActive]}>1 Year</Text>
             </TouchableOpacity>
          </View>

          <Text style={styles.label}>Or Custom Months</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={monthsCount} onChangeText={setMonthsCount} />
          
          <View style={styles.totalBox}>
            <Text style={styles.totalBoxText}>Total Amount: ₹{totalAmount}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Pay Securely via UPI</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          
          {paymentHistory.length > 0 && (
             <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#28a745', marginBottom: 15 }}>
               Total Lifetime Contribution: ₹{totalSubscriptionAmount}
             </Text>
          )}

          {paymentHistory.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#777', marginVertical: 10 }}>No subscription history found.</Text>
          ) : (
            paymentHistory.map((txn, index) => (
              <View key={index} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyDate}>{new Date(txn.transaction_date).toLocaleDateString()}</Text>
                  <Text style={styles.historyDetails}>{txn.months_count} Month(s)  •  ₹{txn.amount}</Text>
                </View>
                <TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}>
                  <Text style={styles.receiptBtnText}>📄 View Receipt</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- DONATION PORTAL ---
function DonationPortal({ onBack, currentUser, onViewReceipt }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationHistory, setDonationHistory] = useState([]);

  useEffect(() => { secureFetch('/api/transactions').then(res => res.json()).then(json => { if (json.data) setDonationHistory(json.data.filter(t => t.member_id === currentUser.member_id && t.donation_type === 'GENERAL')); }).catch(console.error); }, []);
  const handleUPIPayment = async () => {
    if (!amount || !reason.trim()) return alert('Please enter both Amount and Reason (mandatory)');
    setIsSubmitting(true);
    if (Platform.OS === 'web') { alert(`Simulating payment of ₹${amount} for reason: ${reason}`); recordDonation(); } 
    else { try { await Linking.openURL(`upi://pay?pa=trust@bank&pn=HIYWA%20Trust&am=${amount}&cu=INR&tn=${encodeURIComponent(reason)}`); recordDonation(); } catch (err) { alert('No UPI App found on your phone.'); setIsSubmitting(false); } }
  };
  const recordDonation = async () => {
    try {
      const response = await secureFetch('/api/donate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: currentUser.member_id, amount: amount, donation_type: 'GENERAL', payment_method: 'UPI', gateway_txn_id: 'UPI_REDIRECT_TEST', reason: reason, months_count: 0, campaign_id: null }) });
      const json = await response.json(); 
      if (response.ok) { alert('Donation successful!'); onViewReceipt({ ...json.data, amount: amount, reason: reason, official_id: currentUser.official_id, full_name: currentUser.full_name }); } 
      else alert('Database Error: ' + (json.error || 'Unknown Error'));
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerCentered}><View style={styles.headerTopRightControls}><TouchableOpacity onPress={onBack} style={styles.headerNeatBtn}><Text style={styles.headerNeatBtnText}>← Back</Text></TouchableOpacity></View><Text style={styles.headerTextCentered}>General Donation</Text></View>
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Make a New Donation</Text>
          <Text style={styles.label}>Reason / Purpose *</Text>
          <TextInput style={styles.input} placeholder="E.G. FOOD DISTRIBUTION" autoCapitalize="characters" value={reason} onChangeText={(t) => setReason(t)} />
          <Text style={styles.label}>Donation Amount (₹) *</Text>
          <TextInput style={styles.input} placeholder="E.G. 1000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Donate via UPI</Text>}</TouchableOpacity>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Donation History</Text>
          {donationHistory.length === 0 ? <Text style={{ textAlign: 'center', color: '#777', marginVertical: 10 }}>No donation history found.</Text> : donationHistory.map((txn, index) => (
              <View key={index} style={styles.historyRow}>
                <View style={{ flex: 1, marginRight: 10 }}><Text style={styles.historyDate}>{new Date(txn.transaction_date).toLocaleDateString()}</Text><Text style={styles.historyDetails} numberOfLines={1}>For: {txn.reason}  •  ₹{txn.amount}</Text></View>
                <TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 View Receipt</Text></TouchableOpacity>
              </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- RECEIPT PAGE ---
function ReceiptPage({ receipt, currentUser, onBack }) {
  if (!receipt) return <View style={styles.container}><Text>No receipt data found.</Text></View>;
  const txnDate = new Date(receipt.transaction_date || Date.now()).toLocaleDateString();
  const displayId = receipt.official_id || currentUser?.official_id;
  const displayName = receipt.full_name || currentUser?.full_name;
  const particularsText = receipt.donation_type === 'FUND_RAISING' ? `${receipt.reason}` : receipt.donation_type === 'GENERAL' ? `General Donation (${receipt.reason})` : `Monthly Subscription (${receipt.months_count || 1} Months)`;

  const handlePrint = async () => {
    let logoUrl = '';
    
    try {
      // 1. Grab the local image from your app folder (update the path if you moved it to /assets)
      const asset = Asset.fromModule(require('./hiywalogo.jpeg'));
      await asset.downloadAsync();
      
      // 2. Read the image and convert it to Base64 data
      const base64Logo = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // 3. Format it so the PDF HTML can read it instantly
      logoUrl = `data:image/jpeg;base64,${base64Logo}`;
    } catch (error) {
      console.log("Could not load local logo for PDF", error);
      // Fallback transparent image so it doesn't show a broken link box if it fails
      logoUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; 
    }

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 15px; color: #333; margin: 0; display: flex; justify-content: center; }
            .receipt-container { width: 100%; max-width: 400px; border: 1px solid #ccc; padding: 20px; border-radius: 8px; position: relative; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; width: 250px; z-index: 0; pointer-events: none;}
            .content { position: relative; z-index: 1;}
            .header { text-align: center; color: #004085; font-size: 22px; font-weight: bold; margin-bottom: 2px;}
            .sub-header { text-align: center; font-size: 11px; font-weight: bold; margin-bottom: 10px; color: #555;}
            .subtitle { text-align: center; font-size: 14px; color: #666; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; border-bottom: 1px dashed #f0f0f0; padding-bottom: 5px; }
            .label { color: #666; }
            .val { font-weight: bold; color: #000; text-align: right; max-width: 60%; }
            .total-row { display: flex; justify-content: space-between; margin-top: 20px; font-size: 18px; font-weight: bold; background-color: #f8f9fa; padding: 12px; border-radius: 5px; border: 1px solid #e9ecef; color: #004085; }
            .footer { text-align: center; font-style: italic; color: #888; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <img src="${logoUrl}" class="watermark" />
            <div class="content">
              <div class="header">HIYWA</div>
              <div class="sub-header">Hidhayathul Islam Youth Welfare Trust</div>
              <div class="subtitle">Official Payment Receipt</div>
              
              <div class="row"><span class="label">Date:</span> <span class="val">${txnDate}</span></div>
              <div class="row"><span class="label">Receipt ID:</span> <span class="val">${receipt.transaction_id || 'N/A'}</span></div>
              <div class="row"><span class="label">Member ID:</span> <span class="val">${displayId}</span></div>
              <div class="row"><span class="label">Name:</span> <span class="val">${displayName}</span></div>
              
              <div style="margin: 15px 0;"></div>
              
              <div class="row"><span class="label">Particulars:</span> <span class="val">${particularsText}</span></div>
              <div class="row"><span class="label">Payment Mode:</span> <span class="val">${receipt.payment_method || 'UPI'}</span></div>
              
              <div class="total-row"><span>Total Paid:</span> <span>Rs. ${receipt.amount}</span></div>
              
              <div class="footer">Thank you for your generous support!</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const properFileName = `HIYWA_${receipt.donation_type}_Receipt_${receipt.transaction_id || 'Txn'}.pdf`;

    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        const scriptInject = `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script><script>setTimeout(()=>{html2canvas(document.querySelector('.receipt-container'), {scale: 2}).then(canvas=>{let a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='${properFileName.replace('.pdf', '.png')}';a.click(); setTimeout(()=>window.close(), 1000);})}, 800);</script>`;
        printWindow.document.write(html + scriptInject); printWindow.document.close(); printWindow.focus();
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const pdfName = `${FileSystem.documentDirectory}${properFileName}`;
        await FileSystem.moveAsync({ from: uri, to: pdfName });
        await Sharing.shareAsync(pdfName, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) { alert('Failed to share receipt.'); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.headerCentered}>
        <View style={styles.headerTopRightControls}>
          <TouchableOpacity onPress={onBack} style={styles.headerNeatBtn}>
            <Text style={styles.headerNeatBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTextCentered}>Official Receipt</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.receiptCard, {alignItems: 'center', position: 'relative', overflow: 'hidden'}]}>
          
          <Image source={require('./hiywalogo.jpeg')} style={{ position: 'absolute', top: '30%', alignSelf: 'center', width: 250, height: 250, opacity: 0.1, zIndex: 0 }} resizeMode="contain" />
          
          <View style={{zIndex: 1, width: '100%'}}>
            <Text style={styles.receiptTitle}>HIYWA</Text>
            <Text style={{textAlign: 'center', fontWeight: 'bold', fontSize: 11, marginBottom: 5}}>Hidhayathul Islam Youth Welfare Trust</Text>
            <Text style={styles.receiptSubtitle}>Official Payment Receipt</Text>
            
            <View style={styles.receiptDivider} />
            
            <View style={{width: '100%'}}>
              <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Date:</Text><Text style={styles.receiptVal}>{txnDate}</Text></View>
              <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Receipt ID:</Text><Text style={styles.receiptVal}>#{receipt.transaction_id || 'PENDING'}</Text></View>
              <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Member ID:</Text><Text style={styles.receiptVal}>{displayId}</Text></View>
              <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Name:</Text><Text style={styles.receiptVal}>{displayName}</Text></View>
              
              <View style={styles.receiptDivider} />
              
              <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Particulars:</Text><Text style={styles.receiptVal}>{particularsText}</Text></View>
              <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Payment Mode:</Text><Text style={styles.receiptVal}>{receipt.payment_method || 'UPI'}</Text></View>
            </View>

            <View style={styles.receiptTotalBox}>
              <Text style={styles.receiptTotalText}>Total Paid: Rs. {receipt.amount}</Text>
            </View>
            
            <Text style={styles.receiptFooter}>Thank you for your generous and continued support of the Trust!</Text>
            
            <TouchableOpacity style={[styles.button, { marginTop: 30, backgroundColor: '#28a745', width: '100%' }]} onPress={handlePrint}>
              <Text style={styles.buttonText}>🖨️ Download / Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- SPLASH SCREEN ---
function LoginSplashScreen({ user, onFinish }) {
  const scaleValue = useRef(new Animated.Value(0.4)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityValue, { toValue: 1, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(scaleValue, { toValue: 1, friction: 6, tension: 5, useNativeDriver: Platform.OS !== 'web' })
    ]).start();
    
    const timer = setTimeout(() => { onFinish(); }, 4500); 
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#002752' }]}>
      <Animated.Image source={require('./hiywalogo.jpeg')} style={{ width: 180, height: 180, borderRadius: 20, transform: [{ scale: scaleValue }], opacity: opacityValue, marginBottom: 30 }} resizeMode="contain" />
      <Animated.Text style={{ color: '#ffc107', fontSize: 26, fontWeight: 'bold', opacity: opacityValue, textAlign: 'center', paddingHorizontal: 20 }}>Welcome, {user.full_name}!</Animated.Text>
      <Animated.Text style={{ color: '#e9ecef', fontSize: 16, opacity: opacityValue, marginTop: 10 }}>Service for the Sake of Allah</Animated.Text>
    </View>
  );
}

// --- GLOBAL STYLES ---
const webDateStyle = { borderWidth: '1px', borderColor: '#ccc', borderRadius: '5px', padding: '12px', fontSize: '16px', marginBottom: '20px', backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', color: '#000' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f9' },
  authContainer: { flex: 1, backgroundColor: '#004085', justifyContent: 'center', alignItems: 'center', paddingVertical: 30 },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: '#004085', textAlign: 'center', marginBottom: 5 },
  authSubtitle: { fontSize: 14, color: '#6c757d', textAlign: 'center', marginBottom: 25 },
  
  headerCentered: { backgroundColor: '#004085', padding: 20, paddingTop: 50, paddingBottom: 15, position: 'relative' },
  headerTextCentered: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  headerTopRightControls: { position: 'absolute', top: 15, right: 15, flexDirection: 'row', gap: 5 },
  headerNeatBtn: { backgroundColor: '#0056b3', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 4, justifyContent: 'center', elevation: 1 },
  headerNeatBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  neatBtnSuccess: { backgroundColor: '#28a745', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, justifyContent: 'center' },
  neatBtnPrimary: { backgroundColor: '#004085', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, justifyContent: 'center' },
  neatBtnDark: { backgroundColor: '#343a40', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, justifyContent: 'center' },
  neatBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  wizardProgress: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  idCardContainer: { width: 320, backgroundColor: 'white', borderRadius: 12, borderWidth: 2, borderColor: '#004085', overflow: 'hidden', elevation: 5, position: 'relative' },
  idCardWatermark: { position: 'absolute', top: 50, left: 60, width: 200, height: 200, opacity: 0.1, zIndex: 0 },
  idCardHeader: { backgroundColor: '#004085', paddingVertical: 15, paddingHorizontal: 10, position: 'relative' },
  idCardPhoto: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#ffc107', marginTop: 10 },

  filterLabel: { fontSize: 12, fontWeight: 'bold', color: '#555', marginTop: 8, marginBottom: 4 },
  filterChipRow: { flexDirection: 'row', marginBottom: 8 },
  filterChip: { backgroundColor: '#e9ecef', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, marginRight: 6 },
  filterChipActive: { backgroundColor: '#004085' },
  filterChipText: { fontSize: 12, fontWeight: 'bold', color: '#333' },

  label: { fontSize: 13, fontWeight: 'bold', marginBottom: 5, color: '#004085' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 12, fontSize: 15, marginBottom: 20, backgroundColor: '#fafafa', color: '#000' },
  dropdownBtn: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 15, marginBottom: 20, backgroundColor: '#fafafa' },
  dropdownBtnText: { fontSize: 15, color: '#333' },
  dropdownList: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 20, marginTop: -15, elevation: 2 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownItemText: { fontSize: 15, color: '#004085', fontWeight: 'bold' },
  button: { backgroundColor: '#004085', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  roleBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 5 },
  roleBtnActive: { backgroundColor: '#004085' },
  roleBtnText: { fontSize: 15, fontWeight: 'bold', color: '#555' },
  roleBtnTextActive: { color: 'white' },
  
  profileCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 20, elevation: 3 },
  imageContainer: { position: 'relative', marginBottom: 15 },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#adb5bd', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  editBadge: { position: 'absolute', bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', width: '100%', paddingVertical: 3, alignItems: 'center' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#004085', marginBottom: 5 },
  profileDetails: { fontSize: 14, color: '#555', marginBottom: 5 },
  alertBox: { backgroundColor: '#f8d7da', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#f5c6cb', marginBottom: 20 },
  alertText: { color: '#721c24', fontWeight: 'bold', textAlign: 'center' },
  
  alertRedBox: { backgroundColor: '#fff5f5', padding: 16, borderRadius: 8, borderWidth: 2, borderColor: '#e53e3e', marginBottom: 20, elevation: 3 },
  alertRedText: { color: '#9b2c2c', fontWeight: 'bold', textAlign: 'center', fontSize: 14, letterSpacing: 0.5 },

  // 1. Constrain Auth forms (Login & Registration)
  authCard: {
    backgroundColor: 'white',
    width: '90%',
    maxWidth: 440,
    alignSelf: 'center',
    padding: 35,
    borderRadius: 16,
    boxShadow: '0 10px 25px rgba(0, 39, 82, 0.1)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // 2. Constrain Dashboard Containers
  formCard: {
    backgroundColor: 'white',
    marginVertical: 12,
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  },

  // 3. Make Form Fields 2-Columns on Wide Screens
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  gridItem: {
    backgroundColor: 'white',
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 280,
    padding: 22,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, paddingLeft: 5 },
  gridIcon: { fontSize: 30, marginBottom: 10 },
  gridText: { fontSize: 14, fontWeight: 'bold', color: '#004085', textAlign: 'center' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, alignSelf: 'flex-start' },
  infoBadge: { backgroundColor: '#e9ecef', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 4 },
  infoBadgeTxt: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  detailTxt: { fontSize: 15, color: '#555', marginBottom: 6 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#e9ecef', margin: 15, borderRadius: 8, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  tabBtnActive: { backgroundColor: '#004085' },
  tabBtnText: { fontWeight: 'bold', color: '#555', fontSize: 14 },
  tabBtnTextActive: { color: 'white' },
  adminCard: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: '#dee2e6' },
  adminCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  adminCardMeta: { fontSize: 13, color: '#666', marginBottom: 3 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f3f5', paddingTop: 10 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, backgroundColor: '#e9ecef', marginLeft: 10, marginBottom: 5 },
  actionBtnText: { fontSize: 13, fontWeight: 'bold', color: '#333' },

  statGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBoxLarge: { backgroundColor: '#004085', padding: 15, borderRadius: 8, width: '31%', alignItems: 'center', elevation: 2 },
  statLargeVal: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  statLargeKey: { fontSize: 11, color: '#e9ecef', textAlign: 'center', marginTop: 5 },
  statWrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statChip: { backgroundColor: '#e9ecef', padding: 10, borderRadius: 6, width: '48%', flexDirection: 'column' },
  statChipKey: { fontSize: 13, color: '#333', fontWeight: 'bold' },
  statChipVal: { fontSize: 14, color: '#004085', fontWeight: 'bold' },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: 'white', width: '90%', padding: 25, borderRadius: 10, elevation: 5 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#004085', borderRadius: 4, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#004085' },
  
  statusCard: { backgroundColor: 'white', padding: 20, borderRadius: 8, elevation: 2, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#28a745' },
  statusTitle: { fontSize: 18, fontWeight: 'bold', color: '#28a745', marginBottom: 10 },
  statusText: { fontSize: 15, color: '#555', marginBottom: 5 },
  dueDateBadge: { backgroundColor: '#e9ecef', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'flex-start', marginTop: 10 },
  dueDateText: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  quickSelectContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  quickBtn: { backgroundColor: '#e9ecef', paddingVertical: 12, borderRadius: 5, width: '23%', alignItems: 'center' },
  quickBtnActive: { backgroundColor: '#004085' },
  quickBtnText: { fontWeight: 'bold', color: '#555' },
  quickBtnTextActive: { color: 'white' },
  totalBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 5, marginBottom: 20, borderWidth: 1, borderColor: '#dee2e6' },
  totalBoxText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#004085' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 15 },
  historyDate: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  historyDetails: { fontSize: 14, color: '#777' },
  receiptBtn: { backgroundColor: '#e9ecef', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5, borderWidth: 1, borderColor: '#ccc' },
  receiptBtnText: { fontSize: 14, fontWeight: 'bold', color: '#004085' },
  
  receiptCard: { backgroundColor: 'white', padding: 25, borderRadius: 10, elevation: 4, position: 'relative', overflow: 'hidden' },
  receiptTitle: { fontSize: 26, fontWeight: 'bold', color: '#004085', textAlign: 'center', marginBottom: 0, letterSpacing: 1 },
  receiptSubtitle: { fontSize: 14, color: '#6c757d', textAlign: 'center', marginBottom: 20, marginTop: 10 },
  receiptDivider: { borderBottomWidth: 1, borderBottomColor: '#dee2e6', marginVertical: 15 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  receiptLabel: { fontSize: 15, color: '#555', fontWeight: 'bold' },
  receiptVal: { fontSize: 15, color: '#333', flexShrink: 1, textAlign: 'right', marginLeft: 10 },
  receiptTotalBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 6, marginTop: 10, borderWidth: 1, borderColor: '#dee2e6' },
  receiptTotalText: { fontSize: 18, fontWeight: 'bold', color: '#004085', textAlign: 'center' },
  receiptFooter: { fontSize: 13, fontStyle: 'italic', color: '#777', textAlign: 'center', marginTop: 25 },
});