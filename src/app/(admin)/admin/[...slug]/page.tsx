"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { notFound, usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Activity,
  Bell,
  Blocks,
  Ban,
  ChartLine,
  CheckCircle,
  ClipboardList,
  Clock,
  Medal,
  Network,
  Search,
  Settings,
  Trash2,
  Trophy,
  Users,
  WalletCards,
  ArrowLeft,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";

import { AnimatedNumber } from "@/components/common/animated-number";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Money } from "@/components/common/money";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { AdminUserAction, PoolBonusRequestStatus } from "@/types/enums";
import {
  useAdminAnalyticsQuery,
  useAdminAuditLogsQuery,
  useAdminBlockchainQuery,
  useAdminCycleBonusesQuery,
  useAdminDepositsQuery,
  useAdminNotificationsQuery,
  useAdminRanksQuery,
  useAdminReferralsQuery,
  useAdminSettingsQuery,
  useAdminTradeScheduleQuery,
  useAdminTradesQuery,
  useAdminUserDetailQuery,
  useAdminUsersQuery,
  useAdminWalletsQuery,
  useManageUserMutation,
  useAdminWithdrawalsQuery,
  useUpdateConfigMutation,
  useUpdateTradeScheduleMutation,
  useToggleContentCreatorMutation,
  type AdminListParams,
} from "@/lib/api/admin-api";
import { normalizeError } from "@/lib/api/errors";
import { formatCount, formatDateTime, humanizeEnum, truncateHex } from "@/lib/utils/format";
import { AdminWithdrawalActions } from "@/features/withdrawals/components/admin-withdrawal-actions";
import {
  useAdminPoolBonusRequestsQuery,
  useApprovePoolBonusRequestMutation,
  useUpdatePoolBonusRequestMutation,
  useRejectPoolBonusRequestMutation,
} from "@/features/poolBonus/api/poolBonus-api";
import {
  useAdminPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useAdminNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
  postImageUrl,
} from "@/features/content/api/content-api";
import {
  useAdminTicketsQuery,
  useAdminTicketQuery,
  useAdminReplyMutation,
  useCloseTicketMutation,
  useReopenTicketMutation,
} from "@/features/ticket/api/ticket-api";
import type { Paginated, UUID } from "@/types/api";
import type {
  AppNotification,
  AuditLog,
  BlockchainTransaction,
  CycleBonus,
  Deposit,
  NewsItem,
  PoolBonusRequest,
  Post,
  Ticket,
  TicketMessage,
  Rank,
  Referral,
  Setting,
  Trade,
  User,
  UserRef,
  Wallet,
  Withdrawal,
} from "@/types/models";

interface QueryResult<T> {
  data?: Paginated<T>;
  error?: Parameters<typeof normalizeError>[0];
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => unknown;
}

interface ListPageProps<T> {
  title: string;
  description: string;
  icon: typeof Users;
  columns: Array<DataTableColumn<T>>;
  useListQuery: (params: AdminListParams) => QueryResult<T>;
  getRowId: (row: T, index: number) => string;
  statusOptions?: string[];
  onRowClick?: (row: T) => void;
  clientSearch?: boolean;
}

function person(user: User | UserRef | null | undefined, fallback?: string) {
  if (!user) return fallback ?? "—";
  return user.name || user.email;
}

function identityCell(primary: ReactNode, secondary?: ReactNode) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium">{primary}</div>
      {secondary ? <div className="text-muted-foreground truncate text-xs">{secondary}</div> : null}
    </div>
  );
}

function mobileCard<T>(columns: Array<DataTableColumn<T>>, row: T, index: number) {
  return (
    <div className="space-y-3">
      {identityCell(columns[0]?.cell(row, index), columns[1]?.cell(row, index))}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {columns.slice(2, 6).map((column) => (
          <div key={column.id} className="min-w-0">
            <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              {column.header}
            </div>
            <div className="mt-1 truncate text-sm">{column.cell(row, index)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminListPage<T>({
  title,
  description,
  icon,
  columns,
  useListQuery,
  getRowId,
  statusOptions = [],
  onRowClick,
  clientSearch = false,
}: ListPageProps<T>) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const result = useListQuery({ page, limit, search, status });
  const error = normalizeError(result.error);

  const displayPage = useMemo(() => {
    if (!clientSearch || !search || !result.data) return result.data;
    const query = search.toLowerCase();
    const items = result.data.items.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(query)
    );
    return {
      ...result.data,
      items,
      page: 1,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / result.data.limit)),
    };
  }, [clientSearch, search, result.data]);

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: "Admin", href: ROUTES.admin.dashboard },
          { label: title },
        ]}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="pl-9"
            aria-label={`Search ${title.toLowerCase()}`}
          />
        </div>
        {statusOptions.length > 0 ? (
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {humanizeEnum(option)}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        page={displayPage}
        loading={result.isLoading}
        fetching={result.isFetching}
        error={error}
        onRetry={result.refetch}
        getRowId={getRowId}
        onRowClick={onRowClick}
        renderMobileCard={(row, index) => mobileCard(columns, row, index)}
        emptyState={{
          icon,
          title: `No ${title.toLowerCase()} found`,
          description: search || status ? "Try clearing or changing the filters." : undefined,
        }}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
      />
    </>
  );
}

