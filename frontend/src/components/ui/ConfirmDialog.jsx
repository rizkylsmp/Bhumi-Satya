import { useState, createContext, useContext, useCallback } from "react";
import { TrashIcon, InfoIcon, WarningIcon } from "@phosphor-icons/react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Ya",
    cancelText: "Batal",
    type: "warning", // warning, danger, info
    onConfirm: null,
  });

  const confirm = useCallback(
    ({ title, message, confirmText, cancelText, type = "warning" }) => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title,
          message,
          confirmText: confirmText || "Ya",
          cancelText: cancelText || "Batal",
          type,
          onConfirm: resolve,
        });
      });
    },
    [],
  );

  const handleConfirm = () => {
    state.onConfirm?.(true);
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    state.onConfirm?.(false);
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const getTypeStyles = () => {
    switch (state.type) {
      case "danger":
        return {
          icon: TrashIcon,
          iconBg: "bg-red-100 dark:bg-red-900/30",
          buttonBg: "bg-red-600 hover:bg-red-700 text-surface",
        };
      case "info":
        return {
          icon: InfoIcon,
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
          buttonBg: "bg-blue-600 hover:bg-blue-700 text-surface",
        };
      default:
        return {
          icon: WarningIcon,
          iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
          buttonBg: "bg-yellow-600 hover:bg-yellow-700 text-surface",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Modal */}
      {state.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-accent/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              {/* Icon */}
              <div
                className={`w-14 h-14 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                <styles.icon size={28} weight="bold" />
              </div>

              {/* Title */}
              <h3 id="confirm-dialog-title" className="text-lg font-semibold text-text-primary mb-2">
                {state.title}
              </h3>

              {/* Message */}
              <p className="text-sm text-text-tertiary mb-6">{state.message}</p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-text-secondary hover:bg-surface-secondary transition-all text-sm font-medium"
                >
                  {state.cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${styles.buttonBg}`}
                >
                  {state.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}
