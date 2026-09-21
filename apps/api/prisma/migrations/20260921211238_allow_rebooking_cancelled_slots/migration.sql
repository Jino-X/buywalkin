-- DropIndex
DROP INDEX "bookings_serviceId_startTime_key";

-- Partial unique index: only one CONFIRMED booking per (serviceId, startTime).
-- CANCELLED rows don't conflict, so a cancelled slot can be booked again.
CREATE UNIQUE INDEX "bookings_serviceId_startTime_confirmed_key"
ON "bookings"("serviceId", "startTime")
WHERE "status" = 'CONFIRMED';
