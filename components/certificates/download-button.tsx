"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
export function CertificateDownloadButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const response = await fetch(`/api/certificates/${id}/download`);
          if (!response.ok)
            throw new Error(
              (await response.json()).error || "No se pudo descargar",
            );
          const url = URL.createObjectURL(await response.blob());
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `certificado-${id}.pdf`;
          anchor.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo descargar el certificado",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <Download size={15} />
      {pending ? "Preparando PDF…" : "Descargar PDF"}
    </Button>
  );
}
