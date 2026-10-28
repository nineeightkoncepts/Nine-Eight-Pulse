"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  adjustStockAction,
  createCategoryAction,
  deleteCategoryAction,
  deleteInventoryItemAction,
  upsertInventoryItemAction,
} from "@/lib/actions/inventory-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { SubmitButton } from "@/components/submit-button";
import { formatMoney } from "@/lib/format";

interface InventoryItemRow {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  price: string;
  cost: string;
  quantity: string;
  lowStockThreshold: string;
  trackInventory: boolean;
  isActive: boolean;
  categoryId: number | null;
}

interface CategoryRow {
  id: number;
  name: string;
}

const emptyState: ActionState = {};

export function InventoryClient({
  items,
  categories,
  currency,
}: {
  items: InventoryItemRow[];
  categories: CategoryRow[];
  currency: string;
}) {
  const [modalItem, setModalItem] = useState<InventoryItemRow | "new" | null>(null);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<number | "all">("all");
  const [, startTransition] = useTransition();

  const categoryName = (id: number | null) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  const filteredItems =
    filterCategory === "all" ? items : items.filter((i) => i.categoryId === filterCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filterCategory === "all" ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400"
            }`}
          >
            All items ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filterCategory === c.id ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCategoryPanelOpen((v) => !v)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            Manage categories
          </button>
          <button
            onClick={() => setModalItem("new")}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            + Add item
          </button>
        </div>
      </div>

      {categoryPanelOpen && (
        <CategoryPanel categories={categories} onClose={() => setCategoryPanelOpen(false)} />
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80">
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/30">
            {filteredItems.map((item) => {
              const low =
                item.trackInventory && Number(item.quantity) <= Number(item.lowStockThreshold);
              return (
                <tr key={item.id} className="text-slate-300">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{item.name}</p>
                    {item.sku && <p className="text-xs text-slate-500">SKU: {item.sku}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{categoryName(item.categoryId)}</td>
                  <td className="px-4 py-3">{formatMoney(item.price, currency)}</td>
                  <td className="px-4 py-3">
                    {item.trackInventory ? (
                      <span className={low ? "font-semibold text-amber-400" : ""}>
                        {item.quantity}
                        {low && " ⚠"}
                      </span>
                    ) : (
                      <span className="text-slate-500">Not tracked</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700/30 text-slate-400"
                      }`}
                    >
                      {item.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {item.trackInventory && (
                        <>
                          <button
                            title="Decrease stock"
                            onClick={() => startTransition(() => adjustStockAction(item.id, -1))}
                            className="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500"
                          >
                            −
                          </button>
                          <button
                            title="Increase stock"
                            onClick={() => startTransition(() => adjustStockAction(item.id, 1))}
                            className="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500"
                          >
                            +
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setModalItem(item)}
                        className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-amber-500/60"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.name}"? This cannot be undone.`)) {
                            startTransition(() => deleteInventoryItemAction(item.id));
                          }
                        }}
                        className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-red-300 hover:border-red-500/60"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No items in this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalItem && (
        <ItemModal
          key={modalItem === "new" ? "new" : modalItem.id}
          item={modalItem === "new" ? null : modalItem}
          categories={categories}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  );
}

function CategoryPanel({
  categories,
  onClose,
}: {
  categories: CategoryRow[];
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(createCategoryAction, emptyState);
  const [, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Categories</h3>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300">
          Close
        </button>
      </div>
      {state?.error && <p className="mt-2 text-xs text-red-400">{state.error}</p>}
      {state?.success && <p className="mt-2 text-xs text-emerald-400">{state.success}</p>}
      <form action={formAction} className="mt-3 flex gap-2">
        <input
          name="name"
          required
          placeholder="e.g. Desserts"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
        />
        <SubmitButton className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
          Add
        </SubmitButton>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-2 rounded-full bg-slate-800/60 px-3 py-1 text-xs text-slate-300"
          >
            {c.name}
            <button
              onClick={() => {
                if (confirm(`Delete category "${c.name}"?`)) {
                  startTransition(() => deleteCategoryAction(c.id));
                }
              }}
              className="text-slate-500 hover:text-red-400"
            >
              ✕
            </button>
          </span>
        ))}
        {categories.length === 0 && <p className="text-xs text-slate-500">No categories yet.</p>}
      </div>
    </div>
  );
}

function ItemModal({
  item,
  categories,
  onClose,
}: {
  item: InventoryItemRow | null;
  categories: CategoryRow[];
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(upsertInventoryItemAction, emptyState);

  useEffect(() => {
    if (state?.success) {
      const timeout = setTimeout(onClose, 600);
      return () => clearTimeout(timeout);
    }
  }, [state?.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{item ? "Edit item" : "Add new item"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            ✕
          </button>
        </div>
        {state?.error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {state.success}
          </p>
        )}
        <form action={formAction} className="mt-4 space-y-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Item name *</label>
              <input
                name="name"
                required
                defaultValue={item?.name}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">SKU</label>
              <input
                name="sku"
                defaultValue={item?.sku ?? ""}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Category</label>
            <select
              name="categoryId"
              defaultValue={item?.categoryId ?? ""}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Description</label>
            <textarea
              name="description"
              defaultValue={item?.description ?? ""}
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Price *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={item?.price ?? "0.00"}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Cost</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item?.cost ?? "0.00"}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Stock qty</label>
              <input
                name="quantity"
                type="number"
                step="1"
                min="0"
                defaultValue={item?.quantity ?? "0"}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Low stock alert</label>
              <input
                name="lowStockThreshold"
                type="number"
                step="1"
                min="0"
                defaultValue={item?.lowStockThreshold ?? "5"}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                name="trackInventory"
                defaultChecked={item?.trackInventory ?? true}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-amber-500"
              />
              Track inventory
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={item?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-amber-500"
              />
              Active / visible on POS
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              Cancel
            </button>
            <SubmitButton pendingText="Saving…">{item ? "Save changes" : "Add item"}</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
