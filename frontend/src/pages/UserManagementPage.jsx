import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { userService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import {
  hasPermission,
  ROLES,
  getRoleDisplayName,
  getRoleBadgeColor,
} from "../utils/permissions";
import { useConfirm } from "../components/ui/confirmContext";
import Pagination from "../components/asset/Pagination";
import SortableTableHeader from "../components/shared/SortableTableHeader";
import useColumnResize from "../hooks/useColumnResize";
import useTableSort from "../hooks/useTableSort";
import { RENTAL_FEATURE_ENABLED } from "../config/featureFlags";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelSimpleIcon,
  XCircleIcon,
  CircleNotchIcon,
  TrayIcon,
  TrashIcon,
  PencilSimpleIcon,
  ArrowLeftIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

const USER_COLUMN_WIDTHS = {
  no: 72,
  nama_lengkap: 220,
  username: 160,
  email: 220,
  role: 170,
  actions: 120,
};

const getUserSortValue = (user, key) =>
  key === "role" ? getRoleDisplayName(user.role) : user?.[key];

export default function UserManagementPage() {
  // Auth & Permissions
  const currentUser = useAuthStore((state) => state.user);
  const userRole = currentUser?.role || "";
  const canCreate = hasPermission(userRole, "user", "create");
  const canUpdate = hasPermission(userRole, "user", "update");
  const canDelete = hasPermission(userRole, "user", "delete");
  const confirm = useConfirm();
  const formRef = useRef(null);
  const roleFilterRef = useRef(null);

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    columnWidths,
    onResizeStart,
    resizeColumn,
    resetColumnWidth,
  } = useColumnResize(USER_COLUMN_WIDTHS);
  const {
    sortedRows: sortedUsers,
    sortKey,
    sortDirection,
    requestSort,
  } = useTableSort(users, {
    initialKey: "nama_lengkap",
    getValue: getUserSortValue,
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminCount: 0,
    roleOptions: [],
  });

  // Form state
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    username: "",
    email: "",
    password: "",
    role: ROLES.VIEWER,
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole && { role: filterRole }),
      };
      const response = await userService.getAll(params);
      setUsers(response.data.data || []);
      setPagination(response.data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: response.data.data?.length || 0,
        itemsPerPage: limit,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data user");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRole, page, limit]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await userService.getStats();
      const data = response.data.data || {};
      const byRole = data.byRole || {};
      setStats({
        totalUsers: data.total || 0,
        activeUsers: data.active || data.total || 0,
        adminCount: byRole[ROLES.ADMIN] || 0,
        roleOptions: Object.values(ROLES).filter((role) => byRole[role] > 0),
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  }, []);

  const roleFilterOptions = useMemo(() => {
    const rolesFromUsers = users.map((user) => user.role).filter(Boolean);
    const mergedRoles = [...new Set([...stats.roleOptions, ...rolesFromUsers])];
    return mergedRoles.length ? mergedRoles : Object.values(ROLES);
  }, [stats.roleOptions, users]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        roleFilterRef.current &&
        !roleFilterRef.current.contains(event.target)
      ) {
        setShowRoleFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      nama_lengkap: "",
      username: "",
      email: "",
      password: "",
      role: ROLES.VIEWER,
    });
    setIsModalOpen(true);
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      100,
    );
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      nama_lengkap: user.nama_lengkap || user.nama || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      role: user.role || ROLES.VIEWER,
    });
    setIsModalOpen(true);
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      100,
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userService.update(editingUser.id_user, updateData);
        toast.success("User berhasil diperbarui");
      } else {
        // Create
        await userService.create(formData);
        toast.success("User berhasil ditambahkan");
      }
      handleCloseModal();
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error saving user:", error);
      const errorMsg = error.response?.data?.error || "Gagal menyimpan user";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser?.id_user) {
      toast.error("Tidak dapat menghapus akun sendiri!");
      return;
    }

    const confirmed = await confirm({
      title: "Hapus User",
      message:
        "Apakah Anda yakin ingin menghapus user ini? Data yang dihapus tidak dapat dikembalikan.",
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
    });
    if (!confirmed) return;

    try {
      await userService.delete(userId);
      toast.success("User berhasil dihapus");
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMsg = error.response?.data?.error || "Gagal menghapus user";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__identity">
          <span className="admin-page-header__icon bg-linear-to-br from-blue-500 to-indigo-600 text-white">
            <UsersThreeIcon size={21} weight="duotone" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-header__title">Manajemen User</h1>
            <p className="admin-page-header__description">
              {stats.totalUsers} akun pengguna terdaftar.
            </p>
          </div>
        </div>
        {canCreate && (
          <div className="admin-page-header__actions">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-xs font-bold text-surface transition hover:bg-accent-hover"
            >
              <PlusIcon size={15} weight="bold" />
              Tambah User
            </button>
          </div>
        )}
      </div>

      {/* Inline Form (Add/Edit) */}
      {isModalOpen && (
        <div
          ref={formRef}
          className="bg-surface rounded-xl border border-border shadow-lg overflow-hidden"
        >
          {/* Form Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-secondary/30">
            <button
              onClick={handleCloseModal}
              className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface rounded-lg transition-all"
              title="Kembali"
            >
              <ArrowLeftIcon size={18} weight="bold" />
            </button>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </h3>
              {editingUser && (
                <p className="text-xs text-text-tertiary mt-0.5">
                  Mengedit data{" "}
                  <span className="font-medium text-text-secondary">
                    {editingUser.nama_lengkap}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-border bg-surface text-text-primary rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-border bg-surface text-text-primary rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="Masukkan username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full border border-border bg-surface text-text-primary rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="Masukkan email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Password{" "}
                  {editingUser ? (
                    <span className="text-text-tertiary font-normal">
                      (kosongkan jika tidak diubah)
                    </span>
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required={!editingUser}
                  className="w-full border border-border bg-surface text-text-primary rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder={
                    editingUser ? "Masukkan password baru" : "Masukkan password"
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-border bg-surface text-text-primary rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                >
                  <option value={ROLES.ADMIN}>Admin</option>
                  <option value={ROLES.PENGELOLA_ASET}>Pengelola Aset</option>
                  <option value={ROLES.VERIFIKATOR_ASET}>Verifikator Aset</option>
                  <option value={ROLES.VIEWER}>Viewer</option>
                  {RENTAL_FEATURE_ENABLED && (
                    <option value={ROLES.MASYARAKAT}>Masyarakat</option>
                  )}
                </select>
              </div>
              <div className="bg-surface-secondary rounded-lg p-3 text-sm">
                <p className="font-medium text-text-primary mb-1">
                  Hak Akses Role:
                </p>
                <ul className="text-text-tertiary text-xs space-y-0.5">
                  {formData.role === ROLES.ADMIN && (
                    <>
                      <li>• Admin Sistem Bhumi Satya</li>
                      <li>
                        • Semua modul, user, audit, backup, dan pengaturan
                      </li>
                    </>
                  )}
                  {formData.role === ROLES.PENGELOLA_ASET && (
                    <>
                      <li>• CRUD master data dan administratif</li>
                      <li>• Kelola data aset sesuai kewenangan</li>
                    </>
                  )}
                  {formData.role === ROLES.VERIFIKATOR_ASET && (
                    <>
                      <li>• Update legal, fisik, dan spasial</li>
                      <li>• Review data rekonsiliasi aset</li>
                    </>
                  )}
                  {formData.role === ROLES.VIEWER && (
                    <>
                      <li>• Baca dashboard, aset, dan peta</li>
                      <li>• Tidak memiliki akses mutasi</li>
                    </>
                  )}
                  {RENTAL_FEATURE_ENABLED &&
                    formData.role === ROLES.MASYARAKAT && (
                    <>
                      <li>• Akses pengajuan dan pemantauan sewa publik</li>
                      <li>• Tidak memiliki akses internal aset</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2.5 border border-border rounded-lg text-text-secondary hover:bg-surface-secondary transition-all text-sm font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-accent text-surface rounded-lg hover:bg-accent-hover transition-all text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : editingUser
                    ? "Update"
                    : "Tambah"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row"
        >
          <label className="relative flex-1">
            <span className="sr-only">Cari pengguna</span>
            <MagnifyingGlassIcon
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              placeholder="Cari nama, username, atau email…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-3 text-[11px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-[10px] font-bold text-white transition hover:bg-accent-hover"
          >
            <MagnifyingGlassIcon size={14} weight="bold" />
            Cari
          </button>
        </form>
        {loading ? (
          <div className="p-6">
            <div className="flex items-center justify-center gap-3 py-6">
              <CircleNotchIcon
                size={24}
                weight="bold"
                className="animate-spin text-accent"
              />
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">
                  Memuat data user
                </p>
                <p className="text-xs text-text-muted">
                  Mengambil daftar pengguna sistem...
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-secondary/60 p-3 sm:grid-cols-3 xl:grid-cols-6"
                >
                  <div className="h-4 rounded bg-border/70" />
                  <div className="col-span-2 h-4 rounded bg-border/70" />
                  <div className="h-4 rounded bg-border/70" />
                  <div className="h-4 rounded bg-border/70" />
                  <div className="h-4 rounded bg-border/70" />
                </div>
              ))}
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <TrayIcon size={48} className="mx-auto mb-4 text-text-muted" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Tidak ada data user
            </h3>
            <p className="text-text-tertiary text-sm">
              Belum ada user yang terdaftar atau tidak ada hasil pencarian
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-data-table min-w-[960px] table-fixed">
              <thead className="bg-surface-secondary border-b border-border">
                <tr>
                  <SortableTableHeader
                    columnKey="no"
                    sortable={false}
                    width={columnWidths.no}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    No
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="nama_lengkap"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={requestSort}
                    width={columnWidths.nama_lengkap}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    Nama
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="username"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={requestSort}
                    width={columnWidths.username}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    Username
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="email"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={requestSort}
                    width={columnWidths.email}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    Email
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="role"
                    sortable={false}
                    width={columnWidths.role}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    <div className="relative inline-flex items-center gap-2" ref={roleFilterRef}>
                      <span>Role</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRoleFilter((value) => !value);
                        }}
                        aria-label="Filter role"
                        title={
                          filterRole
                            ? `Filter: ${getRoleDisplayName(filterRole)}`
                            : "Filter role"
                        }
                        className={`relative inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                          filterRole
                            ? "border-accent bg-accent text-surface"
                            : "border-border bg-surface text-text-muted hover:text-text-primary hover:border-accent/40"
                        }`}
                      >
                        <FunnelSimpleIcon size={14} weight="bold" />
                        {filterRole && (
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-surface-secondary" />
                        )}
                      </button>

                      {showRoleFilter && (
                        <div className="absolute left-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 text-text-primary normal-case tracking-normal">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterRole("");
                              setPage(1);
                              setShowRoleFilter(false);
                            }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold transition-colors ${
                              !filterRole
                                ? "bg-surface-secondary text-text-primary"
                                : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                            }`}
                          >
                            Semua Role
                            {!filterRole && (
                              <XCircleIcon size={14} weight="fill" />
                            )}
                          </button>
                          <div className="my-1 border-t border-border" />
                          {roleFilterOptions.map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => {
                                setFilterRole(role);
                                setPage(1);
                                setShowRoleFilter(false);
                              }}
                              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold transition-colors ${
                                filterRole === role
                                  ? "bg-accent text-surface"
                                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                              }`}
                            >
                              {getRoleDisplayName(role)}
                              {filterRole === role && (
                                <FunnelSimpleIcon size={14} weight="fill" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="actions"
                    sortable={false}
                    className="text-center"
                    width={columnWidths.actions}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    Aksi
                  </SortableTableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedUsers.map((user, idx) => (
                  <tr
                    key={user.id_user}
                    className="hover:bg-surface-secondary transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent font-semibold">
                          {user.nama_lengkap?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {user.nama_lengkap}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-tertiary">
                      {user.email || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.role,
                        )}`}
                      >
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 text-text-tertiary hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all"
                            title="Edit"
                          >
                            <PencilSimpleIcon size={16} weight="bold" />
                          </button>
                        )}
                        {canDelete && user.id_user !== currentUser?.id_user && (
                          <button
                            onClick={() => handleDelete(user.id_user)}
                            className="p-2 text-text-tertiary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <TrashIcon size={16} />
                          </button>
                        )}
                        {user.id_user === currentUser?.id_user && (
                          <span className="text-xs text-text-tertiary italic py-2">
                            (Anda)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalItems > 0 && (
          <Pagination
            pagination={pagination}
            onChange={setPage}
            pageSize={limit}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={(value) => {
              setLimit(value);
              setPage(1);
            }}
            embedded
            itemLabel="pengguna"
          />
        )}
      </div>
    </div>
  );
}
