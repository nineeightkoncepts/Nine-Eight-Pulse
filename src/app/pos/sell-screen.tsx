"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeOrderAction } from "@/lib/actions/pos-actions";
import { closeTillSessionAction } from "@/lib/actions/tills-actions";
import { formatMoney } from "@/lib/format";

interface ItemOption {
  id: number;
  name: string;
  price: string;
  quantity: string;
  trackInventory: boolean;
  categoryId: number | null;
}
interface CategoryOption {
  id: number;
  name: string;
}
interface CartEntry {
  item: ItemOption;
  qty: number;
}

export function SellScreen({
  sessionId,
  tillName,
  items,
  categories,
  currency,
  taxRate,
}: {
  sessionId: number;
  tillName: string;
  items: ItemOption[];
  categories: CategoryOption[];
  currency: string;
  taxRate: number;
}) {
  const [cart, setCart] = useState<Record<number, CartEntry>>({});
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile_money" | "other">("cash");
  const [customerName, setCustomerName] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [closing, setClosing] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchesCategory = activeCategory === "all" || i.categoryId === activeCategory;
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, search]);

  const cartLines = Object.values(cart);
  const subtotal = cartLines.reduce((sum, l) => sum + Number(l.item.price) * l.qty, 0);
  const taxTotal = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxTotal) * 100) / 100;

  function addToCart(item: ItemOption) {
    setCart((prev) => {
      const existing = prev[item.id];
      const nextQty = (existing?.qty ?? 0) + 1;
      if (item.trackInventory && nextQty > Number(item.quantity)) {
        setMessage({ type: "error", text: `Only ${item.quantity} left of "${item.name}".` });
        return prev;
      }
      return { ...prev, [item.id]: { item, qty: nextQty } };
    });
  }

  function changeQty(itemId: number, delta: number) {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const nextQty = existing.qty + delta;
      if (nextQty <= 0) {
        const rest = { ...prev };
        delete rest[itemId];
        return rest;
      }
      if (existing.item.trackInventory && nextQty > Number(existing.item.quantity)) {
        return prev;
      }
      return { ...prev, [itemId]: { ...existing, qty: nextQty } };
    });
  }

  function clearCart() {
    setCart({});
    setCustomerName("");
  }

  function checkout() {
    if (cartLines.length === 0) {
      setMessage({ type: "error", text: "Add at least one item to the cart." });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await placeOrderAction(
        sessionId,
        cartLines.map((l) => ({ inventoryItemId: l.item.id, quantity: l.qty })),
        paymentMethod,
        customerName || undefined,
      );
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: `Order ${result.orderNumber} completed!` });
      clearCart();
      router.refresh();
    });
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">{tillName}</h1>
            <p className="text-xs text-slate-500">Select items to add to the cart</p>
          </div>
          <button
            onClick={() => setClosing(true)}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10"
          >
            Close till
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              activeCategory === "all" ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                activeCategory === c.id ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const outOfStock = item.trackInventory && Number(item.quantity) <= 0;
            return (
              <button
                key={item.id}
                disabled={outOfStock}
                onClick={() => addToCart(item)}
                className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:border-amber-500/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="mt-1 text-sm text-amber-400">{formatMoney(item.price, currency)}</p>
                {item.trackInventory && (
                  <p className="mt-1 text-[11px] text-slate-500">{item.quantity} in stock</p>
                )}
                {outOfStock && <p className="mt-1 text-[11px] font-medium text-red-400">Out of stock</p>}
              </button>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-slate-500">No items found.</p>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col border-t border-slate-900 bg-slate-950/80 p-5 lg:w-96 lg:border-l lg:border-t-0">
        <h2 className="text-lg font-semibold text-white">Current order</h2>
        <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
          {cartLines.map((l) => (
            <div key={l.item.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <div>
                <p className="text-sm font-medium text-white">{l.item.name}</p>
                <p className="text-xs text-slate-500">{formatMoney(l.item.price, currency)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeQty(l.item.id, -1)}
                  className="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm text-white">{l.qty}</span>
                <button
                  onClick={() => changeQty(l.item.id, 1)}
                  className="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500"
                >
                  +
                </button>
              </div>
            </div>
          ))}
          {cartLines.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Cart is empty</p>}
        </div>

        <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Tax ({taxRate}%)</span>
            <span>{formatMoney(taxTotal, currency)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-white">
            <span>Total</span>
            <span>{formatMoney(total, currency)}</span>
          </div>
        </div>

        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name (optional)"
          className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
        />

        <div className="mt-3 grid grid-cols-4 gap-2">
          {(["cash", "card", "mobile_money", "other"] as const).map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`rounded-lg border px-2 py-2 text-[11px] font-medium capitalize ${
                paymentMethod === method
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              {method.replace("_", " ")}
            </button>
          ))}
        </div>

        {message && (
          <p className={`mt-3 text-sm ${message.type === "error" ? "text-red-400" : "text-emerald-400"}`}>
            {message.text}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={clearCart}
            className="flex-1 rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:border-slate-500"
          >
            Clear
          </button>
          <button
            onClick={checkout}
            disabled={pending}
            className="flex-[2] rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Processing…" : `Charge ${formatMoney(total, currency)}`}
          </button>
        </div>
      </div>

      {closing && <CloseTillModal sessionId={sessionId} currency={currency} onClose={() => setClosing(false)} />}
    </div>
  );
}

function CloseTillModal({
  sessionId,
  currency,
  onClose,
}: {
  sessionId: number;
  currency: string;
  onClose: () => void;
}) {
  const [closingCash, setClosingCash] = useState("0.00");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await closeTillSessionAction(sessionId, Number(closingCash) || 0, note || undefined);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white">Close till</h3>
        <p className="mt-1 text-sm text-slate-400">Count the cash in the drawer and enter the amount below.</p>
        <label className="mb-1 mt-4 block text-sm font-medium text-slate-300">
          Closing cash ({currency})
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={closingCash}
          onChange={(e) => setClosingCash(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
        />
        <label className="mb-1 mt-3 block text-sm font-medium text-slate-300">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:border-slate-500"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Closing…" : "Close till"}
          </button>
        </div>
      </div>
    </div>
  );
}
