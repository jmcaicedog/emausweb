ALTER TABLE "site_settings" ADD COLUMN "gospel_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "gospel_channel_id" varchar(40) DEFAULT 'UCP9NtaODIi1Fr4mCZa1ahow' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "gospel_keyword" varchar(80) DEFAULT 'EVANGELIO DE HOY' NOT NULL;