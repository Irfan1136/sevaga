import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const seed = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/seed");
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    if (!confirm("Clear all in-memory dev data?")) return;
    setLoading(true);
    try {
      await fetch("/api/admin/clear", { method: "POST" });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-4">Admin / Dev Data</h1>
      <div className="mb-4 flex gap-2">
        <Button onClick={fetchData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
        <Button onClick={seed}>Seed Sample Data</Button>
        <Button variant="destructive" onClick={clearAll}>
          Clear All
        </Button>
      </div>

      <section className="space-y-6">
        <div className="rounded-lg border p-4 bg-card">
          <h2 className="font-semibold mb-2">Stats</h2>
          <pre className="text-sm">
            {JSON.stringify(data?.stats || {}, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border p-4 bg-card overflow-auto">
          <h2 className="font-semibold mb-2">
            Accounts ({data?.accounts?.length ?? 0})
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Type</th>
                <th className="p-2">Name</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Email</th>
                <th className="p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {(data?.accounts || []).map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2 align-top">{a.id}</td>
                  <td className="p-2 align-top">{a.type}</td>
                  <td className="p-2 align-top">{a.name}</td>
                  <td className="p-2 align-top">{a.mobile ?? "—"}</td>
                  <td className="p-2 align-top">{a.email ?? "—"}</td>
                  <td className="p-2 align-top">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border p-4 bg-card overflow-auto">
          <h2 className="font-semibold mb-2">
            Donors ({data?.donors?.length ?? 0})
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">BG</th>
                <th className="p-2">City</th>
                <th className="p-2">Pincode</th>
                <th className="p-2">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {(data?.donors || []).map((d: any) => (
                <tr key={d.id} className="border-t">
                  <td className="p-2 align-top">{d.id}</td>
                  <td className="p-2 align-top">{d.name}</td>
                  <td className="p-2 align-top">{d.bloodGroup}</td>
                  <td className="p-2 align-top">{d.city}</td>
                  <td className="p-2 align-top">{d.pincode}</td>
                  <td className="p-2 align-top">{d.mobile ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border p-4 bg-card overflow-auto">
          <h2 className="font-semibold mb-2">
            Notifications ({data?.notifications?.length ?? 0})
          </h2>
          <pre className="text-sm">
            {JSON.stringify(data?.notifications || [], null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border p-4 bg-card overflow-auto">
          <h2 className="font-semibold mb-2">
            Needs / Requests ({data?.needs?.length ?? 0})
          </h2>
          <pre className="text-sm">
            {JSON.stringify(data?.needs || [], null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
