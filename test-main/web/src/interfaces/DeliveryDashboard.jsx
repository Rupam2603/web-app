import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Bike, Truck, Package, CheckCircle2, Clock, MapPin, Phone,
  ExternalLink, RefreshCw, FileText, AlertCircle, ShieldCheck,
  Store, User, DollarSign, Check, X, Search, Download, LogOut,
  Navigation, Navigation2, Power, Send, Calendar, Award, Star,
  ArrowRight, ChevronRight, Sparkles, Box, AlertTriangle, Eye,
  Zap, Radio, Activity, CheckCheck, Compass, PhoneCall, Headphones,
  Sliders, Copy, ShieldAlert, CreditCard
} from 'lucide-react'
import { api } from '../services/api'

const fmtCurrency = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const fmtDate = d => {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return String(d) }
}
const fmtShortDate = d => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
  catch { return String(d) }
}

function StatusPill({ status }) {
  const s = String(status || '').toLowerCase()
  
  let bg = 'rgba(241, 245, 249, 0.9)'
  let border = '#cbd5e1'
  let color = '#475569'
  let label = status || 'Pending'
  let Icon = Clock

  if (s.includes('pending') || s.includes('awaiting')) {
    bg = 'rgba(254, 243, 199, 0.9)'
    border = '#fde68a'
    color = '#b45309'
    label = 'Pending'
    Icon = Clock
  } else if (s.includes('processing') || s.includes('confirmed')) {
    bg = 'rgba(224, 242, 254, 0.9)'
    border = '#bae6fd'
    color = '#0369a1'
    label = 'Confirmed'
    Icon = Check
  } else if (s.includes('dispatch') || s.includes('transit') || s.includes('out for')) {
    bg = 'rgba(209, 250, 229, 0.9)'
    border = '#a7f3d0'
    color = '#047857'
    label = 'Out for Delivery'
    Icon = Bike
  } else if (s.includes('delivered') || s.includes('completed')) {
    bg = 'rgba(220, 252, 231, 0.95)'
    border = '#86efac'
    color = '#15803d'
    label = 'Delivered'
    Icon = CheckCheck
  } else if (s.includes('cancel') || s.includes('reject') || s.includes('failed')) {
    bg = 'rgba(254, 226, 226, 0.9)'
    border = '#fca5a5'
    color = '#b91c1c'
    label = 'Failed / Cancelled'
    Icon = AlertTriangle
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 11px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '800',
      letterSpacing: '0.02em',
      background: bg,
      border: `1px solid ${border}`,
      color,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
    }}>
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  )
}

function Toast({ message, type = 'success' }) {
  if (!message) return null
  const isErr = type === 'error'
  
  const bg = isErr ? 'rgba(254, 242, 242, 0.96)' : 'rgba(240, 253, 244, 0.96)'
  const border = isErr ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'
  const text = isErr ? '#991b1b' : '#065f46'
  const glow = isErr ? '0 8px 32px rgba(239, 68, 68, 0.15)' : '0 8px 32px rgba(16, 185, 129, 0.15)'

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      background: bg,
      color: text,
      border: `1px solid ${border}`,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      padding: '14px 20px',
      borderRadius: '16px',
      fontSize: '13px',
      fontWeight: '700',
      boxShadow: glow,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '380px',
      animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {isErr ? <AlertTriangle size={18} color="#ef4444" /> : <CheckCircle2 size={18} color="#10b981" />}
      <span>{message}</span>
    </div>
  )
}

function GlassModal({ isOpen, onClose, title, children, width = 560 }) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.94)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 60px rgba(6, 95, 70, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
          color: '#0f172a'
        }}
        onClick={e => e.stopPropagation()}>
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(12px)',
            zIndex: 10
          }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', letterSpacing: '-0.01em', color: '#0f172a' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '12px',
              width: 34,
              height: 34,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              transition: 'all 0.15s ease'
            }}>
              <X size={18} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  )
}

