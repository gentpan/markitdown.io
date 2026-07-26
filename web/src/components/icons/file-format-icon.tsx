import { cn } from "@/lib/utils"

type Props = {
  format: string
  className?: string
  active?: boolean
}

/** Muted accent per format — keeps Ona navy base with readable type cues. */
const ACCENT: Record<string, string> = {
  pdf: "#C23B22",
  docx: "#2B579A",
  doc: "#2B579A",
  html: "#E34C26",
  pptx: "#C43E1C",
  ppt: "#C43E1C",
  xlsx: "#217346",
  xls: "#217346",
  csv: "#217346",
  epub: "#6B4FBB",
  odt: "#1E7A46",
  rtf: "#4A6FA5",
  plain: "#636363",
  txt: "#636363",
  tex: "#008080",
  latex: "#008080",
  gfm: "#24292F",
  commonmark: "#24292F",
  markdown: "#24292F",
  md: "#24292F",
  rst: "#6B7280",
  asciidoc: "#E40046",
  adoc: "#E40046",
  org: "#77AA99",
  typst: "#239DAD",
  typ: "#239DAD",
  ipynb: "#F37726",
  json: "#CB7B2A",
  opml: "#818181",
  docbook: "#E6A23C",
  xml: "#E6A23C",
  png: "#397554",
  jpg: "#397554",
  jpeg: "#397554",
  image: "#397554",
}

const LABEL: Record<string, string> = {
  pdf: "PDF",
  docx: "DOC",
  doc: "DOC",
  html: "HTML",
  pptx: "PPT",
  ppt: "PPT",
  xlsx: "XLS",
  xls: "XLS",
  csv: "CSV",
  epub: "EPUB",
  odt: "ODT",
  rtf: "RTF",
  plain: "TXT",
  txt: "TXT",
  tex: "TEX",
  latex: "TEX",
  gfm: "MD",
  commonmark: "MD",
  markdown: "MD",
  md: "MD",
  rst: "RST",
  asciidoc: "ADOC",
  adoc: "ADOC",
  org: "ORG",
  typst: "TYP",
  typ: "TYP",
  ipynb: "NB",
  json: "JSON",
  opml: "OPML",
  docbook: "XML",
  xml: "XML",
  png: "IMG",
  jpg: "IMG",
  jpeg: "IMG",
  image: "IMG",
}

function normalize(format: string) {
  return format.toLowerCase().replace(/^\./, "")
}

export function FileFormatIcon({ format, className, active = false }: Props) {
  const key = normalize(format)
  const accent = active ? "#FFFFFF" : ACCENT[key] || "#0A0E19"
  const label = LABEL[key] || key.slice(0, 4).toUpperCase()
  const fold = active ? "rgba(255,255,255,0.35)" : "#E1E1E1"
  const paper = active ? "transparent" : "#FFFFFF"
  const stroke = active ? "#FFFFFF" : "#0A0E19"

  return (
    <svg
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-9 shrink-0", className)}
      aria-hidden
    >
      <path
        d="M8 2.5h16.2L32.5 11v34.5H8V2.5Z"
        fill={paper}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <path d="M24 2.5V11h8.5" stroke={stroke} strokeWidth="1.5" fill={fold} />
      <rect x="5" y="28" width="30" height="14" rx="3" fill={accent} />
      <text
        x="20"
        y="37.5"
        textAnchor="middle"
        fill={active ? "#0A0E19" : "#FFFFFF"}
        fontSize="8"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="600"
      >
        {label}
      </text>
    </svg>
  )
}

export function UploadDropIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-14", className)}
      aria-hidden
    >
      <rect
        x="8"
        y="14"
        width="48"
        height="40"
        rx="8"
        stroke="#0A0E19"
        strokeWidth="1.75"
        fill="#F2F2F2"
      />
      <path
        d="M32 22v18M24 30l8-8 8 8"
        stroke="#0A0E19"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 46h28"
        stroke="#CECECE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ArrowSwapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", className)}
      aria-hidden
    >
      <path
        d="M7 7h11M15 3l4 4-4 4M17 17H6M9 13l-4 4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const INPUT_FORMAT_CHIPS = [
  { format: "pdf", label: "PDF" },
  { format: "docx", label: "Word" },
  { format: "xlsx", label: "Excel" },
  { format: "pptx", label: "PPT" },
  { format: "png", label: "图片" },
  { format: "html", label: "HTML" },
  { format: "md", label: "MD" },
] as const
