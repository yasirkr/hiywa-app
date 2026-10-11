import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Image, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, BackHandler, KeyboardAvoidingView, useWindowDimensions } from 'react-native';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBK8-yEDwHb1G7AkKMQPu9ptxYB1zmiEDI",
  authDomain: "hiywa-27651.firebaseapp.com",
  projectId: "hiywa-27651",
  storageBucket: "hiywa-27651.firebasestorage.app",
  messagingSenderId: "596413315692",
  appId: "1:596413315692:web:177ddba0ffa9fc5eea3649"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- RESPONSIVE HELPERS (compact on mobile, unchanged on desktop) ---
const IS_MOBILE = Dimensions.get('window').width < 768;
const sz = (mob, desk) => (IS_MOBILE ? mob : desk);
const PAD = sz(12, 24);

// --- CROSS-PLATFORM HELPERS ---
// Alert.alert with buttons does NOT work on web, so use window.confirm there.
const confirmAction = (title, message, onConfirm, confirmText = 'Confirm', destructive = true) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm }
    ]);
  }
};

// Photo picker that works on web (direct file chooser) and native (camera / gallery choice)
const pickPhoto = (onPicked) => {
  const handleResult = (result) => {
    if (result && !result.canceled && result.assets && result.assets[0] && result.assets[0].base64) {
      onPicked(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };
  const fromGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!p.granted) return alert('Gallery permission required!');
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.1, base64: true });
      handleResult(result);
    } catch (e) { alert('Could not open gallery: ' + e.message); }
  };
  const fromCamera = async () => {
    try {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      if (!p.granted) return alert('Camera permission is required!');
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.1, base64: true });
      handleResult(result);
    } catch (e) { alert('Could not open camera: ' + e.message); }
  };
  if (Platform.OS === 'web') {
    fromGallery();
  } else {
    Alert.alert('Upload Photo', 'Choose an option', [
      { text: 'Take Photo (Camera)', onPress: fromCamera },
      { text: 'Choose from Gallery', onPress: fromGallery },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }
};

// --- CONSTANTS ---
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

const generateIDCardHTML = (user) => {
  const age = user.dob ? (new Date().getFullYear() - new Date(user.dob).getFullYear()) : 'N/A';
  const photoSrc = user.profile_photo || 'https://via.placeholder.com/150';
  return `
    <html><head><style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #e2e8f0; }
      .badge-card { width: 350px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,39,82,0.15); border: 1px solid #cbd5e1; position: relative; }
      .badge-top { background: linear-gradient(135deg, #002752 0%, #004085 100%); color: #ffffff; padding: 22px 16px 45px 16px; text-align: center; }
      .org-title { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
      .org-sub { font-size: 10px; font-weight: 600; opacity: 0.85; margin-top: 3px; letter-spacing: 0.5px; }
      .photo-wrapper { width: 110px; height: 110px; margin: -55px auto 12px auto; border-radius: 55px; border: 4px solid #ffffff; overflow: hidden; background: #f8fafc; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
      .photo-wrapper img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 19px; font-weight: 700; color: #004085; text-align: center; text-transform: uppercase; }
      .role-chip { display: inline-block; background: #e0f2fe; color: #004085; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 20px; margin: 6px auto 14px auto; text-align: center; }
      .id-strip { background: #f8fafc; padding: 8px 16px; font-size: 12px; font-weight: 700; color: #334155; text-align: center; border-top: 1px dashed #e2e8f0; border-bottom: 1px dashed #e2e8f0; }
      .meta-table { width: 100%; padding: 14px 20px 20px 20px; font-size: 13px; color: #475569; }
      .meta-table tr td { padding: 5px 0; }
      .meta-table tr td:first-child { font-weight: 600; color: #64748b; width: 40%; }
      .meta-table tr td:last-child { font-weight: 700; color: #1e293b; text-align: right; }
      .footer-strip { background: #002752; color: #ffffff; font-size: 10px; text-align: center; padding: 8px; font-weight: 500; letter-spacing: 0.5px; }
    </style></head>
    <body><div class="badge-card" id="ic-card">
      <div class="badge-top"><div class="org-title">HIYWA</div><div class="org-sub">HIDHAYATHUL ISLAM YOUTH WELFARE TRUST</div></div>
      <div class="photo-wrapper"><img src="${photoSrc}" /></div>
      <div class="name">${user.full_name}</div>
      <div style="text-align: center;"><span class="role-chip">${user.role}</span></div>
      <div class="id-strip">OFFICIAL ID: ${user.official_id}</div>
      <table class="meta-table"><tr><td>Native Place</td><td>${user.native_place || 'N/A'}</td></tr><tr><td>Blood Group</td><td>${user.blood_group || 'N/A'}</td></tr><tr><td>Age</td><td>${age} Years</td></tr><tr><td>Contact</td><td>${user.phone_number || 'N/A'}</td></tr></table>
      <div class="footer-strip">COMMITTED TO SERVICE & COMMUNITY WELFARE</div>
    </div></body></html>
  `;
};

// --- SHARED ID CARD VIEW (works on web + native) ---
function IDCardView({ user }) {
  const age = user.dob ? (new Date().getFullYear() - new Date(user.dob).getFullYear()) : 'N/A';
  const row = (label, value) => (
    <Text style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}><Text style={{ fontWeight: '800' }}>{label}: </Text>{value}</Text>
  );
  return (
    <View style={styles.idCardContainer}>
      <View style={{ zIndex: 1 }}>
        <View style={styles.idCardHeader}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22, textAlign: 'center', letterSpacing: 1, marginBottom: 2 }}>HIYWA</Text>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>Hidhayathul Islam Youth Welfare Trust</Text>
        </View>
        <View style={{ padding: 20, alignItems: 'center' }}>
          {user.profile_photo ? <Image source={{ uri: user.profile_photo }} style={styles.idCardPhoto} /> : <View style={[styles.idCardPhoto, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 40 }}>👤</Text></View>}
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#004085', marginTop: 10, textAlign: 'center' }}>{user.full_name}</Text>
          <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '800', marginTop: 5 }}>ID: {user.official_id}</Text>
          <View style={{ marginTop: 15, width: '100%', alignItems: 'flex-start' }}>
            {row('Role', user.role)}
            {row('Age / Blood', `${age} / ${user.blood_group || 'N/A'}`)}
            {row('Phone', user.phone_number)}
          </View>
        </View>
      </View>
    </View>
  );
}

// ==========================================
// 1. MASTER LAYOUT & SIDEBAR COMPONENT
// ==========================================
function DashboardLayout({ currentUser, currentView, setCurrentView, onLogout, children }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => { setIsOpen(!isMobile); }, [isMobile]);

  const handleNav = (view) => {
    setCurrentView(view);
    if (isMobile) setIsOpen(false);
  };

  const isCore = currentUser?.is_core_admin;
  const perms = currentUser?.admin_permissions || '[]';
  const hasPerm = (p) => isCore || perms.includes('ALL') || perms.includes(p);
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStudent = currentUser?.role === 'STUDENT';

  const NavButton = ({ title, icon, viewId }) => {
    const isActive = currentView === viewId;
    return (
      <TouchableOpacity style={[styles.sidebarBtn, isActive && styles.sidebarBtnActive]} onPress={() => handleNav(viewId)}>
        <Text style={{ fontSize: sz(17, 20), marginRight: 12 }}>{icon}</Text>
        <Text style={[styles.sidebarBtnText, isActive && styles.sidebarBtnTextActive]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F0F4F8' }}>
      {isMobile && isOpen && <TouchableOpacity style={styles.sidebarOverlay} activeOpacity={1} onPress={() => setIsOpen(false)} />}

      {(isOpen || !isMobile) && (
        <View style={[styles.sidebarContainer, isMobile && styles.sidebarMobileAbsolute]}>
          <View style={styles.sidebarHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('./hiywalogo.jpeg')} style={{ width: sz(34, 40), height: sz(34, 40), borderRadius: 8, marginRight: 10 }} />
              <View>
                <Text style={styles.sidebarBrand}>HIYWA</Text>
                <Text style={styles.sidebarRole}>{currentUser?.role}</Text>
                {currentUser && <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '800', marginTop: 4 }}>ID: {currentUser.official_id}</Text>}
              </View>
            </View>
          </View>

          <ScrollView style={{ flex: 1, paddingTop: 10, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.sidebarSectionLabel}>MY ACCOUNT</Text>
            <NavButton title="My Profile" icon="👤" viewId="dashboard" />
            {!isStudent && <NavButton title="Subscriptions" icon="📅" viewId="subscription" />}
            <NavButton title="Make Donation" icon="💖" viewId="donate" />
            <NavButton title="Fund Drives" icon="📢" viewId="fundraising" />

            {isAdmin && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sidebarSectionLabel}>ADMINISTRATION</Text>
                {isCore && <NavButton title="Overview Stats" icon="📊" viewId="admin_stats" />}
                {(hasPerm('MANAGE_USERS') || isCore) && (
                  <>
                    <NavButton title="Member Directory" icon="👥" viewId="admin_users" />
                    <NavButton title="Student Directory" icon="🎓" viewId="admin_students" />
                    {isCore && <NavButton title="Admin Roles" icon="🛡️" viewId="admin_roles" />}
                  </>
                )}
                {(hasPerm('MANAGE_FINANCE') || isCore) && (
                  <>
                    <NavButton title="Finance Ledger" icon="💵" viewId="admin_finance" />
                    <NavButton title="Trust Expenses" icon="💸" viewId="admin_expense" />
                  </>
                )}
                {(hasPerm('MANAGE_CAMPAIGNS') || isCore) && <NavButton title="Campaign Control" icon="📢" viewId="admin_campaigns" />}
                {isCore && <NavButton title="System Settings" icon="⚙️" viewId="admin_settings" />}
              </View>
            )}
          </ScrollView>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={{ color: '#F87171', fontWeight: 'bold', fontSize: 14 }}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
        <View style={styles.contentHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isMobile && (
              <TouchableOpacity onPress={() => setIsOpen(true)} style={{ marginRight: 12, padding: 6 }}>
                <Text style={{ fontSize: 22, color: '#004085' }}>☰</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.contentTitle}>
              {currentView === 'dashboard' ? 'Overview' :
               currentView === 'admin_stats' ? 'Overview Stats' :
               currentView === 'admin_users' ? 'Member Directory' :
               currentView === 'admin_students' ? 'Student Directory' :
               currentView === 'admin_finance' ? 'Finance Ledger' :
               currentView === 'admin_expense' ? 'Trust Expenses' :
               currentView === 'admin_campaigns' ? 'Campaign Control' :
               currentView === 'admin_settings' ? 'System Settings' :
               currentView === 'admin_roles' ? 'Admin Roles' :
               currentView === 'donate' ? 'General Donation' :
               currentView === 'subscription' ? 'My Subscriptions' :
               currentView === 'fundraising' ? 'Fund Drives' :
               currentView === 'campaignDetail' ? 'Campaign Details' :
               currentView === 'receipt' ? 'Official Receipt' : 'Portal'}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </View>
  );
}

// --- GLOBAL UI STATE ---
let globalShowPastDrives = false;

// ==========================================
// 2. MAIN APP ROUTER
// ==========================================
export default function MainApp() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [splashUser, setSplashUser] = useState(null);

  const [registerRole, setRegisterRole] = useState(null);
  const [receiptBackView, setReceiptBackView] = useState('dashboard');

  useEffect(() => {
    const backAction = () => {
      if (currentView === 'register') { setCurrentView('login'); return true; }
      if (currentView === 'campaignDetail') { setCurrentView('fundraising'); return true; }
      if (currentView === 'receipt') { setCurrentView(receiptBackView); return true; }
      if (currentView === 'login' || currentView === 'dashboard' || currentView === 'admin_stats') {
        Alert.alert("Exit HIYWA App", "Are you sure you want to exit?", [{ text: "Cancel", style: "cancel" }, { text: "YES, EXIT", onPress: () => BackHandler.exitApp() }]);
        return true;
      }
      setCurrentView('dashboard'); return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    if (Platform.OS === 'web') {
      const handleWebBack = (e) => {
        e.preventDefault();
        if (window.confirm("⚠️ Are you sure you want to exit the HIYWA portal? You will be logged out.")) {
          setCurrentUser(null); setCurrentView('login');
        } else {
          window.history.pushState(null, '', window.location.href);
        }
      };
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handleWebBack);
      return () => { backHandler.remove(); window.removeEventListener('popstate', handleWebBack); };
    }

    return () => backHandler.remove();
  }, [currentView, currentUser, receiptBackView]);

  if (splashUser) return <LoginSplashScreen user={splashUser} onFinish={() => { setCurrentUser(splashUser); setCurrentView(splashUser.role === 'ADMIN' ? 'admin_stats' : 'dashboard'); setSplashUser(null); }} />;
  if (currentView === 'login') return <LoginScreen onNavigate={setCurrentView} onLogin={setSplashUser} />;

  if (currentView === 'register') return <RegisterScreen defaultRole={null} isAdminAuth={false} onBack={() => setCurrentView('login')} />;

  const handleDashboardNav = (view, passedRole = null) => {
    setRegisterRole(passedRole);
    setCurrentView(view);
  };

  return (
    <DashboardLayout currentUser={currentUser} currentView={currentView} setCurrentView={setCurrentView} onLogout={() => { setCurrentUser(null); setCurrentView('login'); }}>
      {currentView === 'dashboard' && <UserDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} onNavigate={handleDashboardNav} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('dashboard'); setCurrentView('receipt'); }} />}

      {(currentView === 'admin_stats' || currentView === 'admin_users' || currentView === 'admin_students' || currentView === 'admin_finance' || currentView === 'admin_campaigns' || currentView === 'admin_expense' || currentView === 'admin_settings' || currentView === 'admin_roles') &&
        <AdminDashboard currentUser={currentUser} activeTab={currentView.replace('admin_', '').toUpperCase()} onNavigate={handleDashboardNav} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView(currentView); setCurrentView('receipt'); }} />
      }

      {currentView === 'adminRegister' && <RegisterScreen defaultRole={registerRole} isAdminAuth={true} onBack={() => setCurrentView(registerRole === 'STUDENT' ? 'admin_students' : 'admin_users')} />}

      {currentView === 'donate' && <DonationPortal currentUser={currentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('donate'); setCurrentView('receipt'); }} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'subscription' && <SubscriptionScreen currentUser={currentUser} setCurrentUser={setCurrentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('subscription'); setCurrentView('receipt'); }} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'fundraising' && <FundraisingListScreen currentUser={currentUser} onSelectCampaign={(camp) => { setSelectedCampaign(camp); setCurrentView('campaignDetail'); }} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('fundraising'); setCurrentView('receipt'); }} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'campaignDetail' && <CampaignDetailScreen campaign={selectedCampaign} currentUser={currentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('campaignDetail'); setCurrentView('receipt'); }} onBack={() => setCurrentView('fundraising')} />}
      {currentView === 'receipt' && <ReceiptPage receipt={selectedReceipt} currentUser={currentUser} onBack={() => setCurrentView(receiptBackView)} />}
    </DashboardLayout>
  );
}

