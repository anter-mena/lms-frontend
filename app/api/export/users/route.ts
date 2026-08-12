import ExcelJS from "exceljs"
import { NextResponse, type NextRequest } from "next/server"

import { listUsers, type UserQuery } from "@/lib/users"
import type { UserRow } from "@/lib/userTypes"

/**
 * Downloading the user list as a file.
 *
 * <p>A Route Handler rather than something the table does in the browser, for two
 * reasons. The token lives in an httpOnly cookie, so only the server can ask the
 * backend for the rows — and the browser only ever holds the page it is showing,
 * so an export built there would silently be "the ten rows you can see" rather
 * than the list you filtered.
 *
 * <p>Reached as a plain link with `download`, not a fetch. The browser then owns
 * the save dialog, the progress and the filename, and nothing has to be held in
 * memory as a blob on the way.
 *
 * <p><b>It exports what you are looking at.</b> The same filters the table is
 * showing are passed through, so "export" means "export this list" rather than
 * "export everything and let them find it again in Excel". Tick rows first and it
 * narrows to those instead.
 *
 * <p>⚠️ Not paginated on the way out: every matching row is fetched and held in
 * memory to build the file. Fine at the size this system will be for a long
 * while; at a hundred thousand accounts it would need streaming.
 */

// exceljs is a Node library — it will not run on the edge runtime.
export const runtime = "nodejs"

/** The backend caps a page at 100, so a full export is a loop rather than one call. */
const FETCH_SIZE = 100

/** A run-away guard, not a limit anybody should ever meet. */
const MAX_PAGES = 200

type Format = "csv" | "json" | "xlsx"

/** The columns, in the order the table shows them. */
const COLUMNS: { key: keyof UserRow | "name"; header: string; width: number }[] = [
  { key: "id", header: "ID", width: 8 },
  { key: "firstName", header: "First name", width: 18 },
  { key: "lastName", header: "Last name", width: 18 },
  { key: "email", header: "Email", width: 34 },
  { key: "phone", header: "Phone", width: 18 },
  { key: "role", header: "Role", width: 14 },
  { key: "status", header: "Status", width: 20 },
  { key: "mfaEnabled", header: "Two-factor", width: 12 },
  { key: "createdAt", header: "Joined", width: 14 },
]

/** What a cell reads as. Booleans and dates are for people here, not machines. */
function cell(user: UserRow, key: (typeof COLUMNS)[number]["key"]): string | number {
  if (key === "name") return `${user.firstName} ${user.lastName}`
  if (key === "mfaEnabled") return user.mfaEnabled ? "On" : "Off"
  if (key === "createdAt") return user.createdAt ? user.createdAt.slice(0, 10) : ""

  const value = user[key as keyof UserRow]
  return value === null || value === undefined ? "" : String(value)
}

/**
 * Every row matching the filters, one page at a time.
 *
 * <p>Loops rather than asking for one enormous page, because the backend caps a
 * page at 100 on purpose — a hand-written `?size=100000` should not be able to
 * ask it to build a single vast response.
 */
async function fetchAll(query: UserQuery): Promise<UserRow[]> {
  const rows: UserRow[] = []

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await listUsers({
      ...query,
      // listUsers counts pages from 1, as the URL does.
      page: String(page + 1),
      size: String(FETCH_SIZE),
    })

    if (!result.ok) throw new ExportError(result.error.status, result.error.message)

    rows.push(...result.data.content)
    if (rows.length >= result.data.totalElements) break
    if (result.data.content.length === 0) break
  }

  return rows
}

class ExportError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

/**
 * One CSV field.
 *
 * <p>Quoted whenever it holds a comma, a quote or a newline, with inner quotes
 * doubled — the rule from RFC 4180. Skipping it is how a surname like
 * "Van Der Berg, Jr" silently becomes two columns and every row after it in that
 * file is one field out of step.
 */
function csvField(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv(rows: UserRow[]): string {
  const lines = [COLUMNS.map((c) => csvField(c.header)).join(",")]

  for (const user of rows) {
    lines.push(COLUMNS.map((c) => csvField(cell(user, c.key))).join(","))
  }

  // CRLF, which is what RFC 4180 specifies and what Excel expects. A BOM as
  // well, or Excel reads a UTF-8 file as the local codepage and turns Cherkaoui
  // into CherkaouÃ¯.
  return "﻿" + lines.join("\r\n") + "\r\n"
}

/**
 * JSON keeps the raw values.
 *
 * <p>Unlike the other two, this one is read by a program. "On" and "Off" are for
 * a person looking at a spreadsheet; something parsing this wants `true` and an
 * ISO timestamp it can sort.
 */
function toJson(rows: UserRow[]): string {
  return JSON.stringify(rows, null, 2)
}

async function toXlsx(rows: UserRow[]): Promise<Buffer> {
  const book = new ExcelJS.Workbook()
  book.creator = "Norden Capital"
  const sheet = book.addWorksheet("Users")

  sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: String(c.key), width: c.width }))
  sheet.getRow(1).font = { bold: true }
  // Frozen, so the headings stay put on a long list — the same reason the table
  // on screen has a sticky header.
  sheet.views = [{ state: "frozen", ySplit: 1 }]

  for (const user of rows) {
    sheet.addRow(
      Object.fromEntries(COLUMNS.map((c) => [String(c.key), cell(user, c.key)]))
    )
  }

  return Buffer.from(await book.xlsx.writeBuffer())
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const format = (params.get("format") ?? "csv") as Format
  if (!["csv", "json", "xlsx"].includes(format)) {
    return NextResponse.json({ message: `Unknown format "${format}".` }, { status: 400 })
  }

  // The same filters the table is showing. Paging is deliberately not carried
  // over: exporting page 2 of a list is nobody's intention.
  const query: UserQuery = {
    search: params.get("search") ?? undefined,
    role: params.get("role") ?? undefined,
    status: params.get("status") ?? undefined,
    mfa: params.get("mfa") ?? undefined,
    sort: params.get("sort") ?? undefined,
  }

  let rows: UserRow[]
  try {
    rows = await fetchAll(query)
  } catch (error) {
    if (error instanceof ExportError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    throw error
  }

  // Narrowed to a tick selection, if there was one. Filtered after fetching
  // rather than asked for by id, because the backend has no by-id filter and the
  // rows are already here.
  const ids = params.get("ids")
  if (ids) {
    const wanted = new Set(ids.split(",").map(Number).filter(Number.isFinite))
    rows = rows.filter((user) => wanted.has(user.id))
  }

  // Dated, so two exports a week apart do not both sit in Downloads called
  // "users.csv" and "users (1).csv".
  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `users-${stamp}.${format}`

  const body =
    format === "xlsx" ? await toXlsx(rows) : format === "json" ? toJson(rows) : toCsv(rows)

  const type =
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : format === "json"
        ? "application/json; charset=utf-8"
        : "text/csv; charset=utf-8"

  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": type,
      // `attachment` is what makes the browser save it rather than render it —
      // without this a CSV opens as a wall of text in the tab.
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
