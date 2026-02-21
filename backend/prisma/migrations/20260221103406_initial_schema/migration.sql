-- CreateTable
CREATE TABLE "Sensor" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moisture" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "ec" DOUBLE PRECISION,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScore" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "status" TEXT NOT NULL DEFAULT 'Healthy',
    "lowVariance" BOOLEAN NOT NULL DEFAULT false,
    "spikeDetected" BOOLEAN NOT NULL DEFAULT false,
    "zoneAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "lastEvaluated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_sensorId_key" ON "Sensor"("sensorId");

-- CreateIndex
CREATE INDEX "Sensor_zone_idx" ON "Sensor"("zone");

-- CreateIndex
CREATE INDEX "Reading_sensorId_timestamp_idx" ON "Reading"("sensorId", "timestamp");

-- CreateIndex
CREATE INDEX "TrustScore_sensorId_idx" ON "TrustScore"("sensorId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScore" ADD CONSTRAINT "TrustScore_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ═══════════════════════════════════════════════════════════════
--  MIGRATION: Upgrade schema to Trust Engine v2.0
--  Run this on your existing database to add all missing fields
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. Reading — add missing columns
-- ───────────────────────────────────────────────────────────────

ALTER TABLE "Reading"
  ADD COLUMN IF NOT EXISTS "ph"               DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "airTemp"          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "isRaining"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "irrigationActive" BOOLEAN NOT NULL DEFAULT false;


-- ───────────────────────────────────────────────────────────────
-- 2. TrustScore — add all new columns
-- ───────────────────────────────────────────────────────────────

-- Score: change default from 100 → 1.0 scale
ALTER TABLE "TrustScore"
  ALTER COLUMN "score" SET DEFAULT 1.0;

-- Label (human-readable trust band)
ALTER TABLE "TrustScore"
  ADD COLUMN IF NOT EXISTS "label"            TEXT NOT NULL DEFAULT 'Reliable';

-- Per-parameter trust scores
ALTER TABLE "TrustScore"
  ADD COLUMN IF NOT EXISTS "paramMoisture"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "paramTemperature" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "paramEc"          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "paramPh"          DOUBLE PRECISION;

-- Root cause classification (array of cause codes)
ALTER TABLE "TrustScore"
  ADD COLUMN IF NOT EXISTS "rootCauses"       TEXT[]  NOT NULL DEFAULT '{}';

-- Severity level
ALTER TABLE "TrustScore"
  ADD COLUMN IF NOT EXISTS "severity"         TEXT    NOT NULL DEFAULT 'None';

-- Human-readable diagnostic message
ALTER TABLE "TrustScore"
  ADD COLUMN IF NOT EXISTS "diagnostic"       TEXT;

-- Detailed flag messages (array)
ALTER TABLE "TrustScore"
  ADD COLUMN IF NOT EXISTS "flags"            TEXT[]  NOT NULL DEFAULT '{}';

-- Health trend tracking
ALTER TABLE "TrustScore"
  ADD COLUMN IF NOT EXISTS "healthTrend"      TEXT    NOT NULL DEFAULT 'stable',
  ADD COLUMN IF NOT EXISTS "healthSlope"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "anomalyRate"      DOUBLE PRECISION NOT NULL DEFAULT 0;


-- ───────────────────────────────────────────────────────────────
-- 3. New indexes for performance
-- ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "TrustScore_lastEvaluated_idx" ON "TrustScore"("lastEvaluated");
CREATE INDEX IF NOT EXISTS "TrustScore_status_idx"        ON "TrustScore"("status");
CREATE INDEX IF NOT EXISTS "Ticket_sensorId_idx"          ON "Ticket"("sensorId");
CREATE INDEX IF NOT EXISTS "Ticket_severity_idx"          ON "Ticket"("severity");


-- ───────────────────────────────────────────────────────────────
-- 4. Backfill existing TrustScore rows
--    Old scores were 0–100, convert to 0.0–1.0
-- ───────────────────────────────────────────────────────────────

UPDATE "TrustScore"
SET "score" = "score" / 100.0
WHERE "score" > 1.0;