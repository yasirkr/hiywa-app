import React, { useState, useEffect, useRef } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { CustomAlertProvider } from './theme';
import Header from './Header';
import { LoginScreen, RegisterScreen, LoginSplashScreen } from './AuthScreens';
import { HomeScreen, UserProfileScreen, SubscriptionScreen, DonationPortal, FundraisingListScreen, CampaignDetailScreen, ReceiptPage, RamadanScreen, GoverningBodyScreen, BloodBankScreen, MyContributionScreen } from './MemberScreens';
import AdminDashboard from './AdminDashboard';

export default function MainApp() {
  return (
    <>
      <CustomAlertProvider />
      <MainAppContent />
    </>
  );
}

function MainAppContent() {
  const [bootSplash, setBootSplash] = useState(false);
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [splashUser, setSplashUser] = useState(null);
  const [registerRole, setRegisterRole] = useState(null);
  const [receiptBackView, setReceiptBackView] = useState('home');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExitToast, setShowExitToast] = useState(false);
  const [adminMode, setAdminMode] = useState(false); // New global admin state
  const backPressCount = useRef(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebBack = () => {
        if (currentView === 'login') return;
        if (currentView === 'home' || currentView === 'admin_stats') {
          window.history.pushState(null, '', window.location.href);
          if (backPressCount.current === 0) {
            backPressCount.current = 1;
            setShowExitToast(true);
            setTimeout(() => { backPressCount.current = 0; setShowExitToast(false); }, 2000);
          } else {
            setShowLogoutModal(true);
          }
          return;
        }
        if (currentView === 'register') setCurrentView('login');
        else if (currentView === 'campaignDetail') setCurrentView('fundraising');
        else if (currentView === 'receipt') setCurrentView(receiptBackView);
        else setCurrentView('home');
      };
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handleWebBack);
      return () => window.removeEventListener('popstate', handleWebBack);
    }
  }, [currentView, receiptBackView]);

  // 2. POST-LOGIN WELCOME SPLASH CARD (Always land on 'home')
  if (splashUser) {
    return (
      <LoginSplashScreen
        user={splashUser}
        onFinish={() => {
          const target = splashUser;
          setCurrentUser(target);
          setCurrentView('home'); // Always land on Home Page
          setSplashUser(null);
        }}
      />
    );
  }

  if (currentView === 'login') return <LoginScreen onNavigate={setCurrentView} onLogin={setSplashUser} />;

  // 3. PUBLIC REGISTER WITH VISIBLE TOP HEADER
  if (currentView === 'register') {
    return (
      <View style={{ flex: 1, height: '100%', backgroundColor: '#f0f4f8' }}>
        <Header isPublic={true} onBack={() => setCurrentView('login')} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}>
          <RegisterScreen defaultRole={null} isAdminAuth={false} onBack={() => setCurrentView('login')} />
        </ScrollView>
      </View>
    );
  }

  const handleDashboardNav = (view, passedRole = null) => {
    setRegisterRole(passedRole);
    setCurrentView(view);
  };

  const NavItem = ({ viewId, label, svgPath, isActiveOverride = false }) => {
    const active = isActiveOverride || currentView === viewId;
    return (
      <button
        onClick={() => setCurrentView(viewId)}
        style={{ flex: 1, background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '5px 0', color: active ? '#1e3a8a' : '#94a3b8', transition: 'all 0.2s' }}
      >
        <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={svgPath} />
        </svg>
        <span style={{ fontSize: '8.5px', fontWeight: active ? '900' : '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
      </button>
    );
  };

  return (
    <View style={{ flex: 1, height: '100%', backgroundColor: '#f0f4f8' }}>
      <Header currentUser={currentUser} onNavigate={handleDashboardNav} onLogout={() => setShowLogoutModal(true)} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 110 }}
        showsVerticalScrollIndicator={true}
      >
        <div style={{ background: 'linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%)', minHeight: '100%', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
          {currentView === 'home' && <HomeScreen currentUser={currentUser} onNavigate={handleDashboardNav} onLogout={() => setShowLogoutModal(true)} adminMode={adminMode} setAdminMode={setAdminMode} />}
          {currentView === 'governing' && <GoverningBodyScreen currentUser={currentUser} onBack={() => setCurrentView('home')} />}
          {currentView === 'blood' && <BloodBankScreen onBack={() => setCurrentView('home')} />}
          {currentView === 'profile' && <UserProfileScreen currentUser={currentUser} setCurrentUser={setCurrentUser} onBack={() => setCurrentView('home')} />}
          {currentView === 'ramadan' && <RamadanScreen onBack={() => setCurrentView('home')} />}
          {currentView === 'my_contributions' && <MyContributionScreen currentUser={currentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('my_contributions'); setCurrentView('receipt'); }} onBack={() => setCurrentView('home')} />}

          {currentView.startsWith('admin_') && (
            <AdminDashboard
              currentUser={currentUser}
              activeTab={currentView.replace('admin_', '').toUpperCase()}
              onNavigate={handleDashboardNav}
              onLogout={() => setShowLogoutModal(true)}
              onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView(currentView); setCurrentView('receipt'); }}
            />
          )}

          {currentView === 'adminRegister' && <RegisterScreen defaultRole={registerRole} isAdminAuth={true} onBack={() => setCurrentView(registerRole === 'STUDENT' ? 'admin_students' : 'admin_users')} />}
          {currentView === 'subscription' && <SubscriptionScreen currentUser={currentUser} setCurrentUser={setCurrentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('subscription'); setCurrentView('receipt'); }} onBack={() => setCurrentView('home')} />}
          {currentView === 'fundraising' && <FundraisingListScreen currentUser={currentUser} onSelectCampaign={(camp) => { setSelectedCampaign(camp); setCurrentView('campaignDetail'); }} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('fundraising'); setCurrentView('receipt'); }} onBack={() => setCurrentView('home')} />}
          {currentView === 'campaignDetail' && <CampaignDetailScreen campaign={selectedCampaign} currentUser={currentUser} onViewReceipt={(txn) => { setSelectedReceipt(txn); setReceiptBackView('campaignDetail'); setCurrentView('receipt'); }} onBack={() => setCurrentView('fundraising')} />}
          {currentView === 'receipt' && <ReceiptPage receipt={selectedReceipt} currentUser={currentUser} onBack={() => setCurrentView(receiptBackView)} />}
        </div>
      </ScrollView>

      {/* DYNAMIC FLOATING BOTTOM NAVIGATION BAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid #cbd5e1', zIndex: 999, boxShadow: '0 -4px 16px rgba(10,25,47,0.06)' }}>
        {adminMode ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '3px 6px' }}>
            <NavItem viewId="home" label="Workspace" isActiveOverride={currentView === 'home'} svgPath="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            <NavItem viewId="admin_users" label="Directory" svgPath="M17 20h5V4H2v16h5m10 0v-4a3 3 0 00-3-3h-4a3 3 0 00-3 3v4m10 0a3 3 0 00-3-3h-4a3 3 0 00-3 3m10 0H7" />
            <NavItem viewId="admin_contributions" label="Contribs" svgPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            <NavItem viewId="admin_finance" label="Finance" svgPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <NavItem viewId="admin_campaigns" label="Drives" svgPath="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </div>
        ) : (
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '3px 6px' }}>
            <NavItem viewId="home" label="Home" isActiveOverride={currentView === 'home'} svgPath="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            {currentUser?.role !== 'STUDENT' && (
              <NavItem viewId="subscription" label="Subscription" svgPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )}
            <NavItem viewId="fundraising" label="Drives" isActiveOverride={currentView === 'fundraising' || currentView === 'campaignDetail'} svgPath="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            <NavItem viewId="my_contributions" label="My Contribs" svgPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            <NavItem viewId="profile" label="Profile" svgPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </div>
        )}
      </div>

      {/* COMPACT LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: '250px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '18px 16px', textAlign: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', color: '#dc2626' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>Sign Out?</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Exit HIYWA Connect portal?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '9px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}>Cancel</button>
              <button onClick={() => { setShowLogoutModal(false); setCurrentUser(null); setCurrentView('login'); setAdminMode(false); }} style={{ flex: 1, padding: '9px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {showExitToast && (
        <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0a192f', color: '#ffffff', padding: '8px 16px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', zIndex: 10000, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
          Press back again to log out
        </div>
      )}
    </View>
  );
}