function ContentCreatorToggle({ user }: { user: User & { isContentCreator?: boolean } }) {
  const [toggle, { isLoading }] = useToggleContentCreatorMutation();
  if (user.role === "ADMIN") return <span className="text-muted-foreground text-xs">Admin</span>;
  const isCreator = user.isContentCreator === true;
  return (
    <Button
      size="sm"
      variant={isCreator ? "default" : "outline"}
      disabled={isLoading}
      onClick={async () => {
        try {
          await toggle({ userId: user.id, isContentCreator: !isCreator }).unwrap();
          toast.success(isCreator ? "Content creator revoked." : "Content creator granted.");
        } catch (error) {
          toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
        }
      }}
    >
      {isCreator ? "Creator" : "Granted"}
    </Button>
  );
}

const usersColumns: Array<DataTableColumn<User>> = [
  { id: "user", header: "User", cell: (row) => identityCell(row.name || "Unnamed user", row.email) },
  { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  { id: "role", header: "Role", cell: (row) => humanizeEnum(row.role) },
  { id: "rank", header: "Rank", cell: (row) => <StatusBadge status={row.rank} showIcon={false} /> },
  { id: "creator", header: "Content", cell: (row) => <ContentCreatorToggle user={row} /> },
  { id: "country", header: "Country", cell: (row) => row.country || "—", hideBelow: "lg" },
  { id: "joined", header: "Joined", cell: (row) => formatDateTime(row.createdAt), nowrap: true },
  { id: "kyc", header: "KYC", cell: (row) => (row.govIdType ? <StatusBadge status="ACTIVE" showIcon={false} /> : <span className="text-muted-foreground text-xs">—</span>) },
];

const depositsColumns: Array<DataTableColumn<Deposit>> = [
  { id: "user", header: "User", cell: (row) => identityCell(person(row.user, row.userId), truncateHex(row.transactionHash)) },
  { id: "amount", header: "Amount", cell: (row) => <Money value={row.amount} showCurrency size="sm" />, nowrap: true },
  { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  { id: "network", header: "Network", cell: (row) => row.network },
  { id: "confirmations", header: "Confirmations", cell: (row) => `${row.confirmations}/${row.requiredConfirmations}`, align: "right" },
  { id: "created", header: "Created", cell: (row) => formatDateTime(row.createdAt), nowrap: true },
];

const withdrawalsColumns: Array<DataTableColumn<Withdrawal>> = [
  { id: "user", header: "User", cell: (row) => identityCell(person(row.user, row.userId), row.user?.email) },
  { id: "address", header: "Address", cell: (row) => <span className="font-mono text-xs">{truncateHex(row.destinationAddress)}</span>, nowrap: true },
  { id: "amount", header: "Net amount", cell: (row) => <Money value={row.netAmount} showCurrency size="sm" />, nowrap: true },
  { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  { id: "wallet", header: "Wallet", cell: (row) => humanizeEnum(row.walletType) },
  { id: "network", header: "Network", cell: (row) => row.network },
  { id: "created", header: "Created", cell: (row) => formatDateTime(row.createdAt), nowrap: true },
  { id: "actions", header: "Actions", cell: (row) => <AdminWithdrawalActions withdrawal={row} />, align: "right", width: "w-40" },
];

const tradesColumns: Array<DataTableColumn<Trade>> = [
  { id: "user", header: "User", cell: (row) => person(row.user, row.userId) },
  { id: "amount", header: "Trade amount", cell: (row) => <Money value={row.tradeAmount} showCurrency size="sm" />, nowrap: true },
  { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  { id: "type", header: "Type", cell: (row) => humanizeEnum(row.tradeType) },
  { id: "profit", header: "Profit", cell: (row) => <Money value={row.profit} variant="signed" showCurrency size="sm" />, nowrap: true },
  { id: "entry", header: "Entry", cell: (row) => formatDateTime(row.entryTime), nowrap: true },
];

const walletsColumns: Array<DataTableColumn<Wallet>> = [
  { id: "user", header: "User", cell: (row) => person(row.user, row.userId) },
  { id: "type", header: "Wallet", cell: (row) => humanizeEnum(row.type) },
  { id: "balance", header: "Balance", cell: (row) => <Money value={row.balance} showCurrency size="sm" />, nowrap: true },
  { id: "credit", header: "Total credit", cell: (row) => <Money value={row.totalCredit} showCurrency size="sm" />, nowrap: true },
  { id: "debit", header: "Total debit", cell: (row) => <Money value={row.totalDebit} showCurrency size="sm" />, nowrap: true },
  { id: "updated", header: "Updated", cell: (row) => formatDateTime(row.updatedAt), nowrap: true },
];

const referralsColumns: Array<DataTableColumn<Referral>> = [
  { id: "user", header: "User", cell: (row) => person(row.user, row.userId) },
  { id: "sponsor", header: "Sponsor", cell: (row) => person(row.sponsor, row.sponsorId || undefined) },
  { id: "level", header: "Level", cell: (row) => formatCount(row.level) },
  { id: "direct", header: "Direct", cell: (row) => formatCount(row.directReferralCount), align: "right" },
  { id: "team", header: "Team size", cell: (row) => formatCount(row.teamSize), align: "right" },
  { id: "bonus", header: "Bonus earned", cell: (row) => <Money value={row.totalBonusEarned} showCurrency size="sm" />, nowrap: true },
];

const ranksColumns: Array<DataTableColumn<Rank>> = [
  { id: "user", header: "User", cell: (row) => person(row.user, row.userId) },
  { id: "rank", header: "Rank", cell: (row) => <StatusBadge status={row.level} showIcon={false} /> },
  { id: "direct", header: "Direct referrals", cell: (row) => formatCount(row.directReferrals), align: "right" },
  { id: "team", header: "Team size", cell: (row) => formatCount(row.teamSize), align: "right" },
  { id: "bonus", header: "Rank bonus", cell: (row) => <Money value={row.totalRankBonusEarned} showCurrency size="sm" />, nowrap: true },
  { id: "achieved", header: "Achieved", cell: (row) => formatDateTime(row.achievedAt), nowrap: true },
];

const cycleColumns: Array<DataTableColumn<CycleBonus>> = [
  { id: "user", header: "User", cell: (row) => person(row.user, row.userId) },
  { id: "cycle", header: "Cycle", cell: (row) => `#${row.cycleNumber}` },
  { id: "rank", header: "Rank", cell: (row) => <StatusBadge status={row.rankLevel} showIcon={false} /> },
  { id: "amount", header: "Total", cell: (row) => <Money value={row.totalAmount} showCurrency size="sm" />, nowrap: true },
  { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  { id: "period", header: "Cycle end", cell: (row) => formatDateTime(row.cycleEndDate), nowrap: true },
];

const blockchainColumns: Array<DataTableColumn<BlockchainTransaction>> = [
  { id: "hash", header: "Transaction", cell: (row) => identityCell(truncateHex(row.transactionHash), row.network) },
  { id: "type", header: "Type", cell: (row) => humanizeEnum(row.type) },
  { id: "amount", header: "Amount", cell: (row) => <Money value={String(row.amount)} showCurrency size="sm" />, nowrap: true },
  { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  { id: "block", header: "Block", cell: (row) => row.blockNumber, align: "right" },
  { id: "created", header: "Created", cell: (row) => formatDateTime(row.createdAt), nowrap: true },
];

const notificationsColumns: Array<DataTableColumn<AppNotification>> = [
  { id: "notification", header: "Notification", cell: (row) => identityCell(row.title, row.message) },
  { id: "user", header: "Recipient", cell: (row) => person(row.user, row.userId) },
  { id: "type", header: "Type", cell: (row) => <StatusBadge status={row.type} showIcon={false} /> },
  { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.read ? "READ" : "UNREAD"} /> },
  { id: "created", header: "Created", cell: (row) => formatDateTime(row.createdAt), nowrap: true },
];

const auditColumns: Array<DataTableColumn<AuditLog>> = [
  { id: "action", header: "Action", cell: (row) => identityCell(humanizeEnum(row.action), person(row.admin, row.adminId || undefined)) },
  { id: "entity", header: "Entity", cell: (row) => humanizeEnum(row.entity) },
  { id: "entityId", header: "Entity ID", cell: (row) => truncateHex(row.entityId) },
  { id: "ip", header: "IP address", cell: (row) => row.ipAddress || "—" },
  { id: "metadata", header: "Changes", cell: (row) => row.newValue ? `${Object.keys(row.newValue).length} fields` : "—", align: "right" },
  { id: "created", header: "Created", cell: (row) => formatDateTime(row.createdAt), nowrap: true },
];

const settingsColumns: Array<DataTableColumn<Setting>> = [
  { id: "key", header: "Setting", cell: (row) => identityCell(row.key, row.description) },
  { id: "value", header: "Value", cell: (row) => <span className="font-mono text-xs">{row.value}</span> },
  { id: "category", header: "Category", cell: (row) => row.category || "General" },
  { id: "updater", header: "Updated by", cell: (row) => person(row.updater) },
  { id: "updated", header: "Updated", cell: (row) => formatDateTime(row.updatedAt), nowrap: true },
];

/**
 * Admin settings page.
 *
 * The deposit wallet address is the one setting users depend on directly —
 * it's the address shown on the deposit form — so it gets a dedicated editor
 * card at the top rather than being buried in the generic settings table.
 * Below it, the full settings list is still rendered read-only for audit.
 */
const DEPOSIT_WALLET_KEY = "DEPOSIT_WALLET_ADDRESS";

function DepositWalletCard() {
  const { data, isLoading } = useAdminSettingsQuery({ page: 1, limit: 100 });
  const [updateConfig, mutation] = useUpdateConfigMutation();
  const [address, setAddress] = useState("");
  const [touched, setTouched] = useState(false);

  const current = data?.items.find((item) => item.key === DEPOSIT_WALLET_KEY);

  // Seed the input once the list loads (or when the server value changes
  // externally). `touched` guards against clobbering the admin's in-progress
  // edit on a background refetch.
  useEffect(() => {
    if (!touched && current) setAddress(current.value);
  }, [current, touched]);

  const dirty = current ? address !== current.value : address.trim().length > 0;

  async function save() {
    const value = address.trim();
    if (!value) return toast.error("Wallet address cannot be empty.");
    try {
      await updateConfig({
        key: DEPOSIT_WALLET_KEY,
        value,
        description: "Wallet address users send USDT deposits to",
      }).unwrap();
      toast.success("Deposit wallet address updated.");
      setTouched(false);
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Deposit wallet address</CardTitle>
        <CardDescription>
          The USDT address shown to members on the deposit form. Updating this
          applies immediately to all new deposit submissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-wallet-address">Wallet address</Label>
            <Input
              id="deposit-wallet-address"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setTouched(true);
              }}
              placeholder={isLoading ? "Loading current address…" : "0x… / T…"}
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
            />
            {current ? (
              <p className="text-muted-foreground text-xs">
                Last updated {formatDateTime(current.updatedAt)}
                {current.updater ? ` by ${person(current.updater)}` : ""}.
              </p>
            ) : !isLoading ? (
              <p className="text-muted-foreground text-xs">
                No address set yet — falling back to the server default.
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={save} disabled={!dirty || mutation.isLoading}>
              {mutation.isLoading ? "Saving…" : "Save address"}
            </Button>
            {dirty && !mutation.isLoading ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAddress(current?.value ?? "");
                  setTouched(false);
                }}
              >
                Reset
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function TradeScheduleCard() {
  const { data, isLoading } = useAdminTradeScheduleQuery();
  const [update, mutation] = useUpdateTradeScheduleMutation();
  const [morning, setMorning] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!touched && data) {
      setMorning(data.morning.time);
    }
  }, [data, touched]);

  const dirty = data && morning !== data.morning.time;

  async function save() {
    if (!TIME_REGEX.test(morning)) {
      return toast.error("Time must be in 24-hour HH:MM format.");
    }
    try {
      await update({ morning }).unwrap();
      toast.success("Trade schedule updated. Cron jobs rescheduled.");
      setTouched(false);
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5" />
          Trade schedule
        </CardTitle>
        <CardDescription>
          Set the daily auto-trade execution time. The platform cron reschedules
          automatically when you save.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="trade-morning">Daily trade time</Label>
            <Input
              id="trade-morning"
              value={morning}
              onChange={(event) => {
                setMorning(event.target.value);
                setTouched(true);
              }}
              placeholder={isLoading ? "Loading…" : "09:00"}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            onClick={save}
            disabled={isLoading || mutation.isLoading}
          >
            {mutation.isLoading ? "Saving…" : "Save schedule"}
          </Button>
          {dirty && !mutation.isLoading ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (data) {
                  setMorning(data.morning.time);
                }
                setTouched(false);
              }}
            >
              Reset
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const result = useAdminSettingsQuery({ page, limit, search });
  const error = normalizeError(result.error);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage platform configuration. Review change history below."
        breadcrumbs={[
          { label: "Admin", href: ROUTES.admin.dashboard },
          { label: "Settings" },
        ]}
      />
      <DepositWalletCard />
      <TradeScheduleCard />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search settings…"
            className="pl-9"
            aria-label="Search settings"
          />
        </div>
      </div>
      <DataTable
        columns={settingsColumns}
        page={result.data}
        loading={result.isLoading}
        fetching={result.isFetching}
        error={error}
        onRetry={result.refetch}
        getRowId={(row) => row.id}
        renderMobileCard={(row, index) => mobileCard(settingsColumns, row, index)}
        emptyState={{
          icon: Settings,
          title: "No settings found",
          description: search ? "Try clearing or changing the filters." : undefined,
        }}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
      />
    </>
  );
}

function AnalyticsPage() {
  const { data, error, isLoading, refetch } = useAdminAnalyticsQuery();
  const normalizedError = normalizeError(error);
  const entries = Object.entries(data ?? {}).filter(
    ([key]) => key !== "statusDistributions",
  ) as Array<[string, number | string | null]>;
  const loadingEntries = Array.from({ length: 8 }, (_, index) => [`metric-${index}`, 0] as const);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Aggregate platform performance and financial metrics."
        breadcrumbs={[{ label: "Admin", href: ROUTES.admin.dashboard }, { label: "Analytics" }]}
      />
      {normalizedError ? <ErrorState error={normalizedError} onRetry={refetch} /> : !isLoading && entries.length === 0 ? (
        <EmptyState
          icon={ChartLine}
          title="No analytics available"
          description="The analytics endpoint returned no aggregate metrics."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(isLoading ? loadingEntries : entries).map(([key, value], index) => {
            const monetary = [
              "totalVolume",
              "totalWalletBalance",
              "totalTradeProfit",
              "totalTradeCommission",
            ].includes(key);
            return (
              <StatCard
                key={key}
                label={humanizeEnum(key.replace(/([a-z])([A-Z])/g, "$1_$2"))}
                value={monetary ? <Money value={value == null ? null : String(value)} compact showCurrency /> : <AnimatedNumber value={typeof value === "number" ? value : Number(value)} />}
                icon={ChartLine}
                accent={index % 3 === 0 ? "brand" : index % 3 === 1 ? "info" : "profit"}
                loading={isLoading}
                index={index}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Pool Bonus Requests — admin approval workflow                               */
/* -------------------------------------------------------------------------- */

function PoolBonusRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PoolBonusRequestStatus | "">("");
  const result = useAdminPoolBonusRequestsQuery({ page, limit: 20, status: status || undefined });
  const [approve, approveMutation] = useApprovePoolBonusRequestMutation();
  const [updateApprove, updateMutation] = useUpdatePoolBonusRequestMutation();
  const [reject, rejectMutation] = useRejectPoolBonusRequestMutation();
  const [editingId, setEditingId] = useState<PoolBonusRequest["id"] | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [rejectingId, setRejectingId] = useState<PoolBonusRequest["id"] | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove(id: PoolBonusRequest["id"]) {
    try {
      await approve({ id }).unwrap();
      toast.success("Request approved and processed.");
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  async function handleUpdateApprove(id: PoolBonusRequest["id"]) {
    if (!(Number(editAmount) > 0)) return toast.error("Enter a positive amount.");
    try {
      await updateApprove({ id, approvedAmount: Number(editAmount) }).unwrap();
      toast.success("Request amount updated and approved.");
      setEditingId(null);
      setEditAmount("");
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  async function handleReject(id: PoolBonusRequest["id"]) {
    if (!rejectReason.trim()) return toast.error("Rejection reason is required.");
    try {
      await reject({ id, rejectionReason: rejectReason }).unwrap();
      toast.success("Request rejected.");
      setRejectingId(null);
      setRejectReason("");
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  const columns: Array<DataTableColumn<PoolBonusRequest & { user?: UserRef | null }>> = [
    { id: "date", header: "Date", cell: (r) => formatDateTime(r.createdAt), nowrap: true },
    { id: "user", header: "User", cell: (r) => identityCell(r.user?.name || r.user?.email || r.userId) },
    { id: "type", header: "Type", cell: (r) => humanizeEnum(r.requestType) },
    { id: "requested", header: "Requested", cell: (r) => <Money value={r.requestedAmount} showCurrency />, nowrap: true },
    { id: "approved", header: "Approved", cell: (r) => r.approvedAmount ? <Money value={r.approvedAmount} showCurrency /> : "—", nowrap: true },
    { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      id: "actions",
      header: "Actions",
      cell: (r) => {
        if (r.status !== "PENDING") return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => handleApprove(r.id)} disabled={approveMutation.isLoading}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditingId(r.id); setEditAmount(String(r.requestedAmount)); }}>Update</Button>
            <Button size="sm" variant="destructive" onClick={() => { setRejectingId(r.id); setRejectReason(""); }}>Reject</Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader title="Pool Bonus Requests" description="Review and approve, reject, or update pool bonus transfer/withdrawal requests from users." />
      <div className="mb-4 flex items-center gap-3">
        <Label htmlFor="pool-status-filter" className="text-sm">Filter:</Label>
        <select id="pool-status-filter" className="border-input bg-background h-9 rounded-md border px-3 text-sm" value={status} onChange={(e) => { setStatus(e.target.value as PoolBonusRequestStatus | ""); setPage(1); }}>
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PROCESSED">Processed</option>
          <option value="REJECTED">Rejected</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
      <DataTable
        columns={columns}
        page={result.data}
        loading={result.isLoading}
        fetching={result.isFetching}
        error={normalizeError(result.error)}
        onRetry={result.refetch}
        getRowId={(r) => r.id}
        renderMobileCard={(r: PoolBonusRequest & { user?: UserRef | null }) => (
          <div className="space-y-2 p-4 text-sm">
            <div className="font-medium">{r.user?.name || r.user?.email || r.userId}</div>
            <div className="text-muted-foreground">{humanizeEnum(r.requestType)} · {formatDateTime(r.createdAt)}</div>
            <div>Requested: <Money value={r.requestedAmount} showCurrency /></div>
            <div>Approved: {r.approvedAmount ? <Money value={r.approvedAmount} showCurrency /> : "—"}</div>
            <div><StatusBadge status={r.status} /></div>
            {r.status === "PENDING" && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => handleApprove(r.id)} disabled={approveMutation.isLoading}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingId(r.id); setEditAmount(String(r.requestedAmount)); }}>Update</Button>
                <Button size="sm" variant="destructive" onClick={() => { setRejectingId(r.id); setRejectReason(""); }}>Reject</Button>
              </div>
            )}
          </div>
        )}
        onPageChange={setPage}
      />

      {/* Update amount modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Update amount & approve</CardTitle>
              <CardDescription>Enter the approved amount (must be ≤ requested amount).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Approved amount</Label>
                <Input id="edit-amount" type="number" min="0.00000001" step="any" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleUpdateApprove(editingId)} disabled={updateMutation.isLoading}>{updateMutation.isLoading ? "Processing…" : "Update & Approve"}</Button>
                <Button variant="ghost" onClick={() => { setEditingId(null); setEditAmount(""); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject request</CardTitle>
              <CardDescription>Provide a reason for rejecting this pool bonus request.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Rejection reason</Label>
                <Input id="reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g., Insufficient pool bonus balance" />
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => handleReject(rejectingId)} disabled={rejectMutation.isLoading}>{rejectMutation.isLoading ? "Processing…" : "Reject"}</Button>
                <Button variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Admin Posts — banner/slider management                                      */
/* -------------------------------------------------------------------------- */

function AdminPostsPage() {
  const { data, isLoading } = useAdminPostsQuery({ limit: 50 });
  const [create, createMut] = useCreatePostMutation();
  const [update, updateMut] = useUpdatePostMutation();
  const [del, deleteMut] = useDeletePostMutation();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Post["id"] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  function resetForm() {
    setTitle("");
    setDescription("");
    setImageFile(null);
    setIsActive(true);
    setEditId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return toast.error("Title and description are required.");
    if (!editId && !imageFile) return toast.error("Image is required for new posts.");
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("isActive", String(isActive));
      if (imageFile) formData.append("image", imageFile);
      if (editId) {
        await update({ id: editId, body: formData }).unwrap();
        toast.success("Post updated.");
      } else {
        await create(formData).unwrap();
        toast.success("Post created.");
      }
      resetForm();
    } catch (err) {
      toast.error(normalizeError(err as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  async function handleDelete(id: Post["id"]) {
    if (!confirm("Delete this post?")) return;
    try {
      await del(id).unwrap();
      toast.success("Post deleted.");
    } catch (err) {
      toast.error(normalizeError(err as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  function handleEdit(post: Post) {
    setEditId(post.id);
    setTitle(post.title);
    setDescription(post.description);
    setIsActive(post.isActive);
    setImageFile(null);
    setShowForm(true);
  }

  const posts = data?.items ?? [];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <PageHeader title="Posts" description="Manage dashboard slider banners with images." />
        <Button onClick={() => { resetForm(); setShowForm(true); }}>New Post</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editId ? "Edit post" : "Create post"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-title">Title</Label>
                <Input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-desc">Description</Label>
                <Input id="post-desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-image">{editId ? "New image (optional)" : "Image (required)"}</Label>
                <Input id="post-image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} required={!editId} />
              </div>
              <div className="flex items-center gap-2">
                <input id="post-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <Label htmlFor="post-active">Active (show on user dashboard)</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMut.isLoading || updateMut.isLoading}>
                  {createMut.isLoading || updateMut.isLoading ? "Saving…" : editId ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Create one to show on the user dashboard.</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <div className="relative aspect-video overflow-hidden rounded-t-xl">
                {post.imageUrl && (
                  <Image src={postImageUrl(post.imageUrl)} alt={post.title} fill className="object-cover" unoptimized />
                )}
                <div className="absolute top-2 right-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
                    {post.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{post.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)} disabled={deleteMut.isLoading}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Admin News — announcement ticker management                                 */
/* -------------------------------------------------------------------------- */

function AdminNewsPage() {
  const { data, isLoading } = useAdminNewsQuery({ limit: 50 });
  const [create, createMut] = useCreateNewsMutation();
  const [update, updateMut] = useUpdateNewsMutation();
  const [del, deleteMut] = useDeleteNewsMutation();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState<NewsItem["id"] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return toast.error("Title and message are required.");
    try {
      if (editId) {
        await update({ id: editId, title, message }).unwrap();
        toast.success("News updated.");
      } else {
        await create({ title, message }).unwrap();
        toast.success("News created.");
      }
      setTitle("");
      setMessage("");
      setEditId(null);
    } catch (err) {
      toast.error(normalizeError(err as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  async function handleDelete(id: NewsItem["id"]) {
    if (!confirm("Delete this news item?")) return;
    try {
      await del(id).unwrap();
      toast.success("News deleted.");
    } catch (err) {
      toast.error(normalizeError(err as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  function handleEdit(item: NewsItem) {
    setEditId(item.id);
    setTitle(item.title);
    setMessage(item.message);
  }

  async function toggleActive(item: NewsItem) {
    try {
      await update({ id: item.id, isActive: !item.isActive }).unwrap();
    } catch (err) {
      toast.error(normalizeError(err as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  const news = data?.items ?? [];

  return (
    <>
      <PageHeader title="News" description="Manage dashboard news ticker announcements." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editId ? "Edit news" : "Create news"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="news-title">Title</Label>
              <Input id="news-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Platform Update" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-message">Message</Label>
              <Input id="news-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g., 500 users joined today!" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMut.isLoading || updateMut.isLoading}>
                {createMut.isLoading || updateMut.isLoading ? "Saving…" : editId ? "Update" : "Create"}
              </Button>
              {editId && (
                <Button type="button" variant="ghost" onClick={() => { setEditId(null); setTitle(""); setMessage(""); }}>Cancel</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : news.length === 0 ? (
          <p className="text-muted-foreground">No news items yet.</p>
        ) : (
          news.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${item.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(item)}>
                    {item.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)} disabled={deleteMut.isLoading}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Admin Tickets — support ticket management                                   */
/* -------------------------------------------------------------------------- */

function AdminTicketsPage() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useAdminTicketsQuery({ page, limit: 20 });

  if (selectedId) return <AdminTicketDetailPage ticketId={selectedId} onBack={() => setSelectedId(null)} />;

  const ticketColumns: DataTableColumn<Ticket>[] = [
    { id: "subject", header: "Subject", cell: (r) => <span className="font-medium">{r.subject}</span> },
    { id: "user", header: "User", cell: (r) => r.user?.email ?? "—" },
    { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { id: "priority", header: "Priority", cell: (r) => <StatusBadge status={r.priority} /> },
    { id: "date", header: "Created", cell: (r) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(r.createdAt)), nowrap: true },
    { id: "action", header: "", cell: (r) => <Button size="sm" variant="outline" onClick={() => setSelectedId(r.id)}>View</Button> },
  ];

  return <><PageHeader title="Support Tickets" description="Review user questions and reply to support tickets." />
    <DataTable columns={ticketColumns} page={data} loading={isLoading} getRowId={(r) => r.id} onPageChange={setPage} emptyState={{ title: "No tickets", description: "User tickets will appear here." }} />
  </>;
}

function AdminTicketDetailPage({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const { data: ticket, isLoading } = useAdminTicketQuery(ticketId as UUID);
  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [sendReply, replyMut] = useAdminReplyMutation();
  const [close, closeMut] = useCloseTicketMutation();
  const [reopen, reopenMut] = useReopenTicketMutation();

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    try {
      await sendReply({ id: ticketId as UUID, body: { message: reply, attachments: replyAttachments } }).unwrap();
      setReply("");
      setReplyAttachments([]);
      toast.success("Reply sent.");
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  async function handleClose() {
    try { await close(ticketId as UUID).unwrap(); toast.success("Ticket closed."); } catch (error) { toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message); }
  }

  async function handleReopen() {
    try { await reopen(ticketId as UUID).unwrap(); toast.success("Ticket reopened."); } catch (error) { toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message); }
  }

  if (isLoading || !ticket) return <><Button variant="ghost" onClick={onBack}>← Back</Button><p className="text-muted-foreground">Loading…</p></>;

  return <><div className="mb-4 flex items-center gap-2"><Button variant="ghost" onClick={onBack}>← Back</Button></div>
    <div className="mb-4 flex items-center justify-between">
      <PageHeader title={ticket.subject} description={`User: ${ticket.user?.email ?? "—"} · Status: ${ticket.status} · Priority: ${ticket.priority}`} />
      <div className="flex gap-2">
        {ticket.status !== "CLOSED" ? (
          <Button variant="destructive" onClick={handleClose} disabled={closeMut.isLoading}>Close</Button>
        ) : (
          <Button variant="outline" onClick={handleReopen} disabled={reopenMut.isLoading}>Reopen</Button>
        )}
      </div>
    </div>
    <div className="space-y-4">
      {(ticket.messages ?? []).map((msg: TicketMessage) => (
        <Card key={msg.id} className={msg.isAdmin ? "border-primary/40 bg-primary/5" : ""}>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-semibold text-sm">{msg.isAdmin ? "Admin" : msg.sender?.name ?? "User"}</span>
              <span className="text-muted-foreground text-xs">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(msg.createdAt))}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {msg.attachments.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Attachment ${idx + 1}`} className="h-24 w-24 rounded-lg border object-cover transition-opacity hover:opacity-80" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {ticket.status !== "CLOSED" && (
        <Card><CardHeader><CardTitle>Reply</CardTitle></CardHeader><CardContent><form onSubmit={handleReply} className="space-y-3">
          <textarea className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply…" required />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Attach photos (optional)</Label>
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setReplyAttachments((prev) => [...prev, ...files].slice(0, 5));
              }}
            />
            {replyAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {replyAttachments.map((file, idx) => (
                  <div key={idx} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(file)} alt={`Attachment ${idx + 1}`} className="h-16 w-16 rounded-md border object-cover" />
                    <button
                      type="button"
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs"
                      onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={replyMut.isLoading}>{replyMut.isLoading ? "Sending…" : "Send reply"}</Button>
        </form></CardContent></Card>
      )}
    </div>
  </>;
}

/**
 * Admin user detail page — shows the full user record including their
 * government ID photos (front + back) for KYC review.
 *
 * Reached via /admin/users/:id. The user list table doesn't yet have a
 * clickable row, so this page is reachable by URL for now. The KYC card
 * renders the two uploaded images via the same /uploads/* rewrite that
 * post images use.
 */
function AdminUserDetailPage({ userId }: { userId: UUID }) {
  const router = useRouter();
  const { data: user, error, isLoading, refetch } = useAdminUserDetailQuery(userId);
  const [manageUser, { isLoading: isManaging }] = useManageUserMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const normalizedError = normalizeError(error);

  const handleAction = async (action: AdminUserAction) => {
    try {
      await manageUser({ userId, action }).unwrap();
      toast.success(action === AdminUserAction.DELETE ? "User deleted." : `User ${action.toLowerCase()}ed.`);
      if (action === AdminUserAction.DELETE) {
        router.push(ROUTES.admin.users);
      }
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  };

  return (
    <>
      <PageHeader
        title="User detail"
        description="Review member account and government ID verification."
        breadcrumbs={[
          { label: "Admin", href: ROUTES.admin.dashboard },
          { label: "Users", href: ROUTES.admin.users },
          { label: user?.name || user?.email || "Detail" },
        ]}
      />

      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="size-4" />
          Back to users
        </Button>
      </div>

      {normalizedError ? (
        <ErrorState error={normalizedError} onRetry={refetch} />
      ) : isLoading || !user ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Account details */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Identity and membership details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Name" value={user.name || "—"} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Phone" value={user.phone || "—"} />
              <DetailRow label="Country" value={user.country || "—"} />
              <DetailRow label="Role" value={humanizeEnum(user.role)} />
              <DetailRow label="Rank" value={humanizeEnum(user.rank)} />
              <DetailRow label="Referral code" value={user.referralCode} />
              <DetailRow label="Wallet address" value={user.walletAddress || "—"} />
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground text-sm">Status</span>
                <StatusBadge status={user.status} />
              </div>
              <DetailRow label="Joined" value={formatDateTime(user.createdAt)} />
              <DetailRow label="Last login" value={user.lastLogin ? formatDateTime(user.lastLogin) : "—"} />
            </CardContent>
          </Card>

          {/* KYC verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="size-5 text-(--logo-gold-300)" />
                Government ID (KYC)
              </CardTitle>
              <CardDescription>
                Photos uploaded at signup. Click to open full size.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.govIdType || user.govIdFrontUrl || user.govIdBackUrl ? (
                <div className="space-y-4">
                  {user.govIdType ? (
                    <DetailRow label="ID type" value={humanizeEnum(user.govIdType)} />
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <KycImage label="Front side" url={user.govIdFrontUrl} />
                    <KycImage label="Back side" url={user.govIdBackUrl} />
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={IdCard}
                  title="No ID uploaded"
                  description="This user signed up before KYC was mandatory."
                />
              )}
            </CardContent>
          </Card>

          {/* Admin actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Admin actions</CardTitle>
              <CardDescription>Moderate or remove this account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {user.status === "ACTIVE" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isManaging}
                    onClick={() => handleAction(AdminUserAction.SUSPEND)}
                  >
                    <Ban className="size-4" />
                    Suspend / Block
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isManaging}
                    onClick={() => handleAction(AdminUserAction.ACTIVATE)}
                  >
                    <CheckCircle className="size-4" />
                    Activate
                  </Button>
                )}

                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isManaging}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete user?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently mark the account as deleted. The user will no longer be able to log in or trade. This action cannot be undone from the admin panel.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleAction(AdminUserAction.DELETE)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium text-right break-all">{value}</span>
    </div>
  );
}

function KycImage({ label, url }: { label: string; url?: string | null }) {
  if (!url) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <div className="bg-muted flex aspect-[4/3] items-center justify-center rounded-lg border">
          <span className="text-muted-foreground text-xs">Not provided</span>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`${label} of government ID`}
          className="aspect-[4/3] w-full rounded-lg border object-cover transition-opacity hover:opacity-80"
        />
      </a>
    </div>
  );
}

export default function AdminModulePage() {
  const pathname = usePathname();
  const router = useRouter();

  // Dynamic route: /admin/users/:id -> user detail page
  const userDetailMatch = pathname.match(/^\/admin\/users\/([^/]+)$/);
  if (userDetailMatch) {
    return <AdminUserDetailPage userId={userDetailMatch[1] as UUID} />;
  }

  switch (pathname) {
    case ROUTES.admin.analytics:
      return <AnalyticsPage />;
    case ROUTES.admin.users:
      return <AdminListPage title="Users" description="Review member accounts, access, rank, and activity." icon={Users} columns={usersColumns} useListQuery={useAdminUsersQuery} getRowId={(row) => row.id} statusOptions={["ACTIVE", "INACTIVE", "SUSPENDED"]} onRowClick={(row) => router.push(ROUTES.admin.user(row.id))} />;
    case ROUTES.admin.deposits:
      return <AdminListPage title="Deposits" description="Monitor submitted deposits and verification state." icon={Activity} columns={depositsColumns} useListQuery={useAdminDepositsQuery} getRowId={(row) => row.id} statusOptions={["PENDING", "VERIFIED", "APPROVED", "REJECTED", "FAILED"]} clientSearch />;
    case ROUTES.admin.withdrawals:
      return <AdminListPage title="Withdrawals" description="Monitor withdrawal requests and payout state." icon={Activity} columns={withdrawalsColumns} useListQuery={useAdminWithdrawalsQuery} getRowId={(row) => row.id} statusOptions={["PENDING", "PROCESSING", "COMPLETED", "REJECTED", "FAILED"]} clientSearch />;
    case ROUTES.admin.trading:
      return <AdminListPage title="Trading" description="Review platform trades, settlement, profit, and commission." icon={ChartLine} columns={tradesColumns} useListQuery={useAdminTradesQuery} getRowId={(row) => row.id} statusOptions={["PENDING", "ACTIVE", "COMPLETED", "FAILED", "CANCELLED"]} />;
    case ROUTES.admin.wallets:
      return <AdminListPage title="Wallets" description="Inspect member wallet balances and aggregate movement." icon={WalletCards} columns={walletsColumns} useListQuery={useAdminWalletsQuery} getRowId={(row) => row.id} />;
    case ROUTES.admin.referralReports:
      return <AdminListPage title="Referrals" description="Review sponsorship, team growth, deposits, and rewards." icon={Network} columns={referralsColumns} useListQuery={useAdminReferralsQuery} getRowId={(row) => row.id} />;
    case ROUTES.admin.rankReports:
      return <AdminListPage title="Ranks" description="Review achieved ranks, team qualification, and bonuses." icon={Trophy} columns={ranksColumns} useListQuery={useAdminRanksQuery} getRowId={(row) => row.id} />;
    case ROUTES.admin.cycleBonusReports:
      return <AdminListPage title="Cycle Bonus" description="Review cycle eligibility, periods, and credited rewards." icon={Medal} columns={cycleColumns} useListQuery={useAdminCycleBonusesQuery} getRowId={(row) => row.id} statusOptions={["PENDING", "CREDITED", "FAILED"]} />;
    case ROUTES.admin.poolBonusRequests:
      return <PoolBonusRequestsPage />;
    case ROUTES.admin.posts:
      return <AdminPostsPage />;
    case ROUTES.admin.news:
      return <AdminNewsPage />;
    case ROUTES.admin.tickets:
      return <AdminTicketsPage />;
    case ROUTES.admin.blockchain:
      return <AdminListPage title="Blockchain" description="Inspect on-chain deposits, withdrawals, and confirmations." icon={Blocks} columns={blockchainColumns} useListQuery={useAdminBlockchainQuery} getRowId={(row) => row.id} statusOptions={["PENDING", "CONFIRMED", "FAILED"]} />;
    case ROUTES.admin.notifications:
      return <AdminListPage title="Notifications" description="Review system and member notification delivery history." icon={Bell} columns={notificationsColumns} useListQuery={useAdminNotificationsQuery} getRowId={(row) => row.id} statusOptions={["READ", "UNREAD"]} />;
    case ROUTES.admin.auditLogs:
      return <AdminListPage title="Audit Logs" description="Trace administrative actions and affected records." icon={ClipboardList} columns={auditColumns} useListQuery={useAdminAuditLogsQuery} getRowId={(row) => row.id} />;
    case ROUTES.admin.settings:
      return <SettingsPage />;
    default:
      notFound();
  }
}
