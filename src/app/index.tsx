import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, BackHandler, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';


import { initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';


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

// --- GLOBAL ALERT OVERRIDE (NO CHROME POPUPS) ---
let globalAlertTrigger = null;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
   window.alert = (msg) => {
     if (globalAlertTrigger) globalAlertTrigger({ title: 'Notice', message: String(msg), buttons: [{ text: 'OK' }] });
     else console.log("Alert:", msg);
   };
}

const originalAlert = Alert.alert;
Alert.alert = (title, message, buttons) => {
   if (globalAlertTrigger) {
     globalAlertTrigger({ title: title || 'Notice', message: message || '', buttons: buttons || [{ text: 'OK', style: 'default' }] });
   } else {
     if (Platform.OS === 'web') console.log("Alert:", title, message);
     else originalAlert(title, message, buttons);
   }
};

const confirmAction = (title, message, onConfirm, confirmText = 'Confirm', destructive = true) => {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm }
  ]);
};

// THE CUSTOM IN-BUILT MODAL COMPONENT
const CustomAlertProvider = () => {
  const [config, setConfig] = useState(null);
  useEffect(() => { globalAlertTrigger = setConfig; }, []);
  if (!config) return null;

  return (
    <View style={[styles.modalOverlay, { zIndex: 999999 }]}>
      <View style={[styles.modalCard, { alignItems: 'center', maxWidth: 350, padding: 24 }]}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#004085', marginBottom: config.message ? 12 : 24, textAlign: 'center' }}>{config.title}</Text>
        {!!config.message && <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>{config.message}</Text>}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          {config.buttons.map((btn, idx) => {
             const isCancel = btn.style === 'cancel';
             const isDestruct = btn.style === 'destructive';
             return (
               <TouchableOpacity 
                 key={idx} 
                 style={[styles.button, { flex: 1, minWidth: 100, paddingVertical: 12, marginTop: 0, backgroundColor: isCancel ? '#F1F5F9' : isDestruct ? '#EF4444' : '#004085', borderWidth: isCancel ? 1 : 0, borderColor: '#CBD5E1' }]}
                 onPress={() => {
                    setConfig(null);
                    if (btn.onPress) btn.onPress();
                 }}
               >
                 <Text style={[styles.buttonText, { color: isCancel ? '#475569' : '#FFFFFF', fontSize: 14, textAlign: 'center' }]}>{btn.text || 'OK'}</Text>
               </TouchableOpacity>
             );
          })}
        </View>
      </View>
    </View>
  );
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
const COUNTRY_CODES = [
  { code: '+91', name: 'IND', max: 10 }, { code: '+1', name: 'USA/CAN', max: 10 }, { code: '+44', name: 'UK', max: 10 },
  { code: '+971', name: 'UAE', max: 9 }, { code: '+966', name: 'KSA', max: 9 }, { code: '+968', name: 'OMN', max: 8 },
  { code: '+974', name: 'QAT', max: 8 }, { code: '+973', name: 'BHR', max: 8 }, { code: '+965', name: 'KWT', max: 8 },
  { code: '+60', name: 'MYS', max: 10 }, { code: '+65', name: 'SGP', max: 8 }, { code: '+61', name: 'AUS', max: 9 },
  { code: '+64', name: 'NZL', max: 9 }, { code: '+94', name: 'LKA', max: 9 }, { code: '+880', name: 'BGD', max: 10 },
  { code: '+92', name: 'PAK', max: 10 }, { code: '+977', name: 'NPL', max: 10 }, { code: '+86', name: 'CHN', max: 11 },
  { code: '+81', name: 'JPN', max: 10 }, { code: '+82', name: 'KOR', max: 10 }, { code: '+33', name: 'FRA', max: 9 },
  { code: '+49', name: 'DEU', max: 11 }, { code: '+39', name: 'ITA', max: 10 }, { code: '+7', name: 'RUS/KAZ', max: 10 },
  { code: '+27', name: 'ZAF', max: 9 }, { code: '+20', name: 'EGY', max: 10 }, { code: '+254', name: 'KEN', max: 10 },
  { code: '+234', name: 'NGA', max: 10 }, { code: '+55', name: 'BRA', max: 11 }, { code: '+52', name: 'MEX', max: 10 },
  { code: '+54', name: 'ARG', max: 10 }, { code: '+56', name: 'CHL', max: 9 }, { code: '+57', name: 'COL', max: 10 },
  { code: '+34', name: 'ESP', max: 9 }, { code: '+351', name: 'PRT', max: 9 }, { code: '+31', name: 'NLD', max: 9 },
  { code: '+32', name: 'BEL', max: 9 }, { code: '+41', name: 'CHE', max: 9 }, { code: '+46', name: 'SWE', max: 9 },
  { code: '+47', name: 'NOR', max: 8 }, { code: '+45', name: 'DNK', max: 8 }, { code: '+358', name: 'FIN', max: 10 },
  { code: '+48', name: 'POL', max: 9 }, { code: '+420', name: 'CZE', max: 9 }, { code: '+43', name: 'AUT', max: 10 },
  { code: '+30', name: 'GRC', max: 10 }, { code: '+90', name: 'TUR', max: 10 }, { code: '+98', name: 'IRN', max: 10 },
  { code: '+964', name: 'IRQ', max: 10 }, { code: '+962', name: 'JOR', max: 9 }, { code: '+961', name: 'LBN', max: 8 }
];

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


// ==========================================
// 1. MASTER LAYOUT & SIDEBAR COMPONENT
// ==========================================
function DashboardLayout({ currentUser, currentView, setCurrentView, onLogout, children }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => { setIsOpen(!isMobile); }, [isMobile]);

  const handleNav = (view) => { setCurrentView(view); if (isMobile) setIsOpen(false); };

  const isCore = currentUser?.is_core_admin;
  const perms = currentUser?.admin_permissions || '[]';
  const hasPerm = (p) => isCore || perms.includes('ALL') || perms.includes(p);
  const isAdmin = currentUser?.role === 'ADMIN';

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
               <Image source={require('./hiywalogo.png')} style={{ width: 70, height: 70, borderRadius: 8, marginRight: 10 }} />
               <View>
                 <Text style={styles.sidebarBrand}>HIYWA</Text>
                 <Text style={styles.sidebarRole}>{currentUser?.role}</Text>
                 {currentUser && <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '800', marginTop: 4 }}>ID: {currentUser.official_id}</Text>}
               </View>
            </View>
          </View>

          <ScrollView style={{ flex: 1, paddingTop: 10, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.sidebarSectionLabel}>MY ACCOUNT</Text>
            <NavButton title="Home Dashboard" icon="🏠" viewId="home" />
            {currentUser?.role !== 'STUDENT' && <NavButton title="Subscriptions" icon="📅" viewId="subscription" />}
            <NavButton title="Make Donation" icon="💖" viewId="donate" />
            <NavButton title="Fund Drives" icon="📢" viewId="fundraising" />
            <NavButton title="Governing Body" icon="🏛️" viewId="governing" />
            <NavButton title="Ramadan Comp." icon="🌙" viewId="ramadan" />
            
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
                {(hasPerm('MANAGE_FINANCE') || isCore) && <NavButton title="Finance Ledger" icon="💵" viewId="admin_finance" />}
                {(hasPerm('MANAGE_CAMPAIGNS') || isCore) && <NavButton title="Campaign Control" icon="📢" viewId="admin_campaigns" />}
                {(hasPerm('MANAGE_USERS') || hasPerm('MANAGE_FINANCE') || isCore) && <NavButton title="Reports Central" icon="📑" viewId="admin_reports" />}
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

      {/* FIXED MODAL SCROLLING ROOT CONTAINER */}
      <View style={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
        {currentView !== 'register' && (
          <View style={[styles.contentHeader, { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', elevation: 8, shadowColor: '#004085', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, paddingVertical: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {isMobile && (
                  <TouchableOpacity onPress={() => setIsOpen(true)} style={{ marginRight: 16, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 18, color: '#004085', fontWeight: 'bold' }}>☰</Text>
                  </TouchableOpacity>
                )}
                <Image source={require('./hiywalogo.png')} style={{ width: 44, height: 44, borderRadius: 10, marginRight: 12 }} resizeMode="contain" />
                <View style={{ flexShrink: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#004085', flexShrink: 1, letterSpacing: 0.5 }} numberOfLines={1}>HIYWA</Text>
                  <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '800', marginTop: 2, letterSpacing: 1.5 }}>MTK PURAM</Text>
                </View>
              </View>

              {currentUser && currentView !== 'adminRegister' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                   {!isMobile && (
                     <View style={{marginRight: 12, alignItems: 'flex-end'}}>
                       <Text style={{ fontWeight: '800', color: '#004085', fontSize: 13, textTransform: 'uppercase' }}>{currentUser.full_name}</Text>
                       <Text style={{ fontWeight: '700', color: '#64748B', fontSize: 10, marginTop: 2 }}>{currentUser.role}</Text>
                     </View>
                   )}
                   <TouchableOpacity onPress={() => handleNav('profile')} style={{padding: 2, backgroundColor: '#F8FAFC', borderRadius: 24, borderWidth: 1, borderColor: '#CBD5E1'}}>
                     {currentUser.profile_photo ? (
                        <Image source={{uri: currentUser.profile_photo}} style={{width: 38, height: 38, borderRadius: 19}} />
                     ) : (
                        <View style={{width: 38, height: 38, borderRadius: 19, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center'}}><Text style={{fontSize: 20}}>👤</Text></View>
                     )}
                   </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
        {/* THIS PREVENTS MODALS FROM SCROLLING OFF SCREEN */}
        {children}
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
  return (
    <>
      <CustomAlertProvider />
      <MainAppContent />
    </>
  );
}

function MainAppContent() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [splashUser, setSplashUser] = useState(null);
  
  const [registerRole, setRegisterRole] = useState(null);
  const [receiptBackView, setReceiptBackView] = useState('home'); // Fixed to 'home'

  useEffect(() => {
    const backAction = () => {
      if (currentView === 'login' || currentView === 'home' || currentView === 'admin_stats') {
        Alert.alert("Exit HIYWA App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" }, 
          { text: "YES, EXIT", style: "destructive", onPress: () => BackHandler.exitApp() }
        ]);
        return true; 
      }
      
      // Step-back logic
      if (currentView === 'register') { setCurrentView('login'); return true; }
      if (currentView === 'campaignDetail') { setCurrentView('fundraising'); return true; }
      if (currentView === 'receipt') { setCurrentView(receiptBackView); return true; }
      
      // If anywhere else (Profile, Finance, Users, etc.), go back to Home!
      setCurrentView('home'); 
      return true; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    if (Platform.OS === 'web') {
      const handleWebBack = (e) => {
        e.preventDefault();
        Alert.alert("Exit Portal", "Are you sure you want to exit the HIYWA portal? You will be logged out.", [
           { text: "Cancel", style: "cancel", onPress: () => window.history.pushState(null, '', window.location.href) },
           { text: "Exit", style: "destructive", onPress: () => { setCurrentUser(null); setCurrentView('login'); } }
        ]);
      };
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handleWebBack);
      return () => { backHandler.remove(); window.removeEventListener('popstate', handleWebBack); };
    }

    return () => backHandler.remove();
  }, [currentView, currentUser, receiptBackView]);

  if (splashUser) return <LoginSplashScreen user={splashUser} onFinish={() => { setCurrentUser(splashUser); setCurrentView(splashUser.role === 'ADMIN' ? 'admin_stats' : 'home'); setSplashUser(null); }} />;
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
      {currentView === 'home' && <HomeScreen currentUser={currentUser} onNavigate={handleDashboardNav} />}
      {currentView === 'profile' && <UserProfileScreen currentUser={currentUser} setCurrentUser={setCurrentUser} />}
      {currentView === 'governing' && <GoverningBodyScreen currentUser={currentUser} />}
      {currentView === 'ramadan' && (
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={styles.sectionTitle}>Ramadan Competition</Text>
          <View style={{backgroundColor: '#FEF3C7', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#F59E0B', marginTop: 12, alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
            <Text style={{color: '#D97706', fontWeight: '900', fontSize: 22, marginBottom: 8}}>🌙 Coming Soon</Text>
            <Text style={{color: '#B45309', fontWeight: '600', fontSize: 14, textAlign: 'center', lineHeight: 22}}>
              The official HIYWA Ramadan Competition portal is currently under development. This feature will be activated before the upcoming holy month of Ramadan.
            </Text>
          </View>
        </ScrollView>
      )}
      
      {(currentView === 'admin_stats' || currentView === 'admin_users' || currentView === 'admin_students' || currentView === 'admin_finance' || currentView === 'admin_campaigns' || currentView === 'admin_reports' || currentView === 'admin_settings' || currentView === 'admin_roles') && 
        <AdminDashboard currentUser={currentUser} activeTab={currentView.replace('admin_', '').toUpperCase()} onNavigate={handleDashboardNav} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView(currentView); setCurrentView('receipt'); }} />
      }
      
      {currentView === 'adminRegister' && <RegisterScreen defaultRole={registerRole} isAdminAuth={true} onBack={() => setCurrentView(registerRole === 'STUDENT' ? 'admin_students' : 'admin_users')} />}
      {currentView === 'donate' && <DonationPortal currentUser={currentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('donate'); setCurrentView('receipt'); }} onBack={() => setCurrentView('home')} />}
      {currentView === 'subscription' && <SubscriptionScreen currentUser={currentUser} setCurrentUser={setCurrentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('subscription'); setCurrentView('receipt'); }} onBack={() => setCurrentView('home')} />}
      {currentView === 'fundraising' && <FundraisingListScreen currentUser={currentUser} onSelectCampaign={(camp) => { setSelectedCampaign(camp); setCurrentView('campaignDetail'); }} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('fundraising'); setCurrentView('receipt'); }} onBack={() => setCurrentView('home')} />}
      {currentView === 'campaignDetail' && <CampaignDetailScreen campaign={selectedCampaign} currentUser={currentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('campaignDetail'); setCurrentView('receipt'); }} onBack={() => setCurrentView('fundraising')} />}
      {currentView === 'receipt' && <ReceiptPage receipt={selectedReceipt} currentUser={currentUser} onBack={() => setCurrentView(receiptBackView)} />}
    </DashboardLayout>
  );
}


// --- COMPACT DROPDOWN FILTER ---
const FilterDropdown = ({ label, value, options, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, minWidth: 110, zIndex: open ? 100 : 1, marginBottom: 6 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#004085', marginBottom: 4, textTransform: 'uppercase' }}>{label}</Text>
      <TouchableOpacity style={[styles.dropdownBtn, {marginBottom: 0, paddingVertical: 8, paddingHorizontal: 10, height: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]} onPress={() => setOpen(!open)}>
        <Text style={[styles.dropdownBtnText, {fontSize: 12}]} numberOfLines={1}>{value || 'ALL'}</Text>
        <Text style={{fontSize: 10, color: '#94A3B8'}}>▼</Text>
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdownList, {position: 'absolute', top: 62, left: 0, right: 0, zIndex: 100, marginBottom: 0, marginTop: 0}]}>
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

// --- REUSABLE FORM DROPDOWN ---
const FormDropdown = ({ label, value, options, onSelect, placeholder, isScrollable = false }) => {
  const [open, setOpen] = useState(false);
  const wrapStyle = { flex: 1, minWidth: 260, position: 'relative' }; 
  const dropStyle = [styles.dropdownBtn, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }];
  
  return (
    <View style={[wrapStyle, { zIndex: open ? 1000 : 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={dropStyle} onPress={() => setOpen(!open)}>
        <Text style={[styles.dropdownBtnText, !value && {color: '#94A3B8'}]}>{value || placeholder}</Text>
        <Text style={{fontSize: 10, color: '#94A3B8'}}>▼</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          {isScrollable ? (
            <ScrollView nestedScrollEnabled style={{maxHeight: 200}}>
              {options.map(o => (
                <TouchableOpacity key={o} style={styles.dropdownItem} onPress={() => { onSelect(o); setOpen(false); }}>
                  <Text style={styles.dropdownItemText}>{o}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            options.map(o => (
              <TouchableOpacity key={o} style={styles.dropdownItem} onPress={() => { onSelect(o); setOpen(false); }}>
                <Text style={styles.dropdownItemText}>{o}</Text>
              </TouchableOpacity>
            ))
          )}
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
  const [allowPublicReg, setAllowPublicReg] = useState(false); // NEW STATE
  
  const [showResetAlert, setShowResetAlert] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try { const sDoc = await getDoc(doc(db, 'settings', 'global')); if(sDoc.exists()) setAllowPublicReg(sDoc.data().allow_public_registration === true); } catch(e){}
    };
    fetchSettings();
  }, []);

  const handleLogin = async () => {
    if (!loginId || !password) return alert('Please enter your Official Login ID and password');
    setIsSubmitting(true);
    try {
      const userSnap = await getDoc(doc(db, 'members', loginId.toUpperCase()));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password === password) {
          if (password === 'Hiywa@123') { setForcePassUser(userData); setShowResetAlert(true); } else { onLogin(userData); }
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
    if (showResetAlert) return ( <View style={styles.authContainer}><View style={styles.modalOverlay}><View style={[styles.modalCard, {alignItems: 'center', zIndex: 1000}]}><Text style={{fontSize: 48, marginBottom: 16}}>⚠️</Text><Text style={{fontSize: 22, fontWeight: '900', color: '#004085', marginBottom: 12, textAlign: 'center'}}>Password Update Required</Text><Text style={{fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 22}}>For security reasons, you must change your default password before accessing the portal.</Text><TouchableOpacity style={[styles.button, {width: '100%'}]} onPress={() => setShowResetAlert(false)}><Text style={styles.buttonText}>OK, Change Password</Text></TouchableOpacity></View></View></View> );
    return (
      <KeyboardAvoidingView style={styles.authContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Update Required</Text><Text style={styles.authSubtitle}>Create a new secure password.</Text>
          <Text style={styles.label}>New Password</Text>
          <View style={{ position: 'relative' }}><TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showNewPassword} value={newPassword} onChangeText={setNewPassword} /><TouchableOpacity style={{ position: 'absolute', right: 15, top: 18, zIndex: 1 }} onPress={() => setShowNewPassword(!showNewPassword)}><Text style={{ fontSize: 18 }}>{showNewPassword ? '🙈' : '👁️'}</Text></TouchableOpacity></View>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={{ position: 'relative' }}><TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} /><TouchableOpacity style={{ position: 'absolute', right: 15, top: 18, zIndex: 1 }} onPress={() => setShowConfirmPassword(!showConfirmPassword)}><Text style={{ fontSize: 18 }}>{showConfirmPassword ? '🙈' : '👁️'}</Text></TouchableOpacity></View>
          <TouchableOpacity style={styles.button} onPress={submitNewPassword} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save & Login</Text>}</TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.authContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.authCard}>
        <View style={{ alignItems: 'center', marginBottom: 15 }}><Image source={require('./hiywalogo.png')} style={{ width: 120, height: 120, borderRadius: 16 }} resizeMode="contain" /></View>
        <Text style={styles.authTitle}>HIYWA Connect</Text><Text style={styles.authSubtitle}>Secure Member Portal</Text>
        <Text style={styles.label}>Official Login ID</Text>
        <TextInput style={styles.input} autoCapitalize="characters" value={loginId} onChangeText={(t) => setLoginId(t.replace(/\s/g, ''))} />
        <Text style={styles.label}>Password</Text>
        <View style={{ position: 'relative' }}><TextInput style={[styles.input, { paddingRight: 40 }]} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} /><TouchableOpacity style={{ position: 'absolute', right: 15, top: 18, zIndex: 1 }} onPress={() => setShowPassword(!showPassword)}><Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text></TouchableOpacity></View>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Secure Login</Text>}</TouchableOpacity>
        
        {/* NEW CONDITIONAL RENDERING FOR PUBLIC REGISTRATION */}
        {allowPublicReg && (
           <TouchableOpacity style={{ marginTop: 24, alignItems: 'center' }} onPress={() => onNavigate('register')}><Text style={{ color: '#004085', fontWeight: '800' }}>New Member? Register Here</Text></TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}


// --- NEW HOME SCREEN ---
function HomeScreen({ currentUser, onNavigate }) {
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [subStartMonth, setSubStartMonth] = useState('');
  const [customSlider, setCustomSlider] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const { width } = useWindowDimensions();

  const fallbackImages = [
    'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=1200'
  ];

  const activeSlider = customSlider.length > 0 ? customSlider : fallbackImages;

  // Splash Screen Animation States
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance Animation, Hold, then Disappear
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 20, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ]),
      Animated.delay(4000), // Hold for 4 seconds
      Animated.timing(opacityAnim, { toValue: 0, duration: 1500, useNativeDriver: true }) // Fade out
    ]).start();
    
    const timer = setInterval(() => setCurrentImage(prev => prev + 1), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => { 
      try { 
        const sDoc = await getDoc(doc(db, 'settings', 'global')); 
        if(sDoc.exists()) {
           setSubStartMonth(sDoc.data().subscription_start_month || '');
           setCustomSlider(sDoc.data().slider_images || []);
        }
        const campSnap = await getDocs(collection(db, 'campaigns')); 
        setActiveCampaigns(campSnap.docs.map(d=>d.data()).filter(c => c.status === 'ACTIVE' && (parseFloat(c.raised_amount)||0) < (parseFloat(c.target_amount)||1)));
      } catch (err) {} 
    };
    fetchData();
  }, []);

  let duesMonths = 0;
  if (currentUser?.role !== 'STUDENT') {
    const joinDate = currentUser?.join_date ? new Date(currentUser.join_date) : new Date();
    let startDate = joinDate;
    if (subStartMonth) { const systemStart = new Date(`${subStartMonth}-01`); if (systemStart > joinDate) startDate = systemStart; }
    const currentDate = new Date();
    const rawMonths = ((currentDate.getFullYear() - startDate.getFullYear()) * 12) + (currentDate.getMonth() - startDate.getMonth()) + 1;
    const monthsSince = Math.max(0, rawMonths);
    const totalPaid = parseInt(currentUser?.total_months_paid) || 0;
    duesMonths = Math.max(0, monthsSince - totalPaid);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      {/* PHOTO SLIDER WITH SPLASH ANIMATION */}
      <View style={{ width: '100%', height: width < 768 ? (width - 48) : 450, backgroundColor: '#001a38', borderRadius: 20, overflow: 'hidden', marginBottom: 24, position: 'relative', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
        <Image source={{ uri: activeSlider[currentImage % activeSlider.length] }} style={{ width: '100%', height: '100%', opacity: 0.6 }} resizeMode="cover" />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
           <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }], alignItems: 'center', paddingHorizontal: 16 }}>
             <Text style={{ color: '#FFD700', fontSize: width < 768 ? 26 : 42, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 10 }}>🎉 25 YEARS OF HIYWA 🎉</Text>
             <Text style={{ color: '#FFFFFF', fontSize: width < 768 ? 12 : 20, fontWeight: '800', marginTop: 8, letterSpacing: 1, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 5 }}>SILVER JUBILEE CELEBRATION</Text>
           </Animated.View>
        </View>
      </View>

      {/* ALERTS */}
      {duesMonths > 0 && (
        <TouchableOpacity style={[styles.alertRedBox, {borderColor: '#FCA5A5', backgroundColor: '#FEF2F2'}]} onPress={() => onNavigate('subscription')}>
          <Text style={[styles.alertRedText, {color: '#B91C1C'}]}>⚠️ ACTION REQUIRED: You have {duesMonths} month(s) of pending subscription dues. Tap here to clear.</Text>
        </TouchableOpacity>
      )}

      {activeCampaigns.map((camp) => (
        <TouchableOpacity key={camp.campaign_id} style={[styles.alertRedBox, {backgroundColor: '#EFF6FF', borderColor: '#BFDBFE'}]} onPress={() => onNavigate('fundraising')}>
          <Text style={[styles.alertRedText, {color: '#1E3A8A'}]}>🚨 URGENT DRIVE: {camp.title} — Tap to support!</Text>
        </TouchableOpacity>
      ))}

      {/* QUICK ACTIONS BENTO GRID */}
      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Quick Actions</Text>
      <View style={styles.bentoGrid}>
        {currentUser?.role !== 'STUDENT' && (
           <TouchableOpacity style={styles.bentoBox} onPress={() => onNavigate('subscription')}>
             <View><View style={styles.bentoIconWrap}><Text style={{ fontSize: 24 }}>📅</Text></View><Text style={styles.bentoTitle}>Subscriptions</Text><Text style={styles.bentoDesc}>Manage your monthly Trust contributions.</Text></View>
             <View style={{ marginTop: 24, alignSelf: 'flex-start' }}><Text style={{ color: '#004085', fontWeight: '800', fontSize: 13 }}>MANAGE ↗</Text></View>
           </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.bentoBox} onPress={() => onNavigate('donate')}>
          <View><View style={[styles.bentoIconWrap, { backgroundColor: '#FEF2F2' }]}><Text style={{ fontSize: 24 }}>💖</Text></View><Text style={styles.bentoTitle}>General Donation</Text><Text style={styles.bentoDesc}>Make a contribution to the general fund.</Text></View>
          <View style={{ marginTop: 24, alignSelf: 'flex-start' }}><Text style={{ color: '#E11D48', fontWeight: '800', fontSize: 13 }}>DONATE ↗</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bentoBox} onPress={() => onNavigate('fundraising')}>
          <View><View style={[styles.bentoIconWrap, { backgroundColor: '#ECFDF5' }]}><Text style={{ fontSize: 24 }}>📢</Text></View><Text style={styles.bentoTitle}>Fund Drives</Text><Text style={styles.bentoDesc}>Participate in active cause campaigns.</Text></View>
          <View style={{ marginTop: 24, alignSelf: 'flex-start' }}><Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>VIEW CAUSES ↗</Text></View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// --- USER PROFILE SCREEN ---
