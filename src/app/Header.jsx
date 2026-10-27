import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './theme';

export default function Header({ currentUser, onNavigate, onLogout, isPublic = false, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotifs, setDismissedNotifs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const storageKey = currentUser?.official_id ? `hiywa_dismissed_notifs_${currentUser.official_id}` : null;

  // Load previously acknowledged notifications on login
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
        setDismissedNotifs(Array.isArray(saved) ? saved : []);
      } catch (e) {
        setDismissedNotifs([]);
      }
    }
  }, [storageKey]);

  const handleAcknowledgeAll = (visibleList) => {
    const updated = Array.from(new Set([...dismissedNotifs, ...visibleList.map(n => n.id)]));
    setDismissedNotifs(updated);
    if (storageKey && typeof window !== 'undefined' && window.localStorage) {
      try { window.localStorage.setItem(storageKey, JSON.stringify(updated)); } catch (e) {}
    }
    setShowDropdown(false);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser || isPublic) return;
      try {
        const notifs = [];
        const setSnap = await getDoc(doc(db, 'settings', 'global'));
        const setData = setSnap.exists() ? setSnap.data() : {};
        const subStartMonth = setData.subscription_start_month || '';
        const monthlyRate = Number(setData.monthly_subscription_amount || 100);

        const isFutureStart = subStartMonth && new Date(`${subStartMonth}-01`) > new Date();
        const isSubsDisabled = !subStartMonth || isFutureStart;

        // 1. Member Subscription Dues Alert
        if (currentUser.role !== 'STUDENT' && !isSubsDisabled) {
          const joinDate = currentUser.join_date ? new Date(currentUser.join_date) : new Date();
          let startDate = joinDate;
          if (subStartMonth) {
            const systemStart = new Date(`${subStartMonth}-01`);
            if (systemStart > joinDate) startDate = systemStart;
          }
          const now = new Date();
          const rawMonths = ((now.getFullYear() - startDate.getFullYear()) * 12) + (now.getMonth() - startDate.getMonth()) + 1;
          const duesMonths = Math.max(0, Math.max(0, rawMonths) - (parseInt(currentUser.total_months_paid) || 0));
          if (duesMonths > 0) {
            notifs.push({
              id: 'sub_due',
              type: 'warning',
              text: `DUES ALERT: Your subscription due is ₹${duesMonths * monthlyRate} (${duesMonths} Mo). Tap to pay.`,
              targetView: 'subscription'
            });
          }
        }

        // 2. Active Fundraising Drives Alert
        const campSnap = await getDocs(collection(db, 'campaigns'));
        const activeCamps = campSnap.docs
          .map(d => d.data())
          .filter(c => c.status === 'ACTIVE' && (parseFloat(c.raised_amount) || 0) < (parseFloat(c.target_amount) || 1));

        activeCamps.forEach(c => {
          notifs.push({
            id: `camp_${c.campaign_id}`,
            type: 'alert',
            text: `LIVE DRIVE: "${c.title}" is open. Goal: ₹${c.target_amount}. Tap to contribute!`,
            targetView: 'fundraising'
          });
        });

        // 3. USER-SIDE ACTIVITY EVENTS (Profile Edits, Password Changes, etc. — No Admin Logs or Payment Alerts)
        const logsSnap = await getDocs(collection(db, 'system_logs'));
        const userEvents = logsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(l => l.event_type === 'USER_EVENT')
          .filter(l => currentUser.role === 'ADMIN' ? true : l.member_id === currentUser.official_id)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 8);

        userEvents.forEach((ev, idx) => {
          const dateStr = new Date(ev.timestamp).toLocaleDateString('en-GB');
          notifs.push({
            id: `usrev_${ev.id || idx}`,
            type: 'success',
            text: currentUser.role === 'ADMIN'
              ? `USER ACTIVITY: ${ev.details || `${ev.full_name} - ${ev.action}`} (${dateStr})`
              : `ACTIVITY: You ${ev.action?.toLowerCase() || 'updated your profile'} on ${dateStr}.`,
            targetView: currentUser.role === 'ADMIN' ? 'admin_events' : 'profile'
          });
        });

        setNotifications(notifs);
      } catch (err) {
        console.error(err);
      }
    };

    fetchNotifications();
  }, [currentUser, isPublic]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  if (!isPublic && !currentUser) return null;

  // THIS MISSING LINE CAUSED THE BLANK SCREEN CRASH
  const visibleNotifications = notifications.filter(n => !dismissedNotifs.includes(n.id));

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      backgroundColor: '#ffffff',
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1000,
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Left Brand Typography (Modern White Header) */}
      <div onClick={() => !isPublic && onNavigate && onNavigate('home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: isPublic ? 'default' : 'pointer', minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.8px', textTransform: 'uppercase' }}>HIYWA</h1>
          <span style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', fontSize: '8px', fontWeight: '900', padding: '2px 7px', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            MTK PURAM
          </span>
        </div>
        <p style={{ margin: '3px 0 0 0', fontSize: '8px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
          HIDHAYATHUL ISLAM YOUTH WELFARE ASSOCIATION
        </p>
      </div>

      {/* Right Actions */}
      {isPublic ? (
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', color: '#0f172a', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>
          ← Login
        </button>
      ) : (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer', color: '#1e3a8a', width: '36px', height: '36px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.2s' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            {visibleNotifications.length > 0 && (
              <div style={{ position: 'absolute', top: '-4px', right: '-4px', minWidth: '16px', height: '16px', backgroundColor: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: '900', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #ffffff', boxSizing: 'border-box' }}>
                {visibleNotifications.length}
              </div>
            )}
          </div>

          {showDropdown && (
            <div style={{ position: 'absolute', top: '46px', right: '0', width: '280px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 12px 35px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1', overflow: 'hidden', zIndex: 1001 }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a' }}>Alerts</h4>
                {visibleNotifications.length > 0 && (
                  <button onClick={() => handleAcknowledgeAll(visibleNotifications)} style={{ fontSize: '9px', backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>
                    Acknowledge & Clear
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {visibleNotifications.length === 0 ? (
                  <div style={{ padding: '24px 14px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '800' }}>You're all caught up!</p>
                  </div>
                ) : (
                  visibleNotifications.map((notif) => (
                    <div key={notif.id} onClick={() => { setShowDropdown(false); if (notif.targetView) onNavigate(notif.targetView); }} style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', backgroundColor: notif.type === 'success' ? '#f0fdf4' : notif.type === 'warning' ? '#fffbeb' : '#eff6ff' }}>
                      <div style={{ marginTop: '1px', color: notif.type === 'success' ? '#10b981' : (notif.type === 'warning' ? '#f59e0b' : '#3b82f6') }}>
                        {notif.type === 'success' ? '👤' : notif.type === 'warning' ? '⚠️' : '📢'}
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#0f172a', lineHeight: '1.4', fontWeight: '700' }}>{notif.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}