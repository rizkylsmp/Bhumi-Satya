import { FolderOpenIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";

export default function FormFileUpload({
  label,
  name,
  onChange,
  multiple = false,
  accept = "image/*",
  size = "md",
}) {
  const [fileName, setFileName] = useState("");

  const handleChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      if (multiple) {
        setFileName(`${files.length} file dipilih`);
      } else {
        setFileName(files[0].name);
      }
    }
    onChange(e);
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
    </div>
  );
}
