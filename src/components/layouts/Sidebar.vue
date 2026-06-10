
<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <div class="logo-container">
        <div class="logo-icon"><i class="fas fa-building"></i></div>
        <span class="logo-text" v-if="!isCollapsed">HRM System</span>
      </div>
      <button class="collapse-btn" @click="toggleSidebar">
        <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
      </button>
    </div>

    <div class="search-container" v-if="!isCollapsed && !auth.isAdmin">
      <i class="fas fa-search search-icon"></i>
      <input type="text" class="search-input" placeholder="Search menu..." v-model="searchQuery" />
    </div>

    <div class="sidebar-menu">
      <div v-for="item in filteredMenuItems" :key="item.path" class="menu-item-container">
        <router-link
          :to="item.path"
          class="menu-item"
          :class="{ active: isActiveRoute(item.path) }"
        >
          <div class="menu-content">
            <i :class="item.icon" class="menu-icon"></i>
            <span class="menu-text" v-if="!isCollapsed">{{ item.name }}</span>
            <span class="badge" v-if="item.badge && !isCollapsed">{{ item.badge }}</span>
          </div>
        </router-link>

        <div v-if="item.children && !isCollapsed" class="submenu">
          <router-link
            v-for="child in item.children"
            :key="child.path"
            :to="child.path"
            class="submenu-item"
            :class="{ active: isActiveRoute(child.path) }"
          >
            <i :class="child.icon" class="submenu-icon"></i>
            <span class="submenu-text">{{ child.name }}</span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="user-profile" @click="showUserMenu = !showUserMenu">
        <div class="avatar">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="avatar" />
          <div v-else class="avatar-placeholder">{{ getUserInitials() }}</div>
        </div>
        <div class="user-info" v-if="!isCollapsed">
          <div class="user-name">{{ displayName }}</div>
          <div class="user-role" :class="roleClass">{{ roleLabel }}</div>
        </div>
        <i class="fas fa-chevron-down chevron-icon" v-if="!isCollapsed"></i>
      </div>

      <div v-if="showUserMenu && !isCollapsed" class="user-dropdown">
        <router-link to="/profile" class="dropdown-item"
          ><i class="fas fa-user"></i> Profile</router-link
        >
        <router-link to="/settings" class="dropdown-item"
          ><i class="fas fa-cog"></i> Settings</router-link
        >
        <div class="dropdown-divider"></div>
        <button class="dropdown-item text-danger" @click="logout">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEmployeeStore } from '@/stores/employee'
import { toast } from 'vue3-toastify'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const employeeStore = useEmployeeStore()

const searchQuery = ref('')
const isCollapsed = ref(false)
const showUserMenu = ref(false)

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const displayName = computed(() => {
  const f = cap(auth.user?.first_name || '')
  const l = cap(auth.user?.last_name || '')
  return `${f} ${l}`.trim() || 'User'
})
// Role comes from the JWT (normalized to Admin / HR / Employee by the auth store)
const roleLabel = computed(() => auth.role || 'Employee')
const roleClass = computed(() =>
  auth.role === 'Admin' ? 'text-admin' : auth.role === 'HR' ? 'text-hr' : 'text-employee',
)

const filteredMenuItems = computed(() => {
  const menus = auth.isAdmin
    ? [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: 'fas fa-chart-line' },
        { name: 'Manage HR Accounts', path: '/manage-hr', icon: 'fas fa-user-shield' },
      ]
    : [
        { name: 'HR Dashboard', path: '/dashboard', icon: 'fas fa-home' },
        {
          name: 'Employees',
          path: '/employees',
          icon: 'fas fa-users',
          badge: employeeStore.employees?.length || 0,
          children: [
            { name: 'All Employees', path: '/employees', icon: 'fas fa-list' },
            { name: 'Add Employee', path: '/employees/create', icon: 'fas fa-user-plus' },
            { name: 'Departments', path: '/departments', icon: 'fas fa-building' },
            { name: 'Positions', path: '/positions', icon: 'fas fa-briefcase' },
          ],
        },
        { name: 'Attendance', path: '/attendance', icon: 'fas fa-clock' },
        { name: 'Leave', path: '/leave', icon: 'fas fa-calendar-alt' },
        { name: 'Payroll', path: '/payroll', icon: 'fas fa-money-bill' },
        { name: 'Settings', path: '/settings', icon: 'fas fa-cog' },
      ]
  if (!searchQuery.value) return menus
  const query = searchQuery.value.toLowerCase()
  return menus.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      (item.children && item.children.some((c) => c.name.toLowerCase().includes(query))),
  )
})