// --- COMPACT DROPDOWN FILTER ---
const FilterDropdown = ({ label, value, options, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, minWidth: sz(95, 110), zIndex: open ? 100 : 1, marginBottom: 6 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#004085', marginBottom: 4, textTransform: 'uppercase' }}>{label}</Text>
      <TouchableOpacity style={[styles.dropdownBtn, { marginBottom: 0, paddingVertical: 8, paddingHorizontal: 10, height: 42, justifyContent: 'center' }]} onPress={() => setOpen(!open)}>
        <Text style={[styles.dropdownBtnText, { fontSize: 12 }]} numberOfLines={1}>{value || 'ALL'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdownList, { position: 'absolute', top: 62, left: 0, right: 0, zIndex: 100, marginBottom: 0, marginTop: 0 }]}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { onSelect(''); setOpen(false); }}><Text style={styles.dropdownItemText}>ALL</Text></TouchableOpacity>
            {options.map(o => (
              <TouchableOpacity key={o} style={styles.dropdownItem} onPress={() => { onSelect(o); setOpen(false); }}><Text style={styles.dropdownItemText}>{o}</Text></TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// --- LOGIN SCREEN ---
function LoginScreen({ onNavigate, onLogin }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forcePassUser, setForcePassUser] = useState(null);

  const [showResetAlert, setShowResetAlert] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = async () => {
    if (!loginId || !password) return alert('Please enter your Official Login ID and password');
    setIsSubmitting(true);
    try {
      const userSnap = await getDoc(doc(db, 'members', loginId.toUpperCase()));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password === password) {
          // BLOCK deactivated / deceased accounts
          if (userData.membership_status && userData.membership_status !== 'ACTIVE') {
            alert(`Login Blocked: Your account is ${userData.membership_status}. Please contact the Trust admin.`);
            return;
          }
          if (password === 'Hiywa@123') {
            setForcePassUser(userData);
            setShowResetAlert(true);
          } else {
            onLogin(userData);
          }
        } else alert('Login Failed: Incorrect Password');
      } else alert('Login Failed: Official ID not found');
    } catch (error) { alert('Login error: ' + error.message); } finally { setIsSubmitting(false); }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 6) return alert('Password must be at least 6 characters long.');
    if (newPassword !== confirmPassword) return alert('Passwords do not match!');
    if (newPassword === 'Hiywa@123') return alert('Choose a different password.');
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'members', forcePassUser.official_id), { password: newPassword });
      alert('Password updated successfully!'); onLogin({ ...forcePassUser, password: newPassword });
    } catch (error) { alert('Failed to update password: ' + error.message); } finally { setIsSubmitting(false); }
  };

  if (forcePassUser) {
    if (showResetAlert) {
      return (
        <View style={styles.authContainer}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { alignItems: 'center', zIndex: 1000 }]}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
              <Text style={{ fontSize: sz(18, 22), fontWeight: '900', color: '#004085', marginBottom: 12, textAlign: 'center' }}>Password Update Required</Text>
              <Text style={{ fontSize: sz(13, 15), color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>For security reasons, you must change your default password before accessing the portal.</Text>
              <TouchableOpacity style={[styles.button, { width: '100%' }]} onPress={() => setShowResetAlert(false)}>
                <Text style={styles.buttonText}>OK, Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView style={styles.authContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Update Required</Text>
          <Text style={styles.authSubtitle}>Create a new secure password.</Text>

          <Text style={styles.label}>New Password</Text>
          <View style={{ position: 'relative' }}>
            <TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showNewPassword} value={newPassword} onChangeText={setNewPassword} />
            <TouchableOpacity style={{ position: 'absolute', right: 15, top: sz(12, 18), zIndex: 1 }} onPress={() => setShowNewPassword(!showNewPassword)}>
              <Text style={{ fontSize: 18 }}>{showNewPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm New Password</Text>
          <View style={{ position: 'relative' }}>
            <TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
            <TouchableOpacity style={{ position: 'absolute', right: 15, top: sz(12, 18), zIndex: 1 }} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Text style={{ fontSize: 18 }}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={submitNewPassword} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save & Login</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.authContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.authCard}>
        <View style={{ alignItems: 'center', marginBottom: 12 }}><Image source={require('./hiywalogo.jpeg')} style={{ width: sz(64, 80), height: sz(64, 80), borderRadius: 16 }} resizeMode="contain" /></View>
        <Text style={styles.authTitle}>HIYWA Connect</Text>
        <Text style={styles.authSubtitle}>Secure Member Portal</Text>
        <Text style={styles.label}>Official Login ID</Text>
        <TextInput style={styles.input} autoCapitalize="characters" value={loginId} onChangeText={(t) => setLoginId(t.replace(/\s/g, ''))} />
        <Text style={styles.label}>Password</Text>
        <View style={{ position: 'relative' }}>
          <TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity style={{ position: 'absolute', right: 15, top: sz(12, 18), zIndex: 1 }} onPress={() => setShowPassword(!showPassword)}><Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Secure Login</Text>}</TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => onNavigate('register')}><Text style={{ color: '#004085', fontWeight: '800' }}>New Member? Register Here</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- USER DASHBOARD ---
function UserDashboard({ currentUser, setCurrentUser, onNavigate, onViewReceipt }) {
  const [profileImage, setProfileImage] = useState(currentUser?.profile_photo || null);
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editParentsDrop, setEditParentsDrop] = useState(false);
  const [editBloodDrop, setEditBloodDrop] = useState(false);
  const [editNativeDrop, setEditNativeDrop] = useState(false);
  const [editClassDrop, setEditClassDrop] = useState(false);
  const [editSchoolTypeDrop, setEditSchoolTypeDrop] = useState(false);
  const [editMediumDrop, setEditMediumDrop] = useState(false);
  const [editEduDrop, setEditEduDrop] = useState(false);
  const [editIslamicDrop, setEditIslamicDrop] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campSnap = await getDocs(collection(db, 'campaigns'));
        const sortedCamps = campSnap.docs.map(d => d.data()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setActiveCampaigns(sortedCamps.filter(c => {
          const goalMet = (parseFloat(c.raised_amount) || 0) >= (parseFloat(c.target_amount) || 1);
          return c.status === 'ACTIVE' && !goalMet;
        }));
      } catch (err) {}
    };
    fetchData();
  }, []);

  const pickImage = () => {
    pickPhoto((b64) => {
      setProfileImage(b64);
      setEditFormData(prev => ({ ...prev, profile_photo: b64 }));
    });
  };

  const saveEditedProfile = async () => {
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'members', currentUser.official_id), editFormData);
      alert('Profile Updated Successfully!'); setCurrentUser({ ...currentUser, ...editFormData }); setIsEditingProfile(false);
    } catch (e) { alert('Error saving.'); } finally { setIsSubmitting(false); }
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
    } catch (e) { alert("Failed to generate ID Card"); }
  };

  if (showIdCardModal) {
    return (
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: PAD }}>
        <TouchableOpacity style={[styles.neatBtnDark, { alignSelf: 'flex-start', marginBottom: 20 }]} onPress={() => setShowIdCardModal(false)}><Text style={styles.neatBtnTextDark}>← Back to Dashboard</Text></TouchableOpacity>
        <IDCardView user={{ ...currentUser, profile_photo: profileImage || currentUser.profile_photo }} />
        <TouchableOpacity style={[styles.button, { marginTop: 20, width: 320, maxWidth: '100%' }]} onPress={printMyIDCard}><Text style={styles.buttonText}>🖨️ Download / Share</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  if (isEditingProfile) {
    const formattedDob = editFormData.dob ? (() => { try { const d = new Date(editFormData.dob); return isNaN(d) ? editFormData.dob : d.toISOString().split('T')[0]; } catch (e) { return editFormData.dob; } })() : '';
    const isCollegeEditUser = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editFormData.class_grade);

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: PAD }}>
          <View style={styles.formCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Edit Profile</Text>
              <TouchableOpacity style={styles.neatBtnDark} onPress={() => setIsEditingProfile(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
                {editFormData.profile_photo ? <Image source={{ uri: editFormData.profile_photo }} style={{ width: 90, height: 90, borderRadius: 45 }} /> : <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}><Text>📷 Photo</Text></View>}
                <Text style={{ color: '#0056b3', fontWeight: '800', marginTop: 8 }}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Full Name</Text><TextInput style={styles.input} value={editFormData.full_name || ''} onChangeText={t => setEditFormData({ ...editFormData, full_name: t })} />
            <Text style={styles.label}>Father's Name</Text><TextInput style={styles.input} value={editFormData.father_name || ''} onChangeText={t => setEditFormData({ ...editFormData, father_name: t })} />
            <Text style={styles.label}>Mother's Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.mother_name || ''} onChangeText={(t) => setEditFormData({ ...editFormData, mother_name: t })} />
            <Text style={styles.label}>Parents Status</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditParentsDrop(!editParentsDrop)}><Text style={styles.dropdownBtnText}>{editFormData.parents_status || 'SELECT STATUS'}</Text></TouchableOpacity>
            {editParentsDrop && <View style={styles.dropdownList}>{['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED'].map(s => <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, parents_status: s }); setEditParentsDrop(false); }}><Text style={styles.dropdownItemText}>{s}</Text></TouchableOpacity>)}</View>}
            <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
            {Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formattedDob} onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })} /> : <TextInput style={styles.input} value={formattedDob} onChangeText={t => setEditFormData({ ...editFormData, dob: t })} />}
            <Text style={styles.label}>Blood Group</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditBloodDrop(!editBloodDrop)}><Text style={styles.dropdownBtnText}>{editFormData.blood_group || 'SELECT BLOOD GROUP'}</Text></TouchableOpacity>
            {editBloodDrop && <View style={styles.dropdownList}>{BLOOD_GROUPS.map(bg => <TouchableOpacity key={bg} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, blood_group: bg }); setEditBloodDrop(false); }}><Text style={styles.dropdownItemText}>{bg}</Text></TouchableOpacity>)}</View>}

            <Text style={styles.label}>Phone Number</Text><TextInput style={styles.input} value={editFormData.phone_number || ''} onChangeText={t => setEditFormData({ ...editFormData, phone_number: t })} keyboardType="numeric" />
            <Text style={styles.label}>WhatsApp Number</Text><TextInput style={styles.input} value={editFormData.whatsapp_number || ''} onChangeText={t => setEditFormData({ ...editFormData, whatsapp_number: t })} keyboardType="numeric" />
            <Text style={styles.label}>Email</Text><TextInput style={styles.input} value={editFormData.email || ''} onChangeText={t => setEditFormData({ ...editFormData, email: t })} />
            <Text style={styles.label}>Native Place</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditNativeDrop(!editNativeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.native_place || 'SELECT NATIVE PLACE'}</Text></TouchableOpacity>
            {editNativeDrop && <View style={styles.dropdownList}>{NATIVE_PLACES.map(np => <TouchableOpacity key={np} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, native_place: np }); setEditNativeDrop(false); }}><Text style={styles.dropdownItemText}>{np}</Text></TouchableOpacity>)}</View>}
            <Text style={styles.label}>Current Location</Text><TextInput style={styles.input} value={editFormData.current_location || ''} onChangeText={t => setEditFormData({ ...editFormData, current_location: t })} />
            <Text style={styles.label}>Full Address</Text><TextInput style={[styles.input, { height: 60 }]} multiline value={editFormData.address || ''} onChangeText={t => setEditFormData({ ...editFormData, address: t })} />

            {currentUser.role === 'MEMBER' && (
              <View>
                <Text style={styles.label}>Education Category</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'SELECT EDUCATION'}</Text></TouchableOpacity>
                {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, educational_qualification: el }); setEditEduDrop(false); }}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
                <Text style={styles.label}>Course / Major Details</Text><TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t => setEditFormData({ ...editFormData, course_details: t })} />
                <Text style={styles.label}>Occupation / Job</Text><TextInput style={styles.input} value={editFormData.occupation || ''} onChangeText={t => setEditFormData({ ...editFormData, occupation: t })} />
              </View>
            )}

            {currentUser.role === 'STUDENT' && (
              <View>
                <Text style={styles.label}>Class / Grade</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditClassDrop(!editClassDrop)}><Text style={styles.dropdownBtnText}>{editFormData.class_grade || 'SELECT CLASS'}</Text></TouchableOpacity>
                {editClassDrop && <View style={styles.dropdownList}><ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>{CLASSES.map(c => <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, class_grade: c }); setEditClassDrop(false); }}><Text style={styles.dropdownItemText}>{c}</Text></TouchableOpacity>)}</ScrollView></View>}
                <Text style={styles.label}>School / College Name</Text><TextInput style={styles.input} value={editFormData.school_name || ''} onChangeText={t => setEditFormData({ ...editFormData, school_name: t })} />
                <Text style={styles.label}>Institution Type</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditSchoolTypeDrop(!editSchoolTypeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.school_type || 'SELECT TYPE'}</Text></TouchableOpacity>
                {editSchoolTypeDrop && <View style={styles.dropdownList}>{(isCollegeEditUser ? COLLEGE_TYPES : SCHOOL_TYPES).map(st => <TouchableOpacity key={st} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, school_type: st }); setEditSchoolTypeDrop(false); }}><Text style={styles.dropdownItemText}>{st}</Text></TouchableOpacity>)}</View>}
                <Text style={styles.label}>Medium of Instruction</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditMediumDrop(!editMediumDrop)}><Text style={styles.dropdownBtnText}>{editFormData.medium_of_instruction || 'SELECT MEDIUM'}</Text></TouchableOpacity>
                {editMediumDrop && <View style={styles.dropdownList}>{MEDIUMS.map(md => <TouchableOpacity key={md} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, medium_of_instruction: md }); setEditMediumDrop(false); }}><Text style={styles.dropdownItemText}>{md}</Text></TouchableOpacity>)}</View>}
                {isCollegeEditUser && (
                  <View>
                    <Text style={styles.label}>Educational Category</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'SELECT EDUCATION'}</Text></TouchableOpacity>
                    {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, educational_qualification: el }); setEditEduDrop(false); }}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
                    <Text style={styles.label}>Course / Major Details</Text><TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t => setEditFormData({ ...editFormData, course_details: t })} />
                  </View>
                )}
              </View>
            )}

            <Text style={styles.label}>Islamic Studies</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies === 'YES' && styles.filterChipActive]} onPress={() => setEditFormData({ ...editFormData, islamic_studies: 'YES' })}><Text style={[styles.filterChipText, editFormData.islamic_studies === 'YES' && { color: 'white' }]}>Yes</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies === 'NO' && styles.filterChipActive]} onPress={() => setEditFormData({ ...editFormData, islamic_studies: 'NO' })}><Text style={[styles.filterChipText, editFormData.islamic_studies === 'NO' && { color: 'white' }]}>No</Text></TouchableOpacity>
            </View>

            {editFormData.islamic_studies === 'YES' && (
              <View style={{ padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
                <Text style={styles.label}>Islamic Qualification</Text>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditIslamicDrop(!editIslamicDrop)}><Text style={styles.dropdownBtnText}>{editFormData.islamic_qualification || 'SELECT QUALIFICATION'}</Text></TouchableOpacity>
                {editIslamicDrop && <View style={styles.dropdownList}>{ISLAMIC_QUALS.map(iq => <TouchableOpacity key={iq} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, islamic_qualification: iq }); setEditIslamicDrop(false); }}><Text style={styles.dropdownItemText}>{iq}</Text></TouchableOpacity>)}</View>}
                <Text style={styles.label}>Madrasa Name</Text><TextInput style={styles.input} value={editFormData.madrasa_name || ''} onChangeText={t => setEditFormData({ ...editFormData, madrasa_name: t })} />
                <Text style={styles.label}>Madrasa Location</Text><TextInput style={styles.input} value={editFormData.madrasa_location || ''} onChangeText={t => setEditFormData({ ...editFormData, madrasa_location: t })} />
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={saveEditedProfile} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save Profile Data</Text>}</TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: PAD }}>

      <View style={[styles.formCard, { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: sz(14, 24) }]}>
        <View style={{ position: 'relative' }}>
          {profileImage ? <Image source={{ uri: profileImage }} style={{ width: sz(84, 120), height: sz(84, 120), borderRadius: sz(42, 60) }} /> : <View style={{ width: sz(84, 120), height: sz(84, 120), borderRadius: sz(42, 60), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 36 }}>👤</Text></View>}
        </View>

        <View style={{ flex: 1, minWidth: sz(180, 250) }}>
          <Text style={{ fontSize: sz(20, 28), fontWeight: '900', color: '#004085', letterSpacing: -0.5 }}>{currentUser?.full_name}</Text>
          <Text style={{ fontSize: sz(12, 15), color: '#64748B', marginTop: 4, fontWeight: '600' }}>
            Blood: {currentUser?.blood_group}  •  {currentUser?.phone_number}  •  {currentUser?.native_place}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setShowIdCardModal(true)}>
              <Text style={styles.neatBtnText}>🪪 View ID Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.neatBtnDark} onPress={() => { setEditFormData(currentUser); setIsEditingProfile(true); }}>
              <Text style={styles.neatBtnTextDark}>✏️ Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {activeCampaigns.map((camp) => (
        <TouchableOpacity key={camp.campaign_id} style={styles.alertRedBox} onPress={() => onNavigate('fundraising')}>
          <Text style={styles.alertRedText}>🚨 URGENT DRIVE: {camp.title} — Tap to support!</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Quick Actions</Text>

      <View style={styles.bentoGrid}>
        {currentUser?.role !== 'STUDENT' && (
          <TouchableOpacity style={styles.bentoBox} onPress={() => onNavigate('subscription')}>
            <View>
              <View style={styles.bentoIconWrap}><Text style={{ fontSize: 22 }}>📅</Text></View>
              <Text style={styles.bentoTitle}>Subscriptions</Text>
              <Text style={styles.bentoDesc}>Manage your monthly Trust contributions and view history.</Text>
            </View>
            <View style={{ marginTop: sz(12, 24), alignSelf: 'flex-start' }}><Text style={{ color: '#004085', fontWeight: '800', fontSize: 13 }}>MANAGE ↗</Text></View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.bentoBox} onPress={() => onNavigate('donate')}>
          <View>
            <View style={[styles.bentoIconWrap, { backgroundColor: '#FEF2F2' }]}><Text style={{ fontSize: 22 }}>💖</Text></View>
            <Text style={styles.bentoTitle}>General Donation</Text>
            <Text style={styles.bentoDesc}>Make a one-time contribution to the Trust's general fund.</Text>
          </View>
          <View style={{ marginTop: sz(12, 24), alignSelf: 'flex-start' }}><Text style={{ color: '#E11D48', fontWeight: '800', fontSize: 13 }}>DONATE ↗</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bentoBox} onPress={() => onNavigate('fundraising')}>
          <View>
            <View style={[styles.bentoIconWrap, { backgroundColor: '#ECFDF5' }]}><Text style={{ fontSize: 22 }}>📢</Text></View>
            <Text style={styles.bentoTitle}>Fund Drives</Text>
            <Text style={styles.bentoDesc}>Participate in active campaigns for specific causes.</Text>
          </View>
          <View style={{ marginTop: sz(12, 24), alignSelf: 'flex-start' }}><Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>VIEW CAUSES ↗</Text></View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// --- UPI PAYMENT HELPER FUNCTION ---
const openUPI = async (amount, reason) => {
  try {
    const sDoc = await getDoc(doc(db, 'settings', 'global'));
    const upiId = sDoc.exists() ? sDoc.data().primary_upi : null;
    if (!upiId) { alert("Admin has not set a Trust UPI ID yet."); return false; }

    const url = `upi://pay?pa=${upiId}&pn=HIYWA_Trust&am=${amount}&cu=INR&tn=${encodeURIComponent(reason)}`;
    if (Platform.OS === 'web') {
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) { window.location.href = url; }
      else { alert(`Desktop detected. Please open your UPI app and send ₹${amount} to: ${upiId}`); }
    } else {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url); else alert(`No UPI app found. Send to: ${upiId}`);
    }
    return true;
  } catch (e) { return false; }
};

// --- ADMIN DASHBOARD ---
function AdminDashboard({ currentUser, activeTab, onNavigate, onViewReceipt }) {
  const isCore = currentUser?.is_core_admin;
  const perms = currentUser?.admin_permissions || '[]';
  const hasPerm = (p) => isCore || perms.includes('ALL') || perms.includes(p);

  const [directory, setDirectory] = useState([]);
  const [globalTxns, setGlobalTxns] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subAmount, setSubAmount] = useState('100');
  const [primaryUpi, setPrimaryUpi] = useState('');
  const [secondaryUpi, setSecondaryUpi] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');

  const [configModal, setConfigModal] = useState(null);

  const [selectedDetailUser, setSelectedDetailUser] = useState(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [promoteIsEdit, setPromoteIsEdit] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const [viewCampDonors, setViewCampDonors] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ blood: '', edu: '', gender: '', native: '', marital: '', status: '', islamic: '' });

  const [financeTab, setFinanceTab] = useState('LEDGER');
  const [finSearchQuery, setFinSearchQuery] = useState('');
  const [finTypeFilter, setFinTypeFilter] = useState('');
  const [finStartDate, setFinStartDate] = useState('');
  const [finEndDate, setFinEndDate] = useState('');

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

  const [cashUser, setCashUser] = useState(null);
  const [cashType, setCashType] = useState('SUBSCRIPTION');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [cashMonths, setCashMonths] = useState('1');
  const [cashCampId, setCashCampId] = useState('');

  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campTarget, setCampTarget] = useState('');
  const [campStatus, setCampStatus] = useState('ACTIVE');

  const [promoteUserId, setPromoteUserId] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState({ MANAGE_USERS: false, MANAGE_FINANCE: false, MANAGE_CAMPAIGNS: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (hasPerm('MANAGE_USERS') || isCore) {
        const membersSnap = await getDocs(collection(db, 'members'));
        setDirectory(membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      if (hasPerm('MANAGE_FINANCE') || isCore || activeTab === 'SETTINGS' || activeTab === 'EXPENSE') {
        const txnsSnap = await getDocs(collection(db, 'transactions'));
        setGlobalTxns(txnsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          const d = settingsDoc.data();
          setSubAmount(d.monthly_subscription_amount || '100');
          setPrimaryUpi(d.primary_upi || '');
          setSecondaryUpi(d.secondary_upi || '');
          setInitialAmount(d.initial_amount || '0');
        }
      }
      if (hasPerm('MANAGE_CAMPAIGNS') || isCore) {
        const campSnap = await getDocs(collection(db, 'campaigns'));
        setCampaigns(campSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    setSelectedDetailUser(null);
    fetchData();
  }, [activeTab]);

  // Calculations
  const stats = { roles: {}, bloodGroups: {}, marital: {}, education: {}, native: {}, gender: {} };
  const incrementStat = (cat, val, role) => { if (!val) return; if (!stats[cat][val]) stats[cat][val] = { total: 0, M: 0, S: 0 }; stats[cat][val].total += 1; if (role === 'STUDENT') stats[cat][val].S += 1; else stats[cat][val].M += 1; };
  directory.filter(u => !u.is_core_admin).forEach(u => { stats.roles[u.role] = (stats.roles[u.role] || 0) + 1; incrementStat('bloodGroups', u.blood_group, u.role); incrementStat('marital', u.marital_status, u.role); incrementStat('education', u.educational_qualification, u.role); incrementStat('native', u.native_place, u.role); incrementStat('gender', u.gender, u.role); });

  const renderSplitBlocks = (statObj) => Object.entries(statObj).sort((a, b) => b[1].total - a[1].total).map(([key, val]) => (
    <View key={key} style={styles.statChip}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={styles.statChipKey} numberOfLines={1}>{key}</Text><Text style={styles.statChipVal}>{val.total}</Text></View><Text style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: 'bold' }}>Mem: {val.M} | Stu: {val.S}</Text></View>
  ));

  const filteredDirectory = directory
    .filter(u => activeTab === 'STUDENTS' ? u.role === 'STUDENT' : (u.role === 'MEMBER' || u.role === 'ADMIN'))
    .filter(u => !searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.official_id?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(u => !filters.status || u.membership_status === filters.status).filter(u => !filters.blood || u.blood_group === filters.blood).filter(u => !filters.gender || u.gender === filters.gender).filter(u => !filters.edu || u.educational_qualification === filters.edu).filter(u => !filters.islamic || u.islamic_qualification === filters.islamic).filter(u => !filters.native || u.native_place === filters.native).filter(u => !filters.marital || u.marital_status === filters.marital);

  const allIncomes = globalTxns.filter(t => t.donation_type !== 'EXPENSE');
  const allExpenses = globalTxns.filter(t => t.donation_type === 'EXPENSE');

  const filteredTxns = allIncomes.filter(t => {
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
  }).filter(u => u.duesMonths > 0).sort((a, b) => b.duesMonths - a.duesMonths);

  const totalFinSubs = allIncomes.filter(t => t.donation_type === 'SUBSCRIPTION').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalFinGen = allIncomes.filter(t => t.donation_type === 'GENERAL').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalFinCamp = allIncomes.filter(t => t.donation_type === 'FUND_RAISING' || t.donation_type === 'CAMPAIGN').reduce((sum, t) => sum + Number(t.amount), 0);

  const totalIncomeVal = allIncomes.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenseVal = allExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const currentBalance = Number(initialAmount) + totalIncomeVal - totalExpenseVal;

  const submitExpenseLog = async () => {
    if (!expenseAmount || isNaN(expenseAmount) || Number(expenseAmount) <= 0 || !expenseReason) return alert('Enter valid amount and reason.');
    const txnId = `EXP_${Date.now()}`;
    const payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: currentUser.official_id, full_name: currentUser.full_name, amount: expenseAmount, payment_method: 'CASH/BANK', donation_type: 'EXPENSE', reason: expenseReason.toUpperCase() };
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      alert('Expense logged successfully!'); setExpenseModalVisible(false); setExpenseAmount(''); setExpenseReason(''); fetchData();
    } catch (e) { alert('Failed to log expense.'); }
  };

  // Administrative Logic Actions
  const handleToggleStatus = async (officialId, currentStatus, overrideTarget = null) => {
    const targetStatus = overrideTarget || (currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    const executeToggle = async () => { try { await updateDoc(doc(db, 'members', officialId), { membership_status: targetStatus }); alert(`Status updated to ${targetStatus}`); setSelectedDetailUser(null); fetchData(); } catch (error) { alert('Failed to modify status.'); } };
    if (overrideTarget === 'DECEASED') confirmAction("Confirm Deceased Status", "Are you sure?", executeToggle);
    else executeToggle();
  };

  const handleDemoteAdmin = (officialId) => {
    confirmAction("Revoke Admin Rights", "Revoke administrative access for this user? They will become a normal Member.", async () => {
      try {
        await updateDoc(doc(db, 'members', officialId), { role: 'MEMBER', is_core_admin: false, admin_permissions: '[]' });
        alert('Admin rights revoked.');
        setSelectedDetailUser(null); fetchData();
      } catch (e) { alert('Failed to revoke: ' + e.message); }
    }, 'Revoke');
  };

  const handleConvertStudent = (officialId) => {
    confirmAction("Upgrade Student", "Upgrade to Member profile?", async () => {
      try { await updateDoc(doc(db, 'members', officialId), { role: 'MEMBER' }); alert('Converted to Member.'); setSelectedDetailUser(null); fetchData(); } catch (e) { alert('Failed to convert.'); }
    }, 'Upgrade', false);
  };

  const openPromoteModal = (officialId) => {
    setPromoteUserId(officialId);
    setPromoteIsEdit(false);
    setSelectedPerms({ MANAGE_USERS: false, MANAGE_FINANCE: false, MANAGE_CAMPAIGNS: false });
    setPromoteModalVisible(true);
  };

  const openEditRights = (admin) => {
    let list = [];
    try { list = JSON.parse(admin.admin_permissions || '[]'); } catch (e) {}
    setPromoteUserId(admin.official_id);
    setPromoteIsEdit(true);
    setSelectedPerms({ MANAGE_USERS: list.includes('MANAGE_USERS'), MANAGE_FINANCE: list.includes('MANAGE_FINANCE'), MANAGE_CAMPAIGNS: list.includes('MANAGE_CAMPAIGNS') });
    setPromoteModalVisible(true);
  };

  const submitPromotion = async () => {
    const permsArray = []; if (selectedPerms.MANAGE_USERS) permsArray.push("MANAGE_USERS"); if (selectedPerms.MANAGE_FINANCE) permsArray.push("MANAGE_FINANCE"); if (selectedPerms.MANAGE_CAMPAIGNS) permsArray.push("MANAGE_CAMPAIGNS");
    if (permsArray.length === 0) return alert(promoteIsEdit ? "Select at least one permission, or use Revoke Admin to remove all rights." : "Select at least one permission.");
    try {
      await updateDoc(doc(db, 'members', promoteUserId), { role: 'ADMIN', admin_permissions: JSON.stringify(permsArray) });
      alert(promoteIsEdit ? 'Admin rights updated!' : 'Promoted to Sub-Admin successfully!');
      setPromoteModalVisible(false); setSelectedDetailUser(null); fetchData();
    } catch (e) { alert('Failed to save admin rights.'); }
  };

  const saveEditedUser = async () => {
    try {
      await updateDoc(doc(db, 'members', selectedDetailUser.official_id), editFormData);
      alert('Details updated in Firebase!'); setIsEditingUser(false); setSelectedDetailUser(null); fetchData();
    } catch (e) { alert('Error updating user: ' + e.message); }
  };

  const resetUserPasswordAdmin = async () => {
    try { await updateDoc(doc(db, 'members', selectedDetailUser.official_id), { password: 'Hiywa@123' }); alert('Password reset to default: Hiywa@123'); setResetModalVisible(false); } catch (error) { alert('Connection error.'); }
  };

  const uploadPhotoForUser = (officialId) => {
    pickPhoto(async (b64) => {
      try {
        await updateDoc(doc(db, 'members', officialId), { profile_photo: b64 });
        alert('Photo uploaded!');
        setSelectedDetailUser(prev => ({ ...prev, profile_photo: b64 }));
        setEditFormData(prev => ({ ...prev, profile_photo: b64 }));
        fetchData();
      } catch (e) { alert('Error saving photo.'); }
    });
  };

  const submitCashPayment = async () => {
    if (!cashAmount || isNaN(cashAmount) || Number(cashAmount) <= 0) return alert('Enter valid amount.');
    const txnId = `CASH_${Date.now()}`;
    let payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: cashUser.official_id, full_name: cashUser.full_name, role: cashUser.role, amount: cashAmount, payment_method: 'CASH (OFFLINE)', gateway_txn_id: txnId };
    if (cashType === 'SUBSCRIPTION') { payload.donation_type = 'SUBSCRIPTION'; payload.months_count = cashMonths; payload.reason = 'OFFLINE CASH SUBSCRIPTION'; }
    else if (cashType === 'GENERAL') { if (!cashReason) return alert('Reason is required.'); payload.donation_type = 'GENERAL'; payload.reason = cashReason; payload.months_count = 0; }
    else if (cashType === 'CAMPAIGN') { if (!cashCampId) return alert('Select campaign ID.'); const cName = campaigns.find(c => c.campaign_id == cashCampId)?.title || 'Campaign'; payload.campaign_id = cashCampId; payload.reason = `Cash Support: ${cName}`; payload.donation_type = 'FUND_RAISING'; }
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      if (cashType === 'SUBSCRIPTION') { const newTotal = (parseInt(cashUser.total_months_paid) || 0) + parseInt(cashMonths || 1); await updateDoc(doc(db, 'members', cashUser.official_id), { total_months_paid: newTotal }); }
      if (cashType === 'CAMPAIGN') { const campRef = doc(db, 'campaigns', cashCampId); const cSnap = await getDoc(campRef); await updateDoc(campRef, { raised_amount: (parseFloat(cSnap.data().raised_amount) || 0) + parseFloat(cashAmount) }); }
      alert('Offline cash payment logged successfully!'); setCashModalVisible(false); fetchData(); onViewReceipt({ ...payload, official_id: cashUser.official_id });
    } catch (e) { alert('Failed to log payment.'); }
  };

  const downloadCSV = async (csvString, filename) => {
    if (Platform.OS === 'web') { try { const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } else window.open(encodeURI("data:text/csv;charset=utf-8," + csvString)); } catch (e) { alert("Browser blocked the download."); }
    } else { try { const uri = FileSystem.documentDirectory + filename; await FileSystem.writeAsStringAsync(uri, csvString, { encoding: FileSystem.EncodingType.UTF8 }); await Sharing.shareAsync(uri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' }); } catch (e) { alert("Export failed on mobile."); } }
  };

  const printIDCard = async (user) => {
    const html = generateIDCardHTML(user);
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html); printWindow.document.close(); printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e) { alert("Failed to generate PDF"); }
  };

  const renderUserDetail = () => {
    const u = selectedDetailUser;
    const isPromotedSubAdmin = u.role === 'ADMIN' && !u.is_core_admin;
    const age = u.dob ? (new Date().getFullYear() - new Date(u.dob).getFullYear()) : 'Unknown';

    if (showIdCardModal) {
      return (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity style={[styles.neatBtnDark, { alignSelf: 'flex-start', marginBottom: 20 }]} onPress={() => setShowIdCardModal(false)}><Text style={styles.neatBtnTextDark}>← Back to Profile</Text></TouchableOpacity>
          <IDCardView user={u} />
          <TouchableOpacity style={[styles.button, { marginTop: 20, width: 320, maxWidth: '100%' }]} onPress={() => printIDCard(u)}><Text style={styles.buttonText}>🖨️ Download / Share</Text></TouchableOpacity>
        </View>
      );
    }

    if (isEditingUser) {
      const formattedDob = editFormData.dob ? (() => { try { const d = new Date(editFormData.dob); return isNaN(d) ? editFormData.dob : d.toISOString().split('T')[0]; } catch (e) { return editFormData.dob; } })() : '';
      const displayAadhaar = editFormData.aadhaar_number || editFormData.aadhar_number || '';
      const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editFormData.class_grade);

      return (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit Details for {u.full_name}</Text>

          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => pickPhoto((b64) => setEditFormData(prev => ({ ...prev, profile_photo: b64 })))} style={{ alignItems: 'center' }}>
              {editFormData.profile_photo ? <Image source={{ uri: editFormData.profile_photo }} style={{ width: 90, height: 90, borderRadius: 45 }} /> : <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}><Text>📷 Photo</Text></View>}
              <Text style={{ color: '#0056b3', fontWeight: '800', marginTop: 8 }}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Personal Details</Text>
          <Text style={styles.filterLabel}>Full Name</Text><TextInput style={styles.input} value={editFormData.full_name || ''} onChangeText={t => setEditFormData({ ...editFormData, full_name: t })} />
          <Text style={styles.filterLabel}>Father's Name</Text><TextInput style={styles.input} value={editFormData.father_name || ''} onChangeText={t => setEditFormData({ ...editFormData, father_name: t })} />
          <Text style={styles.label}>Mother's Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.mother_name || ''} onChangeText={(t) => setEditFormData({ ...editFormData, mother_name: t })} />

          <Text style={styles.label}>Parents Status</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditParentsDrop(!editParentsDrop)}><Text style={styles.dropdownBtnText}>{editFormData.parents_status || 'SELECT STATUS'}</Text></TouchableOpacity>
          {editParentsDrop && <View style={styles.dropdownList}>{['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED'].map((s) => (<TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, parents_status: s }); setEditParentsDrop(false); }}><Text style={styles.dropdownItemText}>{s}</Text></TouchableOpacity>))}</View>}

          <Text style={styles.filterLabel}>Gender</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditGenderDrop(!editGenderDrop)}><Text style={styles.dropdownBtnText}>{editFormData.gender || 'Select Gender'}</Text></TouchableOpacity>
          {editGenderDrop && <View style={styles.dropdownList}>{GENDERS.map(g => <TouchableOpacity key={g} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, gender: g }); setEditGenderDrop(false); }}><Text style={styles.dropdownItemText}>{g}</Text></TouchableOpacity>)}</View>}

          <Text style={styles.filterLabel}>Date of Birth</Text>
          {Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formattedDob} onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })} /> : <TextInput style={styles.input} value={formattedDob} onChangeText={t => setEditFormData({ ...editFormData, dob: t })} placeholder="DOB (YYYY-MM-DD)" />}

          <Text style={styles.filterLabel}>Blood Group</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditBloodDrop(!editBloodDrop)}><Text style={styles.dropdownBtnText}>{editFormData.blood_group || 'Select Blood Group'}</Text></TouchableOpacity>
          {editBloodDrop && <View style={styles.dropdownList}>{BLOOD_GROUPS.map(bg => <TouchableOpacity key={bg} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, blood_group: bg }); setEditBloodDrop(false); }}><Text style={styles.dropdownItemText}>{bg}</Text></TouchableOpacity>)}</View>}

          <Text style={styles.filterLabel}>Marital Status</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditMaritalDrop(!editMaritalDrop)}><Text style={styles.dropdownBtnText}>{editFormData.marital_status || 'Select Marital Status'}</Text></TouchableOpacity>
          {editMaritalDrop && <View style={styles.dropdownList}>{MARITAL_STATUS.map(ms => <TouchableOpacity key={ms} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, marital_status: ms }); setEditMaritalDrop(false); }}><Text style={styles.dropdownItemText}>{ms}</Text></TouchableOpacity>)}</View>}

          <Text style={styles.filterLabel}>Aadhaar Number (12 Digits)</Text>
          <TextInput style={styles.input} value={displayAadhaar} onChangeText={t => setEditFormData({ ...editFormData, aadhaar_number: t })} keyboardType="numeric" maxLength={12} placeholder="Aadhaar Number" />

          <Text style={styles.label}>Contact & Location</Text>
          <Text style={styles.filterLabel}>Phone Number</Text><TextInput style={styles.input} value={editFormData.phone_number || ''} onChangeText={t => setEditFormData({ ...editFormData, phone_number: t })} keyboardType="numeric" />
          <Text style={styles.filterLabel}>WhatsApp Number</Text><TextInput style={styles.input} value={editFormData.whatsapp_number || ''} onChangeText={t => setEditFormData({ ...editFormData, whatsapp_number: t })} keyboardType="numeric" />
          <Text style={styles.filterLabel}>Email</Text><TextInput style={styles.input} value={editFormData.email || ''} onChangeText={t => setEditFormData({ ...editFormData, email: t })} />

          <Text style={styles.filterLabel}>Native Place</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditNativeDrop(!editNativeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.native_place || 'Select Native Place'}</Text></TouchableOpacity>
          {editNativeDrop && <View style={styles.dropdownList}>{NATIVE_PLACES.map(np => <TouchableOpacity key={np} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, native_place: np }); setEditNativeDrop(false); }}><Text style={styles.dropdownItemText}>{np}</Text></TouchableOpacity>)}</View>}

          <Text style={styles.filterLabel}>Current Location</Text><TextInput style={styles.input} value={editFormData.current_location || ''} onChangeText={t => setEditFormData({ ...editFormData, current_location: t })} />
          <Text style={styles.filterLabel}>Full Address</Text><TextInput style={[styles.input, { height: 60 }]} multiline value={editFormData.address || ''} onChangeText={t => setEditFormData({ ...editFormData, address: t })} />

          <Text style={styles.label}>Education & Occupation</Text>

          {editFormData.role !== 'STUDENT' && (
            <View>
              <Text style={styles.filterLabel}>Education Category</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'Select Education'}</Text></TouchableOpacity>
              {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, educational_qualification: el }); setEditEduDrop(false); }}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
              <Text style={styles.filterLabel}>Course / Major</Text><TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t => setEditFormData({ ...editFormData, course_details: t })} />
              <Text style={styles.filterLabel}>Occupation / Job</Text><TextInput style={styles.input} value={editFormData.occupation || ''} onChangeText={t => setEditFormData({ ...editFormData, occupation: t })} />
            </View>
          )}

          {editFormData.role === 'STUDENT' && (
            <View>
              <Text style={styles.filterLabel}>Class / Grade</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditClassDrop(!editClassDrop)}><Text style={styles.dropdownBtnText}>{editFormData.class_grade || 'Select Class / Grade'}</Text></TouchableOpacity>
              {editClassDrop && <View style={styles.dropdownList}><ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>{CLASSES.map(c => <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, class_grade: c }); setEditClassDrop(false); }}><Text style={styles.dropdownItemText}>{c}</Text></TouchableOpacity>)}</ScrollView></View>}

              <Text style={styles.filterLabel}>School / College Name</Text><TextInput style={styles.input} value={editFormData.school_name || ''} onChangeText={t => setEditFormData({ ...editFormData, school_name: t })} />

              <Text style={styles.filterLabel}>Institution Type</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditSchoolTypeDrop(!editSchoolTypeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.school_type || 'Select Institution Type'}</Text></TouchableOpacity>
              {editSchoolTypeDrop && <View style={styles.dropdownList}>{(isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES).map(st => <TouchableOpacity key={st} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, school_type: st }); setEditSchoolTypeDrop(false); }}><Text style={styles.dropdownItemText}>{st}</Text></TouchableOpacity>)}</View>}

              <Text style={styles.filterLabel}>Institution Location</Text><TextInput style={styles.input} value={editFormData.school_location || ''} onChangeText={t => setEditFormData({ ...editFormData, school_location: t })} />

              <Text style={styles.filterLabel}>Medium of Instruction</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditMediumDrop(!editMediumDrop)}><Text style={styles.dropdownBtnText}>{editFormData.medium_of_instruction || 'Select Medium'}</Text></TouchableOpacity>
              {editMediumDrop && <View style={styles.dropdownList}>{MEDIUMS.map(md => <TouchableOpacity key={md} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, medium_of_instruction: md }); setEditMediumDrop(false); }}><Text style={styles.dropdownItemText}>{md}</Text></TouchableOpacity>)}</View>}

              {isCollegeEdit && (
                <View>
                  <Text style={styles.filterLabel}>Education Category</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'Select Category'}</Text></TouchableOpacity>
                  {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, educational_qualification: el }); setEditEduDrop(false); }}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
                  <Text style={styles.filterLabel}>Course / Major Details</Text><TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t => setEditFormData({ ...editFormData, course_details: t })} />
                </View>
              )}
            </View>
          )}

          <Text style={styles.label}>Islamic Studies</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
            <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies === 'YES' && styles.filterChipActive]} onPress={() => setEditFormData({ ...editFormData, islamic_studies: 'YES' })}><Text style={[styles.filterChipText, editFormData.islamic_studies === 'YES' && { color: 'white' }]}>Yes</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies === 'NO' && styles.filterChipActive]} onPress={() => setEditFormData({ ...editFormData, islamic_studies: 'NO' })}><Text style={[styles.filterChipText, editFormData.islamic_studies === 'NO' && { color: 'white' }]}>No</Text></TouchableOpacity>
          </View>
          {editFormData.islamic_studies === 'YES' && (
            <View style={{ padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
              <Text style={styles.filterLabel}>Qualification</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditIslamicDrop(!editIslamicDrop)}><Text style={styles.dropdownBtnText}>{editFormData.islamic_qualification || 'Select Qualification'}</Text></TouchableOpacity>
              {editIslamicDrop && <View style={styles.dropdownList}>{ISLAMIC_QUALS.map(iq => <TouchableOpacity key={iq} style={styles.dropdownItem} onPress={() => { setEditFormData({ ...editFormData, islamic_qualification: iq }); setEditIslamicDrop(false); }}><Text style={styles.dropdownItemText}>{iq}</Text></TouchableOpacity>)}</View>}

              <Text style={styles.filterLabel}>Madrasa Name</Text><TextInput style={styles.input} value={editFormData.madrasa_name || ''} onChangeText={t => setEditFormData({ ...editFormData, madrasa_name: t })} />
              <Text style={styles.filterLabel}>Madrasa Location</Text><TextInput style={styles.input} value={editFormData.madrasa_location || ''} onChangeText={t => setEditFormData({ ...editFormData, madrasa_location: t })} />
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <TouchableOpacity style={styles.neatBtnDark} onPress={() => setIsEditingUser(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.neatBtnSuccess} onPress={saveEditedUser}><Text style={styles.neatBtnText}>💾 Save All Details</Text></TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.formCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <TouchableOpacity style={styles.neatBtnDark} onPress={() => setSelectedDetailUser(null)}><Text style={styles.neatBtnTextDark}>← Back to List</Text></TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setShowIdCardModal(true)}><Text style={styles.neatBtnText}>🪪 ID Card</Text></TouchableOpacity>
            <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => { setEditFormData(u); setIsEditingUser(true); }}><Text style={styles.neatBtnText}>✏️ Edit Profile</Text></TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: sz(14, 24), flexWrap: 'wrap' }}>
          <View style={{ alignItems: 'center', marginBottom: 15 }}>
            {u.profile_photo ? (<Image source={{ uri: u.profile_photo }} style={{ width: sz(110, 150), height: sz(110, 150), borderRadius: sz(55, 75), borderWidth: 4, borderColor: '#F8FAFC' }} />) : (<View style={{ width: sz(110, 150), height: sz(110, 150), borderRadius: sz(55, 75), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 44 }}>👤</Text></View>)}
            <TouchableOpacity style={{ marginTop: 10 }} onPress={() => uploadPhotoForUser(u.official_id)}><Text style={{ color: '#0056b3', fontWeight: '900' }}>Change Photo</Text></TouchableOpacity>
          </View>

          <View style={{ flex: 1, minWidth: sz(200, 250) }}>
            <Text style={{ fontSize: sz(20, 28), fontWeight: '900', color: '#004085' }}>{u.full_name} {u.is_core_admin && '👑'} {isPromotedSubAdmin && '⭐'}</Text>
            <Text style={{ fontSize: sz(13, 16), color: '#64748B', marginBottom: 12, fontWeight: '700' }}>Official ID: <Text style={{ fontWeight: '900', color: '#004085' }}>{u.official_id}</Text></Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Status: {u.membership_status}</Text></View>
              <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Age: {age}</Text></View>
              <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Blood: {u.blood_group || 'N/A'}</Text></View>
              <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Role: {u.role}</Text></View>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', padding: sz(12, 20), borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontWeight: '900', marginBottom: 8, color: '#004085' }}>Contact & Background</Text>
              <Text style={styles.detailTxt}>📞 Phone: {u.phone_number} / {u.whatsapp_number}</Text>
              <Text style={styles.detailTxt}>📍 Native: {u.native_place}</Text>
              <Text style={styles.detailTxt}>🏠 Address: {u.address}</Text>
              {u.role !== 'STUDENT' && <Text style={styles.detailTxt}>💼 Job: {u.occupation}</Text>}
              {u.role === 'STUDENT' && <Text style={styles.detailTxt}>🎓 Class: {u.class_grade} ({u.school_name})</Text>}
              {u.islamic_studies === 'YES' && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ fontWeight: '800', color: '#004085', marginBottom: 4 }}>Islamic Background</Text>
                  <Text style={styles.detailTxt}>Qual: {u.islamic_qualification}</Text>
                  <Text style={styles.detailTxt}>Madrasa: {u.madrasa_name} ({u.madrasa_location})</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <Text style={{ fontWeight: '900', fontSize: sz(16, 18), marginBottom: 14, color: '#004085' }}>Administrative Actions</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {hasPerm('MANAGE_FINANCE') && u.role !== 'STUDENT' && u.membership_status === 'ACTIVE' && (<TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF08A' }]} onPress={() => { setCashUser(u); setCashType('SUBSCRIPTION'); setCashMonths('1'); setCashAmount(String(Number(subAmount || 0))); setCashModalVisible(true); }}><Text style={[styles.actionBtnText, { color: '#004085' }]}>💵 Log Cash</Text></TouchableOpacity>)}
            {isCore && !u.is_core_admin && (
              <>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F87171' }]} onPress={() => setResetModalVisible(true)}><Text style={[styles.actionBtnText, { color: 'white' }]}>🔑 Reset Pass</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: u.membership_status === 'ACTIVE' ? '#FB923C' : '#10B981' }]} onPress={() => handleToggleStatus(u.official_id, u.membership_status)}><Text style={[styles.actionBtnText, { color: 'white' }]}>{u.membership_status === 'ACTIVE' ? '🚫 Deactivate' : '⚡ Activate'}</Text></TouchableOpacity>
                {u.role === 'MEMBER' && !isPromotedSubAdmin && (<TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0EA5E9' }]} onPress={() => openPromoteModal(u.official_id)}><Text style={[styles.actionBtnText, { color: 'white' }]}>⭐ Promote Admin</Text></TouchableOpacity>)}
                {isPromotedSubAdmin && (<TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0EA5E9' }]} onPress={() => openEditRights(u)}><Text style={[styles.actionBtnText, { color: 'white' }]}>✏️ Edit Rights</Text></TouchableOpacity>)}
                {isPromotedSubAdmin && (<TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleDemoteAdmin(u.official_id)}><Text style={[styles.actionBtnText, { color: 'white' }]}>❌ Revoke Admin</Text></TouchableOpacity>)}
                {u.role === 'STUDENT' && (<TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#004085' }]} onPress={() => handleConvertStudent(u.official_id)}><Text style={[styles.actionBtnText, { color: 'white' }]}>🎓 Upgrade Student</Text></TouchableOpacity>)}
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: PAD }}>
        {selectedDetailUser ? renderUserDetail() : (
          <>
            {activeTab === 'STATS' && (
              <View>
                <View style={styles.statGrid}>
                  <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>{(directory.filter(u => (u.role === 'MEMBER' || u.role === 'ADMIN') && !u.is_core_admin).length)}</Text><Text style={styles.statLargeKey}>Total Members</Text></View>
                  <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>{directory.filter(u => u.role === 'STUDENT').length}</Text><Text style={styles.statLargeKey}>Total Students</Text></View>
                  <View style={[styles.statBoxLarge, { backgroundColor: '#10B981' }]}><Text style={styles.statLargeVal}>{directory.filter(u => !u.is_core_admin).length}</Text><Text style={styles.statLargeKey}>Grand Total</Text></View>
                </View>
                <View style={[styles.formCard, { marginTop: 16 }]}><Text style={styles.sectionTitle}>Native Place Distribution</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.native)}</View></View>
                <View style={styles.formCard}><Text style={styles.sectionTitle}>Gender Distribution</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.gender)}</View></View>
                <View style={styles.formCard}><Text style={styles.sectionTitle}>Blood Groups</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.bloodGroups)}</View></View>
                <View style={styles.formCard}><Text style={styles.sectionTitle}>Educational Qualifications</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.education)}</View></View>
              </View>
            )}

            {(activeTab === 'USERS' || activeTab === 'STUDENTS') && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                  <TouchableOpacity style={styles.neatBtnSuccess} onPress={() => onNavigate('adminRegister', activeTab === 'STUDENTS' ? 'STUDENT' : 'MEMBER')}>
                    <Text style={styles.neatBtnText}>+ Add {activeTab === 'STUDENTS' ? 'Student' : 'Member'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.neatBtnDark} onPress={() => downloadCSV("Official ID,Role,Full Name,Phone,Gender,Blood Group,Native Place\n" + filteredDirectory.map(u => `"${u.official_id}","${u.role}","${u.full_name}","${u.phone_number}","${u.gender}","${u.blood_group}","${u.native_place}"`).join("\n"), "HIYWA_Directory.csv")}>
                    <Text style={styles.neatBtnTextDark}>📥 Export CSV</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.formCard, { padding: 12, marginBottom: 12, zIndex: 100 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', zIndex: 100 }}>
                    <TextInput style={[styles.input, { flex: 2, minWidth: 140, marginBottom: 0, height: 42, paddingVertical: 8 }]} placeholder="Search ID or Name..." value={searchQuery} onChangeText={setSearchQuery} />
                    <FilterDropdown label="Status" value={filters.status} options={['ACTIVE', 'INACTIVE', 'DECEASED']} onSelect={(v) => setFilters({ ...filters, status: v })} />
                    <FilterDropdown label="Education" value={filters.edu} options={EDU_CATEGORIES} onSelect={(v) => setFilters({ ...filters, edu: v })} />
                    <FilterDropdown label="Islamic" value={filters.islamic} options={ISLAMIC_QUALS} onSelect={(v) => setFilters({ ...filters, islamic: v })} />
                    <FilterDropdown label="Blood" value={filters.blood} options={BLOOD_GROUPS} onSelect={(v) => setFilters({ ...filters, blood: v })} />
                    <FilterDropdown label="Native" value={filters.native} options={NATIVE_PLACES} onSelect={(v) => setFilters({ ...filters, native: v })} />
                    <TouchableOpacity style={[styles.neatBtnDark, { height: 42, paddingHorizontal: 12 }]} onPress={() => { setFilters({ blood: '', edu: '', gender: '', native: '', marital: '', status: '', islamic: '' }); setSearchQuery(''); }}>
                      <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13 }}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {loading ? <ActivityIndicator size="large" /> : filteredDirectory.map((item) => (
                  <TouchableOpacity key={item.official_id} style={styles.adminCard} onPress={() => setSelectedDetailUser(item)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {item.profile_photo ? <Image source={{ uri: item.profile_photo }} style={{ width: sz(42, 50), height: sz(42, 50), borderRadius: 12, marginRight: 12 }} /> : <View style={{ width: sz(42, 50), height: sz(42, 50), borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}><Text style={{ fontSize: 18 }}>👤</Text></View>}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adminCardTitle}>{item.full_name} {item.role === 'STUDENT' ? '🎓' : ''} {item.role === 'ADMIN' ? (item.is_core_admin ? '👑' : '⭐') : ''}</Text>
                        <Text style={styles.adminCardMeta}>ID: {item.official_id}  |  📞 {item.phone_number}  |  🩸 {item.blood_group || '-'}  |  📍 {item.native_place || '-'}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: item.membership_status === 'ACTIVE' ? '#10B981' : '#F87171' }]}><Text style={styles.badgeText}>{item.membership_status}</Text></View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {activeTab === 'FINANCE' && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Finance Hub</Text>
                  <TouchableOpacity style={styles.neatBtnDark} onPress={() => downloadCSV("Date,Txn ID,Member Name,Type,Amount,Method,Reason\n" + filteredTxns.map(t => `"${new Date(t.transaction_date).toLocaleDateString()}","${t.transaction_id}","${t.full_name}","${t.donation_type}","${t.amount}","${t.payment_method}","${t.reason}"`).join("\n"), "HIYWA_Finance.csv")}><Text style={styles.neatBtnTextDark}>📥 Export Ledger</Text></TouchableOpacity>
                </View>

                <View style={styles.statGrid}>
                  <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>₹{totalFinSubs}</Text><Text style={styles.statLargeKey}>Total Subs.</Text></View>
                  <View style={[styles.statBoxLarge, { backgroundColor: '#0056b3' }]}><Text style={styles.statLargeVal}>₹{totalFinGen}</Text><Text style={styles.statLargeKey}>Total General</Text></View>
                  <View style={[styles.statBoxLarge, { backgroundColor: '#8B5CF6' }]}><Text style={styles.statLargeVal}>₹{totalFinCamp}</Text><Text style={styles.statLargeKey}>Total Campaign</Text></View>
                </View>

                <View style={[styles.formCard, { padding: 12, marginBottom: 12, marginTop: 16, zIndex: 100 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', zIndex: 100 }}>
                    <TextInput style={[styles.input, { flex: 2, minWidth: 140, marginBottom: 0, height: 42, paddingVertical: 8 }]} placeholder="Search Name, ID or Reason..." value={finSearchQuery} onChangeText={setFinSearchQuery} />
                    <FilterDropdown label="Type" value={finTypeFilter} options={['SUBSCRIPTION', 'GENERAL', 'FUND_RAISING']} onSelect={(v) => setFinTypeFilter(v)} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      {Platform.OS === 'web' ? <input type="date" style={{ ...webDateStyle, marginBottom: 0, height: 42, padding: 8, width: 130, fontSize: 12 }} value={finStartDate} onChange={e => setFinStartDate(e.target.value)} /> : <TextInput style={[styles.input, { marginBottom: 0, height: 42, width: 100, fontSize: 12 }]} placeholder="Start Date" value={finStartDate} onChangeText={setFinStartDate} />}
                      <Text style={{ color: '#64748B' }}>-</Text>
                      {Platform.OS === 'web' ? <input type="date" style={{ ...webDateStyle, marginBottom: 0, height: 42, padding: 8, width: 130, fontSize: 12 }} value={finEndDate} onChange={e => setFinEndDate(e.target.value)} /> : <TextInput style={[styles.input, { marginBottom: 0, height: 42, width: 100, fontSize: 12 }]} placeholder="End Date" value={finEndDate} onChangeText={setFinEndDate} />}
                    </View>

                    <TouchableOpacity style={[styles.neatBtnDark, { height: 42, paddingHorizontal: 12 }]} onPress={() => { setFinStartDate(''); setFinEndDate(''); setFinTypeFilter(''); setFinSearchQuery(''); }}>
                      <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13 }}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.tabContainer, { marginTop: 0 }]}>
                  <TouchableOpacity style={[styles.tabBtn, financeTab === 'LEDGER' && styles.tabBtnActive]} onPress={() => setFinanceTab('LEDGER')}><Text style={[styles.tabBtnText, financeTab === 'LEDGER' && styles.tabBtnTextActive]}>Income Transactions</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.tabBtn, financeTab === 'DUES' && styles.tabBtnActive]} onPress={() => setFinanceTab('DUES')}><Text style={[styles.tabBtnText, financeTab === 'DUES' && styles.tabBtnTextActive]}>Pending Dues</Text></TouchableOpacity>
                </View>

                {financeTab === 'LEDGER' && (
                  <View style={styles.formCard}>
                    {loading ? <ActivityIndicator /> : filteredTxns.map((txn, index) => (
                      <View key={txn.transaction_id || index} style={styles.historyRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={{ fontWeight: '800', color: '#004085', fontSize: sz(14, 16) }}>{txn.full_name}</Text>
                          <Text style={styles.historyDetails}>{txn.donation_type === 'FUND_RAISING' ? 'CAMPAIGN' : txn.donation_type}: {txn.reason}</Text>
                          <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleDateString()} | {txn.payment_method}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: sz(15, 18), fontWeight: '800', color: '#10B981', marginBottom: 8 }}>+ ₹{txn.amount}</Text>
                          <TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {financeTab === 'DUES' && (
                  <View style={styles.formCard}>
                    {pendingDuesList.map((u) => (
                      <View key={u.official_id} style={styles.historyRow}>
                        <View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontWeight: '800', color: '#EF4444', fontSize: sz(14, 16) }}>{u.full_name} ({u.official_id})</Text><Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '600' }}>📞 {u.phone_number}</Text></View>
                        <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: sz(15, 18), fontWeight: '800', color: '#EF4444' }}>Owes ₹{u.duesAmount}</Text><Text style={{ fontSize: 13, color: '#64748B', fontWeight: '700', marginTop: 4 }}>{u.duesMonths} Months</Text></View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {activeTab === 'EXPENSE' && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Trust Expenses</Text>
                  <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setExpenseModalVisible(true)}><Text style={styles.neatBtnText}>+ Log Expense</Text></TouchableOpacity>
                </View>

                <View style={styles.statGrid}>
                  <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>₹{currentBalance.toLocaleString()}</Text><Text style={styles.statLargeKey}>Current Balance</Text></View>
                  <View style={[styles.statBoxLarge, { backgroundColor: '#10B981' }]}><Text style={styles.statLargeVal}>₹{(totalIncomeVal + Number(initialAmount)).toLocaleString()}</Text><Text style={styles.statLargeKey}>Total Trust Funds</Text></View>
                  <View style={[styles.statBoxLarge, { backgroundColor: '#EF4444' }]}><Text style={styles.statLargeVal}>₹{totalExpenseVal.toLocaleString()}</Text><Text style={styles.statLargeKey}>Total Expensed</Text></View>
                </View>

                <View style={[styles.formCard, { marginTop: 16 }]}>
                  <Text style={styles.sectionTitle}>Expense Ledger</Text>
                  {loading ? <ActivityIndicator /> : allExpenses.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)).map((txn, index) => (
                    <View key={txn.transaction_id || index} style={styles.historyRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={{ fontWeight: '800', color: '#004085', fontSize: sz(14, 16) }}>{txn.reason}</Text>
                        <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleDateString()} | Logged by: {txn.full_name}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: sz(15, 18), fontWeight: '800', color: '#EF4444', marginBottom: 8 }}>- ₹{txn.amount}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'SETTINGS' && (
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>System Settings Configurations</Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('SUB_AMOUNT')}><Text style={styles.neatBtnTextDark}>⚙️ Subscription Amt</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('PRI_UPI')}><Text style={styles.neatBtnTextDark}>⚙️ Primary UPI</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('SEC_UPI')}><Text style={styles.neatBtnTextDark}>⚙️ Secondary UPI</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('INIT_BAL')}><Text style={styles.neatBtnTextDark}>⚙️ Initial Balance</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {activeTab === 'CAMPAIGNS' && (
              <View>
                {viewCampDonors ? (
                  <View style={styles.formCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setViewCampDonors(null)}><Text style={styles.neatBtnTextDark}>← Back</Text></TouchableOpacity><Text style={[styles.sectionTitle, { flex: 1, textAlign: 'right', marginBottom: 0 }]} numberOfLines={1}>{viewCampDonors.title} Donors</Text></View>
                    {globalTxns.filter(t => t.campaign_id === viewCampDonors.campaign_id).map((txn, idx) => (
                      <View key={idx} style={styles.historyRow}>
                        <View style={{ flex: 1, paddingRight: 10 }}><Text style={{ fontWeight: '800', color: '#004085', fontSize: sz(14, 16) }}>{txn.full_name}</Text><Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleDateString()} | {txn.payment_method}</Text></View>
                        <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: sz(15, 18), fontWeight: '800', color: '#10B981', marginBottom: 8 }}>+ ₹{txn.amount}</Text><TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity></View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12 }}>
                      <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => { setCampTitle(''); setCampDesc(''); setCampTarget(''); setCashCampId(''); setCashAmount(''); setCampStatus('ACTIVE'); setCashReason(''); setShowCampaignModal(true); }}>
                        <Text style={styles.neatBtnText}>+ Launch Drive</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.formCard}>
                      <Text style={styles.sectionTitle}>Live Fund Drives</Text>
                      {loading ? <ActivityIndicator /> : campaigns.filter(c => (c.status === 'ACTIVE' || c.status === 'PAUSED') && (parseFloat(c.raised_amount) || 0) < (parseFloat(c.target_amount) || 1)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(camp => {
                        const raised = parseFloat(camp.raised_amount) || 0; const target = parseFloat(camp.target_amount) || 1; const progress = Math.min(Math.round((raised / target) * 100), 100);
                        return (
                          <View key={camp.campaign_id} style={styles.adminCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><Text style={[styles.adminCardTitle, { flex: 1, marginRight: 10 }]} numberOfLines={1}>{camp.title}</Text><View style={[styles.statusBadge, { backgroundColor: camp.status === 'PAUSED' ? '#F59E0B' : '#10B981' }]}><Text style={styles.badgeText}>{camp.status}</Text></View></View>
                            <Text style={{ color: '#64748B', marginBottom: 12, fontWeight: '500', lineHeight: 20 }} numberOfLines={2}>{camp.description}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Text style={{ fontWeight: '800', color: '#004085' }}>Raised: {'\u20B9'}{raised}</Text><Text style={{ color: '#94A3B8', fontWeight: '700' }}>Goal: {'\u20B9'}{target}</Text></View>
                            <View style={{ height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}><View style={{ width: `${progress}%`, backgroundColor: '#10B981', height: '100%' }} /></View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                              <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity style={styles.neatBtnDark} onPress={() => setViewCampDonors(camp)}><Text style={styles.neatBtnTextDark}>👥 View Donors</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => { setCampTitle(camp.title); setCampDesc(camp.description); setCampTarget(camp.target_amount); setCashCampId(camp.campaign_id); setCashAmount(camp.raised_amount); setCampStatus(camp.status); setCashReason(camp.remarks || ''); setShowCampaignModal(true); }}><Text style={styles.neatBtnText}>✏️ Edit/Stop</Text></TouchableOpacity>
                              </View>
                              <Text style={{ textAlign: 'right', fontSize: 13, fontWeight: '700', color: '#10B981' }}>{progress}% Funded</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.formCard}>
                      <Text style={styles.sectionTitle}>Past / Closed Drives</Text>
                      {loading ? <ActivityIndicator /> : campaigns.filter(c => c.status === 'STOPPED' || (parseFloat(c.raised_amount) || 0) >= (parseFloat(c.target_amount) || 1)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(camp => {
                        const raised = parseFloat(camp.raised_amount) || 0; const target = parseFloat(camp.target_amount) || 1; const progress = Math.min(Math.round((raised / target) * 100), 100);
                        const goalAchieved = raised >= target;
                        return (
                          <View key={camp.campaign_id} style={[styles.adminCard, { backgroundColor: '#F8FAFC' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><Text style={[styles.adminCardTitle, { flex: 1, marginRight: 10, color: '#64748B' }]} numberOfLines={1}>{camp.title}</Text><View style={[styles.statusBadge, { backgroundColor: goalAchieved ? '#10B981' : '#EF4444' }]}><Text style={styles.badgeText}>{goalAchieved ? 'GOAL ACHIEVED' : 'STOPPED'}</Text></View></View>
                            {camp.remarks ? <Text style={{ color: '#991B1B', fontWeight: '800', marginBottom: 12, fontSize: 12 }}>REMARKS: {camp.remarks}</Text> : null}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Text style={{ fontWeight: '800', color: '#64748B' }}>Raised: {'\u20B9'}{raised}</Text><Text style={{ color: '#94A3B8', fontWeight: '700' }}>Goal: {'\u20B9'}{target}</Text></View>
                            <View style={{ height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}><View style={{ width: `${progress}%`, backgroundColor: goalAchieved ? '#10B981' : '#94A3B8', height: '100%' }} /></View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                              <TouchableOpacity style={styles.neatBtnDark} onPress={() => setViewCampDonors(camp)}><Text style={styles.neatBtnTextDark}>👥 View Donors</Text></TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ADMIN ROLES TAB — with Edit Rights + Revoke */}
            {activeTab === 'ROLES' && (
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Admin Rights & Roles</Text>
                {loading ? <ActivityIndicator /> : directory.filter(u => u.role === 'ADMIN').map((admin) => {
                  let permsList = ['ALL PERMISSIONS'];
                  if (!admin.is_core_admin) { try { permsList = JSON.parse(admin.admin_permissions || '[]'); } catch (e) { permsList = []; } }
                  return (
                    <View key={admin.official_id} style={[styles.historyRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ fontWeight: '800', color: '#004085', fontSize: sz(16, 18) }}>{admin.full_name} {admin.is_core_admin ? '👑' : '⭐'}</Text>
                          <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '700', marginTop: 4 }}>ID: {admin.official_id}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: admin.is_core_admin ? '#8B5CF6' : '#3B82F6' }]}><Text style={styles.badgeText}>{admin.is_core_admin ? 'CORE ADMIN' : 'SUB ADMIN'}</Text></View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        {permsList.length === 0 && <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '700' }}>No permissions assigned</Text>}
                        {permsList.map(p => <View key={p} style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}><Text style={{ fontSize: 11, fontWeight: '800', color: '#475569' }}>{p}</Text></View>)}
                      </View>
                      {!admin.is_core_admin && (
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                          <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => openEditRights(admin)}><Text style={styles.neatBtnText}>✏️ Edit Rights</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.neatBtnPrimary, { backgroundColor: '#EF4444' }]} onPress={() => handleDemoteAdmin(admin.official_id)}><Text style={styles.neatBtnText}>❌ Revoke Admin</Text></TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ALL ADMIN MODALS (outside the ScrollView so they always cover the visible screen) */}
      {configModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: sz(17, 20), fontWeight: '800', color: '#004085', marginBottom: 16 }}>
              {configModal === 'SUB_AMOUNT' ? 'Set Subscription Amount (₹)' :
                configModal === 'PRI_UPI' ? 'Primary Trust UPI ID' :
                  configModal === 'SEC_UPI' ? 'Secondary Trust UPI ID' : 'Initial Trust Balance (₹)'}
            </Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType={(configModal === 'SUB_AMOUNT' || configModal === 'INIT_BAL') ? 'numeric' : 'default'}
              value={configModal === 'SUB_AMOUNT' ? subAmount : configModal === 'PRI_UPI' ? primaryUpi : configModal === 'SEC_UPI' ? secondaryUpi : initialAmount}
              onChangeText={(t) => {
                if (configModal === 'SUB_AMOUNT') setSubAmount(t);
                else if (configModal === 'PRI_UPI') setPrimaryUpi(t);
                else if (configModal === 'SEC_UPI') setSecondaryUpi(t);
                else setInitialAmount(t);
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 }}>
              <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal(null)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.neatBtnSuccess} onPress={async () => {
                let updatePayload = {};
                if (configModal === 'SUB_AMOUNT') updatePayload.monthly_subscription_amount = subAmount;
                else if (configModal === 'PRI_UPI') updatePayload.primary_upi = primaryUpi;
                else if (configModal === 'SEC_UPI') updatePayload.secondary_upi = secondaryUpi;
                else updatePayload.initial_amount = initialAmount;
                try { await setDoc(doc(db, 'settings', 'global'), updatePayload, { merge: true }); alert('Saved!'); setConfigModal(null); fetchData(); } catch (e) { alert('Failed to save setting.'); }
              }}><Text style={styles.neatBtnText}>Save Setting</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {expenseModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: sz(20, 24), fontWeight: '800', color: '#EF4444', marginBottom: 20, letterSpacing: -0.5 }}>Log Trust Expense</Text>
            <Text style={styles.label}>Detailed Reason / Vendor</Text>
            <TextInput style={styles.input} autoCapitalize="characters" placeholder="E.g., MEETING SNACKS" value={expenseReason} onChangeText={setExpenseReason} />
            <Text style={styles.label}>Expense Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={expenseAmount} onChangeText={setExpenseAmount} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 }}>
              <TouchableOpacity style={styles.neatBtnDark} onPress={() => setExpenseModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.neatBtnPrimary, { backgroundColor: '#EF4444' }]} onPress={submitExpenseLog}><Text style={styles.neatBtnText}>Log Expense</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {cashModalVisible && (
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 12, width: '100%' }}>
            <View style={styles.modalCard}>
              <Text style={{ fontSize: sz(20, 24), fontWeight: '800', color: '#004085', marginBottom: 8, letterSpacing: -0.5 }}>Log Cash Receipt</Text>
              <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20, fontWeight: '600' }}>For: {cashUser?.full_name}</Text>
              <View style={styles.quickSelectContainer}>
                <TouchableOpacity style={[styles.quickBtn, cashType === 'SUBSCRIPTION' && styles.quickBtnActive]} onPress={() => { setCashType('SUBSCRIPTION'); setCashAmount(String(Number(cashMonths || 1) * Number(subAmount || 0))); }}><Text style={[styles.quickBtnText, cashType === 'SUBSCRIPTION' && styles.quickBtnTextActive]}>Subs</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, cashType === 'GENERAL' && styles.quickBtnActive]} onPress={() => { setCashType('GENERAL'); setCashAmount(''); }}><Text style={[styles.quickBtnText, cashType === 'GENERAL' && styles.quickBtnTextActive]}>Gen</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, cashType === 'CAMPAIGN' && styles.quickBtnActive]} onPress={() => { setCashType('CAMPAIGN'); setCashAmount(''); }}><Text style={[styles.quickBtnText, cashType === 'CAMPAIGN' && styles.quickBtnTextActive]}>Camp</Text></TouchableOpacity>
              </View>
              {cashType === 'SUBSCRIPTION' && (<View><Text style={styles.label}>Number of Months</Text><TextInput style={styles.input} keyboardType="numeric" value={cashMonths} onChangeText={t => { setCashMonths(t); setCashAmount(String(Number(t || 0) * Number(subAmount || 0))); }} /></View>)}
              {cashType === 'GENERAL' && (<View><Text style={styles.label}>Reason / Category</Text><TextInput style={styles.input} autoCapitalize="characters" value={cashReason} onChangeText={t => setCashReason(t.toUpperCase())} /></View>)}
              {cashType === 'CAMPAIGN' && (
                <View><Text style={styles.label}>Select Active Campaign</Text>
                  {campaigns.filter(c => c.status === 'ACTIVE').length === 0 ? (
                    <Text style={{ color: '#EF4444', marginBottom: 24, fontWeight: '800' }}>There are no active campaigns available.</Text>
                  ) : (
                    <ScrollView style={{ maxHeight: 150, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12 }}>
                      {campaigns.filter(c => c.status === 'ACTIVE').map(c => (<TouchableOpacity key={c.campaign_id} style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: cashCampId === c.campaign_id ? '#EFF6FF' : 'white' }} onPress={() => setCashCampId(c.campaign_id)}><Text style={{ color: '#004085', fontWeight: cashCampId === c.campaign_id ? '800' : '600' }}>{c.title}</Text></TouchableOpacity>))}
                    </ScrollView>
                  )}
                </View>
              )}
              <Text style={styles.label}>Amount Collected (₹) *</Text>
              <TextInput style={[styles.input, cashType === 'SUBSCRIPTION' && { backgroundColor: '#F1F5F9', color: '#94A3B8' }]} keyboardType="numeric" value={cashAmount} editable={cashType !== 'SUBSCRIPTION' && !(cashType === 'CAMPAIGN' && campaigns.filter(c => c.status === 'ACTIVE').length === 0)} onChangeText={setCashAmount} />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setCashModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.neatBtnSuccess} onPress={submitCashPayment}><Text style={styles.neatBtnText}>Generate Receipt</Text></TouchableOpacity></View>
            </View>
          </ScrollView>
        </View>
      )}

      {promoteModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: sz(20, 24), fontWeight: '800', color: '#004085', marginBottom: 20, letterSpacing: -0.5 }}>{promoteIsEdit ? 'Edit Admin Rights' : 'Assign Admin Rights'}</Text>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({ ...selectedPerms, MANAGE_USERS: !selectedPerms.MANAGE_USERS })}><View style={[styles.checkbox, selectedPerms.MANAGE_USERS && styles.checkboxActive]}>{selectedPerms.MANAGE_USERS && <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Manage Directory</Text></TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({ ...selectedPerms, MANAGE_FINANCE: !selectedPerms.MANAGE_FINANCE })}><View style={[styles.checkbox, selectedPerms.MANAGE_FINANCE && styles.checkboxActive]}>{selectedPerms.MANAGE_FINANCE && <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Manage Finances</Text></TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({ ...selectedPerms, MANAGE_CAMPAIGNS: !selectedPerms.MANAGE_CAMPAIGNS })}><View style={[styles.checkbox, selectedPerms.MANAGE_CAMPAIGNS && styles.checkboxActive]}>{selectedPerms.MANAGE_CAMPAIGNS && <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Manage Campaigns</Text></TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setPromoteModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.neatBtnPrimary} onPress={submitPromotion}><Text style={styles.neatBtnText}>{promoteIsEdit ? 'Save Rights' : 'Confirm Promotion'}</Text></TouchableOpacity></View>
          </View>
        </View>
      )}

      {resetModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: sz(20, 24), fontWeight: '800', color: '#004085', marginBottom: 16, letterSpacing: -0.5 }}>Reset Password</Text>
            <Text style={{ fontSize: 15, color: '#475569', marginBottom: 24, lineHeight: 24, fontWeight: '500' }}>Reset <Text style={{ fontWeight: '800', color: '#004085' }}>{selectedDetailUser?.full_name}</Text>'s password to default (<Text style={{ fontWeight: '800' }}>Hiywa@123</Text>)?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setResetModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.neatBtnPrimary, { backgroundColor: '#EF4444' }]} onPress={resetUserPasswordAdmin}><Text style={styles.neatBtnText}>Confirm Reset</Text></TouchableOpacity></View>
          </View>
        </View>
      )}

      {showCampaignModal && (
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 12, width: '100%' }}>
            <View style={[styles.modalCard, { maxWidth: 750, width: '100%' }]}>
              <Text style={{ fontSize: sz(20, 24), fontWeight: '800', color: '#004085', marginBottom: 20, letterSpacing: -0.5 }}>{cashCampId ? 'Edit' : 'Launch'} Fundraiser</Text>

              {cashCampId ? (
                <>
                  <Text style={styles.label}>Campaign Status</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <TouchableOpacity style={[styles.filterChip, campStatus === 'ACTIVE' && styles.filterChipActive]} onPress={() => setCampStatus('ACTIVE')}><Text style={[styles.filterChipText, campStatus === 'ACTIVE' && { color: 'white' }]}>ACTIVE</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, campStatus === 'PAUSED' && styles.filterChipActive]} onPress={() => setCampStatus('PAUSED')}><Text style={[styles.filterChipText, campStatus === 'PAUSED' && { color: 'white' }]}>PAUSED</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, campStatus === 'STOPPED' && styles.filterChipActive]} onPress={() => setCampStatus('STOPPED')}><Text style={[styles.filterChipText, campStatus === 'STOPPED' && { color: 'white' }]}>STOPPED</Text></TouchableOpacity>
                  </View>
                </>
              ) : null}

              <Text style={styles.label}>Campaign Title</Text><TextInput style={styles.input} value={campTitle} onChangeText={setCampTitle} />
              <Text style={styles.label}>Description</Text><TextInput style={[styles.input, { height: 80 }]} multiline value={campDesc} onChangeText={setCampDesc} />
              <Text style={styles.label}>Target Amount (₹)</Text><TextInput style={styles.input} keyboardType="numeric" value={String(campTarget)} onChangeText={setCampTarget} />

              {campStatus === 'STOPPED' || campStatus === 'PAUSED' ? (
                <>
                  <Text style={styles.label}>Remarks / Reason</Text>
                  <TextInput style={styles.input} autoCapitalize="characters" value={cashReason} onChangeText={setCashReason} placeholder="Add reason..." />
                </>
              ) : null}

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 }}>
                <TouchableOpacity style={styles.neatBtnDark} onPress={() => { setShowCampaignModal(false); setCashCampId(''); }}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.neatBtnSuccess} onPress={async () => {
                  if (!campTitle || !campDesc || !campTarget) return alert('Fill all fields.');
                  const campId = cashCampId || 'CAMP_' + Date.now();

                  const payload = { campaign_id: campId, title: campTitle.toUpperCase(), description: campDesc, target_amount: campTarget, remarks: cashReason, raised_amount: cashAmount || 0, status: campStatus || 'ACTIVE' };
                  if (!cashCampId) payload.created_at = new Date().toISOString();

                  try { await setDoc(doc(db, 'campaigns', campId), payload, { merge: true }); alert('Saved!'); setShowCampaignModal(false); setCashCampId(''); fetchData(); } catch (e) { alert('Failed to save campaign: ' + e.message); }
                }}>
                  <Text style={styles.neatBtnText}>{cashCampId ? 'Update Drive' : 'Publish Drive'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// --- DYNAMIC REGISTRATION WIZARD ---
function RegisterScreen({ onBack, defaultRole = null, isAdminAuth = false }) {
  const [role, setRole] = useState(defaultRole);
  const [step, setStep] = useState(1);
  const [registeredUser, setRegisteredUser] = useState(null);

  const [formData, setFormData] = useState({ full_name: '', father_name: '', mother_name: '', parents_status: '', gender: '', dob: '', blood_group: '', native_place: '', phone_number: '', email: '', address: '', password: '', whatsapp_number: '', aadhaar_number: '', current_location: '', occupation: '', educational_qualification: '', course_details: '', marital_status: '', student_mobile: '', class_grade: '', school_name: '', medium_of_instruction: '', school_type: '', school_location: '', mode_of_transportation: '', special_talents: '', profile_photo: null, islamic_studies: 'NO', islamic_qualification: '', madrasa_name: '', madrasa_location: '' });

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

  const handleDateChange = (event, selectedDate) => { setShowDatePicker(false); if (selectedDate) { setDobDate(selectedDate); const day = String(selectedDate.getDate()).padStart(2, '0'); const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); const year = selectedDate.getFullYear(); setFormData({ ...formData, dob: `${year}-${month}-${day}` }); setAge((new Date().getFullYear() - year).toString()); } };
  const handleWebDateChange = (e) => { const val = e.target.value; setFormData({ ...formData, dob: val }); if (val) setAge((new Date().getFullYear() - new Date(val).getFullYear()).toString()); };
  const handleSameMobileToggle = () => { setSameAsMobile(!sameAsMobile); if (!sameAsMobile) setFormData({ ...formData, whatsapp_number: formData.phone_number }); else setFormData({ ...formData, whatsapp_number: '' }); };

  // FIXED: previously referenced undefined setProfileImage / setEditFormData
  const pickImage = () => {
    pickPhoto((b64) => setFormData(prev => ({ ...prev, profile_photo: b64 })));
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.father_name || !formData.mother_name || !formData.parents_status || !formData.gender || !formData.dob || !formData.aadhaar_number) return alert('Please fill all mandatory (*) fields in Step 1.');
    if (formData.aadhaar_number.length !== 12) return alert('Aadhaar must be exactly 12 digits.');
    if (role === 'MEMBER' && !formData.phone_number) return alert('Primary mobile number is required.');
    if (role === 'STUDENT' && !formData.phone_number) return alert('Parent mobile number is required.');
    if (!isAdminAuth && !formData.password) return alert('Please create a portal password.');
    setIsSubmitting(true);

    const finalData = { ...formData };
    for (let key in finalData) { if (typeof finalData[key] === 'string' && key !== 'profile_photo' && key !== 'password' && key !== 'email') finalData[key] = finalData[key].toUpperCase(); }
    if (finalData.native_place === 'OTHERS') finalData.native_place = customNative.toUpperCase();
    if (finalData.islamic_qualification === 'OTHERS') finalData.islamic_qualification = customIslamic.toUpperCase();

    try {
      const membersSnap = await getDocs(collection(db, 'members'));
      const newIdNumber = membersSnap.size + 1;
      const officialId = `HIYWA${String(newIdNumber).padStart(4, '0')}`;
      finalData.official_id = officialId; finalData.membership_status = 'ACTIVE'; finalData.join_date = new Date().toISOString(); finalData.total_months_paid = 0;
      if (newIdNumber === 1) { finalData.role = 'ADMIN'; finalData.is_core_admin = true; finalData.admin_permissions = JSON.stringify(['ALL']); } else { finalData.role = role; finalData.is_core_admin = false; }
      if (isAdminAuth) finalData.password = 'Hiywa@123';
      await setDoc(doc(db, 'members', officialId), finalData);
      setRegisteredUser(finalData);
    } catch (error) { alert('Registration Failed: ' + error.message); } finally { setIsSubmitting(false); }
  };

  const handleShareCredentials = async () => {
    const html = generateIDCardHTML(registeredUser);
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank'); printWindow.document.write(html); printWindow.document.close(); printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      } else {
        const { uri } = await Print.printToFileAsync({ html }); await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e) { alert("Failed to generate PDF"); }
  };

  // 1. SUCCESS SCREEN
  if (registeredUser) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', padding: PAD, flexGrow: 1 }}>
        <IDCardView user={registeredUser} />
        <Text style={{ textAlign: 'center', color: '#EF4444', marginVertical: 20, fontWeight: '800' }}>
          {isAdminAuth ? `Default Password Set: ${registeredUser.password}\nUser will be forced to change this on their first login.` : 'Please log in with the password you created.'}
        </Text>
        <TouchableOpacity style={[styles.button, { width: 250, marginBottom: 12, backgroundColor: '#10B981' }]} onPress={handleShareCredentials}><Text style={styles.buttonText}>🔗 Download / Share</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.button, { width: 250, backgroundColor: '#004085' }]} onPress={onBack}><Text style={styles.buttonText}>Return</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  // 2. SELECTION SCREEN
  if (!role) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.contentHeader}>
          <View style={{ flex: 1 }}><Text style={styles.contentTitle}>Select Registration Type</Text></View>
          <TouchableOpacity onPress={onBack} style={styles.neatBtnPrimary}>
            <Text style={styles.neatBtnText}>← Cancel</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: PAD, flexGrow: 1, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', gap: sz(12, 24), justifyContent: 'center', flexWrap: 'wrap' }}>

            <TouchableOpacity style={[styles.bentoBox, { alignItems: 'center', minWidth: sz(240, 260), flex: 0, paddingVertical: sz(24, 40) }]} onPress={() => setRole('MEMBER')}>
              <Text style={{ fontSize: sz(44, 56), marginBottom: 12 }}>🧑‍💼</Text>
              <Text style={[styles.bentoTitle, { fontSize: sz(20, 24) }]}>HIYWA Member</Text>
              <Text style={[styles.bentoDesc, { textAlign: 'center', marginTop: 8 }]}>Standard member registration for the Trust.</Text>
              <View style={[styles.button, { width: '100%', marginTop: sz(20, 32) }]}><Text style={styles.buttonText}>Select Member</Text></View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.bentoBox, { alignItems: 'center', minWidth: sz(240, 260), flex: 0, paddingVertical: sz(24, 40) }]} onPress={() => setRole('STUDENT')}>
              <Text style={{ fontSize: sz(44, 56), marginBottom: 12 }}>🎓</Text>
              <Text style={[styles.bentoTitle, { fontSize: sz(20, 24) }]}>Student</Text>
              <Text style={[styles.bentoDesc, { textAlign: 'center', marginTop: 8 }]}>Registration for pursuing or completed students.</Text>
              <View style={[styles.button, { width: '100%', marginTop: sz(20, 32), backgroundColor: '#10B981' }]}><Text style={styles.buttonText}>Select Student</Text></View>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // 3. WIZARD FORM
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {isSubmitting && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#004085" style={{ transform: [{ scale: 1.5 }], marginBottom: 24 }} />
            <Text style={{ fontSize: sz(20, 24), fontWeight: '900', color: '#004085', marginBottom: 8 }}>Processing...</Text>
            <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', fontWeight: '600' }}>Securely generating Official ID.</Text>
          </View>
        </View>
      )}

      <View style={styles.contentHeader}>
        <View style={{ flex: 1 }}><Text style={styles.contentTitle}>{role === 'STUDENT' ? 'Student Registration' : 'Member Registration'}</Text></View>
        <TouchableOpacity onPress={() => { if (isAdminAuth) { onBack(); } else { setRole(null); setStep(1); } }} style={styles.neatBtnPrimary}>
          <Text style={styles.neatBtnText}>{isAdminAuth ? '← Cancel' : '← Change Type'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: PAD }}>
        <View style={styles.wizardProgress}>
          <Text style={{ fontWeight: '900', color: step === 1 ? '#004085' : '#CBD5E1', fontSize: sz(14, 16) }}>1. Personal</Text>
          <Text style={{ fontWeight: '900', color: step === 2 ? '#004085' : '#CBD5E1', fontSize: sz(14, 16) }}>2. Education</Text>
          <Text style={{ fontWeight: '900', color: step === 3 ? '#004085' : '#CBD5E1', fontSize: sz(14, 16) }}>3. Contact</Text>
        </View>

        <View style={styles.formCard}>
          {step === 1 && (
            <>
              <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center', marginBottom: 20 }}>
                {formData.profile_photo ? <Image source={{ uri: formData.profile_photo }} style={{ width: 90, height: 90, borderRadius: 45 }} /> : <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}><Text>📷 Upload Photo</Text></View>}
                {formData.profile_photo ? <Text style={{ color: '#0056b3', fontWeight: '800', marginTop: 8 }}>Change Photo</Text> : null}
              </TouchableOpacity>
              <Text style={styles.label}>Full Name *</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.full_name} onChangeText={(t) => setFormData({ ...formData, full_name: t })} />
              <Text style={styles.label}>Father's / Guardian's Name *</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.father_name} onChangeText={(t) => setFormData({ ...formData, father_name: t })} />
              <Text style={styles.label}>Mother's Name *</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.mother_name} onChangeText={(t) => setFormData({ ...formData, mother_name: t })} />
              <Text style={styles.label}>Parents Status *</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowParentsDrop(!showParentsDrop)}><Text style={styles.dropdownBtnText}>{formData.parents_status || 'SELECT STATUS'}</Text></TouchableOpacity>
              {showParentsDrop && (<View style={styles.dropdownList}>{['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED'].map((s) => (<TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, parents_status: s }); setShowParentsDrop(false); }}><Text style={styles.dropdownItemText}>{s}</Text></TouchableOpacity>))}</View>)}
              <Text style={styles.label}>Gender *</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowGenderDropdown(!showGenderDropdown)}><Text style={styles.dropdownBtnText}>{formData.gender || 'SELECT GENDER'}</Text></TouchableOpacity>
              {showGenderDropdown && <View style={styles.dropdownList}>{GENDERS.map((g) => (<TouchableOpacity key={g} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, gender: g }); setShowGenderDropdown(false); }}><Text style={styles.dropdownItemText}>{g}</Text></TouchableOpacity>))}</View>}
              <Text style={styles.label}>Date of Birth *</Text>
              {Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formData.dob} onChange={handleWebDateChange} /> : <View><TouchableOpacity onPress={() => setShowDatePicker(true)}><View style={{ pointerEvents: 'none' }}><TextInput style={styles.input} placeholder="YYYY-MM-DD" value={formData.dob} editable={false} /></View></TouchableOpacity>{showDatePicker && <DateTimePicker value={dobDate} mode="date" display="default" onChange={handleDateChange} />}</View>}
              <Text style={styles.label}>Calculated Age</Text><TextInput style={[styles.input, { backgroundColor: '#F1F5F9', color: '#94A3B8' }]} value={age} editable={false} placeholder="Select DOB first" />
              <Text style={styles.label}>Blood Group</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowBloodDropdown(!showBloodDropdown)}><Text style={styles.dropdownBtnText}>{formData.blood_group || 'SELECT BLOOD GROUP'}</Text></TouchableOpacity>
              {showBloodDropdown && <View style={styles.dropdownList}>{BLOOD_GROUPS.map((bg) => (<TouchableOpacity key={bg} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, blood_group: bg }); setShowBloodDropdown(false); }}><Text style={styles.dropdownItemText}>{bg}</Text></TouchableOpacity>))}</View>}
              {role === 'MEMBER' && (<> <Text style={styles.label}>Marital Status</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowMaritalDropdown(!showMaritalDropdown)}><Text style={styles.dropdownBtnText}>{formData.marital_status || 'SELECT STATUS'}</Text></TouchableOpacity>{showMaritalDropdown && <View style={styles.dropdownList}>{MARITAL_STATUS.map((ms) => (<TouchableOpacity key={ms} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, marital_status: ms }); setShowMaritalDropdown(false); }}><Text style={styles.dropdownItemText}>{ms}</Text></TouchableOpacity>))}</View>}</>)}
              <Text style={styles.label}>Aadhaar Number (12-Digits) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" maxLength={12} value={formData.aadhaar_number} onChangeText={(t) => setFormData({ ...formData, aadhaar_number: t })} />
            </>
          )}

          {step === 2 && (
            <>
              {role === 'MEMBER' && (
                <>
                  <Text style={styles.label}>Educational Category</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowEduDropdown(!showEduDropdown)}><Text style={styles.dropdownBtnText}>{formData.educational_qualification || 'SELECT CATEGORY'}</Text></TouchableOpacity>
                  {showEduDropdown && <View style={styles.dropdownList}>{EDU_CATEGORIES.map((el) => (<TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, educational_qualification: el }); setShowEduDropdown(false); }}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>))}</View>}
                  <Text style={styles.label}>Course / Major Specialization</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.course_details} onChangeText={(t) => setFormData({ ...formData, course_details: t })} />
                  <Text style={styles.label}>Occupation / Job Title</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.occupation} onChangeText={(t) => setFormData({ ...formData, occupation: t })} />
                </>
              )}
              {role === 'STUDENT' && (
                <>
                  <Text style={styles.label}>Class / Grade</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowClassDropdown(!showClassDropdown)}><Text style={styles.dropdownBtnText}>{formData.class_grade || 'SELECT CLASS / GRADE'}</Text></TouchableOpacity>
                  {showClassDropdown && <View style={styles.dropdownList}><ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>{CLASSES.map((c) => (<TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, class_grade: c }); setShowClassDropdown(false); }}><Text style={styles.dropdownItemText}>{c}</Text></TouchableOpacity>))}</ScrollView></View>}
                  {isCollegeEdit && (
                    <>
                      <Text style={styles.label}>Educational Category</Text>
                      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowEduDropdown(!showEduDropdown)}><Text style={styles.dropdownBtnText}>{formData.educational_qualification || 'SELECT CATEGORY'}</Text></TouchableOpacity>
                      {showEduDropdown && <View style={styles.dropdownList}>{EDU_CATEGORIES.map((el) => (<TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, educational_qualification: el }); setShowEduDropdown(false); }}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>))}</View>}
                      <Text style={styles.label}>Course / Major Details</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.course_details} onChangeText={(t) => setFormData({ ...formData, course_details: t })} />
                    </>
                  )}
                  <Text style={styles.label}>Institution Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.school_name} onChangeText={(t) => setFormData({ ...formData, school_name: t })} />
                  <Text style={styles.label}>{isCollegeEdit ? 'College Type' : 'School Type'}</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowSchoolTypeDropdown(!showSchoolTypeDropdown)}><Text style={styles.dropdownBtnText}>{formData.school_type || 'SELECT TYPE'}</Text></TouchableOpacity>
                  {showSchoolTypeDropdown && <View style={styles.dropdownList}>{(isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES).map((st) => (<TouchableOpacity key={st} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, school_type: st }); setShowSchoolTypeDropdown(false); }}><Text style={styles.dropdownItemText}>{st}</Text></TouchableOpacity>))}</View>}
                  <Text style={styles.label}>Institution Location / Village</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.school_location} onChangeText={(t) => setFormData({ ...formData, school_location: t })} />
                  <Text style={styles.label}>Medium of Instruction</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowMediumDropdown(!showMediumDropdown)}><Text style={styles.dropdownBtnText}>{formData.medium_of_instruction || 'SELECT MEDIUM'}</Text></TouchableOpacity>
                  {showMediumDropdown && <View style={styles.dropdownList}>{MEDIUMS.map((md) => (<TouchableOpacity key={md} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, medium_of_instruction: md }); setShowMediumDropdown(false); }}><Text style={styles.dropdownItemText}>{md}</Text></TouchableOpacity>))}</View>}
                </>
              )}
              <Text style={styles.label}>{role === 'MEMBER' ? 'Completed Islamic Studies?' : 'Pursuing Islamic Studies?'}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <TouchableOpacity style={[styles.filterChip, formData.islamic_studies === 'YES' && styles.filterChipActive]} onPress={() => setFormData({ ...formData, islamic_studies: 'YES' })}><Text style={[styles.filterChipText, formData.islamic_studies === 'YES' && { color: 'white' }]}>Yes</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.filterChip, formData.islamic_studies === 'NO' && styles.filterChipActive]} onPress={() => setFormData({ ...formData, islamic_studies: 'NO' })}><Text style={[styles.filterChipText, formData.islamic_studies === 'NO' && { color: 'white' }]}>No</Text></TouchableOpacity>
              </View>
              {formData.islamic_studies === 'YES' && (
                <View style={{ padding: sz(14, 24), backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={styles.label}>Islamic Qualification</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowIslamicDrop(!showIslamicDrop)}><Text style={styles.dropdownBtnText}>{formData.islamic_qualification || 'SELECT QUALIFICATION'}</Text></TouchableOpacity>
                  {showIslamicDrop && <View style={styles.dropdownList}>{ISLAMIC_QUALS.map((iq) => (<TouchableOpacity key={iq} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, islamic_qualification: iq }); setShowIslamicDrop(false); }}><Text style={styles.dropdownItemText}>{iq}</Text></TouchableOpacity>))}</View>}
                  {formData.islamic_qualification === 'OTHERS' && (<> <Text style={styles.label}>Specify Qualification</Text><TextInput style={styles.input} autoCapitalize="characters" value={customIslamic} onChangeText={t => setCustomIslamic(t)} /> </>)}
                  <Text style={styles.label}>Madrasa Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.madrasa_name} onChangeText={t => setFormData({ ...formData, madrasa_name: t })} />
                  <Text style={styles.label}>Madrasa Location</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.madrasa_location} onChangeText={t => setFormData({ ...formData, madrasa_location: t })} />
                </View>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {role === 'STUDENT' && (<> <Text style={styles.label}>Student Mobile Number</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={formData.student_mobile} onChangeText={(t) => setFormData({ ...formData, student_mobile: t })} /> </>)}
              <Text style={styles.label}>{role === 'MEMBER' ? 'Primary Mobile Number *' : "Parent's Mobile Number *"}</Text>
              <TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={formData.phone_number} onChangeText={(t) => { if (sameAsMobile) setFormData({ ...formData, phone_number: t, whatsapp_number: t }); else setFormData({ ...formData, phone_number: t }); }} />
              {role === 'MEMBER' && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    <Text style={[styles.label, { marginBottom: 0 }]}>WhatsApp Number</Text>
                    <TouchableOpacity onPress={handleSameMobileToggle} style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#004085', marginRight: 8, backgroundColor: sameAsMobile ? '#004085' : 'white', borderRadius: 4 }} /><Text style={{ fontSize: 13, color: '#64748B', fontWeight: '800' }}>Same as Mobile</Text></TouchableOpacity>
                  </View>
                  <TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={formData.whatsapp_number} editable={!sameAsMobile} onChangeText={(t) => setFormData({ ...formData, whatsapp_number: t })} />
                </>
              )}
              <Text style={styles.label}>Native Place</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowNativeDropdown(!showNativeDropdown)}><Text style={styles.dropdownBtnText}>{formData.native_place || 'SELECT NATIVE PLACE'}</Text></TouchableOpacity>
              {showNativeDropdown && <View style={styles.dropdownList}>{NATIVE_PLACES.map((place) => (<TouchableOpacity key={place} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, native_place: place }); setShowNativeDropdown(false); }}><Text style={styles.dropdownItemText}>{place}</Text></TouchableOpacity>))}</View>}
              {formData.native_place === 'OTHERS' && (<View style={{ marginTop: 12 }}><Text style={styles.label}>Specify Native Place</Text><TextInput style={styles.input} autoCapitalize="characters" value={customNative} onChangeText={(t) => setCustomNative(t)} /></View>)}
              <Text style={styles.label}>Current Location (City/Town)</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.current_location} onChangeText={(t) => setFormData({ ...formData, current_location: t })} />
              <Text style={styles.label}>Full Permanent Address</Text><TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline={true} autoCapitalize="characters" value={formData.address} onChangeText={(t) => setFormData({ ...formData, address: t })} />
              <Text style={styles.label}>Email Address</Text><TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" value={formData.email} onChangeText={(t) => setFormData({ ...formData, email: t })} />
              {!isAdminAuth && (<> <Text style={styles.label}>Create Portal Password *</Text><TextInput style={styles.input} secureTextEntry={true} value={formData.password} onChangeText={(t) => setFormData({ ...formData, password: t })} /> </>)}
            </>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
            {step > 1 ? (<TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]} onPress={() => setStep(step - 1)}><Text style={[styles.buttonText, { color: '#004085' }]}>Previous</Text></TouchableOpacity>) : <View style={{ flex: 1 }} />}
            {step < 3 ? (<TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => setStep(step + 1)}><Text style={styles.buttonText}>Next Step</Text></TouchableOpacity>) : (
              <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center' }]} onPress={handleRegister} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="white" style={{ marginRight: 10 }} /> : null}
                <Text style={styles.buttonText}>{isSubmitting ? 'Processing...' : 'Submit Data'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- DONATION PORTAL ---
function DonationPortal({ currentUser, onViewReceipt, onBack = () => {} }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchTxns = async () => { try { const snap = await getDocs(collection(db, 'transactions')); setHistory(snap.docs.map(d => d.data()).filter(t => t.member_id === currentUser.official_id && t.donation_type === 'GENERAL').sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))); } catch (e) {} };
    fetchTxns();
  }, [currentUser]);

  const handleUPIPayment = async () => {
    if (!amount || !reason.trim()) return alert('Please enter both Amount and Reason');
    setIsSubmitting(true);
    const upiSuccess = await openUPI(amount, reason);
    if (!upiSuccess) { setIsSubmitting(false); return; }

    const txnId = `UPI_${Date.now()}`;
    const payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: currentUser.official_id, full_name: currentUser.full_name, amount: amount, payment_method: 'UPI', donation_type: 'GENERAL', reason: reason, months_count: 0 };
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      alert('Donation successful!'); onViewReceipt({ ...payload, official_id: currentUser.official_id });
    } catch (error) { alert('Database Error'); } finally { setIsSubmitting(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: PAD }}>
      <TouchableOpacity onPress={() => onBack('dashboard')} style={{ marginBottom: 12 }}><Text style={{ color: '#004085', fontWeight: '800' }}>← Back to Dashboard</Text></TouchableOpacity>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Make a Donation</Text>
        <Text style={styles.label}>Reason / Purpose</Text><TextInput style={styles.input} placeholder="E.G. FOOD DISTRIBUTION" autoCapitalize="characters" value={reason} onChangeText={(t) => setReason(t)} />
        <Text style={styles.label}>Donation Amount (₹)</Text><TextInput style={styles.input} placeholder="E.G. 1000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Donate via UPI</Text>}</TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Donation History</Text>
      <View style={styles.formCard}>
        {history.length === 0 ? <Text style={{ color: '#64748B' }}>No donations found.</Text> : history.map((txn, idx) => (
          <View key={idx} style={styles.historyRow}>
            <View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontWeight: '700', color: '#004085', fontSize: sz(14, 16) }}>{txn.reason}</Text><Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '600' }}>{new Date(txn.transaction_date).toLocaleDateString()}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: sz(15, 18), fontWeight: '700', color: '#10B981', marginBottom: 8 }}>₹{txn.amount}</Text><TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// --- SUBSCRIPTION SCREEN ---
