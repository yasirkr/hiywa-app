import React, { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBK8-yEDwHb1G7AkKMQPu9ptxYB1zmiEDI",
  authDomain: "hiywa-27651.firebaseapp.com",
  projectId: "hiywa-27651",
  storageBucket: "hiywa-27651.firebasestorage.app",
  messagingSenderId: "596413315692",
  appId: "1:596413315692:web:177ddba0ffa9fc5eea3649"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- ROYAL NAVY & GOLD THEME PALETTE ---
export const THEME = {
  primaryDark: '#0a192f',
  primary: '#1e3a8a',
  primaryLight: '#2563eb',
  accent: '#d97706',
  accentLight: '#fef3c7',
  bgGradient: 'linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%)',
  headerGradient: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)',
  cardGradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
};

// --- GLOBAL ALERT OVERRIDE ---
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

export const confirmAction = (title, message, onConfirm, confirmText = 'Confirm', destructive = true) => {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm }
  ]);
};

export const CustomAlertProvider = () => {
  const [config, setConfig] = useState(null);
  useEffect(() => { globalAlertTrigger = setConfig; }, []);
  if (!config) return null;

  // Auto-detect if it's a success message to show a green tick
  const isSuccess = config.title?.toLowerCase().includes('success') || config.title?.toLowerCase().includes('complete') || config.title?.toLowerCase().includes('saved') || config.message?.toLowerCase().includes('successful') || config.message?.toLowerCase().includes('promoted') || config.message?.toLowerCase().includes('updated');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '280px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '20px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
        {/* Dynamic Icon based on Success or Alert */}
        <div style={{ width: '48px', height: '48px', backgroundColor: isSuccess ? '#dcfce7' : '#eff6ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: isSuccess ? '#16a34a' : '#1e3a8a', fontSize: '24px', fontWeight: '900' }}>
          {isSuccess ? '✓' : '!'}
        </div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>{config.title}</h3>
        {!!config.message && <p style={{ margin: '0 0 18px 0', fontSize: '11px', color: '#475569', lineHeight: '1.4', fontWeight: '600', whiteSpace: 'pre-line' }}>{config.message}</p>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {config.buttons.map((btn, idx) => {
            const isCancel = btn.style === 'cancel';
            const isDestruct = btn.style === 'destructive';
            return (
              <button
                key={idx}
                onClick={() => { setConfig(null); if (btn.onPress) btn.onPress(); }}
                style={{ flex: 1, padding: '10px', backgroundColor: isCancel ? '#f1f5f9' : isDestruct ? '#ef4444' : '#1e3a8a', color: isCancel ? '#475569' : '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                {btn.text || 'OK'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- COMPACT FORM DROPDOWN ---
export const FormDropdown = ({ label, value, options, onSelect, placeholder = "SELECT" }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ flex: '1 1 200px', position: 'relative', marginBottom: '8px', zIndex: open ? 1000 : 1 }}>
      <label style={{ display: 'block', fontSize: '9px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.4px' }}>{label}</label>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '9px 11px', borderRadius: '9px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '11px', fontWeight: '700', color: value ? '#0f172a' : '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textTransform: 'uppercase' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || placeholder}</span>
        <span style={{ fontSize: '9px', color: '#64748b', marginLeft: '6px' }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '48px', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', maxHeight: '170px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 9999 }}>
          {options.map((o) => (
            <div
              key={o}
              onClick={() => { onSelect(o); setOpen(false); }}
              style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '11px', fontWeight: '800', color: '#1e3a8a', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPACT FILTER DROPDOWN (FOR REPORTS & DIRECTORY) ---
export const FilterDropdown = ({ label, value, options, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ flex: '1 1 110px', position: 'relative', zIndex: open ? 900 : 1 }}>
      <label style={{ display: 'block', fontSize: '8px', color: '#1e3a8a', fontWeight: '900', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</label>
      <div onClick={() => setOpen(!open)} style={{ padding: '7px 9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '10px', fontWeight: '800', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || 'ALL'}</span>
        <span style={{ fontSize: '8px', color: '#64748b' }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '42px', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', zIndex: 9999 }}>
          <div onClick={() => { onSelect(''); setOpen(false); }} style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '10px', fontWeight: '900', color: '#64748b', cursor: 'pointer' }}>ALL</div>
          {options.map(o => (
            <div key={o} onClick={() => { onSelect(o); setOpen(false); }} style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '10px', fontWeight: '800', color: '#0f172a', cursor: 'pointer' }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- COUNTRY CODES & CONSTANTS ---
export const COUNTRY_CODES = [
  { code: '+91', name: 'IND', max: 10 }, { code: '+971', name: 'UAE', max: 9 },
  { code: '+966', name: 'KSA', max: 9 }, { code: '+968', name: 'OMN', max: 8 },
  { code: '+974', name: 'QAT', max: 8 }, { code: '+973', name: 'BHR', max: 8 },
  { code: '+965', name: 'KWT', max: 8 }, { code: '+60', name: 'MYS', max: 10 },
  { code: '+65', name: 'SGP', max: 8 }, { code: '+1', name: 'USA/CAN', max: 10 },
  { code: '+44', name: 'UK', max: 10 }, { code: '+61', name: 'AUS', max: 9 }
];

export const EDU_CATEGORIES = ['MEDICAL', 'ENGINEERING & IT', 'ARTS & SCIENCE', 'COMMERCE & MANAGEMENT', 'LAW', 'AGRICULTURE', 'DIPLOMA / ITI', 'SCHOOL LEVEL', 'PHD / DOCTORATE', 'OTHERS'];
export const CLASSES = ['1ST STD', '2ND STD', '3RD STD', '4TH STD', '5TH STD', '6TH STD', '7TH STD', '8TH STD', '9TH STD', '10TH STD', '11TH STD', '12TH STD', 'UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'];
export const ISLAMIC_QUALS = ['AALIM', 'HAAFIZH', 'OTHERS'];
export const SCHOOL_TYPES = ['GOVERNMENT SCHOOL', 'GOVERNMENT AIDED SCHOOL', 'PRIVATE SCHOOL'];
export const COLLEGE_TYPES = ['GOVERNMENT COLLEGE', 'PRIVATE COLLEGE', 'GOVT AIDED COLLEGE', 'OTHERS'];
export const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const NATIVE_PLACES = ['MAHARAJAPURAM', 'THAMBIPATTI', 'KRISHNAPURAM', 'OTHERS'];
export const MARITAL_STATUS = ['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'];
export const MEDIUMS = ['TAMIL', 'ENGLISH', 'OTHERS'];