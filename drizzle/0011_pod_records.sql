CREATE TABLE "pod_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(50) NOT NULL,
	"trip_id" varchar(20) NOT NULL,
	"order_id" varchar(20),
	"receiver_name" varchar(100) NOT NULL,
	"confirmation" varchar(20) NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"damage_deduction" numeric(10, 2) DEFAULT '0',
	"photo_ref" text,
	"signature_png" text,
	"record" text NOT NULL,
	"record_hash" varchar(64) NOT NULL,
	"created_by" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_pod_records_tenant_trip" UNIQUE("tenant_id","trip_id")
);
--> statement-breakpoint
ALTER TABLE "gps_pings" ADD COLUMN "recorded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pod_records" ADD CONSTRAINT "pod_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_records" ADD CONSTRAINT "pod_records_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_records" ADD CONSTRAINT "pod_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pod_records_tenant_captured" ON "pod_records" USING btree ("tenant_id","captured_at");