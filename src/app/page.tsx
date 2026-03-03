import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Home() {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    if (userId) {
        redirect("/dashboard");
    }
    redirect("/login");
}
