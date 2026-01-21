/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertCircleIcon, ImageUpIcon, XIcon } from "lucide-react"
import { FileWithPreview, useFileUpload } from "@/hooks/use-file-upload"
import { cn } from "@/lib/utils"

interface FileInputProps {
  onFileInput?: (file: File) => Promise<any> | void
  setData?: (data: any) => void

  id?: string
  name?: string
  disabled?: boolean
  required?: boolean
  className?: string
  accept?: string
  maxSizeMB?: number
  placeholder?: string

  "aria-label"?: string
  "aria-describedby"?: string
}

export default function FileInput({
  onFileInput,
  id,
  name,
  disabled = false,
  required = false,
  className = "",
  accept = "image/*",
  maxSizeMB = 5,
  placeholder = "Drop your image here or click to browse",
  setData,
  "aria-label": ariaLabel = "Upload file",
  "aria-describedby": ariaDescribedBy,
}: FileInputProps) {
  const maxSize = maxSizeMB * 1024 * 1024

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept,
    maxSize,
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      const file = addedFiles[0].file as File
      if (!file) return

      try {
        const result = await onFileInput?.(file)

        if (setData && result !== undefined) {
          setData(result)
        }
      } catch (error) {
        console.error("Error handling file input:", error)
      }
    }
  })

  const previewUrl = files[0]?.preview ?? null

  return (
    <div className={`flex flex-col gap-2 bg-zinc-200 dark:bg-zinc-800 rounded-md ${className}`}>
      <div className="relative">
        <div
          role="button"
          onClick={disabled ? undefined : openFileDialog}
          onDragEnter={disabled ? undefined : handleDragEnter}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDragOver={disabled ? undefined : handleDragOver}
          onDrop={disabled ? undefined : handleDrop}
          className={cn(
            "border-input hover:bg-accent/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[img]:border-none has-[input:focus]:border-ring has-[input:focus]:ring-[3px]",
            isDragging && "bg-accent/50",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <input
            {...getInputProps()}
            id={id}
            name={name}
            disabled={disabled}
            required={required}
            className="sr-only"
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
          />
          {previewUrl ? (
            <div className="absolute inset-0 pointer-events-none">
              <img
                src={previewUrl}
                alt={files[0]?.file?.name ?? "Uploaded image"}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border" aria-hidden="true">
                <ImageUpIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">{placeholder}</p>
              <p className="text-muted-foreground text-xs">
                Max size: {maxSizeMB}MB
                {required && <span className="text-destructive ml-1">*</span>}
              </p>
            </div>
          )}
        </div>

        {previewUrl && !disabled && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => removeFile(files[0]?.id)}
              aria-label="Remove image"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="text-destructive flex items-center gap-1 text-xs" role="alert" aria-describedby={ariaDescribedBy}>
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  )
}
