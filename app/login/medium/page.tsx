import { redirect } from "next/navigation"

export default function MediumLoginRedirect() {
    redirect("/auth/login")
}
