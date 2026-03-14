import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { StatusBadge, TypeBadge } from "../components/StatusBadge";
import { useAuth } from "../AuthContext";

const BASE_KPI_META = [
  { key: "totalInStock", label: "Total In Stock", icon: "INV" },
  { key: "lowStockCount", label: "Low Stock Items", icon: "LOW" },
  { key: "outOfStockCount", label: "Out of Stock", icon: "OOS" },
  { key: "pendingReceipts", label: "Pending Receipts", icon: "RCV" },
  { key: "pendingDeliveries", label: "Pending Deliveries", icon: "DLV" },
  { key: "outForDelivery", label: "Out For Delivery", icon: "OFD" },
];

const MANAGER_PROFIT_KPIS = [
  { key: "todayProfit", label: "Today's Profit", icon: "TOD" },
  { key: "monthProfit", label: "This Month Profit", icon: "MON" },
  { key: "totalProfit", label: "Total Realized Profit", icon: "PFT" },
];

const PROFIT_DAYS = 7;

const formatCurrency = (value) => Number(value || 0).toFixed(2);

function buildProfitTrend(operations) {
  const bucket = new Map();
  for (let i = PROFIT_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    bucket.set(key, 0);
  }

  operations
    .filter((op) => op.type === "Delivery" && ["Approved", "Done"].includes(op.status))
    .forEach((op) => {
      const key = (op.approved_at || op.updated_at || op.created_at || "").slice(0, 10);
      if (!bucket.has(key)) return;
      const opProfit = (op.items || []).reduce(
        (sum, item) => sum + (Number(item.selling_price || 0) - Number(item.cost_price || 0)) * Number(item.quantity || 0),
        0
      );
      bucket.set(key, bucket.get(key) + opProfit);
    });

  return [...bucket.entries()].map(([date, value]) => ({ label: date.slice(5), value: Number(value.toFixed(2)) }));
}

function buildTypeMix(operations) {
  const map = new Map();
  operations.forEach((op) => map.set(op.type, (map.get(op.type) || 0) + 1));
  return ["Receipt", "Delivery", "Internal", "Adjustment"].map((type) => ({ label: type, value: map.get(type) || 0 }));
}