function SubscriptionScreen({ currentUser, setCurrentUser, onViewReceipt, onBack = () => {} }) {
  const [monthsCount, setMonthsCount] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyRate, setMonthlyRate] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const getRate = async () => { try { const sDoc = await getDoc(doc(db, 'settings', 'global')); if (sDoc.exists()) setMonthlyRate(sDoc.data().monthly_subscription_amount || 0); } catch (e) {} };
    const fetchTxns = async () => { try { const snap = await getDocs(collection(db, 'transactions')); setHistory(snap.docs.map(d => d.data()).filter(t => t.member_id === currentUser.official_id && t.donation_type === 'SUBSCRIPTION').sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))); } catch (e) {} };
    getRate(); fetchTxns();
  }, [currentUser]);

  const totalAmount = monthlyRate * (parseInt(monthsCount) || 1);

  const joinDate = currentUser.join_date ? new Date(currentUser.join_date) : new Date();
  const currentDate = new Date();
  const monthsSinceJoined = ((currentDate.getFullYear() - joinDate.getFullYear()) * 12) + (currentDate.getMonth() - joinDate.getMonth()) + 1;
  const totalPaid = parseInt(currentUser.total_months_paid) || 0;
  const duesMonths = Math.max(0, monthsSinceJoined - totalPaid);
  const duesAmount = duesMonths * monthlyRate;

  const paidUpTo = new Date(joinDate);
  paidUpTo.setMonth(paidUpTo.getMonth() + totalPaid);
  const paidUpToText = paidUpTo.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  const handleUPIPayment = async () => {
    setIsSubmitting(true);
    const upiSuccess = await openUPI(totalAmount, 'MONTHLY SUBSCRIPTION');
    if (!upiSuccess) { setIsSubmitting(false); return; }

    const txnId = `UPI_${Date.now()}`;
    const parsedMonths = parseInt(monthsCount) || 1;
    const payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: currentUser.official_id, full_name: currentUser.full_name, amount: totalAmount, payment_method: 'UPI', donation_type: 'SUBSCRIPTION', reason: 'MONTHLY SUBSCRIPTION', months_count: parsedMonths };
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      const newTotalPaid = (parseInt(currentUser.total_months_paid) || 0) + parsedMonths;
      await updateDoc(doc(db, 'members', currentUser.official_id), { total_months_paid: newTotalPaid });
      alert('Subscription Processed Successfully!');
      setCurrentUser({ ...currentUser, total_months_paid: newTotalPaid });
      onViewReceipt({ ...payload, official_id: currentUser.official_id });
    } catch (error) { alert('Connection failed.'); } finally { setIsSubmitting(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: PAD }}>
      <TouchableOpacity onPress={() => onBack('dashboard')} style={{ marginBottom: 12 }}><Text style={{ color: '#004085', fontWeight: '800' }}>← Back to Dashboard</Text></TouchableOpacity>

      <View style={[styles.formCard, { backgroundColor: '#002752', borderColor: '#001a38' }]}>
        <Text style={[styles.sectionTitle, { color: 'white', marginBottom: 8 }]}>My Subscription Status</Text>
        <Text style={{ color: '#CBD5E1', marginBottom: 16 }}>Monthly Rate: ₹{monthlyRate}</Text>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flex: 1, minWidth: 140, backgroundColor: '#004085', padding: 14, borderRadius: 12 }}>
            <Text style={{ color: '#94A3B8', fontWeight: '800', fontSize: 12 }}>TOTAL MONTHS PAID</Text>
            <Text style={{ color: 'white', fontSize: sz(20, 24), fontWeight: '900', marginTop: 4 }}>{totalPaid}</Text>
            <Text style={{ color: '#93C5FD', fontSize: 13, marginTop: 8, fontWeight: '800' }}>Paid up to: {paidUpToText}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 140, backgroundColor: duesMonths > 0 ? '#EF4444' : '#10B981', padding: 14, borderRadius: 12 }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>{duesMonths > 0 ? 'PENDING DUES' : 'ALL CLEAR'}</Text>
            <Text style={{ color: 'white', fontSize: sz(20, 24), fontWeight: '900', marginTop: 4 }}>₹{duesAmount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Pay Advance / Clear Dues</Text>
        <Text style={styles.label}>Quick Select Months</Text>
        <View style={styles.quickSelectContainer}>
          <TouchableOpacity style={[styles.quickBtn, monthsCount === '1' && styles.quickBtnActive]} onPress={() => setMonthsCount('1')}><Text style={[styles.quickBtnText, monthsCount === '1' && styles.quickBtnTextActive]}>1 Mo</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, monthsCount === '3' && styles.quickBtnActive]} onPress={() => setMonthsCount('3')}><Text style={[styles.quickBtnText, monthsCount === '3' && styles.quickBtnTextActive]}>3 Mo</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, monthsCount === '6' && styles.quickBtnActive]} onPress={() => setMonthsCount('6')}><Text style={[styles.quickBtnText, monthsCount === '6' && styles.quickBtnTextActive]}>6 Mo</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, monthsCount === '12' && styles.quickBtnActive]} onPress={() => setMonthsCount('12')}><Text style={[styles.quickBtnText, monthsCount === '12' && styles.quickBtnTextActive]}>1 Year</Text></TouchableOpacity>
        </View>
        <Text style={styles.label}>Or Custom Months</Text><TextInput style={styles.input} keyboardType="numeric" value={monthsCount} onChangeText={setMonthsCount} />
        <View style={styles.totalBox}><Text style={styles.totalBoxText}>Total Amount: ₹{totalAmount}</Text></View>
        <TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Pay via UPI</Text>}</TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Subscription History</Text>
      <View style={styles.formCard}>
        {history.length === 0 ? <Text style={{ color: '#64748B' }}>No transactions found.</Text> : history.map((txn, idx) => (
          <View key={idx} style={styles.historyRow}>
            <View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontWeight: '700', color: '#004085', fontSize: sz(14, 16) }}>{txn.months_count} Months Paid</Text><Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '600' }}>{new Date(txn.transaction_date).toLocaleDateString()}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: sz(15, 18), fontWeight: '700', color: '#10B981', marginBottom: 8 }}>₹{txn.amount}</Text><TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// --- FUNDRAISING LIST SCREEN ---