const isActiveRoute = (path) => route.path === path || route.path.startsWith(path + '/')
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  showUserMenu.value = false
}
const getUserInitials = () => auth.user?.first_name?.charAt(0).toUpperCase() || 'U'
const logout = async () => {
  await auth.logout()
  toast.success('Logged out')
  router.push('/login')
}
</script>

<style scoped>
.text-admin {
  color: #d97706 !important;
  font-weight: bold;
}
.text-hr {
  color: #6823ff !important;
  font-weight: bold;
}
.text-employee {
  color: #0284c7 !important;
  font-weight: bold;
}

.sidebar {
  width: 260px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #ffffff;
  border-right: 1px solid rgba(104, 35, 255, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 101;
}
.sidebar.collapsed {
  width: 72px;
}

.sidebar-header {
  padding: 1.25rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}
.logo-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #6823ff, #13707f);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
}
.logo-text {
  font-size: 1.05rem;
  font-weight: 700;
  white-space: nowrap;
  background: linear-gradient(135deg, #6823ff, #13707f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.collapse-btn {
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  border-radius: 7px;
  color: rgba(0, 0, 0, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.collapse-btn:hover {
  background: rgba(104, 35, 255, 0.15);
  color: #6823ff;
}

.search-container {
  padding: 0.75rem 1rem;
  position: relative;
  flex-shrink: 0;
}
.search-icon {
  position: absolute;
  left: 1.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(0, 0, 0, 0.4);
  font-size: 0.8rem;
}
.search-input {
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.25rem;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 9px;
  font-size: 0.82rem;
  outline: none;
}
.search-input:focus {
  background: #ffffff;
  border-color: rgba(104, 35, 255, 0.5);
}

.sidebar-menu {
  flex: 1;
  padding: 0.5rem 0.75rem;
  overflow-y: auto;
}
.menu-item {
  display: block;
  text-decoration: none;
  color: #333333;
  border-radius: 9px;
  transition: all 0.2s;
}
.menu-item:hover {
  background: rgba(104, 35, 255, 0.06);
  color: #6823ff;
}
.menu-item.active {
  background: rgba(104, 35, 255, 0.1);
  color: #6823ff;
  border: 1px solid rgba(104, 35, 255, 0.2);
  font-weight: 600;
}
.menu-content {
  display: flex;
  align-items: center;
  padding: 0.65rem 0.85rem;
  gap: 0.85rem;
}
.menu-icon {
  width: 16px;
  font-size: 0.9rem;
}
.menu-text {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
}

.submenu {
  margin: 2px 0 4px 2rem;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  padding-left: 0.5rem;
}
.submenu-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.45rem 0.75rem;
  color: #555555;
  text-decoration: none;
  border-radius: 7px;
  font-size: 0.8rem;
}
.submenu-item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #000000;
}
.submenu-item.active {
  color: #6823ff;
  background: rgba(104, 35, 255, 0.08);
  font-weight: 600;
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}
.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.5rem;
  border-radius: 10px;
  cursor: pointer;
}
.user-profile:hover {
  background: rgba(0, 0, 0, 0.04);
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  overflow: hidden;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #6823ff, #13707f);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
}
.user-name {
  font-size: 0.83rem;
  font-weight: 600;
  color: #1a1a1a;
}
.user-role {
  font-size: 0.72rem;
}

.user-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0.75rem;
  right: 0.75rem;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  margin-bottom: 6px;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 1rem;
  color: #444444;
  font-size: 0.83rem;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
}
.dropdown-item:hover {
  background: rgba(104, 35, 255, 0.08);
  color: #6823ff;
}
.dropdown-item.text-danger {
  color: #dc2626;
}
</style>
<!--<style scoped>-->
<!--.text-admin {-->
<!--  color: #d97706 !important;-->
<!--  font-weight: bold;-->
<!--}-->
<!--.text-hr {-->
<!--  color: #6823ff !important;-->
<!--  font-weight: bold;-->
<!--}-->

