"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Mail, Save, ShieldCheck, UserRound, Copy, Check, IdCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { ShareReferralButton } from "@/components/common/share-referral-button";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileQuery } from "@/features/auth/api/auth-api";
import { useFormSubmit } from "@/features/auth/hooks/use-form-submit";
import { useUpdateProfileMutation } from "@/features/users/api/users-api";
import { normalizeError } from "@/lib/api/errors";
import { formatDateTime, humanizeEnum } from "@/lib/utils/format";
import { ROUTES } from "@/config/routes";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  phone: z.union([z.literal(""), z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits.")]),
  country: z.union([z.literal(""), z.string().trim().min(2).max(100)]),
  walletAddress: z.union([
    z.literal(""),
    z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Enter a valid EVM wallet address."),
  ]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: profile, error, isLoading, refetch } = useProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: { name: "", phone: "", country: "", walletAddress: "" },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      country: profile.country ?? "",
      walletAddress: profile.walletAddress ?? "",
    });
  }, [form, profile]);

  const { submit, submitting, formError } = useFormSubmit({
    form,
    mutate: async (values) =>
      updateProfile({
        name: values.name,
        phone: values.phone || undefined,
        country: values.country || undefined,
        walletAddress: values.walletAddress || undefined,
      }).unwrap(),
    onSuccess: () => {
      toast.success("Profile updated");
    },
  });

  const normalizedError = normalizeError(error);

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}${ROUTES.referralLanding(profile?.referralCode ?? "")}`
      : "";

  const [copiedRef, setCopiedRef] = useState(false);

  const copyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedRef(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedRef(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal details and payout wallet."
        breadcrumbs={[{ label: "Account" }, { label: "Profile" }]}
      />

      {normalizedError ? (
        <ErrorState error={normalizedError} onRetry={refetch} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem_22rem]">
          <Card>
            <CardHeader>
              <CardTitle>Personal details</CardTitle>
              <CardDescription>Keep your contact and wallet information current.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
                    {formError ? <ErrorState error={formError} /> : null}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl><Input {...field} autoComplete="name" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl><Input {...field} type="tel" autoComplete="tel" placeholder="+1 555 000 0000" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl><Input {...field} autoComplete="country-name" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="walletAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>USDT wallet address</FormLabel>
                            <FormControl><Input {...field} className="font-mono" autoComplete="off" placeholder="0x…" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={submitting || !form.formState.isDirty}>
                      <Save className="size-4" />
                      {submitting ? "Saving…" : "Save changes"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Identity and membership details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading || !profile ? (
                Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)
              ) : (
                <>
                  <AccountRow icon={Mail} label="Email" value={profile.email} />
                  <AccountRow icon={UserRound} label="Referral code" value={profile.referralCode} />
                  <AccountRow icon={ShieldCheck} label="Role" value={humanizeEnum(profile.role)} />
                  <AccountRow icon={ShieldCheck} label="Rank" value={humanizeEnum(profile.rank)} />
                  <AccountRow icon={CalendarDays} label="Joined" value={formatDateTime(profile.createdAt)} />
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-muted-foreground text-sm">Status</span>
                    <StatusBadge status={profile.status} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-5 text-(--logo-gold-300)" />
                Your Referral Link
              </CardTitle>
              <CardDescription>
                Share this link to invite new members. They land on signup with your code pre-filled.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input
                value={referralLink}
                readOnly
                aria-label="Referral link"
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={copyReferral}
                  variant={copiedRef ? "secondary" : "default"}
                  className="flex-1"
                >
                  {copiedRef ? (
                    <>
                      <Check className="mr-2 size-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 size-4" />
                      Copy
                    </>
                  )}
                </Button>
                <ShareReferralButton referralLink={referralLink} />
              </div>
            </CardContent>
          </Card>

          {/* Government ID (KYC) — shows the photos uploaded at signup */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="size-5 text-(--logo-gold-300)" />
                Government ID
              </CardTitle>
              <CardDescription>
                Your uploaded ID photos for account verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !profile ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="aspect-4/3 w-full" />
                    <Skeleton className="aspect-4/3 w-full" />
                  </div>
                </div>
              ) : profile.govIdType || profile.govIdFrontUrl || profile.govIdBackUrl ? (
                <div className="space-y-4">
                  {profile.govIdType ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">ID type</span>
                      <span className="text-sm font-medium">{humanizeEnum(profile.govIdType)}</span>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-4">
                    <ProfileKycImage label="Front" url={profile.govIdFrontUrl} />
                    <ProfileKycImage label="Back" url={profile.govIdBackUrl} />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No government ID on file. This is optional for existing accounts.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function ProfileKycImage({ label, url }: { label: string; url?: string | null }) {
  if (!url) {
    return (
      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <div className="bg-muted flex aspect-4/3 items-center justify-center rounded-lg border">
          <span className="text-muted-foreground text-xs">Not provided</span>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`${label} of your government ID`}
          className="aspect-4/3 w-full rounded-lg border object-cover transition-opacity hover:opacity-80"
        />
      </a>
    </div>
  );
}

function AccountRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-muted grid size-9 shrink-0 place-items-center rounded-lg">
        <Icon className="text-muted-foreground size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate text-sm font-medium" title={value}>{value}</p>
      </div>
    </div>
  );
}