function FundraisingListScreen({ currentUser, onSelectCampaign, onBack = () => {}, onViewReceipt }) {
  const [campaigns, setCampaigns] = useState([]);
  const [history, setHistory] = useState([]);
  const [showPast, setShowPast] = useState(globalShowPastDrives);

  const togglePast = (val) => {
    setShowPast(val);
    globalShowPastDrives = val;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, 'campaigns'));
        setCampaigns(snap.docs.map(d => d.data()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));

        const txnSnap = await getDocs(collection(db, 'transactions'));
        setHistory(txnSnap.docs.map(d => d.data()).filter(t => t.member_id === currentUser.official_id && (t.donation_type === 'FUND_RAISING' || t.donation_type === 'CAMPAIGN')).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)));
      } catch (err) {}
    };
    fetchData();
  }, [currentUser]);

  const activeCamps = campaigns.filter(c => {
    const isGoalMet = (parseFloat(c.raised_amount) || 0) >= (parseFloat(c.target_amount) || 1);
    return c.status === 'ACTIVE' && !isGoalMet;
  });

  const pastCamps = campaigns.filter(c => {
    const isGoalMet = (parseFloat(c.raised_amount) || 0) >= (parseFloat(c.target_amount) || 1);
    return c.status === 'STOPPED' || c.status === 'PAUSED' || isGoalMet;
  });

  const displayCamps = showPast ? pastCamps : activeCamps;

  return (
    <ScrollView contentContainerStyle={{ padding: PAD }}>
      <TouchableOpacity onPress={() => { if (showPast) togglePast(false); else onBack('dashboard'); }} style={{ marginBottom: 12 }}><Text style={{ color: '#004085', fontWeight: '800' }}>← {showPast ? 'Back to Active Drives' : 'Back to Dashboard'}</Text></TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{showPast ? 'Past / Paused Drives' : 'Active Fund Drives'}</Text>
        {!showPast && (
          <TouchableOpacity style={styles.neatBtnDark} onPress={() => togglePast(true)}>
            <Text style={styles.neatBtnTextDark}>View Past Drives</Text>
          </TouchableOpacity>
        )}
      </View>

      {displayCamps.length === 0 && <Text style={{ color: '#64748B', marginBottom: 24 }}>No drives found.</Text>}

      {displayCamps.map((camp) => {
        const raised = parseFloat(camp.raised_amount) || 0; const target = parseFloat(camp.target_amount) || 1;
        const progress = Math.min(Math.round((raised / target) * 100), 100);
        const goalAchieved = raised >= target;
        const isStopped = camp.status === 'STOPPED' || goalAchieved;
        const isPaused = camp.status === 'PAUSED';

        return (
          <TouchableOpacity key={camp.campaign_id} style={[styles.formCard, isStopped && { opacity: 0.8, backgroundColor: '#F8FAFC' }]} onPress={() => onSelectCampaign(camp)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0, flex: 1 }]}>{camp.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: goalAchieved ? '#10B981' : isPaused ? '#F59E0B' : camp.status === 'STOPPED' ? '#EF4444' : '#3B82F6' }]}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{goalAchieved ? 'GOAL ACHIEVED' : camp.status}</Text>
              </View>
            </View>
            <Text style={{ color: '#64748B', marginBottom: 12, fontWeight: '500' }} numberOfLines={2}>{camp.description}</Text>

            {camp.remarks && (isStopped || isPaused) ? (
              <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                <Text style={{ color: '#991B1B', fontWeight: '800', fontSize: 12 }}>REMARKS: {camp.remarks}</Text>
              </View>
            ) : null}

            <View style={{ height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}><View style={{ width: `${progress}%`, backgroundColor: goalAchieved ? '#10B981' : '#3B82F6', height: '100%' }} /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontWeight: '700', color: '#004085' }}>Raised: ₹{raised}</Text><Text style={{ fontWeight: '700', color: goalAchieved ? '#10B981' : '#3B82F6' }}>Goal: ₹{target}</Text></View>
          </TouchableOpacity>
        );
      })}

      {!showPast && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>My Campaign Contributions</Text>
          <View style={styles.formCard}>
            {history.length === 0 ? <Text style={{ color: '#64748B' }}>No contributions yet.</Text> : history.map((txn, idx) => (
              <View key={idx} style={styles.historyRow}>
                <View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontWeight: '700', color: '#004085', fontSize: sz(14, 16) }}>{txn.reason}</Text><Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '600' }}>{new Date(txn.transaction_date).toLocaleDateString()}</Text></View>
                <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: sz(15, 18), fontWeight: '700', color: '#10B981', marginBottom: 8 }}>₹{txn.amount}</Text><TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity></View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// --- CAMPAIGN DETAIL ---
