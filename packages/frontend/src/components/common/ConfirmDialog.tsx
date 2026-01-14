import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Info, X } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500";
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <Dialog.Content className="pointer-events-auto w-[90vw] max-w-[450px] rounded-xl bg-surface-900 border border-surface-800 p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className={clsx("p-2 rounded-full shrink-0 bg-opacity-10", {
                  "bg-red-500/10": variant === "danger",
                  "bg-yellow-500/10": variant === "warning",
                  "bg-blue-500/10": variant === "info",
                })}>
                  {getIcon()}
                </div>
                <div className="flex-1 pt-1">
                  <Dialog.Title className="text-lg font-semibold text-surface-100">
                    {title}
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-surface-400 leading-relaxed">
                    {description}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="rounded-full p-1 text-surface-400 hover:text-surface-200 focus:outline-none focus:ring-2 focus:ring-surface-700"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-surface-300 hover:text-surface-100 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-surface-700"
                >
                  {cancelText || t("common.cancel")}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                    getConfirmButtonClass()
                  )}
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {confirmText || t("common.confirm")}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
