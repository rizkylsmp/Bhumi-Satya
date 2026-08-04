import {
  EyeIcon,
  FileIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

function getStoredFileUrl(item) {
  if (typeof item === "string") return item;
  return item?.url || item?.public_url || item?.path || "";
}

function getStoredFileName(item, index) {
  if (typeof item === "object" && item?.name) return item.name;
  const url = getStoredFileUrl(item);
  if (!url) return `File ${index + 1}`;
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop())
      || `File ${index + 1}`;
  } catch {
    return url.split("/").filter(Boolean).pop() || `File ${index + 1}`;
  }
}

function normalizeStoredFiles(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  return [value];
}

export default function FormFileUpload({
  label,
  name,
  onChange,
  multiple = false,
  accept = "image/*",
  size = "md",
  value = null,
}) {
  const [fileName, setFileName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setSelectedFiles(Array.from(files));
      if (multiple) {
        setFileName(`${files.length} file dipilih`);
      } else {
        setFileName(files[0].name);
      }
    }
    onChange(e);
  };

  const localPreviewItems = useMemo(
    () => selectedFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      file,
    })),
    [selectedFiles],
  );

  const storedPreviewItems = useMemo(() => {
    if (selectedFiles.length > 0) return [];
    return normalizeStoredFiles(value)
      .map((item, index) => ({
        id: `stored-${index}-${getStoredFileUrl(item)}`,
        name: getStoredFileName(item, index),
        url: getStoredFileUrl(item),
      }))
      .filter((item) => item.url);
  }, [selectedFiles.length, value]);

  const previewItems = localPreviewItems.length > 0
    ? localPreviewItems
    : storedPreviewItems;

  const openPreview = (item) => {
    const previewUrl = item.file ? URL.createObjectURL(item.file) : item.url;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
    if (item.file) {
      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-5 py-4",
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-text-primary">
        {label}
      </label>
      <label
        className={`flex items-center justify-center gap-3 border-2 border-dashed border-border bg-surface text-sm cursor-pointer rounded-xl hover:border-accent hover:bg-accent/5 transition-all ${sizeClasses[size]}`}
      >
        <input
          type="file"
          name={name}
          onChange={handleChange}
          multiple={multiple}
          accept={accept}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <UploadSimpleIcon size={20} weight="bold" className="text-accent" />
          </div>
          {fileName ? (
            <span className="text-text-primary font-medium text-center">
              {fileName}
            </span>
          ) : (
            <>
              <span className="text-accent font-semibold">
                Klik untuk unggah {multiple ? "(Multiple)" : ""}
              </span>
              <span className="text-xs text-text-muted">
                atau drag and drop file di sini
              </span>
            </>
          )}
        </div>
      </label>

      {previewItems.length > 0 && (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {previewItems.map((item) => (
            <div
              key={item.id}
              className="flex min-h-8 items-center gap-2 px-2.5 py-1.5"
            >
              <FileIcon
                size={13}
                weight="duotone"
                className="shrink-0 text-text-muted"
              />
              <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-text-secondary">
                {item.name}
              </span>
              <button
                type="button"
                onClick={() => openPreview(item)}
                className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-accent/30 px-2 text-[9px] font-bold text-accent transition-colors hover:border-accent hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Lihat ${item.name}`}
                title={`Preview ${item.name}`}
              >
                <EyeIcon size={11} weight="bold" />
                Lihat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