function UserProfileScreen({ currentUser, setCurrentUser }) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = () => {
    Alert.alert("Upload Photo", "Choose an option", [
      { text: "Take Photo", onPress: async () => { let r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.1, width: 400, height: 400, base64: true }); if (!r.canceled && r.assets[0].base64) { setEditFormData({...editFormData, profile_photo: `data:image/jpeg;base64,${r.assets[0].base64}`}); } } },
      { text: "Choose from Gallery", onPress: async () => { let r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.1, width: 400, height: 400, base64: true }); if (!r.canceled && r.assets[0].base64) { setEditFormData({...editFormData, profile_photo: `data:image/jpeg;base64,${r.assets[0].base64}`}); } } },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const saveEditedProfile = async () => {
    setIsSubmitting(true);
    try { await updateDoc(doc(db, 'members', currentUser.official_id), editFormData); alert('Profile Updated Successfully!'); setCurrentUser({...currentUser, ...editFormData}); setIsEditingProfile(false); } catch (e) { alert('Error saving.'); } finally { setIsSubmitting(false); }
  };

  if (isEditingProfile) {
    const formattedDob = editFormData.dob ? (() => { try { const d = new Date(editFormData.dob); return isNaN(d) ? editFormData.dob : d.toISOString().split('T')[0]; } catch(e){ return editFormData.dob; }})() : '';
    const displayAadhaar = editFormData.aadhaar_number || editFormData.aadhar_number || '';
    const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editFormData.class_grade);
    const wrapStyle = { flex: 1, minWidth: 260 }; 

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View style={styles.formCard}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 16}}>
              <TouchableOpacity style={styles.neatBtnDark} onPress={() => setIsEditingProfile(false)}><Text style={styles.neatBtnTextDark}>← Back</Text></TouchableOpacity>
              <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Edit My Profile</Text>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity onPress={pickImage}>
                {editFormData.profile_photo ? <Image source={{uri: editFormData.profile_photo}} style={{width: 100, height: 100, borderRadius: 50}} /> : <View style={{width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center'}}><Text>📷 Photo</Text></View>}
                <Text style={{color: '#004085', fontWeight: '800', marginTop: 8, textAlign: 'center'}}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, {fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginTop: 10}]}>Personal Details</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, zIndex: 100 }}>
              <View style={wrapStyle}><Text style={styles.label}>Full Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.full_name || ''} onChangeText={t=>setEditFormData({...editFormData, full_name: t})} /></View>
              <View style={wrapStyle}><Text style={styles.label}>Father's Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.father_name || ''} onChangeText={t=>setEditFormData({...editFormData, father_name: t})} /></View>
              <View style={wrapStyle}><Text style={styles.label}>Mother's Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.mother_name || ''} onChangeText={t => setEditFormData({...editFormData, mother_name: t})} /></View>
              <FormDropdown label="Parents Status" value={editFormData.parents_status} options={['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED']} placeholder="SELECT STATUS" onSelect={v => setEditFormData({...editFormData, parents_status: v})} />
              <FormDropdown label="Gender" value={editFormData.gender} options={GENDERS} placeholder="SELECT GENDER" onSelect={v => setEditFormData({...editFormData, gender: v})} />
              <View style={wrapStyle}><Text style={styles.label}>Date of Birth</Text>{Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formattedDob} onChange={(e) => setEditFormData({...editFormData, dob: e.target.value})} /> : <TextInput style={styles.input} value={formattedDob} onChangeText={t=>setEditFormData({...editFormData, dob: t})} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />}</View>
              <FormDropdown label="Blood Group" value={editFormData.blood_group} options={BLOOD_GROUPS} placeholder="SELECT BLOOD GROUP" onSelect={v => setEditFormData({...editFormData, blood_group: v})} />
              <FormDropdown label="Marital Status" value={editFormData.marital_status} options={MARITAL_STATUS} placeholder="SELECT STATUS" onSelect={v => setEditFormData({...editFormData, marital_status: v})} />
              <View style={wrapStyle}><Text style={styles.label}>Aadhaar Number</Text><TextInput style={styles.input} value={displayAadhaar} onChangeText={t=>setEditFormData({...editFormData, aadhaar_number: t})} keyboardType="numeric" maxLength={12} placeholder="Aadhaar Number" placeholderTextColor="#94A3B8" /></View>
            </View>

            <Text style={[styles.sectionTitle, {fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginTop: 24}]}>Contact & Location</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, zIndex: 90 }}>
              <View style={wrapStyle}><Text style={styles.label}>Phone Number</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={editFormData.phone_number || ''} onChangeText={t=>setEditFormData({...editFormData, phone_number: t})} /></View>
              <View style={wrapStyle}><Text style={styles.label}>WhatsApp Number</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={editFormData.whatsapp_number || ''} onChangeText={t=>setEditFormData({...editFormData, whatsapp_number: t})} /></View>
              <View style={wrapStyle}><Text style={styles.label}>Email</Text><TextInput style={styles.input} autoCapitalize="none" value={editFormData.email || ''} onChangeText={t=>setEditFormData({...editFormData, email: t})} /></View>
              <FormDropdown label="Native Place" value={editFormData.native_place} options={NATIVE_PLACES} placeholder="SELECT NATIVE PLACE" onSelect={v => setEditFormData({...editFormData, native_place: v})} />
              <View style={wrapStyle}><Text style={styles.label}>Current Location</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.current_location || ''} onChangeText={t=>setEditFormData({...editFormData, current_location: t})} /></View>
              <View style={{width: '100%'}}><Text style={styles.label}>Full Address</Text><TextInput style={[styles.input, {height: 60}]} multiline autoCapitalize="characters" value={editFormData.address || ''} onChangeText={t=>setEditFormData({...editFormData, address: t})} /></View>
            </View>

            <Text style={[styles.sectionTitle, {fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginTop: 24}]}>Education & Occupation</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, zIndex: 80 }}>
              {(editFormData.role === 'MEMBER' || editFormData.role === 'ADMIN') && (
                <>
                  <FormDropdown label="Education Category" value={editFormData.educational_qualification} options={EDU_CATEGORIES} placeholder="SELECT EDUCATION" onSelect={v => setEditFormData({...editFormData, educational_qualification: v})} />
                  <View style={wrapStyle}><Text style={styles.label}>Course / Major</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} /></View>
                  <View style={wrapStyle}><Text style={styles.label}>Occupation / Job</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.occupation || ''} onChangeText={t=>setEditFormData({...editFormData, occupation: t})} /></View>
                </>
              )}
              {editFormData.role === 'STUDENT' && (
                <>
                  <FormDropdown label="Class / Grade" value={editFormData.class_grade} options={CLASSES} isScrollable={true} placeholder="SELECT CLASS" onSelect={v => setEditFormData({...editFormData, class_grade: v})} />
                  <View style={wrapStyle}><Text style={styles.label}>School / College Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.school_name || ''} onChangeText={t=>setEditFormData({...editFormData, school_name: t})} /></View>
                  <FormDropdown label="Institution Type" value={editFormData.school_type} options={isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES} placeholder="SELECT TYPE" onSelect={v => setEditFormData({...editFormData, school_type: v})} />
                  <View style={wrapStyle}><Text style={styles.label}>Institution Location</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.school_location || ''} onChangeText={t=>setEditFormData({...editFormData, school_location: t})} /></View>
                  <FormDropdown label="Medium of Instruction" value={editFormData.medium_of_instruction} options={MEDIUMS} placeholder="SELECT MEDIUM" onSelect={v => setEditFormData({...editFormData, medium_of_instruction: v})} />
                  {isCollegeEdit && (
                    <>
                      <FormDropdown label="Education Category" value={editFormData.educational_qualification} options={EDU_CATEGORIES} placeholder="SELECT CATEGORY" onSelect={v => setEditFormData({...editFormData, educational_qualification: v})} />
                      <View style={wrapStyle}><Text style={styles.label}>Course / Major Details</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} /></View>
                    </>
                  )}
                </>
              )}
            </View>

            <View style={{ zIndex: 75, marginTop: 24 }}>
              <Text style={[styles.sectionTitle, {fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8}]}>Islamic Studies</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                 <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='YES' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'YES'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='YES' && {color:'white'}]}>Yes</Text></TouchableOpacity>
                 <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='NO' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'NO'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='NO' && {color:'white'}]}>No</Text></TouchableOpacity>
              </View>
            </View>

            {editFormData.islamic_studies === 'YES' && (
              <View style={{flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 70}}>
                <FormDropdown label="Qualification" value={editFormData.islamic_qualification} options={ISLAMIC_QUALS} placeholder="SELECT QUALIFICATION" onSelect={v => setEditFormData({...editFormData, islamic_qualification: v})} />
                {editFormData.islamic_qualification === 'OTHERS' && <View style={wrapStyle}><Text style={styles.label}>Specify Other</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.islamic_qualification || ''} onChangeText={t=>setEditFormData({...editFormData, islamic_qualification: t})} /></View>}
                <View style={wrapStyle}><Text style={styles.label}>Madrasa Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.madrasa_name || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_name: t})} /></View>
                <View style={wrapStyle}><Text style={styles.label}>Madrasa Location</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.madrasa_location || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_location: t})} /></View>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 32 }}><TouchableOpacity style={[styles.neatBtnSuccess, { paddingHorizontal: 32, paddingVertical: 14 }]} onPress={saveEditedProfile} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={[styles.neatBtnText, { fontSize: 15 }]}>💾 Save Profile Data</Text>}</TouchableOpacity></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <View style={styles.formCard}>
        <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20}}><TouchableOpacity style={styles.neatBtnPrimary} onPress={() => {setEditFormData(currentUser); setIsEditingProfile(true);}}><Text style={styles.neatBtnText}>✏️ Edit Profile</Text></TouchableOpacity></View>
        <View style={{flexDirection: 'row', gap: 24, flexWrap: 'wrap'}}>
          <View style={{alignItems: 'center', marginBottom: 15}}>{currentUser?.profile_photo ? ( <Image source={{uri: currentUser.profile_photo}} style={{width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: '#F8FAFC'}} /> ) : ( <View style={{width: 150, height: 150, borderRadius: 75, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center'}}><Text style={{fontSize: 50}}>👤</Text></View> )}</View>
          <View style={{flex: 1, minWidth: 250}}>
             <Text style={{fontSize: 22, fontWeight: '900', color: '#004085', marginBottom: 2, textTransform: 'uppercase'}}>{currentUser?.full_name} {currentUser?.is_core_admin && '👑'}</Text>
             <Text style={{fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 16}}>S/O {currentUser?.father_name || 'N/A'} & {currentUser?.mother_name || 'N/A'} • ID: <Text style={{fontWeight: '800', color: '#004085'}}>{currentUser?.official_id}</Text></Text>
             
             <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24}}>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Status: {currentUser?.membership_status}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Role: {currentUser?.role}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Gender: {currentUser?.gender || 'N/A'}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Blood: {currentUser?.blood_group || 'N/A'}</Text></View>
             </View>

             <View style={{backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16}}>
                <Text style={{fontWeight: '900', marginBottom: 12, color: '#004085', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 6}}>Personal Information</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>DOB:</Text> {currentUser?.dob}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Aadhaar Number:</Text> {currentUser?.aadhaar_number}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Marital Status:</Text> {currentUser?.marital_status || 'N/A'}</Text>
             </View>

             <View style={{backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16}}>
                <Text style={{fontWeight: '900', marginBottom: 12, color: '#004085', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 6}}>Contact & Location</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Primary Mobile:</Text> {currentUser?.phone_number}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>WhatsApp:</Text> {currentUser?.whatsapp_number}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Email:</Text> {currentUser?.email}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Native Place:</Text> {currentUser?.native_place}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Current City:</Text> {currentUser?.current_location}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Full Address:</Text> {currentUser?.address}</Text>
             </View>
          </View>
        </View>
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

// --- GOVERNING BODY SCREEN (FLOWCHART) ---
function GoverningBodyScreen({ currentUser }) {
  const [govBody, setGovBody] = useState({});
  const [members, setMembers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailUser, setDetailUser] = useState(null); 

  // RESTRICT EDITS TO CORE ADMIN ONLY
  const isCore = currentUser?.is_core_admin;
  const isAdmin = isCore; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const memSnap = await getDocs(collection(db, 'members'));
        setMembers(memSnap.docs.map(d=>d.data()).filter(u => u.role !== 'STUDENT'));
        const govDoc = await getDoc(doc(db, 'settings', 'governing_body'));
        if (govDoc.exists()) setGovBody(govDoc.data());
      } catch(e){} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const saveGovBody = async () => { try { await setDoc(doc(db, 'settings', 'governing_body'), govBody); alert('Updated!'); setIsEditing(false); } catch(e) {} };

  const renderGovCard = (roleKey, title) => {
    const id = govBody[roleKey];
    const u = members.find(m => m.official_id === id);
    let allAssigned = [];
    Object.values(govBody).forEach(val => { if(Array.isArray(val)) allAssigned.push(...val); else if(val) allAssigned.push(val); });
    const availableMembers = members.filter(m => !allAssigned.includes(m.official_id) || m.official_id === id);

    return (
       <TouchableOpacity key={roleKey} activeOpacity={isEditing ? 1 : 0.5} onPress={() => { if(!isEditing && u) setDetailUser({...u, trustRole: title}); }} style={{alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', width: 140, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', position: 'relative', margin: 8}}>
         {isEditing && (
           <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, justifyContent: 'center', alignItems: 'center'}}>
             {Platform.OS === 'web' ? (
               <select style={{width: '90%', padding: 4, fontSize: 11}} value={id || ''} onChange={(e) => setGovBody({...govBody, [roleKey]: e.target.value})}>
                  <option value="">-- Vacant --</option>
                  {availableMembers.map(m => <option key={m.official_id} value={m.official_id}>{m.full_name}</option>)}
               </select>
             ) : (
               <TextInput placeholder="ID..." style={{backgroundColor: 'white', padding: 4, width: '90%', fontSize: 11, borderWidth: 1}} autoCapitalize="characters" value={id || ''} onChangeText={(t) => setGovBody({...govBody, [roleKey]: t.toUpperCase()})} />
             )}
           </View>
         )}
         {u?.profile_photo ? <Image source={{uri: u.profile_photo}} style={{width: 60, height: 60, borderRadius: 30, marginBottom: 8}} /> : <View style={{width: 60, height: 60, borderRadius: 30, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 8}}><Text>👤</Text></View>}
         <Text style={{fontWeight: '900', color: '#004085', fontSize: 12, textAlign: 'center'}} numberOfLines={2}>{u ? u.full_name : 'VACANT'}</Text>
         <Text style={{fontSize: 10, color: '#64748B', fontWeight: '800', marginTop: 4, textAlign: 'center'}}>{title}</Text>
       </TouchableOpacity>
    );
  };

  const renderMultiPosition = (roleKey, title) => {
    const list = govBody[roleKey] || [];
    let allAssigned = [];
    Object.values(govBody).forEach(val => { if(Array.isArray(val)) allAssigned.push(...val); else if(val) allAssigned.push(val); });
    const availableMembers = members.filter(m => !allAssigned.includes(m.official_id));

    return (
      <View key={roleKey} style={{marginBottom: 24, alignItems: 'center', width: '100%'}}>
         <Text style={[styles.sectionTitle, {fontSize: 16, color: '#475569', textAlign: 'center'}]}>{title}</Text>
         {isEditing && (
            <View style={{flexDirection: 'row', marginBottom: 12, width: 250}}>
              {Platform.OS === 'web' ? (
                <select style={{flex: 1, padding: 8, border: '1px solid #CBD5E1', borderRadius: '8px 0 0 8px'}} id={`add_${roleKey}`}>
                  <option value="">-- ADD MEMBER --</option>
                  {availableMembers.map(m => <option key={m.official_id} value={m.official_id}>{m.full_name}</option>)}
                </select>
              ) : <TextInput placeholder="ID" id={`add_${roleKey}`} style={{flex: 1, backgroundColor: 'white', padding: 8}} autoCapitalize="characters" />}
              <TouchableOpacity style={{backgroundColor: '#10B981', paddingHorizontal: 16, justifyContent: 'center', borderRadius: '0 8px 8px 0'}} onPress={() => { const sel = document.getElementById(`add_${roleKey}`); if(sel.value && !list.includes(sel.value)) setGovBody({...govBody, [roleKey]: [...list, sel.value]}); sel.value = ''; }}><Text style={{color: 'white', fontWeight: 'bold'}}>+</Text></TouchableOpacity>
            </View>
         )}
         <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center'}}>
            {list.length === 0 ? <Text style={{color: '#94A3B8'}}>None assigned.</Text> : list.map(id => {
               const u = members.find(m => m.official_id === id);
               return (
                 <TouchableOpacity key={id} activeOpacity={isEditing ? 1 : 0.5} onPress={() => { if(!isEditing && u) setDetailUser({...u, trustRole: title}); }} style={{alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', width: 110, position: 'relative'}}>
                   {isEditing && <TouchableOpacity style={{position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 20}} onPress={() => setGovBody({...govBody, [roleKey]: list.filter(i => i !== id)})}><Text style={{color: 'white', fontSize: 10, fontWeight: '900'}}>✕</Text></TouchableOpacity>}
                   {u?.profile_photo ? <Image source={{uri: u.profile_photo}} style={{width: 40, height: 40, borderRadius: 20, marginBottom: 6}} /> : <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 6}}><Text style={{fontSize: 16}}>👤</Text></View>}
                   <Text style={{color: '#1E3A8A', fontWeight: '700', fontSize: 10, textAlign: 'center'}} numberOfLines={2}>{u ? u.full_name : id}</Text>
                 </TouchableOpacity>
               );
            })}
         </View>
      </View>
    );
  };

  if (loading) return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#004085" /></View>;

  return (
    <>
    <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
      <View style={[styles.formCard, {width: '100%'}]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32}}>
          <Text style={[styles.sectionTitle, {marginBottom: 0, fontSize: 16}]}>Trust Governing Body</Text>
          {isAdmin && !isEditing && <TouchableOpacity style={styles.neatBtnPrimary} onPress={()=>setIsEditing(true)}><Text style={styles.neatBtnText}>✏️ Edit Roles</Text></TouchableOpacity>}
          {isAdmin && isEditing && <View style={{flexDirection: 'row', gap: 10}}><TouchableOpacity style={styles.neatBtnDark} onPress={()=>setIsEditing(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.neatBtnSuccess} onPress={saveGovBody}><Text style={styles.neatBtnText}>💾 Save</Text></TouchableOpacity></View>}
        </View>

        <View style={{alignItems: 'center', width: '100%'}}>
          {renderGovCard('President', 'President')}
          <View style={{width: 2, height: 20, backgroundColor: '#CBD5E1'}} />
          <View style={{flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap'}}>
            {renderGovCard('Vice_President', 'Vice President')}
            {renderGovCard('Secretary', 'Secretary')}
            {renderGovCard('Treasurer', 'Treasurer')}
          </View>
          <View style={{width: 2, height: 20, backgroundColor: '#CBD5E1'}} />
          <View style={{flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32}}>
            {renderGovCard('Joint_Secretary', 'Joint Secretary')}
            {renderGovCard('Joint_Treasurer', 'Joint Treasurer')}
          </View>
          <View style={{width: '100%', borderTopWidth: 2, borderTopColor: '#E2E8F0', paddingTop: 32, alignItems: 'center'}}>
            {renderMultiPosition('Executive_Members', 'Executive Members')}
            {renderMultiPosition('Special_Members', 'Special Members')}
          </View>
        </View>
      </View>
    </ScrollView>

    {/* MINIMAL DETAILS POPUP MODAL */}
    {detailUser && (
      <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
        <View style={[styles.modalCard, {maxWidth: 320, width: '90%', alignItems: 'center'}]}>
           {detailUser.profile_photo ? (
              <Image source={{uri: detailUser.profile_photo}} style={{width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 2, borderColor: '#004085'}} />
           ) : (
              <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#004085'}}><Text style={{fontSize: 32}}>👤</Text></View>
           )}
           <Text style={{fontWeight: '900', color: '#004085', fontSize: 18, textAlign: 'center', marginBottom: 4}}>{detailUser.full_name}</Text>
           <Text style={{color: '#64748B', fontWeight: '800', fontSize: 11, marginBottom: 8}}>{detailUser.official_id} • {detailUser.membership_status}</Text>
           <View style={{backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20}}><Text style={{color: '#0284C7', fontWeight: '900', fontSize: 12, textTransform: 'uppercase'}}>{detailUser.trustRole}</Text></View>

           <View style={{width: '100%', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 10, marginBottom: 24}}>
              <Text style={{fontSize: 13, color: '#1E293B'}}><Text style={{fontWeight: '800', color: '#64748B'}}>📞 Phone:</Text> {detailUser.phone_number}</Text>
              <Text style={{fontSize: 13, color: '#1E293B'}}><Text style={{fontWeight: '800', color: '#64748B'}}>🩸 Blood:</Text> {detailUser.blood_group || 'N/A'}</Text>
              <Text style={{fontSize: 13, color: '#1E293B'}}><Text style={{fontWeight: '800', color: '#64748B'}}>📍 Native:</Text> {detailUser.native_place || 'N/A'}</Text>
              <Text style={{fontSize: 13, color: '#1E293B'}}><Text style={{fontWeight: '800', color: '#64748B'}}>🏢 Location:</Text> {detailUser.current_location || 'N/A'}</Text>
           </View>

           <TouchableOpacity style={[styles.button, {backgroundColor: '#004085', width: '100%', marginTop: 0}]} onPress={() => setDetailUser(null)}>
             <Text style={styles.buttonText}>Close</Text>
           </TouchableOpacity>
        </View>
      </View>
    )}
    </>
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

  const [masterResetModal, setMasterResetModal] = useState(false);
  const [masterResetPassword, setMasterResetPassword] = useState('');


  // --- NEW SETTINGS STATE ---
  const [subAmount, setSubAmount] = useState('100');
  const [primaryUpi, setPrimaryUpi] = useState('');
  const [secondaryUpi, setSecondaryUpi] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [configModalPassword, setConfigModalPassword] = useState('');
  const [allowPublicReg, setAllowPublicReg] = useState(false);
  const [subStartMonth, setSubStartMonth] = useState('');
  const [sliderImages, setSliderImages] = useState([]);
  const [showSliderModal, setShowSliderModal] = useState(false);


  // --- NEW EXPENSE STATE ---
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');


  // --- NEW SETTINGS ACTIONS STATE ---
  const [configModal, setConfigModal] = useState(null);


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


  const [finSearchQuery, setFinSearchQuery] = useState('');
  const [showDuesModal, setShowDuesModal] = useState(false);
  const [ledgerTab, setLedgerTab] = useState('INCOME');
  const [repType, setRepType] = useState('DIRECTORY');
  const [repRole, setRepRole] = useState('');
  const [repStatus, setRepStatus] = useState('');
  const [repBlood, setRepBlood] = useState('');
  const [repGender, setRepGender] = useState('');
  const [repFinType, setRepFinType] = useState('');
  const [repStartDate, setRepStartDate] = useState('');
  const [repEndDate, setRepEndDate] = useState('');

  const filteredRepDir = directory.filter(u => {
     if (repRole && u.role !== repRole) return false;
     if (repStatus && u.membership_status !== repStatus) return false;
     if (repBlood && u.blood_group !== repBlood) return false;
     if (repGender && u.gender !== repGender) return false;
     return true;
  });

  const filteredRepFin = globalTxns.filter(t => {
     if (repFinType && t.donation_type !== repFinType) return false;
     if (repStartDate && new Date(t.transaction_date).getTime() < new Date(repStartDate).getTime()) return false;
     if (repEndDate && new Date(t.transaction_date).getTime() > new Date(repEndDate).getTime() + 86400000) return false;
     return true;
  });

  const exportDirectory = () => {
     const header = "ID,Name,Role,Status,Phone,Age,Blood Group,Native Place,Education,Occupation,Address\n";
     const rows = filteredRepDir.map(u => {
        const uAge = u.dob ? (new Date().getFullYear() - new Date(u.dob).getFullYear()) : 'N/A';
        return `"${u.official_id}","${u.full_name}","${u.role}","${u.membership_status}","${u.phone_number}","${uAge}","${u.blood_group || ''}","${u.native_place || ''}","${u.educational_qualification || ''}","${u.occupation || ''}","${(u.address || '').replace(/"/g, '""')}"`;
     }).join("\n");
     downloadCSV(header + rows, "HIYWA_Directory_Report.csv");
  };

  const exportFinance = () => {
     const header = "Date & Time,Txn ID,Member ID,Member Name,Type,Amount,Method,Reason\n";
     const rows = filteredRepFin.map(t => {
        return `"${new Date(t.transaction_date).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}","${t.transaction_id}","${t.member_id}","${t.full_name}","${t.donation_type}","${t.amount}","${t.payment_method}","${(t.reason || '').replace(/"/g, '""')}"`;
     }).join("\n");
     downloadCSV(header + rows, "HIYWA_Finance_Report.csv");
  };


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
  const [campStatus, setCampStatus] = useState('ACTIVE');
  
  // Promote State
  const [promoteUserId, setPromoteUserId] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState({ MANAGE_USERS: false, MANAGE_FINANCE: false, MANAGE_CAMPAIGNS: false, REPORTS_CENTRAL: false });


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
           setAllowPublicReg(d.allow_public_registration || false); // <-- CORRECT PLACEMENT
            setSubStartMonth(d.subscription_start_month || '');
           setSliderImages(d.slider_images || []);
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


  // Calculations (Excluding Core Admin)
  const stats = { roles: {}, bloodGroups: {}, marital: {}, education: {}, native: {}, gender: {} };
  const incrementStat = (cat, val, role) => { if (!val) return; if (!stats[cat][val]) stats[cat][val] = { total: 0, M: 0, S: 0 }; stats[cat][val].total += 1; if (role === 'STUDENT') stats[cat][val].S += 1; else stats[cat][val].M += 1; };
  
  directory.forEach(u => { 
    stats.roles[u.role] = (stats.roles[u.role] || 0) + 1; 
    incrementStat('bloodGroups', u.blood_group, u.role); 
    incrementStat('marital', u.marital_status, u.role); 
    incrementStat('education', u.educational_qualification, u.role); 
    incrementStat('native', u.native_place, u.role); 
    incrementStat('gender', u.gender, u.role); 
  });


  const renderBarChart = (statObj, barColor) => {
    const entries = Object.entries(statObj).sort((a, b) => b[1].total - a[1].total);
    if (entries.length === 0) return <Text style={{ color: '#64748B', fontSize: 13 }}>No data available.</Text>;
    
    // Find the highest number to scale the graph bars correctly
    const maxVal = Math.max(...entries.map(e => e[1].total));
    
    return (
      <View style={{ width: '100%', marginTop: 8 }}>
        {entries.map(([key, val]) => {
          const fillWidth = Math.max((val.total / maxVal) * 100, 2); // Min 2% so empty bars still show slightly
          return (
            <View key={key} style={{ marginBottom: 16 }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                 <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B', flex: 1, paddingRight: 10 }} numberOfLines={1}>{key}</Text>
                 <Text style={{ fontSize: 14, fontWeight: '800', color: '#004085' }}>{val.total}</Text>
               </View>
               <View style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                 <View style={{ height: '100%', width: `${fillWidth}%`, backgroundColor: barColor || '#3B82F6', borderRadius: 4 }} />
               </View>
               <Text style={{ fontSize: 11, color: '#64748B', marginTop: 6, fontWeight: '500' }}>Members: {val.M}   •   Students: {val.S}</Text>
            </View>
          );
        })}
      </View>
    );
  };


  const filteredDirectory = directory
  .filter(u => activeTab === 'STUDENTS' ? u.role === 'STUDENT' : (u.role === 'MEMBER' || u.role === 'ADMIN'))
  .filter(u => !searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.official_id?.toLowerCase().includes(searchQuery.toLowerCase()))
  .filter(u => !filters.status || u.membership_status === filters.status).filter(u => !filters.blood || u.blood_group === filters.blood).filter(u => !filters.gender || u.gender === filters.gender).filter(u => !filters.edu || u.educational_qualification === filters.edu).filter(u => !filters.islamic || u.islamic_qualification === filters.islamic).filter(u => !filters.native || u.native_place === filters.native).filter(u => !filters.marital || u.marital_status === filters.marital);

  const allIncomes = globalTxns.filter(t => t.donation_type !== 'EXPENSE');
  const allExpenses = globalTxns.filter(t => t.donation_type === 'EXPENSE');


  const searchQ = finSearchQuery.toLowerCase();
  const searchFilter = (t) => {
    if (!finSearchQuery) return true;
    const strTxnId = t.transaction_id ? String(t.transaction_id) : '';
    return t.full_name?.toLowerCase().includes(searchQ) || strTxnId.toLowerCase().includes(searchQ) || t.reason?.toLowerCase().includes(searchQ);
  };
  const filteredIncomes = allIncomes.filter(searchFilter).sort((a,b)=> new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  const filteredExpensesList = allExpenses.filter(searchFilter).sort((a,b)=> new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());


  const pendingDuesList = directory.filter(u => !u.is_core_admin && (u.role === 'MEMBER' || u.role === 'ADMIN') && u.membership_status === 'ACTIVE').map(u => {
    const joinDate = u.join_date ? new Date(u.join_date) : new Date(); 
    let startDate = joinDate;
    if (subStartMonth) { const systemStart = new Date(`${subStartMonth}-01`); if (systemStart > joinDate) startDate = systemStart; }
    const currentDate = new Date();
    
    const rawMonths = ((currentDate.getFullYear() - startDate.getFullYear()) * 12) + (currentDate.getMonth() - startDate.getMonth()) + 1;
    const monthsSinceJoined = Math.max(0, rawMonths); 
    const totalPaid = parseInt(u.total_months_paid) || 0; 
    const dues = Math.max(0, monthsSinceJoined - totalPaid);
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
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'members', selectedDetailUser.official_id), editFormData);
      alert('Details updated in Firebase!'); setIsEditingUser(false); setSelectedDetailUser(null); fetchData();
    } catch (e) { alert('Error updating user: ' + e.message); } finally { setIsSubmitting(false); }
  };

  const resetUserPasswordAdmin = async () => {
    try { await updateDoc(doc(db, 'members', selectedDetailUser.official_id), { password: 'Hiywa@123' }); alert('Password reset to default: Hiywa@123'); setResetModalVisible(false); } catch (error) { alert('Connection error.'); }
  };


  const uploadPhotoForUser = async (officialId) => {
    if (Platform.OS !== 'web') { const p = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (p.granted === false) return alert("Gallery permission required!"); }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6, width: 400, height: 400, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try { await updateDoc(doc(db, 'members', officialId), { profile_photo: b64 }); alert('Photo uploaded & compressed!'); setSelectedDetailUser({...selectedDetailUser, profile_photo: b64}); fetchData(); } catch (e) { alert('Error saving photo.'); }
    }
  };


  const submitCashPayment = async () => {
    if (!cashAmount || isNaN(cashAmount) || Number(cashAmount) <= 0) return alert('Enter valid amount.');
    
    // Safety check for future subscriptions
    const isSubsDisabled = !subStartMonth || (new Date(`${subStartMonth}-01`) > new Date());
    if (cashType === 'SUBSCRIPTION' && isSubsDisabled) return alert('Subscription tracking is not currently active.');

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

  const handleMasterDatabaseReset = async () => {
     if (!masterResetPassword) return alert('Please enter the admin password in the text box below.');
     setIsSubmitting(true);
     try {
       const adminSnap = await getDoc(doc(db, 'members', currentUser.official_id));
       if (!adminSnap.exists() || adminSnap.data().password !== masterResetPassword) {
          setIsSubmitting(false);
          return alert('Incorrect admin password! Reset aborted.');
       }
       setMasterResetModal(false);
       setMasterResetPassword('');
       executeWipe(); 
     } catch(e) { 
       setIsSubmitting(false);
       alert('Verification failed: ' + e.message); 
     }
  };

  const executeWipe = async () => {
    setIsSubmitting(true);
    try {
      const membersSnap = await getDocs(collection(db, 'members'));
      let deletedMembers = 0;
      for (const docSnap of membersSnap.docs) {
        if (docSnap.data().is_core_admin === true) {
           // CRITICAL FIX: Reset the Core Admin's paid months back to 0 so they don't carry over!
           await updateDoc(doc(db, 'members', docSnap.id), { total_months_paid: 0 });
           continue; 
        }
        await deleteDoc(doc(db, 'members', docSnap.id));
        deletedMembers++;
      }

      const txnsSnap = await getDocs(collection(db, 'transactions'));
      let deletedTxns = 0;
      for (const docSnap of txnsSnap.docs) {
        await deleteDoc(doc(db, 'transactions', docSnap.id));
        deletedTxns++;
      }

      const campsSnap = await getDocs(collection(db, 'campaigns'));
      let deletedCamps = 0;
      for (const docSnap of campsSnap.docs) {
        await deleteDoc(doc(db, 'campaigns', docSnap.id));
        deletedCamps++;
      }

      alert(`Reset Complete!\n• Deleted Members/Students: ${deletedMembers}\n• Deleted Transactions: ${deletedTxns}\n• Deleted Campaigns: ${deletedCamps}`);
      fetchData();
    } catch (error) {
      alert("Reset failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUserDetail = () => {
    const u = selectedDetailUser;
    const isPromotedSubAdmin = u.role === 'ADMIN' && !u.is_core_admin;
    const age = u.dob ? (new Date().getFullYear() - new Date(u.dob).getFullYear()) : 'Unknown';

    if (isEditingUser) {
      const formattedDob = editFormData.dob ? (() => { try { const d = new Date(editFormData.dob); return isNaN(d) ? editFormData.dob : d.toISOString().split('T')[0]; } catch(e){ return editFormData.dob; }})() : '';
      const displayAadhaar = editFormData.aadhaar_number || editFormData.aadhar_number || '';
      const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editFormData.class_grade);

      const handleCancelEdit = () => {
        const isChanged = Object.keys(editFormData).some(key => editFormData[key] !== selectedDetailUser[key]);
        if (!isChanged) return setIsEditingUser(false);
        confirmAction("Discard Changes?", "Are you sure you want to go back? Any unsaved changes will be lost.", () => setIsEditingUser(false), "Discard", true);
      };

      const wrapStyle = { flex: 1, minWidth: 260 }; 

      return (
        <View style={styles.formCard}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 16}}>
            <TouchableOpacity style={styles.neatBtnDark} onPress={handleCancelEdit}><Text style={styles.neatBtnTextDark}>← Back</Text></TouchableOpacity>
            <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Edit {u.full_name}</Text>
          </View>

          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity onPress={() => uploadPhotoForUser(u.official_id)}>
              {editFormData.profile_photo ? <Image source={{uri: editFormData.profile_photo}} style={{width: 100, height: 100, borderRadius: 50}} /> : <View style={{width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center'}}><Text>📷 Photo</Text></View>}
              <Text style={{color: '#004085', fontWeight: '800', marginTop: 8, textAlign: 'center'}}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, {fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginTop: 10}]}>Personal Details</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, zIndex: 100 }}>
            <View style={wrapStyle}><Text style={styles.label}>Full Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.full_name || ''} onChangeText={t=>setEditFormData({...editFormData, full_name: t})} /></View>
            <View style={wrapStyle}><Text style={styles.label}>Father's Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.father_name || ''} onChangeText={t=>setEditFormData({...editFormData, father_name: t})} /></View>
            <View style={wrapStyle}><Text style={styles.label}>Mother's Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.mother_name || ''} onChangeText={t => setEditFormData({...editFormData, mother_name: t})} /></View>
            <FormDropdown label="Parents Status" value={editFormData.parents_status} options={['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED']} placeholder="SELECT STATUS" onSelect={v => setEditFormData({...editFormData, parents_status: v})} />
            <FormDropdown label="Gender" value={editFormData.gender} options={GENDERS} placeholder="SELECT GENDER" onSelect={v => setEditFormData({...editFormData, gender: v})} />
            <View style={wrapStyle}><Text style={styles.label}>Date of Birth</Text>{Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formattedDob} onChange={(e) => setEditFormData({...editFormData, dob: e.target.value})} /> : <TextInput style={styles.input} value={formattedDob} onChangeText={t=>setEditFormData({...editFormData, dob: t})} placeholder="YYYY-MM-DD" />}</View>
            <FormDropdown label="Blood Group" value={editFormData.blood_group} options={BLOOD_GROUPS} placeholder="SELECT BLOOD GROUP" onSelect={v => setEditFormData({...editFormData, blood_group: v})} />
            <FormDropdown label="Marital Status" value={editFormData.marital_status} options={MARITAL_STATUS} placeholder="SELECT STATUS" onSelect={v => setEditFormData({...editFormData, marital_status: v})} />
            <View style={wrapStyle}><Text style={styles.label}>Aadhaar Number</Text><TextInput style={styles.input} value={displayAadhaar} onChangeText={t=>setEditFormData({...editFormData, aadhaar_number: t})} keyboardType="numeric" maxLength={12} placeholder="Aadhaar Number" /></View>
          </View>

          <Text style={[styles.sectionTitle, {fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginTop: 24}]}>Contact & Location</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, zIndex: 90 }}>
            <View style={wrapStyle}><Text style={styles.label}>Phone Number</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={editFormData.phone_number || ''} onChangeText={t=>setEditFormData({...editFormData, phone_number: t})} /></View>
            <View style={wrapStyle}><Text style={styles.label}>WhatsApp Number</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={10} value={editFormData.whatsapp_number || ''} onChangeText={t=>setEditFormData({...editFormData, whatsapp_number: t})} /></View>
            <View style={wrapStyle}><Text style={styles.label}>Email</Text><TextInput style={styles.input} autoCapitalize="none" value={editFormData.email || ''} onChangeText={t=>setEditFormData({...editFormData, email: t})} /></View>
            <FormDropdown label="Native Place" value={editFormData.native_place} options={NATIVE_PLACES} placeholder="SELECT NATIVE PLACE" onSelect={v => setEditFormData({...editFormData, native_place: v})} />
            <View style={wrapStyle}><Text style={styles.label}>Current Location</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.current_location || ''} onChangeText={t=>setEditFormData({...editFormData, current_location: t})} /></View>
            <View style={{width: '100%'}}><Text style={styles.label}>Full Address</Text><TextInput style={[styles.input, {height: 60}]} multiline autoCapitalize="characters" value={editFormData.address || ''} onChangeText={t=>setEditFormData({...editFormData, address: t})} /></View>
          </View>

          <Text style={[styles.sectionTitle, {fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginTop: 24}]}>Education & Occupation</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, zIndex: 80 }}>
            {(editFormData.role === 'MEMBER' || editFormData.role === 'ADMIN') && (
              <>
                <FormDropdown label="Education Category" value={editFormData.educational_qualification} options={EDU_CATEGORIES} placeholder="SELECT EDUCATION" onSelect={v => setEditFormData({...editFormData, educational_qualification: v})} />
                <View style={wrapStyle}><Text style={styles.label}>Course / Major</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} /></View>
                <View style={wrapStyle}><Text style={styles.label}>Occupation / Job</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.occupation || ''} onChangeText={t=>setEditFormData({...editFormData, occupation: t})} /></View>
              </>
            )}
            {editFormData.role === 'STUDENT' && (
              <>
                <FormDropdown label="Class / Grade" value={editFormData.class_grade} options={CLASSES} isScrollable={true} placeholder="SELECT CLASS" onSelect={v => setEditFormData({...editFormData, class_grade: v})} />
                <View style={wrapStyle}><Text style={styles.label}>School / College Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.school_name || ''} onChangeText={t=>setEditFormData({...editFormData, school_name: t})} /></View>
                <FormDropdown label="Institution Type" value={editFormData.school_type} options={isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES} placeholder="SELECT TYPE" onSelect={v => setEditFormData({...editFormData, school_type: v})} />
                <View style={wrapStyle}><Text style={styles.label}>Institution Location</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.school_location || ''} onChangeText={t=>setEditFormData({...editFormData, school_location: t})} /></View>
                <FormDropdown label="Medium of Instruction" value={editFormData.medium_of_instruction} options={MEDIUMS} placeholder="SELECT MEDIUM" onSelect={v => setEditFormData({...editFormData, medium_of_instruction: v})} />
                {isCollegeEdit && (
                  <>
                    <FormDropdown label="Education Category" value={editFormData.educational_qualification} options={EDU_CATEGORIES} placeholder="SELECT CATEGORY" onSelect={v => setEditFormData({...editFormData, educational_qualification: v})} />
                    <View style={wrapStyle}><Text style={styles.label}>Course / Major Details</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.course_details || ''} onChangeText={t=>setEditFormData({...editFormData, course_details: t})} /></View>
                  </>
                )}
              </>
            )}
          </View>

          <View style={{ zIndex: 75, marginTop: 24 }}>
            <Text style={[styles.sectionTitle, {fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8}]}>Islamic Studies</Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
               <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='YES' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'YES'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='YES' && {color:'white'}]}>Yes</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.filterChip, editFormData.islamic_studies==='NO' && styles.filterChipActive]} onPress={()=>setEditFormData({...editFormData, islamic_studies: 'NO'})}><Text style={[styles.filterChipText, editFormData.islamic_studies==='NO' && {color:'white'}]}>No</Text></TouchableOpacity>
            </View>
          </View>

          {editFormData.islamic_studies === 'YES' && (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 70}}>
              <FormDropdown label="Qualification" value={editFormData.islamic_qualification} options={ISLAMIC_QUALS} placeholder="SELECT QUALIFICATION" onSelect={v => setEditFormData({...editFormData, islamic_qualification: v})} />
              {editFormData.islamic_qualification === 'OTHERS' && <View style={wrapStyle}><Text style={styles.label}>Specify Other</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.islamic_qualification || ''} onChangeText={t=>setEditFormData({...editFormData, islamic_qualification: t})} /></View>}
              <View style={wrapStyle}><Text style={styles.label}>Madrasa Name</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.madrasa_name || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_name: t})} /></View>
              <View style={wrapStyle}><Text style={styles.label}>Madrasa Location</Text><TextInput style={styles.input} autoCapitalize="characters" value={editFormData.madrasa_location || ''} onChangeText={t=>setEditFormData({...editFormData, madrasa_location: t})} /></View>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 32 }}><TouchableOpacity style={[styles.neatBtnSuccess, { paddingHorizontal: 32, paddingVertical: 14 }]} onPress={saveEditedUser} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={[styles.neatBtnText, { fontSize: 15 }]}>💾 Save All Details</Text>}</TouchableOpacity></View>
        </View>
      );
    }

    return (
      <View style={styles.formCard}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0'}}>
          <TouchableOpacity style={styles.neatBtnDark} onPress={() => setSelectedDetailUser(null)}><Text style={styles.neatBtnTextDark}>← Back to List</Text></TouchableOpacity>
          <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => {setEditFormData(u); setIsEditingUser(true);}}><Text style={styles.neatBtnText}>✏️ Edit Profile</Text></TouchableOpacity>
        </View>

        <View style={{flexDirection: 'row', gap: 24, flexWrap: 'wrap'}}>
          <View style={{alignItems: 'center', marginBottom: 15}}>
             {u.profile_photo ? ( <Image source={{uri: u.profile_photo}} style={{width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: '#F8FAFC'}} /> ) : ( <View style={{width: 150, height: 150, borderRadius: 75, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center'}}><Text style={{fontSize: 50}}>👤</Text></View> )}
             <TouchableOpacity style={{marginTop: 10}} onPress={() => uploadPhotoForUser(u.official_id)}><Text style={{color: '#0056b3', fontWeight: '900'}}>Change Photo</Text></TouchableOpacity>
          </View>

          <View style={{flex: 1, minWidth: 250}}>
             <Text style={{fontSize: 22, fontWeight: '900', color: '#004085', marginBottom: 2, textTransform: 'uppercase'}}>{u.full_name} {u.is_core_admin && '👑'} {isPromotedSubAdmin && '⭐'}</Text>
             <Text style={{fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 4}}>S/O {u.father_name || 'N/A'} & {u.mother_name || 'N/A'}</Text>
             <Text style={{fontSize: 13, color: '#64748B', marginBottom: 16, fontWeight: '500'}}>Official ID: <Text style={{fontWeight: '800', color: '#004085'}}>{u.official_id}</Text></Text>
             
             <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24}}>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Status: {u.membership_status}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Role: {u.role}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Age: {age}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Gender: {u.gender || 'N/A'}</Text></View>
               <View style={styles.infoBadge}><Text style={styles.infoBadgeTxt}>Blood: {u.blood_group || 'N/A'}</Text></View>
             </View>

             <View style={{backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16}}>
                <Text style={{fontWeight: '900', marginBottom: 12, color: '#004085', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 6}}>Personal Information</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>DOB:</Text> {u.dob}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Aadhaar Number:</Text> {u.aadhaar_number}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Parents Status:</Text> {u.parents_status}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Marital Status:</Text> {u.marital_status || 'N/A'}</Text>
             </View>

             <View style={{backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16}}>
                <Text style={{fontWeight: '900', marginBottom: 12, color: '#004085', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 6}}>Contact & Location</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Primary Mobile:</Text> {u.phone_number}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>WhatsApp:</Text> {u.whatsapp_number}</Text>
                {u.role === 'STUDENT' && <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Student Mobile:</Text> {u.student_mobile}</Text>}
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Email:</Text> {u.email}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Native Place:</Text> {u.native_place}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Current City:</Text> {u.current_location}</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Full Address:</Text> {u.address}</Text>
             </View>

             <View style={{backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16}}>
                <Text style={{fontWeight: '900', marginBottom: 12, color: '#004085', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 6}}>Education & Occupation</Text>
                {(u.role === 'MEMBER' || u.role === 'ADMIN') && (
                  <>
                    <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Education Category:</Text> {u.educational_qualification}</Text>
                    <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Course/Major:</Text> {u.course_details}</Text>
                    <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Occupation/Job:</Text> {u.occupation}</Text>
                  </>
                )}
                {u.role === 'STUDENT' && (
                  <>
                    <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Class/Grade:</Text> {u.class_grade}</Text>
                    <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Institution:</Text> {u.school_name} ({u.school_type})</Text>
                    <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Institution Location:</Text> {u.school_location}</Text>
                    <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Medium:</Text> {u.medium_of_instruction}</Text>
                  </>
                )}
             </View>

             <View style={{backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0'}}>
                <Text style={{fontWeight: '900', marginBottom: 12, color: '#004085', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 6}}>Islamic Background</Text>
                <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Status:</Text> {u.islamic_studies === 'YES' ? 'Completed/Pursuing' : 'No'}</Text>
                {u.islamic_studies === 'YES' && (
                  <>
                    <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Qualification:</Text> {u.islamic_qualification}</Text>
                    <Text style={styles.detailTxt}><Text style={{fontWeight: '700', color: '#1E293B'}}>Madrasa:</Text> {u.madrasa_name} ({u.madrasa_location})</Text>
                  </>
                )}
             </View>
          </View>
        </View>

        <View style={{marginTop: 30, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9'}}>
           <Text style={{fontWeight: '900', fontSize: 18, marginBottom: 16, color: '#004085'}}>Administrative Actions</Text>
           <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
             {hasPerm('MANAGE_FINANCE') && u.role !== 'STUDENT' && u.membership_status === 'ACTIVE' && ( <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FEF08A'}]} onPress={() => {
                const isSubsDisabled = !subStartMonth || (new Date(`${subStartMonth}-01`) > new Date());
                setCashUser(u); 
                setCashType(isSubsDisabled ? 'GENERAL' : 'SUBSCRIPTION'); 
                setCashMonths('1'); 
                setCashAmount(isSubsDisabled ? '' : String(Number(subAmount || 0))); 
                setCashModalVisible(true);
             }}><Text style={[styles.actionBtnText, {color: '#004085'}]}>💵 Log Cash</Text></TouchableOpacity> )}
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
                <View style={[styles.statBoxLarge, {backgroundColor: '#3B82F6'}]}><Text style={styles.statLargeVal}>{directory.filter(u=>u.role==='STUDENT').length}</Text><Text style={styles.statLargeKey}>Total Students</Text></View>
                <View style={[styles.statBoxLarge, { backgroundColor: '#10B981' }]}><Text style={styles.statLargeVal}>{directory.filter(u=>!u.is_core_admin).length}</Text><Text style={styles.statLargeKey}>Grand Total</Text></View>
              </View>

              {/* RESPONSIVE GRAPH DASHBOARD */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 24, width: '100%' }}>
                <View style={styles.chartCard}>
                  <Text style={styles.sectionTitle}>📍 Native Place</Text>
                  {renderBarChart(stats.native, '#0EA5E9')}
                </View>
                <View style={styles.chartCard}>
                  <Text style={styles.sectionTitle}>🚻 Gender</Text>
                  {renderBarChart(stats.gender, '#8B5CF6')}
                </View>
                <View style={styles.chartCard}>
                  <Text style={styles.sectionTitle}>🩸 Blood Groups</Text>
                  {renderBarChart(stats.bloodGroups, '#EF4444')}
                </View>
                <View style={styles.chartCard}>
                  <Text style={styles.sectionTitle}>🎓 Education</Text>
                  {renderBarChart(stats.education, '#F59E0B')}
                </View>
              </View>
            </View>
          )}


          {(activeTab === 'USERS' || activeTab === 'STUDENTS') && (
            <>
              {/* ACTION ROW: SEARCH & ADD MEMBER (MOBILE RESPONSIVE) */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%', gap: 12 }}>
                
                {/* SLEEK SEARCH BAR (FLEXIBLE WIDTH) */}
                <View style={{ flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, height: 44 }}>
                  <Text style={{ fontSize: 16, color: '#94A3B8', marginRight: 10 }}>🔍</Text>
                  <TextInput 
                    style={{ flex: 1, fontSize: 14, color: '#004085', fontWeight: '500', outline: 'none' }} 
                    placeholder="Search Name or ID..." 
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    value={searchQuery} 
                    onChangeText={setSearchQuery} 
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                      <Text style={{ fontSize: 16, color: '#94A3B8', fontWeight: '800' }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ADD BUTTON */}
                <TouchableOpacity style={[styles.neatBtnSuccess, { height: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10 }]} onPress={() => onNavigate('adminRegister', activeTab === 'STUDENTS' ? 'STUDENT' : 'MEMBER')}>
                  <Text style={[styles.neatBtnText, { fontSize: 13 }]}>+ Add {activeTab === 'STUDENTS' ? 'Student' : 'Member'}</Text>
                </TouchableOpacity>

              </View>


              {loading ? <ActivityIndicator size="large" /> : filteredDirectory.map((item) => (
                 <TouchableOpacity key={item.official_id} style={styles.adminCard} onPress={() => setSelectedDetailUser(item)}>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {item.profile_photo ? <Image source={{uri: item.profile_photo}} style={{width: 50, height: 50, borderRadius: 12, marginRight: 15}} /> : <View style={{width: 50, height: 50, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15}}><Text style={{fontSize: 20}}>👤</Text></View>}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adminCardTitle}>{item.full_name} {item.role === 'STUDENT' ? '🎓' : ''} {item.role === 'ADMIN' ? (item.is_core_admin ? '👑' : '⭐') : ''}</Text>
                        
                        {/* CLEANED UP SUB-DETAILS (ONLY S/O AND NATIVE PLACE) */}
                        <Text style={[styles.adminCardMeta, { fontSize: 12, marginBottom: 0 }]}>
                          S/O {item.father_name || 'N/A'}  •  📍 {item.native_place || 'N/A'}
                        </Text>
                        
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: item.membership_status === 'ACTIVE' ? '#10B981' : '#F87171' }]}><Text style={styles.badgeText}>{item.membership_status}</Text></View>
                   </View>
                 </TouchableOpacity>
              ))}
            </>
          )}


          {activeTab === 'FINANCE' && (
            <View>
              {/* TOP HEADER & BUTTONS */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Finance Ledger</Text>
                <View style={{flexDirection: 'row', gap: 12, flexWrap: 'wrap'}}>
                   <TouchableOpacity style={styles.neatBtnDark} onPress={() => setShowDuesModal(true)}>
                      <Text style={styles.neatBtnTextDark}>⏳ Pending Dues</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => setExpenseModalVisible(true)}>
                      <Text style={styles.neatBtnText}>+ Log Expense</Text>
                   </TouchableOpacity>
                </View>
              </View>

              {/* TOP STATS */}
              <View style={styles.statGrid}>
                <View style={[styles.statBoxLarge, {backgroundColor: '#10B981'}]}><Text style={styles.statLargeVal}>₹{(totalIncomeVal + Number(initialAmount)).toLocaleString()}</Text><Text style={styles.statLargeKey}>Total Income</Text></View>
                <View style={[styles.statBoxLarge, {backgroundColor: '#EF4444'}]}><Text style={styles.statLargeVal}>₹{totalExpenseVal.toLocaleString()}</Text><Text style={styles.statLargeKey}>Total Expense</Text></View>
                <View style={styles.statBoxLarge}><Text style={styles.statLargeVal}>₹{currentBalance.toLocaleString()}</Text><Text style={styles.statLargeKey}>Current Balance</Text></View>
              </View>

              {/* SEARCH BAR */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, height: 44, marginTop: 24, marginBottom: 24 }}>
                 <Text style={{ fontSize: 16, color: '#94A3B8', marginRight: 10 }}>🔍</Text>
                 <TextInput style={{ flex: 1, fontSize: 14, color: '#004085', fontWeight: '500', outline: 'none' }} placeholder="Search Transactions or Names..." placeholderTextColor="#94A3B8" autoCapitalize="characters" value={finSearchQuery} onChangeText={setFinSearchQuery} />
                 {finSearchQuery.length > 0 && <TouchableOpacity onPress={() => setFinSearchQuery('')} style={{ padding: 4 }}><Text style={{ fontSize: 16, color: '#94A3B8', fontWeight: '800' }}>✕</Text></TouchableOpacity>}
              </View>

              {/* TOGGLE TABS */}
              <View style={[styles.tabContainer, {marginTop: 0, marginBottom: 16}]}>
                <TouchableOpacity style={[styles.tabBtn, ledgerTab === 'INCOME' && styles.tabBtnActive]} onPress={() => setLedgerTab('INCOME')}>
                   <Text style={[styles.tabBtnText, ledgerTab === 'INCOME' && styles.tabBtnTextActive]}>Income Transactions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, ledgerTab === 'EXPENSE' && styles.tabBtnActive]} onPress={() => setLedgerTab('EXPENSE')}>
                   <Text style={[styles.tabBtnText, ledgerTab === 'EXPENSE' && styles.tabBtnTextActive]}>Expense Transactions</Text>
                </TouchableOpacity>
              </View>

              {/* INCOME TRANSACTIONS LIST */}
              {ledgerTab === 'INCOME' && (
                <View style={[styles.formCard, {marginBottom: 32}]}>
                   {loading ? <ActivityIndicator /> : filteredIncomes.length === 0 ? <Text style={{color: '#64748B'}}>No incomes found.</Text> : filteredIncomes.map((txn, index) => (
                     <View key={txn.transaction_id || index} style={styles.historyRow}>
                       <View style={{ flex: 1, marginRight: 10 }}>
                         <Text style={{ fontWeight: '800', color: '#004085', fontSize: 16 }}>{txn.full_name}</Text>
                         <Text style={styles.historyDetails}>{txn.donation_type === 'FUND_RAISING' ? 'CAMPAIGN' : txn.donation_type}: {txn.reason}</Text>
                         <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} | {txn.payment_method}</Text>
                       </View>
                       <View style={{ alignItems: 'flex-end' }}>
                         <Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981', marginBottom: 8 }}>+ ₹{txn.amount}</Text>
                         <TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity>
                       </View>
                     </View>
                   ))}
                </View>
              )}

              {/* EXPENSE TRANSACTIONS LIST */}
              {ledgerTab === 'EXPENSE' && (
                <View style={[styles.formCard, {marginBottom: 32}]}>
                   {loading ? <ActivityIndicator /> : filteredExpensesList.length === 0 ? <Text style={{color: '#64748B'}}>No expenses found.</Text> : filteredExpensesList.map((txn, index) => (
                     <View key={txn.transaction_id || index} style={styles.historyRow}>
                       <View style={{ flex: 1, marginRight: 10 }}>
                         <Text style={{ fontWeight: '800', color: '#004085', fontSize: 16 }}>{txn.reason}</Text>
                         <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} | Logged by: {txn.full_name}</Text>
                       </View>
                       <View style={{ alignItems: 'flex-end' }}>
                         <Text style={{ fontSize: 18, fontWeight: '800', color: '#EF4444', marginBottom: 8 }}>- ₹{txn.amount}</Text>
                       </View>
                     </View>
                   ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'REPORTS' && (
            <View>
              <Text style={styles.sectionTitle}>Reports & Exports</Text>
              
              {/* TOGGLE TABS */}
              <View style={[styles.tabContainer, {marginTop: 0, marginBottom: 24}]}>
                <TouchableOpacity style={[styles.tabBtn, repType === 'DIRECTORY' && styles.tabBtnActive]} onPress={() => setRepType('DIRECTORY')}>
                  <Text style={[styles.tabBtnText, repType === 'DIRECTORY' && styles.tabBtnTextActive]}>Directory Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, repType === 'FINANCE' && styles.tabBtnActive]} onPress={() => setRepType('FINANCE')}>
                  <Text style={[styles.tabBtnText, repType === 'FINANCE' && styles.tabBtnTextActive]}>Finance Report</Text>
                </TouchableOpacity>
              </View>

              {/* DIRECTORY FILTERS */}
              {repType === 'DIRECTORY' && (
                <View style={styles.formCard}>
                  <Text style={[styles.sectionTitle, {fontSize: 15}]}>Directory Filters</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, zIndex: 100 }}>
                    <FilterDropdown label="Role" value={repRole} options={['MEMBER', 'STUDENT', 'ADMIN']} onSelect={setRepRole} />
                    <FilterDropdown label="Status" value={repStatus} options={['ACTIVE', 'INACTIVE', 'DECEASED']} onSelect={setRepStatus} />
                    <FilterDropdown label="Blood Group" value={repBlood} options={BLOOD_GROUPS} onSelect={setRepBlood} />
                    <FilterDropdown label="Gender" value={repGender} options={GENDERS} onSelect={setRepGender} />
                  </View>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 20}}>
                     <View>
                       {(repRole || repStatus || repBlood || repGender) ? (
                         <Text style={{fontWeight: '500', fontSize: 12, color: '#64748B'}}>Matches: {filteredRepDir.length} Records</Text>
                       ) : <View />}
                     </View>
                     <View style={{flexDirection: 'row', gap: 12}}>
                       <TouchableOpacity style={styles.neatBtnDark} onPress={() => { setRepRole(''); setRepStatus(''); setRepBlood(''); setRepGender(''); }}><Text style={styles.neatBtnTextDark}>Clear Filters</Text></TouchableOpacity>
                       <TouchableOpacity style={styles.neatBtnSuccess} onPress={exportDirectory}><Text style={styles.neatBtnText}>📥 Export CSV</Text></TouchableOpacity>
                     </View>
                  </View>
                </View>
              )}

              {/* FINANCE FILTERS */}
              {repType === 'FINANCE' && (
                <View style={styles.formCard}>
                   <Text style={[styles.sectionTitle, {fontSize: 15}]}>Finance Filters</Text>
                   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, alignItems: 'center', zIndex: 100 }}>
                     <FilterDropdown label="Type" value={repFinType} options={['SUBSCRIPTION', 'GENERAL', 'EXPENSE', 'FUND_RAISING']} onSelect={setRepFinType} />
                     <View style={{ flex: 1, minWidth: 130 }}>
                       <Text style={{ fontSize: 10, fontWeight: '800', color: '#004085', marginBottom: 4, textTransform: 'uppercase' }}>Start Date</Text>
                       {Platform.OS === 'web' ? <input type="date" style={{...webDateStyle, marginBottom: 0, height: 42, padding: 8, fontSize: 12}} value={repStartDate} onChange={e => setRepStartDate(e.target.value)} /> : <TextInput style={[styles.input, {marginBottom: 0, height: 42, fontSize: 12}]} placeholder="YYYY-MM-DD" value={repStartDate} onChangeText={setRepStartDate} />}
                     </View>
                     <View style={{ flex: 1, minWidth: 130 }}>
                       <Text style={{ fontSize: 10, fontWeight: '800', color: '#004085', marginBottom: 4, textTransform: 'uppercase' }}>End Date</Text>
                       {Platform.OS === 'web' ? <input type="date" style={{...webDateStyle, marginBottom: 0, height: 42, padding: 8, fontSize: 12}} value={repEndDate} onChange={e => setRepEndDate(e.target.value)} /> : <TextInput style={[styles.input, {marginBottom: 0, height: 42, fontSize: 12}]} placeholder="YYYY-MM-DD" value={repEndDate} onChangeText={setRepEndDate} />}
                     </View>
                   </View>
                   <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 20}}>
                     <View>
                       {(repFinType || repStartDate || repEndDate) ? (
                         <Text style={{fontWeight: '500', fontSize: 12, color: '#64748B'}}>Matches: {filteredRepFin.length} Transactions</Text>
                       ) : <View />}
                     </View>
                     <View style={{flexDirection: 'row', gap: 12}}>
                       <TouchableOpacity style={styles.neatBtnDark} onPress={() => { setRepFinType(''); setRepStartDate(''); setRepEndDate(''); }}>
                         <Text style={styles.neatBtnTextDark}>Clear Filters</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.neatBtnSuccess} onPress={exportFinance}>
                         <Text style={styles.neatBtnText}>📥 Export CSV</Text>
                       </TouchableOpacity>
                     </View>
                  </View>
                </View>
              )}

              {/* LIVE REPORTS PREVIEW */}
              <View style={[styles.formCard, {marginTop: 24, padding: 0, overflow: 'hidden'}]}>
                <View style={{backgroundColor: '#004085', padding: 16}}>
                   <Text style={{color: 'white', fontWeight: '800', fontSize: 16}}>Data Preview (Recent 10 Entries)</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{padding: 16}}>
                  <View style={{flexDirection: 'column', minWidth: repType === 'DIRECTORY' ? 1800 : 800}}>
                    {/* Header Row */}
                    <View style={{flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#E2E8F0', paddingBottom: 10, marginBottom: 10}}>
                       {repType === 'DIRECTORY' ? (
                         <>
                           <Text style={{width: 120, fontWeight: '800', color: '#475569', fontSize: 12}}>ID</Text>
                           <Text style={{width: 180, fontWeight: '800', color: '#475569', fontSize: 12}}>Name</Text>
                           <Text style={{width: 100, fontWeight: '800', color: '#475569', fontSize: 12}}>Role</Text>
                           <Text style={{width: 100, fontWeight: '800', color: '#475569', fontSize: 12}}>Status</Text>
                           <Text style={{width: 120, fontWeight: '800', color: '#475569', fontSize: 12}}>Phone</Text>
                           <Text style={{width: 60, fontWeight: '800', color: '#475569', fontSize: 12}}>Age</Text>
                           <Text style={{width: 100, fontWeight: '800', color: '#475569', fontSize: 12}}>Blood</Text>
                           <Text style={{width: 150, fontWeight: '800', color: '#475569', fontSize: 12}}>Native Place</Text>
                           <Text style={{width: 200, fontWeight: '800', color: '#475569', fontSize: 12}}>Education</Text>
                           <Text style={{width: 180, fontWeight: '800', color: '#475569', fontSize: 12}}>Occupation</Text>
                           <Text style={{flex: 1, fontWeight: '800', color: '#475569', fontSize: 12}}>Address</Text>
                         </>
                       ) : (
                         <>
                           <Text style={{width: 160, fontWeight: '800', color: '#475569', fontSize: 12}}>Date</Text>
                           <Text style={{width: 180, fontWeight: '800', color: '#475569', fontSize: 12}}>Name / Reason</Text>
                           <Text style={{width: 120, fontWeight: '800', color: '#475569', fontSize: 12}}>Type</Text>
                           <Text style={{width: 120, fontWeight: '800', color: '#475569', fontSize: 12, textAlign: 'right'}}>Amount</Text>
                         </>
                       )}
                    </View>
                    
                    {/* Data Rows */}
                    {repType === 'DIRECTORY' && filteredRepDir.slice(0, 10).map(u => {
                      const uAge = u.dob ? (new Date().getFullYear() - new Date(u.dob).getFullYear()) : 'N/A';
                      return (
                        <View key={u.official_id} style={{flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'}}>
                           <Text style={{width: 120, color: '#1E293B', fontSize: 12}}>{u.official_id}</Text>
                           <Text style={{width: 180, color: '#1E293B', fontSize: 12, fontWeight: '600'}}>{u.full_name}</Text>
                           <Text style={{width: 100, color: '#1E293B', fontSize: 12}}>{u.role}</Text>
                           <Text style={{width: 100, color: '#1E293B', fontSize: 12}}>{u.membership_status}</Text>
                           <Text style={{width: 120, color: '#1E293B', fontSize: 12}}>{u.phone_number}</Text>
                           <Text style={{width: 60, color: '#1E293B', fontSize: 12}}>{uAge}</Text>
                           <Text style={{width: 100, color: '#1E293B', fontSize: 12}}>{u.blood_group || '-'}</Text>
                           <Text style={{width: 150, color: '#1E293B', fontSize: 12}} numberOfLines={1}>{u.native_place || '-'}</Text>
                           <Text style={{width: 200, color: '#1E293B', fontSize: 12}} numberOfLines={1}>{u.educational_qualification || u.class_grade || '-'}</Text>
                           <Text style={{width: 180, color: '#1E293B', fontSize: 12}} numberOfLines={1}>{u.occupation || '-'}</Text>
                           <Text style={{flex: 1, color: '#1E293B', fontSize: 12}} numberOfLines={1}>{u.address || '-'}</Text>
                        </View>
                      );
                    })}

                    {repType === 'FINANCE' && filteredRepFin.slice(0, 10).map(t => (
                      <View key={t.transaction_id} style={{flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'}}>
                         <Text style={{width: 160, color: '#1E293B', fontSize: 12}}>{new Date(t.transaction_date).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                         <Text style={{width: 180, color: '#1E293B', fontSize: 12, fontWeight: '600'}} numberOfLines={1}>{t.full_name || t.reason}</Text>
                         <Text style={{width: 120, color: '#1E293B', fontSize: 12}}>{t.donation_type}</Text>
                         <Text style={{width: 120, color: t.donation_type === 'EXPENSE' ? '#EF4444' : '#10B981', fontSize: 12, fontWeight: '700', textAlign: 'right'}}>{t.donation_type === 'EXPENSE' ? '-' : '+'} ₹{t.amount}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

            </View>
          )}

          {activeTab === 'SETTINGS' && (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>System Settings Configurations</Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
                 <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('SUB_AMOUNT')}><Text style={styles.neatBtnTextDark}>⚙️ Set Subscription Amount</Text></TouchableOpacity>
                 <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('PRI_UPI')}><Text style={styles.neatBtnTextDark}>⚙️ Set Primary UPI</Text></TouchableOpacity>
                 <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('SEC_UPI')}><Text style={styles.neatBtnTextDark}>⚙️ Set Secondary UPI</Text></TouchableOpacity>
                 <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('INIT_BAL')}><Text style={styles.neatBtnTextDark}>⚙️ Set Initial Balance</Text></TouchableOpacity>
                 <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('PUBLIC_REG')}><Text style={styles.neatBtnTextDark}>⚙️ Set Public Registration Link: {allowPublicReg ? 'ON' : 'OFF'}</Text></TouchableOpacity>
                 <TouchableOpacity style={styles.neatBtnDark} onPress={() => setConfigModal('SUB_START')}><Text style={styles.neatBtnTextDark}>⚙️ Set Subscription Start Month</Text></TouchableOpacity>
                 <TouchableOpacity style={styles.neatBtnDark} onPress={() => setShowSliderModal(true)}><Text style={styles.neatBtnTextDark}>🖼️ Manage Slider Images</Text></TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, {color: '#EF4444', fontSize: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 20}]}>Danger Zone</Text>
              <Text style={{color: '#64748B', fontSize: 13, marginBottom: 16}}>Wipe all operational data, transactions, campaigns, and non-admin users from the database.</Text>
              
              <TouchableOpacity style={[styles.button, {backgroundColor: '#EF4444', maxWidth: 280, marginTop: 0}]} onPress={() => setMasterResetModal(true)} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>⚠️ Reset Entire Database</Text>}
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
                       <View style={{ flex: 1, paddingRight: 10 }}><Text style={{ fontWeight: '800', color: '#004085', fontSize: 16 }}>{txn.full_name}</Text><Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} | {txn.payment_method}</Text></View>
                       <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981', marginBottom: 8 }}>+ ₹{txn.amount}</Text><TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity></View>
                     </View>
                  ))}
                </View>
              ) : (
                <View>
                  <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16}}>
                    <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => { setCampTitle(''); setCampDesc(''); setCampTarget(''); setCashCampId(''); setCashAmount(''); setCampStatus('ACTIVE'); setCashReason(''); setShowCampaignModal(true); }}>
                      <Text style={styles.neatBtnText}>+ Launch Drive</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Live Fund Drives</Text>
                    {loading ? <ActivityIndicator /> : campaigns.filter(c => (c.status === 'ACTIVE' || c.status === 'PAUSED') && (parseFloat(c.raised_amount)||0) < (parseFloat(c.target_amount)||1)).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at)).map(camp => {
                      const raised = parseFloat(camp.raised_amount) || 0; const target = parseFloat(camp.target_amount) || 1; const progress = Math.min(Math.round((raised / target) * 100), 100);
                      return (
                        <View key={camp.campaign_id} style={styles.adminCard}>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}><Text style={[styles.adminCardTitle, { flex: 1, marginRight: 10 }]} numberOfLines={1}>{camp.title}</Text><View style={[styles.statusBadge, { backgroundColor: camp.status === 'PAUSED' ? '#F59E0B' : '#10B981' }]}><Text style={styles.badgeText}>{camp.status}</Text></View></View>
                          <Text style={{ color: '#64748B', marginBottom: 16, fontWeight: '500', lineHeight: 20 }} numberOfLines={2}>{camp.description}</Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Text style={{ fontWeight: '800', color: '#004085' }}>Raised: {'\u20B9'}{raised}</Text><Text style={{ color: '#94A3B8', fontWeight: '700' }}>Goal: {'\u20B9'}{target}</Text></View>
                          <View style={{ height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}><View style={{ width: `${progress}%`, backgroundColor: '#10B981', height: '100%' }} /></View>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12}}>
                             <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
                               <TouchableOpacity style={styles.neatBtnDark} onPress={() => setViewCampDonors(camp)}><Text style={styles.neatBtnTextDark}>👥 Donors</Text></TouchableOpacity>
                               <TouchableOpacity style={styles.neatBtnDark} onPress={() => {setCashCampId(camp.campaign_id); setCampTitle(camp.title); setCampDesc(camp.description); setCampTarget(camp.target_amount); setCashAmount(camp.raised_amount); setCampStatus(camp.status); setCashReason(camp.remarks || ''); setShowCampaignModal(true);}}><Text style={styles.neatBtnTextDark}>👀 View Info</Text></TouchableOpacity>
                               <TouchableOpacity style={styles.neatBtnPrimary} onPress={() => { setCampTitle(camp.title); setCampDesc(camp.description); setCampTarget(camp.target_amount); setCashCampId(camp.campaign_id); setCashAmount(camp.raised_amount); setCampStatus(camp.status); setCashReason(camp.remarks || ''); setShowCampaignModal(true); }}><Text style={styles.neatBtnText}>✏️ Edit</Text></TouchableOpacity>
                             </View>
                             <Text style={{ textAlign: 'right', fontSize: 13, fontWeight: '700', color: '#10B981' }}>{progress}% Funded</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>


                  <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Past / Closed Drives</Text>
                    {loading ? <ActivityIndicator /> : campaigns.filter(c => c.status === 'STOPPED' || (parseFloat(c.raised_amount)||0) >= (parseFloat(c.target_amount)||1)).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at)).map(camp => {
                      const raised = parseFloat(camp.raised_amount) || 0; const target = parseFloat(camp.target_amount) || 1; const progress = Math.min(Math.round((raised / target) * 100), 100);
                      const goalAchieved = raised >= target;
                      return (
                        <View key={camp.campaign_id} style={[styles.adminCard, {backgroundColor: '#F8FAFC'}]}>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}><Text style={[styles.adminCardTitle, { flex: 1, marginRight: 10, color: '#64748B' }]} numberOfLines={1}>{camp.title}</Text><View style={[styles.statusBadge, { backgroundColor: goalAchieved ? '#10B981' : '#EF4444' }]}><Text style={styles.badgeText}>{goalAchieved ? 'GOAL ACHIEVED' : 'STOPPED'}</Text></View></View>
                          {camp.remarks ? <Text style={{ color: '#991B1B', fontWeight: '800', marginBottom: 12, fontSize: 12 }}>REMARKS: {camp.remarks}</Text> : null}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Text style={{ fontWeight: '800', color: '#64748B' }}>Raised: {'\u20B9'}{raised}</Text><Text style={{ color: '#94A3B8', fontWeight: '700' }}>Goal: {'\u20B9'}{target}</Text></View>
                          <View style={{ height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}><View style={{ width: `${progress}%`, backgroundColor: goalAchieved ? '#10B981' : '#94A3B8', height: '100%' }} /></View>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                             <View style={{flexDirection: 'row', gap: 10}}>
                               <TouchableOpacity style={styles.neatBtnDark} onPress={() => setViewCampDonors(camp)}><Text style={styles.neatBtnTextDark}>👥 View Donors</Text></TouchableOpacity>
                             </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}


          {/* ADMIN ROLES TAB */}
          {activeTab === 'ROLES' && (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Admin Rights & Roles</Text>
              {loading ? <ActivityIndicator /> : directory.filter(u => u.role === 'ADMIN').map((admin) => {
                const permsList = admin.is_core_admin ? ['ALL PERMISSIONS'] : JSON.parse(admin.admin_permissions || '[]');
                return (
                  <View key={admin.official_id} style={[styles.historyRow, {flexDirection: 'column', alignItems: 'flex-start'}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between'}}>
                       <View>
                         <Text style={{ fontWeight: '800', color: '#004085', fontSize: 18 }}>{admin.full_name} {admin.is_core_admin ? '👑' : '⭐'}</Text>
                         <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '700', marginTop: 4 }}>ID: {admin.official_id}</Text>
                       </View>
                       <View style={[styles.statusBadge, { backgroundColor: admin.is_core_admin ? '#8B5CF6' : '#3B82F6' }]}><Text style={styles.badgeText}>{admin.is_core_admin ? 'CORE ADMIN' : 'SUB ADMIN'}</Text></View>
                    </View>
                    <View style={{flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap'}}>
                       {permsList.map(p => <View key={p} style={{backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8}}><Text style={{fontSize: 11, fontWeight: '800', color: '#475569'}}>{p}</Text></View>)}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}


      {/* ALL ADMIN MODALS */}
      {configModal && (
        <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#004085', marginBottom: 16 }}>
              {configModal === 'SUB_AMOUNT' ? 'Set Subscription Amount (₹)' : 
               configModal === 'PRI_UPI' ? 'Primary Trust UPI ID' : 
               configModal === 'SEC_UPI' ? 'Secondary Trust UPI ID' : 
               configModal === 'PUBLIC_REG' ? `Turn ${allowPublicReg ? 'OFF' : 'ON'} Public Registration Link?` :
               configModal === 'SUB_START' ? 'Set Subscription Start Month' :
               'Initial Trust Balance (₹)'}
            </Text>

            {configModal !== 'PUBLIC_REG' && (
              Platform.OS === 'web' && configModal === 'SUB_START' ? (
                <input type="month" style={{...webDateStyle, marginBottom: 16}} value={subStartMonth} onChange={e => setSubStartMonth(e.target.value)} />
              ) : (
                <TextInput 
                  style={styles.input} 
                  autoCapitalize="none"
                  keyboardType={(configModal === 'SUB_AMOUNT' || configModal === 'INIT_BAL') ? 'numeric' : 'default'}
                  value={
                    configModal === 'SUB_AMOUNT' ? subAmount : 
                    configModal === 'PRI_UPI' ? primaryUpi : 
                    configModal === 'SEC_UPI' ? secondaryUpi : 
                    configModal === 'SUB_START' ? subStartMonth :
                    initialAmount
                  } 
                  onChangeText={(t) => {
                    if (configModal === 'SUB_AMOUNT') setSubAmount(t);
                    else if (configModal === 'PRI_UPI') setPrimaryUpi(t);
                    else if (configModal === 'SEC_UPI') setSecondaryUpi(t);
                    else if (configModal === 'SUB_START') setSubStartMonth(t);
                    else setInitialAmount(t);
                  }} 
                  placeholder={configModal === 'SUB_START' ? "YYYY-MM (e.g. 2026-11)" : ""}
                />
              )
            )}

            <Text style={[styles.label, {marginTop: 4}]}>Admin Password Required *</Text>
            <TextInput style={[styles.input, {marginBottom: 0}]} secureTextEntry={true} placeholder="Enter your password to save" value={configModalPassword || ''} onChangeText={setConfigModalPassword} />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 12 }}>
               <TouchableOpacity style={styles.neatBtnDark} onPress={() => { setConfigModal(null); setConfigModalPassword(''); }}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={styles.neatBtnSuccess} onPress={async () => {
                  if (!configModalPassword) return alert('Admin password is required to save settings.');
                  try {
                     const adminSnap = await getDoc(doc(db, 'members', currentUser.official_id));
                     if (!adminSnap.exists() || adminSnap.data().password !== configModalPassword) return alert('Incorrect admin password!');

                     let updatePayload = {};
                     if (configModal === 'SUB_AMOUNT') updatePayload.monthly_subscription_amount = subAmount;
                     else if (configModal === 'PRI_UPI') updatePayload.primary_upi = primaryUpi;
                     else if (configModal === 'SEC_UPI') updatePayload.secondary_upi = secondaryUpi;
                     else if (configModal === 'PUBLIC_REG') updatePayload.allow_public_registration = !allowPublicReg;
                     else if (configModal === 'SUB_START') updatePayload.subscription_start_month = subStartMonth;
                     else updatePayload.initial_amount = initialAmount;

                     await setDoc(doc(db, 'settings', 'global'), updatePayload, { merge: true }); 
                     alert('Settings updated successfully!'); setConfigModal(null); setConfigModalPassword(''); fetchData(); 
                  } catch(e) { alert('Error updating settings: ' + e.message); }
               }}><Text style={styles.neatBtnText}>Save Setting</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {expenseModalVisible && (
        <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
          <View style={styles.modalCard}>
            <Text style={[styles.sectionTitle, { color: '#EF4444', marginBottom: 24 }]}>Log Trust Expense</Text>
            <Text style={styles.label}>Detailed Reason / Vendor</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="E.g., Charity Donation" value={expenseReason} onChangeText={setExpenseReason} />
            <Text style={styles.label}>Expense Amount (₹)</Text><TextInput style={styles.input} keyboardType="numeric" value={expenseAmount} onChangeText={setExpenseAmount} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setExpenseModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.neatBtnPrimary, {backgroundColor: '#EF4444'}]} onPress={submitExpenseLog}><Text style={styles.neatBtnText}>Log Expense</Text></TouchableOpacity></View>
          </View>
        </View>
      )}

      {cashModalVisible && (
        <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Log Cash Receipt</Text>
            
            <View style={{backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0'}}>
               <Text style={{fontWeight: '900', color: '#004085', fontSize: 16}}>{cashUser?.full_name}</Text>
               <Text style={{fontSize: 12, color: '#64748B', marginTop: 4}}>ID: {cashUser?.official_id} | Paid: {cashUser?.total_months_paid || 0} Months</Text>
            </View>

            <View style={styles.quickSelectContainer}>
              <TouchableOpacity style={[styles.quickBtn, cashType === 'SUBSCRIPTION' && styles.quickBtnActive]} onPress={()=>{ const isSubsDisabled = !subStartMonth || (new Date(`${subStartMonth}-01`) > new Date()); setCashType('SUBSCRIPTION'); setCashAmount(isSubsDisabled ? '' : String(Number(cashMonths || 1) * Number(subAmount || 0)));}}><Text style={[styles.quickBtnText, cashType === 'SUBSCRIPTION' && styles.quickBtnTextActive]}>Subs</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.quickBtn, cashType === 'GENERAL' && styles.quickBtnActive]} onPress={()=>{setCashType('GENERAL'); setCashAmount('');}}><Text style={[styles.quickBtnText, cashType === 'GENERAL' && styles.quickBtnTextActive]}>Gen</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.quickBtn, cashType === 'CAMPAIGN' && styles.quickBtnActive]} onPress={()=>{setCashType('CAMPAIGN'); setCashAmount('');}}><Text style={[styles.quickBtnText, cashType === 'CAMPAIGN' && styles.quickBtnTextActive]}>Camp</Text></TouchableOpacity>
            </View>
            
            {cashType === 'SUBSCRIPTION' && ( 
              <View>
                {(!subStartMonth || new Date(`${subStartMonth}-01`) > new Date()) ? (
                   <Text style={{color: '#EF4444', marginBottom: 24, fontWeight: '800'}}>Subscription tracking is disabled or starts in the future.</Text>
                ) : (
                   <>
                     <Text style={styles.label}>Number of Months</Text>
                     <TextInput style={styles.input} keyboardType="numeric" value={cashMonths} onChangeText={t => {setCashMonths(t); setCashAmount(String(Number(t || 0) * Number(subAmount || 0)));}} />
                   </>
                )}
              </View> 
            )}
            
            {cashType === 'GENERAL' && ( <View><Text style={styles.label}>Reason / Category</Text><TextInput style={styles.input} autoCapitalize="characters" value={cashReason} onChangeText={t => setCashReason(t.toUpperCase())} /></View> )}
            
            {cashType === 'CAMPAIGN' && (
              <View><Text style={styles.label}>Select Active Campaign</Text>
                {campaigns.filter(c => c.status === 'ACTIVE').length === 0 ? (
                   <Text style={{color: '#EF4444', marginBottom: 24, fontWeight: '800'}}>There are no active campaigns available.</Text>
                ) : (
                   <ScrollView style={{maxHeight: 150, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12}}>
                     {campaigns.filter(c => c.status === 'ACTIVE').map(c => ( <TouchableOpacity key={c.campaign_id} style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: cashCampId === c.campaign_id ? '#EFF6FF' : 'white'}} onPress={() => setCashCampId(c.campaign_id)}><Text style={{color: '#004085', fontWeight: cashCampId === c.campaign_id ? '800' : '600'}}>{c.title}</Text></TouchableOpacity> ))}
                   </ScrollView>
                )}
              </View>
            )}
            <Text style={styles.label}>Amount Collected (₹) *</Text>
            <TextInput style={[styles.input, cashType === 'SUBSCRIPTION' && {backgroundColor: '#F1F5F9', color: '#94A3B8'}]} keyboardType="numeric" value={cashAmount} editable={cashType !== 'SUBSCRIPTION' && !(cashType === 'CAMPAIGN' && campaigns.filter(c=>c.status==='ACTIVE').length === 0)} onChangeText={setCashAmount} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setCashModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.neatBtnSuccess} onPress={submitCashPayment}><Text style={styles.neatBtnText}>Generate Receipt</Text></TouchableOpacity></View>
          </View>
        </View>
      )}

      {promoteModalVisible && (
        <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Assign Admin Rights</Text>
            <Text style={{color: '#64748B', fontSize: 12, marginBottom: 20}}>Select specific modules to assign to this sub-admin.</Text>
            
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, MANAGE_USERS: !selectedPerms.MANAGE_USERS})}><View style={[styles.checkbox, selectedPerms.MANAGE_USERS && styles.checkboxActive]}>{selectedPerms.MANAGE_USERS && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Manage Directory</Text></TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, MANAGE_FINANCE: !selectedPerms.MANAGE_FINANCE})}><View style={[styles.checkbox, selectedPerms.MANAGE_FINANCE && styles.checkboxActive]}>{selectedPerms.MANAGE_FINANCE && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Manage Finances</Text></TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, MANAGE_CAMPAIGNS: !selectedPerms.MANAGE_CAMPAIGNS})}><View style={[styles.checkbox, selectedPerms.MANAGE_CAMPAIGNS && styles.checkboxActive]}>{selectedPerms.MANAGE_CAMPAIGNS && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Manage Campaigns</Text></TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedPerms({...selectedPerms, REPORTS_CENTRAL: !selectedPerms.REPORTS_CENTRAL})}><View style={[styles.checkbox, selectedPerms.REPORTS_CENTRAL && styles.checkboxActive]}>{selectedPerms.REPORTS_CENTRAL && <Text style={{color: 'white', fontWeight: 'bold'}}>✓</Text>}</View><Text style={{ fontSize: 15, color: '#004085', fontWeight: '600' }}>Reports Central</Text></TouchableOpacity>
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 32, gap: 12 }}>
               <TouchableOpacity style={styles.neatBtnDark} onPress={() => setPromoteModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={styles.neatBtnPrimary} onPress={async () => {
                 const permsArray = []; 
                 if (selectedPerms.MANAGE_USERS) permsArray.push("MANAGE_USERS"); 
                 if (selectedPerms.MANAGE_FINANCE) permsArray.push("MANAGE_FINANCE"); 
                 if (selectedPerms.MANAGE_CAMPAIGNS) permsArray.push("MANAGE_CAMPAIGNS");
                 if (selectedPerms.REPORTS_CENTRAL) permsArray.push("REPORTS_CENTRAL");
                 try { await updateDoc(doc(db, 'members', promoteUserId), { role: 'ADMIN', admin_permissions: JSON.stringify(permsArray) }); alert('Promoted to Sub-Admin successfully!'); setPromoteModalVisible(false); setSelectedDetailUser(null); fetchData(); } catch (e) { alert('Failed to promote.'); }
               }}><Text style={styles.neatBtnText}>Confirm Promotion</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {resetModalVisible && (
        <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
          <View style={styles.modalCard}>
             <Text style={styles.sectionTitle}>Reset Password</Text>
             <Text style={{ fontSize: 15, color: '#475569', marginBottom: 32, lineHeight: 24, fontWeight: '500' }}>Reset <Text style={{fontWeight: '800', color: '#004085'}}>{selectedDetailUser?.full_name}</Text>'s password to default (<Text style={{fontWeight: '800'}}>Hiywa@123</Text>)?</Text>
             <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => setResetModalVisible(false)}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.neatBtnPrimary, {backgroundColor: '#EF4444'}]} onPress={resetUserPasswordAdmin}><Text style={styles.neatBtnText}>Confirm Reset</Text></TouchableOpacity></View>
          </View>
        </View>
      )}

      {showCampaignModal && (
        <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
          <View style={[styles.modalCard, {maxWidth: 600, width: '90%', maxHeight: '90%', padding: 0, overflow: 'hidden'}]}>
            <ScrollView contentContainerStyle={{padding: 32}}>
              <Text style={styles.sectionTitle}>{cashCampId ? 'Edit / View' : 'Launch'} Fundraiser</Text>
              
              {cashCampId ? (
                <>
                  <Text style={styles.label}>Campaign Status</Text>
                  <View style={{flexDirection: 'row', gap: 10, marginBottom: 16}}>
                    <TouchableOpacity style={[styles.filterChip, campStatus==='ACTIVE' && styles.filterChipActive]} onPress={()=>setCampStatus('ACTIVE')}><Text style={[styles.filterChipText, campStatus==='ACTIVE' && {color:'white'}]}>ACTIVE</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, campStatus==='PAUSED' && styles.filterChipActive]} onPress={()=>setCampStatus('PAUSED')}><Text style={[styles.filterChipText, campStatus==='PAUSED' && {color:'white'}]}>PAUSED</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, campStatus==='STOPPED' && styles.filterChipActive]} onPress={()=>setCampStatus('STOPPED')}><Text style={[styles.filterChipText, campStatus==='STOPPED' && {color:'white'}]}>STOPPED</Text></TouchableOpacity>
                  </View>
                </>
              ) : null}

              <Text style={styles.label}>Campaign Title</Text><TextInput style={styles.input} autoCapitalize="characters" value={campTitle} onChangeText={setCampTitle} />
              <Text style={styles.label}>Description</Text><TextInput style={[styles.input, {height: 80}]} multiline value={campDesc} onChangeText={setCampDesc} />
              <Text style={styles.label}>Target Amount (₹)</Text><TextInput style={styles.input} keyboardType="numeric" value={String(campTarget)} onChangeText={setCampTarget} />
              
              {campStatus === 'STOPPED' || campStatus === 'PAUSED' ? (
                <>
                   <Text style={styles.label}>Remarks / Reason</Text>
                   <TextInput style={styles.input} autoCapitalize="characters" value={cashReason} onChangeText={setCashReason} placeholder="Add reason..." />
                </>
              ) : null}
              
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
                <TouchableOpacity style={styles.neatBtnDark} onPress={() => {setShowCampaignModal(false); setCashCampId('');}}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.neatBtnSuccess} onPress={async () => {
                   if (!campTitle || !campDesc || !campTarget) return alert('Fill all fields.');
                   const campId = cashCampId || 'CAMP_' + Date.now();
                   const payload = { campaign_id: campId, title: campTitle.toUpperCase(), description: campDesc, target_amount: campTarget, remarks: cashReason, raised_amount: cashAmount || 0, status: campStatus || 'ACTIVE' };
                   if (!cashCampId) payload.created_at = new Date().toISOString(); 
                   try { await setDoc(doc(db, 'campaigns', campId), payload, {merge: true}); alert('Saved!'); setShowCampaignModal(false); fetchData(); } catch (e) { alert('Failed to save campaign: ' + e.message); }
                }}><Text style={styles.neatBtnText}>{cashCampId ? 'Update Drive' : 'Publish Drive'}</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {masterResetModal && (
        <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
          <View style={styles.modalCard}>
            <Text style={[styles.sectionTitle, { color: '#EF4444', marginBottom: 12 }]}>⚠️ FULL RESET</Text>
            <Text style={{ fontSize: 14, color: '#475569', marginBottom: 20, lineHeight: 22 }}>This will permanently delete ALL member records, student profiles, financial transactions, and fund drives. Only your core admin account will remain.</Text>
            <Text style={styles.label}>Admin Password Required *</Text><TextInput style={styles.input} secureTextEntry={true} placeholder="Enter password to confirm" value={masterResetPassword} onChangeText={setMasterResetPassword} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 }}><TouchableOpacity style={styles.neatBtnDark} onPress={() => { setMasterResetModal(false); setMasterResetPassword(''); }}><Text style={styles.neatBtnTextDark}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.neatBtnSuccess, {backgroundColor: '#EF4444'}]} onPress={handleMasterDatabaseReset}><Text style={styles.neatBtnText}>WIPE DATABASE</Text></TouchableOpacity></View>
          </View>
        </View>
      )}

      {showDuesModal && (
        <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
          <View style={[styles.modalCard, {maxWidth: 600, width: '90%', maxHeight: '90%', padding: 0, overflow: 'hidden'}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC'}}><Text style={[styles.sectionTitle, {marginBottom: 0}]}>Pending Subscription Dues</Text><TouchableOpacity style={styles.neatBtnDark} onPress={() => setShowDuesModal(false)}><Text style={styles.neatBtnTextDark}>✕ Close</Text></TouchableOpacity></View>
            <ScrollView contentContainerStyle={{padding: 24}}>
               {pendingDuesList.length === 0 && <Text style={{color: '#64748B'}}>No pending dues found.</Text>}
               {pendingDuesList.map((u) => (
                 <View key={u.official_id} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'}}>
                   <View style={{flex: 1, paddingRight: 10}}><Text style={{ color: '#004085', fontSize: 15, fontWeight: '800' }}>{u.full_name}</Text><Text style={{ color: '#64748B', fontSize: 12, marginTop: 4, fontWeight: '600' }}>📞 {u.phone_number}</Text></View>
                   <View style={{alignItems: 'flex-end'}}><Text style={{ color: '#475569', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>Owes <Text style={{ color: '#EF4444', fontSize: 16 }}>₹{u.duesAmount}</Text></Text><Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', marginTop: 4 }}>{u.duesMonths} Month(s)</Text></View>
                 </View>
               ))}
            </ScrollView>
          </View>
        </View>
      )}

      {showSliderModal && (
        <View style={[styles.modalOverlay, {position: Platform.OS === 'web' ? 'fixed' : 'absolute'}]}>
          <View style={[styles.modalCard, {maxWidth: 400, width: '90%'}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}><Text style={[styles.sectionTitle, {marginBottom: 0}]}>Slider Images</Text><TouchableOpacity onPress={() => setShowSliderModal(false)}><Text style={{fontSize: 24, color: '#EF4444', fontWeight: 'bold'}}>✕</Text></TouchableOpacity></View>
            <Text style={{color: '#64748B', fontSize: 13, marginBottom: 16}}>Upload square photos (1:1).</Text>
            
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24}}>
               {sliderImages.map((img, idx) => (
                  <View key={idx} style={{position: 'relative', width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden'}}>
                     <Image source={{uri: img}} style={{width: '100%', height: '100%'}} resizeMode="cover" />
                     <TouchableOpacity style={{position: 'absolute', top: 2, right: 2, backgroundColor: '#EF4444', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', zIndex: 10}} onPress={async () => { const newArray = sliderImages.filter((_, i) => i !== idx); setSliderImages(newArray); await setDoc(doc(db, 'settings', 'global'), { slider_images: newArray }, { merge: true }); }}><Text style={{color: 'white', fontWeight: 'bold', fontSize: 9}}>✕</Text></TouchableOpacity>
                  </View>
               ))}
               <TouchableOpacity style={{width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC'}} onPress={async () => {
                 let r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.1, width: 400, height: 400, base64: true });
                 if (!r.canceled && r.assets[0].base64) { const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`; const newArray = [...sliderImages, b64]; setSliderImages(newArray); await setDoc(doc(db, 'settings', 'global'), { slider_images: newArray }, { merge: true }); }
               }}><Text style={{fontSize: 24, color: '#94A3B8'}}>+</Text></TouchableOpacity>
            </View>
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
  const [formData, setFormData] = useState({ full_name: '', father_name: '', mother_name: '', parents_status: '', gender: '', dob: '', blood_group: '', native_place: '', phone_number: '', email: '', address: '', password: '', whatsapp_number: '', aadhaar_number: '', current_location: '', occupation: '', educational_qualification: '', course_details: '', marital_status: '', student_mobile: '', class_grade: '', school_name: '', medium_of_instruction: '', school_type: '', school_location: '', profile_photo: null, islamic_studies: 'NO', islamic_qualification: '', madrasa_name: '', madrasa_location: '' });
  
  const [age, setAge] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(formData.class_grade);
  const wrapStyle = { flex: 1, minWidth: 260 }; 

  const handleDateChange = (event, selectedDate) => { setShowDatePicker(false); if (selectedDate) { setDobDate(selectedDate); const day = String(selectedDate.getDate()).padStart(2, '0'); const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); const year = selectedDate.getFullYear(); setFormData({...formData, dob: `${year}-${month}-${day}`}); setAge((new Date().getFullYear() - year).toString()); } };
  const handleWebDateChange = (e) => { const val = e.target.value; setFormData({...formData, dob: val}); if(val) setAge((new Date().getFullYear() - new Date(val).getFullYear()).toString()); };
  const handleSameMobileToggle = () => { setSameAsMobile(!sameAsMobile); if (!sameAsMobile) setFormData({ ...formData, whatsapp_number: formData.phone_number }); else setFormData({ ...formData, whatsapp_number: '' }); };

  const pickImage = () => {
    Alert.alert("Upload Photo", "Choose an option", [
      { text: "Take Photo", onPress: async () => { const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) return; let r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.1, width: 300, height: 300, base64: true }); if (!r.canceled && r.assets[0].base64) { setFormData({...formData, profile_photo: `data:image/jpeg;base64,${r.assets[0].base64}`}); } } },
      { text: "Choose from Gallery", onPress: async () => { let r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.1, width: 300, height: 300, base64: true }); if (!r.canceled && r.assets[0].base64) { setFormData({...formData, profile_photo: `data:image/jpeg;base64,${r.assets[0].base64}`}); } } },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.father_name || !formData.mother_name || !formData.parents_status || !formData.gender || !formData.dob || !formData.aadhaar_number) return alert('Please fill all mandatory (*) fields in Step 1.');
    if (formData.aadhaar_number.length !== 12) return alert('Aadhaar must be exactly 12 digits.');
    if (role === 'MEMBER' && !formData.phone_number) return alert('Primary mobile number is required.');
    if (role === 'STUDENT' && !formData.phone_number) return alert('Parent mobile number is required.');
    setIsSubmitting(true);

    try {
      const finalData = { ...formData };
      for (let key in finalData) { if (typeof finalData[key] === 'string' && key !== 'profile_photo' && key !== 'password' && key !== 'email') finalData[key] = finalData[key].toUpperCase(); }
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

  if (registeredUser) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FE', padding: 24}}>
        <View style={[styles.modalCard, {alignItems: 'center', maxWidth: 400, width: '100%'}]}>
          <Text style={{fontSize: 60, marginBottom: 16}}>🎉</Text>
          <Text style={{fontSize: 22, fontWeight: '900', color: '#10B981', textAlign: 'center', marginBottom: 8}}>Registration Successful!</Text>
          <Text style={{fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24}}>Welcome to HIYWA. Your profile has been created securely.</Text>
          <View style={{backgroundColor: '#F8FAFC', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', width: '100%', alignItems: 'center', marginBottom: 24}}><Text style={{fontSize: 11, color: '#64748B', fontWeight: '800', textTransform: 'uppercase', marginBottom: 8}}>Your Official Login ID</Text><Text style={{fontSize: 28, fontWeight: '900', color: '#004085', letterSpacing: 2}}>{registeredUser.official_id}</Text></View>
          <Text style={{textAlign: 'center', color: '#EF4444', marginBottom: 24, fontWeight: '800'}}>{isAdminAuth ? `Default Password Set: Hiywa@123\nUser will be forced to change this on their first login.` : 'Please log in with the password you created.'}</Text>
          <TouchableOpacity style={[styles.button, {backgroundColor: '#004085', width: '100%', marginTop: 0}]} onPress={() => { setRole(null); setStep(1); setRegisteredUser(null); if(isAdminAuth) onBack(); }}><Text style={styles.buttonText}>Finish & Return</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!role) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {!isAdminAuth && ( <View style={[styles.contentHeader, {borderBottomWidth: 0, paddingBottom: 0}]}><View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Image source={require('./hiywalogo.png')} style={{ width: 44, height: 44, borderRadius: 8, marginRight: 12 }} /><View style={{ flexShrink: 1 }}><Text style={{ fontSize: 16, fontWeight: '900', color: '#004085' }}>HIYWA</Text><Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700', marginTop: 2 }}>MTK PURAM</Text></View></View></View> )}
        <View style={styles.contentHeader}><View style={{ flex: 1 }}><Text style={[styles.contentTitle, {fontSize: 16}]}>Select Registration Type</Text></View><TouchableOpacity onPress={onBack} style={styles.neatBtnPrimary}><Text style={styles.neatBtnText}>← Cancel & Back</Text></TouchableOpacity></View>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <TouchableOpacity style={[styles.bentoBox, { alignItems: 'center', minWidth: 260, flex: 0, paddingVertical: 40 }]} onPress={() => setRole('MEMBER')}><Text style={{ fontSize: 56, marginBottom: 16 }}>🧑‍💼</Text><Text style={[styles.bentoTitle, { fontSize: 24 }]}>HIYWA Member</Text><Text style={[styles.bentoDesc, { textAlign: 'center', marginTop: 8 }]}>Standard member registration.</Text><View style={[styles.button, { width: '100%', marginTop: 32 }]}><Text style={styles.buttonText}>Select Member</Text></View></TouchableOpacity>
            <TouchableOpacity style={[styles.bentoBox, { alignItems: 'center', minWidth: 260, flex: 0, paddingVertical: 40 }]} onPress={() => setRole('STUDENT')}><Text style={{ fontSize: 56, marginBottom: 16 }}>🎓</Text><Text style={[styles.bentoTitle, { fontSize: 24 }]}>Student</Text><Text style={[styles.bentoDesc, { textAlign: 'center', marginTop: 8 }]}>Pursuing or completed students.</Text><View style={[styles.button, { width: '100%', marginTop: 32, backgroundColor: '#10B981' }]}><Text style={styles.buttonText}>Select Student</Text></View></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{flex: 1}}>
      <KeyboardAvoidingView style={{flex: 1, backgroundColor: '#F4F7FE'}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isSubmitting && ( <View style={styles.modalOverlay}><View style={[styles.modalCard, {alignItems: 'center'}]}><ActivityIndicator size="large" color="#004085" style={{ transform: [{ scale: 1.5 }], marginBottom: 24 }} /><Text style={{ fontSize: 16, fontWeight: '900', color: '#004085', marginBottom: 8 }}>Processing...</Text></View></View> )}
        {!isAdminAuth && ( <View style={[styles.contentHeader, {borderBottomWidth: 0, paddingBottom: 0}]}><View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Image source={require('./hiywalogo.png')} style={{ width: 44, height: 44, borderRadius: 8, marginRight: 12 }} /><View style={{ flexShrink: 1 }}><Text style={{ fontSize: 16, fontWeight: '900', color: '#004085' }}>HIYWA</Text><Text style={{ fontSize: 11, color: '#64748B', fontWeight: '800', marginTop: 2 }}>MTK PURAM</Text></View></View></View> )}
        <View style={{flexDirection: 'row', alignItems: 'center', padding: 24, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 16}}><TouchableOpacity style={styles.neatBtnDark} onPress={() => { if (isAdminAuth) onBack(); else { setRole(null); setStep(1); } }}><Text style={styles.neatBtnTextDark}>← Back</Text></TouchableOpacity><Text style={[styles.sectionTitle, {marginBottom: 0}]}>{role === 'STUDENT' ? 'Student Registration' : 'Member Registration'}</Text></View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
          <View style={styles.formCard}>
            
            <Text style={[styles.sectionTitle, {fontSize: 16, color: '#475569', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8}]}>1. Personal Details</Text>
            <View style={{ zIndex: 110, marginBottom: 24 }}>
              <View style={{alignItems: 'center', marginBottom: 24, marginTop: 12}}><TouchableOpacity onPress={pickImage} style={{alignItems: 'center'}}>{formData.profile_photo ? <Image source={{uri: formData.profile_photo}} style={{width: 100, height: 100, borderRadius: 50}} /> : <View style={{width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center'}}><Text>📷 Upload</Text></View>}<Text style={{color: '#004085', fontWeight: '800', marginTop: 8}}>Upload Photo</Text></TouchableOpacity>{formData.profile_photo && ( <TouchableOpacity style={{marginTop: 12, backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FCA5A5'}} onPress={() => setFormData({...formData, profile_photo: null})}><Text style={{color: '#EF4444', fontWeight: 'bold', fontSize: 11}}>🗑️ Remove Photo</Text></TouchableOpacity> )}</View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, zIndex: 110 }}>
                <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Full Name *</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. muhammad yasir" placeholderTextColor="#94A3B8" value={formData.full_name} onChangeText={(t) => setFormData({...formData, full_name: t})} /></View>
                <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Father's Name *</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. abdul" placeholderTextColor="#94A3B8" value={formData.father_name} onChangeText={(t) => setFormData({...formData, father_name: t})} /></View>
                <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Mother's Name *</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. fathima" placeholderTextColor="#94A3B8" value={formData.mother_name} onChangeText={(t) => setFormData({...formData, mother_name: t})} /></View>
                <FormDropdown label="Parents Status *" value={formData.parents_status} options={['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED']} placeholder="SELECT STATUS" onSelect={v => setFormData({...formData, parents_status: v})} />
                <FormDropdown label="Gender *" value={formData.gender} options={GENDERS} placeholder="SELECT GENDER" onSelect={v => setFormData({...formData, gender: v})} />
                <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Date of Birth *</Text>{Platform.OS === 'web' ? <input type="date" style={webDateStyle} value={formData.dob} onChange={handleWebDateChange} /> : <View><TouchableOpacity onPress={() => setShowDatePicker(true)}><View style={{ pointerEvents: 'none' }}><TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" value={formData.dob} editable={false} /></View></TouchableOpacity>{showDatePicker && <DateTimePicker value={dobDate} mode="date" display="default" onChange={handleDateChange} />}</View>}</View>
                <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Calculated Age</Text><TextInput style={[styles.input, { backgroundColor: '#F1F5F9', color: '#94A3B8' }]} value={age} editable={false} placeholder="Select DOB first" placeholderTextColor="#94A3B8" /></View>
                <FormDropdown label="Blood Group" value={formData.blood_group} options={BLOOD_GROUPS} placeholder="SELECT BLOOD GROUP" onSelect={v => setFormData({...formData, blood_group: v})} />
                {(role === 'MEMBER' || role === 'ADMIN') && ( <FormDropdown label="Marital Status" value={formData.marital_status} options={MARITAL_STATUS} placeholder="SELECT STATUS" onSelect={v => setFormData({...formData, marital_status: v})} /> )}
                <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Aadhaar Number (12-Digits) *</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={12} placeholder="e.g. 1234 5678 9101" placeholderTextColor="#94A3B8" value={formData.aadhaar_number} onChangeText={(t) => setFormData({...formData, aadhaar_number: t})} /></View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, {fontSize: 16, color: '#475569', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8}]}>2. Education & Occupation</Text>
            <View style={{ zIndex: 100, marginBottom: 24, marginTop: 12 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, zIndex: 90 }}>
                {(role === 'MEMBER' || role === 'ADMIN') && (
                  <>
                    <FormDropdown label="Educational Category" value={formData.educational_qualification} options={EDU_CATEGORIES} placeholder="SELECT CATEGORY" onSelect={v => setFormData({...formData, educational_qualification: v})} />
                    <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Course / Major Specialization</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. b.e computer science" placeholderTextColor="#94A3B8" value={formData.course_details} onChangeText={(t) => setFormData({...formData, course_details: t})} /></View>
                    <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Occupation / Job Title</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. software engineer" placeholderTextColor="#94A3B8" value={formData.occupation} onChangeText={(t) => setFormData({...formData, occupation: t})} /></View>
                  </>
                )}
                {role === 'STUDENT' && (
                  <>
                    <FormDropdown label="Class / Grade" value={formData.class_grade} options={CLASSES} isScrollable={true} placeholder="SELECT CLASS / GRADE" onSelect={v => setFormData({...formData, class_grade: v})} />
                    {isCollegeEdit && (
                      <>
                        <FormDropdown label="Educational Category" value={formData.educational_qualification} options={EDU_CATEGORIES} placeholder="SELECT CATEGORY" onSelect={v => setFormData({...formData, educational_qualification: v})} />
                        <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Course / Major Details</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. b.com" placeholderTextColor="#94A3B8" value={formData.course_details} onChangeText={(t) => setFormData({...formData, course_details: t})} /></View>
                      </>
                    )}
                    <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Institution Name</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. national public school" placeholderTextColor="#94A3B8" value={formData.school_name} onChangeText={(t) => setFormData({...formData, school_name: t})} /></View>
                    <FormDropdown label={isCollegeEdit ? 'College Type' : 'School Type'} value={formData.school_type} options={isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES} placeholder="SELECT TYPE" onSelect={v => setFormData({...formData, school_type: v})} />
                    <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Institution Location / Village</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. chennai" placeholderTextColor="#94A3B8" value={formData.school_location} onChangeText={(t) => setFormData({...formData, school_location: t})} /></View>
                    <FormDropdown label="Medium of Instruction" value={formData.medium_of_instruction} options={MEDIUMS} placeholder="SELECT MEDIUM" onSelect={v => setFormData({...formData, medium_of_instruction: v})} />
                  </>
                )}
              </View>

              <View style={{ zIndex: 80, marginTop: 10 }}>
                <Text style={styles.label}>{(role === 'MEMBER' || role === 'ADMIN') ? 'Completed Islamic Studies?' : 'Pursuing Islamic Studies?'}</Text>
                <View style={{flexDirection: 'row', gap: 10, marginBottom: 24}}>
                  <TouchableOpacity style={[styles.filterChip, formData.islamic_studies==='YES' && styles.filterChipActive]} onPress={()=>setFormData({...formData, islamic_studies: 'YES'})}><Text style={[styles.filterChipText, formData.islamic_studies==='YES' && {color:'white'}]}>Yes</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.filterChip, formData.islamic_studies==='NO' && styles.filterChipActive]} onPress={()=>setFormData({...formData, islamic_studies: 'NO'})}><Text style={[styles.filterChipText, formData.islamic_studies==='NO' && {color:'white'}]}>No</Text></TouchableOpacity>
                </View>
              </View>

              {formData.islamic_studies === 'YES' && (
                <View style={{flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, padding: 20, backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 70}}>
                  <FormDropdown label="Islamic Qualification" value={formData.islamic_qualification} options={ISLAMIC_QUALS} placeholder="SELECT QUALIFICATION" onSelect={v => setFormData({...formData, islamic_qualification: v})} />
                  {formData.islamic_qualification === 'OTHERS' && ( <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Specify Qualification</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. m.a arabic" placeholderTextColor="#94A3B8" value={formData.islamic_qualification} onChangeText={t => setFormData({...formData, islamic_qualification: t})} /></View> )}
                  <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Madrasa Name</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. jamia darussalam" placeholderTextColor="#94A3B8" value={formData.madrasa_name} onChangeText={t => setFormData({...formData, madrasa_name: t})} /></View>
                  <View style={[wrapStyle, {zIndex: 1}]}><Text style={styles.label}>Madrasa Location</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. omerabad" placeholderTextColor="#94A3B8" value={formData.madrasa_location} onChangeText={t => setFormData({...formData, madrasa_location: t})} /></View>
                </View>
              )}
            </View>

            <Text style={[styles.sectionTitle, {fontSize: 16, color: '#475569', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8}]}>3. Contact & Address</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, zIndex: 60, marginTop: 12 }}>
              {role === 'STUDENT' && ( <View style={wrapStyle}><Text style={styles.label}>Student Mobile Number</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={10} placeholder="e.g. 9876543210" placeholderTextColor="#94A3B8" value={formData.student_mobile} onChangeText={(t) => setFormData({...formData, student_mobile: t})} /></View> )}
              
              <View style={[wrapStyle, {zIndex: 110}]}>
                <Text style={styles.label}>{role === 'MEMBER' ? 'Primary Mobile Number *' : "Parent's Mobile Number *"}</Text>
                <View style={{flexDirection: 'row', alignItems: 'stretch', marginBottom: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, overflow: 'hidden', backgroundColor: '#FFFFFF'}}>
                  <View style={{backgroundColor: '#F8FAFC', justifyContent: 'center', paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#CBD5E1'}}>
                    <TextInput style={{fontSize: 14, fontWeight: '800', color: '#004085', width: 50}} value={formData.country_code || '+91'} onChangeText={t => setFormData({...formData, country_code: t})} />
                  </View>
                  <TextInput style={{flex: 1, padding: 14, fontSize: 14, color: '#1E293B', fontWeight: '600', outline: 'none'}} keyboardType="numeric" maxLength={COUNTRY_CODES.find(c => c.code === (formData.country_code || '+91'))?.max || 10} placeholderTextColor="#94A3B8" value={formData.phone_number} onChangeText={(t) => { setFormData({...formData, phone_number: t}); if(sameAsMobile) setFormData({...formData, phone_number: t, whatsapp_number: t}); }} />
                </View>
              </View>

              {role === 'MEMBER' && (
                <View style={[wrapStyle, {zIndex: 100}]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}><Text style={styles.label}>WhatsApp Number</Text><TouchableOpacity onPress={handleSameMobileToggle} style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#004085', marginRight: 8, backgroundColor: sameAsMobile ? '#004085' : 'white', borderRadius: 4 }} /><Text style={{ fontSize: 13, color: '#64748B', fontWeight: '800' }}>Same as Mobile</Text></TouchableOpacity></View>
                  <View style={{flexDirection: 'row', alignItems: 'stretch', marginBottom: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, overflow: 'hidden', backgroundColor: '#FFFFFF'}}><View style={{backgroundColor: '#F8FAFC', justifyContent: 'center', paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#CBD5E1'}}><Text style={{fontSize: 14, fontWeight: '800', color: '#004085', paddingHorizontal: 6, width: 65, textAlign: 'center'}}>{formData.country_code || '+91'}</Text></View><TextInput style={{flex: 1, padding: 14, fontSize: 14, color: '#1E293B', fontWeight: '600', outline: 'none'}} keyboardType="numeric" maxLength={COUNTRY_CODES.find(c => c.code === (formData.country_code || '+91'))?.max || 10} placeholderTextColor="#94A3B8" value={formData.whatsapp_number} editable={!sameAsMobile} onChangeText={(t) => setFormData({...formData, whatsapp_number: t})} /></View>
                </View>
              )}

              <FormDropdown label="Native Place" value={formData.native_place} options={NATIVE_PLACES} placeholder="SELECT NATIVE PLACE" onSelect={v => setFormData({...formData, native_place: v})} />
              {formData.native_place === 'OTHERS' && ( <View style={wrapStyle}><Text style={styles.label}>Specify Native Place</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. madurai" placeholderTextColor="#94A3B8" value={formData.native_place === 'OTHERS' ? '' : formData.native_place} onChangeText={(t) => setFormData({...formData, native_place: t})} /></View> )}
              
              <View style={wrapStyle}><Text style={styles.label}>Current Location (City/Town)</Text><TextInput style={styles.input} autoCapitalize="characters" placeholder="e.g. chennai" placeholderTextColor="#94A3B8" value={formData.current_location} onChangeText={(t) => setFormData({...formData, current_location: t})} /></View>
              <View style={wrapStyle}><Text style={styles.label}>Email Address</Text><TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="e.g. name@example.com" placeholderTextColor="#94A3B8" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} /></View>
              
              {!isAdminAuth && ( <View style={wrapStyle}><Text style={styles.label}>Create Portal Password *</Text><TextInput style={styles.input} secureTextEntry={true} placeholder="e.g. secret@123" placeholderTextColor="#94A3B8" value={formData.password} onChangeText={(t) => setFormData({...formData, password: t})} /></View> )}
              
              <View style={{width: '100%'}}><Text style={styles.label}>Full Permanent Address</Text><TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline={true} autoCapitalize="characters" placeholder="e.g. no. 12, cross street..." placeholderTextColor="#94A3B8" value={formData.address} onChangeText={(t) => setFormData({...formData, address: t})} /></View>
            </View>

            <TouchableOpacity style={[styles.button, {backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', marginTop: 32}]} onPress={handleRegister} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="white" style={{marginRight: 10}} /> : null}
              <Text style={styles.buttonText}>{isSubmitting ? 'Processing...' : '✅ Complete Registration'}</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}


// --- DONATION PORTAL ---
function DonationPortal({ currentUser, onViewReceipt, onBack = () => {} }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState([]);


  useEffect(() => {
    const fetchTxns = async () => { try { const snap = await getDocs(collection(db, 'transactions')); setHistory(snap.docs.map(d=>d.data()).filter(t => t.member_id === currentUser.official_id && t.donation_type === 'GENERAL').sort((a,b)=>new Date(b.transaction_date)-new Date(a.transaction_date))); } catch(e){} };
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
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Make a Donation</Text>
        <Text style={styles.label}>Reason / Purpose</Text><TextInput style={styles.input} placeholder="E.G. FOOD DISTRIBUTION" autoCapitalize="characters" value={reason} onChangeText={(t) => setReason(t)} />
        <Text style={styles.label}>Donation Amount (₹)</Text><TextInput style={styles.input} placeholder="E.G. 1000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <TouchableOpacity style={styles.button} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Donate via UPI</Text>}</TouchableOpacity>
      </View>


      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Donation History</Text>
      <View style={styles.formCard}>
        {history.length === 0 ? <Text style={{color: '#64748B'}}>No donations found.</Text> : history.map((txn, idx) => (
          <View key={idx} style={styles.historyRow}>
            <View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontWeight: '700', color: '#004085', fontSize: 16 }}>{txn.reason}</Text><Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '600' }}>{new Date(txn.transaction_date).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981', marginBottom: 8 }}>₹{txn.amount}</Text><TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}


// --- SUBSCRIPTION SCREEN ---
function SubscriptionScreen({ currentUser, setCurrentUser, onViewReceipt }) {
  const [monthsCount, setMonthsCount] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyRate, setMonthlyRate] = useState(0);
  const [subStartMonth, setSubStartMonth] = useState(null); // Use null to prevent flickering
  const [history, setHistory] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => { 
    const getRate = async () => { 
      try { 
        const sDoc = await getDoc(doc(db, 'settings', 'global')); 
        if(sDoc.exists()) {
           setMonthlyRate(sDoc.data().monthly_subscription_amount || 0);
           setSubStartMonth(sDoc.data().subscription_start_month || '');
        } else setSubStartMonth('');
      } catch(e){ setSubStartMonth(''); } 
    }; 
    const fetchTxns = async () => { try { const snap = await getDocs(collection(db, 'transactions')); setHistory(snap.docs.map(d=>d.data()).filter(t => t.member_id === currentUser.official_id && t.donation_type === 'SUBSCRIPTION').sort((a,b)=>new Date(b.transaction_date)-new Date(a.transaction_date))); } catch(e){} };
    getRate(); fetchTxns();
  }, [currentUser]);

  const totalAmount = monthlyRate * (parseInt(monthsCount) || 1);
  
  // DUES CALCULATION
  const joinDate = currentUser.join_date ? new Date(currentUser.join_date) : new Date(); 
  let startDate = joinDate;
  if (subStartMonth) { const systemStart = new Date(`${subStartMonth}-01`); if (systemStart > joinDate) startDate = systemStart; }
  const currentDate = new Date();
  
  const rawMonths = ((currentDate.getFullYear() - startDate.getFullYear()) * 12) + (currentDate.getMonth() - startDate.getMonth()) + 1;
  const monthsSinceJoined = Math.max(0, rawMonths); 
  const totalPaid = parseInt(currentUser.total_months_paid) || 0; 
  const duesMonths = Math.max(0, monthsSinceJoined - totalPaid);
  const duesAmount = duesMonths * monthlyRate;

  let paidUpToText = "No payments yet";
  if (totalPaid > 0) {
     const paidUpTo = new Date(startDate);
     paidUpTo.setMonth(paidUpTo.getMonth() + totalPaid - 1); 
     paidUpToText = paidUpTo.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }

  // Check for future dates
  const isFutureStart = subStartMonth && new Date(`${subStartMonth}-01`) > new Date();
  const isSubsDisabled = !subStartMonth || isFutureStart;

  const handleUPIPayment = async () => {
    setIsSubmitting(true);
    const upiSuccess = await openUPI(totalAmount, 'MONTHLY SUBSCRIPTION');
    if (!upiSuccess) { setIsSubmitting(false); return; }

    const txnId = `UPI_${Date.now()}`;
    const parsedMonths = parseInt(monthsCount) || 1;
    const payload = { transaction_date: new Date().toISOString(), transaction_id: txnId, member_id: currentUser.official_id, full_name: currentUser.full_name, amount: totalAmount, payment_method: 'UPI', donation_type: 'SUBSCRIPTION', reason: 'MONTHLY SUBSCRIPTION', months_count: parsedMonths };
    try {
      await setDoc(doc(db, 'transactions', txnId), payload);
      const newTotalPaid = (parseInt(currentUser.total_months_paid)||0) + parsedMonths;
      await updateDoc(doc(db, 'members', currentUser.official_id), { total_months_paid: newTotalPaid });
      alert('Subscription Processed Successfully!');
      setCurrentUser({ ...currentUser, total_months_paid: newTotalPaid });
      setShowPaymentModal(false);
      onViewReceipt({ ...payload, official_id: currentUser.official_id });
    } catch (error) { alert('Connection failed.'); } finally { setIsSubmitting(false); }
  };

  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        {/* DYNAMIC COMING SOON BANNER */}
        {subStartMonth !== null && isSubsDisabled && (
           <View style={{backgroundColor: '#FEF3C7', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F59E0B', marginBottom: 24, alignItems: 'center'}}>
             <Text style={{color: '#D97706', fontWeight: '900', fontSize: 18, marginBottom: 8}}>⏳ Coming Soon</Text>
             <Text style={{color: '#B45309', fontWeight: '600', fontSize: 13, textAlign: 'center', lineHeight: 20}}>
               {subStartMonth 
                 ? `Subscription plan not fully implemented yet. Coming soon in ${new Date(subStartMonth + '-01').toLocaleDateString('default', {month: 'long', year: 'numeric'})}.`
                 : `The automated online subscription tracker is not yet implemented.`}
             </Text>
           </View>
        )}

        <View style={{flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginBottom: 24}}>
           <View style={{flex: 1, minWidth: 200, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'}}>
             <Text style={{color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5}}>TOTAL MONTHS PAID</Text>
             <Text style={{color: '#004085', fontSize: 32, fontWeight: '900', marginTop: 4}}>{totalPaid}</Text>
             <Text style={{color: '#3B82F6', fontSize: 13, marginTop: 8, fontWeight: '700'}}>Paid up to: {paidUpToText}</Text>
           </View>
           
           <View style={{flex: 1, minWidth: 200, backgroundColor: duesMonths > 0 ? '#FEF2F2' : '#ECFDF5', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: duesMonths > 0 ? '#FECACA' : '#A7F3D0'}}>
             <Text style={{color: duesMonths > 0 ? '#B91C1C' : '#065F46', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5}}>{duesMonths > 0 ? 'PENDING DUES' : 'ALL CLEAR'}</Text>
             <Text style={{color: duesMonths > 0 ? '#EF4444' : '#10B981', fontSize: 32, fontWeight: '900', marginTop: 4}}>₹{duesAmount}</Text>
             {duesMonths > 0 && <Text style={{color: '#B91C1C', fontSize: 13, marginTop: 8, fontWeight: '700'}}>Due for {duesMonths} month(s)</Text>}
           </View>
        </View>

        <TouchableOpacity style={[styles.button, {backgroundColor: '#004085', alignSelf: 'flex-start', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, marginBottom: 32}, isSubsDisabled && {opacity: 0.5}]} disabled={isSubsDisabled} onPress={() => setShowPaymentModal(true)}>
           <Text style={[styles.buttonText, {fontSize: 16}]}>💵 Pay Advance / Clear Dues</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Subscription History</Text>
        <View style={styles.formCard}>
          {history.length === 0 ? <Text style={{color: '#64748B'}}>No transactions found.</Text> : history.map((txn, idx) => (
            <View key={idx} style={styles.historyRow}>
              <View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontWeight: '700', color: '#004085', fontSize: 16 }}>{txn.months_count} Months Paid</Text><Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '600' }}>{new Date(txn.transaction_date).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981', marginBottom: 8 }}>₹{txn.amount}</Text><TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity></View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* NEW MODAL FOR PAYMENTS */}
      {showPaymentModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.sectionTitle, {marginBottom: 12}]}>Select Months</Text>
            <View style={styles.quickSelectContainer}>
               <TouchableOpacity style={[styles.quickBtn, monthsCount === '1' && styles.quickBtnActive]} onPress={() => setMonthsCount('1')}><Text style={[styles.quickBtnText, monthsCount === '1' && styles.quickBtnTextActive]}>1 Mo</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.quickBtn, monthsCount === '3' && styles.quickBtnActive]} onPress={() => setMonthsCount('3')}><Text style={[styles.quickBtnText, monthsCount === '3' && styles.quickBtnTextActive]}>3 Mo</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.quickBtn, monthsCount === '6' && styles.quickBtnActive]} onPress={() => setMonthsCount('6')}><Text style={[styles.quickBtnText, monthsCount === '6' && styles.quickBtnTextActive]}>6 Mo</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.quickBtn, monthsCount === '12' && styles.quickBtnActive]} onPress={() => setMonthsCount('12')}><Text style={[styles.quickBtnText, monthsCount === '12' && styles.quickBtnTextActive]}>1 Year</Text></TouchableOpacity>
            </View>
            <Text style={styles.label}>Or Custom Months</Text><TextInput style={styles.input} keyboardType="numeric" value={monthsCount} onChangeText={setMonthsCount} />
            <View style={styles.totalBox}><Text style={styles.totalBoxText}>Total: ₹{totalAmount}</Text></View>
            
            <View style={{flexDirection: 'row', gap: 12, marginTop: 12}}>
               <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: '#64748B'}]} onPress={() => setShowPaymentModal(false)}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.button, {flex: 1}]} onPress={handleUPIPayment} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Pay via UPI</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}


// --- FUNDRAISING LIST SCREEN ---
function FundraisingListScreen({ currentUser, onSelectCampaign, onViewReceipt }) {
  const [campaigns, setCampaigns] = useState([]);
  const [history, setHistory] = useState([]);
  const [showPastModal, setShowPastModal] = useState(false); // NEW STATE FOR MODAL

  useEffect(() => { 
    const fetchData = async () => { 
      try { 
        const snap = await getDocs(collection(db, 'campaigns')); 
        setCampaigns(snap.docs.map(d=>d.data()).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at))); 
        
        const txnSnap = await getDocs(collection(db, 'transactions'));
        setHistory(txnSnap.docs.map(d=>d.data()).filter(t => t.member_id === currentUser.official_id && (t.donation_type === 'FUND_RAISING' || t.donation_type === 'CAMPAIGN')).sort((a,b)=>new Date(b.transaction_date)-new Date(a.transaction_date)));
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

  const renderCampCard = (camp, isPast) => {
    const raised = parseFloat(camp.raised_amount) || 0; const target = parseFloat(camp.target_amount) || 1; 
    const progress = Math.min(Math.round((raised / target) * 100), 100);
    const goalAchieved = raised >= target;
    const isStopped = camp.status === 'STOPPED' || goalAchieved;
    const isPaused = camp.status === 'PAUSED';

    return (
      <TouchableOpacity key={camp.campaign_id} style={[styles.formCard, (isStopped || isPast) && {opacity: 0.9, backgroundColor: '#F8FAFC', marginBottom: 12}]} onPress={() => { setShowPastModal(false); onSelectCampaign(camp); }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, {marginBottom: 0, flex: 1}]} numberOfLines={1}>{camp.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: goalAchieved ? '#10B981' : isPaused ? '#F59E0B' : camp.status === 'STOPPED' ? '#EF4444' : '#3B82F6' }]}>
            <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{goalAchieved ? 'GOAL ACHIEVED' : camp.status}</Text>
          </View>
        </View>
        <Text style={{ color: '#64748B', marginBottom: 16, fontWeight: '500' }} numberOfLines={2}>{camp.description}</Text>
        
        {camp.remarks && (isStopped || isPaused) ? (
           <View style={{backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 16}}>
             <Text style={{color: '#991B1B', fontWeight: '800', fontSize: 12}}>REMARKS: {camp.remarks}</Text>
           </View>
        ) : null}

        <View style={{ height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}><View style={{ width: `${progress}%`, backgroundColor: goalAchieved ? '#10B981' : '#3B82F6', height: '100%' }} /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontWeight: '700', color: '#004085' }}>Raised: ₹{raised}</Text><Text style={{ fontWeight: '700', color: goalAchieved ? '#10B981' : '#3B82F6' }}>Goal: ₹{target}</Text></View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
           <Text style={styles.sectionTitle}>Active Fund Drives</Text>
           <TouchableOpacity style={styles.neatBtnDark} onPress={() => setShowPastModal(true)}>
              <Text style={styles.neatBtnTextDark}>View Past Drives</Text>
           </TouchableOpacity>
        </View>

        {activeCamps.length === 0 && <Text style={{color: '#64748B', marginBottom: 24}}>No active drives found.</Text>}
        {activeCamps.map((camp) => renderCampCard(camp, false))}

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>My Campaign Contributions</Text>
        <View style={styles.formCard}>
          {history.length === 0 ? <Text style={{color: '#64748B'}}>No contributions yet.</Text> : history.map((txn, idx) => (
            <View key={idx} style={styles.historyRow}>
              <View style={{ flex: 1, marginRight: 10 }}><Text style={{ fontWeight: '700', color: '#004085', fontSize: 16 }}>{txn.reason}</Text><Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '600' }}>{new Date(txn.transaction_date).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981', marginBottom: 8 }}>₹{txn.amount}</Text><TouchableOpacity style={styles.receiptBtn} onPress={() => onViewReceipt(txn)}><Text style={styles.receiptBtnText}>📄 Receipt</Text></TouchableOpacity></View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* PAST CAMPAIGNS OVERLAY MODAL */}
      {showPastModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, {maxWidth: 600, width: '90%', maxHeight: '90%', padding: 0, overflow: 'hidden'}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC'}}>
               <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Past / Closed Drives</Text>
               <TouchableOpacity style={styles.neatBtnDark} onPress={() => setShowPastModal(false)}><Text style={styles.neatBtnTextDark}>✕ Close</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{padding: 24}}>
               {pastCamps.length === 0 && <Text style={{color: '#64748B'}}>No past drives found.</Text>}
               {pastCamps.map((camp) => renderCampCard(camp, true))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
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
        const myTxns = txnSnap.docs.map(d=>d.data()).filter(t => t.member_id === currentUser.official_id && t.campaign_id === campaign.campaign_id);
        setUserTotalPaid(myTxns.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0));
      } catch(e){}
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
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => onBack('fundraising')} style={{marginBottom: 16}}><Text style={{color: '#004085', fontWeight: '800'}}>← Back to Campaigns</Text></TouchableOpacity>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{campaign.title}</Text>
        <Text style={{ color: '#475569', fontSize: 16, lineHeight: 24, marginBottom: 24, fontWeight: '500' }}>{campaign.description}</Text>
        
        {userTotalPaid > 0 && (
           <View style={{backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#BFDBFE'}}>
             <Text style={{color: '#1E3A8A', fontWeight: '800', fontSize: 14}}>You have already contributed ₹{userTotalPaid} to this drive.</Text>
             {!isStopped && !isPaused && <Text style={{color: '#1D4ED8', marginTop: 4, fontWeight: '600'}}>Would you like to contribute more?</Text>}
           </View>
        )}


        {(campaign.remarks && (isStopped || isPaused)) ? (
           <View style={{backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#FECACA'}}>
             <Text style={{color: '#991B1B', fontWeight: '800', fontSize: 14}}>Admin Remarks: {campaign.remarks}</Text>
           </View>
        ) : null}


        {isPaused ? (
           <View style={{alignItems: 'center', padding: 20, backgroundColor: '#FEF3C7', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A'}}>
             <Text style={{color: '#D97706', fontWeight: '900', fontSize: 18}}>⏸️ CAMPAIGN PAUSED</Text>
             <Text style={{color: '#B45309', marginTop: 8, fontWeight: '600'}}>Contributions are temporarily on hold.</Text>
           </View>
        ) : isStopped ? (
           <View style={{alignItems: 'center', padding: 20, backgroundColor: '#ECFDF5', borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0'}}>
             <Text style={{color: '#10B981', fontWeight: '900', fontSize: 18}}>🎉 {goalAchieved ? 'GOAL ACHIEVED!' : 'CAMPAIGN CLOSED'}</Text>
             <Text style={{color: '#065F46', marginTop: 8, fontWeight: '600'}}>Thank you for your support.</Text>
           </View>
        ) : (
          <>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
              <Text style={{fontWeight: '800', color: '#64748B'}}>Target: ₹{target}</Text>
              <Text style={{fontWeight: '800', color: '#3B82F6'}}>Remaining: ₹{remaining}</Text>
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
  const txnDate = new Date(receipt.transaction_date || Date.now()).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
    } catch(e) { alert("Failed to generate PDF"); }
  };


  return (
    <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
      <TouchableOpacity onPress={() => onBack()} style={{alignSelf: 'flex-start', marginBottom: 16}}><Text style={{color: '#004085', fontWeight: '800'}}>← Back</Text></TouchableOpacity>
      
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
      
      <View style={{flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 40, width: '100%', maxWidth: 450}}>
         <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: '#10B981', marginTop: 0}]} onPress={async () => {
            if (navigator.share) {
              try { await navigator.share({ title: 'HIYWA Receipt', text: `Official Receipt for ${receipt.full_name} - ₹${receipt.amount}`, url: window.location.href }); } catch (err) {}
            } else { alert("Sharing not supported on this browser."); }
         }}><Text style={styles.buttonText}>📲 Share</Text></TouchableOpacity>
         
         <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: '#004085', marginTop: 0}]} onPress={() => window.print()}>
           <Text style={styles.buttonText}>📥 Download</Text>
         </TouchableOpacity>
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
      <Animated.Image source={require('./hiywal.png')} style={{ width: 280, height: 280, borderRadius: 20, transform: [{ scale: scaleValue }], opacity: opacityValue, marginBottom: 30 }} resizeMode="contain" />
      <Animated.Text style={{ color: '#ffc107', fontSize: 28, fontWeight: '900', opacity: opacityValue, textAlign: 'center', paddingHorizontal: 20 }}>Welcome, {user.full_name}!</Animated.Text>
      <Animated.Text style={{ color: '#e9ecef', fontSize: 16, opacity: opacityValue, marginTop: 10, fontWeight: '600' }}>Service for the Sake of Allah</Animated.Text>
    </View>
  );
}


// ==========================================
// GLOBAL STYLES (SLIM & SLEEK NAVY THEME)
// ==========================================
const webDateStyle = { 
  borderWidth: '1px', borderColor: '#CBD5E1', borderRadius: '10px', padding: '14px', 
  fontSize: '14px', marginBottom: '14px', backgroundColor: '#FFFFFF', width: '100%', 
  boxSizing: 'border-box', fontFamily: 'inherit', color: '#1E293B', fontWeight: '600', 
  outline: 'none', transition: 'all 0.2s ease'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FE' }, 
  authContainer: { flex: 1, backgroundColor: '#002752', justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }, 
  
  sidebarContainer: { width: 280, backgroundColor: '#002752', height: '100%', borderRightWidth: 1, borderRightColor: '#001a38', zIndex: 100 },
  sidebarMobileAbsolute: { position: 'absolute', left: 0, top: 0, bottom: 0, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  sidebarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,26,56,0.6)', zIndex: 90, backdropFilter: 'blur(3px)' },
  sidebarHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#001a38' },
  sidebarBrand: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0 },
  sidebarRole: { fontSize: 11, fontWeight: '600', color: '#ffc107', marginTop: 2, letterSpacing: 0.5 },
  sidebarSectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginLeft: 16, marginBottom: 8, marginTop: 12, letterSpacing: 1 },
  sidebarBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderLeftWidth: 3, borderLeftColor: 'transparent', marginBottom: 2 },
  sidebarBtnActive: { backgroundColor: '#001a38', borderLeftColor: '#ffc107' },
  sidebarBtnText: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  sidebarBtnTextActive: { color: '#FFFFFF', fontWeight: '800' },
  sidebarFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#001a38' },
  logoutBtn: { backgroundColor: '#001a38', padding: 12, borderRadius: 10, alignItems: 'center' },

  contentHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 28, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 },
  contentTitle: { fontSize: 16, fontWeight: '700', color: '#004085' },

  authCard: { backgroundColor: '#FFFFFF', width: '90%', maxWidth: 420, alignSelf: 'center', padding: 32, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.04)' },
  formCard: { backgroundColor: '#FFFFFF', marginVertical: 8, padding: 24, borderRadius: 20, width: '100%', maxWidth: 1100, alignSelf: 'center', borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' },
  adminCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' },
  
  authTitle: { fontSize: 24, fontWeight: '800', color: '#004085', textAlign: 'center', marginBottom: 8 },
  authSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 28, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#004085', marginBottom: 20 },
  
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 14, fontSize: 14, marginBottom: 14, backgroundColor: '#FFFFFF', color: '#1E293B', fontWeight: '600' },
  
  button: { backgroundColor: '#004085', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  neatBtnPrimary: { backgroundColor: '#004085', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  neatBtnSuccess: { backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  neatBtnDark: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  neatBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  neatBtnTextDark: { color: '#004085', fontWeight: '600', fontSize: 13 },

  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, width: '100%', maxWidth: 1100, alignSelf: 'center', marginTop: 8 },
  bentoBox: { backgroundColor: '#FFFFFF', flexBasis: '48%', flexGrow: 1, minWidth: 280, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' },
  bentoIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  bentoTitle: { fontSize: 16, fontWeight: '600', color: '#004085', marginBottom: 4 },
  bentoDesc: { fontSize: 13, color: '#64748B', fontWeight: '400', lineHeight: 20 },

  dropdownBtn: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 14, marginBottom: 14, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },  dropdownBtnText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },  dropdownList: { position: 'absolute', top: 72, left: 0, right: 0, zIndex: 9999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, elevation: 10, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  dropdownItemText: { fontSize: 14, color: '#004085', fontWeight: '800' },
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChipRow: { flexDirection: 'row', marginBottom: 12 },
  filterChip: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  filterChipActive: { backgroundColor: '#004085', borderColor: '#004085' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#475569' },

  alertBox: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', marginBottom: 20 },
  alertText: { color: '#991B1B', fontWeight: '600', fontSize: 13 },
  alertRedBox: { backgroundColor: '#FEF2F2', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA', marginBottom: 24 },
  alertRedText: { color: '#991B1B', fontWeight: '600', textAlign: 'center', fontSize: 14 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  infoBadge: { backgroundColor: '#F8FAFC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  infoBadgeTxt: { fontSize: 12, fontWeight: '600', color: '#004085' },
  
  statGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  statBoxLarge: { backgroundColor: '#004085', padding: 16, borderRadius: 16, flex: 1, minWidth: 100, alignItems: 'center', elevation: 2 },
  statLargeVal: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  statLargeKey: { fontSize: 10, color: '#E2E8F0', textAlign: 'center', marginTop: 6, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  statWrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statChip: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, width: '48%', flexDirection: 'column', borderWidth: 1, borderColor: '#E2E8F0' },
  statChipKey: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  statChipVal: { fontSize: 18, color: '#004085', fontWeight: '700' },
  
  quickSelectContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 20 },
  quickBtn: { backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 10, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  quickBtnActive: { backgroundColor: '#004085', borderColor: '#004085' },
  quickBtnText: { fontWeight: '600', color: '#64748B', fontSize: 13 },
  quickBtnTextActive: { color: '#FFFFFF' },
  totalBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  totalBoxText: { fontSize: 20, fontWeight: '700', textAlign: 'center', color: '#004085' },

  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 16 },
  historyDetails: { fontSize: 13, color: '#64748B', fontWeight: '400', marginTop: 4 },
  receiptCard: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 450, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  receiptTitle: { fontSize: 26, fontWeight: '700', color: '#004085', textAlign: 'center', marginBottom: 4 },
  receiptSubtitle: { fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 20, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  receiptDivider: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginVertical: 16 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  receiptLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  receiptVal: { fontSize: 14, color: '#004085', flexShrink: 1, textAlign: 'right', marginLeft: 10, fontWeight: '600' },
  receiptTotalBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  receiptTotalText: { fontSize: 18, fontWeight: '700', color: '#004085', textAlign: 'center' },
  receiptBtn: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  receiptBtnText: { fontSize: 12, fontWeight: '600', color: '#004085' },
  
  idCardContainer: { width: 300, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' },
  idCardHeader: { backgroundColor: '#004085', paddingVertical: 20, paddingHorizontal: 16, position: 'relative' },
  idCardPhoto: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FFFFFF', marginTop: -50, backgroundColor: '#F1F5F9' },
  
  roleBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  roleBtnActive: { backgroundColor: '#FFFFFF', borderColor: '#004085', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  roleBtnTextActive: { color: '#004085' },
  wizardProgress: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20, marginTop: 8 },
  adminCardTitle: { fontSize: 16, fontWeight: '600', color: '#004085', marginBottom: 4 },
  adminCardMeta: { fontSize: 13, color: '#64748B', fontWeight: '400', marginBottom: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F8FAFC', marginLeft: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#004085' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', marginHorizontal: 0, marginVertical: 16, borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' },
  tabBtnText: { fontWeight: '500', color: '#64748B', fontSize: 13 },
  tabBtnTextActive: { color: '#004085', fontWeight: '600' },
  modalOverlay: { position: Platform.OS === 'web' ? 'fixed' : 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 39, 82, 0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' },
  modalCard: { backgroundColor: '#FFFFFF', width: '90%', maxWidth: 450, padding: 32, borderRadius: 20, elevation: 0, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  checkboxActive: { backgroundColor: '#004085', borderColor: '#004085' },
  detailTxt: { fontSize: 14, color: '#475569', marginBottom: 8, fontWeight: '400' },
  chartCard: { backgroundColor: '#FFFFFF', flexBasis: '48%', flexGrow: 1, minWidth: 300, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' },
});