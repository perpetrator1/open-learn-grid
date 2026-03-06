/**
 * TagInput – searchable tag picker with inline autocomplete suggestions.
 * User can type a new tag name and press Enter to create it, or pick from
 * the dropdown of existing tags.
 */

import { useState, useRef, KeyboardEvent } from "react"
import { useQuery } from "@tanstack/react-query"
import { materialsApi } from "@/lib/materials-api"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import type { Tag } from "@/types"

interface Props {
  value: string[]           // tag names (lowercased)
  onChange: (tags: string[]) => void
  maxTags?: number
}

export function TagInput({ value, onChange, maxTags = 10 }: Props) {
  const [inputValue, setInputValue] = useState("")
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: suggestions } = useQuery({
    queryKey: ["tags-search", inputValue],
    queryFn: () => materialsApi.getTags({ search: inputValue, page_size: 8 }),
    enabled: inputValue.length >= 1,
  })

  const addTag = (name: string) => {
    const normalized = name.trim().toLowerCase()
    if (!normalized || value.includes(normalized) || value.length >= maxTags) return
    onChange([...value, normalized])
    setInputValue("")
    setOpen(false)
  }

  const removeTag = (name: string) => {
    onChange(value.filter((t) => t !== name))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length) {
      removeTag(value[value.length - 1])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const candidateTags: Tag[] = suggestions?.results ?? []

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 min-h-10 items-center cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="ml-0.5 rounded-full hover:bg-muted"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true) }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={value.length === 0 ? "Type tags and press Enter…" : ""}
          className="flex-1 text-sm outline-none bg-transparent min-w-[120px] placeholder:text-muted-foreground"
          disabled={value.length >= maxTags}
        />
      </div>

      {open && inputValue && candidateTags.length > 0 && (
        <div className="relative">
          <div className="absolute z-10 w-full rounded-md border bg-popover shadow-md">
            {candidateTags
              .filter((t) => !value.includes(t.name))
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                  onMouseDown={(e) => { e.preventDefault(); addTag(t.name) }}
                >
                  {t.name}
                </button>
              ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length}/{maxTags} tags — press <kbd className="font-mono">Enter</kbd> or <kbd className="font-mono">,</kbd> to add
      </p>
    </div>
  )
}
