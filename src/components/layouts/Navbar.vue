<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="icon-btn toggle-btn" @click="$emit('toggle-sidebar')" title="Toggle menu">
        <VsxIcon iconName="HambergerMenu" :size="20" />
      </button>
      <div class="page-meta">
        <h1 class="page-title">{{ currentPage }}</h1>
        <p class="page-crumb">{{ today }}</p>
      </div>
    </div>

    <!-- Global search -->
    <div class="topbar-search" ref="searchRef">
      <VsxIcon iconName="SearchNormal1" :size="18" class="search-icon" />
      <input
        type="text"
        class="search-input"
        placeholder="Search employees, pages…"
        v-model="query"
        @focus="searchOpen = true"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="chooseActive"
        @keydown.esc="searchOpen = false"
      />
      <kbd v-if="!query" class="search-kbd">/</kbd>
      <button v-else class="search-clear" @click="query = ''" title="Clear">
        <VsxIcon iconName="CloseCircle" :size="16" />
      </button>

      <transition name="drop">
        <div v-if="searchOpen && query" class="search-panel">
          <template v-if="results.length">
            <div v-if="pageResults.length" class="res-group">
              <p class="res-label">Pages</p>
              <button
                v-for="(r, i) in pageResults"
                :key="'p' + i"
                class="res-item"
                :class="{ active: activeIndex === r._idx }"
                @mouseenter="activeIndex = r._idx"
                @click="go(r)"
              >
                <span class="res-icon page"><VsxIcon :iconName="r.icon" :size="18" /></span>
                <span class="res-name">{{ r.name }}</span>
                <VsxIcon iconName="ArrowRight2" :size="16" class="res-go" />
              </button>
            </div>
            <div v-if="empResults.length" class="res-group">
              <p class="res-label">Employees</p>
              <button
                v-for="(r, i) in empResults"
                :key="'e' + i"
                class="res-item"
                :class="{ active: activeIndex === r._idx }"
                @mouseenter="activeIndex = r._idx"
                @click="go(r)"
              >
                <span class="res-avatar">{{ initials(r.name) }}</span>
                <span class="res-text">
                  <span class="res-name">{{ r.name }}</span>
                  <span class="res-sub">{{ r.code }} · {{ r.position_title || r.department_name || '—' }}</span>
                </span>
                <VsxIcon iconName="ArrowRight2" :size="16" class="res-go" />
              </button>
            </div>
          </template>
          <div v-else class="res-empty">
            <VsxIcon iconName="SearchStatus1" :size="22" />
            <span>No results for "{{ query }}"</span>
          </div>
        </div>
      </transition>
    </div>

    <div class="topbar-right">
      <!-- Notifications -->
      <div class="notif-wrap" ref="notifRef">
        <button class="icon-btn" title="Notifications" @click="notifOpen = !notifOpen">
          <VsxIcon iconName="Notification" :size="20" />
          <span v-if="notifications.length" class="dot"></span>
        </button>
        <transition name="drop">
          <div v-if="notifOpen" class="notif-panel">
            <div class="notif-head">
              <span>Notifications</span>
              <span v-if="notifications.length" class="notif-count">{{ notifications.length }}</span>
            </div>
            <ul class="notif-list">
              <li v-for="n in notifications" :key="n.id" class="notif-item" @click="goNotif(n)">
                <span class="notif-ic" :class="n.tone">
                  <VsxIcon :iconName="n.icon" :size="18" />
                </span>
                <span class="notif-body">
                  <span class="notif-title">{{ n.title }}</span>
                  <span class="notif-desc">{{ n.desc }}</span>
                </span>
              </li>
              <li v-if="!notifications.length" class="notif-empty">
                <VsxIcon iconName="TickCircle" :size="22" />
                <span>You're all caught up</span>
              </li>
            </ul>
            <router-link to="/leave" class="notif-foot" @click="notifOpen = false">
              Review all requests
            </router-link>
          </div>
        </transition>
      </div>

      <div class="topbar-divider"></div>
      <router-link to="/profile" class="topbar-user" title="Profile">
        <div class="avatar">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="avatar" />
          <div v-else class="avatar-placeholder">{{ userInitials }}</div>
        </div>
        <div class="topbar-user-info">
          <span class="tu-name">{{ displayName }}</span>
          <span class="tu-role">{{ roleLabel }}</span>
        </div>
        <VsxIcon iconName="ArrowDown2" :size="16" class="tu-chevron" />
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveStore } from '@/stores/leave'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const employeeStore = useEmployeeStore()
const leaveStore = useLeaveStore()