function SimpleBarChart({ title, rows, emptyText }) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      {max === 0 ? (
        <div className="chart-empty">{emptyText}</div>
      ) : (
        <div className="bar-chart">
          {rows.map((row) => {
            const widthPct = max ? Math.max((row.value / max) * 100, 8) : 0;
            return (
              <div key={row.label} className="bar-row">
                <div className="bar-label">{row.label}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${widthPct}%` }} />
                </div>
                <div className="bar-value">{row.value}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfitLineChart({ rows }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const points = rows
    .map((row, idx) => {
      const x = (idx / Math.max(rows.length - 1, 1)) * 100;
      const y = 100 - (row.value / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="chart-card">
      <div className="chart-title">Profit Trend (Last 7 Days)</div>
      <div className="line-chart-wrap">
        <svg viewBox="0 0 100 100" className="line-chart" preserveAspectRatio="none">
          <polyline points="0,100 100,100" className="line-axis" />
          <polyline points={points} className="line-main" />
        </svg>
      </div>
      <div className="line-labels">
        {rows.map((r) => (
          <div key={r.label} className="line-day">
            <span>{r.label}</span>
            <strong>{formatCurrency(r.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isManager } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [managerProfitTrend, setManagerProfitTrend] = useState([]);
  const [operationTypeMix, setOperationTypeMix] = useState([]);
  const [staffQueueBreakdown, setStaffQueueBreakdown] = useState([]);
  const [filters, setFilters] = useState({ type: "", status: "", warehouseId: "", categoryId: "" });
  const [liveConnected, setLiveConnected] = useState(false);

  const load = async (f = filters) => {
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ""));
    const requests = [
      api.get("/dashboard", { params }),
      api.get("/warehouses"),
      api.get("/categories"),
      api.get("/operations", { params: { limit: 150 } }),
    ];

    if (!isManager) {
      requests.push(api.get("/operations/staff-queue"));
    }

    const [dashboardRes, warehouseRes, categoryRes, operationsRes, queueRes] = await Promise.all(requests);
    const d = dashboardRes.data;
    const ws = warehouseRes.data;
    const cs = categoryRes.data;
    const ops = operationsRes.data;

    setDashboard(d);
    setWarehouses(ws);
    setCategories(cs);
    setOperationTypeMix(buildTypeMix(ops));

    if (isManager) {
      setManagerProfitTrend(buildProfitTrend(ops));
      setStaffQueueBreakdown([]);
    } else {
      const queue = queueRes?.data || { pendingReceipts: [], pendingDeliveries: [] };
      setStaffQueueBreakdown([
        { label: "Pending Receipts", value: queue.pendingReceipts.length },
        { label: "Pending Deliveries", value: queue.pendingDeliveries.length },
      ]);
      setManagerProfitTrend([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("ims_token");
    if (!token) return;

    const streamUrl = `${api.defaults.baseURL}/stream?token=${encodeURIComponent(token)}`;
    const stream = new EventSource(streamUrl);

    stream.addEventListener("connected", () => setLiveConnected(true));
    stream.addEventListener("heartbeat", () => setLiveConnected(true));

    const refreshEvents = ["stock.changed", "operation.changed", "product.changed", "location.changed", "warehouse.changed", "category.changed"];
    const handlers = refreshEvents.map((evt) => {
      const fn = () => load();
      stream.addEventListener(evt, fn);
      return { evt, fn };
    });

    stream.onerror = () => setLiveConnected(false);

    return () => {
      handlers.forEach(({ evt, fn }) => stream.removeEventListener(evt, fn));
      stream.close();
    };
  }, []);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    load(next);
  };

  const kpis = useMemo(() => {
    if (!dashboard) return [];
    const meta = isManager ? [...BASE_KPI_META, ...MANAGER_PROFIT_KPIS] : BASE_KPI_META;
    return meta.map((m) => ({
      ...m,
      value: ["todayProfit", "monthProfit", "totalProfit"].includes(m.key)
        ? Number(dashboard.kpis[m.key] ?? 0).toFixed(2)
        : dashboard.kpis[m.key] ?? 0,
    }));
  }, [dashboard, isManager]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Dashboard</h1>
          <p className="page-subtitle">Real-time snapshot of stock health and pending operations.</p>
        </div>
        <div>
          <span className={`badge ${liveConnected ? "badge-Done" : "badge-Waiting"}`}>
            {liveConnected ? "Live: Connected" : "Live: Reconnecting"}
          </span>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="kpi-card" key={k.key}>
            <div className="kpi-icon kpi-text-icon">{k.icon}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        {isManager && managerProfitTrend.length > 0 && <ProfitLineChart rows={managerProfitTrend} />}
        <SimpleBarChart
          title="Operations Mix"
          rows={operationTypeMix}
          emptyText="No operations available for chart"
        />
        {!isManager && (
          <SimpleBarChart
            title="Staff Work Queue"
            rows={staffQueueBreakdown}
            emptyText="No pending queues"
          />
        )}
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={filters.type} onChange={(e) => updateFilter("type", e.target.value)}>
          <option value="">All Types</option>
          <option value="Receipt">Receipt</option>
          <option value="Delivery">Delivery</option>
          <option value="Internal">Internal</option>
          <option value="Adjustment">Adjustment</option>
        </select>
        <select className="filter-select" value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
          <option value="">All Statuses</option>
          {["Draft", "Waiting", "Ready", "OutForDelivery", "Delivered", "Approved", "Done", "Canceled"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="filter-select" value={filters.warehouseId} onChange={(e) => updateFilter("warehouseId", e.target.value)}>
          <option value="">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <select className="filter-select" value={filters.categoryId} onChange={(e) => updateFilter("categoryId", e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">Recent Operations</span>
          <span className="text-muted text-sm">{dashboard?.operations?.length ?? 0} records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Status</th>
                <th>From</th>
                <th>To</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.operations?.length ? (
                dashboard.operations.map((op) => (
                  <tr key={op.id}>
                    <td className="text-muted text-sm">{op.id}</td>
                    <td>
                      <TypeBadge type={op.type} />
                    </td>
                    <td>
                      <StatusBadge status={op.status} />
                    </td>
                    <td>{op.source_location_name || <span className="text-subtle">-</span>}</td>
                    <td>{op.destination_location_name || <span className="text-subtle">-</span>}</td>
                    <td className="text-muted text-sm">{new Date(op.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">OPS</div>
                      No operations found
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
