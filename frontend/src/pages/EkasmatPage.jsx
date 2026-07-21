import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/authStore";
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ClipboardTextIcon,
  GaugeIcon,
  PaperPlaneTiltIcon,
  PencilIcon,
  TableIcon,
  TrashIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  ekasmatQuestions,
  ekasmatResponses,
  getEkasmatSummary,
  scoreLabels,
} from "../data/ekasmatData";
import { ekasmatService } from "../services/api";

const chartColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9"];

const formatNumber = (value, digits = 2) =>
  Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getResponseAverage = (scores = []) => {
  if (!Array.isArray(scores) || scores.length === 0) return 0;
  return scores.reduce((total, score) => total + Number(score || 0), 0) / scores.length;
};

const getIndexCategory = (index) => {
  if (index >= 90) return { label: "Sangat Baik", tone: "text-emerald-600" };
  if (index >= 80) return { label: "Baik", tone: "text-sky-600" };
  if (index >= 65) return { label: "Cukup", tone: "text-amber-600" };
  return { label: "Perlu Perbaikan", tone: "text-rose-600" };
};

function StatCard({ icon, label, value, helper, colorClass }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-black text-text-primary mt-2">{value}</p>
          {helper && <p className="text-xs text-text-muted mt-1">{helper}</p>}
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const tone =
    score >= 4.75
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : score >= 4.25
        ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
        : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";

  return (
    <span
      className={`inline-flex items-center justify-center min-w-14 px-2.5 py-1 rounded-lg text-xs font-bold ${tone}`}
    >
      {formatNumber(score)}
    </span>
  );
}