/* ── User ── */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const displayName = computed(() => {
  const f = cap(auth.user?.first_name || '')
  const l = cap(auth.user?.last_name || '')
  return `${f} ${l}`.trim() || 'User'
})
const roleLabel = computed(() => auth.role || 'Employee')
const userInitials = computed(() => auth.user?.first_name?.charAt(0).toUpperCase() || 'U')
const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

const today = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
)

const currentPage = computed(() => {
  const path = route.path
  if (path.includes('/admin/dashboard')) return 'Admin Dashboard'
  if (path.includes('/manage-hr')) return 'Manage HR Accounts'
  if (path === '/dashboard') return 'Dashboard'
  if (path.includes('/employees')) return 'Employee Directory'
  if (path.includes('/departments')) return 'Departments'
  if (path.includes('/positions')) return 'Positions'
  if (path.includes('/attendance')) return 'Attendance'
  if (path.includes('/leave')) return 'Leave Management'
  if (path.includes('/payroll')) return 'Payroll'
  if (path.includes('/reports')) return 'Reports'
  if (path.includes('/settings')) return 'Settings'
  if (path.includes('/profile')) return 'My Profile'
  return 'HRM System'
})

/* ── Search ── */
const query = ref('')
const searchOpen = ref(false)
const activeIndex = ref(0)
const searchRef = ref(null)

const pages = [
  { name: 'Dashboard', path: '/dashboard', icon: 'Category' },
  { name: 'Employee Directory', path: '/employees', icon: 'Profile2User' },
  { name: 'Add Employee', path: '/employees/create', icon: 'UserAdd' },
  { name: 'Departments', path: '/departments', icon: 'Buildings2' },
  { name: 'Positions', path: '/positions', icon: 'Briefcase' },
  { name: 'Attendance', path: '/attendance', icon: 'Clock' },
  { name: 'Leave Management', path: '/leave', icon: 'CalendarTick' },
  { name: 'Payroll', path: '/payroll', icon: 'Wallet3' },
  { name: 'Settings', path: '/settings', icon: 'Setting2' },
  { name: 'My Profile', path: '/profile', icon: 'User' },
]

const matchedPages = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return pages
    .filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, 4)
    .map((p) => ({ ...p, kind: 'page' }))
})

const matchedEmployees = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return (employeeStore.employees || [])
    .filter((e) =>
      [e.name, e.code, e.email, e.department_name, e.position_title]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
    .slice(0, 6)
    .map((e) => ({ ...e, kind: 'employee', path: `/employees/${e.id}` }))
})

// flat list with stable indexes for keyboard nav
const results = computed(() =>
  [...matchedPages.value, ...matchedEmployees.value].map((r, idx) => ({ ...r, _idx: idx })),
)
const pageResults = computed(() => results.value.filter((r) => r.kind === 'page'))
const empResults = computed(() => results.value.filter((r) => r.kind === 'employee'))

const move = (dir) => {
  if (!results.value.length) return
  activeIndex.value = (activeIndex.value + dir + results.value.length) % results.value.length
}
const chooseActive = () => {
  const r = results.value[activeIndex.value] || results.value[0]
  if (r) go(r)
}
const go = (r) => {
  router.push(r.path)
  query.value = ''
  searchOpen.value = false
}

/* ── Notifications ── */
const notifOpen = ref(false)
const notifRef = ref(null)
const notifications = computed(() => {
  const items = []
  const pending = (leaveStore.leaves || []).filter(
    (l) => String(l.status).toLowerCase() === 'pending',
  )
  pending.slice(0, 5).forEach((l) =>
    items.push({
      id: 'leave-' + l.id,
      icon: 'CalendarTick',
      tone: 'amber',
      title: `${l.employee_name || 'Employee'} requested ${l.leave_type || 'leave'}`,
      desc: `${l.duration_days || 1} day(s) · awaiting approval`,
      path: '/leave',
    }),
  )
  return items
})
const goNotif = (n) => {
  notifOpen.value = false
  router.push(n.path)
}

