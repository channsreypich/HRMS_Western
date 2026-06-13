<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Brand -->
    <div class="sidebar-header">
      <div class="logo-container">
        <div class="logo-icon"><VsxIcon iconName="Buildings2" :size="20" type="bold" /></div>
        <div class="logo-meta" v-if="!isCollapsed">
          <span class="logo-text">HRM System</span>
          <span class="logo-sub">Human Resources</span>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-menu">
      <p class="menu-section-label" v-if="!isCollapsed">Menu</p>
      <div v-for="item in menuItems" :key="item.path" class="menu-item-container">
        <router-link
          :to="item.path"
          class="menu-item"
          :class="{ active: isActiveRoute(item.path), collapsed: isCollapsed }"
          :title="isCollapsed ? item.name : ''"
        >
          <span class="menu-content">
            <span class="menu-icon">
              <VsxIcon
                :iconName="item.icon"
                :size="isCollapsed ? 26 : 20"
                :type="isActiveRoute(item.path) ? 'bold' : 'linear'"
              />
            </span>
            <span class="menu-text" v-if="!isCollapsed">{{ item.name }}</span>
            <span class="menu-badge" v-if="item.badge && !isCollapsed">{{ item.badge }}</span>
          </span>
          <span class="active-bar" v-if="isActiveRoute(item.path)"></span>
        </router-link>
      </div>
    </nav>

    <!-- User -->
    <div class="sidebar-footer">
      <div
        class="user-profile"
        :class="{ collapsed: isCollapsed }"
        @click="showUserMenu = !showUserMenu"
      >
        <div class="avatar">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="avatar" />
          <div v-else class="avatar-placeholder">{{ getUserInitials() }}</div>
        </div>
        <div class="user-info" v-if="!isCollapsed">
          <div class="user-name">{{ displayName }}</div>
          <div class="user-role" :class="roleClass">{{ roleLabel }}</div>
        </div>
        <VsxIcon iconName="ArrowUp2" :size="16" class="chevron-icon" v-if="!isCollapsed" />
      </div>

      <transition name="pop">
        <div v-if="showUserMenu && !isCollapsed" class="user-dropdown">
          <router-link to="/profile" class="dropdown-item" @click="showUserMenu = false">
            <VsxIcon iconName="User" :size="18" /> Profile
          </router-link>
          <router-link to="/settings" class="dropdown-item" @click="showUserMenu = false">
            <VsxIcon iconName="Setting2" :size="18" /> Settings
          </router-link>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item danger" @click="logout">
            <VsxIcon iconName="Logout" :size="18" /> Logout
          </button>
        </div>
      </transition>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEmployeeStore } from '@/stores/employee'
import { toast } from 'vue3-toastify'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
})

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const employeeStore = useEmployeeStore()

const showUserMenu = ref(false)
const isCollapsed = computed(() => props.collapsed)

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const displayName = computed(() => {
  const f = cap(auth.user?.first_name || '')
  const l = cap(auth.user?.last_name || '')
  return `${f} ${l}`.trim() || 'User'
})
const roleLabel = computed(() => auth.role || 'Employee')
const roleClass = computed(() =>
  auth.role === 'Admin' ? 'role-admin' : auth.role === 'HR' ? 'role-hr' : 'role-employee',
)

const menuItems = computed(() =>
  auth.isAdmin
    ? [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: 'Category' },
        { name: 'Manage HR Accounts', path: '/manage-hr', icon: 'SecurityUser' },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', icon: 'Category' },
        {
          name: 'Employees',
          path: '/employees',
          icon: 'Profile2User',
          badge: employeeStore.employees?.length || 0,
        },
        { name: 'Departments', path: '/departments', icon: 'Buildings2' },
        { name: 'Positions', path: '/positions', icon: 'Briefcase' },
        { name: 'Attendance', path: '/attendance', icon: 'Clock' },
        { name: 'Leave', path: '/leave', icon: 'CalendarTick' },
        { name: 'Payroll', path: '/payroll', icon: 'Wallet3' },
        { name: 'Settings', path: '/settings', icon: 'Setting2' },
      ],
)

const isActiveRoute = (path) => route.path === path || route.path.startsWith(path + '/')
const getUserInitials = () => auth.user?.first_name?.charAt(0).toUpperCase() || 'U'
const logout = async () => {
  await auth.logout()
  toast.success('Logged out')
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #ffffff;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 101;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.collapsed {
  width: var(--sidebar-collapsed-w);
}

/* Header */
.sidebar-header {
  padding: 1.4rem 1.25rem;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}
.logo-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: var(--shadow-accent);
}
.logo-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.logo-text {
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--slate-900);
  white-space: nowrap;
}
.logo-sub {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-faint);
  white-space: nowrap;
}

/* Menu */
.sidebar-menu {
  flex: 1;
  padding: 0.4rem 0.85rem 1rem;
  overflow-y: auto;
  overflow-x: hidden;
}
.menu-section-label {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  margin: 0.6rem 0.75rem 0.5rem;
}
.menu-item {
  position: relative;
  display: block;
  text-decoration: none;
  color: var(--slate-600);
  border-radius: 12px;
  margin-bottom: 3px;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}
.menu-item:hover {
  background: var(--slate-50);
  color: var(--slate-900);
}
.menu-item.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.menu-content {
  display: flex;
  align-items: center;
  padding: 0.7rem 0.8rem;
  gap: 0.8rem;
}
.collapsed .menu-content {
  justify-content: center;
  padding: 0.7rem;
}
.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.menu-text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}
.menu-badge {
  background: var(--accent);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.menu-item.active .menu-badge {
  background: var(--accent-strong);
}
.active-bar {
  position: absolute;
  left: -0.85rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 22px;
  border-radius: 0 4px 4px 0;
  background: var(--accent);
}

/* Submenu */
.submenu {
  margin: 2px 0 6px 1.4rem;
  padding-left: 0.6rem;
  border-left: 1.5px solid var(--slate-200);
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.submenu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.7rem;
  color: var(--slate-500);
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.15s ease;
}
.submenu-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--slate-300);
  flex-shrink: 0;
  transition: background 0.15s ease;
}
.submenu-item:hover {
  color: var(--slate-800);
  background: var(--slate-50);
}
.submenu-item.active {
  color: var(--accent-strong);
  font-weight: 700;
}
.submenu-item.active .submenu-dot {
  background: var(--accent);
}

/* Footer / user */
.sidebar-footer {
  padding: 0.85rem;
  border-top: 1px solid var(--border);
  position: relative;
}
.user-profile {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.18s ease;
}
.user-profile:hover {
  background: var(--slate-50);
}
.user-profile.collapsed {
  justify-content: center;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
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
  color: white;
  font-weight: 700;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.user-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--slate-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-role {
  font-size: 0.72rem;
  font-weight: 600;
}
.role-admin {
  color: #d97706;
}
.role-hr {
  color: var(--accent);
}
.role-employee {
  color: #0284c7;
}
.chevron-icon {
  color: var(--text-faint);
  flex-shrink: 0;
}

.user-dropdown {
  position: absolute;
  bottom: calc(100% - 4px);
  left: 0.85rem;
  right: 0.85rem;
  background: #ffffff;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  border-radius: 14px;
  padding: 6px;
  margin-bottom: 6px;
  z-index: 30;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  color: var(--slate-600);
  font-size: 0.85rem;
  font-weight: 600;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 9px;
  transition: all 0.15s ease;
}
.dropdown-item:hover {
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.dropdown-item.danger {
  color: var(--danger);
}
.dropdown-item.danger:hover {
  background: var(--danger-soft);
}
.dropdown-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 6px;
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