function CampaignDetailScreen({ campaign, currentUser, onBack, onViewReceipt }) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTotalPaid, setUserTotalPaid] = useState(0);

  useEffect(() => {
    const checkPastPayments = async () => {
      try {
        const txnSnap = await getDocs(collection(db, 'transactions'));
        const myTxns = txnSnap.docs.map(d => d.data()).filter(t => t.member_id === currentUser.official_id && t.campaign_id === campaign.campaign_id);
        setUserTotalPaid(myTxns.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0));
      } catch (e) {}
    };
    checkPastPayments();
  }, [campaign, currentUser]);

  const raised = parseFloat(campaign.raised_amount) || 0;
  const target = parseFloat(campaign.target_amount) || 1;
  const remaining = Math.max(0, target - raised);
  const goalAchieved = raised >= target;
  const isStopped = campaign.status === 'STOPPED' || goalAchieved;
  const isPaused = campaign.status === 'PAUSED';

  const handleUPIPayment = async () => {
    if (isStopped) return alert('This campaign is closed.');
    if (isPaused) return alert('This campaign is currently paused.');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return alert('Enter a valid amount.');
    if (parseFloat(amount) > remaining) return alert(`Maximum allowed contribution for this drive is ₹${remaining}`);

    setIsSubmitting(true);
    const upiSuccess = await openUPI(amount, `Campaign: ${campaign.title}`);
    if (!upiSuccess) { setIsSubmitting(false); return; }

    const txnId = `UPI_${Date.now()}`;
    const newRaisedAmount = raised + parseFloat(amount);
    const isNowGoalAchieved = newRaisedAmount >= target;

    const payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: currentUser.official_id, full_name: currentUser.full_name, amount: amount, payment_method: 'UPI', donation_type: 'FUND_RAISING', reason: `Campaign: ${campaign.title}`, campaign_id: campaign.campaign_id };
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      const campRef = doc(db, 'campaigns', campaign.campaign_id);

      let updateData = { raised_amount: newRaisedAmount };
      if (isNowGoalAchieved) {
        updateData.status = 'STOPPED';
        updateData.remarks = 'Goal Achieved';
      }
      await updateDoc(campRef, updateData);
      alert('Thank you! Contribution recorded.'); onViewReceipt({ ...payload, official_id: currentUser.official_id });
    } catch (error) { alert('Database Error'); } finally { setIsSubmitting(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: PAD }}>
      <TouchableOpacity onPress={() => onBack('fundraising')} style={{ marginBottom: 12 }}><Text style={{ color: '#004085', fontWeight: '800' }}>← Back to Campaigns</Text></TouchableOpacity>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{campaign.title}</Text>
        <Text style={{ color: '#475569', fontSize: sz(14, 16), lineHeight: 24, marginBottom: 20, fontWeight: '500' }}>{campaign.description}</Text>

        {userTotalPaid > 0 && (
          <View style={{ backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#BFDBFE' }}>
            <Text style={{ color: '#1E3A8A', fontWeight: '800', fontSize: 14 }}>You have already contributed ₹{userTotalPaid} to this drive.</Text>
            {!isStopped && !isPaused && <Text style={{ color: '#1D4ED8', marginTop: 4, fontWeight: '600' }}>Would you like to contribute more?</Text>}
          </View>
        )}

        {(campaign.remarks && (isStopped || isPaused)) ? (
          <View style={{ backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FECACA' }}>
            <Text style={{ color: '#991B1B', fontWeight: '800', fontSize: 14 }}>Admin Remarks: {campaign.remarks}</Text>
          </View>
        ) : null}

        {isPaused ? (
          <View style={{ alignItems: 'center', padding: 20, backgroundColor: '#FEF3C7', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A' }}>
            <Text style={{ color: '#D97706', fontWeight: '900', fontSize: 18 }}>⏸️ CAMPAIGN PAUSED</Text>
            <Text style={{ color: '#B45309', marginTop: 8, fontWeight: '600' }}>Contributions are temporarily on hold.</Text>
          </View>
        ) : isStopped ? (
          <View style={{ alignItems: 'center', padding: 20, backgroundColor: '#ECFDF5', borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
            <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 18 }}>🎉 {goalAchieved ? 'GOAL ACHIEVED!' : 'CAMPAIGN CLOSED'}</Text>
            <Text style={{ color: '#065F46', marginTop: 8, fontWeight: '600' }}>Thank you for your support.</Text>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontWeight: '800', color: '#64748B' }}>Target: ₹{target}</Text>
              <Text style={{ fontWeight: '800', color: '#3B82F6' }}>Remaining: ₹{remaining}</Text>
            </View>
            <Text style={styles.label}>Contribution Amount (₹)</Text><TextInput style={styles.input} placeholder={`Max: ₹${remaining}`} keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Contribute via UPI</Text>}</TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

// --- RECEIPT PAGE ---
function ReceiptPage({ receipt, currentUser, onBack }) {
  if (!receipt) return <View style={styles.container}><Text>No receipt data found.</Text></View>;
  const txnDate = new Date(receipt.transaction_date || Date.now()).toLocaleDateString();
  const displayId = receipt.official_id || currentUser?.official_id;
  const displayName = receipt.full_name || currentUser?.full_name;

  const printReceipt = async () => {
    const html = `
      <html><head><style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; padding: 40px; background: #f0f4f8; }
        .card { background: white; padding: 40px; border-radius: 16px; border: 1px solid #cbd5e1; width: 100%; max-width: 500px; }
        h1 { color: #004085; text-align: center; margin: 0; font-size: 32px; font-weight: 900; }
        p.sub { text-align: center; color: #64748b; font-size: 12px; font-weight: 800; margin-top: 5px; text-transform: uppercase; }
        .divider { border-bottom: 2px solid #f1f5f9; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 16px; }
        .row span:first-child { color: #64748b; font-weight: 700; }
        .row span:last-child { color: #0f172a; font-weight: 800; text-align: right; }
        .total { background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; font-size: 24px; font-weight: 900; color: #004085; margin-top: 20px; border: 1px solid #e2e8f0; }
      </style></head><body>
      <div class="card">
        <h1>HIYWA</h1><p class="sub">Hidhayathul Islam Youth Welfare Trust<br/>Official Payment Receipt</p>
        <div class="divider"></div>
        <div class="row"><span>Date:</span><span>${txnDate}</span></div>
        <div class="row"><span>Receipt ID:</span><span>#${receipt.transaction_id || 'PENDING'}</span></div>
        <div class="row"><span>Member ID:</span><span>${displayId}</span></div>
        <div class="row"><span>Name:</span><span>${displayName}</span></div>
        <div class="divider"></div>
        <div class="row"><span>Particulars:</span><span>${receipt.reason}</span></div>
        <div class="row"><span>Payment Mode:</span><span>${receipt.payment_method || 'UPI'}</span></div>
        <div class="total">Total Paid: Rs. ${receipt.amount}</div>
      </div></body></html>
    `;
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank'); printWindow.document.write(html); printWindow.document.close(); printWindow.focus(); setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      } else {
        const { uri } = await Print.printToFileAsync({ html }); await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e) { alert("Failed to generate PDF"); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, alignItems: 'center' }}>
      <TouchableOpacity onPress={() => onBack()} style={{ alignSelf: 'flex-start', marginBottom: 12 }}><Text style={{ color: '#004085', fontWeight: '800' }}>← Back</Text></TouchableOpacity>

      <View style={styles.receiptCard}>
        <View style={{ zIndex: 1, width: '100%' }}>
          <Text style={styles.receiptTitle}>HIYWA</Text>
          <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 11, marginBottom: 4, color: '#64748B' }}>Hidhayathul Islam Youth Welfare Trust</Text>
          <Text style={styles.receiptSubtitle}>Official Payment Receipt</Text>
          <View style={styles.receiptDivider} />
          <View style={{ width: '100%' }}>
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Date:</Text><Text style={styles.receiptVal}>{txnDate}</Text></View>
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Receipt ID:</Text><Text style={styles.receiptVal}>#{receipt.transaction_id || 'PENDING'}</Text></View>
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Member ID:</Text><Text style={styles.receiptVal}>{displayId}</Text></View>
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Name:</Text><Text style={styles.receiptVal}>{displayName}</Text></View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Particulars:</Text><Text style={styles.receiptVal}>{receipt.reason}</Text></View>
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Payment Mode:</Text><Text style={styles.receiptVal}>{receipt.payment_method || 'UPI'}</Text></View>
          </View>
          <View style={styles.receiptTotalBox}><Text style={styles.receiptTotalText}>Total Paid: Rs. {receipt.amount}</Text></View>
        </View>
      </View>

      <TouchableOpacity style={[styles.button, { marginTop: 20, width: '100%', maxWidth: 450, backgroundColor: '#10B981' }]} onPress={printReceipt}>
        <Text style={styles.buttonText}>🖨️ Download / Share Receipt</Text>
      </TouchableOpacity>
    </ScrollView>
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
    const timer = setTimeout(() => { onFinish(); }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#002752' }]}>
      <Animated.Image source={require('./hiywalogo.jpeg')} style={{ width: sz(140, 180), height: sz(140, 180), borderRadius: 20, transform: [{ scale: scaleValue }], opacity: opacityValue, marginBottom: 30 }} resizeMode="contain" />
      <Animated.Text style={{ color: '#ffc107', fontSize: sz(22, 28), fontWeight: '900', opacity: opacityValue, textAlign: 'center', paddingHorizontal: 20 }}>Welcome, {user.full_name}!</Animated.Text>
      <Animated.Text style={{ color: '#e9ecef', fontSize: sz(14, 16), opacity: opacityValue, marginTop: 10, fontWeight: '600' }}>Service for the Sake of Allah</Animated.Text>
    </View>
  );
}

// ==========================================
// GLOBAL STYLES (NAVY BLUE THEME) — compact on mobile, original on desktop
// ==========================================
const webDateStyle = { borderWidth: '2px', borderColor: '#E2E8F0', borderRadius: '12px', padding: sz('10px', '16px'), fontSize: sz('14px', '16px'), marginBottom: sz('16px', '24px'), backgroundColor: '#FFFFFF', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', color: '#004085', fontWeight: '600' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  authContainer: { flex: 1, backgroundColor: '#002752', justifyContent: 'center', alignItems: 'center', paddingVertical: 30 },

  sidebarContainer: { width: sz(250, 280), backgroundColor: '#002752', height: '100%', borderRightWidth: 1, borderRightColor: '#001a38', zIndex: 100 },
  sidebarMobileAbsolute: { position: 'absolute', left: 0, top: 0, bottom: 0, elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20 },
  sidebarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 },
  sidebarHeader: { padding: sz(16, 24), borderBottomWidth: 1, borderBottomColor: '#001a38' },
  sidebarBrand: { fontSize: sz(20, 24), fontWeight: '700', color: '#FFFFFF', letterSpacing: -1 },
  sidebarRole: { fontSize: 11, fontWeight: '700', color: '#ffc107', marginTop: 2, letterSpacing: 0.5 },
  sidebarSectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginLeft: sz(18, 24), marginBottom: sz(8, 12), marginTop: sz(8, 12), letterSpacing: 1 },
  sidebarBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: sz(8, 10), paddingHorizontal: sz(18, 24), borderLeftWidth: 3, borderLeftColor: 'transparent' },
  sidebarBtnActive: { backgroundColor: '#001a38', borderLeftColor: '#ffc107' },
  sidebarBtnText: { color: '#CBD5E1', fontSize: sz(14, 15), fontWeight: '600' },
  sidebarBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },
  sidebarFooter: { padding: sz(16, 24), borderTopWidth: 1, borderTopColor: '#001a38' },
  logoutBtn: { backgroundColor: '#001a38', padding: sz(10, 12), borderRadius: 10, alignItems: 'center' },

  contentHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: sz(12, 24), paddingVertical: sz(10, 20), borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 },
  contentTitle: { fontSize: sz(17, 22), fontWeight: '700', color: '#004085', letterSpacing: -0.5 },

  authCard: { backgroundColor: '#FFFFFF', width: '90%', maxWidth: 440, alignSelf: 'center', padding: sz(18, 24), borderRadius: sz(18, 24), borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)' },
  formCard: { backgroundColor: '#FFFFFF', marginVertical: sz(6, 8), padding: sz(14, 20), borderRadius: sz(16, 24), width: '100%', maxWidth: 1100, alignSelf: 'center', borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)' },
  adminCard: { backgroundColor: '#FFFFFF', padding: sz(12, 16), borderRadius: 16, marginBottom: sz(10, 16), borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.02)' },

  authTitle: { fontSize: sz(22, 28), fontWeight: '700', color: '#004085', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  authSubtitle: { fontSize: sz(13, 15), color: '#64748B', textAlign: 'center', marginBottom: sz(20, 32), fontWeight: '500' },
  sectionTitle: { fontSize: sz(17, 22), fontWeight: '700', color: '#004085', marginBottom: sz(14, 24), letterSpacing: -0.5 },

  label: { fontSize: sz(11, 12), fontWeight: '700', marginBottom: sz(6, 8), color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, padding: sz(10, 16), fontSize: sz(14, 16), marginBottom: sz(12, 16), backgroundColor: '#FFFFFF', color: '#004085', fontWeight: '500' },

  button: { backgroundColor: '#004085', paddingVertical: sz(12, 16), paddingHorizontal: sz(18, 24), borderRadius: 14, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: sz(14, 16), fontWeight: '700', letterSpacing: 0.5 },
  neatBtnPrimary: { backgroundColor: '#004085', paddingVertical: sz(8, 10), paddingHorizontal: sz(12, 16), borderRadius: 10, justifyContent: 'center' },
  neatBtnSuccess: { backgroundColor: '#10B981', paddingVertical: sz(8, 10), paddingHorizontal: sz(12, 16), borderRadius: 10, justifyContent: 'center' },
  neatBtnDark: { backgroundColor: '#FFFFFF', paddingVertical: sz(8, 10), paddingHorizontal: sz(12, 16), borderRadius: 10, justifyContent: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  neatBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: sz(12, 13) },
  neatBtnTextDark: { color: '#004085', fontWeight: '700', fontSize: sz(12, 13) },

  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: sz(10, 16), width: '100%', maxWidth: 1100, alignSelf: 'center', marginTop: 12 },
  bentoBox: { backgroundColor: '#FFFFFF', flexBasis: '48%', flexGrow: 1, minWidth: sz(240, 280), padding: sz(16, 24), borderRadius: sz(18, 24), borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)' },
  bentoIconWrap: { width: sz(40, 48), height: sz(40, 48), borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: sz(10, 16) },
  bentoTitle: { fontSize: sz(16, 18), fontWeight: '800', color: '#004085', marginBottom: 4, letterSpacing: -0.5 },
  bentoDesc: { fontSize: sz(13, 14), color: '#64748B', fontWeight: '500', lineHeight: 20 },

  dropdownBtn: { borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, padding: sz(10, 16), marginBottom: sz(12, 16), backgroundColor: '#FFFFFF' },
  dropdownBtnText: { fontSize: sz(14, 16), color: '#004085', fontWeight: '500' },
  dropdownList: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, marginBottom: sz(16, 24), marginTop: -8, elevation: 2, overflow: 'hidden' },
  dropdownItem: { padding: sz(11, 16), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemText: { fontSize: sz(13, 15), color: '#004085', fontWeight: '700' },
  filterLabel: { fontSize: sz(11, 12), fontWeight: '700', color: '#64748B', marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChipRow: { flexDirection: 'row', marginBottom: 12 },
  filterChip: { backgroundColor: '#FFFFFF', paddingVertical: sz(6, 8), paddingHorizontal: sz(12, 16), borderRadius: 20, marginRight: 8, borderWidth: 2, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#004085', borderColor: '#004085' },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#475569' },

  alertBox: { backgroundColor: '#FEF2F2', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FECACA', marginBottom: 24 },
  alertText: { color: '#991B1B', fontWeight: '700', fontSize: 14 },
  alertRedBox: { backgroundColor: '#FEF2F2', padding: sz(14, 24), borderRadius: 20, borderWidth: 2, borderColor: '#FECACA', marginBottom: sz(14, 24) },
  alertRedText: { color: '#991B1B', fontWeight: '800', textAlign: 'center', fontSize: sz(13, 15), letterSpacing: 0.5 },
  statusBadge: { paddingVertical: sz(4, 6), paddingHorizontal: sz(8, 12), borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: '#FFFFFF', fontSize: sz(10, 11), fontWeight: '800', letterSpacing: 0.5 },
  infoBadge: { backgroundColor: '#F8FAFC', paddingVertical: sz(4, 6), paddingHorizontal: sz(10, 12), borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  infoBadgeTxt: { fontSize: sz(12, 13), fontWeight: '700', color: '#004085' },

  statGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: sz(8, 12) },
  statBoxLarge: { backgroundColor: '#004085', padding: sz(12, 24), borderRadius: sz(14, 20), flex: 1, alignItems: 'center', elevation: 2 },
  statLargeVal: { fontSize: sz(18, 32), fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  statLargeKey: { fontSize: sz(10, 12), color: '#94A3B8', textAlign: 'center', marginTop: sz(4, 8), fontWeight: '700', textTransform: 'uppercase' },
  statWrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: sz(8, 12) },
  statChip: { backgroundColor: '#FFFFFF', padding: sz(10, 16), borderRadius: 16, width: '48%', flexDirection: 'column', borderWidth: 1, borderColor: '#E2E8F0' },
  statChipKey: { fontSize: sz(12, 14), color: '#64748B', fontWeight: '700', marginBottom: 4, flexShrink: 1 },
  statChipVal: { fontSize: sz(17, 20), color: '#004085', fontWeight: '800' },

  quickSelectContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: sz(16, 24) },
  quickBtn: { backgroundColor: '#FFFFFF', paddingVertical: sz(10, 14), borderRadius: 12, flex: 1, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  quickBtnActive: { backgroundColor: '#004085', borderColor: '#004085' },
  quickBtnText: { fontWeight: '700', color: '#64748B', fontSize: sz(13, 14) },
  quickBtnTextActive: { color: '#FFFFFF' },
  totalBox: { backgroundColor: '#F8FAFC', padding: sz(14, 20), borderRadius: 16, marginBottom: sz(16, 24), borderWidth: 1, borderColor: '#E2E8F0' },
  totalBoxText: { fontSize: sz(20, 24), fontWeight: '800', textAlign: 'center', color: '#004085', letterSpacing: -0.5 },

  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: sz(12, 20) },
  historyDetails: { fontSize: sz(13, 14), color: '#64748B', fontWeight: '500', marginTop: 4 },
  receiptCard: { backgroundColor: '#FFFFFF', padding: sz(20, 32), borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 450 },
  receiptTitle: { fontSize: sz(26, 32), fontWeight: '800', color: '#004085', textAlign: 'center', marginBottom: 4, letterSpacing: -1 },
  receiptSubtitle: { fontSize: sz(12, 14), color: '#64748B', textAlign: 'center', marginBottom: sz(16, 24), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  receiptDivider: { borderBottomWidth: 2, borderBottomColor: '#F1F5F9', marginVertical: sz(14, 20) },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: sz(12, 16) },
  receiptLabel: { fontSize: sz(13, 15), color: '#64748B', fontWeight: '700' },
  receiptVal: { fontSize: sz(13, 15), color: '#004085', flexShrink: 1, textAlign: 'right', marginLeft: 10, fontWeight: '700' },
  receiptTotalBox: { backgroundColor: '#F8FAFC', padding: sz(14, 20), borderRadius: 16, marginTop: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  receiptTotalText: { fontSize: sz(18, 22), fontWeight: '800', color: '#004085', textAlign: 'center' },
  receiptBtn: { backgroundColor: '#FFFFFF', paddingVertical: sz(7, 10), paddingHorizontal: sz(12, 16), borderRadius: 10, borderWidth: 2, borderColor: '#E2E8F0' },
  receiptBtnText: { fontSize: sz(12, 13), fontWeight: '700', color: '#004085' },

  idCardContainer: { width: 320, maxWidth: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', position: 'relative' },
  idCardHeader: { backgroundColor: '#004085', paddingVertical: 24, paddingHorizontal: 16, position: 'relative' },
  idCardPhoto: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#FFFFFF', marginTop: -60, backgroundColor: '#F1F5F9' },

  roleBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  roleBtnActive: { backgroundColor: '#FFFFFF', borderColor: '#004085', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  roleBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  roleBtnTextActive: { color: '#004085' },
  wizardProgress: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: sz(8, 24), marginBottom: sz(14, 24), marginTop: 8 },
  adminCardTitle: { fontSize: sz(15, 18), fontWeight: '800', color: '#004085', marginBottom: 4, letterSpacing: -0.5 },
  adminCardMeta: { fontSize: sz(12, 14), color: '#64748B', fontWeight: '500', marginBottom: 8 },
  actionBtn: { paddingVertical: sz(7, 8), paddingHorizontal: sz(11, 14), borderRadius: 10, backgroundColor: '#F8FAFC', marginBottom: 0, borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnText: { fontSize: sz(12, 13), fontWeight: '700', color: '#004085' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', marginHorizontal: 0, marginVertical: 12, borderRadius: 12, padding: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  tabBtn: { flex: 1, paddingVertical: sz(9, 12), alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  tabBtnText: { fontWeight: '700', color: '#64748B', fontSize: sz(12, 14) },
  tabBtnTextActive: { color: '#004085' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 39, 82, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#FFFFFF', width: '90%', maxWidth: 500, padding: sz(20, 32), borderRadius: 24, elevation: 0, borderWidth: 1, borderColor: '#E2E8F0' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 28, height: 28, borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 8, marginRight: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  checkboxActive: { backgroundColor: '#004085', borderColor: '#004085' },
  detailTxt: { fontSize: sz(13, 15), color: '#475569', marginBottom: 8, fontWeight: '500' },
});

