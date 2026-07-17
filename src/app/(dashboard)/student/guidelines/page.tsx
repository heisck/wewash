"use client";

import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Droplet,
} from "lucide-react";
import { BlockyText, FONT3 } from "@/components/pixel/blocky-text";
import {
  PageTitle,
  PixelCard,
  SectionTitle,
  StatTile,
} from "@/components/pixel/pixel-ui";
import { useApi } from "@/lib/api/client";
import type {
  ContactConfig,
  MeResponse,
  StudentRotation,
} from "@/lib/types/client";

export default function GuidelinesPage() {
  const { data: contact } = useApi<ContactConfig>("/api/v1/public/contact");
  const { data: me } = useApi<MeResponse>("/api/v1/me");
  const { data: rotation } = useApi<StudentRotation>(
    me?.student ? "/api/v1/me/rotation" : null
  );

  const handoff =
    rotation?.myStartTime || contact?.rotationHandoffTime || "08:00";
  const roomLabel = rotation
    ? `Room ${rotation.myRoom.number}`
    : "your room";
  const machineLabel =
    rotation?.machine.code ||
    rotation?.machine.serialNumber ||
    "the shared machine";

  const careRules = [
    {
      text: "Never disconnect tap hoses while the machine is running",
      icon: AlertTriangle,
    },
    {
      text: "Lock the base wheels before starting any wash cycle",
      icon: ShieldCheck,
    },
    {
      text: `Room handoff is around ${handoff} on your wash day — leave the machine ready for the next room`,
      icon: Clock,
    },
    {
      text: "Use only recommended detergent amounts (see label on lid)",
      icon: Droplet,
    },
    {
      text: "Report unusual noise or leaks immediately via Report fault on the dashboard",
      icon: Wrench,
    },
  ];

  const transferSteps = [
    {
      step: 1,
      title: "Check schedule",
      desc: `Open Today — your next turn is shown on the countdown. Current handoff time: ${handoff}.`,
    },
    {
      step: 2,
      title: "Idle machine",
      desc: "Ensure no active wash cycle is running before moving the unit.",
    },
    {
      step: 3,
      title: "Unlock wheels",
      desc: "Disengage the wheel locks on the movable base.",
    },
    {
      step: 4,
      title: "Roll carefully",
      desc: `Move ${machineLabel} into ${roomLabel} without kinking hoses.`,
    },
    {
      step: 5,
      title: "Reconnect hoses",
      desc: "Attach water inlet and drain hoses securely before powering on.",
    },
    {
      step: 6,
      title: "Scan & confirm",
      desc: "Scan the machine QR in the app so admin knows it is with you.",
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      <PageTitle
        text="GUIDE"
        sub={`Appliance care · handoff ~${handoff} · scan to check in`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Your handoff time"
          value={handoff}
          sub="From your rotation / admin settings"
          icon={<Clock />}
        />
        <StatTile
          label="Your room"
          value={rotation ? rotation.myRoom.number : "—"}
          sub={rotation?.hall?.code ?? "Assigned by admin"}
          icon={<CheckCircle />}
        />
        <StatTile
          label="Machine"
          value={
            rotation?.machine.code ||
            rotation?.machine.serialNumber?.slice(0, 10) ||
            "—"
          }
          sub="Shared with your room"
          icon={<Wrench />}
        />
      </div>

      <div className="space-y-4">
        <SectionTitle text="SAFETY & CARE RULES" />
        <div className="space-y-3">
          {careRules.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <PixelCard
                key={i}
                className="flex items-center gap-4 p-4 shadow-pixel-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-teal-900/20 bg-teal-600/10 text-teal-700 dark:border-teal-100/20 dark:bg-teal-400/10 dark:text-teal-300">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-xs font-bold leading-relaxed text-teal-950 dark:text-teal-50">
                  {rule.text}
                </p>
                <span className="ml-auto hidden shrink-0 text-[9px] font-black uppercase tracking-widest text-teal-900/30 dark:text-teal-100/30 sm:block">
                  Rule {String(i + 1).padStart(2, "0")}
                </span>
              </PixelCard>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle text="ROOM TRANSFER PROCEDURE" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transferSteps.map((s) => (
            <PixelCard
              key={s.step}
              bolts
              className="group flex flex-col gap-3 p-5 transition-transform duration-150 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <BlockyText
                  text={String(s.step)}
                  font={FONT3}
                  className="fill-teal-600 transition-transform duration-150 group-hover:scale-110 dark:fill-teal-400"
                  style={{ height: "28px" }}
                />
                <div className="flex gap-1" aria-hidden="true">
                  {transferSteps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 ${
                        i < s.step
                          ? "bg-teal-600 dark:bg-teal-400"
                          : "bg-teal-900/15 dark:bg-teal-100/15"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-teal-950 dark:text-teal-50">
                {s.title}
              </p>
              <p className="text-[11px] font-semibold leading-relaxed text-teal-900/55 dark:text-teal-100/55">
                {s.desc}
              </p>
            </PixelCard>
          ))}
        </div>
      </div>

      {(contact?.whatsapp || contact?.phone || contact?.email) && (
        <PixelCard className="p-5">
          <SectionTitle text="NEED HELP?" />
          <p className="mt-2 text-[12px] font-semibold text-teal-900/60 dark:text-teal-100/60">
            Contact hall admin
            {contact.phone ? ` · ${contact.phone}` : ""}
            {contact.whatsapp ? ` · WhatsApp ${contact.whatsapp}` : ""}
            {contact.email ? ` · ${contact.email}` : ""}
          </p>
        </PixelCard>
      )}
    </div>
  );
}
