CREATE TABLE "gst_options" (
	"tenant_id" varchar(50) NOT NULL,
	"financial_year" varchar(7) NOT NULL,
	"scheme" varchar(10) NOT NULL,
	"supplier_gstin" varchar(15),
	"updated_by" varchar(50),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "gst_options_tenant_id_financial_year_pk" PRIMARY KEY("tenant_id","financial_year")
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "gst_scheme" varchar(10);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "place_of_supply" varchar(2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cgst" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sgst" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "igst" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "gst_options" ADD CONSTRAINT "gst_options_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gst_options" ADD CONSTRAINT "gst_options_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;