import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, TrendingUp, Package, DollarSign, Calendar } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Sale = Tables<"sales">;

type Period = "today" | "week" | "month";

function getStartDate(period: Period): Date {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default function AdminPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<Period>("today");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSales = async () => {
    const { data } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSales(data);
  };

  useEffect(() => {
    fetchSales();

    const channel = supabase
      .channel("admin-sales")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        fetchSales();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredSales = useMemo(() => {
    const start = getStartDate(period);
    return sales.filter((s) => new Date(s.created_at) >= start);
  }, [sales, period]);

  const stats = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalAmount = filteredSales.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalKg = filteredSales.reduce((sum, s) => sum + Number(s.quantity_kg), 0);
    const confirmedCount = filteredSales.filter((s) => s.payment_status === "confirmed").length;
    const pendingCount = filteredSales.filter((s) => s.payment_status === "pending").length;
    return { totalSales, totalAmount, totalKg, confirmedCount, pendingCount };
  }, [filteredSales]);

  const handleConfirm = async (saleId: string, status: "confirmed" | "rejected") => {
    if (!user) return;
    setUpdating(saleId);
    const { error } = await supabase
      .from("sales")
      .update({ payment_status: status, confirmed_by: user.id })
      .eq("id", saleId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Payment ${status}` });
    }
    setUpdating(null);
  };

  const statusColor = (s: string) => {
    if (s === "confirmed") return "bg-success text-success-foreground";
    if (s === "rejected") return "bg-destructive text-destructive-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl p-4 space-y-4">
        {/* Period filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {(["today", "week", "month"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="capitalize"
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </Button>
          ))}
        </div>

        {/* Stats cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-xl font-bold">{stats.totalSales}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                <DollarSign className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">{stats.totalAmount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total KG Sold</p>
                <p className="text-xl font-bold">{stats.totalKg.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <CheckCircle className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{stats.pendingCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales table */}
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
                <th className="px-3 py-2 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    No sales for this period.
                  </td>
                </tr>
              )}
              {filteredSales.map((sale) => (
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
                  <td className="px-3 py-2 text-center">
                    {sale.payment_status === "pending" && (
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-success hover:text-success"
                          disabled={updating === sale.id}
                          onClick={() => handleConfirm(sale.id, "confirmed")}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          disabled={updating === sale.id}
                          onClick={() => handleConfirm(sale.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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
