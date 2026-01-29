import { PeopleManager } from "@/components/people/PeopleManager"

export default function PeoplePage() {
    return (
        <div className="container mx-auto max-w-5xl py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">People Management</h1>
            <PeopleManager />
        </div>
    )
}