function exportCSV(data, filename, cols) {
  const hdr = cols.map(c => `"${c.label}"`).join(',')
  const rows = data.map(row => cols.map(c => {
    const val = typeof c.get === 'function' ? c.get(row) : row[c.key]
    return `"${String(val ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
  }).join(','))
  const blob = new Blob([[hdr, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function DeliveryDashboard({ onLogout, isApp = false, user }) {
  // Ensure Light Theme persistence
  useEffect(() => {
    localStorage.setItem('subhone_delivery_theme', 'light')
  }, [])

  // Navigation tabs: incoming | active | history | retailers | profile
  const [activeTab, setActiveTab] = useState('incoming')
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [toast, setToast] = useState(null)
  const [toastType, setToastType] = useState('success')

  // Real Database state
  const [allOrders, setAllOrders] = useState([])
  const [retailers, setRetailers] = useState([])

  // Search and filter controls
  const [search, setSearch] = useState('')
  const [retailerSearch, setRetailerSearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')

  // Modals & interaction state
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [acceptingId, setAcceptingId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteOrderId, setNoteOrderId] = useState(null)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [deliverOrderId, setDeliverOrderId] = useState(null)
  const [codCollected, setCodCollected] = useState(true)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueOrderId, setIssueOrderId] = useState(null)
  const [issueReason, setIssueReason] = useState('Customer Not Available')
  const [showVehicleModal, setShowVehicleModal] = useState(false)

  // Duty status & vehicle profile stored locally with fallback
  const [isOnDuty, setIsOnDuty] = useState(() => {
    const saved = localStorage.getItem('subhone_delivery_duty')
    return saved !== null ? saved === 'true' : true
  })

  const [vehicleInfo, setVehicleInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('subhone_delivery_vehicle')
      return saved ? JSON.parse(saved) : { type: 'Motorcycle', regNumber: 'WB 16 AB 4921', license: 'DL-712203-2024' }
    } catch {
      return { type: 'Motorcycle', regNumber: 'WB 16 AB 4921', license: 'DL-712203-2024' }
    }
  })

  const partnerName = user?.name || user?.displayName || 'Subhasis Delivery'
  const partnerPhone = user?.phone || user?.mobile || '9477273346'
  const partnerId = user?.id || 'partner-subhasis'

  const showToast = useCallback((msg, type = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(null), 3500)
  }, [])

  // Toggle on/off duty
  const toggleDuty = () => {
    const nextState = !isOnDuty
    setIsOnDuty(nextState)
    localStorage.setItem('subhone_delivery_duty', String(nextState))
    showToast(nextState ? 'Duty Status: Present & Active' : 'Duty Status: Offline', nextState ? 'success' : 'error')
  }

  // Load orders & retailers from real database
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersData, usersData] = await Promise.all([
        api.getAllOrders().catch(() => []),
        api.getAllUsers().catch(() => [])
      ])
      setAllOrders(ordersData || [])
      setRetailers((usersData || []).filter(u => u.role === 'retailer' || u.userRole === 'retailer'))
      setLastSync(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err) {
      console.warn('DeliveryDashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
    const iv = setInterval(loadAll, 20000)
    return () => clearInterval(iv)
  }, [loadAll])

  // Helper to format order address string
  const formatAddress = order => {
    const sa = order.shippingAddress
    if (!sa) return 'Serampore, Hooghly, 712203'
    if (typeof sa === 'string') return sa
    return [sa.line1 || sa.address, sa.line2, sa.city, sa.state, sa.pincode].filter(Boolean).join(', ')
  }

  const getShopOrCustomerTitle = order => {
    const sa = order.shippingAddress
    const shop = sa?.shop_name || order.shopName
    const cust = order.customerName || 'Customer'
    return shop ? `${cust} (${shop})` : cust
  }

  const getLocationBrief = order => {
    const sa = order.shippingAddress
    const city = sa?.city || 'Serampore'
    const pin = sa?.pincode || '712203'
    return `${city}, ${pin}`
  }

  // Segment orders
  const incomingOrders = useMemo(() => {
    return allOrders.filter(o => {
      const isComplete = /delivered|completed|cancelled|rejected|failed/i.test(o.status || '')
      if (isComplete) return false
      const riderName = (o.deliveryPartnerName || '').trim().toLowerCase()
      if (!riderName) return true
      return false
    })
  }, [allOrders])

  const myActiveDeliveries = useMemo(() => {
    return allOrders.filter(o => {
      const isComplete = /delivered|completed|cancelled|rejected|failed/i.test(o.status || '')
      if (isComplete) return false
      const riderName = (o.deliveryPartnerName || '').trim().toLowerCase()
      const riderPhone = (o.deliveryPartnerPhone || '').trim()
      const riderId = String(o.deliveryPartnerId || '')
      return (
        riderId === String(partnerId) ||
        (riderPhone && riderPhone === partnerPhone) ||
        (riderName && (riderName.includes(partnerName.toLowerCase()) || partnerName.toLowerCase().includes(riderName)))
      )
    })
  }, [allOrders, partnerId, partnerName, partnerPhone])

  const today = new Date().toDateString()
  const deliveredTodayOrders = useMemo(() => {
    return allOrders.filter(o => {
      const isDelivered = /delivered|completed/i.test(o.status || '')
      if (!isDelivered) return false
      const isToday = o.updatedAt && new Date(o.updatedAt).toDateString() === today
      return isToday
    })
  }, [allOrders, today])

  const historyOrders = useMemo(() => {
    return allOrders.filter(o => /delivered|completed/i.test(o.status || ''))
  }, [allOrders])

  const stats = {
    availableOrders: incomingOrders.length,
    inProgress: myActiveDeliveries.length,
    deliveredToday: deliveredTodayOrders.length,
    dutyStatus: isOnDuty ? 'Present' : 'Offline'
  }

  // Accept an incoming delivery
  const handleAcceptDelivery = async order => {
    if (!isOnDuty) {
      showToast('Toggle Duty Status to Present before accepting orders.', 'error')
      return
    }
    setAcceptingId(order.id)
    try {
      await api.assignOrderDeliveryPartner(order.id, partnerName, partnerPhone, partnerId)
      await api.updateDeliveryStatus(order.id, 'Dispatched', `Accepted by rider ${partnerName}`)
      showToast(`Order #${order.orderNumber || order.id} assigned to you!`)
      await loadAll()
      setActiveTab('active')
    } catch (err) {
      console.error('Accept delivery failed:', err)
      showToast('Failed to accept delivery. Please retry.', 'error')
    } finally {
      setAcceptingId(null)
    }
  }

  // Progress status to 'Out for Delivery'
  const handleStartDelivery = async order => {
    setUpdatingId(order.id)
    try {
      await api.updateDeliveryStatus(order.id, 'Out for Delivery', `Rider ${partnerName} en route to doorstep`)
      showToast(`Order #${order.orderNumber || order.id} is now Out for Delivery!`)
      await loadAll()
    } catch (err) {
      showToast('Failed to update status', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  // Trigger modal for Mark Delivered
  const handleOpenDeliverModal = order => {
    setDeliverOrderId(order.id)
    setCodCollected(true)
    setShowDeliverModal(true)
  }

  // Confirm Mark Delivered
  const handleConfirmDelivered = async () => {
    if (!deliverOrderId) return
    setUpdatingId(deliverOrderId)
    try {
      const notes = codCollected ? 'Delivered safely. Payment verified.' : 'Delivered safely.'
      await api.updateDeliveryStatus(deliverOrderId, 'Delivered', notes)
      showToast('Order delivered successfully!')
      setShowDeliverModal(false)
      setDeliverOrderId(null)
      await loadAll()
    } catch (err) {
      showToast('Failed to confirm delivery', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  // Notes handling
  const handleOpenNoteModal = order => {
    setNoteOrderId(order.id)
    setDeliveryNote(order.deliveryNotes || '')
    setShowNoteModal(true)
  }

  const handleSaveNote = async () => {
    if (!noteOrderId) return
    try {
      const order = allOrders.find(o => o.id === noteOrderId)
      const currentStatus = order?.status || 'Dispatched'
      await api.updateDeliveryStatus(noteOrderId, currentStatus, deliveryNote)
      showToast('Delivery note recorded')
      setShowNoteModal(false)
      setNoteOrderId(null)
      await loadAll()
    } catch {
      showToast('Failed to save note', 'error')
    }
  }

  // Issues handling
  const handleOpenIssueModal = order => {
    setIssueOrderId(order.id)
    setShowIssueModal(true)
  }

  const handleReportIssue = async () => {
    if (!issueOrderId) return
    setUpdatingId(issueOrderId)
    try {
      await api.updateDeliveryStatus(issueOrderId, 'Cancelled', `Delivery Issue: ${issueReason}`)
      showToast(`Delivery issue reported: ${issueReason}`)
      setShowIssueModal(false)
      setIssueOrderId(null)
      await loadAll()
    } catch {
      showToast('Failed to report issue', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  // Save vehicle info
  const handleSaveVehicle = e => {
    e.preventDefault()
    localStorage.setItem('subhone_delivery_vehicle', JSON.stringify(vehicleInfo))
    setShowVehicleModal(false)
    showToast('Vehicle telemetry updated!')
  }

  // Filter incoming orders
  const filteredIncoming = incomingOrders.filter(o => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (o.orderNumber || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerPhone || '').includes(q) ||
      formatAddress(o).toLowerCase().includes(q)
    )
  })

  // Filter history
  const filteredHistory = historyOrders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q || (o.orderNumber || '').toLowerCase().includes(q) || (o.customerName || '').toLowerCase().includes(q) || formatAddress(o).toLowerCase().includes(q)
    if (historyFilter === 'today') {
      return matchSearch && o.updatedAt && new Date(o.updatedAt).toDateString() === today
    }
    return matchSearch
  })

  // Filter retailers
  const filteredRetailers = retailers.filter(r => {
    if (!retailerSearch.trim()) return true
    const q = retailerSearch.toLowerCase()
    return (
      (r.shopName || '').toLowerCase().includes(q) ||
      (r.name || '').toLowerCase().includes(q) ||
      (r.phone || '').includes(q) ||
      (r.address || '').toLowerCase().includes(q)
    )
  })

  // Futuristic Light Glassmorphism styling tokens
  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.78)',
    border: '1px solid rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    boxShadow: '0 8px 32px 0 rgba(6, 95, 70, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.95)',
    borderRadius: '22px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
  }

  const glassSubCardStyle = {
    background: 'rgba(240, 253, 244, 0.7)',
    border: '1px solid rgba(187, 247, 208, 0.7)',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 15% 10%, rgba(167, 243, 208, 0.45) 0%, transparent 60%), radial-gradient(ellipse at 85% 90%, rgba(153, 246, 228, 0.35) 0%, transparent 60%), radial-gradient(circle at 50% 50%, rgba(240, 253, 244, 0.8) 0%, #eefbf4 100%)',
        color: '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        paddingBottom: isApp ? '90px' : '48px',
        position: 'relative',
        overflowX: 'hidden'
      }}>
      
      {/* ── Ambient Background Glow Orbs (Light Mode) ────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-120px',
          left: '15%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(52, 211, 153, 0) 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: '-100px',
          right: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0) 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* ── Top Futuristic Glass Header ──────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.82)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          padding: isApp ? '12px 16px' : '16px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(6, 95, 70, 0.04)'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}>
            <Bike size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.02em', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              SubhOne
              <span
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  background: 'rgba(220, 252, 231, 0.95)',
                  color: '#065f46',
                  border: '1px solid #86efac',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontWeight: '800',
                  textTransform: 'uppercase'
                }}>
                FLEET HUD
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: '600' }}>{partnerName}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={10} />
                {lastSync ? `Synced ${lastSync}` : 'Live Telemetry'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Duty Status Quick Toggle */}
          <button
            onClick={toggleDuty}
            style={{
              background: isOnDuty ? 'rgba(220, 252, 231, 0.95)' : 'rgba(241, 245, 249, 0.95)',
              color: isOnDuty ? '#047857' : '#64748b',
              border: isOnDuty ? '1px solid #86efac' : '1px solid #cbd5e1',
              borderRadius: '9999px',
              padding: '7px 15px',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(8px)',
              boxShadow: isOnDuty ? '0 2px 10px rgba(16, 185, 129, 0.15)' : 'none',
              transition: 'all 0.2s ease'
            }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isOnDuty ? '#10b981' : '#94a3b8',
                boxShadow: isOnDuty ? '0 0 10px #10b981' : 'none'
              }}
            />
            {isOnDuty ? 'PRESENT' : 'OFFLINE'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadAll}
            title="Refresh Deliveries"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '12px',
              width: '38px',
              height: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease'
            }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Logout"
              style={{
                background: 'rgba(254, 226, 226, 0.85)',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(8px)'
              }}>
              <LogOut size={14} />
              {!isApp && 'Logout'}
            </button>
          )}
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: isApp ? '16px' : '28px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative',
          zIndex: 1
        }}>

        {/* ── Top 4 Telemetry Metrics Cards (Light Glassmorphism HUD) ───────── */}
        <div style={{ display: 'grid', gridTemplateColumns: isApp ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px' }}>
          {/* Card 1: Available Orders */}
          <div
            style={{
              ...glassCardStyle,
              padding: '20px 24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                AVAILABLE ORDERS
              </div>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(209, 250, 229, 0.75)',
                  border: '1px solid #86efac',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                <Package size={16} />
              </div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1, color: '#0f172a' }}>
              {stats.availableOrders}
            </div>
          </div>

          {/* Card 2: In Progress */}
          <div
            style={{
              ...glassCardStyle,
              padding: '20px 24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                IN PROGRESS
              </div>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(224, 242, 254, 0.75)',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7'
                }}>
                <Truck size={16} />
              </div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1, color: '#0f172a' }}>
              {stats.inProgress}
            </div>
          </div>

          {/* Card 3: Delivered Today */}
          <div
            style={{
              ...glassCardStyle,
              padding: '20px 24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                DELIVERED TODAY
              </div>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(220, 252, 231, 0.85)',
                  border: '1px solid #86efac',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a'
                }}>
                <CheckCheck size={16} />
              </div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1, color: '#0f172a' }}>
              {stats.deliveredToday}
            </div>
          </div>

          {/* Card 4: Duty Status */}
          <div
            onClick={toggleDuty}
            title="Click to toggle duty status"
            style={{
              ...glassCardStyle,
              padding: '20px 24px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                DUTY STATUS
              </div>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: isOnDuty ? 'rgba(220, 252, 231, 0.85)' : 'rgba(241, 245, 249, 0.85)',
                  border: isOnDuty ? '1px solid #86efac' : '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isOnDuty ? '#10b981' : '#94a3b8'
                }}>
                <Activity size={16} />
              </div>
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                color: isOnDuty ? '#059669' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px'
              }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isOnDuty ? '#10b981' : '#94a3b8',
                  boxShadow: isOnDuty ? '0 0 10px #10b981' : 'none'
                }}
              />
              {stats.dutyStatus}
            </div>
          </div>
        </div>

        {/* ── Glass Pill Navigation Tabs (Clean Vector Icons, No Emojis) ───── */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            padding: '4px 2px',
            scrollbarWidth: 'none'
          }}>
          {[
            { id: 'incoming', label: `Incoming Orders (${incomingOrders.length})`, icon: Package },
            { id: 'active', label: `My Deliveries (${myActiveDeliveries.length})`, icon: Bike },
            { id: 'history', label: 'Delivery History', icon: CheckCheck },
            { id: 'retailers', label: 'Retailer Approvals', icon: Store },
            { id: 'profile', label: 'My Profile', icon: User }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                    : 'rgba(255, 255, 255, 0.78)',
                  color: isActive ? '#ffffff' : '#475569',
                  border: isActive
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  borderRadius: '9999px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '800',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isActive
                    ? '0 6px 20px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    : '0 2px 6px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.18s ease'
                }}>
                <Icon size={15} strokeWidth={2.4} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── TAB 1: INCOMING ORDERS ───────────────────────────────────────── */}
        {activeTab === 'incoming' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-0.02em', color: '#0f172a' }}>
                  Available Retailer Deliveries
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Unassigned orders awaiting courier pickup in your operational zone
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div
                  style={{
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                  }}>
                  <Search size={14} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Search order or address..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 8px',
                      fontSize: '12px',
                      color: '#0f172a',
                      width: isApp ? '130px' : '200px'
                    }}
                  />
                </div>

                <button
                  onClick={loadAll}
                  style={{
                    background: 'rgba(209, 250, 229, 0.85)',
                    color: '#065f46',
                    border: '1px solid #86efac',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(8px)'
                  }}>
                  <RefreshCw size={13} className={loading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {filteredIncoming.length === 0 ? (
              <div
                style={{
                  ...glassCardStyle,
                  padding: '60px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b'
                  }}>
                  <Package size={26} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>No Incoming Deliveries Right Now</div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '360px' }}>
                  All orders have been picked up or assigned. Keep your status on Present to receive real-time dispatch alerts.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isApp ? '1fr' : 'repeat(2, 1fr)', gap: '18px' }}>
                {filteredIncoming.map(order => {
                  const isCOD = (order.paymentMethod || 'COD').toUpperCase().includes('COD')
                  const isAccepting = acceptingId === order.id

                  return (
                    <div
                      key={order.id}
                      style={{
                        ...glassCardStyle,
                        padding: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}>
                      {/* Top Chips Row */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: '700',
                              letterSpacing: '0.04em',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              background: 'rgba(0, 0, 0, 0.04)',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              color: '#334155'
                            }}>
                            {order.orderNumber || order.id?.slice(0, 14)}
                          </span>

                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '800',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: 'rgba(209, 250, 229, 0.95)',
                              border: '1px solid #86efac',
                              color: '#047857'
                            }}>
                            <CreditCard size={12} />
                            {fmtCurrency(order.totalAmount)} ({isCOD ? 'COD' : 'online'})
                          </span>
                        </div>

                        {/* Customer & Store Details */}
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.01em', marginBottom: '4px', color: '#064e3b' }}>
                            {getShopOrCustomerTitle(order)}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} color="#10b981" />
                            <span>{formatAddress(order)}</span>
                          </div>
                        </div>

                        {/* Items Breakdown Box */}
                        <div
                          style={{
                            ...glassSubCardStyle,
                            padding: '12px 14px',
                            marginTop: '12px'
                          }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                            Items ({order.items?.length || 1}):
                          </div>
                          {order.items && order.items.length > 0 ? (
                            order.items.slice(0, 2).map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                  {item.product_name || item.name}
                                </span>
                                <span style={{ fontWeight: '700' }}>x{item.quantity || 1}</span>
                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Medicines & Health package</div>
                          )}
                          {order.items && order.items.length > 2 && (
                            <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: '700' }}>
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button: Accept Delivery */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            background: 'rgba(0, 0, 0, 0.04)',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            borderRadius: '14px',
                            padding: '12px 16px',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => handleAcceptDelivery(order)}
                          disabled={isAccepting}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '14px',
                            padding: '13px 20px',
                            fontSize: '13px',
                            fontWeight: '800',
                            letterSpacing: '0.04em',
                            cursor: isAccepting ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                            transition: 'all 0.15s ease'
                          }}>
                          <Zap size={16} />
                          <span>{isAccepting ? 'Assigning...' : 'Accept Delivery'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: MY DELIVERIES (ACTIVE DELIVERIES) ────────────────────── */}
        {activeTab === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-0.02em', color: '#0f172a' }}>
                  Active Courier Dispatches
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Orders currently in transit assigned to {partnerName}
                </p>
              </div>

              <button
                onClick={loadAll}
                style={{
                  background: 'rgba(209, 250, 229, 0.85)',
                  color: '#065f46',
                  border: '1px solid #86efac',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(8px)'
                }}>
                <RefreshCw size={13} className={loading ? 'spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {myActiveDeliveries.length === 0 ? (
              <div
                style={{
                  ...glassCardStyle,
                  padding: '60px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b'
                  }}>
                  <Bike size={26} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>No Active Deliveries In Progress</div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '360px' }}>
                  You do not have any accepted dispatches currently. Head over to Incoming Orders to claim pending deliveries.
                </p>
                <button
                  onClick={() => setActiveTab('incoming')}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}>
                  View Incoming Deliveries
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isApp ? '1fr' : 'repeat(2, 1fr)', gap: '18px' }}>
                {myActiveDeliveries.map(order => {
                  const isCOD = (order.paymentMethod || 'COD').toUpperCase().includes('COD')
                  const isOutForDelivery = (order.status || '').toLowerCase().includes('out for')

                  return (
                    <div
                      key={order.id}
                      style={{
                        ...glassCardStyle,
                        padding: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}>
                      <div>
                        {/* Header Chip row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: '700',
                              letterSpacing: '0.04em',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              background: 'rgba(0, 0, 0, 0.04)',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              color: '#334155'
                            }}>
                            {order.orderNumber || order.id?.slice(0, 14)}
                          </span>

                          <StatusPill status={order.status} />
                        </div>

                        {/* Customer & Address */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em', marginBottom: '4px', color: '#064e3b' }}>
                            {getShopOrCustomerTitle(order)}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <MapPin size={14} color="#10b981" />
                            <span>{formatAddress(order)}</span>
                          </div>

                          {/* Cash on Delivery Notice */}
                          <div
                            style={{
                              ...glassSubCardStyle,
                              padding: '10px 14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                              {isCOD ? 'Cash to Collect on Doorstep' : 'Prepaid Online Order'}
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#059669' }}>
                              {fmtCurrency(order.totalAmount)}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons: Call & Navigate */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <a
                            href={`tel:${order.customerPhone || '9477273346'}`}
                            style={{
                              flex: 1,
                              background: 'rgba(224, 242, 254, 0.85)',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              borderRadius: '12px',
                              padding: '10px 14px',
                              fontSize: '12px',
                              fontWeight: '800',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}>
                            <PhoneCall size={14} />
                            <span>Call ({order.customerPhone || 'Customer'})</span>
                          </a>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(order))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              background: 'rgba(209, 250, 229, 0.85)',
                              color: '#047857',
                              border: '1px solid #86efac',
                              borderRadius: '12px',
                              padding: '10px 14px',
                              fontSize: '12px',
                              fontWeight: '800',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}>
                            <Navigation2 size={14} />
                            <span>Doorstep Map</span>
                          </a>
                        </div>
                      </div>

                      {/* Delivery Status Transitions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!isOutForDelivery && (
                            <button
                              onClick={() => handleStartDelivery(order)}
                              disabled={updatingId === order.id}
                              style={{
                                flex: 1,
                                background: 'rgba(254, 243, 199, 0.95)',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                borderRadius: '12px',
                                padding: '12px',
                                fontSize: '13px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}>
                              <Bike size={15} />
                              <span>Start Delivery</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDeliverModal(order)}
                            disabled={updatingId === order.id}
                            style={{
                              flex: 1,
                              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                              color: '#fff',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '12px',
                              padding: '12px',
                              fontSize: '13px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.28)'
                            }}>
                            <CheckCheck size={16} />
                            <span>Mark Delivered</span>
                          </button>
                        </div>

                        {/* Extra Actions: Note & Issue Reporting */}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenNoteModal(order)}
                            style={{
                              background: 'rgba(0, 0, 0, 0.04)',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#64748b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                            <FileText size={12} />
                            <span>Note</span>
                          </button>

                          <button
                            onClick={() => handleOpenIssueModal(order)}
                            style={{
                              background: 'rgba(254, 226, 226, 0.8)',
                              border: '1px solid #fca5a5',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#b91c1c',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                            <AlertTriangle size={12} />
                            <span>Report Issue</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: DELIVERY HISTORY ─────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-0.02em', color: '#0f172a' }}>
                  Completed Delivery History
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Archived log of fulfilled consignments and customer handovers
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setHistoryFilter(f => f === 'all' ? 'today' : 'all')}
                  style={{
                    background: historyFilter === 'today'
                      ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                      : 'rgba(255, 255, 255, 0.85)',
                    color: historyFilter === 'today' ? '#fff' : '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}>
                  {historyFilter === 'today' ? 'Filter: Today Only' : 'Filter: All Time'}
                </button>

                <button
                  onClick={() => exportCSV(filteredHistory, `subhone_delivery_history_${Date.now()}.csv`, [
                    { label: 'Order Number', key: 'orderNumber' },
                    { label: 'Customer', key: 'customerName' },
                    { label: 'Phone', key: 'customerPhone' },
                    { label: 'Amount', key: 'totalAmount' },
                    { label: 'Payment Mode', key: 'paymentMethod' },
                    { label: 'Status', key: 'status' },
                    { label: 'Delivered At', get: o => fmtDate(o.updatedAt) }
                  ])}
                  style={{
                    background: 'rgba(209, 250, 229, 0.85)',
                    color: '#047857',
                    border: '1px solid #86efac',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div
                style={{
                  ...glassCardStyle,
                  padding: '60px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b'
                  }}>
                  <CheckCheck size={26} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>No Delivery Records Found</div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Deliveries you complete will appear here with delivery timestamps and settlement logs.
                </p>
              </div>
            ) : (
              <div style={{ ...glassCardStyle, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.06)', color: '#64748b', background: 'rgba(248, 250, 252, 0.6)' }}>
                        <th style={{ padding: '14px 20px', fontWeight: '800' }}>ORDER ID</th>
                        <th style={{ padding: '14px 20px', fontWeight: '800' }}>CUSTOMER & SHOP</th>
                        <th style={{ padding: '14px 20px', fontWeight: '800' }}>DESTINATION</th>
                        <th style={{ padding: '14px 20px', fontWeight: '800' }}>PAYMENT</th>
                        <th style={{ padding: '14px 20px', fontWeight: '800' }}>DELIVERED AT</th>
                        <th style={{ padding: '14px 20px', fontWeight: '800' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((order, idx) => (
                        <tr
                          key={order.id}
                          style={{
                            borderBottom: idx < filteredHistory.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                            transition: 'background 0.15s ease'
                          }}>
                          <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: '700', color: '#334155' }}>
                            {order.orderNumber || order.id?.slice(0, 14)}
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0f172a' }}>
                            {getShopOrCustomerTitle(order)}
                          </td>
                          <td style={{ padding: '14px 20px', color: '#64748b' }}>
                            {getLocationBrief(order)}
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: '800', color: '#059669' }}>
                            {fmtCurrency(order.totalAmount)}
                          </td>
                          <td style={{ padding: '14px 20px', color: '#64748b' }}>
                            {fmtDate(order.updatedAt)}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <StatusPill status="Delivered" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: RETAILER APPROVALS & STORES ───────────────────────────── */}
        {activeTab === 'retailers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-0.02em', color: '#0f172a' }}>
                  Registered Pharmacy Retailers
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Authorized pickup partner pharmacies in the SubhOne health network
                </p>
              </div>

              <div
                style={{
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                }}>
                <Search size={14} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search pharmacy / store..."
                  value={retailerSearch}
                  onChange={e => setRetailerSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: '8px 8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    width: isApp ? '140px' : '220px'
                  }}
                />
              </div>
            </div>

            {filteredRetailers.length === 0 ? (
              <div
                style={{
                  ...glassCardStyle,
                  padding: '60px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b'
                  }}>
                  <Store size={26} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>No Pharmacy Stores Found</div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  No registered retailer stores match your query or have been enrolled yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isApp ? '1fr' : 'repeat(2, 1fr)', gap: '18px' }}>
                {filteredRetailers.map(ret => (
                  <div
                    key={ret.id}
                    style={{
                      ...glassCardStyle,
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px'
                    }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#064e3b' }}>
                          <Store size={18} color="#10b981" />
                          <span>{ret.shopName || ret.name}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '16px',
                            background: 'rgba(220, 252, 231, 0.95)',
                            border: '1px solid #86efac',
                            color: '#047857'
                          }}>
                          VERIFIED
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <MapPin size={14} color="#10b981" />
                        <span>{ret.address || 'Serampore, Hooghly, 712203'}</span>
                      </div>

                      {ret.licenseNumber && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          Drug License: {ret.licenseNumber}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <a
                        href={`tel:${ret.phone || '9477273346'}`}
                        style={{
                          flex: 1,
                          background: 'rgba(224, 242, 254, 0.85)',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          fontSize: '12px',
                          fontWeight: '800',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}>
                        <PhoneCall size={14} />
                        <span>Call Store</span>
                      </a>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ret.address || 'Serampore Hooghly 712203')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          background: 'rgba(209, 250, 229, 0.85)',
                          color: '#047857',
                          border: '1px solid #86efac',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          fontSize: '12px',
                          fontWeight: '800',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}>
                        <Compass size={14} />
                        <span>Navigate Store</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: MY PROFILE & VEHICLE TELEMETRY ────────────────────────── */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            {/* Rider ID card */}
            <div style={{ ...glassCardStyle, padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.28)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }}>
                  <User size={32} />
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.02em', color: '#064e3b' }}>{partnerName}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Fleet Partner ID: {partnerId} • {partnerPhone}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: isOnDuty ? 'rgba(220, 252, 231, 0.95)' : 'rgba(241, 245, 249, 0.95)',
                        border: isOnDuty ? '1px solid #86efac' : '1px solid #cbd5e1',
                        color: isOnDuty ? '#047857' : '#64748b'
                      }}>
                      {isOnDuty ? 'STATUS: PRESENT' : 'STATUS: OFFLINE'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: 'rgba(224, 242, 254, 0.95)',
                        border: '1px solid #bae6fd',
                        color: '#0369a1'
                      }}>
                      ZONE: SERAMPORE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle & Telemetry Box */}
            <div style={{ ...glassCardStyle, padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <ShieldCheck size={18} color="#10b981" />
                    <span>Registered Vehicle Telemetry</span>
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Active transport credential for medicine delivery dispatches
                  </div>
                </div>

                <button
                  onClick={() => setShowVehicleModal(true)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#0f172a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                  <Sliders size={13} />
                  <span>Update</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isApp ? '1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ ...glassSubCardStyle, padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    Vehicle Type
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', color: '#0f172a' }}>{vehicleInfo.type}</div>
                </div>

                <div style={{ ...glassSubCardStyle, padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    Registration Plate
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', fontFamily: 'monospace', color: '#0f172a' }}>
                    {vehicleInfo.regNumber}
                  </div>
                </div>

                <div style={{ ...glassSubCardStyle, padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    Driving License
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', fontFamily: 'monospace', color: '#0f172a' }}>
                    {vehicleInfo.license}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Hotline */}
            <div style={{ ...glassCardStyle, padding: '28px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                <Headphones size={18} color="#10b981" />
                <span>SubhOne Logistics Dispatcher Hotline</span>
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                Need roadside assistance, customer contact intervention, or route clearance? Connect with central command instantly.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href="tel:9836307553"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#fff',
                    padding: '11px 20px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)'
                  }}>
                  <PhoneCall size={15} />
                  <span>Call Dispatcher: +91 9836307553</span>
                </a>

                <a
                  href="https://wa.me/919836307553"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'rgba(220, 252, 231, 0.95)',
                    color: '#065f46',
                    border: '1px solid #86efac',
                    padding: '11px 20px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                  <Phone size={15} />
                  <span>WhatsApp Dispatch</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Order Details Glass Modal ────────────────────────────────────── */}
      {selectedOrder && (
        <GlassModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Consignment: ${selectedOrder.orderNumber || selectedOrder.id?.slice(0, 14)}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ ...glassSubCardStyle, padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>CUSTOMER</div>
                <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '2px', color: '#0f172a' }}>{selectedOrder.customerName}</div>
              </div>
              <div style={{ ...glassSubCardStyle, padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>PHONE</div>
                <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '2px' }}>
                  <a href={`tel:${selectedOrder.customerPhone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                    {selectedOrder.customerPhone || '—'}
                  </a>
                </div>
              </div>
              <div style={{ ...glassSubCardStyle, padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>ORDER TOTAL</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
                  {fmtCurrency(selectedOrder.totalAmount)}
                </div>
              </div>
              <div style={{ ...glassSubCardStyle, padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>PAYMENT METHOD</div>
                <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '2px', color: '#0f172a' }}>
                  {selectedOrder.paymentMethod || 'Cash On Delivery (COD)'}
                </div>
              </div>
            </div>

            <div style={{ ...glassSubCardStyle, padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', marginBottom: '6px' }}>
                Delivery Destination
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#0f172a' }}>{formatAddress(selectedOrder)}</div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(selectedOrder))}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}>
                <Compass size={14} />
                <span>Open in Google Maps</span>
              </a>
            </div>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Packaged Items ({selectedOrder.items.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...glassSubCardStyle,
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        fontSize: '13px'
                      }}>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{item.product_name || item.name}</span>
                      <span style={{ fontWeight: '800', color: '#059669' }}>Qty: {item.quantity || 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassModal>
      )}

      {/* ── Confirm Delivery Glass Modal ─────────────────────────────────── */}
      {showDeliverModal && (
        <GlassModal
          isOpen={showDeliverModal}
          onClose={() => setShowDeliverModal(false)}
          title="Confirm Consignment Handover">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
              Are you currently at the delivery location and handing the sealed health package to the recipient?
            </p>

            <label
              style={{
                ...glassSubCardStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                cursor: 'pointer'
              }}>
              <input
                type="checkbox"
                checked={codCollected}
                onChange={e => setCodCollected(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#047857' }}>
                Payment verified & full cash collected from customer
              </span>
            </label>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={() => setShowDeliverModal(false)}
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer'
                }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivered}
                disabled={updatingId !== null}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.28)'
                }}>
                <CheckCheck size={16} />
                <span>{updatingId ? 'Updating...' : 'Confirm Delivery'}</span>
              </button>
            </div>
          </div>
        </GlassModal>
      )}

      {/* ── Delivery Note Glass Modal ─────────────────────────────────────── */}
      {showNoteModal && (
        <GlassModal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          title="Courier Dispatch Note">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <textarea
              placeholder="e.g. Left with security guard, customer paid via UPI scanner..."
              value={deliveryNote}
              onChange={e => setDeliveryNote(e.target.value)}
              style={{
                width: '100%',
                height: '110px',
                padding: '14px',
                borderRadius: '14px',
                background: '#fff',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNoteModal(false)}
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer'
                }}>
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}>
                Save Note
              </button>
            </div>
          </div>
        </GlassModal>
      )}

      {/* ── Delivery Issue Glass Modal ────────────────────────────────────── */}
      {showIssueModal && (
        <GlassModal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          title="Report Delivery Issue">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Select the exception reason this delivery could not be fulfilled:
            </p>
            <select
              value={issueReason}
              onChange={e => setIssueReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: '#fff',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none'
              }}>
              <option value="Customer Not Available">Customer Not Available / Door Locked</option>
              <option value="Phone Switched Off">Phone Switched Off / Unreachable</option>
              <option value="Wrong Address / Pin code">Wrong Address / Out of Delivery Area</option>
              <option value="Customer Rejected Order">Customer Rejected / Refused Order</option>
              <option value="Payment Refused">Customer Refused Payment</option>
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                onClick={() => setShowIssueModal(false)}
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer'
                }}>
                Cancel
              </button>
              <button
                onClick={handleReportIssue}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}>
                Submit Exception
              </button>
            </div>
          </div>
        </GlassModal>
      )}

      {/* ── Vehicle Info Glass Modal ──────────────────────────────────────── */}
      {showVehicleModal && (
        <GlassModal
          isOpen={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
          title="Update Vehicle Telemetry">
          <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Vehicle Classification
              </label>
              <select
                value={vehicleInfo.type}
                onChange={e => setVehicleInfo(v => ({ ...v, type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none'
                }}>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Scooter">Scooter</option>
                <option value="Electric Vehicle (EV)">Electric Vehicle (EV)</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Light Commercial Van">Light Commercial Van</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Registration / Plate Number
              </label>
              <input
                value={vehicleInfo.regNumber}
                onChange={e => setVehicleInfo(v => ({ ...v, regNumber: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Driving License Credential
              </label>
              <input
                value={vehicleInfo.license}
                onChange={e => setVehicleInfo(v => ({ ...v, license: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer'
                }}>
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}>
                Save Telemetry
              </button>
            </div>
          </form>
        </GlassModal>
      )}

      {/* ── Mobile / App Bottom Glass Navigation Bar ─────────────────────── */}
      {isApp && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.88)',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '10px 4px 14px 4px',
            zIndex: 1000,
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)'
          }}>
          {[
            { id: 'incoming', label: `Incoming (${incomingOrders.length})`, icon: Package },
            { id: 'active', label: `Active (${myActiveDeliveries.length})`, icon: Bike },
            { id: 'history', label: 'History', icon: CheckCheck },
            { id: 'retailers', label: 'Retailers', icon: Store },
            { id: 'profile', label: 'Profile', icon: User }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  color: isActive ? '#059669' : '#64748b',
                  fontSize: '11px',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer'
                }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      )}

      <Toast message={toast} type={toastType} />
    </div>
  )
}
