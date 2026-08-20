import { redirect } from "next/navigation";

export default function LoginAlias() {
  redirect("/auth/v1/login");
}
