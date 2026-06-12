CREATE TABLE IF NOT EXISTS "redeem_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"type" "purchase_type" NOT NULL,
	"series_id" text,
	"bundle_id" text,
	"stripe_payment_intent_id" text,
	"amount_cents" integer NOT NULL,
	"redeemed_by_user_id" text,
	"redeemed_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redeem_codes" ADD CONSTRAINT "redeem_codes_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redeem_codes" ADD CONSTRAINT "redeem_codes_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redeem_codes" ADD CONSTRAINT "redeem_codes_redeemed_by_user_id_users_id_fk" FOREIGN KEY ("redeemed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