export default function EkasmatPage() {
  const formRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdminView = location.pathname.startsWith("/admin/ekasmat");
  const isAdmin = user?.role === "admin";
  const showActionButtons = isAdminView && isAdmin;
  const [responses, setResponses] = useState(ekasmatResponses);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("Semua");
  const [sortMode, setSortMode] = useState("lowest");
  const [selectedQuestionId, setSelectedQuestionId] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({
    name: "",
    source: "BPKA",
    scores: Array(ekasmatQuestions.length).fill(null),
  });

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    source: "BPKA",
    scores: Array(ekasmatQuestions.length).fill(null),
  });
  const [updating, setUpdating] = useState(false);

  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    ekasmatService
      .getAll()
      .then((response) => {
        if (!mounted) return;
        const data = response.data.data || [];
        if (data.length > 0) setResponses(data);
      })
      .catch(() => {
        if (mounted) toast.error("Data database EKASMAT belum dapat dimuat");
      })
      .finally(() => {
        if (mounted) setLoadingResponses(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const sourceOptions = useMemo(
    () => ["Semua", ...new Set(responses.map((response) => response.source))],
    [responses],
  );

  const filteredResponses = useMemo(() => {
    if (sourceFilter === "Semua") return responses;
    return responses.filter((response) => response.source === sourceFilter);
  }, [responses, sourceFilter]);

  const summary = useMemo(
    () => getEkasmatSummary(filteredResponses),
    [filteredResponses],
  );

  const category = getIndexCategory(summary.satisfactionIndex);

  const sourceStats = useMemo(
    () =>
      sourceOptions
        .filter((source) => source !== "Semua")
        .map((source) => {
          const sourceResponses = responses.filter(
            (response) => response.source === source,
          );
          const sourceSummary = getEkasmatSummary(sourceResponses);
          return {
            source,
            count: sourceResponses.length,
            average: sourceSummary.averageScore,
            index: sourceSummary.satisfactionIndex,
          };
        }),
    [responses, sourceOptions],
  );

  const sortedQuestions = useMemo(() => {
    const questions = [...summary.questionStats];
    if (sortMode === "highest") {
      return questions.sort((a, b) => b.average - a.average);
    }
    return questions.sort((a, b) => a.average - b.average);
  }, [summary.questionStats, sortMode]);

  const selectedQuestion =
    summary.questionStats.find((item) => item.id === selectedQuestionId) ||
    summary.questionStats[0];

  const responseRows = useMemo(
    () =>
      filteredResponses.map((response, index) => {
        const average = getResponseAverage(response.scores);
        const indexValue = average * 20;
        return {
          ...response,
          number: index + 1,
          average,
          indexValue,
          category: getIndexCategory(indexValue).label,
        };
      }),
    [filteredResponses],
  );

  const totalPages = Math.max(1, Math.ceil(responseRows.length / pageSize));
  const pageStart = responseRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(responseRows.length, currentPage * pageSize);

  const paginatedResponseRows = useMemo(
    () =>
      responseRows.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [currentPage, pageSize, responseRows],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [sourceFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleScoreChange = (index, value) => {
    setForm((current) => {
      const scores = [...current.scores];
      scores[index] = Number(value);
      return { ...current, scores };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Nama responden wajib diisi");
      return;
    }

    if (form.scores.some((score) => !score)) {
      toast.error("Semua butir kuisioner wajib dipilih");
      return;
    }

    setSubmitting(true);
    ekasmatService
      .submit({
        name: form.name.trim(),
        source: form.source,
        scores: form.scores,
      })
      .then((response) => {
        setResponses((current) => [...current, response.data.data]);
        setForm({
          name: "",
          source: "BPKA",
          scores: Array(ekasmatQuestions.length).fill(null),
        });
        setSourceFilter("Semua");
        toast.success("Jawaban kuisioner berhasil disimpan");
      })
      .catch((error) => {
        const message =
          error.response?.data?.error ||
          "Gagal menyimpan jawaban kuisioner ke database";
        toast.error(message);
      })
      .finally(() => setSubmitting(false));
  };

  const handleEdit = (response) => {
    setEditingData(response);
    setEditForm({
      name: response.name,
      source: response.source,
      scores: [...response.scores],
    });
    setEditModalOpen(true);
  };

  const handleEditScoreChange = (index, value) => {
    setEditForm((current) => {
      const scores = [...current.scores];
      scores[index] = Number(value);
      return { ...current, scores };
    });
  };

  const handleUpdateSubmit = (event) => {
    event.preventDefault();

    if (!editForm.name.trim()) {
      toast.error("Nama responden wajib diisi");
      return;
    }

    if (editForm.scores.some((score) => !score)) {
      toast.error("Semua butir kuisioner wajib dipilih");
      return;
    }

    setUpdating(true);
    ekasmatService
      .update(editingData.id, {
        name: editForm.name.trim(),
        source: editForm.source,
        scores: editForm.scores,
      })
      .then((response) => {
        setResponses((current) =>
          current.map((item) =>
            item.id === editingData.id ? response.data.data : item,
          ),
        );
        setEditModalOpen(false);
        setEditingData(null);
        toast.success("Data berhasil diperbarui");
      })
      .catch((error) => {
        const message =
          error.response?.data?.error || "Gagal memperbarui data";
        toast.error(message);
      })
      .finally(() => setUpdating(false));
  };

  const handleDeleteClick = (response) => {
    setDeletingId(response.id);
    setDeletingName(response.name);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await ekasmatService.delete(deletingId);
      setResponses((current) => current.filter((r) => r.id !== deletingId));
      toast.success("Data berhasil dihapus");
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      setDeletingName("");
    } catch (error) {
      const message =
        error.response?.data?.error || "Gagal menghapus data";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const maxDistribution = Math.max(
    1,
    ...summary.scoreDistribution.map((entry) => entry.count),
  );

  return (
    <div className="h-screen overflow-y-auto bg-surface-secondary">
      <div
        className={
          isAdminView
            ? "w-full p-4 lg:p-6 flex flex-col gap-5"
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5"
        }
      >
        {!isAdminView && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="self-start flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-surface hover:bg-surface-secondary border border-border rounded-lg transition-colors"
          >
            <ArrowLeftIcon size={18} weight="bold" />
            Kembali
          </button>
        )}
        <section className="order-1 bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 lg:p-6 grid grid-cols-1 xl:grid-cols-[1fr_21rem] gap-6">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <GaugeIcon
                    size={26}
                    weight="fill"
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                    Evaluasi Kinerja Aplikasi
                  </p>
                  <h1 className="text-2xl lg:text-3xl font-black text-text-primary mt-1">
                    EKASMAT
                  </h1>
                  <p className="text-sm text-text-secondary mt-2 max-w-2xl leading-relaxed">
                    {isAdminView
                      ? "Panel admin untuk memantau data responden dan hasil Evaluasi Kinerja Aplikasi Sistem Manajemen Aset Tanah."
                      : "Ringkasan Evaluasi Kinerja Aplikasi Sistem Manajemen Aset Tanah berdasarkan kuisioner pengguna Bhumi Satya."}
                  </p>
                  {loadingResponses && (
                    <p className="text-xs text-text-muted mt-2">
                      Memuat data kuisioner dari database...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {sourceOptions.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setSourceFilter(source)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      sourceFilter === source
                        ? "bg-accent text-surface border-accent"
                        : "bg-surface-secondary text-text-secondary border-border hover:text-text-primary"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <StatCard
                  icon={<UsersThreeIcon size={22} weight="fill" />}
                  label="Total Jawaban"
                  value={summary.totalResponses}
                  helper={
                    sourceFilter === "Semua"
                      ? "Seluruh sumber"
                      : `Sumber ${sourceFilter}`
                  }
                  colorClass="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
                />
                <StatCard
                  icon={<ClipboardTextIcon size={22} weight="fill" />}
                  label="Butir Evaluasi"
                  value={summary.totalQuestions}
                  helper="Skala 1 sampai 5"
                  colorClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                />
                <StatCard
                  icon={<GaugeIcon size={22} weight="fill" />}
                  label="Rata-rata Skor"
                  value={formatNumber(summary.averageScore)}
                  helper={`${summary.totalScore} dari ${summary.maximumScore}`}
                  colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                />
                <StatCard
                  icon={<ChartBarIcon size={22} weight="fill" />}
                  label="Kategori"
                  value={category.label}
                  helper={`${formatNumber(summary.satisfactionIndex, 1)}% indeks`}
                  colorClass="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
                />
              </div>
            </div>

            <div className="bg-surface-secondary border border-border rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <div
                className="w-40 h-40 rounded-full p-4"
                style={{
                  background: `conic-gradient(#059669 ${summary.satisfactionIndex * 3.6}deg, var(--color-border) 0deg)`,
                }}
              >
                <div className="w-full h-full rounded-full bg-surface flex flex-col items-center justify-center border border-border">
                  <span className="text-3xl font-black text-text-primary">
                    {formatNumber(summary.satisfactionIndex, 1)}%
                  </span>
                  <span className={`text-xs font-bold mt-1 ${category.tone}`}>
                    {category.label}
                  </span>
                </div>
              </div>
              {isAdminView ? (
                <div className="mt-5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Mode Admin
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    Hanya melihat dan menganalisis data kuisioner
                  </p>
                </div>
              ) : (
                <button
                  onClick={scrollToForm}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg transition-colors"
                >
                  <ClipboardTextIcon size={18} weight="fill" />
                  Isi Kuisioner
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="order-3 grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-4 bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-text-primary">
                  Distribusi Skor
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Komposisi seluruh pilihan nilai
                </p>
              </div>
              <TableIcon size={22} weight="bold" className="text-text-muted" />
            </div>
            <div className="space-y-4">
              {summary.scoreDistribution.map((item, index) => {
                const width = `${Math.max(7, (item.count / maxDistribution) * 100)}%`;
                const percentage =
                  summary.totalResponses > 0
                    ? (item.count /
                        (summary.totalResponses * summary.totalQuestions)) *
                      100
                    : 0;

                return (
                  <div key={item.score} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          Skor {item.score}
                        </p>
                        <p className="text-xs text-text-muted">
                          {scoreLabels[item.score]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-text-primary">
                          {item.count}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {formatNumber(percentage, 1)}%
                        </p>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-surface-secondary overflow-hidden border border-border">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width,
                          backgroundColor: chartColors[index],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {sourceStats.length > 0 && (
              <div className="mt-6 pt-5 border-t border-border space-y-3">
                <h3 className="text-sm font-bold text-text-primary">
                  Ringkasan Sumber
                </h3>
                {sourceStats.map((item) => (
                  <button
                    key={item.source}
                    type="button"
                    onClick={() => setSourceFilter(item.source)}
                    className="w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2.5 text-left hover:border-emerald-300 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {item.source}
                      </p>
                      <p className="text-xs text-text-muted">
                        {item.count} jawaban
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-text-primary">
                        {formatNumber(item.average)}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {formatNumber(item.index, 1)}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-5 bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-bold text-text-primary">Analisis Aspek</h2>
                <p className="text-xs text-text-muted mt-1">
                  Peringkat rata-rata tiap butir evaluasi
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-border bg-surface-secondary p-1">
                {[
                  { id: "lowest", label: "Prioritas" },
                  { id: "highest", label: "Terkuat" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSortMode(item.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                      sortMode === item.id
                        ? "bg-accent text-surface"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {sortedQuestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedQuestionId(item.id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                    selectedQuestion?.id === item.id
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-border bg-surface-secondary hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent text-surface flex items-center justify-center text-xs font-bold shrink-0">
                      P{item.id}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-text-primary">
                          {item.question}
                        </p>
                        <ScoreBadge score={item.average} />
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-surface border border-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${item.positivePercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-muted mt-1.5">
                        {formatNumber(item.positivePercentage, 0)}% setuju atau
                        sangat setuju
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="xl:col-span-3 bg-surface border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-bold text-text-primary">Detail Aspek</h2>
            {selectedQuestion && (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-surface-secondary border border-border p-4">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    P{selectedQuestion.id}
                  </p>
                  <p className="text-sm font-semibold text-text-primary mt-2 leading-relaxed">
                    {selectedQuestion.question}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-surface-secondary p-4">
                    <p className="text-xs text-text-muted">Rata-rata</p>
                    <p className="text-2xl font-black text-text-primary mt-1">
                      {formatNumber(selectedQuestion.average)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-secondary p-4">
                    <p className="text-xs text-text-muted">Positif</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                      {formatNumber(selectedQuestion.positivePercentage, 0)}%
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-secondary p-4">
                  <p className="text-xs text-text-muted mb-2">Pembacaan</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Aspek ini memperoleh skor{" "}
                    <span className="font-bold text-text-primary">
                      {formatNumber(selectedQuestion.average)}
                    </span>{" "}
                    dari 5. Nilai di bawah rata-rata keseluruhan dapat menjadi
                    prioritas penyempurnaan berikutnya.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </section>

        {isAdminView && (
          <section className="order-2 bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-text-primary">
                  Data Penginput EKASMAT
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Daftar responden yang telah mengisi evaluasi aplikasi.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                  Baris
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="h-9 rounded-lg border border-border bg-surface-secondary px-3 text-xs font-bold text-text-primary outline-none focus:border-emerald-500"
                  >
                    {[10, 25, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="inline-flex items-center gap-2 rounded-lg bg-surface-secondary border border-border px-3 py-2 text-xs font-bold text-text-secondary">
                  <UsersThreeIcon size={16} weight="fill" />
                  {responseRows.length} data
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-secondary text-xs uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">No</th>
                    <th className="px-4 py-3 text-left font-bold">Nama</th>
                    <th className="px-4 py-3 text-left font-bold">Sumber</th>
                    <th className="px-4 py-3 text-left font-bold">
                      Tanggal Input
                    </th>
                    <th className="px-4 py-3 text-left font-bold">
                      Rata-rata
                    </th>
                    <th className="px-4 py-3 text-left font-bold">Indeks</th>
                    <th className="px-4 py-3 text-left font-bold">
                      Kategori
                    </th>
                    {ekasmatQuestions.map((_, index) => (
                      <th
                        key={`score-header-${index}`}
                        className="px-3 py-3 text-center font-bold"
                      >
                        P{index + 1}
                      </th>
                    ))}
                    {showActionButtons && (
                      <th className="px-4 py-3 text-center font-bold w-28">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedResponseRows.length > 0 ? (
                    paginatedResponseRows.map((response) => (
                      <tr
                        key={response.id}
                        className="hover:bg-surface-secondary/70 transition-colors"
                      >
                        <td className="px-4 py-3 text-text-muted">
                          {response.number}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-text-primary whitespace-nowrap">
                            {response.name || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            {response.source || "Umum"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                          {formatDateTime(response.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBadge score={response.average} />
                        </td>
                        <td className="px-4 py-3 font-bold text-text-primary whitespace-nowrap">
                          {formatNumber(response.indexValue, 1)}%
                        </td>
                        <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                          {response.category}
                        </td>
                        {ekasmatQuestions.map((_, index) => (
                          <td
                            key={`${response.id}-score-${index}`}
                            className="px-3 py-3 text-center font-semibold text-text-primary"
                          >
                            {response.scores?.[index] ?? "-"}
                          </td>
                        ))}
                        {showActionButtons && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(response)}
                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25 transition-colors"
                                title="Edit"
                              >
                                <PencilIcon size={16} weight="fill" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(response)}
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 transition-colors"
                                title="Hapus"
                              >
                                <TrashIcon size={16} weight="fill" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          (showActionButtons ? 8 : 7) + ekasmatQuestions.length
                        }
                        className="px-4 py-8 text-center text-sm text-text-muted"
                      >
                        Belum ada data kuisioner pada filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border bg-surface-secondary px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs font-medium text-text-muted">
                Menampilkan {pageStart}-{pageEnd} dari {responseRows.length} data
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage <= 1}
                  className="h-9 px-3 rounded-lg border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <div className="h-9 min-w-24 px-3 rounded-lg border border-border bg-surface flex items-center justify-center text-xs font-bold text-text-primary">
                  {currentPage} / {totalPages}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="h-9 px-3 rounded-lg border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </section>
        )}

        {!isAdminView && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="order-2 bg-surface border border-border rounded-xl shadow-sm overflow-hidden scroll-mt-6"
          >
            <div className="p-5 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-text-primary">Form Kuisioner</h2>
                <p className="text-xs text-text-muted mt-1">
                  Setiap nilai akan tersimpan ke database EKASMAT.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nama"
                  className="h-11 px-4 rounded-lg border border-border bg-surface-secondary text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <select
                  value={form.source}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      source: event.target.value,
                    }))
                  }
                  className="h-11 px-4 rounded-lg border border-border bg-surface-secondary text-sm text-text-primary focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="BPKA">BPKA</option>
                  <option value="BPN">BPN</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>
            </div>

            <div className="px-5 py-3 bg-emerald-50/80 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 leading-relaxed">
                Skala nilai: 1 sangat tidak setuju, 2 tidak setuju, 3 netral,
                4 setuju, 5 sangat setuju.
              </p>
            </div>

            <div className="divide-y divide-border">
              {ekasmatQuestions.map((question, index) => (
                <div
                  key={question}
                  className="p-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:items-center"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-border text-text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                      P{index + 1}
                    </div>
                    <p className="text-sm font-medium text-text-primary leading-relaxed">
                      {question}
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-2 lg:w-80">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleScoreChange(index, score)}
                        className={`h-11 rounded-lg border text-sm font-bold flex items-center justify-center transition-colors ${
                          form.scores[index] === score
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-surface-secondary border-border text-text-secondary hover:text-text-primary hover:border-emerald-300"
                        }`}
                        title={scoreLabels[score]}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-surface-secondary border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-text-muted">
                Pastikan semua butir telah dipilih sebelum mengirim kuisioner.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-accent hover:bg-accent-hover disabled:opacity-60 text-surface text-sm font-bold rounded-xl transition-colors"
              >
                <PaperPlaneTiltIcon size={18} weight="fill" />
                {submitting ? "Menyimpan..." : "Kirim Kuisioner"}
              </button>
            </div>
          </form>
        )}

        <section className="order-4 bg-surface border border-border rounded-xl p-5">
          <h2 className="font-bold text-text-primary mb-3">
            Interpretasi Singkat
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Berdasarkan {summary.totalResponses} jawaban pada filter{" "}
            <span className="font-semibold text-text-primary">
              {sourceFilter}
            </span>
            , Bhumi Satya memperoleh rata-rata skor{" "}
            {formatNumber(summary.averageScore)} dari 5 dengan indeks kepuasan{" "}
            {formatNumber(summary.satisfactionIndex, 1)}%. Aspek dengan skor
            terendah pada daftar prioritas dapat digunakan sebagai dasar
            rekomendasi penyempurnaan sistem.
          </p>
        </section>

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-text-primary text-lg">
                    Edit Data EKASMAT
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    Mengubah data responden: {editingData?.name}
                  </p>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 rounded-lg bg-surface-secondary text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
                  title="Tutup"
                >
                  <XIcon size={20} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto">
                <div className="p-5 border-b border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2">
                      Nama Responden
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nama"
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface-secondary text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2">
                      Sumber
                    </label>
                    <select
                      value={editForm.source}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          source: event.target.value,
                        }))
                      }
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface-secondary text-sm text-text-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    >
                      <option value="BPKA">BPKA</option>
                      <option value="BPN">BPN</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                </div>

                <div className="px-5 py-3 bg-blue-50/80 dark:bg-blue-500/10 border-b border-blue-100 dark:border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 leading-relaxed">
                    Skala nilai: 1 sangat tidak setuju, 2 tidak setuju, 3 netral, 4 setuju, 5 sangat setuju.
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {ekasmatQuestions.map((question, index) => (
                    <div
                      key={`edit-${question}`}
                      className="p-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:items-center"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-border text-text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                          P{index + 1}
                        </div>
                        <p className="text-sm font-medium text-text-primary leading-relaxed">
                          {question}
                        </p>
                      </div>
                      <div className="grid grid-cols-5 gap-2 lg:w-80">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleEditScoreChange(index, score)}
                            className={`h-11 rounded-lg border text-sm font-bold flex items-center justify-center transition-colors ${
                              editForm.scores[index] === score
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-surface-secondary border-border text-text-secondary hover:text-text-primary hover:border-blue-300"
                            }`}
                            title={scoreLabels[score]}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 bg-surface-secondary border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-text-muted">
                    Pastikan semua butir telah dipilih sebelum menyimpan perubahan.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(false)}
                      className="px-5 py-3 bg-surface-secondary hover:bg-surface-tertiary border border-border text-text-secondary hover:text-text-primary text-sm font-bold rounded-xl transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      <PencilIcon size={18} weight="fill" />
                      {updating ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-5 border-b border-border">
                <h2 className="font-bold text-text-primary text-lg">
                  Hapus Data EKASMAT?
                </h2>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data responden{" "}
                  <span className="font-semibold text-text-primary">
                    "{deletingName}"
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="p-5 bg-surface-secondary flex flex-col sm:flex-row sm:items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleting}
                  className="px-5 py-3 bg-surface hover:bg-surface-secondary border border-border text-text-secondary hover:text-text-primary text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  <TrashIcon size={18} weight="fill" />
                  {deleting ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
