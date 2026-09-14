"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";

type Item = Record<string, unknown> & { _id: string };

async function request(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function AdminGallery({ initial }: { initial: unknown[] }) {
  const [items, setItems] = useState(initial as Item[]);
  const [busy, setBusy] = useState(false);
  async function add(form: FormData) {
    setBusy(true);
    try {
      const file = form.get("file");
      let image = { url: String(form.get("url")), ...(form.get("publicId") ? { publicId: String(form.get("publicId")) } : {}) };
      if (file instanceof File && file.size > 0) {
        const upload = new FormData(); upload.append("file", file); upload.append("folder", "greenova/gallery");
        const response = await fetch("/api/upload", { method: "POST", body: upload }); const uploaded = await response.json();
        if (!response.ok) throw new Error(uploaded.error ?? "Upload failed."); image = uploaded;
      }
      if (!image.url) throw new Error("Choose an image file or provide an image URL.");
      const created = await request("/api/admin/gallery", "POST", { image, title: form.get("title"), alt: form.get("alt"), category: form.get("category"), order: items.length });
      setItems((current) => [...current, created]); toast.success("Gallery image added.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not add image."); } finally { setBusy(false); }
  }
  async function edit(item: Item) {
    const title = prompt("Title", String(item.title)); const alt = prompt("Alt text", String(item.alt));
    if (!title || !alt) return;
    try { const updated = await request(`/api/admin/gallery/${item._id}`, "PATCH", { title, alt }); setItems((all) => all.map((x) => x._id === item._id ? updated : x)); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not update image."); }
  }
  async function remove(id: string) { if (!confirm("Delete this gallery image?")) return; try { await request(`/api/admin/gallery/${id}`, "DELETE"); setItems((all) => all.filter((x) => x._id !== id)); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not delete image."); } }
  async function move(index: number, delta: number) { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setItems(next); try { await request("/api/admin/gallery/reorder", "PATCH", { items: next.map((item, order) => ({ id: item._id, order })) }); } catch { toast.error("Could not save order."); setItems(items); } }
  return <section><h1 className="font-display text-4xl font-light">Gallery</h1><p className="mt-2 text-sm text-fg-muted">Images are converted by Cloudinary with automatic quality and format optimization.</p><form action={add} className="mt-6 grid gap-3 rounded-3xl border border-border-base p-5 sm:grid-cols-2"><input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="rounded-xl border border-border-base p-3 text-sm"/><input name="url" type="url" placeholder="Or image URL" className="rounded-xl border border-border-base p-3 text-sm"/><input name="publicId" placeholder="Cloudinary public ID (optional)" className="rounded-xl border border-border-base p-3 text-sm"/><input name="title" required placeholder="Title" className="rounded-xl border border-border-base p-3 text-sm"/><input name="alt" required placeholder="Descriptive alt text" className="rounded-xl border border-border-base p-3 text-sm"/><select name="category" className="rounded-xl border border-border-base p-3 text-sm">{["Rooms","Property","Dining","Pool","Events","Nature","Experiences"].map((x) => <option key={x}>{x}</option>)}</select><Button loading={busy}>Add image</Button></form><div className="mt-6 space-y-3">{items.map((item, i) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-base p-4"><div><p className="font-medium">{String(item.title)}</p><p className="text-xs text-fg-muted">{String(item.category)} · {String(item.alt)}</p></div><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => void move(i, -1)}>↑</Button><Button size="sm" variant="ghost" onClick={() => void move(i, 1)}>↓</Button><Button size="sm" variant="outline" onClick={() => void edit(item)}>Edit</Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => void remove(item._id)}>Delete</Button></div></div>)}</div></section>;
}

export function AdminAmenities({ initial }: { initial: unknown[] }) {
  const [items, setItems] = useState(initial as Item[]);
  async function add(form: FormData) { try { const row = await request("/api/admin/amenities", "POST", { name: form.get("name"), description: form.get("description") || undefined, active: true, order: items.length }); setItems((x) => [...x, row]); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not add amenity."); } }
  async function toggle(item: Item) { const row = await request(`/api/admin/amenities/${item._id}`, "PATCH", { active: !item.active }); setItems((x) => x.map((v) => v._id === item._id ? row : v)); }
  async function remove(id: string) { if (!confirm("Delete this amenity?")) return; await request(`/api/admin/amenities/${id}`, "DELETE"); setItems((x) => x.filter((v) => v._id !== id)); }
  return <section><h1 className="font-display text-4xl font-light">Amenities</h1><form action={add} className="mt-6 flex flex-wrap gap-3"><input name="name" required placeholder="e.g. Free Wi-Fi" className="rounded-xl border border-border-base p-3 text-sm"/><input name="description" placeholder="Optional description" className="rounded-xl border border-border-base p-3 text-sm"/><Button>Add amenity</Button></form><div className="mt-6 space-y-3">{items.map((item) => <div key={item._id} className="flex items-center justify-between rounded-2xl border border-border-base p-4"><div><p className="font-medium">{String(item.name)}</p><p className="text-xs text-fg-muted">{String(item.description ?? "")}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void toggle(item)}>{item.active ? "Hide" : "Show"}</Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => void remove(item._id)}>Delete</Button></div></div>)}</div></section>;
}

export function AdminDining({ initial }: { initial: unknown[] }) {
  const [items, setItems] = useState(initial as Item[]);
  async function add(form: FormData) { try { const row = await request("/api/admin/dining", "POST", { name: form.get("name"), description: form.get("description"), openingTime: form.get("openingTime"), closingTime: form.get("closingTime"), cuisine: form.get("cuisine"), images: form.get("image") ? [{ url: form.get("image") }] : [], highlights: String(form.get("highlights") || "").split(",").map((x) => x.trim()).filter(Boolean), active: true, order: items.length }); setItems((x) => [...x, row]); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not add venue."); } }
  async function toggle(item: Item) { const row = await request(`/api/admin/dining/${item._id}`, "PATCH", { active: !item.active }); setItems((x) => x.map((v) => v._id === item._id ? row : v)); }
  async function remove(id: string) { if (!confirm("Delete this dining venue?")) return; await request(`/api/admin/dining/${id}`, "DELETE"); setItems((x) => x.filter((v) => v._id !== id)); }
  return <section><h1 className="font-display text-4xl font-light">Dining</h1><form action={add} className="mt-6 grid gap-3 rounded-3xl border border-border-base p-5 sm:grid-cols-2"><input name="name" required placeholder="Restaurant name" className="rounded-xl border border-border-base p-3 text-sm"/><input name="cuisine" required placeholder="Cuisine" className="rounded-xl border border-border-base p-3 text-sm"/><input name="openingTime" required placeholder="Opening time" className="rounded-xl border border-border-base p-3 text-sm"/><input name="closingTime" required placeholder="Closing time" className="rounded-xl border border-border-base p-3 text-sm"/><input name="image" placeholder="Image URL (optional)" className="rounded-xl border border-border-base p-3 text-sm"/><input name="highlights" placeholder="Highlights, comma separated" className="rounded-xl border border-border-base p-3 text-sm"/><textarea name="description" required placeholder="Description" className="min-h-28 rounded-xl border border-border-base p-3 text-sm sm:col-span-2"/><Button>Add venue</Button></form><div className="mt-6 space-y-3">{items.map((item) => <div key={item._id} className="flex items-center justify-between rounded-2xl border border-border-base p-4"><div><p className="font-medium">{String(item.name)}</p><p className="text-xs text-fg-muted">{String(item.cuisine)} · {String(item.openingTime)}–{String(item.closingTime)}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void toggle(item)}>{item.active ? "Hide" : "Show"}</Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => void remove(item._id)}>Delete</Button></div></div>)}</div></section>;
}

export function AdminEnquiries({ initial }: { initial: unknown[] }) {
  const [items, setItems] = useState(initial as Item[]);
  async function update(item: Item, status: string) { try { const row = await request(`/api/admin/enquiries/${item._id}`, "PATCH", { status }); setItems((all) => all.map((x) => x._id === item._id ? row : x)); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not update enquiry."); } }
  return <section><h1 className="font-display text-4xl font-light">Contact enquiries</h1><div className="mt-6 space-y-4">{items.length === 0 ? <p className="text-sm text-fg-muted">No enquiries yet.</p> : items.map((item) => <article key={item._id} className="rounded-3xl border border-border-base p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-medium">{String(item.subject)}</p><p className="text-xs text-fg-muted">{String(item.name)} · {String(item.email)} · {String(item.phone)}</p></div><select value={String(item.status)} onChange={(event) => void update(item, event.target.value)} className="rounded-xl border border-border-base px-3 py-2 text-sm">{["NEW","READ","REPLIED","CLOSED"].map((s) => <option key={s}>{s}</option>)}</select></div><p className="mt-4 whitespace-pre-line text-sm text-fg-muted">{String(item.message)}</p></article>)}</div></section>;
}
