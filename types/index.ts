export interface Group {
    id: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
}

export interface Speaker {
    id: string
    name: string
    type: string // "guest" etc.
    groups: Group[]
    speakCount: number
    createdAt?: Date | string
    updatedAt?: Date | string
}

export type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT" | "OTHER"

export interface Attendance {
    id?: string
    meetingId?: string
    speakerId: string
    status: AttendanceStatus
    note?: string | null
    speaker: Speaker
}

export interface MeetingGroup {
    id: string
    name: string
    requiredMembers?: Speaker[]
    createdAt?: Date | string
    updatedAt?: Date | string
}

export interface Meeting {
    id: string
    title: string
    date: string | Date
    notes: string | null
    attendance: Attendance[]
    meetingGroupId?: string
}