/* ── outside click ── */
const onClickOutside = (e) => {
  if (searchRef.value && !searchRef.value.contains(e.target)) searchOpen.value = false
  if (notifRef.value && !notifRef.value.contains(e.target)) notifOpen.value = false
}
const onSlash = (e) => {
  if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
    e.preventDefault()
    searchRef.value?.querySelector('input')?.focus()
  }
}
onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onSlash)
  if (!employeeStore.employees?.length) employeeStore.fetchEmployees?.()
  if (!leaveStore.leaves?.length) leaveStore.fetchAllLeaves?.()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onSlash)
})
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--topbar-h);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1.75rem;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}
.page-meta {
  line-height: 1.2;
}
.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--slate-900);
  letter-spacing: -0.02em;
}
.page-crumb {
  margin: 1px 0 0;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-faint);
}

.icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--slate-600);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}
.icon-btn:hover {
  background: var(--accent-soft);
  color: var(--accent-strong);
  border-color: transparent;
}
.icon-btn .dot {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  border: 2px solid #fff;
}

/* Search */
.topbar-search {
  position: relative;
  flex: 1;
  max-width: 480px;
  margin: 0 auto;
}
.search-icon {
  position: absolute;
  left: 0.95rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-faint);
  pointer-events: none;
}
.search-input {
  width: 100%;
  height: 44px;
  padding: 0 2.6rem 0 2.8rem;
  border-radius: 13px;
  border: 1px solid var(--border);
  background: var(--slate-50);
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--text);
  outline: none;
  transition: all 0.18s ease;
}
.search-input::placeholder {
  color: var(--text-faint);
}
.search-input:focus {
  background: #fff;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-ring);
}
.search-kbd {
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--slate-400);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1px 8px;
}
.search-clear {
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: var(--text-faint);
  cursor: pointer;
  display: flex;
}
.search-clear:hover {
  color: var(--slate-600);
}

.search-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  padding: 8px;
  max-height: 60vh;
  overflow-y: auto;
}
.res-group + .res-group {
  margin-top: 4px;
}
.res-label {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
  margin: 6px 10px;
}
.res-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: none;
  background: none;
  border-radius: 11px;
  cursor: pointer;
  text-align: left;
  transition: background 0.14s ease;
}
.res-item.active,
.res-item:hover {
  background: var(--accent-softer);
}
.res-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent-strong);
  flex-shrink: 0;
}
.res-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;
}
.res-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.res-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--slate-800);
  flex: 1;
}
.res-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.res-go {
  color: var(--text-faint);
}
.res-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 1.5rem;
  color: var(--text-faint);
  font-size: 0.83rem;
}

/* Right */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}
.topbar-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
}
.notif-wrap {
  position: relative;
}
.notif-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 320px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  z-index: 40;
}
.notif-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--slate-900);
  border-bottom: 1px solid var(--border);
}
.notif-count {
  background: var(--accent);
  color: #fff;
  font-size: 0.7rem;
  padding: 1px 8px;
  border-radius: 999px;
}
.notif-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  max-height: 320px;
  overflow-y: auto;
}
.notif-item {
  display: flex;
  gap: 10px;
  padding: 0.65rem 0.6rem;
  border-radius: 11px;
  cursor: pointer;
  transition: background 0.14s ease;
}
.notif-item:hover {
  background: var(--slate-50);
}
.notif-ic {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.notif-ic.amber {
  background: var(--warning-soft);
  color: #b45309;
}
.notif-ic.blue {
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.notif-body {
  display: flex;
  flex-direction: column;
}
.notif-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--slate-800);
}
.notif-desc {
  font-size: 0.74rem;
  color: var(--text-muted);
}
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 1.8rem 0;
  color: var(--success);
  font-size: 0.82rem;
}
.notif-foot {
  display: block;
  text-align: center;
  padding: 0.7rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent);
  border-top: 1px solid var(--border);
  text-decoration: none;
}
.notif-foot:hover {
  background: var(--accent-softer);
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.3rem 0.55rem 0.3rem 0.3rem;
  border-radius: 14px;
  text-decoration: none;
  transition: background 0.18s ease;
}
.topbar-user:hover {
  background: var(--slate-50);
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  overflow: hidden;
  flex-shrink: 0;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}
.topbar-user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.tu-name {
  font-size: 0.83rem;
  font-weight: 700;
  color: var(--slate-900);
}
.tu-role {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-faint);
}
.tu-chevron {
  color: var(--text-faint);
}

.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 900px) {
  .topbar-search {
    display: none;
  }
  .topbar-user-info {
    display: none;
  }
}
</style>
