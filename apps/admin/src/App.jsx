import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import {
  Boxes,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Tag,
  TicketPercent,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  adjustAdminInventory,
  deleteAdminRecord,
  loadAdminData,
  loadAdminCustomerPage,
  loadAdminOrderPage,
  loadAdminProductPage,
  refreshAdminSession,
  requestApi,
  saveAdminRecord,
} from "./services/api.js";

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "on-hold",
];
const emptyData = {
  dashboard: {},
  products: [],
  orders: [],
  ordersPagination: { page: 1, pages: 1, total: 0 },
  customers: [],
  customersPagination: { page: 1, pages: 1, total: 0 },
  productsPagination: { page: 1, pages: 1, total: 0 },
  reviews: [],
  coupons: [],
  inventory: [],
  categories: [],
  brands: [],
  banners: [],
};

const navigation = [
  { to: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "পণ্য", icon: Package },
  { to: "/admin/categories", label: "ক্যাটাগরি", icon: Boxes },
  { to: "/admin/brands", label: "ব্র্যান্ড", icon: Tag },
  { to: "/admin/banners", label: "ব্যানার", icon: ImageIcon },
  { to: "/admin/orders", label: "অর্ডার", icon: ShoppingCart },
  { to: "/admin/customers", label: "ক্রেতা", icon: Users },
  { to: "/admin/inventory", label: "ইনভেন্টরি", icon: Boxes },
  { to: "/admin/reviews", label: "রিভিউ", icon: Star },
  { to: "/admin/coupons", label: "কুপন", icon: TicketPercent },
  { to: "/admin/site-content", label: "ওয়েবসাইটের লেখা", icon: ImageIcon },
];

const money = (amount) => `৳${Number(amount || 0).toLocaleString("bn-BD")}`;

function useAdminData(request, enabled) {
  const [data, setData] = useState(emptyData);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadAdminData(request));
      setNotice(null);
      setLoadError(false);
      return true;
    } catch (error) {
      setNotice({
        message: `Store data could not be loaded: ${error.message}`,
        type: "error",
      });
      setLoadError(true);
      return false;
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [request]);

  useEffect(() => {
    if (!enabled) {
      setData(emptyData);
      setReady(false);
      return;
    }
    reload();
  }, [enabled, reload]);

  async function save(collection, record) {
    try {
      await saveAdminRecord(collection, record, request);
      if (await reload())
        setNotice({
          message: "পরিবর্তন স্টোর ডাটাবেজে সংরক্ষিত হয়েছে।",
          type: "success",
        });
    } catch (error) {
      setNotice({
        message: `Could not save changes: ${error.message}`,
        type: "error",
      });
    }
  }

  async function remove(collection, record) {
    try {
      await deleteAdminRecord(collection, record, request);
      if (await reload()) {
        const messages = {
          products:
            "পণ্যটি স্টোরফ্রন্ট থেকে লুকানো হয়েছে। অ্যাডমিন থেকে নিষ্ক্রিয় অবস্থায় ফিরিয়ে আনতে পারবেন।",
          categories:
            "ক্যাটাগরিটি স্টোরফ্রন্ট থেকে লুকানো হয়েছে। অ্যাডমিন থেকে নিষ্ক্রিয় অবস্থায় ফিরিয়ে আনতে পারবেন।",
          brands: "ব্র্যান্ডটি স্টোর ক্যাটালগে নিষ্ক্রিয় করা হয়েছে।",
          reviews: "রিভিউ মুছে ফেলা হয়েছে।",
          coupons: "কুপন মুছে ফেলা হয়েছে।",
        };
        setNotice({
          message: messages[collection] || "আইটেম সরানো হয়েছে।",
          type: "success",
        });
      }
    } catch (error) {
      setNotice({
        message: `Could not remove item: ${error.message}`,
        type: "error",
      });
    }
  }

  async function adjustInventory(product, quantity, note) {
    try {
      await adjustAdminInventory(product, quantity, note, request);
      if (await reload())
        setNotice({ message: "স্টকের সমন্বয় সংরক্ষিত হয়েছে।", type: "success" });
    } catch (error) {
      setNotice({
        message: `Could not adjust inventory: ${error.message}`,
        type: "error",
      });
    }
  }

  return {
    data,
    save,
    remove,
    adjustInventory,
    notice,
    setNotice,
    ready,
    loading,
    loadError,
    reload,
  };
}

