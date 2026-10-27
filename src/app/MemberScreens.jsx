import React, { useState, useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import {
  db, FormDropdown, COUNTRY_CODES, EDU_CATEGORIES, CLASSES, ISLAMIC_QUALS,
  SCHOOL_TYPES, COLLEGE_TYPES, GENDERS, BLOOD_GROUPS,
  NATIVE_PLACES, MARITAL_STATUS, MEDIUMS
} from './theme';

// ==========================================
// 0. REUSABLE MANUAL PAYMENT INSTRUCTIONS MODAL (UPI / G-PAY / PHONEPE)
// ==========================================
export function ManualPayModal({ visible, onClose, title = "Manual Payment Instructions", subtitle = "" }) {
  const [payInfo, setPayInfo] = useState({ primary_upi: '', secondary_upi: '', gpay_phonepe_number: '' });
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    if (visible) {
      getDoc(doc(db, 'settings', 'global')).then(sDoc => {
        if (sDoc.exists()) {
          const d = sDoc.data();
          setPayInfo({
            primary_upi: d.primary_upi || 'Not Set',
            secondary_upi: d.secondary_upi || '',
            gpay_phonepe_number: d.gpay_phonepe_number || 'Not Set'
          });
        }
      }).catch(() => {});
    }
  }, [visible]);

  if (!visible) return null;

  const copyText = (txt, key) => {
    if (!txt || txt === 'Not Set') return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(txt);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.72)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '330px', backgroundColor: '#ffffff', borderRadius: '24px', padding: '22px 20px', textAlign: 'center', boxShadow: '0 20px 45px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1' }}>
        <div style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '22px', border: '1px solid #fde68a' }}>
          🏦
        </div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase' }}>{title}</h3>
        {!!subtitle && <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#1e3a8a', fontWeight: '900', textTransform: 'uppercase' }}>{subtitle}</p>}
        <p style={{ margin: '0 0 14px 0', fontSize: '11px', color: '#475569', lineHeight: '1.45', fontWeight: '600' }}>
          Please transfer your contribution manually using any of the details below and <strong>inform the Admin</strong> to update your payment record:
        </p>

        <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', padding: '12px', border: '1px dashed #cbd5e1', textAlign: 'left', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Primary UPI ID</span>
              <span style={{ fontSize: '12px', fontWeight: '900', color: '#0a192f' }}>{payInfo.primary_upi}</span>
            </div>
            {payInfo.primary_upi !== 'Not Set' && (
              <button onClick={() => copyText(payInfo.primary_upi, 'PRI')} style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>
                {copiedKey === 'PRI' ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>

          {!!payInfo.secondary_upi && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Secondary UPI ID</span>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#0a192f' }}>{payInfo.secondary_upi}</span>
              </div>
              <button onClick={() => copyText(payInfo.secondary_upi, 'SEC')} style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>
                {copiedKey === 'SEC' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>G-Pay / PhonePe Number</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#d97706', letterSpacing: '0.5px' }}>{payInfo.gpay_phonepe_number}</span>
            </div>
            {payInfo.gpay_phonepe_number !== 'Not Set' && (
              <button onClick={() => copyText(payInfo.gpay_phonepe_number, 'GPAY')} style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>
                {copiedKey === 'GPAY' ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>

        <button onClick={onClose} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1e3a8a 0%, #0a192f 100%)', color: '#fbbf24', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer' }}>
          Got It
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 1. MODERN EXECUTIVE BOARD GOVERNING BODY (WITH PROFILE PREVIEW MODAL)
// ==========================================
export function GoverningBodyWidget({ isEditing = false }) {
  const [govBody, setGovBody] = useState({});
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMember, setPreviewMember] = useState(null); // { user, roleTitle }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const memSnap = await getDocs(collection(db, 'members'));
        setMembers(memSnap.docs.map(d => d.data()).filter(u => u.role !== 'STUDENT'));
        const govDoc = await getDoc(doc(db, 'settings', 'governing_body'));
        if (govDoc.exists()) setGovBody(govDoc.data());
      } catch (e) {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const saveGovBody = async () => {
    try {
      await setDoc(doc(db, 'settings', 'governing_body'), govBody);
      alert('Governing Body Updated!');
    } catch (e) { alert('Failed to save.'); }
  };

  let allAssigned = [];
  Object.values(govBody).forEach(val => { if (Array.isArray(val)) allAssigned.push(...val); else if (val) allAssigned.push(val); });

  const renderExecutiveCard = (roleKey, title, isPresident = false) => {
    const id = govBody[roleKey];
    const u = members.find(m => m.official_id === id);
    const availableMembers = members.filter(m => !allAssigned.includes(m.official_id) || m.official_id === id);

    return (
      <div
        key={roleKey}
        onClick={() => { if (!isEditing && u) setPreviewMember({ user: u, roleTitle: title }); }}
        style={{
          gridColumn: isPresident ? 'span 2' : 'span 1',
          background: isPresident ? 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)' : '#ffffff',
          borderRadius: '16px',
          padding: isPresident ? '14px 16px' : '12px 10px',
          border: isPresident ? '1.5px solid #d97706' : '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: isPresident ? 'row' : 'column',
          alignItems: 'center',
          gap: isPresident ? '14px' : '8px',
          cursor: (!isEditing && u) ? 'pointer' : 'default',
          boxShadow: isPresident ? '0 8px 20px rgba(10,25,47,0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
          textAlign: isPresident ? 'left' : 'center',
          position: 'relative'
        }}
      >
        {isEditing && (
          <select
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', padding: '5px', fontSize: '9px', fontWeight: '800', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '4px', backgroundColor: '#f8fafc', color: '#0f172a' }}
            value={id || ''}
            onChange={(e) => setGovBody({ ...govBody, [roleKey]: e.target.value })}
          >
            <option value="">-- VACANT --</option>
            {availableMembers.map(m => <option key={m.official_id} value={m.official_id}>{m.full_name}</option>)}
          </select>
        )}

        {u?.profile_photo ? (
          <img src={u.profile_photo} alt={u.full_name} style={{ width: isPresident ? '58px' : '46px', height: isPresident ? '58px' : '46px', borderRadius: '14px', objectFit: 'cover', border: isPresident ? '2px solid #fbbf24' : '1.5px solid #1e3a8a', flexShrink: 0 }} />
        ) : (
          <div style={{ width: isPresident ? '58px' : '46px', height: isPresident ? '58px' : '46px', borderRadius: '14px', backgroundColor: isPresident ? 'rgba(255,255,255,0.12)' : '#eff6ff', color: isPresident ? '#fbbf24' : '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isPresident ? '20px' : '16px', fontWeight: '900', flexShrink: 0, border: isPresident ? '1px solid rgba(251,191,36,0.4)' : 'none' }}>
            {u ? u.full_name?.charAt(0) : '👤'}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <span style={{ display: 'inline-block', backgroundColor: isPresident ? '#d97706' : '#eff6ff', color: isPresident ? '#ffffff' : '#1e3a8a', padding: '2px 8px', borderRadius: '6px', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
            {title}
          </span>
          <p style={{ margin: '0 0 2px 0', fontSize: isPresident ? '13px' : '11px', fontWeight: '900', color: isPresident ? '#ffffff' : '#0f172a', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {u ? u.full_name : 'VACANT'}
          </p>
          {u && (
            <p style={{ margin: 0, fontSize: '8.5px', fontWeight: '700', color: isPresident ? '#93c5fd' : '#64748b', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.occupation || u.educational_qualification || 'Tap to view profile'}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderCommitteeSection = (roleKey, title, badgeColor = '#0a192f') => {
    const list = govBody[roleKey] || [];
    const availableMembers = members.filter(m => !allAssigned.includes(m.official_id));

    return (
      <div key={roleKey} style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1', marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{title}</span>
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: '6px', fontSize: '8.5px', fontWeight: '900' }}>{list.length} Members</span>
        </div>

        {isEditing && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <select id={`add_${roleKey}`} style={{ flex: 1, padding: '7px', fontSize: '10px', fontWeight: '700', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
              <option value="">-- SELECT MEMBER TO ADD --</option>
              {availableMembers.map(m => <option key={m.official_id} value={m.official_id}>{m.full_name}</option>)}
            </select>
            <button type="button" onClick={() => { const sel = document.getElementById(`add_${roleKey}`); if (sel && sel.value && !list.includes(sel.value)) { setGovBody({ ...govBody, [roleKey]: [...list, sel.value] }); sel.value = ''; } }} style={{ backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 14px', fontWeight: '900', cursor: 'pointer' }}>+ Add</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {list.length === 0 ? (
            <p style={{ gridColumn: 'span 2', margin: '8px 0', textAlign: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>No members assigned</p>
          ) : list.map(id => {
            const u = members.find(m => m.official_id === id);
            return (
              <div
                key={id}
                onClick={() => { if (!isEditing && u) setPreviewMember({ user: u, roleTitle: title }); }}
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: (!isEditing && u) ? 'pointer' : 'default', position: 'relative' }}
              >
                {isEditing && (
                  <span onClick={(e) => { e.stopPropagation(); setGovBody({ ...govBody, [roleKey]: list.filter(i => i !== id) }); }} style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: '#fff', width: '18px', height: '18px', borderRadius: '50%', fontSize: '9px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</span>
                )}
                {u?.profile_photo ? (
                  <img src={u.profile_photo} alt="" style={{ width: '34px', height: '34px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#0a192f', color: '#fbbf24', fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{u ? u.full_name?.charAt(0) : 'U'}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 1px 0', fontSize: '10px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u ? u.full_name : id}</p>
                  <p style={{ margin: 0, fontSize: '8px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u?.native_place || 'Member'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: '16px', textAlign: 'center', fontSize: '10px', color: '#64748b', fontWeight: '800' }}>Loading Executive Board...</div>;

  return (
    <div>
      {isEditing && (
        <div style={{ backgroundColor: '#fff', padding: '10px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase' }}>Assign Governing Body Roles</span>
          <button type="button" onClick={saveGovBody} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>💾 Save Roles</button>
        </div>
      )}

      {/* OFFICE BEARERS MODERN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {renderExecutiveCard('President', 'President', true)}
        {renderExecutiveCard('Vice_President', 'Vice President')}
        {renderExecutiveCard('Secretary', 'Secretary')}
        {renderExecutiveCard('Treasurer', 'Treasurer')}
        {renderExecutiveCard('Joint_Secretary', 'Joint Secretary')}
        {renderExecutiveCard('Joint_Treasurer', 'Joint Treasurer')}
      </div>

      {/* EXECUTIVE & ADVISORY COMMITTEES */}
      {renderCommitteeSection('Executive_Members', 'Executive Committee Members', '#1e3a8a')}
      {renderCommitteeSection('Special_Members', 'Special Invitees & Advisors', '#d97706')}

      {/* COMPACT MEMBER PROFILE MODAL ON CLICK */}
      {previewMember && (
        <div onClick={() => setPreviewMember(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.68)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '295px', backgroundColor: '#ffffff', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1' }}>
            <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '18px 16px', textAlign: 'center', position: 'relative' }}>
              <button onClick={() => setPreviewMember(null)} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', width: '26px', height: '26px', borderRadius: '50%', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>✕</button>
              {previewMember.user.profile_photo ? (
                <img src={previewMember.user.profile_photo} alt="" style={{ width: '68px', height: '68px', borderRadius: '18px', objectFit: 'cover', border: '2px solid #fbbf24', margin: '0 auto 8px auto', display: 'block' }} />
              ) : (
                <div style={{ width: '68px', height: '68px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.12)', color: '#fbbf24', fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', border: '1.5px solid #fbbf24' }}>
                  {previewMember.user.full_name?.charAt(0)}
                </div>
              )}
              <span style={{ backgroundColor: '#d97706', color: '#ffffff', padding: '2px 9px', borderRadius: '6px', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {previewMember.roleTitle}
              </span>
              <h3 style={{ margin: '6px 0 2px 0', fontSize: '14px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>{previewMember.user.full_name}</h3>
              <p style={{ margin: 0, fontSize: '9px', color: '#93c5fd', fontWeight: '700' }}>S/O {previewMember.user.father_name}</p>
            </div>

            <div style={{ padding: '14px 16px' }}>
              {[
                ['Blood Group', previewMember.user.blood_group ? `🩸 ${previewMember.user.blood_group}` : 'N/A'],
                ['Qualification', previewMember.user.educational_qualification || 'N/A'],
                ['Occupation', previewMember.user.occupation || 'N/A'],
                ['Native Place', previewMember.user.native_place || 'MTK PURAM'],
                ['Mobile', `${previewMember.user.country_code || '+91'} ${previewMember.user.phone_number || 'N/A'}`]
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: '10px' }}>
                  <span style={{ color: '#64748b', fontWeight: '800', textTransform: 'uppercase', fontSize: '8.5px' }}>{k}</span>
                  <span style={{ color: '#0f172a', fontWeight: '900', textAlign: 'right', maxWidth: '65%' }}>{v}</span>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {previewMember.user.phone_number && (
                  <button
                    onClick={() => {
                      const telUrl = `tel:${previewMember.user.country_code || '+91'}${previewMember.user.phone_number}`;
                      if (Platform.OS === 'web') window.location.href = telUrl;
                      else Linking.openURL(telUrl);
                    }}
                    style={{ flex: 1, padding: '9px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    📞 Call
                  </button>
                )}
                <button onClick={() => setPreviewMember(null)} style={{ flex: 1, padding: '9px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// DEDICATED GOVERNING BODY PAGE (WITH ADMIN EDIT TOGGLE)
export function GoverningBodyScreen({ currentUser, onBack }) {
  const [editMode, setEditMode] = useState(false);
  const canEdit = currentUser?.role === 'ADMIN' && currentUser?.is_core_admin;

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '14px 16px 50px 16px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trust Governing Body</h2>
            <p style={{ margin: '2px 0 0 0', color: '#fbbf24', fontSize: '8.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Committee Details</p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {canEdit && (
              <button onClick={() => setEditMode(!editMode)} style={{ backgroundColor: editMode ? '#ef4444' : '#d97706', border: 'none', padding: '6px 10px', borderRadius: '8px', color: '#ffffff', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', cursor: 'pointer' }}>
                {editMode ? '✕ Close' : 'Edit'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 12px', maxWidth: '600px', margin: '-34px auto 0 auto', position: 'relative', zIndex: 10 }}>
        <GoverningBodyWidget isEditing={editMode} />
      </div>
    </div>
  );
}

// ==========================================
// 2. USER HOME DASHBOARD (WITH ADMIN MODE TOGGLE)
// ==========================================
export function HomeScreen({ currentUser, onNavigate, onLogout, adminMode, setAdminMode }) {
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [subStartMonth, setSubStartMonth] = useState('');
  const [customSlider, setCustomSlider] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDonatePayModal, setShowDonatePayModal] = useState(false);

  const fallbackImages = ['https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=1200'];
  const activeSlider = customSlider.length > 0 ? customSlider : fallbackImages;

  const isCore = currentUser?.is_core_admin === true;
  const perms = currentUser?.admin_permissions || '[]';
  const hasPerm = (p) => isCore || perms.includes('ALL') || perms.includes(p);
  const isAdmin = currentUser?.role === 'ADMIN';

  const roleDisplay = isAdmin
    ? (isCore ? 'ADMIN' : 'SUB-ADMIN')
    : (currentUser?.role === 'STUDENT' ? 'STUDENT' : 'MEMBER');

  useEffect(() => {
    const timer = setInterval(() => { setCurrentSlide(prev => prev + 1); }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sDoc = await getDoc(doc(db, 'settings', 'global'));
        if (sDoc.exists()) {
          setSubStartMonth(sDoc.data().subscription_start_month || '');
          setCustomSlider(sDoc.data().slider_images || []);
        }
        const campSnap = await getDocs(collection(db, 'campaigns'));
        setActiveCampaigns(campSnap.docs.map(d => d.data()).filter(c => c.status === 'ACTIVE' && (parseFloat(c.raised_amount) || 0) < (parseFloat(c.target_amount) || 1)));
      } catch (err) {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  let duesMonths = 0;
  const isFutureStart = subStartMonth && new Date(`${subStartMonth}-01`) > new Date();
  const isSubsDisabled = !subStartMonth || isFutureStart;

  if (currentUser?.role !== 'STUDENT' && !isSubsDisabled) {
    const joinDate = currentUser?.join_date ? new Date(currentUser.join_date) : new Date();
    let startDate = joinDate;
    if (subStartMonth) {
      const systemStart = new Date(`${subStartMonth}-01`);
      if (systemStart > joinDate) startDate = systemStart;
    }
    const now = new Date();
    const rawMonths = ((now.getFullYear() - startDate.getFullYear()) * 12) + (now.getMonth() - startDate.getMonth()) + 1;
    duesMonths = Math.max(0, Math.max(0, rawMonths) - (parseInt(currentUser?.total_months_paid) || 0));
  }

  if (loading) {
    return (
      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ height: '190px', backgroundColor: '#e2e8f0', borderRadius: '24px' }}></div>
      </div>
    );
  }

  const AdminHomeTile = ({ id, icon, label, perm }) => {
    if (perm !== 'PUBLIC' && !hasPerm(perm) && !isCore) return null;
    if ((id === 'SETTINGS' || id === 'EVENTS' || id === 'ROLES' || id === 'ACTIONS') && !isCore) return null;
    return (
      <div onClick={() => onNavigate(`admin_${id.toLowerCase()}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
        <div style={{ backgroundColor: '#ffffff', width: '46px', height: '46px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(10,25,47,0.04)' }}>
          {icon}
        </div>
        <span style={{ fontSize: '8.5px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }}>{label}</span>
      </div>
    );
  };

  return (
    <div>
      {/* ROYAL NAVY GREETING BANNER (ID & ROLE DIRECTLY UNDER NAME) */}
      <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '14px 16px 60px 16px', borderBottomLeftRadius: '26px', borderBottomRightRadius: '26px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            {currentUser?.profile_photo ? (
              <img src={currentUser.profile_photo} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fbbf24', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a192f', fontSize: '17px', fontWeight: '900', flexShrink: 0 }}>
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: '0 0 1px 0', fontSize: '9px', color: '#fbbf24', fontWeight: '800' }}>Assalamu Alaikum,</p>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.full_name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ backgroundColor: 'rgba(255,255,255,0.14)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.22)', padding: '1.5px 7px', borderRadius: '5px', fontSize: '8px', fontWeight: '900', letterSpacing: '0.5px' }}>
                  {currentUser?.official_id}
                </span>
                <span style={{ backgroundColor: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.45)', padding: '1.5px 7px', borderRadius: '5px', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {roleDisplay}
                </span>
              </div>
            </div>
          </div>

          {onLogout && (
            <button onClick={onLogout} title="Log Off" style={{ backgroundColor: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '0 14px', maxWidth: '600px', margin: '0 auto' }}>
        
        {isAdmin && adminMode ? (
          // ==========================================
          // ADMIN WORKSPACE (SHOWN ONLY WHEN ADMIN MODE IS ACTIVE)
          // ==========================================
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '20px', padding: '16px 12px', border: '1px solid #cbd5e1', marginTop: '-32px', marginBottom: '20px', position: 'relative', zIndex: 10, boxShadow: '0 8px 30px rgba(10,25,47,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', padding: '0 4px 12px 4px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '13px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.6px' }}>🛡️ Admin Workspace</h3>
                <span style={{ fontSize: '8.5px', fontWeight: '900', color: '#d97706', textTransform: 'uppercase' }}>{roleDisplay} Active</span>
              </div>
              <button 
                onClick={() => setAdminMode(false)} 
                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)' }}
              >
                ✕ Exit Mode
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px 10px' }}>
              <AdminHomeTile id="STATS" icon="📊" label="Overview" perm="ALL" />
              <AdminHomeTile id="USERS" icon="👥" label="Members" perm="MANAGE_USERS" />
              <AdminHomeTile id="STUDENTS" icon="🎓" label="Students" perm="MANAGE_USERS" />
              <AdminHomeTile id="SUBSCRIPTIONS" icon="📅" label="Dues" perm="MANAGE_FINANCE" />
              <AdminHomeTile id="FINANCE" icon="💵" label="Finance" perm="MANAGE_FINANCE" />
              <AdminHomeTile id="CAMPAIGNS" icon="📢" label="Causes" perm="MANAGE_CAMPAIGNS" />
              <AdminHomeTile id="REPORTS" icon="📑" label="Reports" perm="REPORTS_CENTRAL" />
              <AdminHomeTile id="CONTRIBUTIONS" icon="📈" label="Contribs" perm="REPORTS_CENTRAL" />
              <AdminHomeTile id="ACTIONS" icon="⚡" label="Actions" perm="ALL" />
              <AdminHomeTile id="ROLES" icon="🛡️" label="Roles" perm="ALL" />
              <AdminHomeTile id="EVENTS" icon="📜" label="Logs" perm="ALL" />
              <AdminHomeTile id="SETTINGS" icon="⚙️" label="Settings" perm="ALL" />
            </div>
          </div>
        ) : (
          // ==========================================
          // NORMAL MEMBER WORKSPACE (DEFAULT VIEW)
          // ==========================================
          <>
            {/* OVERLAPPING SILVER JUBILEE IMAGE SLIDER */}
            <div style={{
              height: '195px',
              borderRadius: '22px',
              marginTop: '-42px',
              marginBottom: '14px',
              position: 'relative',
              zIndex: 10,
              overflow: 'hidden',
              backgroundColor: '#0a192f',
              boxShadow: '0 10px 25px rgba(10, 25, 47, 0.3)',
              border: '2px solid rgba(251, 191, 36, 0.4)'
            }}>
              <img
                src={activeSlider[currentSlide % activeSlider.length]}
                alt="HIYWA Banner"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
              />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(180deg, rgba(10,25,47,0.25) 0%, rgba(10,25,47,0.88) 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                padding: '14px', textAlign: 'center'
              }}>
                <span style={{ backgroundColor: 'rgba(251,191,36,0.2)', border: '1px solid #fbbf24', color: '#fef08a', padding: '2px 9px', borderRadius: '14px', fontSize: '8px', fontWeight: '900', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  MTK PURAM • EST. 2001
                </span>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', color: '#fbbf24', textShadow: '0 2px 8px rgba(0,0,0,0.7)', letterSpacing: '0.5px' }}>
                  🎉 25 YEARS OF HIYWA 🎉
                </h1>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  SILVER JUBILEE CELEBRATION
                </p>
                {activeSlider.length > 1 && (
                  <div style={{ position: 'absolute', bottom: '8px', display: 'flex', gap: '4px' }}>
                    {activeSlider.map((_, idx) => (
                      <div key={idx} style={{ width: (currentSlide % activeSlider.length) === idx ? '14px' : '5px', height: '5px', borderRadius: '3px', backgroundColor: (currentSlide % activeSlider.length) === idx ? '#fbbf24' : 'rgba(255,255,255,0.4)' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ALERTS */}
            {duesMonths > 0 && (
              <div onClick={() => onNavigate('subscription')} style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '9px 12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626' }}>⚠️ Pending subscription dues for {duesMonths} month(s).</span>
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#991b1b', textTransform: 'uppercase' }}>View →</span>
              </div>
            )}

            {activeCampaigns.map(camp => (
              <div key={camp.campaign_id} onClick={() => onNavigate('fundraising')} style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '9px 12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#1e3a8a' }}>📢 LIVE DRIVE: {camp.title}</span>
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#2563eb', textTransform: 'uppercase' }}>Support →</span>
              </div>
            ))}

            {/* QUICK SERVICES */}
            <h3 style={{ margin: '14px 0 8px 2px', fontSize: '10px', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Services</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {currentUser?.role !== 'STUDENT' && (
                <div onClick={() => onNavigate('subscription')} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                  <span style={{ fontSize: '20px' }}>📅</span>
                  <span style={{ fontSize: '8.5px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase' }}>Subscription</span>
                </div>
              )}
              <div onClick={() => setShowDonatePayModal(true)} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '20px' }}>💖</span>
                <span style={{ fontSize: '8.5px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase' }}>Donate</span>
              </div>
              <div onClick={() => onNavigate('fundraising')} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '20px' }}>📢</span>
                <span style={{ fontSize: '8.5px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase' }}>Fund Drives</span>
              </div>
              <div onClick={() => onNavigate('blood')} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '20px' }}>🩸</span>
                <span style={{ fontSize: '8.5px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase' }}>Blood Group</span>
              </div>
              <div onClick={() => onNavigate('governing')} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '20px' }}>🏛️</span>
                <span style={{ fontSize: '8.5px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase' }}>Gov. Body</span>
              </div>
              <div onClick={() => onNavigate('my_contributions')} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '20px' }}>📊</span>
                <span style={{ fontSize: '8.5px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase' }}>My Contribs</span>
              </div>
              <div onClick={() => onNavigate('ramadan')} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '20px' }}>🌙</span>
                <span style={{ fontSize: '8.5px', color: '#0a192f', fontWeight: '900', textTransform: 'uppercase' }}>Ramadan</span>
              </div>
            </div>

            {/* NEW: ENTER ADMIN MODE TOGGLE BUTTON */}
            {isAdmin && (
              <button 
                onClick={() => setAdminMode(true)} 
                style={{ width: '100%', padding: '15px', backgroundColor: '#0a192f', color: '#fbbf24', border: '1px solid #1e3a8a', borderRadius: '16px', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(10, 25, 47, 0.25)' }}
              >
                🛡️ Enter Admin Workspace
              </button>
            )}
          </>
        )}
      </div>

      {/* SPECIAL HOME DONATE MANUAL PAYMENT MODAL */}
      <ManualPayModal
        visible={showDonatePayModal}
        onClose={() => setShowDonatePayModal(false)}
        title="General Welfare Donation"
        subtitle="Support HIYWA Initiatives"
      />
    </div>
  );
}

// ==========================================
// 3. BLOOD GROUP DIRECTORY PAGE (WITH CALL BUTTON)
// ==========================================
export function BloodBankScreen({ onBack }) {
  const [selectedGroup, setSelectedGroup] = useState('A+');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const snap = await getDocs(collection(db, 'members'));
        setMembers(snap.docs.map(d => d.data()).filter(u => u.membership_status === 'ACTIVE'));
      } catch (e) {} finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const matchedDonors = members
    .filter(m => m.blood_group === selectedGroup)
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

  const handleCall = (countryCode, phone) => {
    if (!phone) return alert('No phone number available.');
    const telUrl = `tel:${countryCode || '+91'}${phone}`;
    if (Platform.OS === 'web') window.location.href = telUrl;
    else Linking.openURL(telUrl);
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '14px 16px 50px 16px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>Blood Donors Directory</h2>
            <p style={{ margin: '2px 0 0 0', color: '#fbbf24', fontSize: '8.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Select Blood Group to View Donors</p>
          </div>
          <button onClick={onBack} style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: '8px', color: '#ffffff', fontWeight: '900', fontSize: '9.5px', textTransform: 'uppercase', cursor: 'pointer' }}>← Back</button>
        </div>
      </div>

      <div style={{ padding: '0 14px', maxWidth: '600px', margin: '-32px auto 0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '12px', border: '1px solid #cbd5e1', marginBottom: '14px', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {BLOOD_GROUPS.map(bg => {
              const count = members.filter(m => m.blood_group === bg).length;
              const active = selectedGroup === bg;
              return (
                <button
                  key={bg}
                  onClick={() => setSelectedGroup(bg)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '12px',
                    border: active ? '2px solid #dc2626' : '1px solid #e2e8f0',
                    backgroundColor: active ? '#fef2f2' : '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '900', color: active ? '#dc2626' : '#0f172a' }}>🩸 {bg}</span>
                  <span style={{ fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{count} {count === 1 ? 'Donor' : 'Donors'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <h3 style={{ margin: '0 0 8px 4px', fontSize: '10.5px', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>
          {selectedGroup} Blood Group Members ({matchedDonors.length})
        </h3>
        {loading ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', textAlign: 'center', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Loading donors...</div>
        ) : matchedDonors.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', fontWeight: '700', border: '1px solid #cbd5e1' }}>No members registered with {selectedGroup} blood group.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matchedDonors.map(m => {
              const relPrefix = m.gender === 'FEMALE' ? 'D/O' : 'S/O';
              return (
                <div key={m.official_id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '10px 12px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {m.profile_photo ? (
                      <img src={m.profile_photo} alt="" style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', flexShrink: 0, border: '1px solid #fecaca' }}>
                        {m.blood_group || '🩸'}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.full_name}</p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '9px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>{relPrefix} {m.father_name} • {m.native_place || 'MTK PURAM'}</p>
                      <p style={{ margin: 0, fontSize: '9.5px', color: '#1e3a8a', fontWeight: '900' }}>📞 {m.country_code || '+91'} {m.phone_number}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCall(m.country_code, m.phone_number)}
                    style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  >
                    📞 Call
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. DEMERGED SUBSCRIPTION SCREEN (WITH MANUAL PAY MODAL)
// ==========================================
export function SubscriptionScreen({ currentUser, onViewReceipt, onBack }) {
  const [monthlyRate, setMonthlyRate] = useState(100);
  const [subStartMonth, setSubStartMonth] = useState('');
  const [history, setHistory] = useState([]);
  const [showManualPayModal, setShowManualPayModal] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const sDoc = await getDoc(doc(db, 'settings', 'global'));
        if (sDoc.exists()) {
          setMonthlyRate(Number(sDoc.data().monthly_subscription_amount || 100));
          setSubStartMonth(sDoc.data().subscription_start_month || '');
        }
        const snap = await getDocs(collection(db, 'transactions'));
        setHistory(snap.docs.map(d => d.data()).filter(t => t.member_id === currentUser.official_id && t.donation_type === 'SUBSCRIPTION').sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)));
      } catch (e) {} finally { setIsPageLoading(false); }
    };
    fetchAllData();
  }, [currentUser]);

  if (isPageLoading) return <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}><div style={{ height: '120px', backgroundColor: '#e2e8f0', borderRadius: '18px' }}></div></div>;

  const isFutureStart = subStartMonth && new Date(`${subStartMonth}-01`) > new Date();
  const isSubsDisabled = !subStartMonth || isFutureStart;

  const joinDate = currentUser.join_date ? new Date(currentUser.join_date) : new Date();
  let startDate = joinDate;
  if (subStartMonth) { const systemStart = new Date(`${subStartMonth}-01`); if (systemStart > joinDate) startDate = systemStart; }
  const currentDate = new Date();
  const rawMonths = isSubsDisabled ? 0 : (((currentDate.getFullYear() - startDate.getFullYear()) * 12) + (currentDate.getMonth() - startDate.getMonth()) + 1);
  const totalPaid = parseInt(currentUser.total_months_paid) || 0;
  const duesMonths = Math.max(0, Math.max(0, rawMonths) - totalPaid);
  const duesAmount = duesMonths * monthlyRate;

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '14px 16px 48px 16px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>Subscription</h2>
            <p style={{ margin: '2px 0 0 0', color: '#fbbf24', fontSize: '8.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Monthly Ledger • ₹{monthlyRate}/Mo</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {!isSubsDisabled && duesMonths > 0 ? (
              <button onClick={() => setShowManualPayModal(true)} style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.35)' }}>
                Pay Dues
              </button>
            ) : (
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.45)', color: '#6ee7b7', padding: '6px 10px', borderRadius: '8px', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                ✅ No Due • You Are Up To Date
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 14px', maxWidth: '600px', margin: '-32px auto 0 auto', position: 'relative', zIndex: 10 }}>
        {isSubsDisabled && (
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '12px', padding: '9px 12px', marginBottom: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#b45309' }}>
              ⏳ {subStartMonth ? `Subscriptions start in ${new Date(subStartMonth + '-01').toLocaleDateString('default', { month: 'short', year: 'numeric' })}.` : 'Subscription tracking not yet active.'}
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '11px 12px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Months Paid</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '900', color: '#1e3a8a' }}>{totalPaid} Mo</h3>
            </div>
            <span style={{ fontSize: '16px' }}>✅</span>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '11px 12px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Pending Arrears</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '900', color: duesAmount > 0 ? '#ef4444' : '#10b981' }}>₹{duesAmount}</h3>
            </div>
            <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b' }}>{duesMonths}m</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '12px', border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '7px', borderBottom: '1.5px solid #e2e8f0', marginBottom: '4px' }}>
            <span style={{ fontSize: '8.5px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Date</span>
            <span style={{ fontSize: '8.5px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Months</span>
            <span style={{ fontSize: '8.5px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Paid</span>
            <span style={{ fontSize: '8.5px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Slip</span>
          </div>
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '10px', fontWeight: '800', margin: '16px 0' }}>No subscription entries yet.</p>
          ) : (
            history.map((txn, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: idx === history.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a' }}>{new Date(txn.transaction_date).toLocaleDateString('en-GB')}</span>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569' }}>{txn.months_count} Mo</span>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#10b981' }}>₹{txn.amount}</span>
                <button onClick={() => onViewReceipt(txn)} style={{ backgroundColor: '#eff6ff', border: 'none', padding: '3px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', color: '#1e3a8a', cursor: 'pointer' }}>📄 Slip</button>
              </div>
            ))
          )}
        </div>
      </div>

      <ManualPayModal
        visible={showManualPayModal}
        onClose={() => setShowManualPayModal(false)}
        title="Subscription Payment"
        subtitle={duesAmount > 0 ? `Pending Dues: ₹${duesAmount} (${duesMonths} Mo)` : `Rate: ₹${monthlyRate} / Month`}
      />
    </div>
  );
}

export const DonationPortal = SubscriptionScreen;

// ==========================================
// 5. DEMERGED FUNDRAISING LIST & CAMPAIGN DETAIL (WITH MANUAL PAY MODAL)
// ==========================================
export function FundraisingListScreen({ currentUser, onSelectCampaign, onViewReceipt, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [history, setHistory] = useState([]);
  const [showPastModal, setShowPastModal] = useState(false);

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

  const activeCamps = campaigns.filter(c => (c.status === 'ACTIVE' || c.status === 'PAUSED') && (parseFloat(c.raised_amount) || 0) < (parseFloat(c.target_amount) || 1));
  const pastCamps = campaigns.filter(c => c.status === 'STOPPED' || (parseFloat(c.raised_amount) || 0) >= (parseFloat(c.target_amount) || 1));

  const renderCard = (camp) => {
    const raised = parseFloat(camp.raised_amount) || 0;
    const target = parseFloat(camp.target_amount) || 1;
    const remaining = Math.max(0, target - raised);
    const progress = Math.min(Math.round((raised / target) * 100), 100);
    const goalMet = raised >= target;
    const isPaused = camp.status === 'PAUSED';

    return (
      <div key={camp.campaign_id} onClick={() => { setShowPastModal(false); onSelectCampaign(camp); }} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '14px', border: '1px solid #cbd5e1', marginBottom: '10px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{camp.title}</h4>
          <span style={{ backgroundColor: goalMet ? '#dcfce7' : isPaused ? '#fef3c7' : camp.status === 'STOPPED' ? '#fee2e2' : '#dbeafe', color: goalMet ? '#16a34a' : isPaused ? '#d97706' : camp.status === 'STOPPED' ? '#dc2626' : '#1e3a8a', padding: '2px 7px', borderRadius: '6px', fontSize: '8.5px', fontWeight: '900', textTransform: 'uppercase' }}>
            {goalMet ? '🎉 Goal Met' : camp.status}
          </span>
        </div>
        <p style={{ margin: '0 0 10px 0', fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>{camp.description}</p>
        {camp.remarks && <p style={{ margin: '0 0 8px 0', fontSize: '9.5px', fontWeight: '800', color: '#b45309', backgroundColor: '#fffbeb', padding: '5px 8px', borderRadius: '6px' }}>Note: {camp.remarks}</p>}
        <div style={{ height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: goalMet ? '#10b981' : isPaused ? '#f59e0b' : '#1e3a8a' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontWeight: '800', color: '#0f172a' }}>
          <span>Collected: ₹{raised.toLocaleString()} ({progress}%)</span>
          <span style={{ color: '#d97706' }}>Rem: ₹{remaining.toLocaleString()}</span>
          <span style={{ color: '#1e3a8a' }}>Goal: ₹{target.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '14px 16px 48px 16px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>Fund Drives</h2>
            <p style={{ margin: '2px 0 0 0', color: '#fbbf24', fontSize: '8.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Community Fundraising</p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowPastModal(true)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '5px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>Past ({pastCamps.length})</button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 14px', maxWidth: '600px', margin: '-32px auto 0 auto', position: 'relative', zIndex: 10 }}>
        {activeCamps.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>No active drives at the moment.</p>
          </div>
        ) : activeCamps.map(renderCard)}

        <h3 style={{ margin: '16px 0 8px 2px', fontSize: '10px', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>My Campaign Contributions</h3>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '4px', border: '1px solid #cbd5e1' }}>
          {history.length === 0 ? <p style={{ padding: '14px', textAlign: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: '700', margin: 0 }}>No contributions yet.</p> : history.map((txn, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: idx === history.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
              <div>
                <p style={{ margin: '0 0 1px 0', fontSize: '10.5px', fontWeight: '900', color: '#0f172a' }}>{txn.reason}</p>
                <p style={{ margin: 0, fontSize: '8.5px', color: '#64748b', fontWeight: '700' }}>{new Date(txn.transaction_date).toLocaleDateString('en-GB')}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#10b981' }}>₹{txn.amount}</span>
                <button onClick={() => onViewReceipt(txn)} style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' }}>📄 Slip</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPastModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#f8fafc', borderRadius: '20px', padding: '16px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>Past / Closed Drives</h4>
              <button onClick={() => setShowPastModal(false)} style={{ background: '#fff', border: 'none', width: '26px', height: '26px', borderRadius: '50%', fontWeight: '900', cursor: 'pointer' }}>✕</button>
            </div>
            {pastCamps.length === 0 ? <p style={{ fontSize: '10px', color: '#64748b' }}>No past drives.</p> : pastCamps.map(renderCard)}
          </div>
        </div>
      )}
    </div>
  );
}

export function CampaignDetailScreen({ campaign, onBack }) {
  const [showManualPayModal, setShowManualPayModal] = useState(false);

  if (!campaign) return null;
  const raised = parseFloat(campaign.raised_amount) || 0;
  const target = parseFloat(campaign.target_amount) || 1;
  const remaining = Math.max(0, target - raised);
  const progress = Math.min(Math.round((raised / target) * 100), 100);
  const isPaused = campaign.status === 'PAUSED';
  const isClosed = campaign.status === 'STOPPED' || remaining <= 0;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '14px' }}>
      <button onClick={onBack} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', marginBottom: '10px', cursor: 'pointer' }}>← Back to Drives</button>
      <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '16px', border: '1px solid #cbd5e1' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{campaign.title}</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>{campaign.description}</p>
        <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#1e3a8a' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', marginBottom: '12px', fontSize: '10px', fontWeight: '800' }}>
          <span>Collected: ₹{raised.toLocaleString()} ({progress}%)</span>
          <span style={{ color: '#d97706' }}>Rem: ₹{remaining.toLocaleString()}</span>
          <span style={{ color: '#1e3a8a' }}>Goal: ₹{target.toLocaleString()}</span>
        </div>
        {isPaused ? (
          <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '10px', textAlign: 'center', fontWeight: '900', fontSize: '11px', color: '#d97706' }}>⏸️ CAMPAIGN PAUSED BY ADMIN</div>
        ) : !isClosed ? (
          <button type="button" onClick={() => setShowManualPayModal(true)} style={{ width: '100%', padding: '12px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>
            💖 Support This Drive (View Payment Details)
          </button>
        ) : (
          <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '10px', textAlign: 'center', fontWeight: '900', fontSize: '11px', color: '#16a34a' }}>🎉 CAMPAIGN CLOSED / GOAL ACHIEVED</div>
        )}
      </div>

      <ManualPayModal
        visible={showManualPayModal}
        onClose={() => setShowManualPayModal(false)}
        title="Support Fund Drive"
        subtitle={`${campaign.title} (Max Rem: ₹${remaining})`}
      />
    </div>
  );
}

// ==========================================
// 6. FULL ALL-FIELDS USER PROFILE SCREEN
// ==========================================
export function UserProfileScreen({ currentUser, setCurrentUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(currentUser || {});
  const [saving, setSaving] = useState(false);

  const isCollegeEdit = ['UG - BACHELORS', 'PG - MASTERS', 'PHD', 'ITI / DIPLOMA'].includes(editForm.class_grade);
  const selectedCountry = COUNTRY_CODES.find(c => c.code === (editForm.country_code || '+91')) || COUNTRY_CODES[0];

  const pickImage = async () => {
    let r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.1, width: 250, height: 250, base64: true });
    if (!r.canceled && r.assets[0].base64) {
      const b64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
      if (b64.length > 950000) return alert("Image too large. Max 1MB.");
      setEditForm({ ...editForm, profile_photo: b64 });
    }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'members', currentUser.official_id), editForm);
      await setDoc(doc(db, 'system_logs', `USR_${Date.now()}`), {
        timestamp: new Date().toISOString(),
        member_id: currentUser.official_id,
        full_name: editForm.full_name || currentUser.full_name,
        event_type: 'USER_EVENT',
        action: 'Updated Profile Details',
        details: `${editForm.full_name || currentUser.full_name} (${currentUser.official_id}) edited their profile.`
      });
      setCurrentUser({ ...currentUser, ...editForm });
      setIsEditing(false);
      alert('Profile Updated Successfully!');
    } catch (e) { alert('Failed to update.'); } finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '9px 11px', borderRadius: '9px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '11px', fontWeight: '700', boxSizing: 'border-box', marginBottom: '8px', textTransform: 'uppercase' };
  const lbl = { display: 'block', fontSize: '8.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '3px' };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '14px 16px 48px 16px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', color: '#fff' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', textTransform: 'uppercase' }}>My Profile</h2>
            <p style={{ margin: '2px 0 0 0', color: '#fbbf24', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>ID: {currentUser?.official_id} • {currentUser?.role}</p>
          </div>
          <button onClick={() => { setEditForm(currentUser); setIsEditing(!isEditing); }} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 14px', maxWidth: '600px', margin: '-32px auto 0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '16px', border: '1px solid #cbd5e1' }}>
          {isEditing ? (
            <form onSubmit={handleSave}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div onClick={pickImage} style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', margin: '0 auto 4px auto', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed #1e3a8a' }}>
                  {editForm.profile_photo ? <img src={editForm.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>📷</span>}
                </div>
                <span style={{ fontSize: '8.5px', color: '#1e3a8a', fontWeight: '900' }}>TAP PHOTO TO CHANGE (MAX 1MB)</span>
              </div>

              <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>1. Personal Details</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ flex: '1 1 200px' }}><label style={lbl}>Full Name</label><input style={inp} value={editForm.full_name || ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value.toUpperCase() })} /></div>
                <div style={{ flex: '1 1 200px' }}><label style={lbl}>Father's Name</label><input style={inp} value={editForm.father_name || ''} onChange={e => setEditForm({ ...editForm, father_name: e.target.value.toUpperCase() })} /></div>
                <div style={{ flex: '1 1 200px' }}><label style={lbl}>Mother's Name</label><input style={inp} value={editForm.mother_name || ''} onChange={e => setEditForm({ ...editForm, mother_name: e.target.value.toUpperCase() })} /></div>
                <FormDropdown label="Parents Status" value={editForm.parents_status} options={['BOTH ALIVE', 'FATHER DECEASED', 'MOTHER DECEASED', 'BOTH DECEASED']} onSelect={v => setEditForm({ ...editForm, parents_status: v })} />
                <FormDropdown label="Gender" value={editForm.gender} options={GENDERS} onSelect={v => setEditForm({ ...editForm, gender: v })} />
                <div style={{ flex: '1 1 160px' }}><label style={lbl}>Date of Birth</label><input type="date" style={inp} value={editForm.dob || ''} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} /></div>
                <FormDropdown label="Blood Group" value={editForm.blood_group} options={BLOOD_GROUPS} onSelect={v => setEditForm({ ...editForm, blood_group: v })} />
                <FormDropdown label="Marital Status" value={editForm.marital_status} options={MARITAL_STATUS} onSelect={v => setEditForm({ ...editForm, marital_status: v })} />
                <div style={{ flex: '1 1 200px' }}>
                  <label style={lbl}>Aadhaar Number (12-Digits)</label>
                  <input type="tel" maxLength="12" placeholder="[Aadhaar Redacted / Enter 12 Digits]" style={inp} value={editForm.aadhaar_number || ''} onChange={e => setEditForm({ ...editForm, aadhaar_number: e.target.value.replace(/\D/g, '') })} />
                </div>
              </div>

              <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>2. Contact & Location</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ flex: '1 1 220px' }}>
                  <label style={lbl}>Primary Mobile</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select value={editForm.country_code || '+91'} onChange={e => setEditForm({ ...editForm, country_code: e.target.value })} style={{ width: '80px', padding: '8px 4px', borderRadius: '9px', border: '1px solid #cbd5e1', backgroundColor: '#eff6ff', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', marginBottom: '8px' }}>
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
                    </select>
                    <input type="tel" maxLength={selectedCountry.max} style={{ ...inp, flex: 1 }} value={editForm.phone_number || ''} onChange={e => setEditForm({ ...editForm, phone_number: e.target.value.replace(/\D/g, '') })} />
                  </div>
                </div>
                <div style={{ flex: '1 1 200px' }}><label style={lbl}>WhatsApp Number</label><input type="tel" maxLength={selectedCountry.max} style={inp} value={editForm.whatsapp_number || ''} onChange={e => setEditForm({ ...editForm, whatsapp_number: e.target.value.replace(/\D/g, '') })} /></div>
                <div style={{ flex: '1 1 200px' }}><label style={lbl}>Email</label><input style={{ ...inp, textTransform: 'none' }} value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                <FormDropdown label="Native Place" value={editForm.native_place} options={NATIVE_PLACES} onSelect={v => setEditForm({ ...editForm, native_place: v })} />
                <div style={{ flex: '1 1 200px' }}><label style={lbl}>Current Location</label><input style={inp} value={editForm.current_location || ''} onChange={e => setEditForm({ ...editForm, current_location: e.target.value.toUpperCase() })} /></div>
                <div style={{ flex: '1 1 100%' }}><label style={lbl}>Permanent Address</label><input style={inp} value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value.toUpperCase() })} /></div>
              </div>

              <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>3. Education, Occupation & Islamic Studies</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {editForm.role === 'STUDENT' ? (
                  <>
                    <FormDropdown label="Class / Grade" value={editForm.class_grade} options={CLASSES} onSelect={v => setEditForm({ ...editForm, class_grade: v })} />
                    <div style={{ flex: '1 1 200px' }}><label style={lbl}>Institution Name</label><input style={inp} value={editForm.school_name || ''} onChange={e => setEditForm({ ...editForm, school_name: e.target.value.toUpperCase() })} /></div>
                    <FormDropdown label="Institution Type" value={editForm.school_type} options={isCollegeEdit ? COLLEGE_TYPES : SCHOOL_TYPES} onSelect={v => setEditForm({ ...editForm, school_type: v })} />
                    <div style={{ flex: '1 1 200px' }}><label style={lbl}>Institution Location</label><input style={inp} value={editForm.school_location || ''} onChange={e => setEditForm({ ...editForm, school_location: e.target.value.toUpperCase() })} /></div>
                    <FormDropdown label="Medium" value={editForm.medium_of_instruction} options={MEDIUMS} onSelect={v => setEditForm({ ...editForm, medium_of_instruction: v })} />
                  </>
                ) : (
                  <>
                    <FormDropdown label="Education Category" value={editForm.educational_qualification} options={EDU_CATEGORIES} onSelect={v => setEditForm({ ...editForm, educational_qualification: v })} />
                    <div style={{ flex: '1 1 200px' }}><label style={lbl}>Course / Specialization</label><input style={inp} value={editForm.course_details || ''} onChange={e => setEditForm({ ...editForm, course_details: e.target.value.toUpperCase() })} /></div>
                    <div style={{ flex: '1 1 200px' }}><label style={lbl}>Occupation / Job</label><input style={inp} value={editForm.occupation || ''} onChange={e => setEditForm({ ...editForm, occupation: e.target.value.toUpperCase() })} /></div>
                  </>
                )}
                <FormDropdown label="Islamic Studies" value={editForm.islamic_studies} options={['YES', 'NO']} onSelect={v => setEditForm({ ...editForm, islamic_studies: v })} />
                {editForm.islamic_studies === 'YES' && (
                  <>
                    <FormDropdown label="Islamic Qualification" value={editForm.islamic_qualification} options={ISLAMIC_QUALS} onSelect={v => setEditForm({ ...editForm, islamic_qualification: v })} />
                    <div style={{ flex: '1 1 180px' }}><label style={lbl}>Madrasa Name</label><input style={inp} value={editForm.madrasa_name || ''} onChange={e => setEditForm({ ...editForm, madrasa_name: e.target.value.toUpperCase() })} /></div>
                    <div style={{ flex: '1 1 180px' }}><label style={lbl}>Madrasa Location</label><input style={inp} value={editForm.madrasa_location || ''} onChange={e => setEditForm({ ...editForm, madrasa_location: e.target.value.toUpperCase() })} /></div>
                  </>
                )}
              </div>

              <button type="submit" disabled={saving} style={{ width: '100%', padding: '12px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>{saving ? 'Saving...' : '💾 Save All Profile Details'}</button>
            </form>
          ) : (
            <div>
              <div style={{ textAlign: 'center', paddingBottom: '12px', borderBottom: '1px dashed #cbd5e1', marginBottom: '12px' }}>
                {currentUser?.profile_photo ? (
                  <img src={currentUser.profile_photo} alt="" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 6px auto', display: 'block', border: '2px solid #1e3a8a' }} />
                ) : (
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#0a192f', color: '#fff', fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto' }}>{currentUser?.full_name?.charAt(0)}</div>
                )}
                <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>{currentUser?.full_name}</h3>
                <p style={{ margin: 0, fontSize: '9.5px', color: '#64748b', fontWeight: '800' }}>S/O {currentUser?.father_name} & {currentUser?.mother_name}</p>
              </div>
              {[
                ['Official ID', currentUser?.official_id],
                ['Status & Role', `${currentUser?.membership_status} • ${currentUser?.role}`],
                ['DOB & Gender', `${currentUser?.dob || 'N/A'} • ${currentUser?.gender || 'N/A'}`],
                ['Blood & Marital', `${currentUser?.blood_group || 'N/A'} • ${currentUser?.marital_status || 'N/A'}`],
                ['Parents Status', currentUser?.parents_status],
                ['Aadhaar Number', currentUser?.aadhaar_number ? 'Stored (12 Digits)' : 'N/A'],
                ['Primary Mobile', `${currentUser?.country_code || '+91'} ${currentUser?.phone_number || ''}`],
                ['WhatsApp', `${currentUser?.country_code || '+91'} ${currentUser?.whatsapp_number || ''}`],
                ['Email', currentUser?.email],
                ['Native Place', currentUser?.native_place],
                ['Current City', currentUser?.current_location],
                ['Education', `${currentUser?.educational_qualification || currentUser?.class_grade || 'N/A'} (${currentUser?.course_details || currentUser?.school_name || ''})`],
                ['Occupation', currentUser?.occupation],
                ['Islamic Studies', currentUser?.islamic_studies === 'YES' ? `${currentUser?.islamic_qualification} (${currentUser?.madrasa_name || ''})` : 'NO'],
                ['Address', currentUser?.address]
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc', fontSize: '10.5px' }}>
                  <span style={{ color: '#64748b', fontWeight: '800', textTransform: 'uppercase', fontSize: '8.5px' }}>{k}</span>
                  <span style={{ color: '#0f172a', fontWeight: '800', textAlign: 'right', maxWidth: '65%' }}>{v || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. RECEIPT PAGE WITH DIRECT PNG DOWNLOAD & SAVE
// ==========================================
export function ReceiptPage({ receipt, currentUser, onBack }) {
  if (!receipt) return null;
  const txnDate = new Date(receipt.transaction_date || Date.now()).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const displayId = receipt.official_id || receipt.member_id || currentUser?.official_id;
  const displayName = receipt.full_name || currentUser?.full_name;

  const downloadReceiptImage = () => {
    if (Platform.OS !== 'web') return alert('Use Share on mobile.');
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 820;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, 700, 820);

    // Card
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 40, 620, 740, 24);
    ctx.fill();
    ctx.stroke();

    // Top Navy Banner
    ctx.fillStyle = '#0a192f';
    ctx.beginPath();
    ctx.roundRect(40, 40, 620, 130, [24, 24, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 32px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIYWA CONNECT', 350, 95);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText('HIDHAYATHUL ISLAM YOUTH WELFARE ASSOCIATION • MTK PURAM', 350, 122);
    ctx.fillStyle = '#93c5fd';
    ctx.font = '800 12px system-ui, sans-serif';
    ctx.fillText('OFFICIAL PAYMENT RECEIPT', 350, 146);

    // Rows
    const rows = [
      ['DATE & TIME', txnDate],
      ['RECEIPT NO', `#${receipt.transaction_id || 'REC'}`],
      ['MEMBER ID', String(displayId || 'N/A')],
      ['FULL NAME', String(displayName || 'N/A')],
      ['CATEGORY', String(receipt.donation_type || 'CONTRIBUTION')],
      ['PARTICULARS', String(receipt.reason || 'TRUST CONTRIBUTION')],
      ['PAYMENT MODE', String(receipt.payment_method || 'UPI')]
    ];

    let y = 230;
    rows.forEach(([label, val]) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '800 14px system-ui, sans-serif';
      ctx.fillText(label, 85, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 15px system-ui, sans-serif';
      ctx.fillText(String(val).slice(0, 38), 615, y);

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(85, y + 18);
      ctx.lineTo(615, y + 18);
      ctx.stroke();

      y += 55;
    });

    // Total Box
    ctx.fillStyle = '#eff6ff';
    ctx.strokeStyle = '#bfdbfe';
    ctx.beginPath();
    ctx.roundRect(85, 625, 530, 85, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 28px system-ui, sans-serif';
    ctx.fillText(`TOTAL PAID: ₹${receipt.amount}`, 350, 678);

    ctx.fillStyle = '#64748b';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText('Computer Generated Official Receipt • Thank You For Your Support', 350, 750);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `HIYWA_Receipt_${receipt.transaction_id || Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '14px auto', padding: '0 14px' }}>
      <button onClick={onBack} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', marginBottom: '10px', cursor: 'pointer' }}>← Back</button>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '16px', textAlign: 'center', borderBottom: '2px solid #d97706' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fbbf24', letterSpacing: '0.5px' }}>HIYWA CONNECT</h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '8.5px', fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Official Payment Receipt</p>
        </div>
        <div style={{ padding: '16px' }}>
          {[
            ['Date', txnDate],
            ['Receipt ID', `#${receipt.transaction_id}`],
            ['Member ID', displayId],
            ['Name', displayName],
            ['Particulars', receipt.reason],
            ['Mode', receipt.payment_method || 'UPI']
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc', fontSize: '10.5px' }}>
              <span style={{ color: '#64748b', fontWeight: '800', textTransform: 'uppercase', fontSize: '8.5px' }}>{k}</span>
              <span style={{ color: '#0f172a', fontWeight: '900', textAlign: 'right', maxWidth: '65%' }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9.5px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase' }}>Total Paid</span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#1e3a8a' }}>₹{receipt.amount}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button onClick={downloadReceiptImage} style={{ flex: 1, padding: '11px', backgroundColor: '#0a192f', color: '#fbbf24', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '10.5px', textTransform: 'uppercase', cursor: 'pointer' }}>
              📥 Save Receipt Image
            </button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button onClick={() => navigator.share({ title: 'HIYWA Receipt', text: `HIYWA Receipt #${receipt.transaction_id} for ${displayName} - ₹${receipt.amount}` }).catch(() => {})} style={{ padding: '11px 14px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '10.5px', textTransform: 'uppercase', cursor: 'pointer' }}>
                📲 Share
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RamadanScreen({ onBack }) {
  return (
    <div style={{ maxWidth: '600px', margin: '16px auto', padding: '0 14px' }}>
      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '20px', padding: '24px 18px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌙</div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#d97706', textTransform: 'uppercase' }}>Ramadan Competition</h3>
        <p style={{ margin: '0 0 14px 0', fontSize: '11px', color: '#b45309', fontWeight: '600', lineHeight: '1.4' }}>The HIYWA Ramadan Competition portal will open prior to the upcoming holy month of Ramadan.</p>
        <button onClick={onBack} style={{ padding: '8px 16px', backgroundColor: '#0a192f', color: '#fbbf24', border: 'none', borderRadius: '10px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>← Return Home</button>
      </div>
    </div>
  );
}

// ==========================================
// 8. MY CONTRIBUTIONS SCREEN
// ==========================================
export function MyContributionScreen({ currentUser, onViewReceipt, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const snap = await getDocs(collection(db, 'transactions'));
        const userTxns = snap.docs.map(d => d.data()).filter(t => t.member_id === currentUser.official_id);
        setHistory(userTxns.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)));
      } catch (e) {} finally { setLoading(false); }
    };
    fetchHistory();
  }, [currentUser]);

  const subTotal = history.filter(t => t.donation_type === 'SUBSCRIPTION').reduce((s, t) => s + Number(t.amount || 0), 0);
  const campTotal = history.filter(t => t.donation_type === 'FUND_RAISING' || t.donation_type === 'CAMPAIGN').reduce((s, t) => s + Number(t.amount || 0), 0);
  const genTotal = history.filter(t => t.donation_type === 'GENERAL').reduce((s, t) => s + Number(t.amount || 0), 0);
  const grandTotal = subTotal + campTotal + genTotal;

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)', padding: '14px 16px 48px 16px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>My Contributions</h2>
            <p style={{ margin: '2px 0 0 0', color: '#fbbf24', fontSize: '8.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Lifetime Giving History</p>
          </div>
          <button onClick={onBack} style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 10px', borderRadius: '8px', color: '#ffffff', fontWeight: '900', fontSize: '9.5px', textTransform: 'uppercase', cursor: 'pointer' }}>← Back</button>
        </div>
      </div>

      <div style={{ padding: '0 14px', maxWidth: '600px', margin: '-32px auto 0 auto', position: 'relative', zIndex: 10 }}>
        {/* Split up cards */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '14px', border: '1px solid #cbd5e1', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ textAlign: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Total Contributions</span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '26px', fontWeight: '900', color: '#1e3a8a' }}>₹{grandTotal.toLocaleString()}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div><span style={{ display: 'block', fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Subscriptions</span><span style={{ fontSize: '13px', fontWeight: '900', color: '#10b981' }}>₹{subTotal.toLocaleString()}</span></div>
            <div><span style={{ display: 'block', fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Fund Drives</span><span style={{ fontSize: '13px', fontWeight: '900', color: '#d97706' }}>₹{campTotal.toLocaleString()}</span></div>
            <div><span style={{ display: 'block', fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>General / Other</span><span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>₹{genTotal.toLocaleString()}</span></div>
          </div>
        </div>

        <h3 style={{ margin: '0 0 8px 4px', fontSize: '11px', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>Transaction History</h3>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '4px', border: '1px solid #cbd5e1' }}>
          {loading ? <p style={{ padding: '14px', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>Loading...</p> : history.length === 0 ? <p style={{ padding: '14px', textAlign: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: '700', margin: 0 }}>No contributions yet.</p> : history.map((txn, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 10px', borderBottom: idx === history.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '10.5px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{txn.reason || txn.donation_type}</p>
                <p style={{ margin: 0, fontSize: '8.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{new Date(txn.transaction_date).toLocaleDateString('en-GB')} • {txn.payment_method}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#10b981' }}>₹{txn.amount}</span>
                <button onClick={() => onViewReceipt(txn)} style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase' }}>📄 Slip</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}