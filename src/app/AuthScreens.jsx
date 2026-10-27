import React, { useState, useEffect } from 'react';
import { Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import {
  db, FormDropdown, COUNTRY_CODES, EDU_CATEGORIES, CLASSES, ISLAMIC_QUALS,
  SCHOOL_TYPES, COLLEGE_TYPES, GENDERS, BLOOD_GROUPS,
  NATIVE_PLACES, MARITAL_STATUS, MEDIUMS
} from './theme';

// ==========================================
// 0. INITIAL APP OPEN SPLASH CARD (MOBILE & WEB)
// ==========================================
export function InitialAppSplash({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => { onFinish(); }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px', textAlign: 'center' }}>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: '28px', padding: '32px 28px', maxWidth: '310px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', animation: 'pulse 1.8s infinite' }}>
        <div style={{ width: '84px', height: '84px', borderRadius: '20px', backgroundColor: '#ffffff', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: '2px solid #fbbf24' }}>
          <Image source={require('./hiywalogo.png')} style={{ width: 70, height: 70, borderRadius: 14 }} resizeMode="contain" />
        </div>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#ffffff', letterSpacing: '1px' }}>HIYWA CONNECT</h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '9px', color: '#fbbf24', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>MTK PURAM • EST. 2001</p>
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.12)', margin: '16px 0' }} />
        <p style={{ margin: 0, fontSize: '10px', color: '#93c5fd', fontWeight: '700', letterSpacing: '0.5px' }}>Committed to Service & Community Welfare</p>
      </div>
      <style>{`@keyframes pulse { 0% { opacity: 0.9; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.9; transform: scale(0.98); } }`}</style>
    </div>
  );
}

