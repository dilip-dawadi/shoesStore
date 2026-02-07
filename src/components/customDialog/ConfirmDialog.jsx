import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ConfirmDialog({
  open,
  setOpen,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  cancelVariant = "destructive",
  confirmVariant = "default",
  isLoading = false,
  onConfirm = async () => {},
  footer = true,
  preventAutoFocus = true,
  confirmButtonType = "button",
  className = "sm:max-w-150",
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={className}
        onOpenAutoFocus={
          preventAutoFocus ? (e) => e.preventDefault() : undefined
        }
      >
        <DialogHeader>
          <DialogTitle className="text-left">{title}</DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        {footer && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant={cancelVariant}
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={async () => await onConfirm()}
              disabled={isLoading}
              type={confirmButtonType}
              className="flex-1 sm:flex-none"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
