import { Meeting, AttendanceStatus } from "@/types"

const STATUS_COLORS: Record<AttendanceStatus, { label: string; argb: string; lightText: boolean }> = {
    PRESENT: { label: "Present", argb: "FF00A86B", lightText: true },
    LATE:    { label: "Late",    argb: "FFFF9900", lightText: true },
    EXCUSED: { label: "Excused", argb: "FF2737B0", lightText: true },
    ABSENT:  { label: "Absent",  argb: "FFFF084E", lightText: true },
    OTHER:   { label: "Other",   argb: "FF9E9E9E", lightText: true },
}

export async function exportAttendanceXlsx(
    meetings: Meeting[],
    groupName: string
): Promise<void> {
    if (meetings.length === 0) return

    const ExcelJS = await import("exceljs")
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Attendance")

    // Sort meetings oldest first (columns left-to-right)
    const sortedMeetings = [...meetings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Collect all unique speakers across all meetings (rows)
    const speakerMap = new Map<string, string>()
    for (const meeting of meetings) {
        for (const record of meeting.attendance || []) {
            if (!speakerMap.has(record.speakerId)) {
                speakerMap.set(record.speakerId, record.speaker.name)
            }
        }
    }
    const sortedSpeakers = [...speakerMap.entries()].sort((a, b) =>
        a[1].localeCompare(b[1])
    )

    // Build attendance lookup: meetingId -> speakerId -> attendance record
    const attendanceLookup = new Map<string, Map<string, { status: AttendanceStatus; note?: string | null }>>()
    for (const meeting of sortedMeetings) {
        const map = new Map(
            (meeting.attendance || []).map((a) => [a.speakerId, { status: a.status, note: a.note }])
        )
        attendanceLookup.set(meeting.id, map)
    }

    // Header row: "Name" + one column per meeting date
    const headerRow = worksheet.addRow([
        "Name",
        ...sortedMeetings.map((m) => {
            const dateStr = new Date(m.date).toLocaleDateString()
            return `${m.title} (${dateStr})`
        }),
    ])
    headerRow.eachCell((cell) => {
        cell.font = { bold: true }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        }
        cell.alignment = { horizontal: "center", wrapText: true }
        cell.border = { bottom: { style: "thin" } }
    })
    // First header cell left-aligned
    headerRow.getCell(1).alignment = { horizontal: "left" }

    // Data rows: one per speaker
    for (const [speakerId, speakerName] of sortedSpeakers) {
        const cells: string[] = [speakerName]

        for (const meeting of sortedMeetings) {
            const meetingAttendance = attendanceLookup.get(meeting.id)
            const record = meetingAttendance?.get(speakerId)
            if (!record) {
                cells.push("")
            } else if (record.status === "OTHER" && record.note) {
                cells.push(`Other (${record.note})`)
            } else {
                cells.push(STATUS_COLORS[record.status]?.label || "")
            }
        }

        const row = worksheet.addRow(cells)

        row.eachCell((cell, colNumber) => {
            if (colNumber === 1) {
                cell.font = { bold: true }
                return
            }
            cell.alignment = { horizontal: "center" }

            const meetingIndex = colNumber - 2
            const meeting = sortedMeetings[meetingIndex]
            if (meeting) {
                const meetingAttendance = attendanceLookup.get(meeting.id)
                const record = meetingAttendance?.get(speakerId)
                if (record) {
                    const color = STATUS_COLORS[record.status]
                    if (color) {
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: color.argb },
                        }
                        if (color.lightText) {
                            cell.font = { color: { argb: "FFFFFFFF" } }
                        }
                    }
                }
            }
        })
    }

    // Legend
    worksheet.addRow([])
    const legendStatuses: AttendanceStatus[] = ["PRESENT", "LATE", "EXCUSED", "ABSENT", "OTHER"]
    const legendRow = worksheet.addRow([
        "Legend:",
        ...legendStatuses.map((s) => STATUS_COLORS[s].label),
    ])
    legendRow.eachCell((cell, colNumber) => {
        if (colNumber === 1) {
            cell.font = { bold: true, italic: true }
            return
        }
        const status = legendStatuses[colNumber - 2]
        if (status) {
            const color = STATUS_COLORS[status]
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: color.argb },
            }
            if (color.lightText) {
                cell.font = { color: { argb: "FFFFFFFF" } }
            }
            cell.alignment = { horizontal: "center" }
        }
    })

    // Column widths
    worksheet.getColumn(1).width = 22
    for (let i = 2; i <= sortedMeetings.length + 1; i++) {
        worksheet.getColumn(i).width = 16
    }

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${groupName.replace(/[^a-zA-Z0-9]/g, "_")}_attendance.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
