export interface Group {
    id: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
}

export interface Speaker {
    id: string
    name: string
    groups: Group[]
    speakCount: number
    createdAt?: Date | string
    updatedAt?: Date | string
}
