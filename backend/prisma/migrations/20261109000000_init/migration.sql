-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "farm_status" AS ENUM ('active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "field_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "crop_cycle_status" AS ENUM ('planned', 'active', 'harvested', 'cancelled');

-- CreateEnum
CREATE TYPE "growth_stage" AS ENUM ('preparation', 'sowing', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvested');

-- CreateEnum
CREATE TYPE "crop_health_status" AS ENUM ('healthy', 'needs_attention', 'affected', 'unknown');

-- CreateEnum
CREATE TYPE "task_type" AS ENUM ('irrigation', 'fertilization', 'pesticide', 'weeding', 'planting', 'harvesting', 'inspection', 'other');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "expense_category" AS ENUM ('seeds', 'fertilizer', 'pesticide', 'labour', 'irrigation', 'equipment', 'transportation', 'maintenance', 'other');

-- CreateEnum
CREATE TYPE "weather_source" AS ENUM ('api', 'manual');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "status" "user_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "village" VARCHAR(120),
    "district" VARCHAR(120),
    "state" VARCHAR(120),
    "country" VARCHAR(120) DEFAULT 'India',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "total_area" DECIMAL(12,3) NOT NULL,
    "area_unit" VARCHAR(20) NOT NULL DEFAULT 'acre',
    "status" "farm_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "farm_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "area" DECIMAL(12,3) NOT NULL,
    "area_unit" VARCHAR(20) NOT NULL DEFAULT 'acre',
    "soil_type" VARCHAR(100),
    "irrigation_type" VARCHAR(100),
    "notes" TEXT,
    "status" "field_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_catalog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "category" VARCHAR(100),
    "typical_duration_days" INTEGER,
    "default_yield_per_acre" DECIMAL(12,3),
    "yield_unit" VARCHAR(30),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_cycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "field_id" UUID NOT NULL,
    "crop_id" UUID NOT NULL,
    "season" VARCHAR(80),
    "planting_date" DATE,
    "expected_harvest_date" DATE,
    "actual_harvest_date" DATE,
    "area_cultivated" DECIMAL(12,3) NOT NULL,
    "area_unit" VARCHAR(20) NOT NULL DEFAULT 'acre',
    "expected_yield" DECIMAL(14,3),
    "yield_unit" VARCHAR(30),
    "expected_selling_price_per_unit" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "growth_stage" "growth_stage" NOT NULL DEFAULT 'preparation',
    "health_status" "crop_health_status" NOT NULL DEFAULT 'unknown',
    "status" "crop_cycle_status" NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "farm_id" UUID NOT NULL,
    "field_id" UUID,
    "crop_cycle_id" UUID,
    "assigned_to" UUID,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "type" "task_type" NOT NULL DEFAULT 'other',
    "due_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "status" "task_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "farm_id" UUID NOT NULL,
    "field_id" UUID,
    "crop_cycle_id" UUID,
    "recorded_by" UUID NOT NULL,
    "category" "expense_category" NOT NULL DEFAULT 'other',
    "description" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "expense_date" DATE NOT NULL,
    "vendor" VARCHAR(160),
    "receipt_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "farm_id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "crop_cycle_id" UUID NOT NULL,
    "harvested_on" DATE NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "quantity_unit" VARCHAR(30) NOT NULL,
    "grade" VARCHAR(50),
    "selling_price_per_unit" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "buyer" VARCHAR(160),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harvests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "crop_id" UUID,
    "crop_name" VARCHAR(120) NOT NULL,
    "market_name" VARCHAR(160) NOT NULL,
    "district" VARCHAR(120),
    "state" VARCHAR(120),
    "price_date" DATE NOT NULL,
    "min_price" DECIMAL(14,2),
    "max_price" DECIMAL(14,2),
    "modal_price" DECIMAL(14,2),
    "price_unit" VARCHAR(40) NOT NULL DEFAULT 'INR/quintal',
    "source" VARCHAR(160),
    "source_record_id" VARCHAR(160),
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "farm_id" UUID NOT NULL,
    "observed_at" TIMESTAMPTZ(6),
    "forecast_for" TIMESTAMPTZ(6),
    "temperature_c" DECIMAL(6,2),
    "feels_like_c" DECIMAL(6,2),
    "humidity_percent" INTEGER,
    "rainfall_mm" DECIMAL(8,2),
    "wind_speed" DECIMAL(8,2),
    "condition" VARCHAR(120),
    "source" "weather_source" NOT NULL DEFAULT 'api',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "farms_owner_id_idx" ON "farms"("owner_id");

-- CreateIndex
CREATE INDEX "farms_owner_id_name_idx" ON "farms"("owner_id", "name");

-- CreateIndex
CREATE INDEX "fields_farm_id_idx" ON "fields"("farm_id");

-- CreateIndex
CREATE UNIQUE INDEX "fields_farm_id_name_key" ON "fields"("farm_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "crop_catalog_name_key" ON "crop_catalog"("name");

-- CreateIndex
CREATE INDEX "crop_cycles_field_id_idx" ON "crop_cycles"("field_id");

-- CreateIndex
CREATE INDEX "crop_cycles_crop_id_idx" ON "crop_cycles"("crop_id");

-- CreateIndex
CREATE INDEX "crop_cycles_field_id_status_idx" ON "crop_cycles"("field_id", "status");

-- CreateIndex
CREATE INDEX "crop_cycles_expected_harvest_date_idx" ON "crop_cycles"("expected_harvest_date");

-- CreateIndex
CREATE INDEX "tasks_farm_id_idx" ON "tasks"("farm_id");

-- CreateIndex
CREATE INDEX "tasks_farm_id_status_due_at_idx" ON "tasks"("farm_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "tasks_crop_cycle_id_idx" ON "tasks"("crop_cycle_id");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_idx" ON "tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "expenses_farm_id_idx" ON "expenses"("farm_id");

-- CreateIndex
CREATE INDEX "expenses_farm_id_expense_date_idx" ON "expenses"("farm_id", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_crop_cycle_id_idx" ON "expenses"("crop_cycle_id");

-- CreateIndex
CREATE INDEX "expenses_recorded_by_idx" ON "expenses"("recorded_by");

-- CreateIndex
CREATE INDEX "harvests_crop_cycle_id_idx" ON "harvests"("crop_cycle_id");

-- CreateIndex
CREATE INDEX "harvests_farm_id_harvested_on_idx" ON "harvests"("farm_id", "harvested_on");

-- CreateIndex
CREATE INDEX "market_prices_crop_name_market_name_price_date_idx" ON "market_prices"("crop_name", "market_name", "price_date");

-- CreateIndex
CREATE INDEX "market_prices_price_date_idx" ON "market_prices"("price_date");

-- CreateIndex
CREATE INDEX "weather_records_farm_id_idx" ON "weather_records"("farm_id");

-- CreateIndex
CREATE INDEX "weather_records_farm_id_forecast_for_idx" ON "weather_records"("farm_id", "forecast_for");

-- CreateIndex
CREATE INDEX "weather_records_farm_id_observed_at_idx" ON "weather_records"("farm_id", "observed_at");

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crop_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_crop_cycle_id_fkey" FOREIGN KEY ("crop_cycle_id") REFERENCES "crop_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_crop_cycle_id_fkey" FOREIGN KEY ("crop_cycle_id") REFERENCES "crop_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_crop_cycle_id_fkey" FOREIGN KEY ("crop_cycle_id") REFERENCES "crop_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crop_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

