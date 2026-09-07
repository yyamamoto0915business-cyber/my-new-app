-- レジのカードタッチ（Stripe Terminal / iPhone Tap to Pay）

ALTER TABLE public.pos_sales
  DROP CONSTRAINT IF EXISTS pos_sales_payment_method_check;

ALTER TABLE public.pos_sales
  ADD CONSTRAINT pos_sales_payment_method_check
  CHECK (payment_method IN ('cash', 'online', 'tap'));
