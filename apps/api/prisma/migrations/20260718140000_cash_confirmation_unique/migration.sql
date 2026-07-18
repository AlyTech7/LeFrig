-- Ensure each party can confirm a cash agreement at most once.
CREATE UNIQUE INDEX "cash_confirmations_agreement_id_confirmed_by_id_key" ON "cash_confirmations"("agreement_id", "confirmed_by_id");
