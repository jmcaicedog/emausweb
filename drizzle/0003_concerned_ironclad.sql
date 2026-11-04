CREATE TABLE "event_registration_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"admin_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"companions" integer DEFAULT 0 NOT NULL,
	"amount_due" integer NOT NULL,
	"attendance_token" varchar(64) NOT NULL,
	"checked_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_registrations_attendance_token_unique" UNIQUE("attendance_token")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_special" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "price_per_person" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "registration_token" varchar(64);--> statement-breakpoint
ALTER TABLE "event_registration_payments" ADD CONSTRAINT "event_registration_payments_registration_id_event_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_payments" ADD CONSTRAINT "event_registration_payments_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_registration_payments_registration_idx" ON "event_registration_payments" USING btree ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_registrations_event_person_uq" ON "event_registrations" USING btree ("event_id","person_id");--> statement-breakpoint
CREATE INDEX "event_registrations_event_idx" ON "event_registrations" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_registration_token_unique" UNIQUE("registration_token");