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

export interface Attendance {
    id?: string
    meetingId?: string
    speakerId: string
    isPresent: boolean
    speaker: Speaker
}

export interface Committee {
    id: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
}

export interface Meeting {
    id: string
    title: string
    date: string | Date
    notes: string | null
    attendance: Attendance[]
    committeeId?: string
}
