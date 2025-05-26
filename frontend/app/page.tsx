import { redirect } from "next/navigation"

export default function Home() {
  // Redireciona diretamente para a página de login
  redirect("/login")

  return null
}
