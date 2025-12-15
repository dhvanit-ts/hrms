import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
    message: string;
    onDismiss?: () => void;
    autoDismiss?: boolean;
    dismissAfter?: number;
    className?: string;
}

export function ErrorAlert({
    message,
    onDismiss,
    autoDismiss = false,
    dismissAfter = 5000,
    className,
}: ErrorAlertProps) {
    React.useEffect(() => {
        if (autoDismiss && onDismiss) {
            const timer = setTimeout(() => {
                onDismiss();
            }, dismissAfter);

            return () => clearTimeout(timer);
        }
    }, [autoDismiss, dismissAfter, onDismiss]);

    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
                className
            )}
            role="alert"
        >
            <div className="flex-1">{message}</div>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="inline-flex items-center justify-center rounded-md p-1 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                    aria-label="Dismiss error"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
