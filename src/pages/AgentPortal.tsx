import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Sale = Tables<"sales">;

export default function AgentPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [rate, setRate] = useState("");

  const amount = (parseFloat(quantityKg) || 0) * (parseFloat(rate) || 0);

  const fetchSales = async () => {
    const { data } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setSales(data);
  };

  useEffect(() => {
    fetchSales();

    const channel = supabase
      .channel("agent-sales")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        fetchSales();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase.from("sales").insert({
      agent_id: user.id,
      customer_name: customerName.trim(),
      quantity_kg: parseFloat(quantityKg),
      rate: parseFloat(rate),
      amount: parseFloat(quantityKg) * parseFloat(rate),
      payment_method: "DTB Bank",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sale recorded!" });
      setCustomerName("");
      setQuantityKg("");
      setRate("");
      setShowForm(false);
    }
    setSubmitting(false);
  };

  const statusColor = (s: string) => {
    if (s === "confirmed") return "bg-success text-success-foreground";
    if (s === "rejected") return "bg-destructive text-destructive-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sales</h2>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="mr-1 h-4 w-4" /> New Sale
          </Button>
        </div>

        {showForm && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base">Record New Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Customer Name</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="Customer name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Quantity (KG)</Label>
                  <Input type="number" step="0.01" min="0.01" value={quantityKg} onChange={(e) => setQuantityKg(e.target.value)} required placeholder="e.g. 13" />
                </div>
                <div className="space-y-1.5">
                  <Label>Rate (per KG)</Label>
                  <Input type="number" step="0.01" min="0.01" value={rate} onChange={(e) => setRate(e.target.value)} required placeholder="e.g. 250" />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input value={amount > 0 ? amount.toFixed(2) : ""} readOnly className="bg-muted" placeholder="Auto-calculated" />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Input value="DTB Bank" readOnly className="bg-muted" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={submitting} className="w-full">
                    <Send className="mr-1 h-4 w-4" /> {submitting ? "Saving..." : "Submit Sale"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Customer</th>
                <th className="px-3 py-2 text-right font-medium">KG</th>
                <th className="px-3 py-2 text-right font-medium">Rate</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 text-center font-medium">Payment</th>
                <th className="px-3 py-2 text-center font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    No sales yet. Click "New Sale" to get started.
                  </td>
                </tr>
              )}
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium">{sale.customer_name}</td>
                  <td className="px-3 py-2 text-right">{sale.quantity_kg}</td>
                  <td className="px-3 py-2 text-right">{sale.rate}</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(sale.amount).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center text-xs">{sale.payment_method}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="secondary" className={`text-xs ${statusColor(sale.payment_status)}`}>
                      {sale.payment_status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
