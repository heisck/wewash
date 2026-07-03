import { ScanClient } from "../scan-client";

export const metadata = {
  title: "Scan machine | WeWash",
};

export default async function ScanTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ScanClient token={token} />;
}