function FormDialog({ title, fields, initial, onClose, onSubmit }) {
  const [imagePreview, setImagePreview] = useState(initial.image || "");
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);

  function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    for (const field of fields) {
      if (field.type === "number")
        values[field.name] = Number(values[field.name] || 0);
      if (field.type === "boolean")
        values[field.name] = values[field.name] === "true";
    }
    onSubmit({ ...initial, ...values });
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-header">
          <h2 id="dialog-title">{title}</h2>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-fields">
            {fields.map((field) => (
              <label
                className={field.wide ? "form-field wide" : "form-field"}
                key={field.name}
              >
                <span>{field.label}</span>
                {field.type === "select" || field.type === "boolean" ? (
                  <select
                    name={field.name}
                    defaultValue={String(
                      initial[field.name] ?? field.defaultValue ?? "",
                    )}
                    required={field.required}
                  >
                    {field.type === "select" &&
                      (field.required ? (
                        <option value="" disabled>
                          একটি অপশন নির্বাচন করুন
                        </option>
                      ) : (
                        <option value="">কোনোটিই নয়</option>
                      ))}
                    {(field.type === "boolean"
                      ? [
                          { value: "true", label: field.trueLabel || "হ্যাঁ" },
                          { value: "false", label: field.falseLabel || "না" },
                        ]
                      : field.options
                    ).map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    rows="3"
                    defaultValue={initial[field.name] ?? ""}
                    required={field.required}
                  />
                ) : field.type === "image" ? (
                  <>
                    <input
                      name={field.name}
                      type="text"
                      defaultValue={
                        initial[field.name] ?? field.defaultValue ?? ""
                      }
                      placeholder={
                        field.placeholder ||
                        "https://... or /products/image.jpg"
                      }
                      autoComplete="url"
                      onChange={(event) => {
                        setImagePreview(event.target.value.trim());
                        setImagePreviewFailed(false);
                      }}
                    />
                    <span className="form-image-preview">
                      {imagePreview && !imagePreviewFailed ? (
                        <img
                          src={imagePreview}
                          alt="ছবির প্রিভিউ"
                          onError={() => setImagePreviewFailed(true)}
                        />
                      ) : (
                        <ImageIcon size={22} aria-hidden="true" />
                      )}
                    </span>
                    {field.helpText && (
                      <small className="form-help">{field.helpText}</small>
                    )}
                  </>
                ) : (
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    min={field.min}
                    step={field.step}
                    defaultValue={
                      initial[field.name] ?? field.defaultValue ?? ""
                    }
                    required={field.required}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="dialog-actions">
            <button
              className="button secondary"
              type="button"
              onClick={onClose}
            >
              বাতিল
            </button>
            <button className="button primary" type="submit">
              পরিবর্তন সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DataPage({
  title,
  description,
  rows,
  fields,
  columns,
  onSave,
  onDelete,
  onRestore,
  emptyText = "কোনো রেকর্ড পাওয়া যায়নি।",
  initialPagination,
  fetchPage,
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [remoteRows, setRemoteRows] = useState(rows);
  const [remotePagination, setRemotePagination] = useState(initialPagination);
  const [remotePage, setRemotePage] = useState(1);
  const [remoteQuery, setRemoteQuery] = useState("");
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const [retryPage, setRetryPage] = useState(0);
  const fetchPageRef = useRef(fetchPage);
  const skipInitialFetch = useRef(Boolean(fetchPage));
  fetchPageRef.current = fetchPage;
  const itemName = title === "ক্যাটাগরি" ? "ক্যাটাগরি" : title.slice(0, -1);
  const filteredRows = useMemo(
    () =>
      fetchPage
        ? remoteRows
        : rows.filter((row) =>
            Object.values(row)
              .join(" ")
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
          ),
    [fetchPage, query, remoteRows, rows],
  );
  const rowCount = fetchPage
    ? (remotePagination?.total ?? filteredRows.length)
    : filteredRows.length;

  useEffect(() => {
    setRemoteRows(rows);
    setRemotePagination(initialPagination);
    setRemotePage(1);
  }, [initialPagination, rows]);

  useEffect(() => {
    if (!fetchPage) return undefined;
    const timeout = setTimeout(() => {
      const nextQuery = query.trim();
      if (nextQuery !== remoteQuery) {
        setRemotePage(1);
        setRemoteQuery(nextQuery);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, remoteQuery]);

  useEffect(() => {
    if (!fetchPage) return undefined;
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return undefined;
    }
    let active = true;
    setRemoteLoading(true);
    setRemoteError("");
    fetchPageRef
      .current(remotePage, remoteQuery)
      .then((result) => {
        if (!active) return;
        setRemoteRows(result.rows);
        setRemotePagination(result.pagination);
      })
      .catch((error) => {
        if (active)
          setRemoteError(
            `Could not load ${title.toLowerCase()}: ${error.message}`,
          );
      })
      .finally(() => {
        if (active) setRemoteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [remotePage, remoteQuery, retryPage, title]);

  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">স্টোর ব্যবস্থাপনা</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        {fields && (
          <button className="button primary" onClick={() => setEditing({})}>
            <Plus size={17} />
            Add {itemName}
          </button>
        )}
      </div>
      <section className="panel data-panel">
        <div className="table-toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              aria-label={`Search ${title}`}
            />
          </label>
          <span className="row-count">
            {remoteLoading
              ? "লোড হচ্ছে..."
              : `${rowCount} ${rowCount === 1 ? "record" : "records"}`}
          </span>
        </div>
        {remoteError && (
          <div className="notice error" role="alert">
            <span>{remoteError}</span>
            <button
              className="notice-retry"
              onClick={() => setRetryPage((key) => key + 1)}
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.label}>{column.label}</th>
                ))}
                {(fields || onDelete || onRestore) && (
                  <th className="actions-heading">কার্যক্রম</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.label}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                  {(fields || onDelete || onRestore) && (
                    <td className="actions-cell">
                      {fields && (
                        <button
                          className="icon-button"
                          aria-label={`Edit ${itemName}`}
                          onClick={() => setEditing(row)}
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {onRestore && !row.isActive && (
                        <button
                          className="button small secondary"
                          onClick={() => onRestore(row)}
                        >
                          পুনরুদ্ধার
                        </button>
                      )}
                      {onDelete && (!onRestore || row.isActive) && (
                        <button
                          className="icon-button danger"
                          aria-label={
                            onRestore
                              ? `Remove ${itemName} from storefront`
                              : `Delete ${itemName}`
                          }
                          title={
                            onRestore
                              ? `Remove ${itemName} from storefront`
                              : `Delete ${itemName}`
                          }
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    className="empty-cell"
                    colSpan={
                      columns.length + (fields || onDelete || onRestore ? 1 : 0)
                    }
                  >
                    {query.trim()
                      ? `No ${title.toLowerCase()} match your search.`
                      : emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {fetchPage && remotePagination?.pages > 1 && (
        <nav className="catalog-pagination" aria-label={`${title} pages`}>
          <button
            className="page-button page-direction"
            type="button"
            disabled={remotePage <= 1 || remoteLoading}
            onClick={() => setRemotePage((page) => page - 1)}
          >
            আগের
          </button>
          <span className="row-count" aria-live="polite">
            Page {remotePage} of {remotePagination.pages}
          </span>
          <button
            className="page-button page-direction"
            type="button"
            disabled={remotePage >= remotePagination.pages || remoteLoading}
            onClick={() => setRemotePage((page) => page + 1)}
          >
            পরের
          </button>
        </nav>
      )}
      {editing && (
        <FormDialog
          title={`${editing.id ? "সম্পাদনা" : "যোগ করুন"} ${itemName}`}
          fields={fields}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(record) => {
            onSave(record);
            setEditing(null);
          }}
        />
      )}
    </main>
  );
}

function StatusBadge({ children, tone }) {
  const labels = {
    pending: "অপেক্ষমাণ",
    confirmed: "নিশ্চিত",
    processing: "প্রক্রিয়াধীন",
    shipped: "পাঠানো হয়েছে",
    delivered: "ডেলিভারি সম্পন্ন",
    cancelled: "বাতিল",
    "on-hold": "স্থগিত",
    paid: "পরিশোধিত",
    unpaid: "অপরিশোধিত",
    failed: "ব্যর্থ",
    refunded: "ফেরত দেওয়া হয়েছে",
    approved: "অনুমোদিত",
    rejected: "প্রত্যাখ্যাত",
    active: "সক্রিয়",
    inactive: "নিষ্ক্রিয়",
  };
  const label = labels[String(children).toLowerCase()] || children;
  return (
    <span className={`badge ${tone || String(children).toLowerCase()}`}>
      {label}
    </span>
  );
}

function Dashboard({ data }) {
  const revenue =
    data.dashboard.paidRevenue ??
    data.orders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((total, order) => total + Number(order.total || 0), 0);
  const lowStock =
    data.dashboard.lowStockProducts ||
    data.products.filter((product) => Number(product.stock) < 10);
  const stats = [
    { label: "পরিশোধিত আয়", value: money(revenue), icon: "৳", tone: "purple" },
    {
      label: "মোট অর্ডার",
      value: data.dashboard.orders ?? data.orders.length,
      icon: "↗",
      tone: "blue",
    },
    {
      label: "ক্রেতা",
      value: data.dashboard.customers ?? data.customers.length,
      icon: "◉",
      tone: "green",
    },
    {
      label: "কম স্টকের পণ্য",
      value: data.dashboard.lowStock ?? lowStock.length,
      icon: "!",
      tone: "orange",
    },
  ];

  return (
    <main>
      <div className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">স্টোরের সারসংক্ষেপ</p>
          <h1>ড্যাশবোর্ড</h1>
          <p className="page-description">
            বিক্রয়, অর্ডার ও মজুতের অবস্থা এক নজরে দেখুন।
          </p>
        </div>
        <span className="dashboard-heading-mark">
          ইলেক্ট্রোস্টোর <b>অ্যাডমিন</b>
        </span>
      </div>
      <div className="stats">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <div className={`stat-icon ${stat.tone}`}>{stat.icon}</div>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>সাম্প্রতিক অর্ডার</h2>
              <p>আপনার স্টোরের সর্বশেষ কার্যক্রম</p>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>অর্ডার</th>
                  <th>ক্রেতা</th>
                  <th>মোট</th>
                  <th>অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className="emphasis">
                      {order.orderNumber || order.id}
                    </td>
                    <td>{order.customer}</td>
                    <td>{money(order.total)}</td>
                    <td>
                      <StatusBadge>{order.orderStatus}</StatusBadge>
                    </td>
                  </tr>
                ))}
                {data.orders.length === 0 && (
                  <tr>
                    <td className="empty-cell" colSpan="4">
                      এখনও কোনো অর্ডার নেই।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>স্টকের দিকে নজর দিন</h2>
              <p>১০টির কম স্টক থাকা পণ্য</p>
            </div>
          </div>
          <div className="stock-list">
            {lowStock.map((product) => (
              <div className="stock-item" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku}</span>
                </div>
                <StatusBadge tone="warning">{product.stock} left</StatusBadge>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="empty-message">
                সব পণ্যের স্টক পর্যাপ্ত।
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function OrdersPage({ data, save, request }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const trackingFields = [
    {
      name: "orderStatus",
      label: "অর্ডার পূরণের অবস্থা",
      type: "select",
      required: true,
      options: orderStatuses.map((status) => ({
        value: status,
        label: status.replace("-", " "),
      })),
    },
    { name: "carrier", label: "ডেলিভারি কুরিয়ার" },
    { name: "trackingNumber", label: "ট্র্যাকিং নম্বর" },
    { name: "trackingUrl", label: "ট্র্যাকিং লিংক", type: "url", wide: true },
    { name: "notes", label: "ক্রেতার আপডেট", type: "textarea", wide: true },
  ];
  return (
    <>
      <DataPage
        title="অর্ডার"
        description="অর্ডার যাচাই করুন এবং ডেলিভারির অবস্থা আপডেট রাখুন।"
        rows={data.orders}
        initialPagination={data.ordersPagination}
        fetchPage={(page, query) => loadAdminOrderPage(page, query, request)}
        columns={[
          {
            label: "অর্ডার",
            key: "orderNumber",
            render: (row) => (
              <span className="emphasis">{row.orderNumber || row.id}</span>
            ),
          },
          { label: "ক্রেতা", key: "customer" },
          { label: "তারিখ", key: "createdAt" },
          { label: "মোট", render: (row) => money(row.total) },
          {
            label: "পেমেন্ট",
            render: (row) => <StatusBadge>{row.paymentStatus}</StatusBadge>,
          },
          {
            label: "অর্ডার পূরণ",
            render: (row) => (
              <StatusBadge
                tone={
                  row.orderStatus === "on-hold" ? "warning" : row.orderStatus
                }
              >
                {row.orderStatus.replace("-", " ")}
              </StatusBadge>
            ),
          },
          {
            label: "ট্র্যাকিং",
            render: (row) => row.tracking.trackingNumber || "যোগ করা হয়নি",
          },
          {
            label: "ব্যবস্থাপনা",
            render: (row) => (
              <button
                className="button small secondary"
                onClick={() => setSelectedOrder({ ...row, managing: true })}
              >
                ব্যবস্থাপনা
              </button>
            ),
          },
          {
            label: "বিস্তারিত",
            render: (row) => (
              <button
                className="button small secondary"
                onClick={() => setSelectedOrder({ ...row, managing: false })}
              >
                দেখুন
              </button>
            ),
          },
        ]}
      />
      {selectedOrder?.managing && (
        <FormDialog
          title={`Manage order ${selectedOrder.orderNumber}`}
          fields={trackingFields}
          initial={{
            orderStatus: selectedOrder.orderStatus,
            ...selectedOrder.tracking,
          }}
          onClose={() => setSelectedOrder(null)}
          onSubmit={(values) => {
            save("orders", {
              ...selectedOrder,
              orderStatus: values.orderStatus,
              tracking: {
                carrier: values.carrier,
                trackingNumber: values.trackingNumber,
                trackingUrl: values.trackingUrl,
                notes: values.notes,
              },
            });
            setSelectedOrder(null);
          }}
        />
      )}
      {selectedOrder && !selectedOrder.managing && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}
        >
          <section
            className="dialog order-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-dialog-title"
          >
            <div className="dialog-header">
              <h2 id="order-dialog-title">Order {selectedOrder.orderNumber}</h2>
              <button
                className="icon-button"
                onClick={() => setSelectedOrder(null)}
                aria-label="অর্ডারের বিস্তারিত বন্ধ করুন"
              >
                <X size={19} />
              </button>
            </div>
            <div className="order-detail-content">
              <p>
                <strong>ক্রেতা</strong>
                <span>
                  {selectedOrder.customer}
                  {selectedOrder.email ? ` · ${selectedOrder.email}` : ""}
                </span>
              </p>
              <p>
                <strong>পেমেন্ট</strong>
                <span>
                  {selectedOrder.paymentStatus} · {selectedOrder.paymentMethod}
                </span>
              </p>
              <p>
                <strong>ডেলিভারির ঠিকানা</strong>
                <span>
                  {[
                    selectedOrder.shippingAddress.name,
                    selectedOrder.shippingAddress.phone,
                    selectedOrder.shippingAddress.addressLine1,
                    selectedOrder.shippingAddress.city,
                    selectedOrder.shippingAddress.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "ডেলিভারির ঠিকানা সংরক্ষিত নেই"}
                </span>
              </p>
              <p>
                <strong>অর্ডার পূরণ</strong>
                <span>{selectedOrder.orderStatus.replace("-", " ")}</span>
              </p>
              <p>
                <strong>ট্র্যাকিং</strong>
                <span>
                  {[
                    selectedOrder.tracking.carrier,
                    selectedOrder.tracking.trackingNumber,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "ট্র্যাকিং যোগ করা হয়নি"}
                  {selectedOrder.tracking.trackingUrl && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={selectedOrder.tracking.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        কুরিয়ারের পেজ খুলুন
                      </a>
                    </>
                  )}
                </span>
              </p>
              {selectedOrder.tracking.notes && (
                <p>
                  <strong>আপডেট</strong>
                  <span>{selectedOrder.tracking.notes}</span>
                </p>
              )}
              <h3>পণ্য</h3>
              <ul>
                {selectedOrder.items.map((item, index) => (
                  <li key={`${item.sku}-${index}`}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <strong>{money(item.total)}</strong>
                  </li>
                ))}
              </ul>
              <p className="order-detail-total">
                <strong>মোট</strong>
                <strong>{money(selectedOrder.total)}</strong>
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function InventoryPage({ data, adjustInventory, request }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const fields = [
    {
      name: "adjustment",
      label: "স্টক পরিবর্তন (+ যোগ, - বিয়োগ)",
      type: "number",
      required: true,
      step: "1",
    },
    { name: "note", label: "কারণ", type: "text", required: true },
  ];

  function applyAdjustment(values) {
    const amount = Number(values.adjustment);
    const updatedStock = Number(product.stock) + amount;
    if (!Number.isInteger(amount) || amount === 0 || updatedStock < 0) {
      setError(
        "শূন্য নয় এমন পূর্ণসংখ্যা দিন; স্টক শূন্যের নিচে নামানো যাবে না।",
      );
      return;
    }
    adjustInventory(product, amount, values.note);
    setError("");
    setProduct(null);
  }

  const columns = [
    {
      label: "পণ্য",
      key: "name",
      render: (row) => <span className="emphasis">{row.name}</span>,
    },
    { label: "এসকেইউ", key: "sku" },
    { label: "ক্যাটাগরি", key: "category" },
    {
      label: "উপলব্ধ",
      render: (row) => (
        <StatusBadge tone={Number(row.stock) < 10 ? "warning" : "success"}>
          {row.stock} units
        </StatusBadge>
      ),
    },
    {
      label: "কার্যক্রম",
      render: (row) => (
        <button
          className="button small secondary"
          onClick={() => {
            setError("");
            setProduct(row);
          }}
        >
          স্টক সমন্বয়
        </button>
      ),
    },
  ];

  return (
    <>
      <DataPage
        title="ইনভেন্টরি"
        description="স্টকের পরিমাণ দেখুন এবং প্রতিটি সমন্বয়ের রেকর্ড রাখুন।"
        rows={data.products}
        initialPagination={data.productsPagination}
        fetchPage={(page, query) => loadAdminProductPage(page, query, request)}
        columns={columns}
      />
      <section className="panel data-panel movement-panel">
        <div className="section-heading">
          <div>
            <h2>সাম্প্রতিক স্টক পরিবর্তন</h2>
            <p>স্টক সমন্বয় ডাটাবেজে সংরক্ষিত হয়েছে</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>তারিখ</th>
                <th>পণ্য</th>
                <th>এসকেইউ</th>
                <th>পরিবর্তন</th>
                <th>কারণ</th>
              </tr>
            </thead>
            <tbody>
              {data.inventory.slice(0, 10).map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.date}</td>
                  <td>{movement.product}</td>
                  <td>{movement.sku}</td>
                  <td className={movement.change > 0 ? "positive" : "negative"}>
                    {movement.change > 0 ? "+" : ""}
                    {movement.change}
                  </td>
                  <td>{movement.note}</td>
                </tr>
              ))}
              {data.inventory.length === 0 && (
                <tr>
                  <td className="empty-cell" colSpan="5">
                    স্টক পরিবর্তনের কোনো রেকর্ড নেই।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {product && (
        <FormDialog
          title={`Adjust stock · ${product.name}`}
          fields={fields}
          initial={{}}
          onClose={() => setProduct(null)}
          onSubmit={applyAdjustment}
        />
      )}
      {error && (
        <div className="toast error" role="alert">
          {error}
          <button
            className="icon-button"
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}

function ReviewsPage({ data, save, remove }) {
  return (
    <DataPage
      title="রিভিউ"
      description="স্টোরফ্রন্টে দেখানোর আগে ক্রেতার মতামত যাচাই করুন।"
      rows={data.reviews}
      onDelete={(review) => {
        if (window.confirm("এই রিভিউ মুছে ফেলবেন?")) remove("reviews", review);
      }}
      columns={[
        { label: "ক্রেতা", key: "customer" },
        { label: "পণ্য", key: "product" },
        {
          label: "রেটিং",
          render: (row) => (
            <span className="rating">
              {"★".repeat(Number(row.rating))}
              {"☆".repeat(5 - Number(row.rating))}
            </span>
          ),
        },
        { label: "রিভিউ", key: "comment" },
        {
          label: "Visibility",
          render: (row) => (
            <button
              className={`button small ${row.approved ? "secondary" : "primary"}`}
              onClick={() =>
                save("reviews", { ...row, approved: !row.approved })
              }
            >
              {row.approved ? "প্রকাশিত" : "অনুমোদন"}
            </button>
          ),
        },
      ]}
    />
  );
}

function AdminLogin({ busy, error, onSubmit }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="admin-login-wrap">
      <form className="admin-login" onSubmit={onSubmit}>
        <img
          className="brand-mark"
          src="/electrostore-mark.svg"
          alt="ElectroStore logo"
        />
        <p className="eyebrow">ইলেক্ট্রোস্টোর অ্যাডমিন</p>
        <h1>আপনার স্টোরে লগইন করুন।</h1>
        <p>API-তে কনফিগার করা অ্যাডমিন তথ্য ব্যবহার করুন।</p>
        <label>
          Email address
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <span className="password-input-wrap">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
            />
            <button
              className="password-visibility-toggle"
              type="button"
              aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "লগইন হচ্ছে..." : "লগইন"}
        </button>
      </form>
    </main>
  );
}


const editableStoreText = [
  ["storeName", "স্টোরের নাম"],
  ["announcement", "উপরের ঘোষণা"],
  ["navHome", "মেনু: হোম"],
  ["navShop", "মেনু: সব পণ্য"],
  ["navCategories", "মেনু: ক্যাটাগরি"],
  ["navAbout", "মেনু: আমাদের সম্পর্কে"],
  ["navContact", "মেনু: যোগাযোগ"],
  ["searchPlaceholder", "সার্চ বক্সের লেখা"],
  ["hero1Kicker", "হোম ব্যানার ১: ছোট শিরোনাম"],
  ["hero1Headline", "হোম ব্যানার ১: শিরোনাম"],
  ["hero1Emphasis", "হোম ব্যানার ১: হাইলাইট"],
  ["hero1Description", "হোম ব্যানার ১: বিবরণ"],
  ["hero1Button", "হোম ব্যানার ১: বোতাম"],
  ["hero2Kicker", "হোম ব্যানার ২: ছোট শিরোনাম"],
  ["hero2Headline", "হোম ব্যানার ২: শিরোনাম"],
  ["hero2Emphasis", "হোম ব্যানার ২: হাইলাইট"],
  ["hero2Description", "হোম ব্যানার ২: বিবরণ"],
  ["hero2Button", "হোম ব্যানার ২: বোতাম"],
  ["hero3Kicker", "হোম ব্যানার ৩: ছোট শিরোনাম"],
  ["hero3Headline", "হোম ব্যানার ৩: শিরোনাম"],
  ["hero3Emphasis", "হোম ব্যানার ৩: হাইলাইট"],
  ["hero3Description", "হোম ব্যানার ৩: বিবরণ"],
  ["hero3Button", "হোম ব্যানার ৩: বোতাম"],
  ["featuredTitle", "বাছাই করা পণ্যের শিরোনাম"],
  ["featuredDescription", "বাছাই করা পণ্যের বিবরণ"],
  ["newArrivalsTitle", "নতুন পণ্যের শিরোনাম"],
  ["newArrivalsDescription", "নতুন পণ্যের বিবরণ"],
  ["addToCart", "কার্টে যোগ করার লেখা"],
  ["viewDetails", "বিস্তারিত দেখার লেখা"],
  ["footerAbout", "ফুটার: পরিচিতি"],
  ["footerSupport", "ফুটার: সহায়তা বার্তা"],
  ["bdSectionEyebrow", "বাংলাদেশ তথ্য: ছোট শিরোনাম"],
  ["bdSectionTitle", "বাংলাদেশ তথ্য: প্রধান শিরোনাম"],
  ["bdSectionDescription", "বাংলাদেশ তথ্য: বিবরণ"],
  ["bdDeliveryTitle", "ডেলিভারি কার্ড: শিরোনাম"],
  ["bdDeliveryDescription", "ডেলিভারি কার্ড: বিবরণ"],
  ["bdPaymentTitle", "পেমেন্ট কার্ড: শিরোনাম"],
  ["bdPaymentDescription", "পেমেন্ট কার্ড: বিবরণ"],
  ["bdSupportTitle", "সাপোর্ট কার্ড: শিরোনাম"],
  ["bdSupportDescription", "সাপোর্ট কার্ড: বিবরণ"],
  ["checkoutEyebrow", "চেকআউট: ছোট শিরোনাম"],
  ["checkoutTitle", "চেকআউট: প্রধান শিরোনাম"],
  ["checkoutDescription", "চেকআউট: বিবরণ"],
  ["checkoutDeliveryHeading", "চেকআউট: ডেলিভারি তথ্যের শিরোনাম"],
  ["checkoutNameLabel", "চেকআউট: নামের ফিল্ড লেবেল"],
  ["checkoutNamePlaceholder", "চেকআউট: নামের প্লেসহোল্ডার"],
  ["checkoutPhoneLabel", "চেকআউট: মোবাইল ফিল্ড লেবেল"],
  ["checkoutPhoneTitle", "চেকআউট: মোবাইল নম্বরের সহায়ক লেখা"],
  ["checkoutCityLabel", "চেকআউট: শহর / জেলার লেবেল"],
  ["checkoutCityPlaceholder", "চেকআউট: শহর / জেলার প্লেসহোল্ডার"],
  ["checkoutPostalLabel", "চেকআউট: পোস্ট কোডের লেবেল"],
  ["checkoutAddressLabel", "চেকআউট: ঠিকানার লেবেল"],
  ["checkoutAddressPlaceholder", "চেকআউট: ঠিকানার প্লেসহোল্ডার"],
  ["checkoutCouponLabel", "চেকআউট: কুপন ফিল্ড লেবেল"],
  ["checkoutCouponPlaceholder", "চেকআউট: কুপন প্লেসহোল্ডার"],
  ["checkoutPayButton", "চেকআউট: পেমেন্ট বোতাম"],
  ["checkoutOrderTitle", "চেকআউট: অর্ডার সারাংশের শিরোনাম"],
  ["checkoutSubtotalLabel", "চেকআউট: উপমোটের লেবেল"],
  ["checkoutDisclaimer", "চেকআউট: পেমেন্টের আগের তথ্য"],
];

function StoreContentPage({ request, setNotice }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    request("/site-content")
      .then((content) => {
        if (active) setValues(content || {});
      })
      .catch((error) => setNotice({ message: `কনটেন্ট লোড হয়নি: ${error.message}`, type: "error" }))
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [request, setNotice]);
  async function saveContent(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const saved = await request("/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: values }),
      });
      setValues(saved || values);
      setNotice({ message: "ওয়েবসাইটের লেখা সফলভাবে সংরক্ষণ হয়েছে।", type: "success" });
    } catch (error) {
      setNotice({ message: `সংরক্ষণ করা যায়নি: ${error.message}`, type: "error" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <h1>ওয়েবসাইটের লেখা</h1>
          <p>ডিজাইন বা ফাংশন পরিবর্তন না করে স্টোরফ্রন্টের প্রধান লেখা বাংলায় সম্পাদনা করুন।</p>
        </div>
      </div>
      <form className="panel" onSubmit={saveContent}>
        <div className="section-heading">
          <div><h2>স্টোরফ্রন্ট কনটেন্ট</h2><p>এখানে পরিবর্তন করলে সংরক্ষিত লেখা হোমপেজে দেখানো হবে।</p></div>
          <button className="button primary" type="submit" disabled={busy || !loaded}>{busy ? "সংরক্ষণ হচ্ছে…" : "সব লেখা সংরক্ষণ করুন"}</button>
        </div>
        <div className="content-editor-grid">
          {editableStoreText.map(([key, label]) => (
            <label className="content-editor-field" key={key}>
              <span>{label}</span>
              {key.toLowerCase().includes("description") || key === "announcement" || key.startsWith("footer") || key.endsWith("Description") || key === "checkoutDisclaimer" || key === "checkoutPhoneTitle"
                ? <textarea rows={3} value={values[key] || ""} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} maxLength={5000} />
                : <input value={values[key] || ""} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} maxLength={5000} />}
            </label>
          ))}
        </div>
        <div className="section-heading">
          <p>পরামর্শ: প্রিমিয়াম লুক বজায় রাখতে শিরোনাম সংক্ষিপ্ত রাখুন এবং বিবরণ সহজ বাংলায় লিখুন।</p>
          <button className="button primary" type="submit" disabled={busy || !loaded}>{busy ? "সংরক্ষণ হচ্ছে…" : "পরিবর্তন সংরক্ষণ করুন"}</button>
        </div>
      </form>
    </section>
  );
}

function App() {
  const [admin, setAdmin] = useState(null);
  const accessTokenRef = useRef("");
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const refreshInFlight = useRef(null);
  const request = useCallback(async (path, options = {}) => {
    try {
      return await requestApi(path, accessTokenRef.current, options);
    } catch (error) {
      if (error.status !== 401) throw error;
      try {
        if (!refreshInFlight.current) {
          refreshInFlight.current = refreshAdminSession().finally(() => {
            refreshInFlight.current = null;
          });
        }
        const session = await refreshInFlight.current;
        if (session.user?.role !== "admin")
          throw new Error("এই অ্যাকাউন্টের অ্যাডমিন ব্যবহারের অনুমতি নেই।");
        accessTokenRef.current = session.accessToken;
        setAdmin(session.user);
        return await requestApi(path, session.accessToken, options);
      } catch (refreshError) {
        if (
          refreshError.status === 401 ||
          refreshError.message.includes("administrator access")
        ) {
          accessTokenRef.current = "";
          setAdmin(null);
        }
        throw refreshError;
      }
    }
  }, []);
  const {
    data,
    save,
    remove,
    adjustInventory,
    notice,
    setNotice,
    ready,
    loading,
    loadError,
    reload,
  } = useAdminData(request, Boolean(admin));

  useEffect(() => {
    let active = true;
    refreshAdminSession()
      .then((session) => {
        if (session.user?.role !== "admin") {
          setAuthError("এই অ্যাকাউন্টের অ্যাডমিন ব্যবহারের অনুমতি নেই।");
          return;
        }
        if (!active) return;
        accessTokenRef.current = session.accessToken;
        setAdmin(session.user);
        setAuthError("");
      })
      .catch((error) => {
        if (active && error.status !== 401)
          setAuthError(
            `Could not connect to the admin service: ${error.message}`,
          );
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function signIn(event) {
    event.preventDefault();
    setAuthError("");
    setLoginBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const session = await requestApi("/auth/login", "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      if (session.user?.role !== "admin") {
        await requestApi("/auth/logout", session.accessToken, {
          method: "POST",
        });
        throw new Error("এই অ্যাকাউন্টের অ্যাডমিন ব্যবহারের অনুমতি নেই।");
      }
      accessTokenRef.current = session.accessToken;
      setAdmin(session.user);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoginBusy(false);
    }
  }

  async function signOut() {
    try {
      await request("/auth/logout", { method: "POST" });
      accessTokenRef.current = "";
      setAdmin(null);
      setAuthError("");
    } catch (error) {
      setNotice({
        message: `Could not sign out: ${error.message}`,
        type: "error",
      });
    }
  }

  if (!authReady)
    return (
      <main className="admin-loading" role="status">
        অ্যাডমিন সেবার সঙ্গে সংযোগ হচ্ছে...
      </main>
    );
  if (!admin)
    return <AdminLogin busy={loginBusy} error={authError} onSubmit={signIn} />;

  return (
    <div className="admin-shell">
      <button
        className="mobile-menu icon-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "নেভিগেশন বন্ধ করুন" : "নেভিগেশন খুলুন"}
      >
        {sidebarOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      {sidebarOpen && (
        <button
          className="sidebar-scrim"
          aria-label="নেভিগেশন বন্ধ করুন"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <NavLink
          className="brand"
          to="/admin"
          onClick={() => setSidebarOpen(false)}
        >
          <img className="brand-mark" src="/electrostore-mark.svg" alt="" />
          <span>
            Electro<span className="brand-light">স্টোর</span>
            <small>অ্যাডমিন প্যানেল</small>
          </span>
        </NavLink>
        <p className="nav-caption">কাজের ক্ষেত্র</p>
        <nav>
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Reviews" &&
                data.reviews.filter((review) => !review.approved).length >
                  0 && (
                  <span className="nav-count">
                    {data.reviews.filter((review) => !review.approved).length}
                  </span>
                )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className={`online-dot${loadError ? " offline" : ""}`} />
          {loadError
            ? "তথ্য পাওয়া যাচ্ছে না"
            : loading
              ? "তথ্য সিঙ্ক হচ্ছে"
              : "API-তে সংযুক্ত"}{" "}
          <span className="demo-label">এপিআই</span>
        </div>
      </aside>
      <div className="content">
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span className="topbar-label">ইলেক্ট্রোস্টোর</span>
            <span className="topbar-divider">/</span>
            <span>Admin</span>
          </div>
          <div className="admin-account">
            <span className="admin-avatar" aria-hidden="true">
              {(admin.name || admin.email || "A")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </span>
            <span className="admin-account-details">
              <strong>{admin.name || "স্টোর অ্যাডমিন"}</strong>
              <small className="admin-role">অ্যাডমিন অ্যাকাউন্ট</small>
              <a className="admin-email" href={`mailto:${admin.email}`}>
                <Mail size={13} aria-hidden="true" />
                <span>{admin.email}</span>
              </a>
            </span>
            <button
              className="button small secondary sign-out-button"
              onClick={signOut}
            >
              <LogOut size={15} />
              <span>লগআউট</span>
            </button>
          </div>
        </header>
        {notice && (
          <div
            className={`notice ${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            <span>{notice.message}</span>
            {loadError && (
              <button className="notice-retry" onClick={reload}>
                আবার চেষ্টা করুন
              </button>
            )}
            <button onClick={() => setNotice(null)} aria-label="নোটিশ বন্ধ করুন">
              <X size={15} />
            </button>
          </div>
        )}
        {loading && (
          <div className="notice info" role="status">
            স্টোরের তথ্য রিফ্রেশ হচ্ছে...
          </div>
        )}
        {ready && (
          <Routes>
            <Route path="/admin" element={<Dashboard data={data} />} />
            <Route path="/admin/site-content" element={<StoreContentPage request={request} setNotice={setNotice} />} />
            <Route
              path="/admin/products"
              element={
                <DataPage
                  title="পণ্য"
                  description="পণ্য, মূল্য ও প্রাপ্যতা পরিচালনা করুন।"
                  rows={data.products}
                  initialPagination={data.productsPagination}
                  fetchPage={(page, query) =>
                    loadAdminProductPage(page, query, request)
                  }
                  fields={[
                    { name: "name", label: "পণ্যের নাম", required: true },
                    { name: "sku", label: "এসকেইউ", required: true },
                    {
                      name: "categoryId",
                      label: "ক্যাটাগরি",
                      type: "select",
                      defaultValue: data.categories[0]?.id || "",
                      options: data.categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      })),
                    },
                    {
                      name: "brandId",
                      label: "Brand",
                      type: "select",
                      options: data.brands.map((brand) => ({
                        value: brand.id,
                        label: brand.name,
                      })),
                    },
                    {
                      name: "basePrice",
                      label: "দাম (৳)",
                      type: "number",
                      required: true,
                      min: "0",
                      step: "1",
                    },
                    {
                      name: "stock",
                      label: "স্টকের পরিমাণ",
                      type: "number",
                      required: true,
                      min: "0",
                      step: "1",
                    },
                    {
                      name: "image",
                      label: "পণ্যের ছবি",
                      type: "image",
                      wide: true,
                      placeholder: "https://... or /products/image.jpg",
                      helpText:
                        "হোস্ট করা ছবির URL বা লোকাল public path দিন। হেডফোনের ছবি: /products/headphones.jpg",
                    },
                    {
                      name: "description",
                      label: "সংক্ষিপ্ত বিবরণ",
                      type: "textarea",
                      wide: true,
                    },
                    {
                      name: "featured",
                      label: "স্টোরফ্রন্টে বিশেষভাবে দেখান",
                      type: "boolean",
                      defaultValue: false,
                    },
                    {
                      name: "isActive",
                      label: "প্রাপ্যতা",
                      type: "boolean",
                      defaultValue: true,
                      trueLabel: "সক্রিয়",
                      falseLabel: "নিষ্ক্রিয়",
                    },
                  ]}
                  columns={[
                    {
                      label: "পণ্য",
                      key: "name",
                      render: (row) => (
                        <span className="product-name-cell">
                          <span className="product-thumb">
                            <ImageIcon size={18} aria-hidden="true" />
                            {row.image && (
                              <img
                                src={row.image}
                                alt=""
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.hidden = true;
                                }}
                              />
                            )}
                          </span>
                          <span className="emphasis">{row.name}</span>
                        </span>
                      ),
                    },
                    { label: "এসকেইউ", key: "sku" },
                    { label: "Brand", key: "brand" },
                    { label: "ক্যাটাগরি", key: "category" },
                    { label: "Price", render: (row) => money(row.basePrice) },
                    {
                      label: "Stock",
                      render: (row) => (
                        <StatusBadge
                          tone={Number(row.stock) < 10 ? "warning" : "success"}
                        >
                          {row.stock} units
                        </StatusBadge>
                      ),
                    },
                    {
                      label: "অবস্থা",
                      render: (row) => (
                        <StatusBadge
                          tone={row.isActive ? "success" : "neutral"}
                        >
                          {row.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </StatusBadge>
                      ),
                    },
                  ]}
                  onSave={(record) => save("products", record)}
                  onDelete={(row) => {
                    if (
                      window.confirm(
                        `Remove ${row.name} from the storefront? It will remain in admin and can be restored.`,
                      )
                    )
                      remove("products", row);
                  }}
                  onRestore={(row) =>
                    save("products", { ...row, isActive: true })
                  }
                  emptyText="Your catalog is empty. Add a product to start building your store."
                />
              }
            />
            <Route
              path="/admin/orders"
              element={<OrdersPage data={data} save={save} request={request} />}
            />
            <Route
              path="/admin/customers"
              element={
                <DataPage
                  title="ক্রেতা"
                  description="View customer accounts and manage account access."
                  rows={data.customers}
                  initialPagination={data.customersPagination}
                  fetchPage={(page, query) =>
                    loadAdminCustomerPage(page, query, request)
                  }
                  columns={[
                    {
                      label: "ক্রেতা",
                      key: "name",
                      render: (row) => (
                        <span className="emphasis">{row.name}</span>
                      ),
                    },
                    { label: "Email", key: "email" },
                    { label: "Phone", key: "phone" },
                    { label: "অর্ডার", key: "orders" },
                    {
                      label: "অবস্থা",
                      render: (row) => (
                        <button
                          className={`button small ${row.isActive ? "secondary" : "primary"}`}
                          onClick={() =>
                            save("customers", {
                              ...row,
                              isActive: !row.isActive,
                            })
                          }
                        >
                          {row.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </button>
                      ),
                    },
                  ]}
                />
              }
            />
            <Route
              path="/admin/categories"
              element={
                <DataPage
                  title="ক্যাটাগরি"
                  description="Manage the categories shown in your storefront."
                  rows={data.categories}
                  fields={[
                    { name: "name", label: "Category name", required: true },
                    { name: "slug", label: "URL slug" },
                    { name: "image", label: "Image URL" },
                    {
                      name: "description",
                      label: "Description",
                      type: "textarea",
                      wide: true,
                    },
                    {
                      name: "isActive",
                      label: "প্রাপ্যতা",
                      type: "boolean",
                      defaultValue: true,
                      trueLabel: "সক্রিয়",
                      falseLabel: "নিষ্ক্রিয়",
                    },
                  ]}
                  columns={[
                    {
                      label: "ক্যাটাগরি",
                      key: "name",
                      render: (row) => (
                        <span className="emphasis">{row.name}</span>
                      ),
                    },
                    { label: "Slug", key: "slug" },
                    {
                      label: "অবস্থা",
                      render: (row) => (
                        <StatusBadge
                          tone={row.isActive ? "success" : "neutral"}
                        >
                          {row.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </StatusBadge>
                      ),
                    },
                  ]}
                  onSave={(record) => save("categories", record)}
                  onDelete={(row) => {
                    if (
                      window.confirm(
                        `Remove ${row.name} from the storefront? First reassign or deactivate all active products in this category.`,
                      )
                    )
                      remove("categories", row);
                  }}
                  onRestore={(row) =>
                    save("categories", { ...row, isActive: true })
                  }
                />
              }
            />
            <Route
              path="/admin/brands"
              element={
                <DataPage
                  title="ব্র্যান্ড"
                  description="Manage the brands shown in your catalog."
                  rows={data.brands}
                  fields={[
                    { name: "name", label: "Brand name", required: true },
                    { name: "slug", label: "URL slug" },
                    { name: "logo", label: "Logo URL" },
                    {
                      name: "description",
                      label: "Description",
                      type: "textarea",
                      wide: true,
                    },
                    {
                      name: "isActive",
                      label: "প্রাপ্যতা",
                      type: "boolean",
                      defaultValue: true,
                      trueLabel: "সক্রিয়",
                      falseLabel: "নিষ্ক্রিয়",
                    },
                  ]}
                  columns={[
                    {
                      label: "Brand",
                      key: "name",
                      render: (row) => (
                        <span className="emphasis">{row.name}</span>
                      ),
                    },
                    { label: "Slug", key: "slug" },
                    {
                      label: "অবস্থা",
                      render: (row) => (
                        <StatusBadge
                          tone={row.isActive ? "success" : "neutral"}
                        >
                          {row.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </StatusBadge>
                      ),
                    },
                  ]}
                  onSave={(record) => save("brands", record)}
                  onDelete={(row) => {
                    if (window.confirm(`Deactivate ${row.name}?`))
                      remove("brands", row);
                  }}
                />
              }
            />
            <Route
              path="/admin/banners"
              element={
                <DataPage
                  title="ব্যানার"
                  description="Add and manage promotional images for your storefront."
                  rows={data.banners}
                  fields={[
                    { name: "title", label: "Banner title", required: true },
                    {
                      name: "image",
                      label: "Banner image URL",
                      type: "image",
                      required: true,
                      wide: true,
                      placeholder: "https://...",
                      helpText:
                        "Paste a public image URL to preview it before saving.",
                    },
                    {
                      name: "link",
                      label: "Click-through link",
                      placeholder: "/shop or https://...",
                    },
                    {
                      name: "position",
                      label: "Placement",
                      type: "select",
                      defaultValue: "hero",
                      options: [
                        { value: "hero", label: "Large image — left" },
                        {
                          value: "promotion",
                          label: "Small image — right, top",
                        },
                        {
                          value: "service",
                          label: "Small image — right, bottom",
                        },
                      ],
                    },
                    { name: "startsAt", label: "Start date", type: "date" },
                    { name: "endsAt", label: "End date", type: "date" },
                    {
                      name: "isActive",
                      label: "অবস্থা",
                      type: "boolean",
                      defaultValue: true,
                      trueLabel: "সক্রিয়",
                      falseLabel: "নিষ্ক্রিয়",
                    },
                  ]}
                  columns={[
                    {
                      label: "Banner",
                      key: "title",
                      render: (row) => (
                        <span className="product-name-cell">
                          <span className="product-thumb">
                            <ImageIcon size={18} aria-hidden="true" />
                            {row.image && (
                              <img
                                src={row.image}
                                alt=""
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.hidden = true;
                                }}
                              />
                            )}
                          </span>
                          <span className="emphasis">{row.title}</span>
                        </span>
                      ),
                    },
                    {
                      label: "Placement",
                      key: "position",
                      render: (row) =>
                        ({
                          hero: "Large image — left",
                          promotion: "Small image — right, top",
                          service: "Small image — right, bottom",
                        })[row.position] || row.position,
                    },
                    {
                      label: "অবস্থা",
                      render: (row) => (
                        <StatusBadge
                          tone={row.isActive ? "success" : "neutral"}
                        >
                          {row.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </StatusBadge>
                      ),
                    },
                  ]}
                  onSave={(record) => save("banners", record)}
                  onDelete={(row) => {
                    if (window.confirm(`Delete banner ${row.title}?`))
                      remove("banners", row);
                  }}
                />
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <InventoryPage
                  data={data}
                  adjustInventory={adjustInventory}
                  request={request}
                />
              }
            />
            <Route
              path="/admin/reviews"
              element={<ReviewsPage data={data} save={save} remove={remove} />}
            />
            <Route
              path="/admin/coupons"
              element={
                <DataPage
                  title="কুপন"
                  description="Create and manage discount codes for your customers."
                  rows={data.coupons}
                  fields={[
                    { name: "code", label: "Coupon code", required: true },
                    {
                      name: "discountType",
                      label: "Discount type",
                      type: "select",
                      defaultValue: "percentage",
                      options: [
                        { value: "percentage", label: "Percentage (%)" },
                        { value: "fixed", label: "Fixed amount (৳)" },
                      ],
                    },
                    {
                      name: "discountValue",
                      label: "Discount value",
                      type: "number",
                      required: true,
                      min: "0",
                      step: "1",
                    },
                    {
                      name: "minOrderValue",
                      label: "Minimum order value (৳)",
                      type: "number",
                      min: "0",
                      step: "1",
                      defaultValue: 0,
                    },
                    {
                      name: "maxDiscount",
                      label: "Maximum discount (৳)",
                      type: "number",
                      min: "0",
                      step: "1",
                    },
                    { name: "startsAt", label: "Start date", type: "date" },
                    {
                      name: "endsAt",
                      label: "Expiry date",
                      type: "date",
                      required: true,
                    },
                    {
                      name: "usageLimit",
                      label: "Total uses (0 = unlimited)",
                      type: "number",
                      min: "0",
                      step: "1",
                    },
                    {
                      name: "perUserLimit",
                      label: "Uses per customer (0 = unlimited)",
                      type: "number",
                      min: "0",
                      step: "1",
                    },
                    {
                      name: "isActive",
                      label: "অবস্থা",
                      type: "boolean",
                      defaultValue: true,
                      trueLabel: "সক্রিয়",
                      falseLabel: "নিষ্ক্রিয়",
                    },
                  ]}
                  columns={[
                    {
                      label: "Code",
                      key: "code",
                      render: (row) => (
                        <span className="emphasis coupon-code">{row.code}</span>
                      ),
                    },
                    {
                      label: "Discount",
                      render: (row) =>
                        row.discountType === "percentage"
                          ? `${row.discountValue}%`
                          : money(row.discountValue),
                    },
                    { label: "Expires", key: "endsAt" },
                    {
                      label: "অবস্থা",
                      render: (row) => (
                        <StatusBadge
                          tone={row.isActive ? "success" : "neutral"}
                        >
                          {row.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </StatusBadge>
                      ),
                    },
                  ]}
                  onSave={(record) =>
                    save("coupons", {
                      ...record,
                      code: record.code.toUpperCase(),
                    })
                  }
                  onDelete={(row) => {
                    if (window.confirm(`Delete coupon ${row.code}?`))
                      remove("coupons", row);
                  }}
                />
              }
            />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        )}
        <footer className="page-footer">
          ElectroStore Admin <span>·</span>{" "}
          {loading
            ? "Syncing store data"
            : loadError
              ? "Store data unavailable"
              : ready
                ? "Connected to the store database"
                : "Connecting to the store database"}
        </footer>
      </div>
    </div>
  );
}

export default App;
