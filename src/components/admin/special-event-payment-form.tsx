import { ActionForm, FormField, SubmitButton } from "@/components/admin/form";
import { inputCls } from "@/components/admin/ui";
import { addSpecialEventPayment } from "@/lib/actions/special-events";

export function SpecialEventPaymentForm({ registrationId, balance }: { registrationId: number; balance: number }) {
  if (balance <= 0) return <p className="text-xs font-semibold text-green-700">Pago completo</p>;
  return (
    <ActionForm action={addSpecialEventPayment} resetOnOk>
      <input type="hidden" name="registrationId" value={registrationId} />
      <div className="flex items-end gap-2">
        <FormField name="amount" label="Registrar abono">
          <input id={`amount-${registrationId}`} name="amount" type="number" min="1" max={balance} step="1" required className={inputCls} />
        </FormField>
        <SubmitButton className="shrink-0 px-3">Guardar</SubmitButton>
      </div>
    </ActionForm>
  );
}
