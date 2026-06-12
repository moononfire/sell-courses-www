import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { NewSeriesForm } from "@/components/admin/new-series-form";
import { isAdmin } from "@/lib/admin";

export default async function NewSeriesPage() {
  if (!(await isAdmin())) redirect("/");
  return (
    <>
      <Header />
      <main className="py-12 px-6">
        <div className="mx-auto max-w-xl space-y-6">
          <h1 className="text-2xl font-bold">Nowa seria</h1>
          <NewSeriesForm />
        </div>
      </main>
    </>
  );
}
