import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, BackHandler, KeyboardAvoidingView, useWindowDimensions } from 'react-native';


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
      <table class="meta-table"><tr><td>Native Place</td><td>${user.native_place || 'N/A'}</td></tr><tr><td>Blood Group</td><td>${user.blood_group || 'N/A'}</td></tr><tr><td>Age</td><td>${calcAge} Years</td></tr><tr><td>Contact</td><td>${user.phone_number || 'N/A'}</td></tr></table>
      <div class="footer-strip">COMMITTED TO SERVICE & COMMUNITY WELFARE</div>
    </div></body></html>
  `;
};


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
        <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>
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
               <Image source={require('./hiywalogo.jpeg')} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10 }} />
               <View>
                 <Text style={styles.sidebarBrand}>HIYWA</Text>
                 <Text style={styles.sidebarRole}>{currentUser?.role}</Text>
               </View>
            </View>
          </View>


          <ScrollView style={{ flex: 1, paddingVertical: 20 }}>
            <Text style={styles.sidebarSectionLabel}>MY ACCOUNT</Text>
            <NavButton title="My Profile" icon="👤" viewId="dashboard" />
            {!isStudent && <NavButton title="Subscriptions" icon="📅" viewId="subscription" />}
            <NavButton title="Make Donation" icon="💖" viewId="donate" />
            <NavButton title="Fund Drives" icon="📢" viewId="fundraising" />
            
            {isAdmin && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sidebarSectionLabel}>ADMINISTRATION</Text>
                {isCore && <NavButton title="Overview Stats" icon="📊" viewId="admin_stats" />}
                {(hasPerm('MANAGE_USERS') || isCore) && (
                  <>
                    <NavButton title="Member Directory" icon="👥" viewId="admin_users" />
                    <NavButton title="Student Directory" icon="🎓" viewId="admin_students" />
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
            <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12, fontWeight: 'bold' }}>ID: {currentUser?.official_id}</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={{ color: '#F87171', fontWeight: 'bold', fontSize: 14 }}>🚪 Logout Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      <View style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
        <View style={styles.contentHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isMobile && (
              <TouchableOpacity onPress={() => setIsOpen(true)} style={{ marginRight: 16, padding: 8 }}>
                <Text style={{ fontSize: 24, color: '#004085' }}>☰</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.contentTitle}>
              {currentView === 'dashboard' ? 'Overview' : 
               currentView === 'admin_stats' ? 'Overview Stats' :
               currentView === 'admin_users' ? 'Member Directory' :
               currentView === 'admin_students' ? 'Student Directory' :
               currentView === 'admin_finance' ? 'Finance Ledger' :
               currentView === 'admin_campaigns' ? 'Campaign Control' :
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


// ==========================================
// 2. MAIN APP ROUTER
// ==========================================
export default function MainApp() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [splashUser, setSplashUser] = useState(null);
  
  // NEW: State to remember if they clicked Member or Student
  const [registerRole, setRegisterRole] = useState(null);

  useEffect(() => {
    const backAction = () => {
      if (currentView === 'register') { setCurrentView('login'); return true; }
      if (currentView === 'campaignDetail') { setCurrentView('fundraising'); return true; }
      if (currentView === 'receipt') { setCurrentView('dashboard'); return true; }
      if (currentView === 'login' || currentView === 'dashboard' || currentView === 'admin_stats') {
        Alert.alert("Exit HIYWA App", "Are you sure you want to exit?", [{ text: "Cancel", style: "cancel" }, { text: "YES, EXIT", onPress: () => BackHandler.exitApp() }]);
        return true; 
      }
      setCurrentView('dashboard'); return true; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentView, currentUser]);

  if (splashUser) return <LoginSplashScreen user={splashUser} onFinish={() => { setCurrentUser(splashUser); setCurrentView(splashUser.role === 'ADMIN' ? 'admin_stats' : 'dashboard'); setSplashUser(null); }} />;
  if (currentView === 'login') return <LoginScreen onNavigate={setCurrentView} onLogin={setSplashUser} />;
  
  // Public Register doesn't pass a role initially
  if (currentView === 'register') return <RegisterScreen defaultRole={null} isAdminAuth={false} onBack={() => setCurrentView('login')} />;

  // Custom Navigation function to catch the role
  const handleDashboardNav = (view, passedRole = null) => {
    setRegisterRole(passedRole);
    setCurrentView(view);
  };

  return (
    <DashboardLayout currentUser={currentUser} currentView={currentView} setCurrentView={setCurrentView} onLogout={() => { setCurrentUser(null); setCurrentView('login'); }}>
      {currentView === 'dashboard' && <UserDashboard currentUser={currentUser} setCurrentUser={setCurrentUser} onNavigate={handleDashboardNav} />}
      
      {(currentView === 'admin_stats' || currentView === 'admin_users' || currentView === 'admin_students' || currentView === 'admin_finance' || currentView === 'admin_campaigns' || currentView === 'admin_expense' || currentView === 'admin_settings') && 
        <AdminDashboard currentUser={currentUser} activeTab={currentView.replace('admin_', '').toUpperCase()} onNavigate={handleDashboardNav} onViewReceipt={(txn) => { setSelectedReceipt(txn); setCurrentView('receipt'); }} />
      }
      
      {/* Admin Register now injects the specific role they clicked! */}
      {currentView === 'adminRegister' && <RegisterScreen defaultRole={registerRole} isAdminAuth={true} onBack={() => setCurrentView(registerRole === 'STUDENT' ? 'admin_students' : 'admin_users')} />}
      
      {currentView === 'donate' && <DonationPortal currentUser={currentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setCurrentView('receipt'); }} />}
      {currentView === 'subscription' && <SubscriptionScreen currentUser={currentUser} setCurrentUser={setCurrentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setCurrentView('receipt'); }} />}
      {currentView === 'fundraising' && <FundraisingListScreen onSelectCampaign={(camp) => { setSelectedCampaign(camp); setCurrentView('campaignDetail'); }} />}
      {currentView === 'campaignDetail' && <CampaignDetailScreen campaign={selectedCampaign} currentUser={currentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setCurrentView('receipt'); }} onBack={() => setCurrentView('fundraising')} />}
      {currentView === 'receipt' && <ReceiptPage receipt={selectedReceipt} currentUser={currentUser} onBack={() => setCurrentView('dashboard')} />}
    </DashboardLayout>
  );
}


// --- COMPACT DROPDOWN FILTER ---
const FilterDropdown = ({ label, value, options, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, minWidth: 100, zIndex: open ? 100 : 1 }}>
      <TouchableOpacity style={[styles.dropdownBtn, {marginBottom: 0, paddingVertical: 8, paddingHorizontal: 10, height: 42, justifyContent: 'center'}]} onPress={() => setOpen(!open)}>
        <Text style={[styles.dropdownBtnText, {fontSize: 12}]} numberOfLines={1}>{value || label}</Text>
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdownList, {position: 'absolute', top: 46, left: 0, right: 0, zIndex: 100, marginBottom: 0, marginTop: 0}]}>
          <ScrollView nestedScrollEnabled style={{maxHeight: 150}}>
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
  
  // States for Reset Popup & Eye Icons
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
            <View style={[styles.modalCard, {alignItems: 'center', zIndex: 1000}]}>
              <Text style={{fontSize: 48, marginBottom: 16}}>⚠️</Text>
              <Text style={{fontSize: 22, fontWeight: '900', color: '#004085', marginBottom: 12, textAlign: 'center'}}>Password Update Required</Text>
              <Text style={{fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 22}}>For security reasons, you must change your default password before accessing the portal.</Text>
              <TouchableOpacity style={[styles.button, {width: '100%'}]} onPress={() => setShowResetAlert(false)}>
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
            <TouchableOpacity style={{ position: 'absolute', right: 15, top: 18, zIndex: 1 }} onPress={() => setShowNewPassword(!showNewPassword)}>
              <Text style={{ fontSize: 18 }}>{showNewPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={{ position: 'relative' }}>
            <TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
            <TouchableOpacity style={{ position: 'absolute', right: 15, top: 18, zIndex: 1 }} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
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
        <View style={{ alignItems: 'center', marginBottom: 15 }}><Image source={require('./hiywalogo.jpeg')} style={{ width: 80, height: 80, borderRadius: 16 }} resizeMode="contain" /></View>
        <Text style={styles.authTitle}>HIYWA Connect</Text>
        <Text style={styles.authSubtitle}>Secure Member Portal</Text>
        <Text style={styles.label}>Official Login ID</Text>
        <TextInput style={styles.input} autoCapitalize="characters" value={loginId} onChangeText={(t) => setLoginId(t.replace(/\s/g, ''))} />
        <Text style={styles.label}>Password</Text>
        <View style={{ position: 'relative' }}>
          <TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity style={{ position: 'absolute', right: 15, top: 18, zIndex: 1 }} onPress={() => setShowPassword(!showPassword)}><Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Secure Login</Text>}</TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 24, alignItems: 'center' }} onPress={() => onNavigate('register')}><Text style={{ color: '#004085', fontWeight: '800' }}>New Member? Register Here</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}


// --- USER DASHBOARD ---
function UserDashboard({ currentUser, setCurrentUser, onNavigate }) {
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
    const fetchCamps = async () => { try { const snap = await getDocs(collection(db, 'campaigns')); setActiveCampaigns(snap.docs.map(d=>d.data()).filter(c=>c.status==='ACTIVE')); } catch (err) {} };
    fetchCamps();
  }, []);


  const pickImage = () => {
    Alert.alert("Upload Photo", "Choose an option", [
      { text: "Take Photo (Camera)", onPress: async () => { const permissionResult = await ImagePicker.requestCameraPermissionsAsync(); if (permissionResult.granted === false) return alert("Camera permission is required!"); let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true }); if (!result.canceled) { setProfileImage(`data:image/jpeg;base64,${result.assets[0].base64}`); setEditFormData({...editFormData, profile_photo: `data:image/jpeg;base64,${result.assets[0].base64}`}); } } },
      { text: "Choose from Gallery", onPress: async () => { let result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true }); if (!result.canceled) { setProfileImage(`data:image/jpeg;base64,${result.assets[0].base64}`); setEditFormData({...editFormData, profile_photo: `data:image/jpeg;base64,${result.assets[0].base64}`}); } } },
      { text: "Cancel", style: "cancel" }
    ]);
  };


  const saveEditedProfile = async () => {
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'members', currentUser.official_id), editFormData);
      alert('Profile Updated Successfully!'); setCurrentUser({...currentUser, ...editFormData}); setIsEditingProfile(false);
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
    } catch(e) { alert("Failed to generate ID Card"); }
  };


  if (showIdCardModal) {
    const age = currentUser.dob ? (new Date().getFullYear() - new Date(currentUser.dob).getFullYear()) : 'N/A';
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
         <TouchableOpacity style={[styles.neatBtnDark, {alignSelf: 'flex-start', marginLeft: 20, marginBottom: 20, marginTop: 20}]} onPress={() => setShowIdCardModal(false)}><Text style={styles.neatBtnTextDark}>← Back to Dashboard</Text></TouchableOpacity>
         <View style={styles.idCardContainer}>
            <View style={{zIndex: 1}}>
                <View style={styles.idCardHeader}>
                   <Text style={{color: 'white', fontWeight: 'bold', fontSize: 22, textAlign: 'center', letterSpacing: 1, marginBottom: 2}}>HIYWA</Text>
                   <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11, textAlign: 'center'}}>Hidhayathul Islam Youth Welfare Trust</Text>
                </View>
                <View style={{padding: 20, alignItems: 'center'}}>
                   {profileImage ? <Image source={{uri: profileImage}} style={styles.idCardPhoto} /> : <View style={[styles.idCardPhoto, {justifyContent:'center', alignItems:'center'}]}><Text style={{fontSize:40}}>👤</Text></View>}
                   <Text style={{fontSize: 22, fontWeight: '900', color: '#004085', marginTop: 10}}>{currentUser.full_name}</Text>
                   <Text style={{fontSize: 16, color: '#64748B', fontWeight: '800', marginTop: 5}}>ID: {currentUser.official_id}</Text>
                   <View style={{marginTop: 15, width: '100%', alignItems: 'flex-start'}}>
                      <Text style={{fontSize: 13, color: '#475569', marginBottom: 6}}><b>Role:</b> {currentUser.role}</Text>
                      <Text style={{fontSize: 13, color: '#475569', marginBottom: 6}}><b>Age / Blood:</b> {age} / {currentUser.blood_group || 'N/A'}</Text>
                      <Text style={{fontSize: 13, color: '#475569', marginBottom: 6}}><b>Phone:</b> {currentUser.phone_number}</Text>
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
    const isCollegeEditUser = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editFormData.class_grade);


    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View style={styles.formCard}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
              <Text style={styles.sectionTitle}>Edit Profile details</Text>
              <TouchableOpacity style={styles.neatBtnDark} onPress={() => setIsEditingProfile(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
            </View>
            
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity onPress={pickImage}>
                {editFormData.profile_photo ? <Image source={{uri: editFormData.profile_photo}} style={{width: 100, height: 100, borderRadius: 50}} /> : <View style={{width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center'}}><Text>📷 Photo</Text></View>}
              </TouchableOpacity>
            </View>


            <Text style={styles.label}>Full Name</Text><TextInput style={styles.input} value={editFormData.full_name || ''} onChangeText={t=>setEditFormData({...editFormData, full_name: t})} />
            <Text style={styles.label}>Father's Name</Text><TextInput style={styles.input} value={editFormData.father_name || ''} onChangeText={t=>setEditFormData({...editFormData, father_name: t})} />
            <Text style={styles.label}>Mother's Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.mother_name} onChangeText={(t) => setEditFormData({...editFormData, mother_name: t})} />
            <Text style={styles.label}>Parents Status</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditParentsDrop(!editParentsDrop)}><Text style={styles.dropdownBtnText}>{editFormData.parents_status || 'SELECT STATUS'}</Text></TouchableOpacity>
            {editParentsDrop && <View style={styles.dropdownList}>{['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED'].map(s => <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, parents_status: s}); setEditParentsDrop(false);}}><Text style={styles.dropdownItemText}>{s}</Text></TouchableOpacity>)}</View>}
            <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
            {Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formattedDob} onChange={(e) => setEditFormData({...editFormData, dob: e.target.value})} /> : <TextInput style={styles.input} value={formattedDob} onChangeText={t=>setEditFormData({...editFormData, dob: t})} />}
            <Text style={styles.label}>Blood Group</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditBloodDrop(!editBloodDrop)}><Text style={styles.dropdownBtnText}>{editFormData.blood_group || 'SELECT BLOOD GROUP'}</Text></TouchableOpacity>
            {editBloodDrop && <View style={styles.dropdownList}>{BLOOD_GROUPS.map(bg => <TouchableOpacity key={bg} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, blood_group: bg}); setEditBloodDrop(false);}}><Text style={styles.dropdownItemText}>{bg}</Text></TouchableOpacity>)}</View>}
            
            <Text style={styles.label}>Phone Number</Text><TextInput style={styles.input} value={editFormData.phone_number || ''} onChangeText={t=>setEditFormData({...editFormData, phone_number: t})} keyboardType="numeric" />
            <Text style={styles.label}>WhatsApp Number</Text><TextInput style={styles.input} value={editFormData.whatsapp_number || ''} onChangeText={t=>setEditFormData({...editFormData, whatsapp_number: t})} keyboardType="numeric" />
            <Text style={styles.label}>Email</Text><TextInput style={styles.input} value={editFormData.email || ''} onChangeText={t=>setEditFormData({...editFormData, email: t})} />
            <Text style={styles.label}>Native Place</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditNativeDrop(!editNativeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.native_place || 'SELECT NATIVE PLACE'}</Text></TouchableOpacity>
            {editNativeDrop && <View style={styles.dropdownList}>{NATIVE_PLACES.map(np => <TouchableOpacity key={np} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, native_place: np}); setEditNativeDrop(false);}}><Text style={styles.dropdownItemText}>{np}</Text></TouchableOpacity>)}</View>}
            <Text style={styles.label}>Current Location</Text><TextInput style={styles.input} value={editFormData.current_location || ''} onChangeText={t=>setEditFormData({...editFormData, current_location: t})} />
            <Text style={styles.label}>Full Address</Text><TextInput style={[styles.input, {height: 60}]} multiline value={editFormData.address || ''} onChangeText={t=>setEditFormData({...editFormData, address: t})} />
            
            {currentUser.role === 'MEMBER' && (
               <View>
                 <Text style={styles.label}>Education Category</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'SELECT EDUCATION'}</Text></TouchableOpacity>
                 {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, educational_qualification: el}); setEditEduDrop(false);}}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
                 <Text style={styles.label}>Course / Major Details</Text><TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} />
                 <Text style={styles.label}>Occupation / Job</Text><TextInput style={styles.input} value={editFormData.occupation || ''} onChangeText={t=>setEditFormData({...editFormData, occupation: t})} />
               </View>
            )}


            {currentUser.role === 'STUDENT' && (
               <View>
                 <Text style={styles.label}>Class / Grade</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditClassDrop(!editClassDrop)}><Text style={styles.dropdownBtnText}>{editFormData.class_grade || 'SELECT CLASS'}</Text></TouchableOpacity>
                 {editClassDrop && <View style={styles.dropdownList}><ScrollView nestedScrollEnabled style={{maxHeight: 200}}>{CLASSES.map(c => <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, class_grade: c}); setEditClassDrop(false);}}><Text style={styles.dropdownItemText}>{c}</Text></TouchableOpacity>)}</ScrollView></View>}
                 <Text style={styles.label}>School / College Name</Text><TextInput style={styles.input} value={editFormData.school_name || ''} onChangeText={t=>setEditFormData({...editFormData, school_name: t})} />
                 <Text style={styles.label}>Institution Type</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditSchoolTypeDrop(!editSchoolTypeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.school_type || 'SELECT TYPE'}</Text></TouchableOpacity>
                 {editSchoolTypeDrop && <View style={styles.dropdownList}>{(isCollegeEditUser ? COLLEGE_TYPES : SCHOOL_TYPES).map(st => <TouchableOpacity key={st} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, school_type: st}); setEditSchoolTypeDrop(false);}}><Text style={styles.dropdownItemText}>{st}</Text></TouchableOpacity>)}</View>}
                 <Text style={styles.label}>Medium of Instruction</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditMediumDrop(!editMediumDrop)}><Text style={styles.dropdownBtnText}>{editFormData.medium_of_instruction || 'SELECT MEDIUM'}</Text></TouchableOpacity>
                 {editMediumDrop && <View style={styles.dropdownList}>{MEDIUMS.map(md => <TouchableOpacity key={md} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, medium_of_instruction: md}); setEditMediumDrop(false);}}><Text style={styles.dropdownItemText}>{md}</Text></TouchableOpacity>)}</View>}
                 {isCollegeEditUser && (
                   <View>
                     <Text style={styles.label}>Educational Category</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'SELECT EDUCATION'}</Text></TouchableOpacity>
                     {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, educational_qualification: el}); setEditEduDrop(false);}}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
                     <Text style={styles.label}>Course / Major Details</Text><TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} />
                   </View>
                 )}
               </View>
            )}


            <Text style={styles.label}>Islamic Studies</Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 16}}>
               <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='YES' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'YES'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='YES' && {color:'white'}]}>Yes</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='NO' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'NO'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='NO' && {color:'white'}]}>No</Text></TouchableOpacity>
            </View>
            
            {editFormData.islamic_studies === 'YES' && (
              <View style={{padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16}}>
                <Text style={styles.label}>Islamic Qualification</Text>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditIslamicDrop(!editIslamicDrop)}><Text style={styles.dropdownBtnText}>{editFormData.islamic_qualification || 'SELECT QUALIFICATION'}</Text></TouchableOpacity>
                {editIslamicDrop && <View style={styles.dropdownList}>{ISLAMIC_QUALS.map(iq => <TouchableOpacity key={iq} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, islamic_qualification: iq}); setEditIslamicDrop(false);}}><Text style={styles.dropdownItemText}>{iq}</Text></TouchableOpacity>)}</View>}
                <Text style={styles.label}>Madrasa Name</Text><TextInput style={styles.input} value={editFormData.madrasa_name || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_name: t})} />
                <Text style={styles.label}>Madrasa Location</Text><TextInput style={styles.input} value={editFormData.madrasa_location || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_location: t})} />
              </View>
            )}
            
            <TouchableOpacity style={styles.button} onPress={saveEditedProfile} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save Profile Data</Text>}</TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }


  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      
      <View style={[styles.formCard, { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 24 }]}>
        <View style={{ position: 'relative' }}>
          {profileImage ? <Image source={{ uri: profileImage }} style={{ width: 120, height: 120, borderRadius: 60 }} /> : <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 40 }}>👤</Text></View>}
        </View>


        <View style={{ flex: 1, minWidth: 250 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#004085', letterSpacing: -0.5 }}>{currentUser?.full_name}</Text>
          <Text style={{ fontSize: 15, color: '#64748B', marginTop: 4, fontWeight: '600' }}>
            Blood: {currentUser?.blood_group}  •  {currentUser?.phone_number}  •  {currentUser?.native_place}
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setShowIdCardModal(true)}>
              <Text style={styles.neatBtnText}>🪪 View ID Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.neatBtnDark} onPress={() => {setEditFormData(currentUser); setIsEditingProfile(true);}}>
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


      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Quick Actions</Text>


      <View style={styles.bentoGrid}>
        {currentUser?.role !== 'STUDENT' && (
           <TouchableOpacity style={styles.bentoBox} onPress={() => onNavigate('subscription')}>
             <View>
               <View style={styles.bentoIconWrap}><Text style={{ fontSize: 24 }}>📅</Text></View>
               <Text style={styles.bentoTitle}>Subscriptions</Text>
               <Text style={styles.bentoDesc}>Manage your monthly Trust contributions and view history.</Text>
             </View>
             <View style={{ marginTop: 24, alignSelf: 'flex-start' }}><Text style={{ color: '#004085', fontWeight: '800', fontSize: 13 }}>MANAGE ↗</Text></View>
           </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.bentoBox} onPress={() => onNavigate('donate')}>
          <View>
            <View style={[styles.bentoIconWrap, { backgroundColor: '#FEF2F2' }]}><Text style={{ fontSize: 24 }}>💖</Text></View>
            <Text style={styles.bentoTitle}>General Donation</Text>
            <Text style={styles.bentoDesc}>Make a one-time contribution to the Trust's general fund.</Text>
          </View>
          <View style={{ marginTop: 24, alignSelf: 'flex-start' }}><Text style={{ color: '#E11D48', fontWeight: '800', fontSize: 13 }}>DONATE ↗</Text></View>
        </TouchableOpacity>


        <TouchableOpacity style={styles.bentoBox} onPress={() => onNavigate('fundraising')}>
          <View>
            <View style={[styles.bentoIconWrap, { backgroundColor: '#ECFDF5' }]}><Text style={{ fontSize: 24 }}>📢</Text></View>
            <Text style={styles.bentoTitle}>Fund Drives</Text>
            <Text style={styles.bentoDesc}>Participate in active campaigns for specific causes.</Text>
          </View>
          <View style={{ marginTop: 24, alignSelf: 'flex-start' }}><Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>VIEW CAUSES ↗</Text></View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


// --- ADMIN DASHBOARD ---
function AdminDashboard({ currentUser, activeTab, onNavigate, onViewReceipt }) {
  const isCore = currentUser?.is_core_admin;
  const perms = currentUser?.admin_permissions || '[]';
  const hasPerm = (p) => isCore || perms.includes('ALL') || perms.includes(p);
  
  const [directory, setDirectory] = useState([]);
  const [globalTxns, setGlobalTxns] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NEW SETTINGS STATE ---
  const [subAmount, setSubAmount] = useState('100');
  const [primaryUpi, setPrimaryUpi] = useState('');
  const [secondaryUpi, setSecondaryUpi] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');

  // --- NEW EXPENSE STATE ---
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');

  // States for Modals and Filters
  const [selectedDetailUser, setSelectedDetailUser] = useState(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  
  const [viewCampDonors, setViewCampDonors] = useState(null);


  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ blood: '', edu: '', gender: '', native: '', marital: '', status: '', islamic: '' });


  const [financeTab, setFinanceTab] = useState('LEDGER');
  const [showFinFilters, setShowFinFilters] = useState(false);
  const [finSearchQuery, setFinSearchQuery] = useState('');
  const [finTypeFilter, setFinTypeFilter] = useState('');
  const [finStartDate, setFinStartDate] = useState('');
  const [finEndDate, setFinEndDate] = useState('');


  // Dropdown States for Editing
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


  // Cash Modal State
  const [cashUser, setCashUser] = useState(null);
  const [cashType, setCashType] = useState('SUBSCRIPTION'); 
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [cashMonths, setCashMonths] = useState('1');
  const [cashCampId, setCashCampId] = useState('');
  
  // Campaign Create State
  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campTarget, setCampTarget] = useState('');
  
  // Promote State
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


  useEffect(() => { fetchData(); }, [activeTab]);


  // Calculations
  const stats = { roles: {}, bloodGroups: {}, marital: {}, education: {}, native: {}, gender: {} };
  const incrementStat = (cat, val, role) => { if (!val) return; if (!stats[cat][val]) stats[cat][val] = { total: 0, M: 0, S: 0 }; stats[cat][val].total += 1; if (role === 'STUDENT') stats[cat][val].S += 1; else stats[cat][val].M += 1; };
  directory.filter(u => !u.is_core_admin).forEach(u => { stats.roles[u.role] = (stats.roles[u.role] || 0) + 1; incrementStat('bloodGroups', u.blood_group, u.role); incrementStat('marital', u.marital_status, u.role); incrementStat('education', u.educational_qualification, u.role); incrementStat('native', u.native_place, u.role); incrementStat('gender', u.gender, u.role); });


  const renderSplitBlocks = (statObj) => Object.entries(statObj).sort((a,b)=>b[1].total-a[1].total).map(([key, val]) => (
    <View key={key} style={styles.statChip}><View style={{flexDirection: 'row', justifyContent: 'space-between'}}><Text style={styles.statChipKey} numberOfLines={1}>{key}</Text><Text style={styles.statChipVal}>{val.total}</Text></View><Text style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: 'bold' }}>Mem: {val.M} | Stu: {val.S}</Text></View>
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
  }).filter(u => u.duesMonths > 0).sort((a,b) => b.duesMonths - a.duesMonths);

  const totalFinSubs = allIncomes.filter(t=>t.donation_type==='SUBSCRIPTION').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalFinGen = allIncomes.filter(t=>t.donation_type==='GENERAL').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalFinCamp = allIncomes.filter(t=>t.donation_type==='FUND_RAISING' || t.donation_type==='CAMPAIGN').reduce((sum, t) => sum + Number(t.amount), 0);
  
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
    if (overrideTarget === 'DECEASED') { Alert.alert("Confirm Deceased Status", "Are you sure?", [{ text: "Cancel", style: "cancel" }, { text: "Confirm", style: "destructive", onPress: executeToggle }]); } else executeToggle();
  };


  const handleDemoteAdmin = (officialId) => {
    Alert.alert("Revoke Admin Rights", "Revoke administrative access?", [{ text: "Cancel", style: "cancel" }, { text: "Revoke", style: "destructive", onPress: async () => { try { await updateDoc(doc(db, 'members', officialId), { role: 'MEMBER', is_core_admin: false, admin_permissions: '[]' }); setSelectedDetailUser(null); fetchData(); } catch (e) { alert('Failed to revoke.'); } } }]);
  };


  const handleConvertStudent = (officialId) => {
    Alert.alert("Upgrade Student", "Upgrade to Member profile?", [{ text: "Cancel", style: "cancel" }, { text: "Upgrade", onPress: async () => { try { await updateDoc(doc(db, 'members', officialId), { role: 'MEMBER' }); alert('Converted to Member.'); setSelectedDetailUser(null); fetchData(); } catch (e) { alert('Failed to convert.'); } } }]);
  };


  const submitPromotion = async () => {
    const permsArray = []; if (selectedPerms.MANAGE_USERS) permsArray.push("MANAGE_USERS"); if (selectedPerms.MANAGE_FINANCE) permsArray.push("MANAGE_FINANCE"); if (selectedPerms.MANAGE_CAMPAIGNS) permsArray.push("MANAGE_CAMPAIGNS");
    if (permsArray.length === 0) return alert("Select at least one permission.");
    try { await updateDoc(doc(db, 'members', promoteUserId), { role: 'ADMIN', admin_permissions: JSON.stringify(permsArray) }); alert('Promoted to Sub-Admin successfully!'); setPromoteModalVisible(false); setSelectedDetailUser(null); fetchData(); } catch (e) { alert('Failed to promote.'); }
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


  const uploadPhotoForUser = async (officialId) => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (!result.canceled) {
      const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try { await updateDoc(doc(db, 'members', officialId), { profile_photo: b64 }); alert('Photo uploaded!'); setSelectedDetailUser({...selectedDetailUser, profile_photo: b64}); fetchData(); } catch (e) { alert('Error saving photo.'); }
    }
  };


  const submitCashPayment = async () => {
    if (!cashAmount || isNaN(cashAmount) || Number(cashAmount) <= 0) return alert('Enter valid amount.');
    const txnId = `CASH_${Date.now()}`;
    let payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: cashUser.official_id, full_name: cashUser.full_name, role: cashUser.role, amount: cashAmount, payment_method: 'CASH (OFFLINE)', gateway_txn_id: txnId };
    if (cashType === 'SUBSCRIPTION') { payload.donation_type = 'SUBSCRIPTION'; payload.months_count = cashMonths; payload.reason = 'OFFLINE CASH SUBSCRIPTION'; } 
    else if (cashType === 'GENERAL') { if (!cashReason) return alert('Reason is required.'); payload.donation_type = 'GENERAL'; payload.reason = cashReason; payload.months_count = 0; } 
    else if (cashType === 'CAMPAIGN') { if (!cashCampId) return alert('Select campaign ID.'); const cName = campaigns.find(c=>c.campaign_id == cashCampId)?.title || 'Campaign'; payload.campaign_id = cashCampId; payload.reason = `Cash Support: ${cName}`; payload.donation_type = 'FUND_RAISING'; }
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      if (cashType === 'SUBSCRIPTION') { const newTotal = (parseInt(cashUser.total_months_paid) || 0) + parseInt(cashMonths || 1); await updateDoc(doc(db, 'members', cashUser.official_id), { total_months_paid: newTotal }); }
      if (cashType === 'CAMPAIGN') { const campRef = doc(db, 'campaigns', cashCampId); const cSnap = await getDoc(campRef); await updateDoc(campRef, { raised_amount: (parseFloat(cSnap.data().raised_amount)||0) + parseFloat(cashAmount) }); }
      alert('Offline cash payment logged successfully!'); setCashModalVisible(false); fetchData(); onViewReceipt({ ...payload, official_id: cashUser.official_id });
    } catch (e) { alert('Failed to log payment.'); }
  };


  const handleCreateCampaign = async () => {
    if (!campTitle || !campDesc || !campTarget) return alert('All campaign fields required.');
    const campId = 'CAMP_' + Date.now();
    try { await setDoc(doc(db, 'campaigns', campId), { campaign_id: campId, title: campTitle.toUpperCase(), description: campDesc, target_amount: campTarget, raised_amount: 0, status: 'ACTIVE', created_at: new Date().toISOString() }); alert('Campaign Published!'); setCampTitle(''); setCampDesc(''); setCampTarget(''); setShowCampaignModal(false); fetchData(); } catch (e) { alert('Failed to create campaign.'); }
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
    } catch(e) { alert("Failed to generate PDF"); }
  };


  const renderUserDetail = () => {
    const u = selectedDetailUser;
    const isPromotedSubAdmin = u.role === 'ADMIN' && !u.is_core_admin;
    const age = u.dob ? (new Date().getFullYear() - new Date(u.dob).getFullYear()) : 'Unknown';


    if (showIdCardModal) {
      return (
        <View style={{alignItems: 'center', marginBottom: 20}}>
          <TouchableOpacity style={[styles.neatBtnDark, {alignSelf: 'flex-start', marginBottom: 20}]} onPress={() => setShowIdCardModal(false)}><Text style={styles.neatBtnTextDark}>← Back to Profile</Text></TouchableOpacity>
          <View style={styles.idCardContainer}>
             <View style={{zIndex: 1}}>
                 <View style={styles.idCardHeader}>
                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 22, textAlign: 'center', letterSpacing: 1, marginBottom: 2}}>HIYWA</Text>
                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11, textAlign: 'center'}}>Hidhayathul Islam Youth Welfare Trust</Text>
                 </View>
                 <View style={{padding: 20, alignItems: 'center'}}>
                    {u.profile_photo ? <Image source={{uri: u.profile_photo}} style={styles.idCardPhoto} /> : <View style={[styles.idCardPhoto, {backgroundColor: '#ccc', justifyContent:'center', alignItems:'center'}]}><Text style={{fontSize:40}}>👤</Text></View>}
                    <Text style={{fontSize: 22, fontWeight: '900', color: '#004085', marginTop: 10}}>{u.full_name}</Text>
                    <Text style={{fontSize: 16, color: '#64748B', fontWeight: '800', marginTop: 5}}>ID: {u.official_id}</Text>
                    <View style={{marginTop: 15, width: '100%', alignItems: 'flex-start'}}>
                       <Text style={{fontSize: 13, color: '#475569', marginBottom: 6}}><b>Role:</b> {u.role}</Text>
                       <Text style={{fontSize: 13, color: '#475569', marginBottom: 6}}><b>Age / Blood:</b> {age} / {u.blood_group || 'N/A'}</Text>
                       <Text style={{fontSize: 13, color: '#475569', marginBottom: 6}}><b>Phone:</b> {u.phone_number}</Text>
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
      const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editFormData.class_grade);


      return (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit Details for {u.full_name}</Text>
          <Text style={styles.label}>Personal Details</Text>
          <Text style={styles.filterLabel}>Full Name</Text><TextInput style={styles.input} value={editFormData.full_name || ''} onChangeText={t=>setEditFormData({...editFormData, full_name: t})} />
          <Text style={styles.filterLabel}>Father's Name</Text><TextInput style={styles.input} value={editFormData.father_name || ''} onChangeText={t=>setEditFormData({...editFormData, father_name: t})} />
          <Text style={styles.label}>Mother's Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.mother_name} onChangeText={(t) => setEditFormData({...editFormData, mother_name: t})} />
          
          <Text style={styles.label}>Parents Status</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditParentsDrop(!editParentsDrop)}><Text style={styles.dropdownBtnText}>{editFormData.parents_status || 'SELECT STATUS'}</Text></TouchableOpacity>
          {editParentsDrop && <View style={styles.dropdownList}>{['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED'].map((s) => (<TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => { setEditFormData({...editFormData, parents_status: s}); setEditParentsDrop(false); }}><Text style={styles.dropdownItemText}>{s}</Text></TouchableOpacity>))}</View>}
          
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
          <Text style={styles.filterLabel}>Phone Number</Text><TextInput style={styles.input} value={editFormData.phone_number || ''} onChangeText={t=>setEditFormData({...editFormData, phone_number: t})} keyboardType="numeric" />
          <Text style={styles.filterLabel}>WhatsApp Number</Text><TextInput style={styles.input} value={editFormData.whatsapp_number || ''} onChangeText={t=>setEditFormData({...editFormData, whatsapp_number: t})} keyboardType="numeric" />
          <Text style={styles.filterLabel}>Email</Text><TextInput style={styles.input} value={editFormData.email || ''} onChangeText={t=>setEditFormData({...editFormData, email: t})} />
          
          <Text style={styles.filterLabel}>Native Place</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditNativeDrop(!editNativeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.native_place || 'Select Native Place'}</Text></TouchableOpacity>
          {editNativeDrop && <View style={styles.dropdownList}>{NATIVE_PLACES.map(np => <TouchableOpacity key={np} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, native_place: np}); setEditNativeDrop(false);}}><Text style={styles.dropdownItemText}>{np}</Text></TouchableOpacity>)}</View>}
          
          <Text style={styles.filterLabel}>Current Location</Text><TextInput style={styles.input} value={editFormData.current_location || ''} onChangeText={t=>setEditFormData({...editFormData, current_location: t})} />
          <Text style={styles.filterLabel}>Full Address</Text><TextInput style={[styles.input, {height: 60}]} multiline value={editFormData.address || ''} onChangeText={t=>setEditFormData({...editFormData, address: t})} />
          
          <Text style={styles.label}>Education & Occupation</Text>
          
          {editFormData.role === 'MEMBER' && (
             <View>
               <Text style={styles.filterLabel}>Education Category</Text>
               <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'Select Education'}</Text></TouchableOpacity>
               {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, educational_qualification: el}); setEditEduDrop(false);}}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
               <Text style={styles.filterLabel}>Course / Major</Text><TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} />
               <Text style={styles.filterLabel}>Occupation / Job</Text><TextInput style={styles.input} value={editFormData.occupation || ''} onChangeText={t=>setEditFormData({...editFormData, occupation: t})} />
             </View>
          )}


          {editFormData.role === 'STUDENT' && (
             <View>
               <Text style={styles.filterLabel}>Class / Grade</Text>
               <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditClassDrop(!editClassDrop)}><Text style={styles.dropdownBtnText}>{editFormData.class_grade || 'Select Class / Grade'}</Text></TouchableOpacity>
               {editClassDrop && <View style={styles.dropdownList}><ScrollView nestedScrollEnabled style={{maxHeight: 200}}>{CLASSES.map(c => <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, class_grade: c}); setEditClassDrop(false);}}><Text style={styles.dropdownItemText}>{c}</Text></TouchableOpacity>)}</ScrollView></View>}
               
               <Text style={styles.filterLabel}>School / College Name</Text><TextInput style={styles.input} value={editFormData.school_name || ''} onChangeText={t=>setEditFormData({...editFormData, school_name: t})} />
               
               <Text style={styles.filterLabel}>Institution Type</Text>
               <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditSchoolTypeDrop(!editSchoolTypeDrop)}><Text style={styles.dropdownBtnText}>{editFormData.school_type || 'Select Institution Type'}</Text></TouchableOpacity>
               {editSchoolTypeDrop && <View style={styles.dropdownList}>{(isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES).map(st => <TouchableOpacity key={st} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, school_type: st}); setEditSchoolTypeDrop(false);}}><Text style={styles.dropdownItemText}>{st}</Text></TouchableOpacity>)}</View>}
               
               <Text style={styles.filterLabel}>Institution Location</Text><TextInput style={styles.input} value={editFormData.school_location || ''} onChangeText={t=>setEditFormData({...editFormData, school_location: t})} />
               
               <Text style={styles.filterLabel}>Medium of Instruction</Text>
               <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditMediumDrop(!editMediumDrop)}><Text style={styles.dropdownBtnText}>{editFormData.medium_of_instruction || 'Select Medium'}</Text></TouchableOpacity>
               {editMediumDrop && <View style={styles.dropdownList}>{MEDIUMS.map(md => <TouchableOpacity key={md} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, medium_of_instruction: md}); setEditMediumDrop(false);}}><Text style={styles.dropdownItemText}>{md}</Text></TouchableOpacity>)}</View>}


               {isCollegeEdit && (
                 <View>
                   <Text style={styles.filterLabel}>Education Category</Text>
                   <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditEduDrop(!editEduDrop)}><Text style={styles.dropdownBtnText}>{editFormData.educational_qualification || 'Select Category'}</Text></TouchableOpacity>
                   {editEduDrop && <View style={styles.dropdownList}>{EDU_CATEGORIES.map(el => <TouchableOpacity key={el} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, educational_qualification: el}); setEditEduDrop(false);}}><Text style={styles.dropdownItemText}>{el}</Text></TouchableOpacity>)}</View>}
                   <Text style={styles.filterLabel}>Course / Major Details</Text><TextInput style={styles.input} value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} />
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
            <View style={{padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16}}>
              <Text style={styles.filterLabel}>Qualification</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setEditIslamicDrop(!editIslamicDrop)}><Text style={styles.dropdownBtnText}>{editFormData.islamic_qualification || 'Select Qualification'}</Text></TouchableOpacity>
              {editIslamicDrop && <View style={styles.dropdownList}>{ISLAMIC_QUALS.map(iq => <TouchableOpacity key={iq} style={styles.dropdownItem} onPress={() => {setEditFormData({...editFormData, islamic_qualification: iq}); setEditIslamicDrop(false);}}><Text style={styles.dropdownItemText}>{iq}</Text></TouchableOpacity>)}</View>}
              
              {editFormData.islamic_qualification === 'OTHERS' && (
                <View><Text style={styles.filterLabel}>Specify Other</Text><TextInput style={styles.input} value={editFormData.islamic_qualification || ''} onChangeText={t=>setEditFormData({...editFormData, islamic_qualification: t})} /></View>
              )}
              
              <Text style={styles.filterLabel}>Madrasa Name</Text><TextInput style={styles.input} value={editFormData.madrasa_name || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_name: t})} />
              <Text style={styles.filterLabel}>Madrasa Location</Text><TextInput style={styles.input} value={editFormData.madrasa_location || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_location: t})} />
            </View>
          )}


          <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 10}}>
             <TouchableOpacity style={styles.neatBtnDark} onPress={() => setIsEditingUser(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
             <TouchableOpacity style={styles.neatBtnSuccess} onPress={saveEditedUser}><Text style={styles.neatBtnText}>💾 Save All Details</Text></TouchableOpacity>
          </View>
        </View>
      );
    }


    return (
      <View style={styles.formCard}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
          <TouchableOpacity style={styles.neatBtnDark} onPress={() => setSelectedDetailUser(null)}><Text style={styles.neatBtnTextDark}>← Back to List</Text></TouchableOpacity>
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setShowIdCardModal(true)}><Text style={styles.neatBtnText}>🪪 ID Card</Text></TouchableOpacity>
            <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => {setEditFormData(u); setIsEditingUser(true);}}><Text style={styles.neatBtnText}>✏️ Edit Profile</Text></TouchableOpacity>
          </View>
        </View>


        <View style={{flexDirection: 'row', gap: 24, flexWrap: 'wrap'}}>
          <View style={{alignItems: 'center', marginBottom: 15}}>
             {u.profile_photo ? ( <Image source={{uri: u.profile_photo}} style={{width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: '#F8FAFC'}} /> ) : ( <View style={{width: 150, height: 150, borderRadius: 75, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center'}}><Text style={{fontSize: 50}}>👤</Text></View> )}
             <TouchableOpacity style={{marginTop: 10}} onPress={() => uploadPhotoForUser(u.official_id)}><Text style={{color: '#0056b3', fontWeight: '900'}}>Change Photo</Text></TouchableOpacity>
          </View>


          <View style={{flex: 1, minWidth: 250}}>
             <Text style={{fontSize: 28, fontWeight: '900', color: '#004085'}}>{u.full_name} {u.is_core_admin && '👑'} {isPromotedSubAdmin && '⭐'}</Text>
             <Text style={{fontSize: 16, color: '#64748B', marginBottom: 16, fontWeight: '700'}}>Official ID: <Text style={{fontWeight: '900', color: '#004085'}}>{u.official_id}</Text></Text>
             
             <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20}}>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Status: {u.membership_status}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Age: {age}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Blood: {u.blood_group || 'N/A'}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Role: {u.role}</Text></View>
             </View>


             <View style={{backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0'}}>
                <Text style={{fontWeight: '900', marginBottom: 8, color: '#004085'}}>Contact & Background</Text>
                <Text style={styles.detailTxt}>📞 Phone: {u.phone_number} / {u.whatsapp_number}</Text>
                <Text style={styles.detailTxt}>📍 Native: {u.native_place}</Text>
                <Text style={styles.detailTxt}>🏠 Address: {u.address}</Text>
                {u.role === 'MEMBER' && <Text style={styles.detailTxt}>💼 Job: {u.occupation}</Text>}
                {u.role === 'STUDENT' && <Text style={styles.detailTxt}>🎓 Class: {u.class_grade} ({u.school_name})</Text>}
                {u.islamic_studies === 'YES' && (
                  <View style={{marginTop: 12, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0'}}>
                    <Text style={{fontWeight: '800', color: '#004085', marginBottom: 4}}>Islamic Background</Text>
                    <Text style={styles.detailTxt}>Qual: {u.islamic_qualification}</Text>
                    <Text style={styles.detailTxt}>Madrasa: {u.madrasa_name} ({u.madrasa_location})</Text>
                  </View>
                )}
             </View>
          </View>
        </View>


        <View style={{marginTop: 30, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9'}}>
           <Text style={{fontWeight: '900', fontSize: 18, marginBottom: 16, color: '#004085'}}>Administrative Actions</Text>
           <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
             {hasPerm('MANAGE_FINANCE') && u.role !== 'STUDENT' && u.membership_status === 'ACTIVE' && ( <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FEF08A'}]} onPress={() => {setCashUser(u); setCashType('SUBSCRIPTION'); setCashModalVisible(true);}}><Text style={[styles.actionBtnText, {color: '#004085'}]}>💵 Log Cash</Text></TouchableOpacity> )}
             {isCore && !u.is_core_admin && (
                <>
                  <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#F87171'}]} onPress={() => setResetModalVisible(true)}><Text style={[styles.actionBtnText, {color: 'white'}]}>🔑 Reset Pass</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, {backgroundColor: u.membership_status === 'ACTIVE' ? '#FB923C' : '#10B981'}]} onPress={() => handleToggleStatus(u.official_id, u.membership_status)}><Text style={[styles.actionBtnText, {color: 'white'}]}>{u.membership_status === 'ACTIVE' ? '🚫 Deactivate' : '⚡ Activate'}</Text></TouchableOpacity>
                  {u.role === 'MEMBER' && !isPromotedSubAdmin && ( <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#0EA5E9'}]} onPress={() => {setPromoteUserId(u.official_id); setPromoteModalVisible(true);}}><Text style={[styles.actionBtnText, {color: 'white'}]}>⭐ Promote Admin</Text></TouchableOpacity> )}
                  {isPromotedSubAdmin && ( <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#EF4444'}]} onPress={() => handleDemoteAdmin(u.official_id)}><Text style={[styles.actionBtnText, {color: 'white'}]}>❌ Revoke Admin</Text></TouchableOpacity> )}
                  {u.role === 'STUDENT' && ( <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#004085'}]} onPress={() => handleConvertStudent(u.official_id)}><Text style={[styles.actionBtnText, {color: 'white'}]}>🎓 Upgrade Student</Text></TouchableOpacity> )}
                </>
             )}
           </View>
        </View>
      </View>
    );
  };


  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      {selectedDetailUser ? renderUserDetail() : (
        <>
          {activeTab === 'STATS' && (
            <View>
              <View style={styles.statGrid}>
                <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>{(directory.filter(u=>(u.role==='MEMBER'||u.role==='ADMIN') && !u.is_core_admin).length)}</Text><Text style={styles.statLargeKey}>Total Members</Text></View>
                <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>{directory.filter(u=>u.role==='STUDENT').length}</Text><Text style={styles.statLargeKey}>Total Students</Text></View>
                <View style={[styles.statBoxLarge, { backgroundColor: '#10B981' }]}><Text style={styles.statLargeVal}>{directory.filter(u=>!u.is_core_admin).length}</Text><Text style={styles.statLargeKey}>Grand Total</Text></View>
              </View>
              <View style={[styles.formCard, {marginTop: 24}]}><Text style={styles.sectionTitle}>Native Place Distribution</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.native)}</View></View>
              <View style={styles.formCard}><Text style={styles.sectionTitle}>Gender Distribution</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.gender)}</View></View>
              <View style={styles.formCard}><Text style={styles.sectionTitle}>Blood Groups</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.bloodGroups)}</View></View>
              <View style={styles.formCard}><Text style={styles.sectionTitle}>Educational Qualifications</Text><View style={styles.statWrapContainer}>{renderSplitBlocks(stats.education)}</View></View>
            </View>
          )}

          {(activeTab === 'USERS' || activeTab === 'STUDENTS') && (
            <>
              {/* Add Member / Export Action Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <TouchableOpacity style={styles.neatBtnSuccess} onPress={() => onNavigate('adminRegister', activeTab === 'STUDENTS' ? 'STUDENT' : 'MEMBER')}>
                  <Text style={styles.neatBtnText}>+ Add {activeTab === 'STUDENTS' ? 'Student' : 'Member'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.neatBtnDark} onPress={() => downloadCSV("Official ID,Role,Full Name,Phone,Gender,Blood Group,Native Place\n" + filteredDirectory.map(u => `"${u.official_id}","${u.role}","${u.full_name}","${u.phone_number}","${u.gender}","${u.blood_group}","${u.native_place}"`).join("\n"), "HIYWA_Directory.csv")}>
                  <Text style={styles.neatBtnTextDark}>📥 Export CSV</Text>
                </TouchableOpacity>
              </View>

              {/* Single-Line Filter Row */}
              <View style={[styles.formCard, { padding: 16, marginBottom: 16, zIndex: 100 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', zIndex: 100 }}>
                  <TextInput style={[styles.input, { flex: 2, minWidth: 140, marginBottom: 0, height: 42, paddingVertical: 8 }]} placeholder="Search ID or Name..." value={searchQuery} onChangeText={setSearchQuery} />
                  <FilterDropdown label="Status" value={filters.status} options={['ACTIVE', 'INACTIVE']} onSelect={(v)=>setFilters({...filters, status: v})} />
                  <FilterDropdown label="Education" value={filters.edu} options={EDU_CATEGORIES} onSelect={(v)=>setFilters({...filters, edu: v})} />
                  <FilterDropdown label="Islamic" value={filters.islamic} options={ISLAMIC_QUALS} onSelect={(v)=>setFilters({...filters, islamic: v})} />
                  <FilterDropdown label="Blood" value={filters.blood} options={BLOOD_GROUPS} onSelect={(v)=>setFilters({...filters, blood: v})} />
                  <FilterDropdown label="Native" value={filters.native} options={NATIVE_PLACES} onSelect={(v)=>setFilters({...filters, native: v})} />
                  <TouchableOpacity style={[styles.neatBtnDark, { height: 42, paddingHorizontal: 12 }]} onPress={() => {setFilters({ blood:'', edu:'', gender:'', native:'', marital:'', status: '', islamic: '' }); setSearchQuery('');}}>
                      <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13 }}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? <ActivityIndicator size="large" /> : filteredDirectory.map((item) => (
                 <TouchableOpacity key={item.official_id} style={styles.adminCard} onPress={() => setSelectedDetailUser(item)}>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {item.profile_photo ? <Image source={{uri: item.profile_photo}} style={{width: 50, height: 50, borderRadius: 12, marginRight: 15}} /> : <View style={{width: 50, height: 50, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15}}><Text style={{fontSize: 20}}>👤</Text></View>}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adminCardTitle}>{item.full_name} {item.role === 'STUDENT' ? '🎓' : ''}</Text>
                        <Text style={styles.adminCardMeta}>ID: {item.official_id}  |  📞 {item.phone_number}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: item.membership_status === 'ACTIVE' ? '#10B981' : '#F87171' }]}><Text style={styles.badgeText}>{item.membership_status}</Text></View>
                   </View>
                 </TouchableOpacity>
              ))}
            </>
          )}

          {activeTab === 'FINANCE' && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>Finance Hub</Text>
                <TouchableOpacity style={styles.neatBtnDark} onPress={() => downloadCSV("Date,Txn ID,Member Name,Type,Amount,Method,Reason\n" + filteredTxns.map(t => `"${new Date(t.transaction_date).toLocaleDateString()}","${t.transaction_id}","${t.full_name}","${t.donation_type}","${t.amount}","${t.payment_method}","${t.reason}"`).join("\n"), "HIYWA_Finance.csv")}><Text style={styles.neatBtnTextDark}>📥 Export Ledger</Text></TouchableOpacity>
              </View>

              <View style={styles.statGrid}>
                <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>₹{totalFinSubs}</Text><Text style={styles.statLargeKey}>Total Subs.</Text></View>
                <View style={[styles.statBoxLarge, {backgroundColor: '#0056b3'}]}><Text style={styles.statLargeVal}>₹{totalFinGen}</Text><Text style={styles.statLargeKey}>Total General</Text></View>
                <View style={[styles.statBoxLarge, {backgroundColor: '#8B5CF6'}]}><Text style={styles.statLargeVal}>₹{totalFinCamp}</Text><Text style={styles.statLargeKey}>Total Campaign</Text></View>
              </View>

              {/* NEW Single-Line Filter Row for Finance */}
              <View style={[styles.formCard, { padding: 16, marginBottom: 16, marginTop: 24, zIndex: 100 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', zIndex: 100 }}>
                  <TextInput style={[styles.input, { flex: 2, minWidth: 140, marginBottom: 0, height: 42, paddingVertical: 8 }]} placeholder="Search Name, ID or Reason..." value={finSearchQuery} onChangeText={setFinSearchQuery} />
                  <FilterDropdown label="Type" value={finTypeFilter} options={['SUBSCRIPTION', 'GENERAL', 'FUND_RAISING']} onSelect={(v)=>setFinTypeFilter(v)} />
                  
                  {/* Compact Dates */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    {Platform.OS === 'web' ? <input type="date" style={{...webDateStyle, marginBottom: 0, height: 42, padding: 8, width: 130, fontSize: 12}} value={finStartDate} onChange={e => setFinStartDate(e.target.value)} /> : <TextInput style={[styles.input, {marginBottom: 0, height: 42, width: 100, fontSize: 12}]} placeholder="Start Date" value={finStartDate} onChangeText={setFinStartDate} />}
                    <Text style={{color: '#64748B'}}>-</Text>
                    {Platform.OS === 'web' ? <input type="date" style={{...webDateStyle, marginBottom: 0, height: 42, padding: 8, width: 130, fontSize: 12}} value={finEndDate} onChange={e => setFinEndDate(e.target.value)} /> : <TextInput style={[styles.input, {marginBottom: 0, height: 42, width: 100, fontSize: 12}]} placeholder="End Date" value={finEndDate} onChangeText={setFinEndDate} />}
                  </View>

                  <TouchableOpacity style={[styles.neatBtnDark, { height: 42, paddingHorizontal: 12 }]} onPress={() => {setFinStartDate(''); setFinEndDate(''); setFinTypeFilter(''); setFinSearchQuery('');}}>
                      <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13 }}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.tabContainer, {marginTop: 0}]}>
                <TouchableOpacity style={[styles.tabBtn, financeTab === 'LEDGER' && styles.tabBtnActive]} onPress={() => setFinanceTab('LEDGER')}><Text style={[styles.tabBtnText, financeTab === 'LEDGER' && styles.tabBtnTextActive]}>Income Transactions</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, financeTab === 'DUES' && styles.tabBtnActive]} onPress={() => setFinanceTab('DUES')}><Text style={[styles.tabBtnText, financeTab === 'DUES' && styles.tabBtnTextActive]}>Pending Dues</Text></TouchableOpacity>
              </View>

              {financeTab === 'LEDGER' && (
                <View style={styles.formCard}>
                  {loading ? <ActivityIndicator /> : filteredTxns.map((txn, index) => (
                    <View key={txn.transaction_id || index} style={styles.historyRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={{ fontWeight: '800', color: '#004085', fontSize: 16 }}>{txn.full_name}</Text>
                        <Text style={styles.historyDetails}>{txn.donation_type === 'FUND_RAISING' ? 'CAMPAIGN' : txn.donation_type}: {txn.reason}</Text>
                        <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleDateString()} | {txn.payment_method}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981', marginBottom: 8 }}>+ ₹{txn.amount}</Text>
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
                      <View><Text style={{ fontWeight: '800', color: '#EF4444', fontSize: 16 }}>{u.full_name} ({u.official_id})</Text><Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '600' }}>📞 {u.phone_number}</Text></View>
                      <View style={{alignItems: 'flex-end'}}><Text style={{ fontSize: 18, fontWeight: '800', color: '#EF4444' }}>Owes ₹{u.duesAmount}</Text><Text style={{ fontSize: 13, color: '#64748B', fontWeight: '700', marginTop: 4 }}>{u.duesMonths} Months</Text></View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === 'EXPENSE' && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={styles.sectionTitle}>Trust Expenses</Text>
                <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setExpenseModalVisible(true)}><Text style={styles.neatBtnText}>+ Log Expense</Text></TouchableOpacity>
              </View>

              <View style={styles.statGrid}>
                <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>₹{currentBalance.toLocaleString()}</Text><Text style={styles.statLargeKey}>Current Balance</Text></View>
                <View style={[styles.statBoxLarge, {backgroundColor: '#10B981'}]}><Text style={styles.statLargeVal}>₹{(totalIncomeVal + Number(initialAmount)).toLocaleString()}</Text><Text style={styles.statLargeKey}>Total Trust Funds</Text></View>
                <View style={[styles.statBoxLarge, {backgroundColor: '#EF4444'}]}><Text style={styles.statLargeVal}>₹{totalExpenseVal.toLocaleString()}</Text><Text style={styles.statLargeKey}>Total Expensed</Text></View>
              </View>

              <View style={[styles.formCard, {marginTop: 24}]}>
                <Text style={styles.sectionTitle}>Expense Ledger</Text>
                {loading ? <ActivityIndicator /> : allExpenses.sort((a,b)=> new Date(b.transaction_date)-new Date(a.transaction_date)).map((txn, index) => (
                  <View key={txn.transaction_id || index} style={styles.historyRow}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontWeight: '800', color: '#004085', fontSize: 16 }}>{txn.reason}</Text>
                      <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleDateString()} | Logged by: {txn.full_name}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#EF4444', marginBottom: 8 }}>- ₹{txn.amount}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'SETTINGS' && (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>System Settings</Text>
              
              <Text style={styles.label}>1. Monthly Subscription Amount (₹)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={subAmount} onChangeText={setSubAmount} />
              
              <Text style={styles.label}>2. Primary Trust Bank Account / UPI Details</Text>
              <TextInput style={styles.input} autoCapitalize="characters" placeholder="E.g., Bank Acct # or hiway@sbi" value={primaryUpi} onChangeText={setPrimaryUpi} />
              
              <Text style={styles.label}>3. Secondary Trust Bank Account / UPI</Text>
              <TextInput style={styles.input} autoCapitalize="characters" placeholder="Optional secondary account" value={secondaryUpi} onChangeText={setSecondaryUpi} />
              
              <Text style={styles.label}>4. Initial Trust Amount Balance (₹)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={initialAmount} onChangeText={setInitialAmount} />
              
              <TouchableOpacity style={[styles.button, { alignSelf: 'flex-start', marginTop: 20 }]} onPress={async () => {
                setIsSubmitting(true);
                try { 
                  await setDoc(doc(db, 'settings', 'global'), { monthly_subscription_amount: subAmount, primary_upi: primaryUpi, secondary_upi: secondaryUpi, initial_amount: initialAmount }, { merge: true }); 
                  alert('Settings Saved Successfully!'); fetchData(); 
                } catch(e){ alert('Failed to save settings'); } finally {setIsSubmitting(false);}
              }}>
                {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save Settings</Text>}
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'CAMPAIGNS' && (
            <View>
              {viewCampDonors ? (
                <View style={styles.formCard}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setViewCampDonors(null)}><Text style={styles.neatBtnTextDark}>← Back</Text></TouchableOpacity><Text style={[styles.sectionTitle, {flex: 1, textAlign: 'right', marginBottom: 0}]} numberOfLines={1}>{viewCampDonors.title} Donors</Text></View>
                  {globalTxns.filter(t => t.campaign_id === viewCampDonors.campaign_id).map((txn, idx) => (
                     <View key={idx} style={styles.historyRow}>
                       <View style={{ flex: 1, paddingRight: 10 }}><Text style={{ fontWeight: '800', color: '#004085', fontSize: 16 }}>{txn.full_name}</Text><Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleDateString()} | {txn.payment_method}</Text></View>
                       <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981', marginBottom: 8 }}>+ ₹{txn.amount}</Text><TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity></View>
                     </View>
                  ))}
                </View>
              ) : (
                <View>
                  <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16}}><TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setShowCampaignModal(true)}><Text style={styles.neatBtnText}>+ Launch Drive</Text></TouchableOpacity></View>
                  <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Live Drives</Text>
                    {loading ? <ActivityIndicator /> : campaigns.filter(c => c.status === 'ACTIVE').map(camp => {
                      const raised = parseFloat(camp.raised_amount) || 0; const target = parseFloat(camp.target_amount) || 1; const progress = Math.min(Math.round((raised / target) * 100), 100);
                      return (
                        <View key={camp.campaign_id} style={styles.adminCard}>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}><Text style={[styles.adminCardTitle, { flex: 1, marginRight: 10 }]} numberOfLines={1}>{camp.title}</Text><View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}><Text style={styles.badgeText}>ACTIVE</Text></View></View>
                          <Text style={{ color: '#64748B', marginBottom: 16, fontWeight: '500', lineHeight: 20 }} numberOfLines={2}>{camp.description}</Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Text style={{ fontWeight: '800', color: '#004085' }}>Raised: {'\u20B9'}{raised}</Text><Text style={{ color: '#94A3B8', fontWeight: '700' }}>Target: {'\u20B9'}{target}</Text></View>
                          <View style={{ height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}><View style={{ width: `${progress}%`, backgroundColor: '#10B981', height: '100%' }} /></View>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setViewCampDonors(camp)}><Text style={styles.neatBtnTextDark}>👥 View Donors</Text></TouchableOpacity><Text style={{ textAlign: 'right', fontSize: 13, fontWeight: '800', color: '#10B981' }}>{progress}% Funded</Text></View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* ADMIN MODALS */}
      {expenseModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#EF4444', marginBottom: 24, letterSpacing: -0.5 }}>Log Trust Expense</Text>
            <Text style={styles.label}>Detailed Reason / Vendor</Text>
            <TextInput style={styles.input} autoCapitalize="characters" placeholder="E.g., MEETING SNACKS" value={expenseReason} onChangeText={setExpenseReason} />
            <Text style={styles.label}>Expense Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={expenseAmount} onChangeText={setExpenseAmount} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
               <TouchableOpacity style={styles.neatBtnDark} onPress={() => setExpenseModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.neatBtnPrimary, {backgroundColor: '#EF4444'}]} onPress={submitExpenseLog}><Text style={styles.neatBtnText}>Log Expense</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {cashModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#004085', marginBottom: 8, letterSpacing: -0.5 }}>Log Cash Receipt</Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 24, fontWeight: '600' }}>For: {cashUser?.full_name}</Text>
            <View style={styles.quickSelectContainer}>
              <TouchableOpacity style={[styles.quickBtn, cashType === 'SUBSCRIPTION' && styles.quickBtnActive]} onPress={()=>setCashType('SUBSCRIPTION')}><Text style={[styles.quickBtnText, cashType === 'SUBSCRIPTION' && styles.quickBtnTextActive]}>Subs</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.quickBtn, cashType === 'GENERAL' && styles.quickBtnActive]} onPress={()=>setCashType('GENERAL')}><Text style={[styles.quickBtnText, cashType === 'GENERAL' && styles.quickBtnTextActive]}>Gen</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.quickBtn, cashType === 'CAMPAIGN' && styles.quickBtnActive]} onPress={()=>setCashType('CAMPAIGN')}><Text style={[styles.quickBtnText, cashType === 'CAMPAIGN' && styles.quickBtnTextActive]}>Camp</Text></TouchableOpacity>
            </View>
            {cashType === 'SUBSCRIPTION' && ( <View><Text style={styles.label}>Number of Months</Text><TextInput style={styles.input} keyboardType="numeric" value={cashMonths} onChangeText={t => {setCashMonths(t); setCashAmount(String(Number(t || 0) * Number(subAmount || 0)));}} /></View> )}
            {cashType === 'GENERAL' && ( <View><Text style={styles.label}>Reason / Category</Text><TextInput style={styles.input} autoCapitalize="characters" value={cashReason} onChangeText={t => setCashReason(t.toUpperCase())} /></View> )}
            {cashType === 'CAMPAIGN' && (
              <View><Text style={styles.label}>Select Active Campaign</Text>
                <ScrollView style={{maxHeight: 150, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12}}>
                  {campaigns.filter(c => c.status === 'ACTIVE').map(c => ( <TouchableOpacity key={c.campaign_id} style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: cashCampId === c.campaign_id ? '#EFF6FF' : 'white'}} onPress={() => setCashCampId(c.campaign_id)}><Text style={{color: '#004085', fontWeight: cashCampId === c.campaign_id ? '800' : '600'}}>{c.title}</Text></TouchableOpacity> ))}
                </ScrollView>
              </View>
            )}
            <Text style={styles.label}>Amount Collected (₹) *</Text><TextInput style={styles.input} keyboardType="numeric" value={cashAmount} onChangeText={setCashAmount} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setCashModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.neatBtnSuccess} onPress={submitCashPayment}><Text style={styles.neatBtnText}>Generate Receipt</Text></TouchableOpacity></View>
          </View>
        </View>
      )}

      {promoteModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#004085', marginBottom: 24, letterSpacing: -0.5 }}>Assign Admin Rights</Text>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, MANAGE_USERS: !selectedPerms.MANAGE_USERS})}><View style={[styles.checkbox, selectedPerms.MANAGE_USERS && styles.checkboxActive]}>{selectedPerms.MANAGE_USERS && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Manage Directory</Text></TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, MANAGE_FINANCE: !selectedPerms.MANAGE_FINANCE})}><View style={[styles.checkbox, selectedPerms.MANAGE_FINANCE && styles.checkboxActive]}>{selectedPerms.MANAGE_FINANCE && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Manage Finances</Text></TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, MANAGE_CAMPAIGNS: !selectedPerms.MANAGE_CAMPAIGNS})}><View style={[styles.checkbox, selectedPerms.MANAGE_CAMPAIGNS && styles.checkboxActive]}>{selectedPerms.MANAGE_CAMPAIGNS && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Manage Campaigns</Text></TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 32, gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setPromoteModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.neatBtnPrimary} onPress={submitPromotion}><Text style={styles.neatBtnText}>Confirm Promotion</Text></TouchableOpacity></View>
          </View>
        </View>
      )}

      {resetModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
             <Text style={{ fontSize: 24, fontWeight: '800', color: '#004085', marginBottom: 16, letterSpacing: -0.5 }}>Reset Password</Text>
             <Text style={{ fontSize: 15, color: '#475569', marginBottom: 32, lineHeight: 24, fontWeight: '500' }}>Reset <Text style={{fontWeight: '800', color: '#004085'}}>{selectedDetailUser?.full_name}</Text>'s password to default (<Text style={{fontWeight: '800'}}>Hiywa@123</Text>)?</Text>
             <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setResetModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.neatBtnPrimary, {backgroundColor: '#EF4444'}]} onPress={resetUserPasswordAdmin}><Text style={styles.neatBtnText}>Confirm Reset</Text></TouchableOpacity></View>
          </View>
        </View>
      )}

      {showCampaignModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#004085', marginBottom: 24, letterSpacing: -0.5 }}>Launch Fundraiser</Text>
            <Text style={styles.label}>Campaign Title</Text><TextInput style={styles.input} value={campTitle} onChangeText={setCampTitle} />
            <Text style={styles.label}>Description</Text><TextInput style={styles.input} value={campDesc} onChangeText={setCampDesc} />
            <Text style={styles.label}>Target Amount (₹)</Text><TextInput style={styles.input} keyboardType="numeric" value={campTarget} onChangeText={setCampTarget} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setShowCampaignModal(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.neatBtnSuccess} onPress={handleCreateCampaign}><Text style={styles.neatBtnText}>Publish Drive</Text></TouchableOpacity></View>
          </View>
        </View>
      )}
    </ScrollView>
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


  const handleDateChange = (event, selectedDate) => { setShowDatePicker(false); if (selectedDate) { setDobDate(selectedDate); const day = String(selectedDate.getDate()).padStart(2, '0'); const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); const year = selectedDate.getFullYear(); setFormData({...formData, dob: `${year}-${month}-${day}`}); setAge((new Date().getFullYear() - year).toString()); } };
  const handleWebDateChange = (e) => { const val = e.target.value; setFormData({...formData, dob: val}); if(val) setAge((new Date().getFullYear() - new Date(val).getFullYear()).toString()); };
  const handleSameMobileToggle = () => { setSameAsMobile(!sameAsMobile); if (!sameAsMobile) setFormData({ ...formData, whatsapp_number: formData.phone_number }); else setFormData({ ...formData, whatsapp_number: '' }); };


  const pickImage = () => {
    Alert.alert("Upload Photo", "Choose an option", [
      { text: "Take Photo (Camera)", onPress: async () => { const permissionResult = await ImagePicker.requestCameraPermissionsAsync(); if (permissionResult.granted === false) return alert("Camera permission is required!"); let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true }); if (!result.canceled) setFormData({...formData, profile_photo: `data:image/jpeg;base64,${result.assets[0].base64}`}); } },
      { text: "Choose from Gallery", onPress: async () => { let result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true }); if (!result.canceled) setFormData({...formData, profile_photo: `data:image/jpeg;base64,${result.assets[0].base64}`}); } },
      { text: "Cancel", style: "cancel" }
    ]);
  };


  const handleRegister = async () => {
    if (!formData.full_name || !formData.father_name || !formData.mother_name || !formData.parents_status || !formData.gender || !formData.dob || !formData.aadhaar_number) return alert('Please fill all mandatory (*) fields in Step 1.');
    if (formData.aadhaar_number.length !== 12) return alert('Aadhaar must be exactly 12 digits.');
    if (role === 'MEMBER' && !formData.phone_number) return alert('Primary mobile number is required.');
    if (role === 'STUDENT' && !formData.phone_number) return alert('Parent mobile number is required.');
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
    } catch(e) { alert("Failed to generate PDF"); }
  };


  // 1. SUCCESS SCREEN
  if (registeredUser) {
    const displayAge = registeredUser.dob ? (new Date().getFullYear() - new Date(registeredUser.dob).getFullYear()) : 'N/A';
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
         <View style={styles.idCardContainer}>
             <View style={{zIndex: 1}}>
                 <View style={styles.idCardHeader}>
                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 22, textAlign: 'center', letterSpacing: 1, marginBottom: 2}}>HIYWA</Text>
                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 11, textAlign: 'center'}}>Hidhayathul Islam Youth Welfare Trust</Text>
                 </View>
                 <View style={{padding: 20, alignItems: 'center'}}>
                    {registeredUser.profile_photo ? <Image source={{uri: registeredUser.profile_photo}} style={styles.idCardPhoto} /> : <View style={[styles.idCardPhoto, {backgroundColor: '#ccc', justifyContent:'center', alignItems:'center'}]}><Text style={{fontSize:40}}>👤</Text></View>}
                    <Text style={{fontSize: 22, fontWeight: '900', color: '#004085', marginTop: 10}}>{registeredUser.full_name}</Text>
                    <Text style={{fontSize: 16, color: '#64748B', fontWeight: '800', marginTop: 5}}>ID: {registeredUser.official_id}</Text>
                    <View style={{marginTop: 15, width: '100%', alignItems: 'flex-start'}}>
                       <Text style={{fontSize: 13, color: '#475569', marginBottom: 6}}><b>Role:</b> {registeredUser.role}</Text>
                       <Text style={{fontSize: 13, color: '#475569', marginBottom: 6}}><b>Age / Blood:</b> {displayAge} / {registeredUser.blood_group || 'N/A'}</Text>
                       <Text style={{fontSize: 13, color: '#475569', marginBottom: 6}}><b>Phone:</b> {registeredUser.phone_number}</Text>
                    </View>
                 </View>
             </View>
          </View>
         <Text style={{textAlign: 'center', color: '#EF4444', marginVertical: 24, fontWeight: '800'}}>
           {isAdminAuth ? `Default Password Set: ${registeredUser.password}\nUser will be forced to change this on their first login.` : 'Please log in with the password you created.'}
         </Text>
         <TouchableOpacity style={[styles.button, {width: 250, marginBottom: 12, backgroundColor: '#10B981'}]} onPress={handleShareCredentials}><Text style={styles.buttonText}>🔗 Download / Share</Text></TouchableOpacity>
         <TouchableOpacity style={[styles.button, {width: 250, backgroundColor: '#004085'}]} onPress={onBack}><Text style={styles.buttonText}>Return</Text></TouchableOpacity>
      </View>
    );
  }


  // 2. SELECTION SCREEN
  if (!role) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.contentHeader}>
          <View style={{ flex: 1 }}><Text style={styles.contentTitle}>Select Registration Type</Text></View>
          <TouchableOpacity onPress={onBack} style={styles.neatBtnPrimary}>
             <Text style={styles.neatBtnText}>← Cancel & Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            
            <TouchableOpacity style={[styles.bentoBox, { alignItems: 'center', minWidth: 260, flex: 0, paddingVertical: 40, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }]} onPress={() => setRole('MEMBER')}>
              <Text style={{ fontSize: 56, marginBottom: 16 }}>🧑‍💼</Text>
              <Text style={[styles.bentoTitle, { fontSize: 24 }]}>HIYWA Member</Text>
              <Text style={[styles.bentoDesc, { textAlign: 'center', marginTop: 8 }]}>Standard member registration for the Trust.</Text>
              <View style={[styles.button, { width: '100%', marginTop: 32 }]}><Text style={styles.buttonText}>Select Member</Text></View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.bentoBox, { alignItems: 'center', minWidth: 260, flex: 0, paddingVertical: 40, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }]} onPress={() => setRole('STUDENT')}>
              <Text style={{ fontSize: 56, marginBottom: 16 }}>🎓</Text>
              <Text style={[styles.bentoTitle, { fontSize: 24 }]}>Student</Text>
              <Text style={[styles.bentoDesc, { textAlign: 'center', marginTop: 8 }]}>Registration for pursuing or completed students.</Text>
              <View style={[styles.button, { width: '100%', marginTop: 32, backgroundColor: '#10B981' }]}><Text style={styles.buttonText}>Select Student</Text></View>
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
          <View style={[styles.modalCard, {alignItems: 'center'}]}>
            <ActivityIndicator size="large" color="#004085" style={{ transform: [{ scale: 1.5 }], marginBottom: 24 }} />
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#004085', marginBottom: 8 }}>Processing...</Text>
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


      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={styles.wizardProgress}>
          <Text style={{fontWeight: '900', color: step === 1 ? '#004085' : '#CBD5E1', fontSize: 16}}>1. Personal</Text>
          <Text style={{fontWeight: '900', color: step === 2 ? '#004085' : '#CBD5E1', fontSize: 16}}>2. Education</Text>
          <Text style={{fontWeight: '900', color: step === 3 ? '#004085' : '#CBD5E1', fontSize: 16}}>3. Contact</Text>
        </View>
        
        <View style={styles.formCard}>
          {step === 1 && (
            <>
              <TouchableOpacity onPress={pickImage} style={{alignItems: 'center', marginBottom: 24}}>
                {formData.profile_photo ? <Image source={{uri: formData.profile_photo}} style={{width: 100, height: 100, borderRadius: 50}} /> : <View style={{width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center'}}><Text>📷 Upload Photo</Text></View>}
              </TouchableOpacity>
              <Text style={styles.label}>Full Name *</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.full_name} onChangeText={(t) => setFormData({...formData, full_name: t})} />
              <Text style={styles.label}>Father's / Guardian's Name *</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.father_name} onChangeText={(t) => setFormData({...formData, father_name: t})} />
              <Text style={styles.label}>Mother's Name *</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.mother_name} onChangeText={(t) => setFormData({...formData, mother_name: t})} />
              <Text style={styles.label}>Parents Status *</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowParentsDrop(!showParentsDrop)}><Text style={styles.dropdownBtnText}>{formData.parents_status || 'SELECT STATUS'}</Text></TouchableOpacity>
              {showParentsDrop && ( <View style={styles.dropdownList}>{['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED'].map((s) => ( <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => { setFormData({...formData, parents_status: s}); setShowParentsDrop(false); }}><Text style={styles.dropdownItemText}>{s}</Text></TouchableOpacity> ))}</View> )}
              <Text style={styles.label}>Gender *</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowGenderDropdown(!showGenderDropdown)}><Text style={styles.dropdownBtnText}>{formData.gender || 'SELECT GENDER'}</Text></TouchableOpacity>
              {showGenderDropdown && <View style={styles.dropdownList}>{GENDERS.map((g) => (<TouchableOpacity key={g} style={styles.dropdownItem} onPress={() => { setFormData({...formData, gender: g}); setShowGenderDropdown(false); }}><Text style={styles.dropdownItemText}>{g}</Text></TouchableOpacity>))}</View>}
              <Text style={styles.label}>Date of Birth *</Text>
              {Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formData.dob} onChange={handleWebDateChange} /> : <View><TouchableOpacity onPress={() => setShowDatePicker(true)}><View style={{ pointerEvents: 'none' }}><TextInput style={styles.input} placeholder="YYYY-MM-DD" value={formData.dob} editable={false} /></View></TouchableOpacity>{showDatePicker && <DateTimePicker value={dobDate} mode="date" display="default" onChange={handleDateChange} />}</View>}
              <Text style={styles.label}>Calculated Age</Text><TextInput style={[styles.input, { backgroundColor: '#F1F5F9', color: '#94A3B8' }]} value={age} editable={false} placeholder="Select DOB first" />
              <Text style={styles.label}>Blood Group</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowBloodDropdown(!showBloodDropdown)}><Text style={styles.dropdownBtnText}>{formData.blood_group || 'SELECT BLOOD GROUP'}</Text></TouchableOpacity>
              {showBloodDropdown && <View style={styles.dropdownList}>{BLOOD_GROUPS.map((bg) => (<TouchableOpacity key={bg} style={styles.dropdownItem} onPress={() => { setFormData({...formData, blood_group: bg}); setShowBloodDropdown(false); }}><Text style={styles.dropdownItemText}>{bg}</Text></TouchableOpacity>))}</View>}
              {role === 'MEMBER' && ( <> <Text style={styles.label}>Marital Status</Text><TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowMaritalDropdown(!showMaritalDropdown)}><Text style={styles.dropdownBtnText}>{formData.marital_status || 'SELECT STATUS'}</Text></TouchableOpacity> {showMaritalDropdown && <View style={styles.dropdownList}>{MARITAL_STATUS.map((ms) => (<TouchableOpacity key={ms} style={styles.dropdownItem} onPress={() => { setFormData({...formData, marital_status: ms}); setShowMaritalDropdown(false); }}><Text style={styles.dropdownItemText}>{ms}</Text></TouchableOpacity>))}</View>} </> )}
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
                  <Text style={styles.label}>Course / Major Specialization</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.course_details} onChangeText={(t) => setFormData({...formData, course_details: t})} />
                  <Text style={styles.label}>Occupation / Job Title</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.occupation} onChangeText={(t) => setFormData({...formData, occupation: t})} />
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
                      <Text style={styles.label}>Course / Major Details</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.course_details} onChangeText={(t) => setFormData({...formData, course_details: t})} />
                    </>
                  )}
                  <Text style={styles.label}>Institution Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.school_name} onChangeText={(t) => setFormData({...formData, school_name: t})} />
                  <Text style={styles.label}>{isCollegeEdit ? 'College Type' : 'School Type'}</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowSchoolTypeDropdown(!showSchoolTypeDropdown)}><Text style={styles.dropdownBtnText}>{formData.school_type || 'SELECT TYPE'}</Text></TouchableOpacity>
                  {showSchoolTypeDropdown && <View style={styles.dropdownList}>{(isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES).map((st) => (<TouchableOpacity key={st} style={styles.dropdownItem} onPress={() => { setFormData({...formData, school_type: st}); setShowSchoolTypeDropdown(false); }}><Text style={styles.dropdownItemText}>{st}</Text></TouchableOpacity>))}</View>}
                  <Text style={styles.label}>Institution Location / Village</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.school_location} onChangeText={(t) => setFormData({...formData, school_location: t})} />
                  <Text style={styles.label}>Medium of Instruction</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowMediumDropdown(!showMediumDropdown)}><Text style={styles.dropdownBtnText}>{formData.medium_of_instruction || 'SELECT MEDIUM'}</Text></TouchableOpacity>
                  {showMediumDropdown && <View style={styles.dropdownList}>{MEDIUMS.map((md) => (<TouchableOpacity key={md} style={styles.dropdownItem} onPress={() => { setFormData({...formData, medium_of_instruction: md}); setShowMediumDropdown(false); }}><Text style={styles.dropdownItemText}>{md}</Text></TouchableOpacity>))}</View>}
                </>
              )}
              <Text style={styles.label}>{role === 'MEMBER' ? 'Completed Islamic Studies?' : 'Pursuing Islamic Studies?'}</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 24}}>
                <TouchableOpacity style={[styles.filterChip, formData.islamic_studies==='YES' && styles.filterChipActive]} onPress={()=>setFormData({...formData, islamic_studies: 'YES'})}><Text style={[styles.filterChipText, formData.islamic_studies==='YES' && {color:'white'}]}>Yes</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.filterChip, formData.islamic_studies==='NO' && styles.filterChipActive]} onPress={()=>setFormData({...formData, islamic_studies: 'NO'})}><Text style={[styles.filterChipText, formData.islamic_studies==='NO' && {color:'white'}]}>No</Text></TouchableOpacity>
              </View>
              {formData.islamic_studies === 'YES' && (
                <View style={{padding: 24, backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0'}}>
                  <Text style={styles.label}>Islamic Qualification</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowIslamicDrop(!showIslamicDrop)}><Text style={styles.dropdownBtnText}>{formData.islamic_qualification || 'SELECT QUALIFICATION'}</Text></TouchableOpacity>
                  {showIslamicDrop && <View style={styles.dropdownList}>{ISLAMIC_QUALS.map((iq) => (<TouchableOpacity key={iq} style={styles.dropdownItem} onPress={() => { setFormData({...formData, islamic_qualification: iq}); setShowIslamicDrop(false); }}><Text style={styles.dropdownItemText}>{iq}</Text></TouchableOpacity>))}</View>}
                  {formData.islamic_qualification === 'OTHERS' && ( <> <Text style={styles.label}>Specify Qualification</Text><TextInput style={styles.input} autoCapitalize="characters" value={customIslamic} onChangeText={t => setCustomIslamic(t)} /> </> )}
                  <Text style={styles.label}>Madrasa Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.madrasa_name} onChangeText={t => setFormData({...formData, madrasa_name: t})} />
                  <Text style={styles.label}>Madrasa Location</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.madrasa_location} onChangeText={t => setFormData({...formData, madrasa_location: t})} />
                </View>
              )}
            </>
          )}


          {step === 3 && (
            <>
              {role === 'STUDENT' && ( <> <Text style={styles.label}>Student Mobile Number</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={formData.student_mobile} onChangeText={(t) => setFormData({...formData, student_mobile: t})} /> </> )}
              <Text style={styles.label}>{role === 'MEMBER' ? 'Primary Mobile Number *' : "Parent's Mobile Number *"}</Text>
              <TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={formData.phone_number} onChangeText={(t) => { setFormData({...formData, phone_number: t}); if(sameAsMobile) setFormData({...formData, phone_number: t, whatsapp_number: t}); }} />
              {role === 'MEMBER' && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.label}>WhatsApp Number</Text>
                    <TouchableOpacity onPress={handleSameMobileToggle} style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#004085', marginRight: 8, backgroundColor: sameAsMobile ? '#004085' : 'white', borderRadius: 4 }} /><Text style={{ fontSize: 13, color: '#64748B', fontWeight: '800' }}>Same as Mobile</Text></TouchableOpacity>
                  </View>
                  <TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={formData.whatsapp_number} editable={!sameAsMobile} onChangeText={(t) => setFormData({...formData, whatsapp_number: t})} />
                </>
              )}
              <Text style={styles.label}>Native Place</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowNativeDropdown(!showNativeDropdown)}><Text style={styles.dropdownBtnText}>{formData.native_place || 'SELECT NATIVE PLACE'}</Text></TouchableOpacity>
              {showNativeDropdown && <View style={styles.dropdownList}>{NATIVE_PLACES.map((place) => (<TouchableOpacity key={place} style={styles.dropdownItem} onPress={() => { setFormData({...formData, native_place: place}); setShowNativeDropdown(false); }}><Text style={styles.dropdownItemText}>{place}</Text></TouchableOpacity>))}</View>}
              {formData.native_place === 'OTHERS' && ( <View style={{ marginTop: 12 }}><Text style={styles.label}>Specify Native Place</Text><TextInput style={styles.input} autoCapitalize="characters" value={customNative} onChangeText={(t) => setCustomNative(t)} /></View> )}
              <Text style={styles.label}>Current Location (City/Town)</Text><TextInput style={styles.input} autoCapitalize="characters" value={formData.current_location} onChangeText={(t) => setFormData({...formData, current_location: t})} />
              <Text style={styles.label}>Full Permanent Address</Text><TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline={true} autoCapitalize="characters" value={formData.address} onChangeText={(t) => setFormData({...formData, address: t})} />
              <Text style={styles.label}>Email Address</Text><TextInput style={styles.input} autoCapitalize="characters" keyboardType="email-address" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} />
              {!isAdminAuth && ( <> <Text style={styles.label}>Create Portal Password *</Text><TextInput style={styles.input} secureTextEntry={true} value={formData.password} onChangeText={(t) => setFormData({...formData, password: t})} /> </> )}
            </>
          )}
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12}}>
            {step > 1 ? ( <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0'}]} onPress={() => setStep(step-1)}><Text style={[styles.buttonText, {color: '#004085'}]}>Previous</Text></TouchableOpacity> ) : <View style={{flex: 1}} />}
            {step < 3 ? ( <TouchableOpacity style={[styles.button, {flex: 1}]} onPress={() => setStep(step+1)}><Text style={styles.buttonText}>Next Step</Text></TouchableOpacity> ) : (
              <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center'}]} onPress={handleRegister} disabled={isSubmitting}>
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


// --- DONATION PORTAL ---
function DonationPortal({ currentUser, onViewReceipt }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleUPIPayment = async () => {
    if (!amount || !reason.trim()) return alert('Please enter both Amount and Reason');
    setIsSubmitting(true);
    const txnId = `UPI_${Date.now()}`;
    const payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: currentUser.official_id, full_name: currentUser.full_name, amount: amount, payment_method: 'UPI', donation_type: 'GENERAL', reason: reason, months_count: 0 };
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      alert('Donation successful!'); onViewReceipt({ ...payload, official_id: currentUser.official_id });
    } catch (error) { alert('Database Error'); } finally { setIsSubmitting(false); }
  };


  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Make a Donation</Text>
        <Text style={styles.label}>Reason / Purpose</Text><TextInput style={styles.input} placeholder="E.G. FOOD DISTRIBUTION" autoCapitalize="characters" value={reason} onChangeText={(t) => setReason(t)} />
        <Text style={styles.label}>Donation Amount (₹)</Text><TextInput style={styles.input} placeholder="E.G. 1000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Donate Securely</Text>}</TouchableOpacity>
      </View>
    </ScrollView>
  );
}


// --- SUBSCRIPTION SCREEN ---
function SubscriptionScreen({ currentUser, setCurrentUser, onViewReceipt }) {
  const [monthsCount, setMonthsCount] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyRate, setMonthlyRate] = useState(0);


  useEffect(() => { const getRate = async () => { try { const sDoc = await getDoc(doc(db, 'settings', 'global')); if(sDoc.exists()) setMonthlyRate(sDoc.data().monthly_subscription_amount || 0); } catch(e){} }; getRate(); }, []);


  const totalAmount = monthlyRate * (parseInt(monthsCount) || 1);


  const handleUPIPayment = async () => {
    setIsSubmitting(true);
    const txnId = `UPI_${Date.now()}`;
    const parsedMonths = parseInt(monthsCount) || 1;
    const payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: currentUser.official_id, full_name: currentUser.full_name, amount: totalAmount, payment_method: 'UPI', donation_type: 'SUBSCRIPTION', reason: 'MONTHLY SUBSCRIPTION', months_count: parsedMonths };
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      const newTotalPaid = (parseInt(currentUser.total_months_paid)||0) + parsedMonths;
      await updateDoc(doc(db, 'members', currentUser.official_id), { total_months_paid: newTotalPaid });
      alert('Subscription Processed Successfully!');
      setCurrentUser({ ...currentUser, total_months_paid: newTotalPaid });
      onViewReceipt({ ...payload, official_id: currentUser.official_id });
    } catch (error) { alert('Connection failed.'); } finally { setIsSubmitting(false); }
  };


  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
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
        <TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Pay Securely via UPI</Text>}</TouchableOpacity>
      </View>
    </ScrollView>
  );
}


// --- FUNDRAISING LIST SCREEN ---
function FundraisingListScreen({ onSelectCampaign }) {
  const [campaigns, setCampaigns] = useState([]);
  useEffect(() => { const fetchDrives = async () => { try { const snap = await getDocs(collection(db, 'campaigns')); setCampaigns(snap.docs.map(d=>d.data())); } catch (err) {} }; fetchDrives(); }, []);


  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      {campaigns.filter(c => c.status === 'ACTIVE').map((camp) => {
        const raised = parseFloat(camp.raised_amount) || 0; const target = parseFloat(camp.target_amount) || 1; const progress = Math.min(Math.round((raised / target) * 100), 100);
        return (
          <TouchableOpacity key={camp.campaign_id} style={styles.formCard} onPress={() => onSelectCampaign(camp)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><Text style={styles.sectionTitle}>{camp.title}</Text><View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}><Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>ACTIVE</Text></View></View>
            <Text style={{ color: '#64748B', marginBottom: 16, fontWeight: '500' }} numberOfLines={2}>{camp.description}</Text>
            <View style={{ height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}><View style={{ width: `${progress}%`, backgroundColor: '#10B981', height: '100%' }} /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontWeight: '800', color: '#004085' }}>Raised: ₹{raised}</Text><Text style={{ fontWeight: '800', color: '#10B981' }}>{progress}% Funded</Text></View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}


// --- CAMPAIGN DETAIL ---
function CampaignDetailScreen({ campaign, currentUser, onBack, onViewReceipt }) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleUPIPayment = async () => {
    setIsSubmitting(true);
    const txnId = `UPI_${Date.now()}`;
    const payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: currentUser.official_id, full_name: currentUser.full_name, amount: amount, payment_method: 'UPI', donation_type: 'FUND_RAISING', reason: `Campaign: ${campaign.title}`, campaign_id: campaign.campaign_id };
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      const campRef = doc(db, 'campaigns', campaign.campaign_id);
      const cSnap = await getDoc(campRef);
      await updateDoc(campRef, { raised_amount: (parseFloat(cSnap.data().raised_amount)||0) + parseFloat(amount) });
      alert('Thank you! Contribution recorded.'); onViewReceipt({ ...payload, official_id: currentUser.official_id });
    } catch (error) { alert('Database Error'); } finally { setIsSubmitting(false); }
  };


  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{campaign.title}</Text>
        <Text style={{ color: '#475569', fontSize: 16, lineHeight: 24, marginBottom: 24, fontWeight: '500' }}>{campaign.description}</Text>
        <Text style={styles.label}>Contribution Amount (₹)</Text><TextInput style={styles.input} placeholder="E.G. 500" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Contribute</Text>}</TouchableOpacity>
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


  return (
    <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
      <View style={styles.receiptCard}>
        <View style={{zIndex: 1, width: '100%'}}>
          <Text style={styles.receiptTitle}>HIYWA</Text>
          <Text style={{textAlign: 'center', fontWeight: '800', fontSize: 11, marginBottom: 4, color: '#64748B'}}>Hidhayathul Islam Youth Welfare Trust</Text>
          <Text style={styles.receiptSubtitle}>Official Payment Receipt</Text>
          <View style={styles.receiptDivider} />
          <View style={{width: '100%'}}>
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
      <Animated.Image source={require('./hiywalogo.jpeg')} style={{ width: 180, height: 180, borderRadius: 20, transform: [{ scale: scaleValue }], opacity: opacityValue, marginBottom: 30 }} resizeMode="contain" />
      <Animated.Text style={{ color: '#ffc107', fontSize: 28, fontWeight: '900', opacity: opacityValue, textAlign: 'center', paddingHorizontal: 20 }}>Welcome, {user.full_name}!</Animated.Text>
      <Animated.Text style={{ color: '#e9ecef', fontSize: 16, opacity: opacityValue, marginTop: 10, fontWeight: '600' }}>Service for the Sake of Allah</Animated.Text>
    </View>
  );
}


// ==========================================
// GLOBAL STYLES (NAVY BLUE THEME)
// ==========================================
const webDateStyle = { borderWidth: '2px', borderColor: '#E2E8F0', borderRadius: '12px', padding: '16px', fontSize: '16px', marginBottom: '24px', backgroundColor: '#FFFFFF', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', color: '#004085', fontWeight: '600' };


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' }, 
  authContainer: { flex: 1, backgroundColor: '#002752', justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }, 
  
  sidebarContainer: { width: 280, backgroundColor: '#002752', height: '100%', borderRightWidth: 1, borderRightColor: '#001a38', zIndex: 100 },
  sidebarMobileAbsolute: { position: 'absolute', left: 0, top: 0, bottom: 0, elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20 },
  sidebarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 },
  sidebarHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#001a38' },
  sidebarBrand: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  sidebarRole: { fontSize: 11, fontWeight: '700', color: '#ffc107', marginTop: 2, letterSpacing: 0.5 },
  sidebarSectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginLeft: 24, marginBottom: 12, marginTop: 12, letterSpacing: 1 },
  sidebarBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  sidebarBtnActive: { backgroundColor: '#001a38', borderLeftColor: '#ffc107' },
  sidebarBtnText: { color: '#CBD5E1', fontSize: 15, fontWeight: '600' },
  sidebarBtnTextActive: { color: '#FFFFFF', fontWeight: '800' },
  sidebarFooter: { padding: 24, borderTopWidth: 1, borderTopColor: '#001a38' },
  logoutBtn: { backgroundColor: '#001a38', padding: 12, borderRadius: 10, alignItems: 'center' },

  contentHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 },
  contentTitle: { fontSize: 22, fontWeight: '800', color: '#004085', letterSpacing: -0.5 },

  authCard: { backgroundColor: '#FFFFFF', width: '90%', maxWidth: 440, alignSelf: 'center', padding: 40, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)' },
  formCard: { backgroundColor: '#FFFFFF', marginVertical: 8, padding: 32, borderRadius: 24, width: '100%', maxWidth: 1100, alignSelf: 'center', borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)' },
  adminCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.02)' },
  
  authTitle: { fontSize: 28, fontWeight: '800', color: '#004085', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  authSubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 32, fontWeight: '500' },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#004085', marginBottom: 24, letterSpacing: -0.5 },
  
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, backgroundColor: '#FFFFFF', color: '#004085', fontWeight: '500' },
  
  button: { backgroundColor: '#004085', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  neatBtnPrimary: { backgroundColor: '#004085', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  neatBtnSuccess: { backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  neatBtnDark: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  neatBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  neatBtnTextDark: { color: '#004085', fontWeight: '700', fontSize: 13 },

  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, width: '100%', maxWidth: 1100, alignSelf: 'center', marginTop: 12 },
  bentoBox: { backgroundColor: '#FFFFFF', flexBasis: '48%', flexGrow: 1, minWidth: 280, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)' },
  bentoIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  bentoTitle: { fontSize: 18, fontWeight: '800', color: '#004085', marginBottom: 4, letterSpacing: -0.5 },
  bentoDesc: { fontSize: 14, color: '#64748B', fontWeight: '500', lineHeight: 20 },

  dropdownBtn: { borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: '#FFFFFF' },
  dropdownBtnText: { fontSize: 16, color: '#004085', fontWeight: '500' },
  dropdownList: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, marginBottom: 24, marginTop: -8, elevation: 2, overflow: 'hidden' },
  dropdownItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemText: { fontSize: 15, color: '#004085', fontWeight: '700' },
  filterLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChipRow: { flexDirection: 'row', marginBottom: 12 },
  filterChip: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, borderWidth: 2, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#004085', borderColor: '#004085' },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#475569' },

  alertBox: { backgroundColor: '#FEF2F2', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FECACA', marginBottom: 24 },
  alertText: { color: '#991B1B', fontWeight: '700', fontSize: 14 },
  alertRedBox: { backgroundColor: '#FEF2F2', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#FECACA', marginBottom: 24 },
  alertRedText: { color: '#991B1B', fontWeight: '800', textAlign: 'center', fontSize: 15, letterSpacing: 0.5 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  infoBadge: { backgroundColor: '#F8FAFC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  infoBadgeTxt: { fontSize: 13, fontWeight: '700', color: '#004085' },
  
  statGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statBoxLarge: { backgroundColor: '#004085', padding: 24, borderRadius: 20, flex: 1, alignItems: 'center', elevation: 2 },
  statLargeVal: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  statLargeKey: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 8, fontWeight: '700', textTransform: 'uppercase' },
  statWrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statChip: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, width: '48%', flexDirection: 'column', borderWidth: 1, borderColor: '#E2E8F0' },
  statChipKey: { fontSize: 14, color: '#64748B', fontWeight: '700', marginBottom: 4 },
  statChipVal: { fontSize: 20, color: '#004085', fontWeight: '800' },
  
  quickSelectContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 24 },
  quickBtn: { backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 12, flex: 1, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  quickBtnActive: { backgroundColor: '#004085', borderColor: '#004085' },
  quickBtnText: { fontWeight: '700', color: '#64748B', fontSize: 14 },
  quickBtnTextActive: { color: '#FFFFFF' },
  totalBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  totalBoxText: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: '#004085', letterSpacing: -0.5 },

  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 20 },
  historyDetails: { fontSize: 14, color: '#64748B', fontWeight: '500', marginTop: 4 },
  receiptCard: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 450 },
  receiptTitle: { fontSize: 32, fontWeight: '800', color: '#004085', textAlign: 'center', marginBottom: 4, letterSpacing: -1 },
  receiptSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  receiptDivider: { borderBottomWidth: 2, borderBottomColor: '#F1F5F9', marginVertical: 20 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  receiptLabel: { fontSize: 15, color: '#64748B', fontWeight: '700' },
  receiptVal: { fontSize: 15, color: '#004085', flexShrink: 1, textAlign: 'right', marginLeft: 10, fontWeight: '700' },
  receiptTotalBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, marginTop: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  receiptTotalText: { fontSize: 22, fontWeight: '800', color: '#004085', textAlign: 'center' },
  receiptBtn: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 2, borderColor: '#E2E8F0' },
  receiptBtnText: { fontSize: 13, fontWeight: '700', color: '#004085' },
  
  idCardContainer: { width: 320, backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', position: 'relative' },
  idCardHeader: { backgroundColor: '#004085', paddingVertical: 24, paddingHorizontal: 16, position: 'relative' },
  idCardPhoto: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#FFFFFF', marginTop: -60, backgroundColor: '#F1F5F9' },
  
  roleBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  roleBtnActive: { backgroundColor: '#FFFFFF', borderColor: '#004085', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  roleBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  roleBtnTextActive: { color: '#004085' },
  wizardProgress: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 24, marginTop: 12 },
  adminCardTitle: { fontSize: 18, fontWeight: '800', color: '#004085', marginBottom: 4, letterSpacing: -0.5 },
  adminCardMeta: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F8FAFC', marginLeft: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#004085' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', marginHorizontal: 0, marginVertical: 16, borderRadius: 12, padding: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  tabBtnText: { fontWeight: '700', color: '#64748B', fontSize: 14 },
  tabBtnTextActive: { color: '#004085' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 39, 82, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#FFFFFF', width: '90%', maxWidth: 500, padding: 32, borderRadius: 24, elevation: 0, borderWidth: 1, borderColor: '#E2E8F0' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 28, height: 28, borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 8, marginRight: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  checkboxActive: { backgroundColor: '#004085', borderColor: '#004085' },
  detailTxt: { fontSize: 15, color: '#475569', marginBottom: 8, fontWeight: '500' },
});