// ==========================================
// 1. POST-LOGIN WELCOME SPLASH SCREEN
// ==========================================
export function LoginSplashScreen({ user, onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => { onFinish(); }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px', textAlign: 'center' }}>
      <div style={{ animation: 'smoothFadeIn 0.8s ease-out forwards', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '340px', width: '100%' }}>
        {/* CURVED BORDERS LOGO CONTAINER */}
        <div style={{ width: '150px', height: '150px', borderRadius: '30px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)', border: '2px solid rgba(251,191,36,0.35)' }}>
          <Image source={require('./hiywa.png')} style={{ width: '100%', height: '100%', borderRadius: 30 }} resizeMode="contain" />
        </div>
        <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Assalamu Alaikum,</p>
        <h2 style={{ margin: '0 0 14px 0', fontSize: '22px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>{user?.full_name}</h2>
        <div style={{ width: '80px', height: '2px', backgroundColor: 'rgba(251,191,36,0.4)', margin: '0 auto 14px auto' }} />
        <p style={{ margin: 0, fontSize: '12.5px', color: '#93c5fd', fontWeight: '700', fontStyle: 'italic', letterSpacing: '0.5px' }}>"Service for the sake of Allah"</p>
      </div>
      <style>{`@keyframes smoothFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

// ==========================================
// 2. ROYAL NAVY & GOLD LOGIN SCREEN
// ==========================================
export function LoginScreen({ onNavigate, onLogin }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [allowPublicReg, setAllowPublicReg] = useState(false);

  const [forcePassUser, setForcePassUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const sDoc = await getDoc(doc(db, 'settings', 'global'));
        if (sDoc.exists()) setAllowPublicReg(sDoc.data().allow_public_registration === true);
      } catch (e) {}
    };
    fetchSettings();
  }, []);

  const handleHardRefresh = () => {
    if (Platform.OS === 'web') {
      if ('caches' in window) caches.keys().then((names) => names.forEach(name => caches.delete(name)));
      if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach(r => r.unregister()));
      setTimeout(() => window.location.reload(true), 300);
    }
  };

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!loginId || !password) return alert('Please enter your Official Login ID and password');
    setIsSubmitting(true);
    try {
      const userSnap = await getDoc(doc(db, 'members', loginId.trim().toUpperCase()));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password === password) {
          if (userData.membership_status === 'INACTIVE' || userData.membership_status === 'DECEASED') {
            return alert('Login Failed: Your account is deactivated. Contact Admin.');
          }
          if (password === 'Hiywa@123') setForcePassUser(userData);
          else onLogin(userData);
        } else alert('Login Failed: Incorrect Password');
      } else alert('Login Failed: Official ID not found');
    } catch (error) {
      alert('Login error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNewPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (newPassword.length < 6) return alert('Password must be at least 6 characters long.');
    if (newPassword !== confirmPassword) return alert('Passwords do not match!');
    if (newPassword === 'Hiywa@123') return alert('Choose a different password.');
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'members', forcePassUser.official_id), { password: newPassword });
      await setDoc(doc(db, 'system_logs', `USR_${Date.now()}`), {
        timestamp: new Date().toISOString(),
        member_id: forcePassUser.official_id,
        full_name: forcePassUser.full_name,
        event_type: 'USER_EVENT',
        action: 'Changed Account Password',
        details: `${forcePassUser.full_name} (${forcePassUser.official_id}) updated their login password.`
      });
      alert('Password updated successfully!');
      onLogin({ ...forcePassUser, password: newPassword });
    } catch (error) {
      alert('Failed to update password: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (isFocused) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px 12px 40px',
    borderRadius: '12px',
    backgroundColor: isFocused ? '#ffffff' : '#f8fafc',
    border: `1.5px solid ${isFocused ? '#1e3a8a' : '#cbd5e1'}`,
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f172a', outline: 'none', transition: 'all 0.2s ease'
  });

  if (forcePassUser) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '320px', borderRadius: '24px', padding: '24px 20px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', backgroundColor: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', fontSize: '20px' }}>🔒</div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Update Password</h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Change your default password before entering.</p>
          <form onSubmit={submitNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '9px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '3px', fontSize: '12px', fontWeight: '700', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '9px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '3px', fontSize: '12px', fontWeight: '700', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: '6px', padding: '12px', background: 'linear-gradient(135deg, #1e3a8a 0%, #0a192f 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>
              {isSubmitting ? 'Saving...' : 'Save & Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '330px', borderRadius: '26px', padding: '28px 22px', boxShadow: '0 25px 50px rgba(0,0,0,0.35)', position: 'relative', zIndex: 10 }}>
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <button type="button" onClick={handleHardRefresh} title="Force Update" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '10px', color: '#1e3a8a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
            <Image source={require('./hiywalogo.png')} style={{ width: 100, height: 100 }} resizeMode="contain" />
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0a192f', letterSpacing: '0.5px' }}>HIYWA CONNECT</h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '9px', color: '#d97706', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>MTK PURAM • MEMBER PORTAL</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focusedInput === 'loginId' ? '#1e3a8a' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="OFFICIAL ID (E.G. HIYWA0001)"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value.replace(/\s/g, '').toUpperCase())}
              onFocus={() => setFocusedInput('loginId')}
              onBlur={() => setFocusedInput(null)}
              required
              style={{ ...inputStyle(focusedInput === 'loginId'), textTransform: 'uppercase' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focusedInput === 'password' ? '#1e3a8a' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              required
              style={inputStyle(focusedInput === 'password')}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b', display: 'flex', alignItems: 'center' }}>
              {showPassword ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <button type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: '4px', padding: '13px', background: 'linear-gradient(135deg, #1e3a8a 0%, #0a192f 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30, 58, 138, 0.3)' }}>
            {isSubmitting ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        {allowPublicReg && (
          <div style={{ marginTop: '16px', textAlign: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={() => onNavigate('register')} style={{ background: 'none', border: 'none', color: '#1e3a8a', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer' }}>
              New Member? Register Here →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. COMPACT REGISTRATION WIZARD (WITH AADHAAR & COUNTRY CODES)
// ==========================================
export function RegisterScreen({ onBack, defaultRole = null, isAdminAuth = false }) {
  const [role, setRole] = useState(defaultRole);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [age, setAge] = useState('');

  const [formData, setFormData] = useState({
    full_name: '', father_name: '', mother_name: '', parents_status: '', gender: '', dob: '',
    blood_group: '', native_place: '', country_code: '+91', phone_number: '', email: '', address: '', password: '',
    whatsapp_number: '', aadhaar_input: '', current_location: '', occupation: '',
    educational_qualification: '', course_details: '', marital_status: '', student_mobile: '',
    class_grade: '', school_name: '', medium_of_instruction: '', school_type: '', school_location: '',
    profile_photo: null, islamic_studies: 'NO', islamic_qualification: '', madrasa_name: '', madrasa_location: ''
  });

  const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(formData.class_grade);
  const selectedCountry = COUNTRY_CODES.find(c => c.code === (formData.country_code || '+91')) || COUNTRY_CODES[0];

  const pickImage = async () => {
    let r = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.1, width: 250, height: 250, base64: true
    });
    if (!r.canceled && r.assets[0].base64) {
      const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
      if (b64.length > 950000) return alert("Image too large. Please crop it smaller.");
      setFormData({ ...formData, profile_photo: b64 });
    }
  };

  const handleDobChange = (val) => {
    setFormData({ ...formData, dob: val });
    if (val) setAge(String(new Date().getFullYear() - new Date(val).getFullYear()));
  };

  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.full_name || !formData.father_name || !formData.mother_name || !formData.parents_status || !formData.gender || !formData.dob || !formData.aadhaar_input) {
      return alert('Please fill all mandatory (*) fields.');
    }
    if (formData.aadhaar_input.length !== 12) return alert('Aadhaar Number must be exactly 12 digits.');
    if (!formData.phone_number) return alert('Mobile number is required.');
    setIsSubmitting(true);

    try {
      const finalData = { ...formData };
      finalData['aadhaar_number'] = finalData.aadhaar_input;
      delete finalData.aadhaar_input;

      for (let key in finalData) {
        if (typeof finalData[key] === 'string' && key !== 'profile_photo' && key !== 'password' && key !== 'email') {
          finalData[key] = finalData[key].toUpperCase();
        }
      }
      const membersSnap = await getDocs(collection(db, 'members'));
      const newIdNumber = membersSnap.size + 1;
      const officialId = `HIYWA${String(newIdNumber).padStart(4, '0')}`;
      finalData.official_id = officialId;
      finalData.membership_status = 'ACTIVE';
      finalData.join_date = new Date().toISOString();
      finalData.total_months_paid = 0;
      finalData.subscription_started = false; // Prevents dues from tracking until Admin clicks "Start Subscription"

      if (newIdNumber === 1) {
        finalData.role = 'ADMIN';
        finalData.is_core_admin = true;
        finalData.admin_permissions = JSON.stringify(['ALL']);
      } else {
        finalData.role = role;
        finalData.is_core_admin = false;
      }
      if (isAdminAuth) finalData.password = 'Hiywa@123';

      await setDoc(doc(db, 'members', officialId), finalData);
      setRegisteredUser(finalData);
    } catch (error) {
      alert('Registration Failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const compactInput = {
    width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: '9px',
    border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '11px',
    fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', outline: 'none'
  };
  const compactLabel = { display: 'block', fontSize: '9px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.4px' };

  if (registeredUser) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '310px', backgroundColor: '#fff', borderRadius: '22px', padding: '22px', textAlign: 'center', boxShadow: '0 20px 30px rgba(0,0,0,0.25)' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#1e3a8a', fontSize: '22px', fontWeight: '900' }}>✓</div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>Registration Complete!</h3>
          <p style={{ margin: '0 0 14px 0', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{registeredUser.full_name} has been added.</p>
          <div style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '14px', padding: '12px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ display: 'block', fontSize: '8px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Official Login ID</span>
              <span style={{ display: 'block', fontSize: '16px', color: '#1e3a8a', fontWeight: '900', letterSpacing: '1px' }}>{registeredUser.official_id}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '8px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Password</span>
              <span style={{ display: 'block', fontSize: '12px', color: '#0f172a', fontWeight: '900' }}>{isAdminAuth ? 'Hiywa@123 (Default)' : 'Custom Set Password'}</span>
            </div>
          </div>
          <button onClick={() => { setRole(null); setRegisteredUser(null); onBack(); }} style={{ width: '100%', padding: '11px', backgroundColor: '#0a192f', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div style={{ padding: '16px', maxWidth: '560px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '18px', padding: '16px 18px', border: '1px solid #e2e8f0', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>Select Registration Type</h2>
            <p style={{ margin: '3px 0 0 0', fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Choose Member or Student Wing</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div onClick={() => setRole('MEMBER')} style={{ backgroundColor: '#fff', borderRadius: '18px', padding: '22px 14px', textAlign: 'center', border: '1px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '44px', height: '44px', backgroundColor: '#eff6ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', fontSize: '22px' }}>🧑‍💼</div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>HIYWA Member</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Standard Trust Member Registration</p>
            <span style={{ display: 'inline-block', padding: '7px 14px', backgroundColor: '#1e3a8a', color: '#fff', borderRadius: '8px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Select Member</span>
          </div>
          <div onClick={() => setRole('STUDENT')} style={{ backgroundColor: '#fff', borderRadius: '18px', padding: '22px 14px', textAlign: 'center', border: '1px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '44px', height: '44px', backgroundColor: '#fef3c7', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', fontSize: '22px' }}>🎓</div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>Student</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '10px', color: '#64748b', fontWeight: '600' }}>School & College Wing Registration</p>
            <span style={{ display: 'inline-block', padding: '7px 14px', backgroundColor: '#d97706', color: '#fff', borderRadius: '8px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Select Student</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <form onSubmit={handleRegister} style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0a192f', textTransform: 'uppercase' }}>{role} Registration</h3>
          <button type="button" onClick={() => { if (isAdminAuth) onBack(); else setRole(null); }} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>← Back</button>
        </div>

        {/* Photo Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px' }}>
          <div onClick={pickImage} style={{ cursor: 'pointer', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {formData.profile_photo ? <img src={formData.profile_photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '20px' }}>📷</span>}
          </div>
          <span onClick={pickImage} style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase', cursor: 'pointer' }}>Upload Photo (Max 1MB)</span>
        </div>

        <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>1. Personal Details</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Full Name *</label><input style={compactInput} value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value.toUpperCase() })} required /></div>
          <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Father's Name *</label><input style={compactInput} value={formData.father_name} onChange={e => setFormData({ ...formData, father_name: e.target.value.toUpperCase() })} required /></div>
          <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Mother's Name *</label><input style={compactInput} value={formData.mother_name} onChange={e => setFormData({ ...formData, mother_name: e.target.value.toUpperCase() })} required /></div>
          <FormDropdown label="Parents Status *" value={formData.parents_status} options={['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED']} onSelect={v => setFormData({ ...formData, parents_status: v })} />
          <FormDropdown label="Gender *" value={formData.gender} options={GENDERS} onSelect={v => setFormData({ ...formData, gender: v })} />
          <div style={{ flex: '1 1 140px' }}><label style={compactLabel}>Date of Birth *</label><input type="date" style={compactInput} value={formData.dob} onChange={e => handleDobChange(e.target.value)} required /></div>
          <div style={{ flex: '1 1 70px' }}><label style={compactLabel}>Age</label><input style={{ ...compactInput, backgroundColor: '#e2e8f0' }} value={age} readOnly /></div>
          <FormDropdown label="Blood Group" value={formData.blood_group} options={BLOOD_GROUPS} onSelect={v => setFormData({ ...formData, blood_group: v })} />
          {role === 'MEMBER' && <FormDropdown label="Marital Status" value={formData.marital_status} options={MARITAL_STATUS} onSelect={v => setFormData({ ...formData, marital_status: v })} />}
          <div style={{ flex: '1 1 200px' }}>
            <label style={compactLabel}>Aadhaar Number (12-Digits) *</label>
            <input type="tel" maxLength="12" placeholder="Enter 12-Digit Aadhaar" style={compactInput} value={formData.aadhaar_input} onChange={e => setFormData({ ...formData, aadhaar_input: e.target.value.replace(/\D/g, '') })} required />
          </div>
        </div>

        <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>2. Education & Occupation</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {role === 'MEMBER' ? (
            <>
              <FormDropdown label="Education Category" value={formData.educational_qualification} options={EDU_CATEGORIES} onSelect={v => setFormData({ ...formData, educational_qualification: v })} />
              <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Course / Specialization</label><input style={compactInput} value={formData.course_details} onChange={e => setFormData({ ...formData, course_details: e.target.value.toUpperCase() })} /></div>
              <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Occupation / Job</label><input style={compactInput} value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value.toUpperCase() })} /></div>
            </>
          ) : (
            <>
              <FormDropdown label="Class / Grade" value={formData.class_grade} options={CLASSES} onSelect={v => setFormData({ ...formData, class_grade: v })} />
              {isCollegeEdit && (
                <>
                  <FormDropdown label="Education Category" value={formData.educational_qualification} options={EDU_CATEGORIES} onSelect={v => setFormData({ ...formData, educational_qualification: v })} />
                  <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Course / Major</label><input style={compactInput} value={formData.course_details} onChange={e => setFormData({ ...formData, course_details: e.target.value.toUpperCase() })} /></div>
                </>
              )}
              <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Institution Name</label><input style={compactInput} value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value.toUpperCase() })} /></div>
              <FormDropdown label="Institution Type" value={formData.school_type} options={isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES} onSelect={v => setFormData({ ...formData, school_type: v })} />
              <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Institution Location</label><input style={compactInput} value={formData.school_location} onChange={e => setFormData({ ...formData, school_location: e.target.value.toUpperCase() })} /></div>
              <FormDropdown label="Medium" value={formData.medium_of_instruction} options={MEDIUMS} onSelect={v => setFormData({ ...formData, medium_of_instruction: v })} />
            </>
          )}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={compactLabel}>Islamic Studies Completed/Pursuing?</label>
          <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
            {['YES', 'NO'].map(opt => (
              <button type="button" key={opt} onClick={() => setFormData({ ...formData, islamic_studies: opt })} style={{ padding: '5px 14px', borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: '900', backgroundColor: formData.islamic_studies === opt ? '#1e3a8a' : '#f1f5f9', color: formData.islamic_studies === opt ? '#fff' : '#475569', cursor: 'pointer' }}>{opt}</button>
            ))}
          </div>
          {formData.islamic_studies === 'YES' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <FormDropdown label="Qualification" value={formData.islamic_qualification} options={ISLAMIC_QUALS} onSelect={v => setFormData({ ...formData, islamic_qualification: v })} />
              <div style={{ flex: '1 1 180px' }}><label style={compactLabel}>Madrasa Name</label><input style={compactInput} value={formData.madrasa_name} onChange={e => setFormData({ ...formData, madrasa_name: e.target.value.toUpperCase() })} /></div>
              <div style={{ flex: '1 1 180px' }}><label style={compactLabel}>Madrasa Location</label><input style={compactInput} value={formData.madrasa_location} onChange={e => setFormData({ ...formData, madrasa_location: e.target.value.toUpperCase() })} /></div>
            </div>
          )}
        </div>

        <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>3. Contact & Address (With Country Code)</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {role === 'STUDENT' && (
            <div style={{ flex: '1 1 200px' }}>
              <label style={compactLabel}>Student Mobile (Optional)</label>
              <input type="tel" maxLength="10" style={compactInput} value={formData.student_mobile} onChange={e => setFormData({ ...formData, student_mobile: e.target.value.replace(/\D/g, '') })} />
            </div>
          )}

          {/* Primary Mobile with Country Code Dropdown */}
          <div style={{ flex: '1 1 240px' }}>
            <label style={compactLabel}>{role === 'STUDENT' ? "Parent's Mobile *" : "Primary Mobile *"}</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select
                value={formData.country_code || '+91'}
                onChange={e => setFormData({ ...formData, country_code: e.target.value })}
                style={{ width: '85px', padding: '9px 4px', borderRadius: '9px', border: '1px solid #cbd5e1', backgroundColor: '#eff6ff', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', outline: 'none' }}
              >
                {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
              </select>
              <input
                type="tel"
                maxLength={selectedCountry.max}
                placeholder={`${selectedCountry.max}-Digit Number`}
                style={{ ...compactInput, flex: 1 }}
                value={formData.phone_number}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, phone_number: v, whatsapp_number: sameAsMobile ? v : formData.whatsapp_number });
                }}
                required
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={compactLabel}>WhatsApp Number</label>
              <span onClick={() => { const next = !sameAsMobile; setSameAsMobile(next); if (next) setFormData({ ...formData, whatsapp_number: formData.phone_number }); }} style={{ fontSize: '8.5px', color: '#1e3a8a', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>{sameAsMobile ? '☑ Same' : '☐ Same as Mobile'}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ padding: '9px 8px', borderRadius: '9px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '10px', fontWeight: '800', color: '#475569' }}>{formData.country_code || '+91'}</span>
              <input type="tel" maxLength={selectedCountry.max} style={{ ...compactInput, flex: 1 }} value={formData.whatsapp_number} onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value.replace(/\D/g, '') })} />
            </div>
          </div>

          <FormDropdown label="Native Place" value={formData.native_place} options={NATIVE_PLACES} onSelect={v => setFormData({ ...formData, native_place: v })} />
          <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Current City / Location</label><input style={compactInput} value={formData.current_location} onChange={e => setFormData({ ...formData, current_location: e.target.value.toUpperCase() })} /></div>
          <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Email Address</label><input type="email" style={{ ...compactInput, textTransform: 'none' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
          {!isAdminAuth && <div style={{ flex: '1 1 200px' }}><label style={compactLabel}>Create Password *</label><input type="password" style={{ ...compactInput, textTransform: 'none' }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required /></div>}
          <div style={{ flex: '1 1 100%' }}><label style={compactLabel}>Permanent Address</label><textarea rows="2" style={{ ...compactInput, fontFamily: 'inherit' }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value.toUpperCase() })} /></div>
        </div>

        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1e3a8a 0%, #0a192f 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer' }}>
          {isSubmitting ? 'Creating Profile...' : '✅ Complete Registration'}
        </button>
      </form>
    </div>
  );
}