<!--.sidebar {-->
<!--  width: 260px;-->
<!--  height: 100vh;-->
<!--  position: fixed;-->
<!--  top: 0;-->
<!--  left: 0;-->
<!--  background: #ffffff;-->
<!--  border-right: 1px solid rgba(104, 35, 255, 0.1);-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  z-index: 101;-->
<!--}-->
<!--.sidebar.collapsed {-->
<!--  width: 72px;-->
<!--}-->
<!--.sidebar-header {-->
<!--  padding: 1.25rem 1rem;-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  justify-content: space-between;-->
<!--  border-bottom: 1px solid rgba(0, 0, 0, 0.06);-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.logo-container {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  gap: 10px;-->
<!--  overflow: hidden;-->
<!--}-->
<!--.logo-icon {-->
<!--  width: 36px;-->
<!--  height: 36px;-->
<!--  flex-shrink: 0;-->
<!--  background: linear-gradient(135deg, #6823ff, #13707f);-->
<!--  border-radius: 10px;-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  justify-content: center;-->
<!--  font-size: 1rem;-->
<!--  color: white;-->
<!--}-->
<!--.logo-text {-->
<!--  font-size: 1.05rem;-->
<!--  font-weight: 700;-->
<!--  white-space: nowrap;-->
<!--  background: linear-gradient(135deg, #6823ff, #13707f);-->
<!--  -webkit-background-clip: text;-->
<!--  -webkit-text-fill-color: transparent;-->
<!--  background-clip: text;-->
<!--}-->
<!--.collapse-btn {-->
<!--  width: 28px;-->
<!--  height: 28px;-->
<!--  flex-shrink: 0;-->
<!--  background: rgba(0, 0, 0, 0.04);-->
<!--  border: none;-->
<!--  border-radius: 7px;-->
<!--  color: rgba(0, 0, 0, 0.4);-->
<!--  cursor: pointer;-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  justify-content: center;-->
<!--  font-size: 0.7rem;-->
<!--  transition: all 0.2s;-->
<!--}-->
<!--.collapse-btn:hover {-->
<!--  background: rgba(104, 35, 255, 0.15);-->
<!--  color: #6823ff;-->
<!--}-->

<!--.search-container {-->
<!--  padding: 0.75rem 1rem;-->
<!--  position: relative;-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.search-icon {-->
<!--  position: absolute;-->
<!--  left: 1.85rem;-->
<!--  top: 50%;-->
<!--  transform: translateY(-50%);-->
<!--  color: rgba(0, 0, 0, 0.4);-->
<!--  font-size: 0.8rem;-->
<!--}-->
<!--.search-input {-->
<!--  width: 100%;-->
<!--  padding: 0.6rem 1rem 0.6rem 2.25rem;-->
<!--  background: rgba(0, 0, 0, 0.03);-->
<!--  border: 1px solid rgba(0, 0, 0, 0.08);-->
<!--  border-radius: 9px;-->
<!--  color: #1a1a1a;-->
<!--  font-size: 0.82rem;-->
<!--  outline: none;-->
<!--  transition: all 0.2s;-->
<!--}-->
<!--.search-input:focus {-->
<!--  background: #ffffff;-->
<!--  border-color: rgba(104, 35, 255, 0.5);-->
<!--  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.1);-->
<!--}-->
<!--.search-input::placeholder {-->
<!--  color: rgba(0, 0, 0, 0.4);-->
<!--}-->

<!--.sidebar-menu {-->
<!--  flex: 1;-->
<!--  padding: 0.5rem 0.75rem;-->
<!--  overflow-y: auto;-->
<!--}-->
<!--.menu-item-container {-->
<!--  margin-bottom: 2px;-->
<!--}-->
<!--.menu-item {-->
<!--  display: block;-->
<!--  text-decoration: none;-->
<!--  color: #333333;-->
<!--  border-radius: 9px;-->
<!--  transition: all 0.2s;-->
<!--}-->
<!--.menu-item:hover {-->
<!--  background: rgba(104, 35, 255, 0.06);-->
<!--  color: #6823ff;-->
<!--}-->
<!--.menu-item.active {-->
<!--  background: rgba(104, 35, 255, 0.1);-->
<!--  color: #6823ff;-->
<!--  border: 1px solid rgba(104, 35, 255, 0.2);-->
<!--  font-weight: 600;-->
<!--}-->
<!--.menu-content {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  padding: 0.65rem 0.85rem;-->
<!--  gap: 0.85rem;-->
<!--}-->
<!--.menu-icon {-->
<!--  width: 16px;-->
<!--  font-size: 0.9rem;-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.menu-text {-->
<!--  flex: 1;-->
<!--  font-size: 0.85rem;-->
<!--  white-space: nowrap;-->
<!--  font-weight: 500;-->
<!--}-->
<!--.badge {-->
<!--  background: rgba(104, 35, 255, 0.15);-->
<!--  color: #6823ff;-->
<!--  padding: 2px 8px;-->
<!--  border-radius: 20px;-->
<!--  font-size: 0.7rem;-->
<!--  font-weight: 600;-->
<!--}-->

<!--.submenu {-->
<!--  margin: 2px 0 4px 2rem;-->
<!--  border-left: 1px solid rgba(0, 0, 0, 0.06);-->
<!--  padding-left: 0.5rem;-->
<!--}-->
<!--.submenu-item {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  gap: 0.65rem;-->
<!--  padding: 0.45rem 0.75rem;-->
<!--  color: #555555;-->
<!--  text-decoration: none;-->
<!--  border-radius: 7px;-->
<!--  font-size: 0.8rem;-->
<!--  transition: all 0.2s;-->
<!--}-->
<!--.submenu-item:hover {-->
<!--  background: rgba(0, 0, 0, 0.04);-->
<!--  color: #000000;-->
<!--}-->
<!--.submenu-item.active {-->
<!--  color: #6823ff;-->
<!--  background: rgba(104, 35, 255, 0.08);-->
<!--  font-weight: 600;-->
<!--}-->
<!--.submenu-icon {-->
<!--  font-size: 0.72rem;-->
<!--  width: 14px;-->
<!--}-->

<!--.sidebar-footer {-->
<!--  padding: 0.75rem;-->
<!--  border-top: 1px solid rgba(0, 0, 0, 0.06);-->
<!--  position: relative;-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.user-profile {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  gap: 0.75rem;-->
<!--  padding: 0.6rem 0.5rem;-->
<!--  border-radius: 10px;-->
<!--  cursor: pointer;-->
<!--  transition: all 0.2s;-->
<!--}-->
<!--.user-profile:hover {-->
<!--  background: rgba(0, 0, 0, 0.04);-->
<!--}-->
<!--.avatar {-->
<!--  width: 36px;-->
<!--  height: 36px;-->
<!--  border-radius: 9px;-->
<!--  overflow: hidden;-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.avatar img {-->
<!--  width: 100%;-->
<!--  height: 100%;-->
<!--  object-fit: cover;-->
<!--}-->
<!--.avatar-placeholder {-->
<!--  width: 100%;-->
<!--  height: 100%;-->
<!--  background: linear-gradient(135deg, #6823ff, #13707f);-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  justify-content: center;-->
<!--  font-weight: 700;-->
<!--  font-size: 0.85rem;-->
<!--  color: white;-->
<!--}-->
<!--.user-info {-->
<!--  flex: 1;-->
<!--  overflow: hidden;-->
<!--}-->
<!--.user-name {-->
<!--  font-size: 0.83rem;-->
<!--  font-weight: 600;-->
<!--  white-space: nowrap;-->
<!--  color: #1a1a1a;-->
<!--}-->
<!--.user-role {-->
<!--  font-size: 0.72rem;-->
<!--  white-space: nowrap;-->
<!--  margin-top: 1px;-->
<!--}-->
<!--.chevron-icon {-->
<!--  font-size: 0.65rem;-->
<!--  color: rgba(0, 0, 0, 0.4);-->
<!--}-->

<!--.user-dropdown {-->
<!--  position: absolute;-->
<!--  bottom: 100%;-->
<!--  left: 0.75rem;-->
<!--  right: 0.75rem;-->
<!--  background: #ffffff;-->
<!--  border: 1px solid rgba(0, 0, 0, 0.08);-->
<!--  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);-->
<!--  border-radius: 12px;-->
<!--  margin-bottom: 6px;-->
<!--  overflow: hidden;-->
<!--}-->
<!--.dropdown-item {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  gap: 0.65rem;-->
<!--  padding: 0.65rem 1rem;-->
<!--  color: #444444;-->
<!--  text-decoration: none;-->
<!--  font-size: 0.83rem;-->
<!--  transition: all 0.2s;-->
<!--  width: 100%;-->
<!--  border: none;-->
<!--  background: none;-->
<!--  cursor: pointer;-->
<!--}-->
<!--.dropdown-item:hover {-->
<!--  background: rgba(104, 35, 255, 0.08);-->
<!--  color: #6823ff;-->
<!--}-->
<!--.dropdown-item.text-danger {-->
<!--  color: #dc2626;-->
<!--}-->
<!--.dropdown-item.text-danger:hover {-->
<!--  background: rgba(220, 38, 38, 0.08);-->
<!--  color: #dc2626;-->
<!--}-->
<!--.dropdown-divider {-->
<!--  height: 1px;-->
<!--  background: rgba(0, 0, 0, 0.06);-->
<!--}-->

<!--.sidebar-menu::-webkit-scrollbar {-->
<!--  width: 3px;-->
<!--}-->
<!--.sidebar-menu::-webkit-scrollbar-track {-->
<!--  background: transparent;-->
<!--}-->
<!--.sidebar-menu::-webkit-scrollbar-thumb {-->
<!--  background: rgba(104, 35, 255, 0.2);-->
<!--  border-radius: 3px;-->
<!--}-->

<!--@media (max-width: 768px) {-->
<!--  .sidebar {-->
<!--    transform: translateX(-100%);-->
<!--    display: none;-->
<!--  }-->
<!--  .sidebar.collapsed {-->
<!--    transform: translateX(0);-->
<!--    width: 260px;-->
<!--  }-->
<!--}-->
<!--</style>-->
